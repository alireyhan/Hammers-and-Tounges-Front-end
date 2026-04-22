import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { getMyFavoriteAuctions } from '../store/actions/buyerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { getMediaUrl } from '../config/api.config';
import { toast } from 'react-toastify';
import LotRow from '../components/LotRow';
import BuyerEventLotsFilterBar from '../components/BuyerEventLotsFilterBar';
import GuestLotDrawer from '../components/GuestLotDrawer';
import './BuyerEventLots.css';
import './GuestEventLots.css';

const PAGE_SIZE = 12;

const getDisplayStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'CLOSING') return 'Closed';
  return status || '';
};

const getStatusModifier = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE' || s === 'ACTIVE') return '--live';
  if (s === 'CLOSING') return '--closing';
  if (s === 'CLOSED') return '--closed';
  return '--live';
};

const formatEventDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const resolveEventImage = (event, lots) => {
  const mediaFile = Array.isArray(event?.media)
    ? event.media.find((m) => m?.file)?.file
    : null;
  const direct =
    event?.image ||
    event?.event_image ||
    event?.cover_image ||
    event?.banner ||
    event?.thumbnail ||
    event?.logo ||
    mediaFile;
  if (direct) return getMediaUrl(direct);
  const lotImage = Array.isArray(lots)
    ? lots.find((lot) => Array.isArray(lot?.media) && lot.media.find((m) => m?.file))
    : null;
  return lotImage ? getMediaUrl(lotImage.media.find((m) => m?.file)?.file) : '';
};

const BuyerEventLots = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const eventFromState = location.state?.event;

  const [lots, setLots] = useState([]);
  const [eventTitle, setEventTitle] = useState(eventFromState?.title || 'Event Lots');
  const [eventStatus, setEventStatus] = useState(eventFromState?.status ?? 'LIVE');
  const [eventStartTime, setEventStartTime] = useState(eventFromState?.start_time || null);
  const [eventEndTime, setEventEndTime] = useState(eventFromState?.end_time || null);
  const [eventDetails, setEventDetails] = useState(eventFromState || null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedFilters, setSelectedFilters] = useState({});

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const fetchLots = useCallback(async (pageNum = 1) => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      let items = [];
      let total = 0;
      let lotsSucceeded = false;

      try {
        const res = await auctionService.getLots({
          event: eventId,
          page: pageNum,
          page_size: PAGE_SIZE,
        });
        lotsSucceeded = true;
        items = res.results || [];
        total = res.count ?? items.length;
      } catch (lotsErr) {
        console.warn('Lots endpoint failed, trying listings fallback:', lotsErr);
      }

      if (!lotsSucceeded) {
        try {
          const listingsRes = await auctionService.getAuctions({
            event: eventId,
            event_id: eventId,
            page: pageNum,
            page_size: PAGE_SIZE,
          });
          const rawItems = listingsRes.results || [];
          items = rawItems.map((l) => ({
            ...l,
            seller_name: l.seller_name ?? l.seller_details?.name ?? '—',
            category_name: l.category_name ?? l.category?.name ?? '—',
          }));
          total = listingsRes.count ?? rawItems.length;
        } catch (listingsErr) {
          throw listingsErr || new Error('Failed to load lots');
        }
      }

      setLots(items);
      setTotalCount(total);
      if (items[0]?.event_title && !eventFromState?.title) {
        setEventTitle(items[0].event_title);
      }
    } catch (err) {
      if (err) {
        console.error('Error fetching lots:', err);
        setError(err?.message || err?.response?.data?.detail || 'Failed to load lots');
        toast.error('Failed to load lots');
      }
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, eventFromState?.title]);

  useEffect(() => {
    fetchLots(page);
  }, [fetchLots, page]);

  // Fetch favorite IDs for heart state
  useEffect(() => {
    let cancelled = false;
    dispatch(getMyFavoriteAuctions({ page_size: 100 }))
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const items = res?.results ?? res ?? [];
        setFavoriteIds(new Set(items.map((x) => x.id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dispatch]);

  const handleFavoriteToggle = useCallback((lotId, isFavorite) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(lotId);
      else next.delete(lotId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!eventId || eventFromState) return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await auctionService.getEvent(eventId);
        if (!cancelled) {
          setEventDetails(ev);
          setEventTitle(ev.title || eventTitle);
          setEventStatus(ev.status ?? 'LIVE');
          setEventStartTime(ev.start_time || null);
          setEventEndTime(ev.end_time || null);
        }
      } catch {
        if (!cancelled) {
          setEventTitle('Event Lots');
          setEventStatus('LIVE');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, eventFromState]);

  const handleLotClick = useCallback((lot) => {
    setSelectedLot(lot);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedLot(null);
  }, []);

  const filteredLots = useMemo(() => {
    const filters = selectedFilters;
    const hasAnyFilter = Object.keys(filters).some(
      (k) => filters[k] && filters[k].size > 0
    );
    if (!hasAnyFilter) return lots;

    return lots.filter((lot) => {
      let sd = lot.specific_data;
      if (typeof sd === 'string') {
        try {
          sd = JSON.parse(sd) || {};
        } catch {
          sd = {};
        }
      }
      sd = sd || {};
      const catName = lot.category_name ?? lot.category?.name ?? '';

      for (const [sectionKey, selected] of Object.entries(filters)) {
        if (!selected || selected.size === 0) continue;

        if (sectionKey === 'category') {
          if (!selected.has(catName)) return false;
          continue;
        }

        if (sectionKey === 'make') {
          const lotMake = sd.make ?? sd.Make ?? '';
          const makeStr = String(lotMake).trim();
          if (!selected.has(makeStr)) return false;
          continue;
        }

        const lotVal = sd[sectionKey] ?? sd[sectionKey.replace(/_/g, ' ')];
        const lotValStr = lotVal != null ? String(lotVal) : '';
        if (!selected.has(lotValStr)) return false;
      }
      return true;
    });
  }, [lots, selectedFilters]);

  const eventImageUrl = useMemo(
    () => resolveEventImage(eventDetails ?? eventFromState, lots),
    [eventDetails, eventFromState, lots]
  );

  return (
    <div className={`buyer-event-lots ${selectedLot ? 'buyer-event-lots--drawer-open' : ''}`}>
      <header className="buyer-event-lots__header">
        <button
          className="buyer-event-lots__back"
          onClick={() => navigate('/buyer/dashboard')}
          aria-label="Back to Live Auction"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="buyer-event-lots__header-content">
          <div className="buyer-event-lots__header-title-row">
            <h1 className="buyer-event-lots__title">{eventTitle}</h1>
            {eventStatus && (
              <span className={`buyer-event-lots__header-status buyer-event-lots__header-status${getStatusModifier(eventStatus)}`}>
                {getDisplayStatus(eventStatus)}
              </span>
            )}
          </div>
          <p className="buyer-event-lots__subtitle">
            {totalCount} lot{totalCount !== 1 ? 's' : ''} in this event
          </p>
        </div>
      </header>

      <main className="buyer-event-lots__main">
        {loading && lots.length === 0 ? (
          <div className="buyer-event-lots__loading">
            <div className="buyer-event-lots__spinner" />
            <p>Loading lots...</p>
          </div>
        ) : error ? (
          <div className="buyer-event-lots__error">
            <p>{error}</p>
            <button onClick={() => fetchLots(page)}>Retry</button>
          </div>
        ) : lots.length === 0 ? (
          <div className="buyer-event-lots__empty">
            <p>No lots found for this event.</p>
          </div>
        ) : (
          <div className="buyer-event-lots__body">
            <div className="buyer-event-lots__content">
              <section className="guest-event-lots__event-summary" aria-label="Event details">
                {eventImageUrl ? (
                  <img src={eventImageUrl} alt="" className="guest-event-lots__event-thumb" />
                ) : (
                  <div className="guest-event-lots__event-thumb guest-event-lots__event-thumb--placeholder">
                    No image
                  </div>
                )}
                <div className="guest-event-lots__event-meta">
                  <p className="guest-event-lots__event-title">{eventTitle}</p>
                  <p className="guest-event-lots__event-dates">
                    Start: {formatEventDate(eventStartTime)} | End: {formatEventDate(eventEndTime)}
                  </p>
                </div>
              </section>
              <div className="guest-event-lots__list-header">
                <p className="guest-event-lots__results-count">
                  Your search returned {filteredLots.length} result{filteredLots.length !== 1 ? 's' : ''}
                </p>
                <span className="guest-event-lots__view-mode">List view</span>
              </div>
              {filteredLots.length === 0 ? (
                <div className="buyer-event-lots__empty">
                  <p>No lots match your filters.</p>
                  <button
                    onClick={() => setSelectedFilters({})}
                    className="buyer-event-lots__clear-filters"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="guest-event-lots__list">
                    {filteredLots.map((lot) => (
                      <LotRow
                        key={lot.id}
                        lot={lot}
                        eventStartTime={lot.event_start_time ?? eventStartTime ?? eventFromState?.start_time}
                        eventEndTime={lot.event_end_time ?? eventEndTime ?? eventFromState?.end_time}
                        eventTitle={eventTitle}
                        eventStatus={eventStatus ?? eventFromState?.status}
                        onOpenDetail={handleLotClick}
                        showFavorite
                        isFavorite={favoriteIds?.has(lot.id) ?? lot.is_favourite ?? false}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="buyer-event-lots__pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                      <span className="buyer-event-lots__page-info">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        aria-label="Next page"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <BuyerEventLotsFilterBar
              eventId={eventId}
              lots={lots}
              onFiltersChange={setSelectedFilters}
            />
          </div>
        )}
      </main>

      {selectedLot && (
        <GuestLotDrawer
          lot={selectedLot}
          eventStartTime={selectedLot.event_start_time ?? eventStartTime ?? eventFromState?.start_time}
          eventEndTime={selectedLot.event_end_time ?? eventEndTime ?? eventFromState?.end_time}
          eventTitle={eventTitle}
          eventId={eventId}
          eventStatus={eventStatus ?? eventFromState?.status}
          onClose={handleCloseDrawer}
          isBuyer
        />
      )}
    </div>
  );
};

export default BuyerEventLots;
