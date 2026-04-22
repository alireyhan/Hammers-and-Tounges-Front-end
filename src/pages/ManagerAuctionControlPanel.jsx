import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_CONFIG, getMediaUrl } from '../config/api.config';
import { managerService } from '../services/interceptors/manager.service';
import { toast } from 'react-toastify';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import "./ManagerAuctionControlPanel.css";

export default function ManagerAuctionControlPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const auctionData = location?.state?.auctionData;
  const isActive = auctionData?.status === 'ACTIVE';

  console.log("auctionData: ", auctionData);
  

  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("disputes");
  const [isEndingAuction, setIsEndingAuction] = useState(false);

  // Calculate remaining time from end_date
  const calculateRemainingTime = useMemo(() => {
    if (!auctionData?.end_date) return 0;
    const endDate = new Date(auctionData.end_date);
    const now = new Date();
    const diff = Math.max(0, Math.floor((endDate - now) / 1000)); // Difference in seconds
    return diff;
  }, [auctionData?.end_date]);

  const [time, setTime] = useState(calculateRemainingTime);

  // Update time when calculateRemainingTime changes and auto-start for ACTIVE auctions
  useEffect(() => {
    if (isActive && calculateRemainingTime > 0) {
      setTime(calculateRemainingTime);
      setIsRunning(true); // Auto-start timer for active auctions
    }
  }, [calculateRemainingTime, isActive]);

  const [bids, setBids] = useState([
    { user: "User_7891", amount: 12500, time: "just now" },
    { user: "BidMasterFlex", amount: 12250, time: "11s ago" },
    { user: "User_7891", amount: 12000, time: "25s ago" },
    { user: "CollectorJane", amount: 11750, time: "48s ago" }
  ]);

  const [bidders] = useState([
    { name: "User_7891", bids: 14, status: "Live" },
    { name: "BidMasterFlex", bids: 11, status: "Live" },
    { name: "CollectorJane", bids: 8, status: "Live" },
    { name: "WatchFan_22", bids: 5, status: "Live" }
  ]);

  const [userMessages, setUserMessages] = useState([
    { id: "MSG-101", user: "CollectorJane", message: "Is the reserve price visible during bidding?", time: "2 min ago" },
    { id: "MSG-102", user: "User_7891", message: "Can I retract my last bid? I made an error.", time: "5 min ago" },
    { id: "MSG-103", user: "WatchFan_22", message: "What are the shipping options for international buyers?", time: "8 min ago" },
    { id: "MSG-104", user: "BidMasterFlex", message: "Is there a buyer's premium on this lot?", time: "12 min ago" },
    { id: "MSG-105", user: "AntiqueLover", message: "Can I view the item in person before bidding?", time: "15 min ago" }
  ]);

  const handleReplyMessage = (msgId) => {
    alert(`Opening reply dialog for ${msgId}`);
    // Add your reply logic here
  };

  const handleDismissMessage = (msgId) => {
    if (window.confirm(`Are you sure you want to dismiss ${msgId}?`)) {
      setUserMessages(userMessages.filter(msg => msg.id !== msgId));
    }
  };

  const handleVoidBid = (disputeId) => {
    alert(`Voiding bid for ${disputeId}`);
    // Add your void bid logic here
  };

  const handleResolveDispute = (disputeId) => {
    alert(`Resolving dispute ${disputeId}`);
    // Add your resolve logic here
  };

  const handleEndAuction = async () => {
    if (!auctionData?.id) {
      toast.error('Auction ID is missing');
      return;
    }

    if (window.confirm('Are you sure you want to end this auction? This action cannot be undone.')) {
      setIsEndingAuction(true);
      try {
        await managerService.performAuctionAction(auctionData.id, {
          action: 'CLOSE'
        });
        toast.success('Auction ended successfully!');
        // Navigate back to auctions list or refresh the page
        navigate('/manager/dashboard');
      } catch (error) {
        const message = error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to end auction';
        toast.error(message);
      } finally {
        setIsEndingAuction(false);
      }
    }
  };

  // Auto-update timer when active
  useEffect(() => {
    let timer;
    if (isActive && isRunning && time > 0) {
      timer = setInterval(() => {
        setTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, isRunning, time]);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      days: days.toString().padStart(2, "0"),
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0")
    };
  };

  const timeDisplay = formatTime(time);

  // Get images from auctionData media
  const images = useMemo(() => {
    if (auctionData?.media?.length > 0) {
      const imageMedia = auctionData.media
        .filter(m => m.file && m.media_type !== 'file')
        .map(m => {
          const filePath = m.file || m.image || m;
          return getMediaUrl(filePath);
        })
        .filter(url => url !== null);
      return imageMedia;
    }
    return [];
  }, [auctionData?.media]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `$${parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const specificData = auctionData?.specific_data || {};
  const sellerDetails = auctionData?.seller_details || {};

  return (
    <div className="control-wrapper">
      <div className="control-container">

        <div className="control-section-header">
          <div className="control-header-content">
            <h1 className="control-page-title">Auction Control Panel</h1>
            <p className="control-page-subtitle">
              <span className="control-live-indicator">●</span> Live | {auctionData?.title || 'Auction Item'}
            </p>
          </div>
          {isActive && (
            <div className="control-header-actions">
              <button
                className="control-action-btn btn-end"
                onClick={handleEndAuction}
                disabled={isEndingAuction}
              >
                {isEndingAuction ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="spinner">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="16" opacity="0.3" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="16" className="spinner-circle" />
                    </svg>
                    Ending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="5" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
                    </svg>
                    End Auction
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="control-grid">
          {/* LEFT COLUMN */}
          <div className="control-left-column">

            {/* TIMER CARD */}
            <div className="control-card">
              <h3 className="control-card-title">Lot Timer</h3>
              <div className="control-timer-container">
                <div className="control-timer-unit">
                  <div className="control-timer-value">{timeDisplay.days}</div>
                  <div className="control-timer-label-small">Days</div>
                </div>
                <div className="control-timer-separator">:</div>
                <div className="control-timer-unit">
                  <div className="control-timer-value">{timeDisplay.hours}</div>
                  <div className="control-timer-label-small">Hours</div>
                </div>
                <div className="control-timer-separator">:</div>
                <div className="control-timer-unit">
                  <div className="control-timer-value">{timeDisplay.minutes}</div>
                  <div className="control-timer-label-small">Min</div>
                </div>
                <div className="control-timer-separator">:</div>
                <div className="control-timer-unit">
                  <div className="control-timer-value">{timeDisplay.seconds}</div>
                  <div className="control-timer-label-small">Sec</div>
                </div>
              </div>
              <p className="control-timer-label">Time Remaining</p>
              {isActive && (
                <div className="control-timer-buttons">
                  <button className="control-timer-btn" onClick={() => setTime((t) => t + 30)}>+30s</button>
                  <button className="control-timer-btn" onClick={() => setTime((t) => t + 60)}>+1m</button>
                  <button className="control-timer-btn">Set Time</button>
                </div>
              )}
            </div>

            {/* BIDDER LIST CARD - Commented out as requested */}
            {/* {isActive && (
              <div className="control-card">
                <div className="control-card-header">
                  <h3 className="control-card-title">Bidder List ({bidders.length})</h3>
                  <button className="control-search-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                
                <div className="control-bidders-list">
                  {bidders.length > 0 ? (
                    bidders.map((bidder, i) => (
                      <div key={i} className="control-bidder-row">
                        <div className="control-bidder-info">
                          <span className="control-bidder-name">{bidder.name}</span>
                          <span className="control-bidder-count">{bidder.bids} Bids</span>
                        </div>
                        <span className={`control-status-badge ${bidder.status === "Active" ? "status-active" : "status-watching"}`}>
                          {bidder.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="control-empty-state">
                      <p>No bidders yet</p>
                    </div>
                  )}
                </div>
              </div>
            )} */}
          </div>

          {/* RIGHT COLUMN */}
          <div className="control-right-column">

            {/* LIVE BID FEED CARD - Only show for ACTIVE status */}
            {isActive && (
              <>
                <div className="control-card">
                  <h3 className="control-card-title">Live Bid Feed</h3>
                  <div className="control-bids-list">
                    {auctionData?.bids && auctionData.bids.length > 0 ? (
                      auctionData.bids.slice(0, 15).map((bid, i) => (
                        <div key={i} className="control-bid-row">
                          <div className="control-bid-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="control-bid-icon">
                              <polyline points="18 15 12 9 6 15" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="control-bid-user">{maskBidderName(bid.user || bid.bidder_name || 'Anonymous')}</span>
                            <span className="control-bid-text">placed a bid</span>
                          </div>
                          <div className="control-bid-details">
                            <span className="control-bid-amount">${parseFloat(bid.amount || bid.bid_amount || 0).toLocaleString()}</span>
                            <span className="control-bid-time">{bid.time || formatBidDateTime(bid.created_at)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="control-empty-state">
                        <p>No bids yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRODUCT INFO SECTION */}
                <div className="control-card">
                  <h3 className="control-card-title">Product Information</h3>
                  <div className="control-product-info">
                    {/* Basic Information */}
                    <div className="control-info-section">
                      <h4 className="control-info-section-title">Basic Information</h4>
                      <div className="control-info-grid">
                        <div className="control-info-item">
                          <span className="control-info-label">Title:</span>
                          <span className="control-info-value">{auctionData?.title || 'N/A'}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">Description:</span>
                          <span className="control-info-value">{auctionData?.description || 'N/A'}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">Auction ID:</span>
                          <span className="control-info-value">#{auctionData?.id || 'N/A'}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">Category:</span>
                          <span className="control-info-value">{auctionData?.category_name || 'N/A'}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">Status:</span>
                          <span className="control-info-value">{auctionData?.status || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="control-info-section">
                      <h4 className="control-info-section-title">Pricing</h4>
                      <div className="control-info-grid">
                        <div className="control-info-item">
                          <span className="control-info-label">Initial Price:</span>
                          <span className="control-info-value">{formatPrice(auctionData?.initial_price)}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">Currency:</span>
                          <span className="control-info-value">{auctionData?.currency || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Auction Dates */}
                    <div className="control-info-section">
                      <h4 className="control-info-section-title">Auction Dates</h4>
                      <div className="control-info-grid">
                        <div className="control-info-item">
                          <span className="control-info-label">Start Date:</span>
                          <span className="control-info-value">{formatDate(auctionData?.start_date)}</span>
                        </div>
                        <div className="control-info-item">
                          <span className="control-info-label">End Date:</span>
                          <span className="control-info-value">{formatDate(auctionData?.end_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Specific Data (Category-specific fields) */}
                    {Object.keys(specificData).length > 0 && (
                      <div className="control-info-section">
                        <h4 className="control-info-section-title">Item Specific Details</h4>
                        <div className="control-info-grid">
                          {Object.entries(specificData).map(([key, value]) => (
                            <div key={key} className="control-info-item">
                              <span className="control-info-label">
                                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                              </span>
                              <span className="control-info-value">{value || 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seller Information */}
                    {sellerDetails && Object.keys(sellerDetails).length > 0 && (
                      <div className="control-info-section">
                        <h4 className="control-info-section-title">Seller Information</h4>
                        <div className="control-info-grid">
                          <div className="control-info-item">
                            <span className="control-info-label">Seller Name:</span>
                            <span className="control-info-value">{sellerDetails.name || 'N/A'}</span>
                          </div>
                          <div className="control-info-item">
                            <span className="control-info-label">Seller Email:</span>
                            <span className="control-info-value">{sellerDetails.email || 'N/A'}</span>
                          </div>
                          <div className="control-info-item">
                            <span className="control-info-label">Verified:</span>
                            <span className="control-info-value">
                              {sellerDetails.is_verified ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* DISPUTES & ISSUES CARD */}
            {/* <div className="control-card">
              <div className="control-tabs">
                <button 
                  className={`control-tab ${activeTab === "disputes" ? "active" : ""}`}
                  onClick={() => setActiveTab("disputes")}
                >
                  Disputed Bids (2)
                </button>
                <button 
                  className={`control-tab ${activeTab === "technical" ? "active" : ""}`}
                  onClick={() => setActiveTab("technical")}
                >
                  Technical Issues (0)
                </button>
                <button 
                  className={`control-tab ${activeTab === "messages" ? "active" : ""}`}
                  onClick={() => setActiveTab("messages")}
                >
                  User Messages (5)
                </button>
              </div>

              {activeTab === "disputes" && (
                <div className="control-disputes-list">
                  <div className="control-dispute-box">
                    <div className="control-dispute-header">
                      <span className="control-dispute-id">Dispute #8812</span>
                      <span className="control-dispute-user">BidMasterFlex</span>
                    </div>
                    <p className="control-dispute-claim">Claim: "Accidental double-click bid."</p>
                    <div className="control-dispute-actions">
                      <button 
                        className="control-dispute-btn btn-void"
                        onClick={() => handleVoidBid("Dispute #8812")}
                      >
                        Void Bid
                      </button>
                      <button 
                        className="control-dispute-btn btn-resolve"
                        onClick={() => handleResolveDispute("Dispute #8812")}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>

                  <div className="control-dispute-box">
                    <div className="control-dispute-header">
                      <span className="control-dispute-id">Dispute #8809</span>
                      <span className="control-dispute-user">User_7891</span>
                    </div>
                    <p className="control-dispute-claim">Claim: "Bid did not register in time."</p>
                    <div className="control-dispute-actions">
                      <button 
                        className="control-dispute-btn btn-void"
                        onClick={() => handleVoidBid("Dispute #8809")}
                      >
                        Void Bid
                      </button>
                      <button 
                        className="control-dispute-btn btn-resolve"
                        onClick={() => handleResolveDispute("Dispute #8809")}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "technical" && (
                <div className="control-empty-state">
                  <div className="control-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>No Technical Issues</h3>
                  <p>All systems are running smoothly</p>
                </div>
              )}
              {activeTab === "messages" && (
                <div className="control-messages-list">
                  {userMessages.map((msg, i) => (
                    <div key={i} className="control-message-box">
                      <div className="control-message-header">
                        <span className="control-message-id">{msg.id}</span>
                        <span className="control-message-user">{msg.user}</span>
                        <span className="control-message-time">{msg.time}</span>
                      </div>
                      <p className="control-message-text">{msg.message}</p>
                      <div className="control-message-actions">
                        <button 
                          className="control-message-btn btn-reply"
                          onClick={() => handleReplyMessage(msg.id)}
                        >
                          Reply
                        </button>
                        <button 
                          className="control-message-btn btn-dismiss"
                          onClick={() => handleDismissMessage(msg.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        </div>

      </div>
    </div>
  );
}