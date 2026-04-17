import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearBuyerError } from '../store/slices/buyerSlice';
import { getMyFavoriteAuctions } from '../store/actions/buyerActions';
import LotRow from '../components/LotRow';
import GuestLotDrawer from '../components/GuestLotDrawer';
import './FavoriteAuctions.css';
import './GuestEventLots.css';
import { toast } from 'react-toastify';

const FavoriteAuctions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);

  // Redux state
  const { auctions, error } = useSelector(state => state.buyer);
  const { token } = useSelector(state => state.auth);

  // Local state for complete dataset
  const [allAuctions, setAllAuctions] = useState([]);
  const [isLoadingAllPages, setIsLoadingAllPages] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const handleCheckAuth = useCallback(() => {
    if (!token) {
      toast.info('Please sign in to view auction details');
      navigate('/signin');
    }
  }, [token, navigate]);

  // Fetch all pages of auctions
  const fetchAllPages = useCallback(async () => {
    setIsLoadingAllPages(true);
    try {
      let allResults = [];
      let nextPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(getMyFavoriteAuctions({ page: nextPage, page_size: 10 })).unwrap();
        const items = response?.results ?? response?.data ?? (Array.isArray(response) ? response : []);
        allResults = [...allResults, ...items];

        if (response?.next && items.length > 0) {
          nextPage += 1;
        } else {
          hasMore = false;
        }
      }

      setAllAuctions(allResults);
      setFavoriteIds(new Set(allResults.map((a) => a.id)));
    } catch (err) {
      console.error('Error fetching all auctions:', err);
      toast.error('Failed to load complete auction list');
    } finally {
      setIsLoadingAllPages(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAllPages();
  }, [fetchAllPages]);

  const handleLotClick = useCallback((lot) => {
    if (token) {
      setSelectedLot(lot);
    } else {
      handleCheckAuth();
    }
  }, [token, handleCheckAuth]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedLot(null);
  }, []);

  const handleFavoriteToggle = useCallback((lotId, isFavorite) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(lotId);
      else next.delete(lotId);
      return next;
    });
    if (!isFavorite) {
      setAllAuctions((prev) => prev.filter((a) => a.id !== lotId));
    }
  }, []);

  // Apply filters to show ACTIVE, APPROVED, and COMPLETED auctions
  const filteredAuctions = useMemo(() => {
    return allAuctions.filter(auction => {
      const status = (auction.status || '').toUpperCase();
      return status === 'ACTIVE' || status === 'APPROVED' || status === 'COMPLETED';
    });
  }, [allAuctions]);


  // Paginate filtered results (10 per page)
  const itemsPerPage = 10;
  const totalFilteredCount = filteredAuctions.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNext = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const handlePrevious = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearBuyerError());
    };
  }, [dispatch]);

  return (
    <div className={`buyer-dashboard-page favorite-auctions-page ${selectedLot ? 'favorite-auctions-page--drawer-open' : ''}`}>
      <main className="buyer-dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-welcome">
            <div className="welcome-content">
              <h1 className="welcome-title">Favorite Auctions</h1>
              {!isLoadingAllPages && allAuctions.length > 0 && (
                <p className="welcome-subtitle">
                  {allAuctions.length} {allAuctions.length === 1 ? 'auction' : 'auctions'} in your favorites
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoadingAllPages && allAuctions.length === 0 && (
            <div className="auctions-loading">
              <div className="auctions-spinner"></div>
              <p>Loading auctions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingAllPages && allAuctions.length === 0 && (
            <div className="auctions-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="auctions-error-message">
                {error.message || error.detail || 'Failed to load auctions'}
              </p>
              <button
                className="auctions-retry-btn"
                onClick={() => fetchAllPages()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingAllPages && !error && paginatedAuctions.length === 0 && (
            <div className="auctions-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2>No favorite auctions</h2>
              <p>Start adding auctions to your favorites to see them here</p>
            </div>
          )}

          {/* Lot list (same layout as Live Auction / Event Lots) */}
          {!isLoadingAllPages && !error && paginatedAuctions.length > 0 && (
            <>
              <div className="favorite-auctions-list-wrap">
                <p className="guest-event-lots__results-count">
                  Your search returned {paginatedAuctions.length} result{paginatedAuctions.length !== 1 ? 's' : ''}
                </p>
                <div className="guest-event-lots__list">
                  {paginatedAuctions.map((auction) => (
                    <LotRow
                      key={auction.id}
                      lot={auction}
                      eventStartTime={auction.start_date ?? auction.startdate}
                      eventEndTime={auction.end_date ?? auction.end_time ?? auction.enddate}
                      eventTitle={auction.event_title}
                      eventStatus={auction.event_status ?? auction.status}
                      onOpenDetail={handleLotClick}
                      showFavorite
                      isFavorite={favoriteIds.has(auction.id) ?? auction.is_favourite ?? true}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalFilteredCount > itemsPerPage && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={!hasPrevPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasPrevPage
                      ? 'text-[#39AE47] border-[#39AE47] hover:bg-[#39AE47] hover:text-black cursor-pointer transition-all duration-200'
                      : 'border-white/20 bg-black text-white/40 cursor-not-allowed'
                      }`}
                  >
                    Previous
                  </button>
                  <button disabled className="px-4 py-2 rounded-sm border-[1px] border-[#39AE47] text-[#39AE47] bg-black">
                    <strong className='text-sm'>{page} of {totalPages}</strong>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNextPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasNextPage
                      ? 'text-[#39AE47] border-[#39AE47] hover:bg-[#39AE47] hover:text-black cursor-pointer transition-all duration-200'
                      : 'border-white/20 bg-black text-white/40 cursor-not-allowed'
                      }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedLot && (
        <GuestLotDrawer
          lot={selectedLot}
          eventEndTime={selectedLot.end_date ?? selectedLot.end_time}
          eventTitle={selectedLot.event_title}
          eventId={selectedLot.event_id ?? selectedLot.event}
          eventStatus={selectedLot.event_status}
          onClose={handleCloseDrawer}
          isBuyer
        />
      )}
    </div>
  );
};

export default FavoriteAuctions;