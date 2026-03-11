import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../store/actions/AuctionsActions';
import { clearBuyerError } from '../store/slices/buyerSlice';
import './BuyerDashboard.css';
import { toast } from 'react-toastify';

const formatEventDate = (isoStr) => {
  if (!isoStr) return '—';
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
    return '—';
  }
};

const StatCard = React.memo(({ icon: Icon, value, label, colorClass }) => (
  <div className="buyer-dashboard-stat-card" role="article" aria-label={`${label}: ${value}`}>
    <div className={`buyer-dashboard-stat-icon ${colorClass}`}>
      <Icon />
    </div>
    <div className="buyer-dashboard-stat-content">
      <div className="buyer-dashboard-stat-value" aria-live="polite">{value}</div>
      <div className="buyer-dashboard-stat-label">{label}</div>
    </div>
  </div>
));

const EventRow = React.memo(({ event, onClick, formatEventDate }) => (
  <tr
    className="buyer-dashboard-event-row"
    onClick={() => onClick(event)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick(event)}
  >
    <td className="buyer-dashboard-event-cell buyer-dashboard-event-cell--title">
      <div className="buyer-dashboard-event-cell__title">{event.title || 'Untitled Event'}</div>
      <div className="buyer-dashboard-event-cell__lots">{event.lots_count ?? 0} lots</div>
    </td>
    <td className="buyer-dashboard-event-cell buyer-dashboard-event-cell--date">
      {formatEventDate(event.start_time)} – {formatEventDate(event.end_time)}
    </td>
    <td className="buyer-dashboard-event-cell buyer-dashboard-event-cell--status">
      <span className="buyer-dashboard-status-badge buyer-dashboard-status-badge--live">
        {event.status || 'Live'}
      </span>
    </td>
    <td className="buyer-dashboard-event-cell buyer-dashboard-event-cell--action">
      <span className="buyer-dashboard-event-arrow">View lots →</span>
    </td>
  </tr>
));

EventRow.displayName = 'EventRow';

const ITEMS_PER_PAGE = 15;

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { events, eventsLoading, eventsError } = useSelector(state => state.buyer);

  // Filter events: show only LIVE (currently running)
  const liveEvents = useMemo(() => {
    if (!events?.length) return [];
    return events.filter((e) => (e.status || '').toUpperCase() === 'LIVE');
  }, [events]);

  // Search filter
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return liveEvents;
    const q = searchQuery.toLowerCase().trim();
    return liveEvents.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q)
    );
  }, [liveEvents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleEventClick = useCallback((event) => {
    navigate(`/buyer/event/${event.id}`, { state: { event } });
  }, [navigate]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(fetchEvents({}));
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearBuyerError());
    };
  }, [dispatch]);

  const statCards = useMemo(
    () => [
      {
        icon: () => (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        value: filteredEvents.length.toLocaleString(),
        label: 'Live Events',
        colorClass: 'buyer-dashboard-icon-auctions',
      },
    ],
    [filteredEvents.length],
  );

  return (
    <div className="buyer-dashboard-container" role="main">
      <header className="buyer-dashboard-header">
        <div className="buyer-dashboard-header-content">
          <h1 className="buyer-dashboard-title">Buyer Dashboard</h1>
          <p className="buyer-dashboard-subtitle">
            Browse events and bid on lots
          </p>
        </div>
      </header>

      <section className="buyer-dashboard-stats-overview" aria-label="Statistics overview">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </section>

      <div className="buyer-dashboard-main">
        <section className="buyer-dashboard-card" aria-label="Available events">
          <div className="buyer-dashboard-card-header">
            <h2 className="buyer-dashboard-card-title">Live Events</h2>
            {liveEvents.length > 0 && (
              <span className="buyer-dashboard-auction-count">({searchQuery.trim() ? filteredEvents.length : liveEvents.length})</span>
            )}
            {liveEvents.length > 0 && (
              <div className="buyer-dashboard-search-wrap">
                <input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="buyer-dashboard-search"
                  aria-label="Search events"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    className="buyer-dashboard-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {eventsLoading && liveEvents.length === 0 && (
            <div className="auctions-loading">
              <div className="auctions-spinner"></div>
              <p>Loading events...</p>
            </div>
          )}

          {eventsError && !eventsLoading && liveEvents.length === 0 && (
            <div className="auctions-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="auctions-error-message">
                {eventsError?.message || eventsError?.detail || 'Failed to load events'}
              </p>
              <button
                className="auctions-retry-btn"
                onClick={() => dispatch(fetchEvents({}))}
              >
                Retry
              </button>
            </div>
          )}

          {!eventsLoading && !eventsError && liveEvents.length === 0 && (
            <div className="auctions-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2>No live events</h2>
              <p>There are no live events right now. Check back when auctions are running.</p>
            </div>
          )}

          {!eventsLoading && !eventsError && liveEvents.length > 0 && filteredEvents.length === 0 && (
            <div className="auctions-empty">
              <h2>No matching events</h2>
              <p>Try a different search term or clear your search.</p>
              <button
                className="auctions-retry-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            </div>
          )}

          {!eventsLoading && !eventsError && filteredEvents.length > 0 && (
            <>
              <div className="buyer-dashboard-events-table-wrap">
                <table className="buyer-dashboard-events-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onClick={handleEventClick}
                        formatEventDate={formatEventDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="buyer-dashboard-pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="buyer-dashboard-pagination-info">
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
        </section>
      </div>
    </div>
  );
};

export default BuyerDashboard;
