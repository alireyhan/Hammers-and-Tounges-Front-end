import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { placeBid } from '../store/actions/buyerActions'
import { getMediaUrl } from '../config/api.config';

import './AuctionDetails.css';

const AuctionDetails = () => {

  const dispatch = useDispatch();
  const { auctions, isLoading, error } = useSelector((state) => state.buyer);
  const selectedAuction = auctions?.results?.find((auction) => auction?.id.toString() === id);
  const [activeTab, setActiveTab] = useState('description');
  const [bidAmount, setBidAmount] = useState('');
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    dispatch(fetchAuctionsList());
  }, []);

  useEffect(() => {
    if (selectedAuction && selectedAuction.status === 'ACTIVE') {
      const calculateTimeRemaining = () => {
        const now = new Date().getTime();
        const endDate = new Date(selectedAuction.end_date).getTime();
        const difference = endDate - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          return { hours, minutes, seconds };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      };

      setTimeRemaining(calculateTimeRemaining());

      const interval = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [selectedAuction]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAuction?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCustomBidSubmit = (e) => {
    e.preventDefault()
    console.log('Placing custom bid:', customBidAmount)
    dispatch(placeBid({ auction_id: auction.id, amount: parseFloat(customBidAmount) }))

  };



  if (isLoading) {
    return (
      <div className="auction-details-page">
        <div className="auction-details-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-details-page">
        <div className="auction-details-container">
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <p>Error loading auction: {error}</p>
            <Link to="/auctions" style={{ color: '#007bff', textDecoration: 'underline' }}>
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAuction) {
    return (
      <div className="auction-details-page">
        <div className="auction-details-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Auction not found</p>
            <Link to="/auctions" style={{ color: '#007bff', textDecoration: 'underline' }}>
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const auction = selectedAuction;
  const images = auction.media?.filter(m => m.media_type === 'image').map(m => getMediaUrl(m.file)) || [];
  const inspectionReport = auction.media?.find(m => m.label === 'inspection_report');
  const isLive = auction.status === 'ACTIVE';
  const isUpcoming = auction.status === 'APPROVED';

  if (isLive && timeRemaining.hours + timeRemaining.minutes + timeRemaining.seconds > 0) {
    return (
      <div className="auction-details-page live-auction-page">
        <div className="auction-details-container">
          <nav className="breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/auctions">Auctions</Link>
            <span>/</span>
            <span>{auction.category_name}</span>
            <span>/</span>
            <span>Lot #{auction.id}</span>
          </nav>

          <div className="live-auction-header">
            <h1 className="live-auction-title">{auction.title}</h1>
            <p className="live-auction-description">{auction.description}</p>
          </div>

          <div className="live-auction-content">
            <div className="live-auction-player-section">
              <div className="video-player">
                <img
                  src={images[selectedImage] || 'https://via.placeholder.com/800x600?text=No+Image'}
                  alt={auction.title}
                />
                <div className="play-overlay">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="rgba(255, 255, 255, 0.9)" />
                    <path d="M10 8L16 12L10 16V8Z" fill="#000000" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="live-auction-bidding-panel">
              <div className="live-timer-section">
                <div className="timer-label">TIME REMAINING</div>
                <div className="live-timer">
                  <div className="timer-unit">
                    <span className="timer-value">{String(timeRemaining.hours).padStart(2, '0')}</span>
                    <span className="timer-label-small">Hours</span>
                  </div>
                  <span className="timer-separator">:</span>
                  <div className="timer-unit">
                    <span className="timer-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                    <span className="timer-label-small">Minutes</span>
                  </div>
                  <span className="timer-separator">:</span>
                  <div className="timer-unit">
                    <span className={`timer-value ${timeRemaining.seconds < 30 ? 'urgent' : ''}`}>
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                    <span className="timer-label-small">Seconds</span>
                  </div>
                </div>
              </div>

              <div className="current-bid-box">
                <div className="current-bid-label">Current Price</div>
                <div className="current-bid-amount">{formatCurrency(auction.initial_price)}</div>
                <div className="highest-bidder-info">
                  <span className="highest-bidder-label">Total Bids</span>
                  <span className="highest-bidder-name">{auction.total_bids}</span>
                </div>
              </div>

              <button className="quick-bid-button">
                Place Bid Here
              </button>

              <form className="custom-bid-form" onSubmit={handleCustomBidSubmit}>
                <input
                  type="number"
                  className="custom-bid-input"
                  placeholder="Enter custom bid"
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  min={parseFloat(auction.initial_price) + 1}
                />
                <button type="submit" className="custom-bid-button">Place Bid</button>
              </form>
            </div>
          </div>

          <div className="live-auction-bottom-panels">
            <div className="bidding-feed-panel">
              <h3 className="panel-title">Auction Information</h3>
              <div className="bidding-feed-list">
                <div className="bidding-feed-item">
                  <span className="bidder-name">Seller:</span>
                  <span className="bid-amount">{auction.seller_name}</span>
                </div>
                <div className="bidding-feed-item">
                  <span className="bidder-name">Manager:</span>
                  <span className="bid-amount">{auction.auction_manager_name}</span>
                </div>
                <div className="bidding-feed-item">
                  <span className="bidder-name">Category:</span>
                  <span className="bid-amount">{auction.category_name}</span>
                </div>
              </div>
            </div>

            <div className="active-bidders-panel">
              <h3 className="panel-title">Details</h3>
              <div className="active-bidders-list">
                <div className="active-bidder-item">
                  <span>Handover: {auction.handover_type}</span>
                </div>
                {auction.pickup_address && (
                  <div className="active-bidder-item">
                    <span>Location: {auction.pickup_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-details-page">
      <div className="auction-details-container">
        <nav className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/auctions">Auctions</Link>
          <span>/</span>
          <span>{auction.category_name}</span>
          <span>/</span>
          <span>Lot #{auction.id}</span>
        </nav>

        <div className="auction-details-content">
          <div className="auction-images-section">
            <div className="main-image">
              <img
                src={images[selectedImage] || 'https://via.placeholder.com/800x600?text=No+Image'}
                alt={auction.title}
              />
            </div>
            {images.length > 0 && (
              <div className="image-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${auction.title} view ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="auction-details-section">
            <div className="auction-header">
              <h1 className="auction-title">{auction.title}</h1>
              <span className="lot-number">Lot #{auction.id}</span>
            </div>

            <div className="bid-status-box">
              <div className="bid-status-item">
                <span className="status-label">
                  {isUpcoming ? 'Auction Starts' : 'Auction Status'}
                </span>
                <span className="status-value timer">
                  {isUpcoming
                    ? new Date(auction.start_date).toLocaleString()
                    : auction.status
                  }
                </span>
                <span className="end-date">
                  Ends: {new Date(auction.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {isUpcoming && (
              <div className="upcoming-notice">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="notice-content">
                  <strong>This auction has not started yet</strong>
                  <p>Bidding will be available when the auction goes live.</p>
                </div>
              </div>
            )}

            <div className="info-tabs">
              <button
                className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                className={`tab ${activeTab === 'inspection' ? 'active' : ''}`}
                onClick={() => setActiveTab('inspection')}
              >
                Inspection Report
              </button>
              <button
                className={`tab ${activeTab === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('terms')}
              >
                Terms
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'description' && (
                <div className="description-content">
                  <p className="description-text">{auction.description}</p>
                  <div className="key-details">
                    {auction.specific_data && Object.entries(auction.specific_data).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}
                      </div>
                    ))}
                    <div className="detail-item">
                      <strong>Location:</strong> {auction.pickup_address}
                    </div>
                    <div className="detail-item">
                      <strong>Category:</strong> {auction.category_name}
                    </div>
                    <div className="detail-item">
                      <strong>Handover Type:</strong> {auction.handover_type}
                    </div>
                    <div className="detail-item">
                      <strong>Initial Price:</strong> {formatCurrency(auction.initial_price)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inspection' && (
                <div className="inspection-content">
                  {inspectionReport ? (
                    <div>
                      <p>Inspection report available for download:</p>
                      <a
                        href={getMediaUrl(inspectionReport.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#007bff', textDecoration: 'underline' }}
                      >
                        Download Inspection Report
                      </a>
                    </div>
                  ) : auction.specific_data?.inspection_report ? (
                    <p>{auction.specific_data.inspection_report}</p>
                  ) : (
                    <p>No inspection report available.</p>
                  )}
                </div>
              )}

              {activeTab === 'terms' && (
                <div className="terms-content">
                  <h4>Auction Terms & Conditions</h4>
                  <ul>
                    <li>All bids are final and binding</li>
                    <li>Payment must be made within 48 hours of auction close</li>
                    <li>Items are sold as-is, where-is</li>
                    <li>Buyer is responsible for pickup or shipping arrangements</li>
                    <li>A buyer's premium may apply</li>
                  </ul>
                  {auction.seller_expected_price && (
                    <p><strong>Reserve Price:</strong> This auction has a reserve price.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;