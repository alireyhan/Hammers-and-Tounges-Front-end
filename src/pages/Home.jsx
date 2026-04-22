import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchEvents } from '../store/actions/AuctionsActions'
import Hero from '../components/Hero'
import EventListingRow from '../components/EventListingRow'
import './Home.css'

const TAB_UPCOMING = 'upcoming'
const TAB_CURRENT = 'current'
const TAB_PAST = 'past'

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
)

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { token } = useSelector(state => state.auth)
  const { events, eventsLoading, eventsError, eventsLoaded, eventsCount } = useSelector(state => state.buyer)

  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState(TAB_CURRENT)
  const [searchQuery, setSearchQuery] = useState('')
  const timeframe =
    activeTab === TAB_UPCOMING ? 'upcoming' : activeTab === TAB_CURRENT ? 'current' : 'past'
  const filteredEvents = events || []

  useEffect(() => {
    dispatch(fetchEvents({
      timeframe,
      search: searchQuery.trim() || undefined,
      page,
      page_size: 12,
    }))
  }, [dispatch, timeframe, searchQuery, page])

  const itemsPerPage = 12
  const totalPages = Math.max(1, Math.ceil((eventsCount || 0) / itemsPerPage))
  const paginatedEvents = filteredEvents

  useEffect(() => {
    setPage(1)
  }, [activeTab, searchQuery])

  const handleEventClick = (event) => {
    if (token) {
      navigate(`/buyer/event/${event.id}`, { state: { event } })
    } else {
      navigate(`/event/${event.id}`, { state: { event } })
    }
  }

  return (
    <div className="home-page">
      <Hero />

      <section className="home-events">
        <div className="home-events__container">
          <div className="home-events__tabs-wrap">
            <div className="home-events__tabs">
              <button
                className={`home-events__tab ${activeTab === TAB_UPCOMING ? 'active' : ''}`}
                onClick={() => setActiveTab(TAB_UPCOMING)}
              >
                Upcoming
              </button>
              <button
                className={`home-events__tab ${activeTab === TAB_CURRENT ? 'active' : ''}`}
                onClick={() => setActiveTab(TAB_CURRENT)}
              >
                Current
              </button>
              <button
                className={`home-events__tab ${activeTab === TAB_PAST ? 'active' : ''}`}
                onClick={() => setActiveTab(TAB_PAST)}
              >
                Past
              </button>
            </div>
            <span className="home-events__count">
              {eventsLoading && !eventsLoaded ? '...' : `${eventsCount || 0} events`}
            </span>
          </div>
          <div className="home-events__search-wrap">
            <input
              type="search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="home-events__search"
              aria-label="Search events"
            />
          </div>

          {eventsLoading && !eventsLoaded && (
            <div className="home-loading">
              <EventsSkeleton />
            </div>
          )}

          {eventsError && !eventsLoading && !events.length && (
            <div className="home-error">
              <p>Failed to load events</p>
              <button
                onClick={() =>
                  dispatch(
                    fetchEvents({
                      forceRefresh: true,
                      timeframe,
                      search: searchQuery.trim() || undefined,
                      page,
                      page_size: itemsPerPage,
                    })
                  )
                }
              >
                Retry
              </button>
            </div>
          )}

          {!eventsLoading && !eventsError && (eventsCount || 0) === 0 && (
            <div className="home-empty">
              <p>
                {activeTab === TAB_UPCOMING
                  ? 'No upcoming events.'
                  : activeTab === TAB_CURRENT
                    ? 'No current events.'
                    : 'No past events.'}
              </p>
            </div>
          )}

          {!eventsLoading && !eventsError && paginatedEvents.length > 0 && (
            <>
              <div className="home-events-list">
                {paginatedEvents.map((event) => (
                  <EventListingRow
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
              </div>

              {(eventsCount || 0) > itemsPerPage && (
                <div className="home-pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="home-pagination__btn"
                  >
                    Previous
                  </button>
                  <span className="home-pagination__info">{page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="home-pagination__btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
