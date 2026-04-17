import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/interceptors/admin.service';
import { API_CONFIG, getMediaUrl } from '../../config/api.config';
import { formatBidDateTime } from '../../utils/formatBidDateTime';
import { maskBidderName } from '../../utils/maskBidderName';
import './AdminAuctionDetails.css';

const AdminAuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchAuction = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to fetch from dashboard endpoint and filter by ID
        // If that doesn't work, fall back to the existing getAuctionById
        try {
          const dashboardData = await adminService.getDashboard();
          const foundAuction = dashboardData.results?.find((auction) => auction.id === parseInt(id));
          if (foundAuction) {
            setAuction(foundAuction);
          } else {
            // Fall back to getAuctionById if not found in dashboard
            const data = await adminService.getAuctionById(id);
            setAuction(data);
          }
        } catch (dashboardError) {
          // If dashboard fails, try the existing endpoint
          const data = await adminService.getAuctionById(id);
          setAuction(data);
        }
      } catch (err) {
        console.error('Error fetching auction:', err);
        setError(err.message || 'Failed to load auction details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAuction();
    }
  }, [id]);

  const getStatusColor = (status) => {
    const displayStatus = status === 'DRAFT' ? 'PENDING' : status;
    switch (displayStatus) {
      case 'ACTIVE': return 'admin-auction-details-status-success';
      case 'APPROVED': return 'admin-auction-details-status-success';
      case 'PENDING': return 'admin-auction-details-status-warning';
      case 'REJECTED': return 'admin-auction-details-status-error';
      case 'COMPLETED': return 'admin-auction-details-status-info';
      default: return 'admin-auction-details-status-default';
    }
  };

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
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const displayStatus = auction?.status === 'DRAFT' ? 'PENDING' : auction?.status;

  if (isLoading) {
    return (
      <div className="admin-auction-details-container">
        <div className="admin-auction-details-loading">
          <p>Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-auction-details-container">
        <div className="admin-auction-details-error">
          <p>Error: {error}</p>
          <button onClick={() => navigate('/admin/dashboard')} className="admin-auction-details-back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="admin-auction-details-container">
        <div className="admin-auction-details-error">
          <p>Auction not found</p>
          <button onClick={() => navigate('/admin/dashboard')} className="admin-auction-details-back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Filter images: include all media items that have a file property, excluding only those explicitly marked as 'file'
  // This matches the behavior of the listing page which shows media[0].file without filtering
  const imageMedia = auction.media?.filter(m => {
    // Only exclude items explicitly marked as files
    // Include everything else that has a file property (treat as image by default)
    return m.file && m.media_type !== 'file';
  }) || [];
  const fileMedia = auction.media?.filter(m => m.media_type === 'file') || [];

  // Check if auction is active or closed for conditional bidding history placement
  const isActiveOrClosed = auction.status === 'ACTIVE' || auction.status === 'CLOSED';

  return (
    <div className="admin-auction-details-container">
      <div className="admin-auction-details-header">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="admin-auction-details-back-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="admin-auction-details-title">Auction Details</h1>
      </div>

      <div className="admin-auction-details-content">
        {/* Left Column - Images */}
        <div className="admin-auction-details-images-section">
          {imageMedia.length > 0 ? (
            <>
              <div className="admin-auction-details-main-image">
                <img
                  src={getMediaUrl(imageMedia[selectedImage]?.file)}
                  alt={auction.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23222'/%3E%3Ctext x='300' y='200' font-family='Arial' font-size='24' fill='%23fff' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              {imageMedia.length > 1 && (
                <div className="admin-auction-details-thumbnails">
                  {imageMedia.map((media, index) => (
                    <button
                      key={media.id}
                      className={`admin-auction-details-thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={getMediaUrl(media.file)}
                        alt={media.label || `Image ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23222'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23fff' text-anchor='middle'%3E📷%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="admin-auction-details-no-image">
              <div className="admin-auction-details-image-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>No images available</p>
              </div>
            </div>
          )}

          {/* Bids History - Show in left column for ACTIVE/CLOSED auctions */}
          {isActiveOrClosed && auction.bids && auction.bids.length > 0 && (
            <div className="admin-auction-details-card">
              <h3 className="admin-auction-details-section-title">Bidding History</h3>
              <div className="admin-auction-details-bids-list">
                {auction.bids.slice(0, 15).map((bid, index) => (
                  <div key={bid.id} className="admin-auction-details-bid-item">
                    <div className="admin-auction-details-bid-info">
                      <div className="admin-auction-details-bid-amount">
                        {auction.currency || 'USD'} {formatPrice(bid.amount)}
                      </div>
                      <div className="admin-auction-details-bid-bidder">
                        {maskBidderName(bid.bidder_name || bid.bidder_email || 'Unknown Bidder')}
                      </div>
                      <div className="admin-auction-details-bid-time">
                        {formatBidDateTime(bid.created_at)}
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="admin-auction-details-bid-highest">Highest Bid</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="admin-auction-details-info-section">
          <div className="admin-auction-details-card">
            <div className="admin-auction-details-card-header">
              <h2>{auction.title}</h2>
              <span className={`admin-auction-details-status-badge ${getStatusColor(auction.status)}`}>
                {displayStatus}
              </span>
            </div>

            <div className="admin-auction-details-info-grid">
              <div className="admin-auction-details-info-item">
                <label>Category</label>
                <span>{auction.category_name || 'N/A'}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>Seller</label>
                <span>
                  {auction.seller_details?.name || auction.seller_name || 'N/A'}
                  {auction.seller_details?.business_name && ` (${auction.seller_details.business_name})`}
                  {auction.seller_details?.is_verified !== undefined && (
                    <span style={{ marginLeft: '0.5rem', color: auction.seller_details.is_verified ? '#39AE47' : '#f87171' }}>
                      {auction.seller_details.is_verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  )}
                </span>
              </div>

              {auction.seller_details?.email && (
                <div className="admin-auction-details-info-item">
                  <label>Seller Email</label>
                  <span>{auction.seller_details.email}</span>
                </div>
              )}

              <div className="admin-auction-details-info-item">
                <label>Manager</label>
                <span>
                  {auction.manager_details
                    ? `${auction.manager_details.first_name || ''} ${auction.manager_details.last_name || ''}`.trim() || auction.manager_details.email || 'Not assigned'
                    : auction.auction_manager_name || 'Not assigned'}
                </span>
              </div>

              {auction.manager_details?.email && (
                <div className="admin-auction-details-info-item">
                  <label>Manager Email</label>
                  <span>{auction.manager_details.email}</span>
                </div>
              )}

              <div className="admin-auction-details-info-item">
                <label>Total Bids</label>
                <span>{auction.bids?.length || 0}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>Currency</label>
                <span>{auction.currency || 'N/A'}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>Initial Price</label>
                <span>{auction.currency || 'USD'} {formatPrice(auction.initial_price)}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>Handover Type</label>
                <span>{auction.handover_type || 'N/A'}</span>
              </div>

              {auction.delivery_datetime && (
                <div className="admin-auction-details-info-item">
                  <label>Delivery Datetime</label>
                  <span>{formatDate(auction.delivery_datetime)}</span>
                </div>
              )}

              <div className="admin-auction-details-info-item">
                <label>Pickup Address</label>
                <span>{auction.pickup_address || 'N/A'}</span>
              </div>

              {auction.pickup_latitude && auction.pickup_longitude && (
                <>
                  <div className="admin-auction-details-info-item">
                    <label>Latitude</label>
                    <span>{auction.pickup_latitude}</span>
                  </div>
                  <div className="admin-auction-details-info-item">
                    <label>Longitude</label>
                    <span>{auction.pickup_longitude}</span>
                  </div>
                </>
              )}

              <div className="admin-auction-details-info-item">
                <label>Start Date</label>
                <span>{formatDate(auction.start_date)}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>End Date</label>
                <span>{formatDate(auction.end_date)}</span>
              </div>

              {auction.extended_time_seconds > 0 && (
                <div className="admin-auction-details-info-item">
                  <label>Extended Time</label>
                  <span>{Math.floor(auction.extended_time_seconds / 3600)}h {Math.floor((auction.extended_time_seconds % 3600) / 60)}m</span>
                </div>
              )}

              <div className="admin-auction-details-info-item">
                <label>Created At</label>
                <span>{formatDate(auction.created_at)}</span>
              </div>

              <div className="admin-auction-details-info-item">
                <label>Updated At</label>
                <span>{formatDate(auction.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="admin-auction-details-card">
            <h3 className="admin-auction-details-section-title">Description</h3>
            <p className="admin-auction-details-description">
              {auction.description || 'No description provided.'}
            </p>
          </div>

          {/* Specific Data */}
          {auction.specific_data && Object.keys(auction.specific_data).length > 0 && (
            <div className="admin-auction-details-card">
              <h3 className="admin-auction-details-section-title">Specific Details</h3>
              <div className="admin-auction-details-info-grid">
                {Object.entries(auction.specific_data).map(([key, value]) => (
                  <div key={key} className="admin-auction-details-info-item">
                    <label>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</label>
                    <span>{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files/Documents */}
          {fileMedia.length > 0 && (
            <div className="admin-auction-details-card">
              <h3 className="admin-auction-details-section-title">Documents</h3>
              <div className="admin-auction-details-files-list">
                {fileMedia.map((file) => (
                  <a
                    key={file.id}
                    href={getMediaUrl(file.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-auction-details-file-link"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>{file.label || 'Document'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bids History - Show in right column for non-ACTIVE/CLOSED auctions */}
          {!isActiveOrClosed && auction.bids && auction.bids.length > 0 && (
            <div className="admin-auction-details-card">
              <h3 className="admin-auction-details-section-title">Bidding History</h3>
              <div className="admin-auction-details-bids-list">
                {auction.bids.slice(0, 15).map((bid, index) => (
                  <div key={bid.id} className="admin-auction-details-bid-item">
                    <div className="admin-auction-details-bid-info">
                      <div className="admin-auction-details-bid-amount">
                        {auction.currency || 'USD'} {formatPrice(bid.amount)}
                      </div>
                      <div className="admin-auction-details-bid-bidder">
                        {maskBidderName(bid.bidder_name || bid.bidder_email || 'Unknown Bidder')}
                      </div>
                      <div className="admin-auction-details-bid-time">
                        {formatBidDateTime(bid.created_at)}
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="admin-auction-details-bid-highest">Highest Bid</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {auction.rejection_reason && (
            <div className="admin-auction-details-card admin-auction-details-rejection-card">
              <h3 className="admin-auction-details-section-title">Rejection Reason</h3>
              <p className="admin-auction-details-rejection-reason">{auction.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuctionDetails;

