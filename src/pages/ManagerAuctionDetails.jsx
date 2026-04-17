import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_CONFIG, getMediaUrl } from '../config/api.config';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import './ManagerAuctionDetails.css';

const ManagerAuctionDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auctionData = location?.state?.auctionData;
  const [selectedImage, setSelectedImage] = useState(0);

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

  if (!auctionData) {
    return (
      <div className="manager-auction-details-wrapper">
        <div className="manager-auction-details-container">
          <div className="manager-auction-details-error">
            <h3>No auction data available</h3>
            <button onClick={() => navigate('/manager/dashboard')} className="manager-auction-details-back-btn">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const specificData = auctionData.specific_data || {};
  const sellerDetails = auctionData.seller_details || {};
  const managerDetails = auctionData.manager_details || {};

  return (
    <div className="manager-auction-details-wrapper">
      <div className="manager-auction-details-container">
        <div className="manager-auction-details-header">
          <div className="manager-auction-details-header-content">
            <h1 className="manager-auction-details-title">Auction Details</h1>
            <p className="manager-auction-details-subtitle">View complete auction information</p>
          </div>
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="manager-auction-details-back-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="manager-auction-details-content">
          {/* Left Column - Images */}
          <div className="manager-auction-details-left">
            <div className="manager-auction-details-images">
              {images.length > 0 ? (
                <>
                  <div className="manager-auction-details-main-image">
                    <img
                      src={images[selectedImage] || images[0]}
                      alt={auctionData.title || 'Auction item'}
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="manager-auction-details-thumbnails">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className={`manager-auction-details-thumbnail ${selectedImage === index ? 'active' : ''}`}
                          onClick={() => setSelectedImage(index)}
                        >
                          <img src={img} alt={`Thumbnail ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="manager-auction-details-no-image">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p>No images available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="manager-auction-details-right">
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Basic Information</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Title:</span>
                  <span className="manager-auction-details-info-value">{auctionData.title || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Description:</span>
                  <span className="manager-auction-details-info-value">{auctionData.description || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Auction ID:</span>
                  <span className="manager-auction-details-info-value">#{auctionData.id || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Status:</span>
                  <span className={`manager-auction-details-status-badge ${auctionData.status === 'APPROVED' ? 'status-approved' : ''}`}>
                    {auctionData.status || 'N/A'}
                  </span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Category:</span>
                  <span className="manager-auction-details-info-value">{auctionData.category_name || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Currency:</span>
                  <span className="manager-auction-details-info-value">{auctionData.currency || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Pricing Information</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Initial Price:</span>
                  <span className="manager-auction-details-info-value">{formatPrice(auctionData.initial_price)}</span>
                </div>
              </div>
            </div>

            {/* Auction Dates */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Auction Dates</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Start Date:</span>
                  <span className="manager-auction-details-info-value">{formatDate(auctionData.start_date)}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">End Date:</span>
                  <span className="manager-auction-details-info-value">{formatDate(auctionData.end_date)}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Created At:</span>
                  <span className="manager-auction-details-info-value">{formatDate(auctionData.created_at)}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Updated At:</span>
                  <span className="manager-auction-details-info-value">{formatDate(auctionData.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Specific Data (Category-specific fields) */}
            {Object.keys(specificData).length > 0 && (
              <div className="manager-auction-details-section">
                <h2 className="manager-auction-details-section-title">Item Specific Details</h2>
                <div className="manager-auction-details-info-grid">
                  {Object.entries(specificData).map(([key, value]) => (
                    <div key={key} className="manager-auction-details-info-item">
                      <span className="manager-auction-details-info-label">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                      </span>
                      <span className="manager-auction-details-info-value">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Handover Information */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Handover Information</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Handover Type:</span>
                  <span className="manager-auction-details-info-value">{auctionData.handover_type || 'N/A'}</span>
                </div>
                {auctionData.handover_type === 'PICKUP' && (
                  <>
                    <div className="manager-auction-details-info-item">
                      <span className="manager-auction-details-info-label">Pickup Address:</span>
                      <span className="manager-auction-details-info-value">{auctionData.pickup_address || 'N/A'}</span>
                    </div>
                    <div className="manager-auction-details-info-item">
                      <span className="manager-auction-details-info-label">Pickup Latitude:</span>
                      <span className="manager-auction-details-info-value">{auctionData.pickup_latitude || 'N/A'}</span>
                    </div>
                    <div className="manager-auction-details-info-item">
                      <span className="manager-auction-details-info-label">Pickup Longitude:</span>
                      <span className="manager-auction-details-info-value">{auctionData.pickup_longitude || 'N/A'}</span>
                    </div>
                  </>
                )}
                {auctionData.handover_type === 'DELIVERY' && (
                  <div className="manager-auction-details-info-item">
                    <span className="manager-auction-details-info-label">Delivery Date/Time:</span>
                    <span className="manager-auction-details-info-value">{formatDate(auctionData.delivery_datetime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Seller Information</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Seller Name:</span>
                  <span className="manager-auction-details-info-value">{sellerDetails.name || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Seller Email:</span>
                  <span className="manager-auction-details-info-value">{sellerDetails.email || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Business Name:</span>
                  <span className="manager-auction-details-info-value">{sellerDetails.business_name || 'N/A'}</span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Verified:</span>
                  <span className="manager-auction-details-info-value">
                    {sellerDetails.is_verified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager Information */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Assigned Manager</h2>
              <div className="manager-auction-details-info-grid">
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Manager Name:</span>
                  <span className="manager-auction-details-info-value">
                    {managerDetails.first_name && managerDetails.last_name
                      ? `${managerDetails.first_name} ${managerDetails.last_name}`
                      : managerDetails.email || 'N/A'}
                  </span>
                </div>
                <div className="manager-auction-details-info-item">
                  <span className="manager-auction-details-info-label">Manager Email:</span>
                  <span className="manager-auction-details-info-value">{managerDetails.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Bids Information */}
            <div className="manager-auction-details-section">
              <h2 className="manager-auction-details-section-title">Bids</h2>
              <div className="manager-auction-details-bids">
                {auctionData.bids && auctionData.bids.length > 0 ? (
                  <div className="manager-auction-details-bids-list">
                    {auctionData.bids.slice(0, 15).map((bid, index) => (
                      <div key={index} className="manager-auction-details-bid-item">
                        <span className="manager-auction-details-bid-amount">{formatPrice(bid.amount)}</span>
                        <span className="manager-auction-details-bid-user">{maskBidderName(bid.user || 'Anonymous')}</span>
                        <span className="manager-auction-details-bid-time">{formatBidDateTime(bid.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="manager-auction-details-no-bids">No bids yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAuctionDetails;

