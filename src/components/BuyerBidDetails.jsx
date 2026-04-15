import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './BuyerBidDetails.css';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAuctionBids } from '../store/actions/buyerActions';
import { getMediaUrl } from '../config/api.config';

const BuyerBidDetails = () => {
  const { id } = useParams()
  const location = useLocation();
  const dispatch = useDispatch()
  const bidDetails = location.state?.listing;
  //   const bidHistory = location.state?.bidHistory || [];
  const { auctionBids: bidHistory } = useSelector(state => state.buyer)
  const [activeTab, setActiveTab] = useState('information');
  const [selectedImage, setSelectedImage] = useState(0);

  // Memoized values
  const images = useMemo(() =>
    bidDetails?.auction_media?.filter(m => m.media_type === 'image').map(m => getMediaUrl(m.file)) || [],
    [bidDetails?.auction_media]
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    dispatch(fetchAuctionBids(id))
  }, [id, dispatch])

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    const now = new Date().getTime();
    const past = new Date(dateString).getTime();
    const difference = now - past;

    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AWAITING_PAYMENT':
        return { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgba(251, 146, 60, 0.5)', color: '#fb923c' };
      case 'WON':
        return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', color: '#39AE47' };
      case 'LOST':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' };
      case 'ACTIVE':
        return { bg: 'rgba(140, 198, 63, 0.4)', border: 'rgba(140, 198, 63, 0.7)', color: '#39AE47' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.5)', color: '#9ca3af' };
    }
  };

  const statusColors = bidDetails?.status ? getStatusColor(bidDetails.status) : null;

  // Not found state
  if (!bidDetails) {
    return (
      <div className="bid-details-page">
        <div className="bid-details-container">
          <div className="bid-details-not-found">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2>Bid Details Not Found</h2>
            <p>The bid information you're looking for doesn't exist or couldn't be loaded.</p>
            <Link to="/buyer/bids" className="bid-details-back-btn">Back to My Bids</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-details-page">
      <div className="bid-details-container">
        {/* Breadcrumbs */}
        <nav className="bid-details-breadcrumbs">
          <Link to="/buyer/dashboard">Live Auction</Link>
          <span>/</span>
          <Link to="/buyer/bids">My Bids</Link>
          <span>/</span>
          <span>Bid #{bidDetails.id}</span>
        </nav>

        {/* Header */}
        <div className="bid-details-header">
          <div className="bid-details-header-content">
            <h1 className="bid-details-title">{bidDetails.auction_title || 'Untitled Auction'}</h1>
            {/* <p className="bid-details-subtitle">Bid ID: #{bidDetails.id}</p> */}
          </div>
          {bidDetails.status && (
            <div
              className="bid-details-status-badge"
              style={{
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
                color: statusColors.color
              }}
            >
              {bidDetails.status.replace(/_/g, ' ')}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bid-details-content">
          {/* Image Gallery */}
          <div className="bid-details-gallery">
            <div className="bid-details-main-image">
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt={bidDetails.auction_title} />
              ) : (
                <div className="bid-details-no-image">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.3)" />
                    <path d="M21 15L16 10L5 21" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p>No Image Available</p>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="bid-details-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`bid-details-thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`View ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bid Summary Card */}
          <div className="bid-details-summary">
            <div className="bid-summary-header">
              <h3>Your Bid Summary</h3>
            </div>
            <div className="bid-summary-content">
              <div className="bid-summary-item primary">
                <span className="bid-summary-label">Your Bid Amount</span>
                <span className="bid-summary-value">
                  {bidDetails.amount ? formatCurrency(parseFloat(bidDetails.amount)) : 'N/A'}
                </span>
              </div>
              <div className="bid-summary-item primary">
                <span className="bid-summary-label">Current Highest Bid</span>
                <span className="bid-summary-value">
                  {bidDetails.amount ? formatCurrency(parseFloat(bidHistory?.[0]?.amount)) : 'N/A'}
                </span>
              </div>
              <div className="bid-summary-divider"></div>
              <div className="bid-summary-item">
                <span className="bid-summary-label">Auction Title</span>
                <span className="bid-summary-value-small">{bidDetails.auction_title || 'N/A'}</span>
              </div>
              {/* <div className="bid-summary-item">
                <span className="bid-summary-label">Auction ID</span>
                <span className="bid-summary-value-small">#{bidDetails.auction_id || 'N/A'}</span>
              </div>
              <div className="bid-summary-item">
                <span className="bid-summary-label">Bid ID</span>
                <span className="bid-summary-value-small">{bidDetails.id}</span>
              </div> */}
              {/* <div className="bid-summary-item">
                <span className="bid-summary-label">Time Ago</span>
                <span className="bid-summary-value-small">{formatRelativeTime(bidDetails.created_at)}</span>
              </div> */}
            </div>

            {bidDetails.status === 'AWAITING_PAYMENT' && (
              <div className="bid-payment-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10C6.48 4 2 6.69 2 10c0 3.72 4.64 7 10 7 .93 0 1.83-.13 2.71-.38.67.52 1.49.99 2.29.99 1.1 0 2-.9 2-2 0-.78-.49-1.45-1.19-1.78.71-1.03 1.19-2.3 1.19-3.83 0-3.31-4.48-6-10-6z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div>
                  <strong>Payment Required</strong>
                  <p>Complete your payment to finalize this auction win.</p>
                </div>
              </div>
            )}

            {/* <div className="bid-summary-actions">
              <Link to={`/buyer/auction/${bidDetails.auction_id}`} className="bid-action-btn primary">
                View Auction Details
              </Link>
            </div> */}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bid-details-tabs-section">
          <div className="bid-details-tabs">
            <button
              className={`bid-details-tab ${activeTab === 'information' ? 'active' : ''}`}
              onClick={() => setActiveTab('information')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Bid Information
            </button>
            <button
              className={`bid-details-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3.05 11C3.5 6.5 7.4 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C9.39 21 7.05 19.86 5.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Bid History (Total Bids: {bidHistory.length})
            </button>
          </div>

          <div className="bid-details-tab-content">
            {activeTab === 'information' && (
              <div className="bid-information-panel">
                <div className="bid-info-section">
                  <h3 className="bid-info-section-title">Bid Details</h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <span className="bid-info-label">Status</span>
                      <span className="bid-info-value">
                        {bidDetails.status ? bidDetails.status.replace(/_/g, ' ') : 'N/A'}
                      </span>
                    </div>
                    <div className="bid-info-item">
                      <span className="bid-info-label">Bid Amount</span>
                      <span className="bid-info-value highlight">
                        {bidDetails.amount ? formatCurrency(parseFloat(bidDetails.amount)) : 'N/A'}
                      </span>
                    </div>
                    {/* <div className="bid-info-item">
                      <span className="bid-info-label">Bid ID</span>
                      <span className="bid-info-value">#{bidDetails.id}</span>
                    </div> */}

                    {/* <div className="bid-info-item">
                      <span className="bid-info-label">Auction Title</span>
                      <span className="bid-info-value">{bidDetails.auction_title || 'N/A'}</span>
                    </div> */}

                    <div className="bid-info-item">
                      <span className="bid-info-label">Bid Created</span>
                      <span className="bid-info-value">{formatDate(bidDetails.created_at)}</span>
                    </div>
                    {/* <div className="bid-info-item">
                      <span className="bid-info-label">Auction ID</span>
                      <span className="bid-info-value">#{bidDetails.auction_id || 'N/A'}</span>
                    </div> */}
                  </div>
                </div>

                {/* {bidDetails.auction_media && bidDetails.auction_media.length > 0 && (
                    <div className="bid-info-section">
                    <h3 className="bid-info-section-title">Auction Media</h3>
                    <div className="bid-media-grid">
                      {bidDetails.auction_media.map((media, index) => (
                          <div key={media.id || index} className="bid-media-item">
                          {media.media_type === 'image' ? (
                              <>
                              <img src={media.file} alt={media.label || `Media ${index + 1}`} />
                              <span className="bid-media-label">{media.label || `Image ${index + 1}`}</span>
                            </>
                          ) : (
                            <div className="bid-media-placeholder">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              <span>{media.media_type}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bid-history-panel">
                <h3 className="bid-history-title">All Bids for This Auction</h3>
                {bidHistory.length > 0 ? (
                  <div className="bid-history-list">
                    {bidHistory.map((bid, index) => (
                      <div key={bid.id} className="bid-history-item">
                        <div className="bid-history-rank">
                          <span className="rank-number">#{index + 1}</span>
                        </div>
                        <div className="bid-history-content">
                          <div className="bid-history-info">
                            <span className="bid-history-bidder">{bid.bidder_name || 'Anonymous'}</span>
                          </div>
                          {/* <span className="bid-history-relative">{formatRelativeTime(bid.created_at)}</span> */}
                          <span className="bid-history-time">{formatDate(bid.created_at)}</span>
                        </div>
                        <div className="bid-history-amount">
                          {formatCurrency(parseFloat(bid.amount))}
                        </div>
                        {bid.id === bidDetails.id && (
                          <div className="bid-history-your-bid">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                            Your Bid
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bid-history-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8V12L15 15" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                      <path d="M3.05 11C3.5 6.5 7.4 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C9.39 21 7.05 19.86 5.5 18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h4>No Bid History</h4>
                    <p>There are no other bids for this auction yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerBidDetails;