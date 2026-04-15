import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { auctionService } from "../services/interceptors/auction.service";
import { toast } from "react-toastify";
import EventListingRow from "../components/EventListingRow";
import { fetchEvents } from "../store/actions/AuctionsActions";
import { normalizeEventStatusForFilter } from "../utils/eventStatus";
import "./ManagerDashboard.css";

const TAB_UPCOMING = "upcoming";
const TAB_PAST = "past";
const ITEMS_PER_PAGE = 15;

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

const canDeleteEventByLots = async (eventId) => {
  try {
    const res = await auctionService.getLots({ event: eventId, page: 1, page_size: 200 });
    const items = res?.results || [];
    const total = res?.count ?? items.length;
    if (total === 0) return true;
    const hasNonDraft = items.some((l) => String(l?.status || l?.listing_status || '').toUpperCase() !== 'DRAFT');
    if (hasNonDraft) return false;
    // If there are more lots than we fetched, we can't prove they're all draft → disallow (safe)
    if (total > items.length) return false;
    return true;
  } catch {
    return false;
  }
};

export default function ClerkDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const features = useSelector((state) => state.permissions?.features);
  const permissionsLoading = useSelector((state) => state.permissions?.isLoading);
  const { events, eventsLoading, eventsLoaded, eventsError } = useSelector((state) => state.buyer);
  const manageEventsPerm = features?.manage_events || {};
  const canCreateEvents = manageEventsPerm?.create === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;
  const [deletableEventIds, setDeletableEventIds] = useState({});
  const [activeTab, setActiveTab] = useState(TAB_UPCOMING);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchEvents({}));
  }, [dispatch]);

  useEffect(() => {
    if (!canDeleteEvents || permissionsLoading || !events?.length) {
      setDeletableEventIds({});
      return;
    }

    const run = async () => {
      const nonCompletedEvents = (events || []).filter((e) => {
        const s = normalizeEventStatusForFilter(e);
        return s !== 'CLOSED' && s !== 'CLOSING';
      });
      const scheduled = nonCompletedEvents.filter((e) => normalizeEventStatusForFilter(e) === 'SCHEDULED');
      const checks = await Promise.all(
        scheduled.map(async (e) => [String(e.id), await canDeleteEventByLots(e.id)])
      );
      const map = {};
      checks.forEach(([id, ok]) => {
        map[id] = ok;
      });
      setDeletableEventIds(map);
    };

    run();
  }, [events, canDeleteEvents, permissionsLoading]);

  const handleDeleteEvent = useCallback(
    async (event) => {
      if (!canDeleteEvents) {
        toast.error("You do not have permission to delete events.");
        return;
      }
      const eventId = event?.id;
      if (!eventId) return;
      const ok = await canDeleteEventByLots(eventId);
      if (!ok) {
        toast.error("Event cannot be deleted because it has active (or non-draft) lots.");
        return;
      }
      if (
        !window.confirm(
          `Are you sure you want to delete "${event?.title || "this event"}"? This will remove the event and all its lots.`
        )
      ) {
        return;
      }
      try {
        await auctionService.deleteEvent(eventId);
        toast.success("Event deleted successfully.");
        await dispatch(fetchEvents({ forceRefresh: true })).unwrap();
      } catch (err) {
        toast.error(err?.message || "Failed to delete event");
      }
    },
    [canDeleteEvents, dispatch]
  );

  const getFilteredEvents = () => {
    if (!events?.length) return [];
    const now = new Date();
    if (activeTab === TAB_UPCOMING) {
      return events.filter((e) => {
        const end = e.end_time ? new Date(e.end_time) : null;
        const status = normalizeEventStatusForFilter(e);
        if (status === "CLOSED" || status === "CLOSING") return false;
        return !end || end > now;
      });
    }
    return events.filter((e) => {
      const end = e.end_time ? new Date(e.end_time) : null;
      const status = normalizeEventStatusForFilter(e);
      if (status === "CLOSED" || status === "CLOSING") return true;
      return end && end <= now;
    });
  };
  const filteredEvents = getFilteredEvents();

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => setPage(1), [activeTab]);

  const handleEventClick = useCallback(
    (event) => {
      navigate(`/clerk/event/${event.id}`, { state: { event } });
    },
    [navigate]
  );

  return (
    <div className="manager-dashboard-container" role="main">
      <header className="manager-dashboard-header">
        <div className="manager-dashboard-header-content">
          <h1 className="manager-dashboard-title">Clerk Dashboard</h1>
          <p className="manager-dashboard-subtitle">View events and lots</p>
        </div>
        {canCreateEvents && (
          <button
            type="button"
            className="manager-dashboard-create-btn"
            onClick={() => navigate("/clerk/event/create")}
            aria-label="Create event"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Create Event
          </button>
        )}
      </header>

      <div className="manager-dashboard-main">
        <section className="manager-dashboard-card" aria-label="Events">
          <div className="manager-dashboard-card-header">
            <div className="manager-dashboard-card-title-wrapper">
              <h2 className="manager-dashboard-card-title">Events</h2>
              <span className="manager-dashboard-event-count">({filteredEvents.length})</span>
            </div>
            <div className="buyer-dashboard-tabs">
              <button
                type="button"
                className={`buyer-dashboard-tab ${activeTab === TAB_UPCOMING ? "active" : ""}`}
                onClick={() => setActiveTab(TAB_UPCOMING)}
              >
                Upcoming
              </button>
              <button
                type="button"
                className={`buyer-dashboard-tab ${activeTab === TAB_PAST ? "active" : ""}`}
                onClick={() => setActiveTab(TAB_PAST)}
              >
                Past
              </button>
            </div>
          </div>

          {eventsLoading && !eventsLoaded ? (
            <div className="manager-dashboard-loading"><EventsSkeleton /></div>
          ) : eventsError && !events.length ? (
            <div className="manager-dashboard-empty">Failed to load events</div>
          ) : paginatedEvents.length === 0 ? (
            <div className="manager-dashboard-empty">No events found</div>
          ) : (
            <>
              <div className="manager-dashboard-events-list">
                {paginatedEvents.map((event) => (
                  <EventListingRow
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                    renderActions={(ev) => (
                      <>
                        <button
                          type="button"
                          className="manager-dashboard-event-action-btn"
                          onClick={() => handleEventClick(ev)}
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
                              onClick={() => handleDeleteEvent(ev)}
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
              {filteredEvents.length > ITEMS_PER_PAGE && (
                <div className="buyer-dashboard-pagination">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </button>
                  <span className="buyer-dashboard-pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

