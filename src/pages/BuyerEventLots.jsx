import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { addToFavorite, deleteFavorite, getMyFavoriteAuctions } from '../store/actions/buyerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { toast } from 'react-toastify';
import { getMediaUrl } from '../config/api.config';
import BuyerEventLotsFilterBar from '../components/BuyerEventLotsFilterBar';
import './BuyerEventLots.css';

const PAGE_SIZE = 12;

const getStatusModifier = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE' || s === 'ACTIVE') return '--live';
  if (s === 'CLOSING') return '--closing';
  if (s === 'CLOSED') return '--closed';
  return '--live';
};

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getLotStatusModifier = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'DRAFT') return '--draft';
  if (s === 'ACTIVE' || s === 'APPROVED' || s === 'LIVE') return '--active';
  if (s === 'CLOSED' || s === 'COMPLETED') return '--closed';
  if (s === 'PENDING') return '--pending';
  return '--active';
};

const LotCard = ({ lot, onOpenDetail, onFavoriteToggle, favoriteIds }) => {
  const dispatch = useDispatch();
  const imageMedia = lot.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef(null);
  const lotStatus = lot.status || lot.listing_status;
  const isFavorite = favoriteIds?.has(lot.id) ?? lot.is_favourite ?? false;

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imageUrls.length]);

  const displayUrl = imageUrls[currentImageIndex] || imageUrls[0];
  const hasMultipleImages = imageUrls.length > 1;

  const handleFavoriteClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lot?.id || isUpdating) return;
    setIsUpdating(true);
    const prev = isFavorite;
    try {
      if (isFavorite) {
        await dispatch(deleteFavorite(lot.id)).unwrap();
        toast.success('Removed from favorites');
      } else {
        await dispatch(addToFavorite(lot.id)).unwrap();
        toast.success('Added to favorites');
      }
      onFavoriteToggle?.(lot.id, !isFavorite);
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setIsUpdating(false);
    }
  }, [lot?.id, isFavorite, isUpdating, dispatch, onFavoriteToggle]);

  return (
    <article
      className="buyer-event-lots__card"
      onClick={() => onOpenDetail?.(lot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.(lot)}
    >
      <div className="buyer-event-lots__card-media">
        {lotStatus && (
          <span className={`buyer-event-lots__card-status buyer-event-lots__card-status${getLotStatusModifier(lotStatus)}`}>
            {lotStatus}
          </span>
        )}
        <button
          type="button"
          className="buyer-event-lots__heart"
          onClick={handleFavoriteClick}
          disabled={isUpdating}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="buyer-event-lots__heart-icon">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="buyer-event-lots__heart-icon">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
        {displayUrl ? (
          <img src={displayUrl} alt={lot.title} loading="lazy" />
        ) : (
          <div className="buyer-event-lots__card-placeholder">📷</div>
        )}
        {hasMultipleImages && (
          <div className="buyer-event-lots__card-slider-dots">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={`buyer-event-lots__card-dot ${i === currentImageIndex ? 'active' : ''}`}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>
      <div className="buyer-event-lots__card-body">
        <div className="buyer-event-lots__card-lot-no">Lot #{lot.lot_number || lot.id}</div>
        <h3 className="buyer-event-lots__card-title">{lot.title || 'Untitled'}</h3>
        {lot.description && (
          <p className="buyer-event-lots__card-desc">{lot.description}</p>
        )}
        <div className="buyer-event-lots__card-meta">
          <span className="buyer-event-lots__card-category">{lot.category_name || '—'}</span>
          <span className="buyer-event-lots__card-price">
            {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
          </span>
        </div>
        <div className="buyer-event-lots__card-footer">
          {lot.total_bids != null && (
            <span className="buyer-event-lots__card-bids">{lot.total_bids} bid(s)</span>
          )}
        </div>
      </div>
    </article>
  );
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
          setEventTitle(ev.title || eventTitle);
          setEventStatus(ev.status ?? 'LIVE');
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
    navigate(`/buyer/auction/${lot.id}`, {
      state: {
        from: 'buyer-event-lots',
        listing: lot,
        eventId,
        event: eventFromState || { id: eventId, title: eventTitle },
      },
    });
  }, [navigate, eventId, eventFromState, eventTitle]);

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

  return (
    <div className="buyer-event-lots">
      <header className="buyer-event-lots__header">
        <button
          className="buyer-event-lots__back"
          onClick={() => navigate('/buyer/dashboard')}
          aria-label="Back to dashboard"
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
                {eventStatus}
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
                  <div className="buyer-event-lots__grid">
                    {filteredLots.map((lot) => (
                      <LotCard
                        key={lot.id}
                        lot={lot}
                        onOpenDetail={handleLotClick}
                        onFavoriteToggle={handleFavoriteToggle}
                        favoriteIds={favoriteIds}
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
    </div>
  );
};

export default BuyerEventLots;
