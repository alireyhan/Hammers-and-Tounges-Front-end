import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchEvents } from '../store/actions/AuctionsActions'
import { toast } from 'react-toastify'
import Hero from '../components/Hero'
import './Home.css'

const formatEventDate = (isoStr) => {
  if (!isoStr) return '-----'
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-----'
  }
}

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { token } = useSelector(state => state.auth)
  const { events, eventsLoading, eventsError } = useSelector(state => state.buyer)

  const [page, setPage] = useState(1)
  const [allEvents, setAllEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      try {
        let results = []
        let nextPage = 1
        let hasMore = true
        while (hasMore) {
          const res = await dispatch(fetchEvents({ page: nextPage })).unwrap()
          results = [...results, ...(res.results || [])]
          hasMore = !!res.next
          nextPage += 1
        }
        setAllEvents(results)
      } catch (err) {
        setAllEvents([])
      } finally {
        setIsLoading(false)
      }
    }
    loadEvents()
  }, [dispatch])

  const itemsPerPage = 12
  const totalPages = Math.ceil((allEvents.length || 0) / itemsPerPage)
  const paginatedEvents = (allEvents || []).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

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
          <div className="home-events__top">
            <h2 className="home-events__title">Upcoming Events</h2>
            <span className="home-events__count">
              {isLoading && allEvents.length === 0 ? '...' : `${allEvents.length} events`}
            </span>
          </div>

          {isLoading && allEvents.length === 0 && (
            <div className="home-loading">
              <div className="home-spinner" />
              <p>Loading events...</p>
            </div>
          )}

          {eventsError && !isLoading && allEvents.length === 0 && (
            <div className="home-error">
              <p>Failed to load events</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!isLoading && !eventsError && paginatedEvents.length === 0 && (
            <div className="home-empty">
              <p>No upcoming events.</p>
            </div>
          )}

          {!isLoading && !eventsError && paginatedEvents.length > 0 && (
            <>
              <div className="home-events-grid">
                {paginatedEvents.map((event) => (
                  <article
                    key={event.id}
                    className="home-event-card"
                    onClick={() => handleEventClick(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event)}
                  >
                    <div className="home-event-card__header">
                      <span className={`home-event-card__status home-event-card__status--${(event.status || '').toLowerCase()}`}>
                        {event.status || '—'}
                      </span>
                      <span className="home-event-card__lots">{event.lots_count ?? 0} lots</span>
                    </div>
                    <h3 className="home-event-card__title">{event.title || 'Untitled Event'}</h3>
                    <div className="home-event-card__meta">
                      <div className="home-event-card__meta-row">
                        <span className="home-event-card__meta-label">Start</span>
                        <span className="home-event-card__meta-value">{formatEventDate(event.start_time)}</span>
                      </div>
                      <div className="home-event-card__meta-row">
                        <span className="home-event-card__meta-label">End</span>
                        <span className="home-event-card__meta-value">{formatEventDate(event.end_time)}</span>
                      </div>
                    </div>
                    <span className="home-event-card__cta">View Details →</span>
                  </article>
                ))}
              </div>

              {allEvents.length > itemsPerPage && (
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
