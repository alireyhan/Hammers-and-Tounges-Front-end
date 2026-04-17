import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchEvents } from '../store/actions/AuctionsActions'
import Hero from '../components/Hero'
import EventListingRow from '../components/EventListingRow'
import { normalizeEventStatusForFilter } from '../utils/eventStatus'
import './Home.css'

const TAB_UPCOMING = 'upcoming'
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
  const { events, eventsLoading, eventsError, eventsLoaded } = useSelector(state => state.buyer)

  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState(TAB_UPCOMING)
  const filteredEvents = useMemo(() => {
    if (!events.length) return []
    const now = new Date()
    if (activeTab === TAB_UPCOMING) {
      return events.filter((e) => {
        const end = e.end_time ? new Date(e.end_time) : null
        const status = normalizeEventStatusForFilter(e)
        if (status === 'CLOSED' || status === 'CLOSING') return false
        return !end || end > now
      })
    }
    return events.filter((e) => {
      const end = e.end_time ? new Date(e.end_time) : null
      const status = normalizeEventStatusForFilter(e)
      if (status === 'CLOSED' || status === 'CLOSING') return true
      return end && end <= now
    })
  }, [events, activeTab])

  useEffect(() => {
    dispatch(fetchEvents({}))
  }, [dispatch])

  const itemsPerPage = 12
  const totalPages = Math.ceil((filteredEvents.length || 0) / itemsPerPage)
  const paginatedEvents = (filteredEvents || []).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  useEffect(() => {
    setPage(1)
  }, [activeTab])

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
                className={`home-events__tab ${activeTab === TAB_PAST ? 'active' : ''}`}
                onClick={() => setActiveTab(TAB_PAST)}
              >
                Past
              </button>
            </div>
            <span className="home-events__count">
              {eventsLoading && !eventsLoaded ? '...' : `${filteredEvents.length} events`}
            </span>
          </div>

          {eventsLoading && !eventsLoaded && (
            <div className="home-loading">
              <EventsSkeleton />
            </div>
          )}

          {eventsError && !eventsLoading && !events.length && (
            <div className="home-error">
              <p>Failed to load events</p>
              <button onClick={() => dispatch(fetchEvents({ forceRefresh: true }))}>Retry</button>
            </div>
          )}

          {!eventsLoading && !eventsError && paginatedEvents.length === 0 && (
            <div className="home-empty">
              <p>{activeTab === TAB_UPCOMING ? 'No upcoming events.' : 'No past events.'}</p>
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

              {filteredEvents.length > itemsPerPage && (
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
