import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import EventListingRow from '../components/EventListingRow';
import { fetchEvents } from '../store/actions/AuctionsActions';
import { normalizeEventStatusForFilter } from '../utils/eventStatus';
import './ManagerDashboard.css';

const canDeleteEventByLots = async (eventId) => {
  try {
    const res = await auctionService.getLots({ event: eventId, page: 1, page_size: 200 });
    const items = res?.results || [];
    const total = res?.count ?? items.length;
    if (total === 0) return true;
    const hasNonDraft = items.some((l) => String(l?.status || l?.listing_status || '').toUpperCase() !== 'DRAFT');
    if (hasNonDraft) return false;
    // If there are more lots than we fetched, we can't prove they're all draft → disallow delete (safe)
    if (total > items.length) return false;
    return true;
  } catch {
    // On any error, disallow delete (safe)
    return false;
  }
};

const formatEventDate = (isoStr) => {
  if (!isoStr) return '-----';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-----';
  }
};

const StatCard = React.memo(({ icon: Icon, value, label, colorClass }) => (
  <div className="manager-dashboard-stat-card" role="article" aria-label={`${label}: ${value}`}>
    <div className={`manager-dashboard-stat-icon ${colorClass}`}>
      <Icon />
    </div>
    <div className="manager-dashboard-stat-content">
      <div className="manager-dashboard-stat-value" aria-live="polite">{value}</div>
      <div className="manager-dashboard-stat-label">{label}</div>
    </div>
  </div>
));

const EventsSkeleton = ({ rows = 10 }) => (
  <div className="events-skeleton-list" aria-hidden="true">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="events-skeleton-row">
        <div className="events-skeleton-thumb">
          <div className="events-skeleton-shimmer events-skeleton-shape-thumb" />
          <div className="events-skeleton-shimmer events-skeleton-shape-badge" />
        </div>
        <div className="events-skeleton-dates">
          <div className="events-skeleton-shimmer events-skeleton-shape-date" />
          <div className="events-skeleton-shimmer events-skeleton-shape-date" />
        </div>
        <div className="events-skeleton-body">
          <div className="events-skeleton-shimmer events-skeleton-line events-skeleton-line--title" />
          <div className="events-skeleton-shimmer events-skeleton-line events-skeleton-line--chip" />
          <div className="events-skeleton-shimmer events-skeleton-line events-skeleton-line--meta" />
        </div>
        <div className="events-skeleton-lots">
          <div className="events-skeleton-shimmer events-skeleton-shape-lots" />
        </div>
      </div>
    ))}
  </div>
);

function ManagerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const features = useSelector((state) => state.permissions?.features);
  const { events, eventsLoading, eventsLoaded } = useSelector((state) => state.buyer);
  const manageEventsPerm = features?.manage_events || {};
  const canCreateEvents = manageEventsPerm?.create === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [deletableEventIds, setDeletableEventIds] = useState({});
  const [syncingCreatedEvent, setSyncingCreatedEvent] = useState(false);
  const eventCreated = location.state?.eventCreated === true;
  const createdEventId = location.state?.createdEventId ?? null;
  const createdEventCode = location.state?.createdEventCode ?? null;

  useEffect(() => {
    dispatch(fetchEvents({}));
  }, [dispatch]);

  useEffect(() => {
    if (!eventCreated) return;

    let cancelled = false;
    setSyncingCreatedEvent(true);

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const isCreatedEvent = (event) => {
      if (!event || typeof event !== 'object') return false;
      if (createdEventId != null && String(event.id) === String(createdEventId)) return true;
      if (createdEventCode && String(event.event_id) === String(createdEventCode)) return true;
      return false;
    };

    (async () => {
      const maxAttempts = 8;
      const pollDelayMs = 1200;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const payload = await dispatch(fetchEvents({ forceRefresh: true })).unwrap();
          const list = payload?.results || [];
          if ((!createdEventId && !createdEventCode) || list.some(isCreatedEvent)) {
            break;
          }
        } catch {
          // Continue polling on transient fetch failures.
        }

        if (attempt < maxAttempts) {
          await wait(pollDelayMs);
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setSyncingCreatedEvent(false);
        navigate('/manager/dashboard', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventCreated, createdEventId, createdEventCode, dispatch, navigate]);

  useEffect(() => {
    const hydrateDeleteEligibility = async () => {
      if (!events?.length) {
        setDeletableEventIds({});
        return;
      }
      try {
        const scheduled = events.filter((e) => normalizeEventStatusForFilter(e) === 'SCHEDULED');
        const checks = await Promise.all(
          scheduled.map(async (e) => [String(e.id), await canDeleteEventByLots(e.id)])
        );
        const nextMap = {};
        checks.forEach(([id, ok]) => { nextMap[id] = ok; });
        setDeletableEventIds(nextMap);
      } catch {
        setDeletableEventIds({});
      }
    };
    hydrateDeleteEligibility();
  }, [events]);

  const getFilteredEvents = () => {
    if (!events || events.length === 0) return [];
    if (filterStatus === 'ALL') return events;
    return events.filter((event) => {
      const status = normalizeEventStatusForFilter(event);
      if (filterStatus === 'COMPLETED') {
        return status === 'CLOSING' || status === 'CLOSED' || status === 'COMPLETED';
      }
      return status === filterStatus;
    });
  };
  const filteredEvents = getFilteredEvents();

  const handleViewDetails = useCallback(
    (eventId, event) => {
      navigate(`/manager/event/${eventId}`, { state: { event } });
    },
    [navigate],
  );

  const handleDeleteEvent = useCallback(
    async (eventId, event) => {
      if (!canDeleteEvents) {
        toast.error('You do not have permission to delete events.');
        return;
      }
      const ok = await canDeleteEventByLots(eventId);
      if (!ok) {
        toast.error('Event cannot be deleted because it has active (or non-draft) lots.');
        dispatch(fetchEvents({ forceRefresh: true }));
        return;
      }
      if (!window.confirm(`Are you sure you want to delete "${event?.title || 'this event'}"? This will remove the event and all its lots.`)) return;
      try {
        await auctionService.deleteEvent(eventId);
        toast.success('Event deleted successfully.');
        dispatch(fetchEvents({ forceRefresh: true }));
      } catch (err) {
        toast.error(err?.message || 'Failed to delete event');
      }
    },
    [canDeleteEvents, dispatch],
  );

  const statCards = useMemo(
    () => [
      {
        icon: () => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        value: events.length.toLocaleString(),
        label: 'Total Events',
        colorClass: 'manager-dashboard-icon-events',
      },
    ],
    [events.length],
  );

  return (
    <div className="manager-dashboard-container" role="main">
      <header className="manager-dashboard-header">
        <div className="manager-dashboard-header-content">
          <h1 className="manager-dashboard-title">Manager Dashboard</h1>
          <p className="manager-dashboard-subtitle">
            Auction events overview and management
          </p>
        </div>
        {canCreateEvents && (
          <Link
            to="/manager/event/create"
            className="manager-dashboard-create-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Create Event
          </Link>
        )}
      </header>

      <section className="manager-dashboard-stats-overview" aria-label="Statistics overview">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </section>

      <div className="manager-dashboard-main">
        <section className="manager-dashboard-card" aria-label="Recent events">
          <div className="manager-dashboard-card-header">
            <div className="manager-dashboard-card-title-wrapper">
              <h2 className="manager-dashboard-card-title">Recent Events</h2>
              {events.length > 0 && (
                <span className="manager-dashboard-event-count">({events.length})</span>
              )}
            </div>
            <div className="manager-dashboard-card-actions">
              <select
                className="manager-dashboard-filter-select"
                aria-label="Filter by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed/Closing</option>
              </select>
            </div>
          </div>

          {syncingCreatedEvent && (
            <div className="manager-dashboard-events-sync-banner" role="status" aria-live="polite">
              <span className="manager-dashboard-events-sync-dot" />
              Fetching newly created event...
            </div>
          )}

          <div className="manager-dashboard-events-list-wrapper">
            {eventsLoading && !eventsLoaded ? (
              <div className="manager-dashboard-loading">
                <EventsSkeleton />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="manager-dashboard-empty">
                No events found
              </div>
            ) : (
              <div className="manager-dashboard-events-list">
                {filteredEvents.map((event) => (
                  <EventListingRow
                    key={event.id}
                    event={event}
                    onClick={(e) => handleViewDetails(e.id, e)}
                    renderActions={(ev) => (
                      <>
                        <button
                          type="button"
                          className="manager-dashboard-event-action-btn"
                          onClick={() => handleViewDetails(ev.id, ev)}
                          title="View Details"
                          aria-label={`View details for ${ev.title}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          View
                        </button>
                        {canDeleteEvents &&
                          normalizeEventStatusForFilter(ev) === 'SCHEDULED' &&
                          deletableEventIds[String(ev.id)] === true && (
                          <button
                            type="button"
                            className="manager-dashboard-event-action-btn manager-dashboard-event-action-btn--delete"
                            onClick={() => handleDeleteEvent(ev.id, ev)}
                            title="Delete Event"
                            aria-label={`Delete event ${ev.title}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ManagerDashboard;
