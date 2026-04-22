import React, { useState, useMemo, useEffect } from "react";
import "./ManagerLiveAuctions.css";
import { useNavigate } from "react-router-dom";
import { auctionService } from '../services/interceptors/auction.service';
import EventListingRow from "../components/EventListingRow";

const ROWS_PER_PAGE = 5;

export default function ManagerLiveAuctions() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const allEvents = await auctionService.fetchAllEvents();
      const completedEvents = allEvents.filter((e) => {
        const s = (e.status || '').toUpperCase();
        return s === 'CLOSED' || s === 'CLOSING';
      });
      setEvents(completedEvents);
    } catch (err) {
      console.error('Error fetching completed auctions:', err);
      setError(err.message || 'Failed to load completed auctions. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredData = useMemo(() => {
    return events.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const matchSearch = !search || title.includes(search.toLowerCase());

      let matchDate = true;
      if (date) {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const eventDate = new Date(item.end_time || item.start_time || 0);
        eventDate.setHours(0, 0, 0, 0);
        matchDate = eventDate.getTime() === selectedDate.getTime();
      }

      return matchSearch && matchDate;
    });
  }, [events, search, date]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredData, page]);

  return (
    <div className="live-auction-wrapper">
      <div className="live-auction-container">

        <div className="live-auction-section-header">
          <div className="live-auction-header-content">
            <h1 className="live-auction-page-title">Completed Auctions</h1>
            <p className="live-auction-page-subtitle">View all completed and approved auction items</p>
          </div>
        </div>

        <div className="live-auction-filter-section">
          <div className="live-auction-search-container">
            <div className="live-auction-search-input-wrapper">
              <button className='admin-search-btn'>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search by event name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="live-auction-search-input"
              />
              {search && (
                <button
                  className="live-auction-clear-search"
                  onClick={() => { setSearch(''); setPage(1); }}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="live-auction-date-input"
          />
        </div>

        {/* LIST (same design as Home events list) */}
        <div className="live-auction-list-section">
          {loading ? (
            <div className="home-loading">
              <div className="home-spinner" />
              <p>Loading completed auctions...</p>
            </div>
          ) : error ? (
            <div className="home-error">
              <p>{error}</p>
              <button
                onClick={() => fetchEvents()}
              >
                Retry
              </button>
            </div>
          ) : paginatedData.length > 0 ? (
            <div className="home-events-list">
              {paginatedData.map((event) => (
                <EventListingRow
                  key={event.id}
                  event={event}
                  onClick={(e) => navigate(`/manager/event/${e.id}`, { state: { event: e } })}
                />
              ))}
            </div>
          ) : (
            <div className="home-empty">
              <p>No completed auctions found</p>
              <p>Try adjusting your search or date filter</p>
            </div>
          )}

          {/* PAGINATION (Home style) */}
          {filteredData.length > ROWS_PER_PAGE && !loading && !error && (
            <div className="home-pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="home-pagination__btn"
              >
                Previous
              </button>
              <span className="home-pagination__info">
                {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="home-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}