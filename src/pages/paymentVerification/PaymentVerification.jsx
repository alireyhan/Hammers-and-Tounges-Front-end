import React, { useState } from "react";
import "./PaymentVerification.css";

const PaymentVerification = () => {
    const [selectedDeposit, setSelectedDeposit] = useState(1);
    const [selectedLog, setSelectedLog] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("today");
    const [verificationStatus, setVerificationStatus] = useState("unverified");

    const handleFlagForReview = () => {
        console.log("Flagging transaction for review");
        // Add your flag logic here
    };

    const handleVerifyAndMatch = () => {
        console.log("Verifying and matching transaction");
        // Add your verification logic here
    };

    return (
        <div className="dashboard-page">

            <main className="dashboard-main">
                <div className="dashboard-container">
                    <div className="payment-verification-header">
                        <div className="welcome-content">
                            <h1 className="welcome-title">Payment Verification</h1>
                            <p className="welcome-subtitle">Match deposits against gateway logs to validate transactions</p>
                        </div>
                    </div>

                    <div className="verification-stats">
                        <div className="verification-stat-card">
                            <div className="stat-background" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' }}></div>
                            <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Awaiting Verification</span>
                                <span className="stat-value">42</span>
                                <span className="stat-sublabel">Transactions pending review</span>
                            </div>
                        </div>

                        <div className="verification-stat-card">
                            <div className="stat-background" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)' }}></div>
                            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Flagged for Review</span>
                                <span className="stat-value">5</span>
                                <span className="stat-sublabel">Requires attention</span>
                            </div>
                        </div>
                    </div>

                    <div className="verification-filters">
                        <div className="search-section">
                            <div className="search-input-wrapper">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by invoice #, customer name, or transaction ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button 
                                        className="clear-search"
                                        onClick={() => setSearchTerm("")}
                                        aria-label="Clear search"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-controls">
                            <div className="filter-group">
                                <label className="filter-label">Date Range</label>
                                <div className="filter-select-wrapper">
                                    <select 
                                        className="filter-select"
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                    >
                                        <option value="today">Today</option>
                                        <option value="yesterday">Yesterday</option>
                                        <option value="last7">Last 7 Days</option>
                                        <option value="last30">Last 30 Days</option>
                                        <option value="all">All Time</option>
                                    </select>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Status</label>
                                <div className="filter-select-wrapper">
                                    <select 
                                        className="filter-select"
                                        value={verificationStatus}
                                        onChange={(e) => setVerificationStatus(e.target.value)}
                                    >
                                        <option value="unverified">Unverified</option>
                                        <option value="mismatched">Mismatched</option>
                                        <option value="verified">Verified</option>
                                        <option value="flagged">Flagged</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="verification-content">
                        <div className="verification-column">
                            <div className="column-header">
                                <h3 className="column-title">Unverified Deposits</h3>
                                <span className="column-count">Showing 2 of 42</span>
                            </div>
                            
                            <div className="deposits-list">
                                <div 
                                    className={`deposit-item ${selectedDeposit === 1 ? 'active' : ''}`}
                                    onClick={() => setSelectedDeposit(1)}
                                >
                                    <div className="deposit-content">
                                        <div className="deposit-header">
                                            <h4 className="deposit-name">Liam Johnson</h4>
                                            <span className="deposit-date">April 15, 2024</span>
                                        </div>
                                        <p className="deposit-details">Invoice #INV-2024-001 • Online Deposit</p>
                                        <div className="deposit-footer">
                                            <div className="deposit-status">
                                                <span className="status-badge-1 unverified">Unverified</span>
                                                <span className="deposit-time">2 hours ago</span>
                                            </div>
                                            <div className="deposit-amount">$1,250.00</div>
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className={`deposit-item mismatched ${selectedDeposit === 2 ? 'active' : ''}`}
                                    onClick={() => setSelectedDeposit(2)}
                                >
                                    <div className="deposit-content">
                                        <div className="deposit-header">
                                            <h4 className="deposit-name">Olivia Chen</h4>
                                            <span className="deposit-date">April 14, 2024</span>
                                        </div>
                                        <p className="deposit-details">Invoice #INV-2024-002 • Credit Card</p>
                                        <div className="deposit-footer">
                                            <div className="deposit-status">
                                                <span className="status-badge-1 mismatched">Mismatched</span>
                                                <span className="deposit-time">1 day ago</span>
                                            </div>
                                            <div className="deposit-amount mismatched-amount">$875.50</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="deposit-item">
                                    <div className="deposit-content">
                                        <div className="deposit-header">
                                            <h4 className="deposit-name">Noah Williams</h4>
                                            <span className="deposit-date">April 13, 2024</span>
                                        </div>
                                        <p className="deposit-details">Invoice #INV-2024-003 • PayPal</p>
                                        <div className="deposit-footer">
                                            <div className="deposit-status">
                                                <span className="status-badge-1 verified">Verified</span>
                                                <span className="deposit-time">2 days ago</span>
                                            </div>
                                            <div className="deposit-amount">$2,450.00</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="verification-column">
                            <div className="column-header">
                                <h3 className="column-title">Gateway Logs</h3>
                                <div className="column-info">
                                    <span className="column-hint">Select a matching log to verify</span>
                                    <span className="column-count">Showing 2 of 15</span>
                                </div>
                            </div>
                            
                            <div className="gateway-logs">
                                <div 
                                    className={`gateway-item ${selectedLog === 1 ? 'active' : ''}`}
                                    onClick={() => setSelectedLog(1)}
                                >
                                    <div className="gateway-content">
                                        <div className="gateway-header">
                                            <h4 className="gateway-id">ch_3P3b9c2eZvKYlo2C1...</h4>
                                            <span className="gateway-time">April 15, 2024 • 09:45 AM</span>
                                        </div>
                                        <div className="gateway-details">
                                            <div className="gateway-info">
                                                <span className="gateway-method">Stripe • Visa ending in 4242</span>
                                                <div className="gateway-status">
                                                    <span className="status-badge-1 processing">Processing</span>
                                                </div>
                                            </div>
                                            <div className="gateway-amount">$1,250.00</div>
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className={`gateway-item ${selectedLog === 2 ? 'active' : ''}`}
                                    onClick={() => setSelectedLog(2)}
                                >
                                    <div className="gateway-content">
                                        <div className="gateway-header">
                                            <h4 className="gateway-id">ch_3P3a8b1dYuLXmo1B0...</h4>
                                            <span className="gateway-time">April 14, 2024 • 02:15 PM</span>
                                        </div>
                                        <div className="gateway-details">
                                            <div className="gateway-info">
                                                <span className="gateway-method">Stripe • Mastercard ending in 8888</span>
                                                <div className="gateway-status">
                                                    <span className="status-badge-1 completed">Completed</span>
                                                </div>
                                            </div>
                                            <div className="gateway-amount">$870.50</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="gateway-item">
                                    <div className="gateway-content">
                                        <div className="gateway-header">
                                            <h4 className="gateway-id">ch_3P2z7a0cXtJWkn9A9...</h4>
                                            <span className="gateway-time">April 13, 2024 • 11:30 AM</span>
                                        </div>
                                        <div className="gateway-details">
                                            <div className="gateway-info">
                                                <span className="gateway-method">PayPal • Account: john@email.com</span>
                                                <div className="gateway-status">
                                                    <span className="status-badge-1 failed">Failed</span>
                                                </div>
                                            </div>
                                            <div className="gateway-amount">$2,450.00</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="verification-actions">
                        <button className="action-button warning" onClick={handleFlagForReview}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53216 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Flag for Review
                        </button>
                        <button className="action-button primary" onClick={handleVerifyAndMatch}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Verify & Match Transaction
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentVerification;