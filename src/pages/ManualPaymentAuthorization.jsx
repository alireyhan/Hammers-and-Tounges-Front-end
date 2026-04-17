import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ManualPaymentAuthorization.css";

const ManualPaymentAuthorization = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const initialData = [
    {
      id: 1,
      officer: "John Doe",
      date: "2025-01-10",
      amount: 1200,
      details: "Manual payout request for Vendor Alpha",
      status: "Pending",
    },
    {
      id: 2,
      officer: "Michael Smith",
      date: "2025-01-11",
      amount: 850,
      details: "Wallet top-up correction",
      status: "Pending",
    },
    {
      id: 3,
      officer: "Sarah Johnson",
      date: "2025-01-09",
      amount: 2350,
      details: "Emergency vendor payment",
      status: "Approved",
    },
    {
      id: 4,
      officer: "Robert Chen",
      date: "2025-01-12",
      amount: 560,
      details: "System error refund",
      status: "Rejected",
    },
    {
      id: 5,
      officer: "Emily Davis",
      date: "2025-01-08",
      amount: 1890,
      details: "Manual commission payout",
      status: "Pending",
    },
    {
      id: 6,
      officer: "David Wilson",
      date: "2025-01-13",
      amount: 750,
      details: "Customer refund processing",
      status: "Pending",
    },
  ];
  useEffect(() => {
    setPayments(initialData);
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.officer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.amount.toString().includes(searchQuery);

      const matchesStatus = !statusFilter || payment.status === statusFilter;
      const matchesOfficer = !officerFilter || payment.officer === officerFilter;
      const matchesDate = !dateFilter || payment.date === dateFilter;

      return matchesSearch && matchesStatus && matchesOfficer && matchesDate;
    });
  }, [payments, searchQuery, statusFilter, officerFilter, dateFilter]);

  const uniqueOfficers = useMemo(() => {
    const officers = payments.map((p) => p.officer);
    return [...new Set(officers)];
  }, [payments]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusUpdate = (id, newStatus) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id ? { ...payment, status: newStatus } : payment
      )
    );
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setOfficerFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "manual-status approved";
      case "rejected":
        return "manual-status rejected";
      default:
        return "manual-status pending";
    }
  };

  return (
    <div className="manual-auth-container">
      {/* Header */}
      <div className="manual-auth-header">
        <div>
          <h1 className="manual-auth-title">Cash Deposit Authorization</h1>
          <p className="manual-auth-subtitle">
            Review and authorize cash deposit requests
          </p>
        </div>
        <div className="welcome-actions">
          <button className="action-button primary" onClick={
            ()=> navigate('/admin/finance/manual-payments')
          }>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Cash Deposit Entry
          </button>

        </div>
        
      </div>

      <div className="finance-filters-section">
        <div className="filters-container">
          <div className="search-section">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search By Request ID, Requester, or Payee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="manual-auth-table-section">
        <div className="results-header">
          <p className="manual-results-info">
            Showing {filteredPayments.length} request{filteredPayments.length !== 1 ? 's' : ''}
            {filteredPayments.length !== payments.length && ` (filtered from ${payments.length})`}
          </p>
        </div>

        <div className="manual-table-wrapper">
          <table className="manual-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Details</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="manual-empty-state">
                      <svg
                        width="60"
                        height="60"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="1.5"
                      >
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <h3>No Cash Deposit Requests Found</h3>
                      <p>Try adjusting your filters or search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="manual-table-row">
                    <td>
                      <div className="officer-cell">
                        <div className="officer-avatar">
                          <svg viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z" />
                            <path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
                          </svg>
                        </div>
                        <span className="officer-name">{payment.officer}</span>
                      </div>
                    </td>
                    <td>
                      <span className="manual-details">{payment.details}</span>
                    </td>
                    <td>
                      <span className="date-text">{payment.date}</span>
                    </td>
                    <td>
                      <span className="manual-amount positive">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className={getStatusClass(payment.status)}>
                        {payment.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="manual-pagination">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="manual-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      className={`manual-pagination-page ${currentPage === page ? "active" : ""}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
            </div>

            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualPaymentAuthorization;