import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { placeBid, fetchAuctionBids, addToFavorite, deleteFavorite } from '../store/actions/buyerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { auctionService } from '../services/interceptors/auction.service';
import { getMediaUrl } from '../config/api.config';
import './BuyerAuctionDetails.css';
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
            <div key={bid.id ?? index} className="buyer-details-bid-item">
            <div className="buyer-details-bid-rank">#{index + 1}</div>
            <div className="buyer-details-bid-info">
              <div className="buyer-details-bid-bidder">{bid.bidder_name ?? bid.user_name ?? bid.bidder ?? 'Bidder'}</div>
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
  if (!endDate) return { hours: 0, minutes: 0, seconds: 0 };
  const now = new Date().getTime();
  const endDateMs = new Date(endDate).getTime();
  if (isNaN(endDateMs)) return { hours: 0, minutes: 0, seconds: 0 };
  const difference = endDateMs - now;

  if (difference > 0) {
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }
  return { hours: 0, minutes: 0, seconds: 0 };
};

const formatTimelineDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

// ==================== MAIN COMPONENT ====================

const BuyerAuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const auctionObj = location.state?.listing;
  const fromBuyAndSell = location.state?.from === 'buyer-buy';
  const { auctionBids, isPlacingBid, error, categories } = useSelector(state => state.buyer);

  useEffect(() => {
    if (id) dispatch(fetchAuctionBids(id));
  }, [id, dispatch]);

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
    selectedImage: 0,
    timeRemaining: { hours: 0, minutes: 0, seconds: 0 },
    isLoading: !auctionObj,
    error: null,
    isFavorite: auctionObj?.is_favourite ?? false,
  });

  // Use same categories API as Buy & Sell (GET /auctions/categories/) - not the detail endpoint which returns 403
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Get category from Redux (same source as Buy & Sell - GET /auctions/categories/)
  const categoryDetail = useMemo(() => {
    const categoryId = state.selectedAuction?.category ?? state.selectedAuction?.category_id;
    if (!categoryId) return null;
    const list = Array.isArray(categories) ? categories : categories?.results ?? [];
    if (!list.length) return null;
    const id = Number(categoryId);
    return list.find((c) => c.id === id || Number(c.id) === id) ?? null;
  }, [state.selectedAuction?.category, state.selectedAuction?.category_id, categories]);

  // Compute next valid bid from increment rules: user can only bid (current + increment), capped by up_to
  const { nextBidAmount, incrementRules } = useMemo(() => {
    const ranges = categoryDetail?.increment_rules?.ranges;
    const initialPrice = parseFloat(state.selectedAuction?.initial_price || 0);
    const highestBid = parseFloat(auctionBids?.[0]?.amount ?? 0);
    const currentHighest = Math.max(initialPrice, highestBid);

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      return { nextBidAmount: currentHighest + 1, incrementRules: null };
    }

    // Find applicable range (ranges are typically ordered by up_to ascending)
    const sorted = [...ranges].sort((a, b) => (a.up_to ?? 0) - (b.up_to ?? 0));
    let increment = sorted[0]?.increment ?? 1;
    let upTo = sorted[0]?.up_to ?? Infinity;

    for (const r of sorted) {
      if (currentHighest < (r.up_to ?? Infinity)) {
        increment = Number(r.increment) || 1;
        upTo = Number(r.up_to) ?? Infinity;
        break;
      }
    }

    const nextRaw = currentHighest + increment;
    const nextBid = Math.min(nextRaw, upTo);
    return {
      nextBidAmount: nextBid > currentHighest ? nextBid : null,
      incrementRules: { increment, upTo },
    };
  }, [state.selectedAuction?.initial_price, auctionBids, categoryDetail?.increment_rules?.ranges]);


  // Memoized computed values
  const auction = state.selectedAuction;


  useEffect(() => {
    if (auction?.is_favourite != null) {
      setState((prev) => ({ ...prev, isFavorite: !!auction.is_favourite }));
    }
  }, [auction?.is_favourite]);

  const images = useMemo(() =>
    auction?.media?.filter(m => m.media_type === 'image').map(m => getMediaUrl(m.file)) || [],
    [auction?.media]
  );
  const isLive = useMemo(() => auction?.status === 'ACTIVE', [auction?.status]);
  const isUpcoming = useMemo(() => auction?.status === 'APPROVED', [auction?.status]);
  const isClosed = useMemo(() => auction?.status === 'CLOSED', [auction?.status]);
  const isAwaitingPayment = useMemo(() => auction?.status === 'AWAITING_PAYMENT', [auction?.status]);

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

  const handleFavoriteToggle = useCallback(async () => {
    if (!auction?.id) return;
    try {
      if (state.isFavorite) {
        await dispatch(deleteFavorite(auction.id)).unwrap();
        toast.success('Removed from favorites');
      } else {
        await dispatch(addToFavorite(auction.id)).unwrap();
        toast.success('Added to favorites');
      }
      setState((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    } catch {
      // Error toast shown by buyerActions
    }
  }, [auction?.id, state.isFavorite, dispatch]);

  const handlePlaceIncrementalBid = useCallback(() => {
    if (!auction || nextBidAmount == null || isPlacingBid) return;
    dispatch(placeBid({
      lot_id: auction.id,
      amount: nextBidAmount,
    })).then((result) => {
      if (result.type === 'buyer/placeBid/fulfilled') {
        dispatch(fetchAuctionBids(id));
      }
    });
  }, [auction, nextBidAmount, isPlacingBid, dispatch, id]);


  const endDate = auction?.end_date ?? auction?.booked_in_date;
  useEffect(() => {
    if (isLive && endDate) {
      setState(prev => ({
        ...prev,
        timeRemaining: calculateTimeRemaining(endDate)
      }));

      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: calculateTimeRemaining(endDate)
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLive, endDate]);

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
          {!fromBuyAndSell && (
          <button
            type="button"
            className="buyer-details-favorite-btn"
            onClick={handleFavoriteToggle}
            aria-label={state.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {state.isFavorite ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          )}
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
              <div className="buyer-details-meta-item">
                <span className="buyer-details-meta-label">Category</span>
                <span className="buyer-details-meta-value">{auction?.category_name || 'N/A'}</span>
              </div>
              {!fromBuyAndSell && (
                <div className="buyer-details-meta-item">
                  <span className="buyer-details-meta-label">Total Bids</span>
                  <span className="buyer-details-meta-value">{auction?.total_bids || 0}</span>
                </div>
              )}
            </div>

            <div className="buyer-details-price-section">
              {fromBuyAndSell ? (
                <div className="buyer-details-price-item">
                  <span className="buyer-details-price-label">Price</span>
                  <span className="buyer-details-price-value">{formatCurrency(parseFloat(auction?.reserve_price || auction?.initial_price || 0))}</span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="buyer-details-timeline">
              <div className="buyer-details-timeline-item">
                <span className="buyer-details-timeline-label">Starts</span>
                <span className="buyer-details-timeline-value">
                  {formatTimelineDate(auction?.start_date ?? auction?.live_date)}
                </span>
              </div>
              <div className="buyer-details-timeline-item">
                <span className="buyer-details-timeline-label">Ends</span>
                <span className="buyer-details-timeline-value">
                  {formatTimelineDate(auction?.end_date ?? auction?.booked_in_date)}
                </span>
              </div>
            </div>

            {isLive && !fromBuyAndSell && state.timeRemaining.hours + state.timeRemaining.minutes + state.timeRemaining.seconds > 0 && (
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

            {isLive && fromBuyAndSell && (
              <div className="buyer-details-bidding-form">
                <button
                  type="button"
                  className="buyer-details-buy-now-button buyer-details-bid-button w-full"
                  onClick={() => {
                    const price = parseFloat(auction?.reserve_price || auction?.initial_price || 0);
                    toast.info(`Buy Now at ${formatCurrency(price)} — Contact support to complete purchase.`);
                  }}
                >
                  Buy Now — {formatCurrency(parseFloat(auction?.reserve_price || auction?.initial_price || 0))}
                </button>
              </div>
            )}

            {isLive && !fromBuyAndSell && (
              <div className="buyer-details-bidding-form">
                <p className="buyer-details-increment-hint">
                  Bid increment: {formatCurrency(incrementRules?.increment ?? 1)}
                  {incrementRules?.upTo != null && incrementRules.upTo < Infinity && (
                    <> (up to {formatCurrency(incrementRules.upTo)})</>
                  )}
                </p>
                <button
                  type="button"
                  className="buyer-details-bid-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePlaceIncrementalBid}
                  disabled={isPlacingBid || nextBidAmount == null}
                >
                  {isPlacingBid ? 'Placing Bid...' : `Place Bid ${nextBidAmount != null ? formatCurrency(nextBidAmount) : ''}`}
                </button>
              </div>
            )}
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
            {!fromBuyAndSell && (
              <button
                className={`buyer-details-tab ${state.activeTab === 'bids' ? 'buyer-details-tab-active' : ''}`}
                onClick={() => handleSetActiveTab('bids')}
              >
                Bid History ({auctionBids?.length || 0})
              </button>
            )}
          </div>

          <div className="buyer-details-tab-content">
            {state.activeTab === 'description' && (
              <DescriptionTab auction={auction} formatCurrency={formatCurrency} />
            )}
            {!fromBuyAndSell && state.activeTab === 'bids' && (
              <BidHistoryPanel bids={auctionBids} formatCurrency={formatCurrency} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerAuctionDetails;