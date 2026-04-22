import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { getMediaUrl } from '../config/api.config';
import BuyerEventLotsFilterBar from '../components/BuyerEventLotsFilterBar';
import LotRow from '../components/LotRow';
import GuestLotDrawer from '../components/GuestLotDrawer';
import './ManagerEventLots.css';
import './GuestEventLots.css';

const PAGE_SIZE = 12;

const getStatusModifier = (status) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'DRAFT': return '--draft';
    case 'SCHEDULED': case 'LIVE': case 'ACTIVE': case 'APPROVED': return '--active';
    case 'CLOSING': case 'CLOSED': case 'COMPLETED': return '--closed';
    case 'PENDING': return '--pending';
    case 'REJECTED': return '--rejected';
    default: return '--active';
  }
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

const ManagerEventLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const eventFromState = location.state?.event;
  const authUserRole = useSelector((state) => (state.auth?.user?.role || '').toLowerCase());
  const features = useSelector((state) => state.permissions?.features);
  const manageEventsPerm = features?.manage_events || {};
  const canCreateEvents = manageEventsPerm?.create === true;
  const canUpdateEvents = manageEventsPerm?.update === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;

  const [lots, setLots] = useState([]);
  const [eventTitle, setEventTitle] = useState(eventFromState?.title || 'Event Lots');
  const [eventStatus, setEventStatus] = useState(eventFromState?.status ?? null);
  const [eventStartTime, setEventStartTime] = useState(eventFromState?.start_time || null);
  const [eventEndTime, setEventEndTime] = useState(eventFromState?.end_time || null);
  const [eventDetails, setEventDetails] = useState(eventFromState || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedLot, setSelectedLot] = useState(null);
  const [syncingNewLot, setSyncingNewLot] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const fetchLots = useCallback(async (pageNum = 1) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let items = [];
      let total = 0;
      let lotsSucceeded = false;

      // Try lots endpoint first (same as Postman: /api/auctions/lots/?event=1&page=1&page_size=12)
      try {
        const res = await auctionService.getLots({
          event: id,
          page: pageNum,
          page_size: PAGE_SIZE,
        });
        console.log('get lots response:', res);
        lotsSucceeded = true;
        items = res.results || [];
        total = res.count ?? items.length;
      } catch (lotsErr) {
        console.warn('Lots endpoint failed, trying listings fallback:', lotsErr);
      }

      // Fallback: only when lots endpoint failed (e.g. 404), try listings
      if (!lotsSucceeded) {
        try {
          const listingsRes = await auctionService.getAuctions({
            event: id,
            event_id: id,
            page: pageNum,
            page_size: PAGE_SIZE,
          });
          console.log('get lots response (fallback):', listingsRes);
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
      return items;
    } catch (err) {
      if (err) {
        console.error('Error fetching lots:', err);
        setError(err?.message || err?.response?.data?.detail || 'Failed to load lots');
        toast.error('Failed to load lots');
      }
      setLots([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [id, eventFromState?.title]);

  useEffect(() => {
    fetchLots(page);
  }, [fetchLots, page]);

  // Refetch lots when returning from create lot
  const lotCreated = location.state?.lotCreated;
  const createdLot = location.state?.createdLot;
  useEffect(() => {
    if (lotCreated && id) {
      // Keep UI in sync immediately after create, even if list API is eventually consistent.
      if (createdLot?.id) {
        setLots((prev) => {
          const exists = prev.some((l) => String(l.id) === String(createdLot.id));
          if (exists) return prev;
          return [createdLot, ...prev];
        });
        setTotalCount((c) => (typeof c === 'number' ? c + 1 : c));
      }
      setPage(1);
      setSyncingNewLot(true);

      let cancelled = false;
      const targetLotId = createdLot?.id ? String(createdLot.id) : null;

      (async () => {
        const maxAttempts = 8;
        const pollDelayMs = 1200;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const latestItems = (await fetchLots(1)) || [];
          if (cancelled) return;

          if (!targetLotId || latestItems.some((l) => String(l?.id) === targetLotId)) {
            break;
          }

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
            if (cancelled) return;
          }
        }

        if (!cancelled) {
          setSyncingNewLot(false);
          navigate(`/manager/event/${id}`, { state: { event: eventFromState }, replace: true });
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [lotCreated, createdLot, id, eventFromState, fetchLots, navigate]);

  // Fetch event details when not in state (e.g. direct URL)
  useEffect(() => {
    if (!id || eventFromState) return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await auctionService.getEvent(id);
        if (!cancelled) {
          setEventDetails(ev);
          setEventTitle(ev.title || eventTitle);
          setEventStatus(ev.status ?? null);
          setEventStartTime(ev.start_time || null);
          setEventEndTime(ev.end_time || null);
        }
      } catch (err) {
        if (!cancelled) setEventStatus(null);
      }
    })();
    return () => { cancelled = true; };
  }, [id, eventFromState]);

  const handleCreateLot = () => {
    if (!canCreateEvents) {
      toast.error('You do not have permission to create lots/events.');
      return;
    }
    const eventData = eventFromState || { id, title: eventTitle, status: eventStatus };
    if (authUserRole === 'clerk') {
      navigate('/clerk/publishnew', { state: { eventId: id, event: eventData, fromClerk: true } });
    } else {
      navigate('/manager/publishnew', { state: { eventId: id, event: eventData } });
    }
  };

  const [deletingEvent, setDeletingEvent] = useState(false);
  const [canDeleteEvent, setCanDeleteEvent] = useState(false);

  const checkCanDeleteEvent = useCallback(async () => {
    if (!id) return false;
    try {
      const res = await auctionService.getLots({ event: id, page: 1, page_size: 200 });
      const items = res?.results || [];
      const total = res?.count ?? items.length;
      if (total === 0) return true;
      const hasNonDraft = items.some((l) => String(l?.status || l?.listing_status || '').toUpperCase() !== 'DRAFT');
      if (hasNonDraft) return false;
      if (total > items.length) return false;
      return true;
    } catch {
      return false;
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if ((eventStatus || '').toUpperCase() !== 'SCHEDULED' || authUserRole === 'clerk') {
        if (!cancelled) setCanDeleteEvent(false);
        return;
      }
      const ok = await checkCanDeleteEvent();
      if (!cancelled) setCanDeleteEvent(ok);
    })();
    return () => { cancelled = true; };
  }, [eventStatus, authUserRole, checkCanDeleteEvent]);

  const handleDeleteEvent = async () => {
    if (!canDeleteEvents) {
      toast.error('You do not have permission to delete events.');
      return;
    }
    const ok = await checkCanDeleteEvent();
    if (!ok) {
      toast.error('Event cannot be deleted because it has active (or non-draft) lots.');
      setCanDeleteEvent(false);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the event "${eventTitle}"? This will remove the event and all its lots.`)) return;
    setDeletingEvent(true);
    try {
      await auctionService.deleteEvent(id);
      toast.success('Event deleted successfully.');
      navigate('/manager/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
    }
  };

  const showCreateLot = eventStatus === 'SCHEDULED' && authUserRole !== 'clerk' && canCreateEvents;
  const showDeleteEvent =
    eventStatus === 'SCHEDULED' && authUserRole !== 'clerk' && canDeleteEvents && canDeleteEvent;

  const handleLotUpdated = useCallback(() => {
    fetchLots(page);
  }, [page, fetchLots]);

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

  const eventData = eventFromState || { id, title: eventTitle, status: eventStatus };

  return (
    <div className={`manager-event-lots ${selectedLot ? 'manager-event-lots--drawer-open' : ''}`}>
      <header className="manager-event-lots__header">
        <button
          className="manager-event-lots__back"
          onClick={() => navigate('/manager/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="manager-event-lots__header-content">
          <div className="manager-event-lots__header-title-row">
            <h1 className="manager-event-lots__title">{eventTitle}</h1>
            {eventStatus && (
              <span className={`manager-event-lots__header-status manager-event-lots__header-status${getStatusModifier(eventStatus)}`}>
                {(eventStatus || '').toUpperCase() === 'CLOSING' ? 'COMPLETED' : eventStatus}
              </span>
            )}
          </div>
          <p className="manager-event-lots__subtitle">
            {totalCount} lot{totalCount !== 1 ? 's' : ''} in this event
          </p>
        </div>
        <div className="manager-event-lots__header-actions">
          {showCreateLot && (
            <button
              className="manager-event-lots__create-lot"
              onClick={handleCreateLot}
              aria-label="Create lot"
            >
              Create Lot
            </button>
          )}
          {showDeleteEvent && (
            <button
              className="manager-event-lots__delete-event"
              onClick={handleDeleteEvent}
              disabled={deletingEvent}
              aria-label="Delete event"
            >
              {deletingEvent ? 'Deleting...' : 'Delete Event'}
            </button>
          )}
        </div>
      </header>

      <main className="manager-event-lots__main">
        {syncingNewLot && (
          <div className="manager-event-lots__sync-banner" role="status" aria-live="polite">
            <span className="manager-event-lots__sync-dot" />
            Fetching newly created lot...
          </div>
        )}
        {loading && lots.length === 0 ? (
          <div className="manager-event-lots__loading">
            <div className="manager-event-lots__spinner" />
            <p>Loading lots...</p>
          </div>
        ) : error ? (
          <div className="manager-event-lots__error">
            <p>{error}</p>
            <button onClick={() => fetchLots(page)}>Retry</button>
          </div>
        ) : lots.length === 0 ? (
          <div className="manager-event-lots__empty">
            <p>No lots found for this event.</p>
          </div>
        ) : (
          <div className="manager-event-lots__body">
            <div className="manager-event-lots__content">
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
              {filteredLots.length === 0 ? (
                <div className="manager-event-lots__empty">
                  <p>No lots match your filters.</p>
                  <button
                    onClick={() => setSelectedFilters({})}
                    className="manager-event-lots__clear-filters"
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
                        eventStartTime={lot.event_start_time ?? lot.start_date ?? lot.start_time ?? eventStartTime}
                        eventEndTime={lot.event_end_time ?? lot.end_date ?? lot.end_time ?? eventEndTime ?? eventFromState?.end_time}
                        eventTitle={eventTitle}
                        eventStatus={lot.event_status ?? eventStatus}
                        onOpenDetail={setSelectedLot}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="manager-event-lots__pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                      <span className="manager-event-lots__page-info">
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
              eventId={id}
              lots={lots}
              onFiltersChange={setSelectedFilters}
            />
          </div>
        )}
      </main>

      {selectedLot && (
        <GuestLotDrawer
          lot={selectedLot}
          eventStartTime={selectedLot.event_start_time ?? selectedLot.start_date ?? selectedLot.start_time ?? eventFromState?.start_time ?? eventFromState?.start_date}
          eventEndTime={selectedLot.event_end_time ?? selectedLot.end_date ?? selectedLot.end_time ?? eventEndTime ?? eventFromState?.end_time}
          eventTitle={eventTitle}
          eventId={id}
          eventStatus={selectedLot.event_status ?? eventStatus}
          event={eventData}
          onClose={() => setSelectedLot(null)}
          isManager
          onLotUpdated={handleLotUpdated}
        />
      )}
    </div>
  );
};

export default ManagerEventLots;
