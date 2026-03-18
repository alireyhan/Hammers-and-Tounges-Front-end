import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auctionService } from '../../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import { fetchCategories } from '../../store/actions/AuctionsActions';
import BuyerEventLotsFilterBar from '../../components/BuyerEventLotsFilterBar';
import LotRow from '../../components/LotRow';
import GuestLotDrawer from '../../components/GuestLotDrawer';
import './AdminEventLots.css';
import '../../pages/GuestEventLots.css';

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

const AdminEventLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const eventFromState = location.state?.event;

  const [lots, setLots] = useState([]);
  const [eventTitle, setEventTitle] = useState(eventFromState?.title || 'Event Lots');
  const [eventStatus, setEventStatus] = useState(eventFromState?.status ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedLot, setSelectedLot] = useState(null);
  const [canDeleteEvent, setCanDeleteEvent] = useState(false);
  const [hasActiveLot, setHasActiveLot] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const fetchLots = useCallback(async (pageNum = 1) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.getLots({
        event: id,
        page: pageNum,
        page_size: PAGE_SIZE,
      });
      setLots(res.results || []);
      setTotalCount(res.count ?? res.results?.length ?? 0);
      if (res.results?.[0]?.event_title && !eventFromState?.title) {
        setEventTitle(res.results[0].event_title);
      }
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError(err.message || 'Failed to load lots');
      toast.error('Failed to load lots');
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [id, eventFromState?.title]);

  useEffect(() => {
    fetchLots(page);
  }, [fetchLots, page]);

  const lotCreated = location.state?.lotCreated;
  useEffect(() => {
    if (lotCreated && id) {
      setPage(1);
      fetchLots(1);
      navigate(`/admin/event/${id}`, { state: { event: eventFromState }, replace: true });
    }
  }, [lotCreated, id, eventFromState, fetchLots, navigate]);

  const handleCreateLot = useCallback(() => {
    const eventData = eventFromState || { id, title: eventTitle, status: eventStatus };
    navigate('/admin/publishnew', { state: { eventId: id, event: eventData, fromAdmin: true } });
  }, [navigate, id, eventFromState, eventTitle, eventStatus]);

  const [deletingEvent, setDeletingEvent] = useState(false);
  const handleDeleteEvent = useCallback(async () => {
    // Re-check right before delete
    const ok = await (async () => {
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
    })();
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
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
    }
  }, [id, eventTitle, navigate]);

  const eventStatusUpper = (eventStatus || '').toUpperCase();
  const showCreateLot = eventStatusUpper === 'SCHEDULED';
  const showDeleteEvent = eventStatusUpper === 'SCHEDULED' && canDeleteEvent;
  const showEditEvent = eventStatusUpper === 'SCHEDULED' && !hasActiveLot;

  const handleLotUpdated = useCallback(() => {
    fetchLots(page);
  }, [page, fetchLots]);

  useEffect(() => {
    if (!id || eventFromState) return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await auctionService.getEvent(id);
        if (!cancelled) {
          setEventTitle(ev.title || eventTitle);
          setEventStatus(ev.status ?? null);
        }
      } catch {
        if (!cancelled) setEventStatus(null);
      }
    })();
    return () => { cancelled = true; };
  }, [id, eventFromState]);

  // Determine if editing is allowed: event must be scheduled and have no ACTIVE lots.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (eventStatusUpper !== 'SCHEDULED') {
        if (!cancelled) setHasActiveLot(false);
        return;
      }
      try {
        const res = await auctionService.getLots({ event: id, page: 1, page_size: 200 });
        const items = res?.results || [];
        const anyActive = items.some((l) => String(l?.status || l?.listing_status || '').toUpperCase() === 'ACTIVE');
        if (!cancelled) setHasActiveLot(anyActive);
      } catch {
        // On error, be conservative and hide the edit button.
        if (!cancelled) setHasActiveLot(true);
      }
    })();
    return () => { cancelled = true; };
  }, [id, eventStatusUpper]);

  // Determine if delete is allowed: no lots or only draft lots.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (eventStatusUpper !== 'SCHEDULED') {
        if (!cancelled) setCanDeleteEvent(false);
        return;
      }
      try {
        const res = await auctionService.getLots({ event: id, page: 1, page_size: 200 });
        const items = res?.results || [];
        const total = res?.count ?? items.length;
        if (total === 0) {
          if (!cancelled) setCanDeleteEvent(true);
          return;
        }
        const hasNonDraft = items.some((l) => String(l?.status || l?.listing_status || '').toUpperCase() !== 'DRAFT');
        if (hasNonDraft || total > items.length) {
          if (!cancelled) setCanDeleteEvent(false);
          return;
        }
        if (!cancelled) setCanDeleteEvent(true);
      } catch {
        if (!cancelled) setCanDeleteEvent(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, eventStatusUpper]);

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

  const eventData = eventFromState || { id, title: eventTitle, status: eventStatus };

  return (
    <div className={`admin-event-lots ${selectedLot ? 'admin-event-lots--drawer-open' : ''}`}>
      <header className="admin-event-lots__header">
        <button
          className="admin-event-lots__back"
          onClick={() => navigate('/admin/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="admin-event-lots__header-content">
          <div className="admin-event-lots__header-title-row">
            <h1 className="admin-event-lots__title">{eventTitle}</h1>
            {eventStatus && (
              <span className={`admin-event-lots__header-status admin-event-lots__header-status${getStatusModifier(eventStatus)}`}>
                {(eventStatus || '').toUpperCase() === 'CLOSING' ? 'COMPLETED' : eventStatus}
              </span>
            )}
          </div>
          <p className="admin-event-lots__subtitle">
            {totalCount} lot{totalCount !== 1 ? 's' : ''} in this event
          </p>
        </div>
        <div className="admin-event-lots__header-actions">
          {showEditEvent && (
            <button
              className="admin-event-lots__edit-event"
              onClick={() => navigate(`/admin/event/${id}/edit`)}
              aria-label="Edit event"
            >
              Edit Event
            </button>
          )}
          {showCreateLot && (
            <button
              className="admin-event-lots__create-lot"
              onClick={handleCreateLot}
              aria-label="Create lot"
            >
              Create Lot
            </button>
          )}
          {showDeleteEvent && (
            <button
              className="admin-event-lots__delete-event"
              onClick={handleDeleteEvent}
              disabled={deletingEvent}
              aria-label="Delete event"
            >
              {deletingEvent ? 'Deleting...' : 'Delete Event'}
            </button>
          )}
        </div>
      </header>

      <main className="admin-event-lots__main">
        {loading && lots.length === 0 ? (
          <div className="admin-event-lots__loading">
            <div className="admin-event-lots__spinner" />
            <p>Loading lots...</p>
          </div>
        ) : error ? (
          <div className="admin-event-lots__error">
            <p>{error}</p>
            <button onClick={() => fetchLots(page)}>Retry</button>
          </div>
        ) : lots.length === 0 ? (
          <div className="admin-event-lots__empty">
            <p>No lots found for this event.</p>
          </div>
        ) : (
          <div className="admin-event-lots__body">
            <div className="admin-event-lots__content">
              {filteredLots.length === 0 ? (
                <div className="admin-event-lots__empty">
                  <p>No lots match your filters.</p>
                  <button
                    onClick={() => setSelectedFilters({})}
                    className="admin-event-lots__clear-filters"
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
                        eventEndTime={lot.end_date ?? lot.end_time ?? eventFromState?.end_time}
                        eventTitle={eventTitle}
                        eventStatus={lot.event_status ?? eventStatus}
                        onOpenDetail={setSelectedLot}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="admin-event-lots__pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                      <span className="admin-event-lots__page-info">
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
          eventEndTime={selectedLot.end_date ?? selectedLot.end_time ?? eventFromState?.end_time}
          eventTitle={eventTitle}
          eventId={id}
          eventStatus={selectedLot.event_status ?? eventStatus}
          event={eventData}
          onClose={() => setSelectedLot(null)}
          isAdmin
          onLotUpdated={handleLotUpdated}
        />
      )}
    </div>
  );
};

export default AdminEventLots;
