import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { placeBid, fetchAuctionBids } from '../store/actions/buyerActions';
import { auctionService } from '../services/interceptors/auction.service';
import { getMediaUrl } from '../config/api.config';
import './BuyerAuctionDetails.css';
import { fetchProfile } from '../store/actions/profileActions';
import { toast } from 'react-toastify';

// ==================== MEMOIZED COMPONENTS ====================

const LoadingSkeleton = memo(() => (
  <div className="buyer-details-skeleton">
    <div className="buyer-details-breadcrumbs-skeleton skeleton-shimmer"></div>
    <div className="buyer-details-content-skeleton">
      <div className="buyer-details-images-skeleton">
        <div className="buyer-details-main-image-skeleton skeleton-shimmer"></div>
        <div className="buyer-details-thumbnails-skeleton">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="buyer-details-thumbnail-skeleton skeleton-shimmer"></div>
          ))}
        </div>
      </div>
      <div className="buyer-details-info-skeleton">
        <div className="buyer-details-header-skeleton">
          <div className="buyer-details-title-skeleton skeleton-shimmer"></div>
          <div className="buyer-details-lot-skeleton skeleton-shimmer"></div>
        </div>
        <div className="buyer-details-status-skeleton skeleton-shimmer"></div>
        <div className="buyer-details-tabs-skeleton">
          {['description', 'bids'].map((tab) => (
            <div key={tab} className="buyer-details-tab-skeleton skeleton-shimmer"></div>
          ))}
        </div>
        <div className="buyer-details-content-area-skeleton">
          <div className="buyer-details-description-skeleton skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const ErrorState = memo(({ error }) => (
  <div className="buyer-details-page">
    <div className="buyer-details-container">
      <div className="buyer-details-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3>Error loading auction</h3>
        <p>{error}</p>
        <Link to="/buyer/dashboard" className="buyer-details-back-link">Back to Dashboard</Link>
      </div>
    </div>
  </div>
));

ErrorState.displayName = 'ErrorState';

const NotFoundState = memo(() => (
  <div className="buyer-details-page">
    <div className="buyer-details-container">
      <div className="buyer-details-not-found">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3>Auction not found</h3>
        <p>The auction you're looking for doesn't exist or has been removed.</p>
        <Link to="/buyer/dashboard" className="buyer-details-back-link">Back to Dashboard</Link>
      </div>
    </div>
  </div>
));

NotFoundState.displayName = 'NotFoundState';

const Breadcrumbs = memo(({ auction }) => (
  <nav className="buyer-details-breadcrumbs">
    <Link to="/buyer/dashboard">Home</Link>
    <span>/</span>
    <Link to="/buyer/auctions">Auctions</Link>
    <span>/</span>
    <span>{auction?.category_name || 'Category'}</span>
    {/* <span>/</span>
    <span>Lot #{auction?.id || 'N/A'}</span> */}
  </nav>
));

Breadcrumbs.displayName = 'Breadcrumbs';

