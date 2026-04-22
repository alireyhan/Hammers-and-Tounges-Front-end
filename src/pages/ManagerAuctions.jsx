import React, { useState, useEffect, useMemo } from "react";
import "./ManagerAuctions.css";
import { Link, useNavigate } from "react-router-dom";
import { managerService } from '../services/interceptors/manager.service';

export default function ManagerAuctions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await managerService.getAssignedTasks();
        // Transform API response to auction format and filter for ACTIVE and APPROVED statuses
        const transformedData = Array.isArray(response) ? response
          .filter(item => item.status === 'ACTIVE' || item.status === 'APPROVED') // Show both ACTIVE and APPROVED status items
          .map((item) => ({
            name: item.title || 'Untitled Auction',
            id: `#AUC-${item.id}`,
            originalId: item.id,
            status: item.status === 'ACTIVE' ? "Live" : "Approved", // Map ACTIVE to "Live" and APPROVED to "Approved" for display
            start: item.start_date ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            end: item.end_date ? new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            lots: 0, // Not available in API response
            value: item.initial_price ? `$${parseFloat(item.initial_price).toLocaleString()}` : '$0.00',
            rawData: item // Keep original data for reference
          })) : [];
        setTasks(transformedData);
      } catch (err) {
        console.error('Error fetching manager tasks:', err);
        setError(err.message || 'Failed to load auctions. Please try again.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredData = useMemo(() => {
    return tasks.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      const matchFilter = activeFilter === "All" || item.status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [tasks, search, activeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  function generatePageNumbers() {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }

  const getAuctionIcon = (name) => {
    if (name.toLowerCase().includes('watch')) return '⌚';
    if (name.toLowerCase().includes('art') || name.toLowerCase().includes('sculpture')) return '🎨';
    if (name.toLowerCase().includes('jewelry')) return '💎';
    if (name.toLowerCase().includes('furniture')) return '🪑';
    if (name.toLowerCase().includes('car')) return '🚗';
    if (name.toLowerCase().includes('book')) return '📚';
    if (name.toLowerCase().includes('camera')) return '📷';
    if (name.toLowerCase().includes('coin')) return '🪙';
    return '🏷️';
  };

  const handleRowClick = (item) => {
    const rawStatus = item.rawData?.status || item.status;
    
    if (rawStatus === "APPROVED") {
      // Navigate to details view for APPROVED auctions
      navigate("/manager/auction-details", {
        state: { auctionData: item.rawData }
      });
    } else if (rawStatus === "ACTIVE") {
      // Navigate to control panel for ACTIVE auctions
      navigate("/manager/controlpanel", {
        state: { auctionData: item.rawData }
      });
    } else if (item.status === "Draft") {
      navigate("/manager/publishnew");
    } else {
      navigate("/manager/controlpanel", {
        state: { auctionData: item.rawData }
      });
    }
  };

  return (
    <div className="auction-wrapper">
      <div className="auction-container">
        <div className="auction-section-header">
          <div className="auction-header-content">
            <h1 className="auction-page-title">All Auctions</h1>
            <p className="auction-page-subtitle">Manage and monitor all auction events</p>
          </div>
          {/* <div className="auction-header-actions">
            <Link to="/manager/publishnew" className="auction-primary-action-btn-link">
              <button className="auction-primary-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create New Auction
              </button>
            </Link>
          </div> */}
        </div>

   
        <div className="auction-stats-grid">
          <div className="auction-stat-card">
            <div className="auction-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)' }}></div>
            <div className="auction-card-icon-container">
              <div className="auction-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="manager-auction-card-content">
              <span className="m-auction-card-label">Active Bidders</span>
              <h3 className="auction-card-value"></h3>
              <span className="auction-card-change positive">0</span>
            </div>
          </div>

          <div className="auction-stat-card">
            <div className="auction-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(140, 198, 63, 0.2) 0%, rgba(140, 198, 63, 0.05) 100%)' }}></div>
            <div className="auction-card-icon-container">
              <div className="auction-card-icon" style={{ backgroundColor: 'rgba(140, 198, 63, 0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="manager-auction-card-content">
              <span className="m-auction-card-label">Total Lots</span>
              <h3 className="auction-card-value"></h3>
              <span className="auction-card-change positive">0</span>
            </div>
          </div>

          <div className="auction-stat-card">
            <div className="auction-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)' }}></div>
            <div className="auction-card-icon-container">
              <div className="auction-card-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="2" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="manager-auction-card-content">
              <span className="m-auction-card-label">Live Auctions</span>
              <h3 className="auction-card-value"></h3>
              <span className="auction-card-change positive">0</span>
            </div>
          </div>
        </div>

        <div className="auction-filter-section">
          <div className="auction-search-container">
            <div className="auction-search-input-wrapper">
              <button className='admin-search-btn'>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search by Name or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="auction-search-input"
              />
              {search && (
                <button
                  className="auction-clear-search"
                  onClick={() => { setSearch(''); setCurrentPage(1); }}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="auction-filter-buttons">
            {['All','Live', 'Draft'].map((filter) => (
              <button
                key={filter}
                className={`auction-filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="auction-data-table-section">

          <div className="auction-table-wrapper">
            <table className="auction-data-table">
              <thead>
                <tr>
                  <th className="auction-table-name">Auction Name / ID</th>
                  <th className="auction-table-status">Status</th>
                  <th className="auction-table-start">Start Date</th>
                  <th className="auction-table-end">End Date</th>
                  <th className="auction-table-lots">Lots</th>
                  <th className="auction-table-value">Current Value</th>
                  {/* <th className="auction-table-actions">Actions</th> */}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <div className="auction-empty-state">
                        <div className="auction-empty-icon" style={{ animation: 'spin 1s linear infinite' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="16" opacity="0.3"/>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="16" className="spinner-circle"/>
                          </svg>
                        </div>
                        <h3>Loading auctions...</h3>
                        <p>Please wait while we fetch your active auctions</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7">
                      <div className="auction-empty-state">
                        <div className="auction-empty-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <h3>Error loading auctions</h3>
                        <p>{error}</p>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="auction-primary-action-btn"
                          style={{ marginTop: '1rem' }}
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className="auction-table-row"
                      onClick={() =>  handleRowClick(item)}
                    >
                      <td className="auction-table-name">
                        <div className="admin-auction-name-info">
                          <div className="admin-auction-icon-cell">
                            <span className="auction-icon-emoji">{getAuctionIcon(item.name)}</span>
                          </div>
                          <div className="admin-auction-details">
                            <h4 className="auction-name">{item.name}</h4>
                            <span className="auction-id">{item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="auction-table-status">
                        <div className="auction-status-cell">
                          <span className={`auction-status-badge ${
                            item.status === "Live" ? "badge-live" :
                            item.status === "Approved" ? "badge-approved" :
                            item.status === "Draft" ? "badge-draft" :
                            "badge-draft"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </td>

                      <td className="auction-table-start">
                        <span className="auction-date">{item.start}</span>
                      </td>

                      <td className="auction-table-end">
                        <span className="auction-date">{item.end}</span>
                      </td>

                      <td className="auction-table-lots">
                        <span className="auction-lots">{item.lots}</span>
                      </td>

                      <td className="auction-table-value">
                        <span className="auction-value">{item.value}</span>
                      </td>

                      {/* <td className="auction-table-actions">
                        <div className="auction-action-buttons">
                          <button
                            className="auction-action-btn auction-view-btn"
                            onClick={(e) => { e.stopPropagation(); alert("View clicked"); }}
                            title="View auction"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            className="auction-action-btn auction-edit-btn"
                            onClick={(e) => { e.stopPropagation(); alert("Edit clicked"); }}
                            title="Edit auction"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            className="auction-action-btn auction-more-btn"
                            onClick={(e) => { e.stopPropagation(); alert("More clicked"); }}
                            title="More options"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="5" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="19" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="auction-empty-state">
                        <div className="auction-empty-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <h3>No auctions found</h3>
                        <p>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredData.length > itemsPerPage && (
            <div className="auction-pagination">
              <button
                className="auction-pagination-btn auction-prev-btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>

              <div className="auction-page-numbers">
                {generatePageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`dots-${index}`} className="auction-page-dots">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`auction-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="auction-pagination-btn auction-next-btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}