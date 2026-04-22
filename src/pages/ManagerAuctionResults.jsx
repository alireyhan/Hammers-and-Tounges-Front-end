import React, { useState, useMemo } from "react";
import "./ManagerAuctionResults.css";

const DATA = [
  { lot: "001", item: "Rolex Daytona Ref. 6263", bid: 75000, bidder: "BIDDER-A487", reserve: "Met", status: "Payment Received" },
  { lot: "002", item: "Patek Philippe Calatrava", bid: 22500, bidder: "BIDDER-C901", reserve: "Met", status: "Invoice Sent" },
  { lot: "003", item: "Omega Speedmaster Moonwatch", bid: 0, bidder: "Unsold", reserve: "Not Met", status: "Unsold" },
  { lot: "004", item: "TAG Heuer Carrera", bid: 4800, bidder: "BIDDER-F2E5", reserve: "Met", status: "Payment Pending" },
  { lot: "005", item: "Vintage Rolex Submariner", bid: 16000, bidder: "BIDDER-K447", reserve: "Met", status: "Payment Received" },
  { lot: "006", item: "Cartier Tank", bid: 14000, bidder: "BIDDER-X882", reserve: "Met", status: "Invoice Sent" },
  { lot: "007", item: "Breitling Navitimer", bid: 8500, bidder: "BIDDER-M123", reserve: "Met", status: "Payment Received" },
  { lot: "008", item: "IWC Portuguese", bid: 12000, bidder: "BIDDER-P456", reserve: "Met", status: "Invoice Sent" },
];

const ROWS_PER_PAGE = 5;

export default function ManagerAuctionResults() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    return DATA.filter((item) => {
      const searchMatch =
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.bidder.toLowerCase().includes(search.toLowerCase()) ||
        item.lot.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === "All" || item.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredData, page]);

  function generatePageNumbers() {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }

  const exportResults = () => {
    const headers = ["Lot", "Item", "Bid", "Bidder", "Reserve", "Status"];
    const csvRows = filteredData.map(d =>
      `${d.lot},${d.item},${d.bid},${d.bidder},${d.reserve},${d.status}`
    );
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const link = document.createElement("a");
    link.href = csv;
    link.download = "auction_results.csv";
    link.click();
  };

  const stats = [
    { 
      title: "Total Hammer Price", 
      value: "$1,245,600",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="1" x2="12" y2="23" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#3B82F6"
    },
    { 
      title: "Sell-Through Rate", 
      value: "92%",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#39AE47"
    },
    { 
      title: "Total Lots Sold", 
      value: "138",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="22 4 12 14.01 9 11.01" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#A855F7"
    },
    { 
      title: "Lots Unsold", 
      value: "12",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#EF4444"
    },
  ];

  return (
    <div className="results-wrapper">
      <div className="results-container">

        <div className="results-section-header">
          <div className="results-header-content">
            <h1 className="results-page-title">Auction Results: Vintage Watch Collection</h1>
            <p className="results-page-subtitle">24 Oct 2024 - Review winning bids, financial status, and next steps for the auction</p>
          </div>
          <div className="results-header-actions">
            <button className="results-export-btn" onClick={exportResults}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Results
            </button>
          </div>
        </div>

        <div className="results-stats-grid">
          {stats.map((stat, index) => (
            <div className="results-stat-card" key={index}>
              <div className="results-card-bg-gradient" style={{ background: `linear-gradient(135deg, ${stat.color}33 0%, ${stat.color}0D 100%)` }}></div>
              <div className="results-card-icon-container">
                <div className="results-card-icon" style={{ backgroundColor: `${stat.color}26` }}>
                  {stat.icon}
                </div>
              </div>
              <div className="results-card-content">
                <span className="results-card-label">{stat.title}</span>
                <h3 className="results-card-value">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* FILTER SECTION */}
        <div className="results-filter-section">
          <div className="results-search-container">
            <div className="results-search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search by Lot, Item, or Bidder..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="results-search-input"
              />
              {search && (
                <button
                  className="results-clear-search"
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

          <div className="results-filter-buttons">
            {['All', 'Payment Received', 'Invoice Sent', 'Payment Pending', 'Unsold'].map((filter) => (
              <button
                key={filter}
                className={`results-filter-btn ${statusFilter === filter ? 'active' : ''}`}
                onClick={() => { setStatusFilter(filter); setPage(1); }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="results-data-table-section">
          <div className="results-table-wrapper">
            <table className="results-data-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Item Description</th>
                  <th>Winning Bid</th>
                  <th>Winning Bidder</th>
                  <th>Reserve Status</th>
                  <th>Financial Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, i) => (
                    <tr key={i} className="results-table-row">
                      <td>
                        <span className="results-lot-number">{row.lot}</span>
                      </td>

                      <td>
                        <span className="results-item-name">{row.item}</span>
                      </td>

                      <td>
                        <span className="results-bid-amount">
                          {row.bid ? `$${row.bid.toLocaleString()}` : '—'}
                        </span>
                      </td>

                      <td>
                        <span className="results-bidder-id">{row.bidder}</span>
                      </td>

                      <td>
                        <div className="results-status-cell">
                          <span className={`results-status-badge ${row.reserve === "Met" ? "badge-met" : "badge-not-met"}`}>
                            {row.reserve}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="results-status-cell">
                          <span className={`results-status-badge ${
                            row.status === "Payment Received" ? "badge-received" :
                            row.status === "Invoice Sent" ? "badge-sent" :
                            row.status === "Payment Pending" ? "badge-pending" :
                            "badge-unsold"
                          }`}>
                            {row.status}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="results-action-buttons">
                          <button
                            className="results-action-btn"
                            onClick={(e) => { e.stopPropagation(); alert("Actions menu"); }}
                            title="More actions"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="5" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="19" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="results-empty-state">
                        <div className="results-empty-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <h3>No results found</h3>
                        <p>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredData.length > ROWS_PER_PAGE && (
            <div className="results-pagination">
              <button
                className="results-pagination-btn results-prev-btn"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Previous
              </button>

              <div className="results-page-numbers">
                {generatePageNumbers().map((p, index) => (
                  p === '...' ? (
                    <span key={`dots-${index}`} className="results-page-dots">...</span>
                  ) : (
                    <button
                      key={p}
                      className={`results-page-number ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button
                className="results-pagination-btn results-next-btn"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}