const ImageGallery = memo(({ images, selectedImage, onSelectImage, title }) => (
  <div className="buyer-details-images">
    <div className="buyer-details-main-image">
      <img
        src={images[selectedImage] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23222" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23666" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3ENo Image Available%3C/text%3E%3C/svg%3E'}
        alt={title}
      />
    </div>
    {images.length > 0 && (
      <div className="buyer-details-thumbnails">
        {images.map((image, index) => (
          <button
            key={index}
            className={`buyer-details-thumbnail ${selectedImage === index ? 'buyer-details-thumbnail-active' : ''}`}
            onClick={() => onSelectImage(index)}
          >
            <img src={image} alt={`${title} view ${index + 1}`} />
          </button>
        ))}
      </div>
    )}
  </div>
));

ImageGallery.displayName = 'ImageGallery';

const Timer = memo(({ timeRemaining }) => (
  <div className="buyer-details-timer-section">
    <div className="buyer-details-timer-label">TIME REMAINING</div>
    <div className="buyer-details-timer">
      <div className="buyer-details-timer-unit">
        <span className="buyer-details-timer-value">{String(timeRemaining.hours).padStart(2, '0')}</span>
        <span className="buyer-details-timer-label-small">Hours</span>
      </div>
      <span className="buyer-details-timer-separator">:</span>
      <div className="buyer-details-timer-unit">
        <span className="buyer-details-timer-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>
        <span className="buyer-details-timer-label-small">Minutes</span>
      </div>
      <span className="buyer-details-timer-separator">:</span>
      <div className="buyer-details-timer-unit">
        <span className={`buyer-details-timer-value ${timeRemaining.seconds < 30 ? 'buyer-details-timer-urgent' : ''}`}>
          {String(timeRemaining.seconds).padStart(2, '0')}
        </span>
        <span className="buyer-details-timer-label-small">Seconds</span>
      </div>
    </div>
  </div>
));

Timer.displayName = 'Timer';

const BidHistoryPanel = memo(({ bids, formatCurrency }) => (
  <div className="buyer-details-bid-history">
    <h3 className="buyer-details-panel-title">Bid History</h3>
    {bids && bids.length > 0 ? (
      <div className="buyer-details-bid-list">
        {bids.map((bid, index) => (
          <div key={bid.id} className="buyer-details-bid-item">
            <div className="buyer-details-bid-rank">#{index + 1}</div>
            <div className="buyer-details-bid-info">
              <div className="buyer-details-bid-bidder">{bid.bidder_name}</div>
              <div className="buyer-details-bid-time">
                {new Date(bid.created_at).toLocaleString()}
              </div>
            </div>
            <div className="buyer-details-bid-amount">{formatCurrency(parseFloat(bid.amount))}</div>
          </div>
        ))}
      </div>
    ) : (
      <p className="buyer-details-no-bids">No bids yet. Be the first to bid!</p>
    )}
  </div>
));

BidHistoryPanel.displayName = 'BidHistoryPanel';

const DescriptionTab = memo(({ auction, formatCurrency }) => (
  <div className="buyer-details-description">
    <p className="buyer-details-description-text">{auction?.description || 'No description available.'}</p>
    <div className="buyer-details-key-details">
      {auction?.specific_data && Object.entries(auction.specific_data).map(([key, value]) => (
        <div key={key} className="buyer-details-detail-item">
          <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}
        </div>
      ))}
      {auction?.pickup_address && (
        <div className="buyer-details-detail-item">
          <strong>Pickup Location:</strong> {auction.pickup_address}
        </div>
      )}
      {auction?.category_name && (
        <div className="buyer-details-detail-item">
          <strong>Category:</strong> {auction.category_name}
        </div>
      )}
      {auction?.handover_type && (
        <div className="buyer-details-detail-item">
          <strong>Handover Type:</strong> {auction.handover_type}
        </div>
      )}
      {auction?.initial_price && (
        <div className="buyer-details-detail-item">
          <strong>Starting Price:</strong> {formatCurrency(parseFloat(auction.initial_price))}
        </div>
      )}
      {auction?.is_buy_now_enabled && auction?.buy_now_price && (
        <div className="buyer-details-detail-item">
          <strong>Buy Now Price:</strong> {formatCurrency(parseFloat(auction.buy_now_price))}
        </div>
      )}
    </div>
  </div>
));

DescriptionTab.displayName = 'DescriptionTab';

// ==================== UTILITY FUNCTIONS ====================

const calculateTimeRemaining = (endDate) => {
  const now = new Date().getTime();
  const endDateMs = new Date(endDate).getTime();
  const difference = endDateMs - now;

  if (difference > 0) {
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }
  return { hours: 0, minutes: 0, seconds: 0 };
};

// ==================== MAIN COMPONENT ====================

const BuyerAuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const location = useLocation();
  const { profile } = useSelector(state => state.profile)
  const auctionObj = location.state?.listing;
  const { auctionBids, isPlacingBid, error } = useSelector(state => state.buyer);
  const buyerProfile = profile?.buyer_profile


  console.log(buyerProfile); // this is an object, in this object I am getting points value in points key in numbers


  useEffect(() => {
    dispatch(fetchAuctionBids(id));
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Fetch lot by id when no listing in state (e.g. direct URL or refresh)
  useEffect(() => {
    if (auctionObj || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const lot = await auctionService.getLot(id);
        if (!cancelled) {
          setState((prev) => ({ ...prev, selectedAuction: lot, isLoading: false }));
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error: err?.message || err?.response?.data?.detail || 'Failed to load lot',
            isLoading: false,
          }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, auctionObj]);

  // const [state, setState] = useState({
  //   selectedAuction: auctionObj || null,
  //   activeTab: 'description',
  //   customBidAmount: '',
  //   selectedImage: 0,
  //   timeRemaining: { hours: 0, minutes: 0, seconds: 0 },
  //   isLoading: !auctionObj,
  //   error: null,
  // });

  const [state, setState] = useState({
    selectedAuction: auctionObj || null,
    activeTab: 'description',
    customBidAmount: '',
    selectedImage: 0,
    timeRemaining: { hours: 0, minutes: 0, seconds: 0 },
    isLoading: !auctionObj,
    error: null,
    showPointsWarning: false,
  });

  // Calculate required points (50% of bid amount)
  const requiredPoints = useMemo(() => {
    const bidAmount = parseFloat(state.customBidAmount) || 0;
    return Math.ceil(bidAmount * 0.5); // 50% of bid amount
  }, [state.customBidAmount]);

  console.log("requiredPoints: ", requiredPoints);


  // Check if user has enough points
  const hasEnoughPoints = useMemo(() => {
    const userPoints = parseFloat(buyerProfile?.points) || 0;
    return userPoints >= requiredPoints;
  }, [buyerProfile?.points, requiredPoints]);

  console.log("hasEnoughPoints: ", hasEnoughPoints);


  // Memoized computed values
  const auction = state.selectedAuction;
  const images = useMemo(() =>
    auction?.media?.filter(m => m.media_type === 'image').map(m => getMediaUrl(m.file)) || [],
    [auction?.media]
  );
  const isLive = useMemo(() => auction?.status === 'ACTIVE', [auction?.status]);
  const isUpcoming = useMemo(() => auction?.status === 'APPROVED', [auction?.status]);
  const isClosed = useMemo(() => auction?.status === 'CLOSED', [auction?.status]);
  const isAwaitingPayment = useMemo(() => auction?.status === 'AWAITING_PAYMENT', [auction?.status]);

  console.log("isUpcoming: ", isUpcoming);


  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, [auction?.currency]);

  // Event handlers
  const handleSelectImage = useCallback((index) => {
    setState(prev => ({ ...prev, selectedImage: index }));
  }, []);

  const handleSetActiveTab = useCallback((tab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // const handleCustomBidChange = useCallback((e) => {
  //   setState(prev => ({ ...prev, customBidAmount: e.target.value }));
  // }, []);

  const handleCustomBidChange = useCallback((e) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      customBidAmount: value,
      showPointsWarning: false
    }));
  }, []);

  // const handleCustomBidSubmit = useCallback((e) => {
  //   e.preventDefault();
  //   if (auction && state.customBidAmount) {
  //     dispatch(placeBid({
  //       auction_id: auction.id,
  //       amount: parseFloat(state.customBidAmount)
  //     }));
  //     setState(prev => ({ ...prev, customBidAmount: '' }));
  //     navigate('/buyer/auctions', { replace: true })
  //   }

  // }, [auction, state.customBidAmount, dispatch]);

  // Timer effect

  console.log(state, 'state');


  const handleCustomBidSubmit = useCallback((e) => {
    e.preventDefault();
    // Check if user has enough points
    if (!hasEnoughPoints) {
      setState(prev => ({
        ...prev,
        showPointsWarning: true
      }));
      return;
    }

    if (!auction || !state.customBidAmount) {
      return;
    }


    const bidAmount = parseFloat(state.customBidAmount);
    const minBidAmount = parseFloat(auction?.initial_price || 0) + 1;
    const highBidAmount = parseFloat(auctionBids?.[0]?.amount) + 1;

    // Validate bid amount
    if (bidAmount < highBidAmount) {
      setState(prev => ({
        ...prev,
        showPointsWarning: false
      }));
      toast.info('Bid must be greater than the highest bid')

      return;
    }
    // Validate bid amount
    if (bidAmount < minBidAmount) {
      setState(prev => ({
        ...prev,
        showPointsWarning: false
      }));
      toast.info('Bid must be greater than the current price')
      return;
    }

    // Place bid if validation passes
    dispatch(placeBid({
      auction_id: auction.id,
      amount: bidAmount
    })).then((result) => {
      if (result.type === 'buyer/placeBid/fulfilled') {
        setState(prev => ({
          ...prev,
          customBidAmount: '',
          showPointsWarning: false
        }));
        // Refresh bids and profile
        dispatch(fetchAuctionBids(id));
        dispatch(fetchProfile());
      }
    });

    navigate('/buyer/auctions', { replace: true })
  }, [auction, state.customBidAmount, hasEnoughPoints, dispatch, id]);


  useEffect(() => {
    if (isLive && auction?.end_date) {
      setState(prev => ({
        ...prev,
        timeRemaining: calculateTimeRemaining(auction.end_date)
      }));

      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: calculateTimeRemaining(auction.end_date)
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLive, auction?.end_date]);

  // Loading state
  if (state.isLoading && !state.selectedAuction) {
    return (
      <div className="buyer-details-page">
        <div className="buyer-details-container">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  // Not found state
  if (!state.selectedAuction) {
    return <NotFoundState />;
  }

  // Render based on auction status
  return (
    <div className={`buyer-details-page ${isLive ? 'buyer-details-live-page' : ''}`}>
      <div className="buyer-details-container">
        <Breadcrumbs auction={auction} />

        <div className="buyer-details-header-section">
          <h1 className="buyer-details-title">{auction?.title || 'Auction'}</h1>
        </div>

        <div className="buyer-details-content">
          <ImageGallery
            images={images}
            selectedImage={state.selectedImage}
            onSelectImage={handleSelectImage}
            title={auction?.title || 'Auction item'}
          />

          <div className="buyer-details-info">
            <div className="buyer-details-auction-meta">
              {/* <div className="buyer-details-meta-item">
                <span className="buyer-details-meta-label">Lot Number</span>
                <span className="buyer-details-meta-value">#{auction?.id || 'N/A'}</span>
              </div> */}
              <div className="buyer-details-meta-item">
                <span className="buyer-details-meta-label">Category</span>
                <span className="buyer-details-meta-value">{auction?.category_name || 'N/A'}</span>
              </div>
              <div className="buyer-details-meta-item">
                <span className="buyer-details-meta-label">Total Bids</span>
                <span className="buyer-details-meta-value">{auction?.total_bids || 0}</span>
              </div>
            </div>

            <div className="buyer-details-price-section">
              <div className="buyer-details-price-item">
                <div className='flex justify-between items-center'>
                  <span className="buyer-details-price-label">Starting Price</span>
                  <span className="buyer-details-price-value">{formatCurrency(parseFloat(auction?.initial_price || 0))}</span>

                </div>
                <div className='flex justify-between items-center'>

                  <span className="buyer-details-price-label">Highest Bid</span>
                  <span className="buyer-details-price-value">{formatCurrency(parseFloat(auctionBids?.[0]?.amount || 0))}</span>
                </div>
              </div>
              {auction?.is_buy_now_enabled && auction?.buy_now_price && (
                <div className="buyer-details-price-item">
                  <span className="buyer-details-price-label">Buy Now</span>
                  <span className="buyer-details-price-value">{formatCurrency(parseFloat(auction.buy_now_price))}</span>
                </div>
              )}
            </div>

            <div className="buyer-details-timeline">
              <div className="buyer-details-timeline-item">
                <span className="buyer-details-timeline-label">Starts</span>
                <span className="buyer-details-timeline-value">
                  {new Date(auction?.start_date).toLocaleString()}
                </span>
              </div>
              <div className="buyer-details-timeline-item">
                <span className="buyer-details-timeline-label">Ends</span>
                <span className="buyer-details-timeline-value">
                  {new Date(auction?.end_date).toLocaleString()}
                </span>
              </div>
            </div>

            {isLive && state.timeRemaining.hours + state.timeRemaining.minutes + state.timeRemaining.seconds > 0 && (
              <Timer timeRemaining={state.timeRemaining} />
            )}

            {isUpcoming && (
              <div className="buyer-details-upcoming-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <strong>This auction is not live yet</strong>
                  <p>Bidding will be available when the auction goes live.</p>
                </div>
              </div>
            )}

            {isClosed && (
              <div className="buyer-details-closed-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <strong>This auction has ended</strong>
                  <p>No more bids can be placed.</p>
                </div>
              </div>
            )}

            {isAwaitingPayment && (
              <div className="buyer-details-payment-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10C6.48 4 2 6.69 2 10c0 3.72 4.64 7 10 7 .93 0 1.83-.13 2.71-.38.67.52 1.49.99 2.29.99 1.1 0 2-.9 2-2 0-.78-.49-1.45-1.19-1.78.71-1.03 1.19-2.3 1.19-3.83 0-3.31-4.48-6-10-6z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div>
                  <strong>Awaiting payment</strong>
                  <p>Complete your payment to finalize this purchase.</p>
                </div>
              </div>
            )}

            {/* {isLive && (
              <form className="buyer-details-bidding-form" onSubmit={handleCustomBidSubmit}>
                <input
                  type="number"
                  className="buyer-details-bid-input"
                  placeholder="Enter your bid amount"
                  value={state.customBidAmount}
                  onChange={handleCustomBidChange}
                  min={parseFloat(auction?.initial_price || 0) + 1}
                  step="0.01"
                />
                <button type="submit" className="buyer-details-bid-button">Place Bid</button>
              </form>
            )} */}

            {isLive && (
              <>
                {/* Points Information Notice */}
                <div className="buyer-details-notice rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Points Required</h4>
                      <p className="text-sm ">
                        You must have at least <strong>50% of your bid amount</strong> in points to place a bid.

                      </p>
                    </div>
                  </div>
                </div>

                <form className="buyer-details-bidding-form" onSubmit={handleCustomBidSubmit}>
                  <div className="space-y-3 w-full">
                    <input
                      type="number"
                      className="buyer-details-bid-input"
                      placeholder="Enter your bid amount"
                      value={state.customBidAmount}
                      onChange={handleCustomBidChange}
                      // min={parseFloat(auction?.initial_price || 0) + 1}
                      // step="0.01"
                      disabled={isPlacingBid}
                    />

                    {/* Dynamic Points Calculation */}
                    {/* {state.customBidAmount && (
                      <div className={`p-3 mt-2 w-full rounded-lg border ${hasEnoughPoints ? 'bg-green-700/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={hasEnoughPoints ? 'text-green-300' : 'text-amber-300'}>
                            Points Required:
                          </span>
                          <span className={`font-semibold ${hasEnoughPoints ? 'text-green-200' : 'text-amber-200'}`}>
                            {requiredPoints}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className={hasEnoughPoints ? 'text-green-300' : 'text-amber-300'}>
                            Your Points:
                          </span>
                          <span className={`font-semibold ${hasEnoughPoints ? 'text-green-200' : 'text-amber-200'}`}>
                            {buyerProfile?.points || 0}
                          </span>
                        </div>
                        {!hasEnoughPoints && (
                          <div className="mt-2 pt-2 border-t border-amber-500/20">
                            <p className="text-amber-200 text-xs">
                              You need {requiredPoints - (buyerProfile?.points || 0)} more points
                            </p>
                          </div>
                        )}
                      </div>
                    )} */}

                    {/* Insufficient Points Warning */}
                    {state.showPointsWarning || !hasEnoughPoints && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-red-300 font-semibold mb-1">Insufficient Points</h4>
                            <p className="text-red-200 text-sm mb-2">
                              You do not have enough points to place this bid. Please try one of the following:
                            </p>
                            <ul className="text-red-200 text-sm space-y-1 list-disc list-inside">
                              {/* <li>Lower your bid amount</li> */}
                              <li>Purchase more points</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="buyer-details-bid-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isPlacingBid || !state.customBidAmount || !hasEnoughPoints}
                    >
                      {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <div className="buyer-details-location-info">
              <h4>Pickup Information</h4>
              <div className="buyer-details-location-item">
                <span className="buyer-details-location-label">Handover Type:</span>
                <span className="buyer-details-location-value">{auction?.handover_type || 'N/A'}</span>
              </div>
              <div className="buyer-details-location-item">
                <span className="buyer-details-location-label">Location:</span>
                <span className="buyer-details-location-value">{auction?.pickup_address || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="buyer-details-tabs-section">
          <div className="buyer-details-tabs">
            <button
              className={`buyer-details-tab ${state.activeTab === 'description' ? 'buyer-details-tab-active' : ''}`}
              onClick={() => handleSetActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`buyer-details-tab ${state.activeTab === 'bids' ? 'buyer-details-tab-active' : ''}`}
              onClick={() => handleSetActiveTab('bids')}
            >
              Bid History ({auctionBids?.length || 0})
            </button>
          </div>

          <div className="buyer-details-tab-content">
            {state.activeTab === 'description' && (
              <DescriptionTab auction={auction} formatCurrency={formatCurrency} />
            )}
            {state.activeTab === 'bids' && (
              <BidHistoryPanel bids={auctionBids} formatCurrency={formatCurrency} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerAuctionDetails;