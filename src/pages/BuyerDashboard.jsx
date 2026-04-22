import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../store/actions/AuctionsActions';
import { clearBuyerError } from '../store/slices/buyerSlice';
import EventListingRow from '../components/EventListingRow';
import './BuyerDashboard.css';

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

StatCard.displayName = 'StatCard';

const TAB_UPCOMMING = 'upcomming';
const TAB_CURRENT = 'current';
const TAB_PAST = 'past';
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

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState(TAB_CURRENT);

  const { events, eventsLoading, eventsError, eventsLoaded, eventsCount } = useSelector(state => state.buyer);
  const filteredEvents = events || [];
  const totalPages = Math.max(1, Math.ceil((eventsCount || 0) / ITEMS_PER_PAGE));
  const paginatedEvents = filteredEvents;
  const timeframe =
    activeTab === TAB_UPCOMMING ? 'upcomming' : activeTab === TAB_CURRENT ? 'current' : 'past';

  const handleEventClick = useCallback((event) => {
    navigate(`/buyer/event/${event.id}`, { state: { event } });
  }, [navigate]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    dispatch(
      fetchEvents({
        timeframe,
        search: searchQuery.trim() || undefined,
        page,
        page_size: ITEMS_PER_PAGE,
      })
    );
  }, [dispatch, timeframe, searchQuery, page]);

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
        label:
          activeTab === TAB_UPCOMMING
            ? 'Upcomming Events'
            : activeTab === TAB_CURRENT
              ? 'Current Events'
              : 'Past Events',
        colorClass: 'buyer-dashboard-icon-auctions',
      },
    ],
    [filteredEvents.length, activeTab],
  );

  return (
    <div className="buyer-dashboard-container" role="main">
      <header className="buyer-dashboard-header">
        <div className="buyer-dashboard-header-content">
          <h1 className="buyer-dashboard-title">Live Auction</h1>
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
            <div className="buyer-dashboard-tabs-wrap">
              <div className="buyer-dashboard-tabs">
                <button
                  type="button"
                  className={`buyer-dashboard-tab ${activeTab === TAB_UPCOMMING ? 'active' : ''}`}
                  onClick={() => setActiveTab(TAB_UPCOMMING)}
                >
                  Upcomming
                </button>
                <button
                  type="button"
                  className={`buyer-dashboard-tab ${activeTab === TAB_CURRENT ? 'active' : ''}`}
                  onClick={() => setActiveTab(TAB_CURRENT)}
                >
                  Current
                </button>
                <button
                  type="button"
                  className={`buyer-dashboard-tab ${activeTab === TAB_PAST ? 'active' : ''}`}
                  onClick={() => setActiveTab(TAB_PAST)}
                >
                  Past
                </button>
              </div>
              <span className="buyer-dashboard-tabs-count">
                {eventsLoading && !events?.length ? '...' : `${eventsCount || 0} events`}
              </span>
            </div>
            <div className="buyer-dashboard-card-header-row">
              <h2 className="buyer-dashboard-card-title">
                {activeTab === TAB_UPCOMMING
                  ? 'Upcomming Events'
                  : activeTab === TAB_CURRENT
                    ? 'Current Events'
                    : 'Past Events'}
              </h2>
              {(eventsCount || 0) > 0 && (
                <span className="buyer-dashboard-auction-count">({eventsCount || 0})</span>
              )}
              {(eventsCount || 0) > 0 && (
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
          </div>

          {eventsLoading && !eventsLoaded && (
            <div className="auctions-loading">
              <EventsSkeleton />
            </div>
          )}

          {eventsError && !eventsLoading && !events?.length && (
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
                onClick={() =>
                  dispatch(
                    fetchEvents({
                      forceRefresh: true,
                      timeframe,
                      search: searchQuery.trim() || undefined,
                      page,
                      page_size: ITEMS_PER_PAGE,
                    })
                  )
                }
              >
                Retry
              </button>
            </div>
          )}

          {!eventsLoading && !eventsError && (eventsCount || 0) === 0 && (
            <div className="auctions-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2>
                {activeTab === TAB_UPCOMMING
                  ? 'No upcomming events'
                  : activeTab === TAB_CURRENT
                    ? 'No current events'
                    : 'No past events'}
              </h2>
              <p>
                {activeTab === TAB_UPCOMMING
                  ? 'There are no upcomming events at the moment. Check back later.'
                  : activeTab === TAB_CURRENT
                    ? 'No current events to display.'
                    : 'No past events to display.'}
              </p>
            </div>
          )}

          {!eventsLoading && !eventsError && filteredEvents.length > 0 && (
            <>
              <div className="buyer-dashboard-events-list">
                {paginatedEvents.map((event) => (
                  <EventListingRow
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
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
