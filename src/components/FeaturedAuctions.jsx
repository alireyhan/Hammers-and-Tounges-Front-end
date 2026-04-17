import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './FeaturedAuctions.css'
import { useSelector, useDispatch } from 'react-redux'
import { fetchAuctionsList } from '../store/actions/AuctionsActions'
import { getMediaUrl } from '../config/api.config'
import { toast } from 'react-toastify'

const FeaturedAuctions = ({ selectedCategory }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { token } = useSelector(state => state.auth)

  const [page, setPage] = useState(1)
  const [allAuctions, setAllAuctions] = useState([])
  const [isLoadingAllPages, setIsLoadingAllPages] = useState(false)
  const [error, setError] = useState(null)

  

  // Fetch all pages of auctions on mount
  useEffect(() => {
    const fetchAllPages = async () => {
      setIsLoadingAllPages(true)
      setError(null)
      try {
        let allResults = []
        let nextPage = 1
        let hasMore = true

        while (hasMore) {
          const response = await dispatch(fetchAuctionsList({ page: nextPage })).unwrap()
          allResults = [...allResults, ...(response.results || [])]

          if (response.next) {
            nextPage += 1
          } else {
            hasMore = false
          }
        }

        setAllAuctions(allResults)
      } catch (err) {
        console.error('Error fetching all auctions:', err)
        setError('Failed to load auctions')
        toast.error('Failed to load complete auction list')
      } finally {
        setIsLoadingAllPages(false)
      }
    }

    fetchAllPages()
  }, [dispatch])

  // Filter auctions: ACTIVE status + selected category
  const filteredAuctions = useMemo(() => {
    return allAuctions.filter(auction => {
      if (auction.status !== 'ACTIVE') return false

      if (selectedCategory && auction.category_name !== selectedCategory) {
        return false
      }

      return true
    })
  }, [allAuctions, selectedCategory])

  // Paginate filtered results (10 per page)
  const itemsPerPage = 10
  const totalFilteredCount = filteredAuctions.length
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex)

  // Reset to page 1 when category changes
  useEffect(() => {
    setPage(1)
  }, [selectedCategory])

  // Get auction image with fallback
  const getAuctionImage = useCallback((auction) => {
    if (auction?.media?.[0]?.file) {
      return getMediaUrl(auction.media[0].file)
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
  }, [])

  // Handle authentication check
  const handleCheckAuth = useCallback(() => {
    if (!token) {
      toast.info('Please sign in to view auction details')
      navigate('/signin')
    }
  }, [token, navigate])

  // Pagination handlers
  const handleNext = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1)
    }
  }, [page, totalPages])

  const handlePrevious = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1)
    }
  }, [page])

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <section className="featured-section">
      <div className="featured-container">
        <div className="featured-header">
          <h2 className="featured-title">Featured Auctions</h2>
          <span className="featured-results-count">
            {isLoadingAllPages ? 'Loading...' : `${totalFilteredCount} Results`}
          </span>
        </div>

        {/* Loading State */}
        {isLoadingAllPages && allAuctions.length === 0 && (
          <div className="featured-loading">
            <div className="featured-spinner"></div>
            <p>Loading auctions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoadingAllPages && allAuctions.length === 0 && (
          <div className="featured-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="featured-error-message">{error}</p>
            <button
              className="featured-retry-btn"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAllPages && !error && paginatedAuctions.length === 0 && (
          <div className="featured-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9 11L12 14L22 4" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#d1d5db" strokeWidth="2" />
            </svg>
            <h2>No auctions found</h2>
            <p>
              There are currently no active auctions
              {selectedCategory ? ` in ${selectedCategory}.` : '.'}
            </p>
          </div>
        )}

        {/* Auctions Grid */}
        {!isLoadingAllPages && !error && paginatedAuctions.length > 0 && (
          <>
            <div className="auctions-grid">
              {paginatedAuctions.map(auction => (
                <div key={auction.id} className="feature-auction-card">
                  <div className="auction-image">
                    <img
                      src={getAuctionImage(auction)}
                      alt={auction.title}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>

                  <div className="auction-content">
                    <h3 className="auction-title">{auction.title}</h3>

                    <div className="auction-details">
                      <div className="auction-bid">
                        <span className="detail-label">Starting Price</span>
                        <span className="detail-value">
                          {`${auction?.currency || 'USD'} ${auction.initial_price}`}
                        </span>
                      </div>

                      <div className="auction-time">
                        <span className="detail-label">Total Bids</span>
                        <span className="detail-value">
                          {auction.total_bids}
                        </span>
                      </div>
                    </div>

                    <button
                      className="auction-button"
                      onClick={() => {
                        token
                          ? navigate(`/auction/${auction.id}`)
                          : handleCheckAuth()
                      }}
                      disabled={isLoadingAllPages}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalFilteredCount > itemsPerPage && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevPage || isLoadingAllPages}
                  className={`px-3 py-2 text-sm rounded border-[1px] ${hasPrevPage && !isLoadingAllPages
                    ? 'text-[#39AE47] border-[#39AE47] hover:bg-[#39AE47] hover:text-black cursor-pointer transition-all duration-200'
                    : 'border-white/20 bg-black text-white/40 cursor-not-allowed'
                    }`}
                >
                  Previous
                </button>
                <button disabled className="px-3 py-2 text-sm  rounded-sm border-[1px] border-[#39AE47] text-[#39AE47] bg-black">
                  <strong className='text-sm'>{page} of {totalPages}</strong>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNextPage || isLoadingAllPages}
                  className={`px-3 py-2 text-sm rounded border-[1px] ${hasNextPage && !isLoadingAllPages
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
    </section>
  )
}

export default FeaturedAuctions