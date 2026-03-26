import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import EventListingRow from '../components/EventListingRow';
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

function ManagerDashboard() {
  const navigate = useNavigate();
  const features = useSelector((state) => state.permissions?.features);
  const manageEventsPerm = features?.manage_events || {};
  const canCreateEvents = manageEventsPerm?.create === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;
  const [events, setEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [deletableEventIds, setDeletableEventIds] = useState({});

  const fetchEventsData = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const allEvents = await auctionService.fetchAllEvents();
      setEvents(allEvents);
      setEventCount(allEvents.length);

      // Precompute delete eligibility for scheduled events
      const scheduled = allEvents.filter((e) => String(e?.status || '').toUpperCase() === 'SCHEDULED');
      const checks = await Promise.all(
        scheduled.map(async (e) => [String(e.id), await canDeleteEventByLots(e.id)])
      );
      const nextMap = {};
      checks.forEach(([id, ok]) => { nextMap[id] = ok; });
      setDeletableEventIds(nextMap);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
      setEvents([]);
      setEventCount(0);
      setDeletableEventIds({});
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (filterStatus === 'ALL') return events;
    return events.filter((event) => {
      const status = (event.status || '').toUpperCase();
      if (filterStatus === 'COMPLETED') {
        return status === 'CLOSING' || status === 'CLOSED' || status === 'COMPLETED';
      }
      return status === filterStatus;
    });
  }, [events, filterStatus]);

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
        fetchEventsData();
        return;
      }
      if (!window.confirm(`Are you sure you want to delete "${event?.title || 'this event'}"? This will remove the event and all its lots.`)) return;
      try {
        await auctionService.deleteEvent(eventId);
        toast.success('Event deleted successfully.');
        fetchEventsData();
      } catch (err) {
        toast.error(err?.message || 'Failed to delete event');
      }
    },
    [fetchEventsData],
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
        value: eventCount.toLocaleString(),
        label: 'Total Events',
        colorClass: 'manager-dashboard-icon-events',
      },
    ],
    [eventCount],
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
              {eventCount > 0 && (
                <span className="manager-dashboard-event-count">({eventCount})</span>
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

          <div className="manager-dashboard-events-list-wrapper">
            {isLoadingEvents ? (
              <div className="manager-dashboard-loading">
                Loading events...
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
                          (ev.status || '').toUpperCase() === 'SCHEDULED' &&
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
