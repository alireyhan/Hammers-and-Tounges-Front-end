import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearBuyerError } from '../store/slices/buyerSlice';
import './FavoriteAuctions.css';
import { toast } from 'react-toastify';
import { getMyFavoriteAuctions } from '../store/actions/buyerActions';

const FavoriteAuctionCard = lazy(() => import('../components/FavoriteAuctionCard'));

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

  // Apply filters to show only ACTIVE and APPROVED auctions
  const filteredAuctions = useMemo(() => {
    return allAuctions.filter(auction => {
      // Show both ACTIVE and APPROVED status
      return auction.status === 'ACTIVE' || auction.status === 'APPROVED';
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

  // Handle favorite update from AuctionCard
  const handleFavoriteUpdate = useCallback((auctionId, isFavorite) => {
    if (!isFavorite) {
      // Remove the auction from the list when unfavorited
      setAllAuctions(prevAuctions => 
        prevAuctions.filter(auction => auction.id !== auctionId)
      );

      // If current page becomes empty after removal, go to previous page
      const remainingCount = allAuctions.length - 1;
      const remainingPages = Math.ceil(remainingCount / itemsPerPage);
      
      if (page > remainingPages && remainingPages > 0) {
        setPage(remainingPages);
      }
    } else {
      // Update the auction's favorite status (in case it's re-added)
      setAllAuctions(prevAuctions =>
        prevAuctions.map(auction =>
          auction.id === auctionId
            ? { ...auction, is_favourite: isFavorite }
            : auction
        )
      );
    }
  }, [allAuctions.length, itemsPerPage, page]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearBuyerError());
    };
  }, [dispatch]);

  return (
    <div className="buyer-dashboard-page">
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

          {/* Auctions Grid */}
          {!isLoadingAllPages && !error && paginatedAuctions.length > 0 && (
            <>
              <div className="auctions-grid">
                <Suspense fallback={
                  <div className="auctions-loading">
                    <div className="auctions-spinner"></div>
                  </div>
                }>
                  {paginatedAuctions.map(auction => (
                    <FavoriteAuctionCard
                      key={auction.id}
                      auction={{
                        ...auction,
                        categoryname: auction.category_name,
                        initialprice: auction.initial_price,
                        startdate: auction.start_date,
                        enddate: auction.end_date,
                        totalbids: auction.total_bids,
                        status: auction.status
                      }}
                      onClick={() => {
                        if (token) {
                          navigate(`/buyer/auction/${auction.id}`, { 
                            state: { 
                              from: 'favorite-auctions', 
                              listing: auction 
                            } 
                          });
                        } else {
                          handleCheckAuth();
                        }
                      }}
                      onFavoriteUpdate={handleFavoriteUpdate}
                    />
                  ))}
                </Suspense>
              </div>

              {/* Pagination Controls */}
              {totalFilteredCount > itemsPerPage && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={!hasPrevPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasPrevPage
                      ? 'text-[#8cc63f] border-[#8cc63f] hover:bg-[#8cc63f] hover:text-black cursor-pointer transition-all duration-200'
                      : 'border-white/20 bg-black text-white/40 cursor-not-allowed'
                      }`}
                  >
                    Previous
                  </button>
                  <button disabled className="px-4 py-2 rounded-sm border-[1px] border-[#8cc63f] text-[#8cc63f] bg-black">
                    <strong className='text-sm'>{page} of {totalPages}</strong>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNextPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasNextPage
                      ? 'text-[#8cc63f] border-[#8cc63f] hover:bg-[#8cc63f] hover:text-black cursor-pointer transition-all duration-200'
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
    </div>
  );
};

export default FavoriteAuctions;