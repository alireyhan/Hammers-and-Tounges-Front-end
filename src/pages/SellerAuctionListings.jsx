import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SellerAuctionListings.css'
import { useSelector, useDispatch } from 'react-redux'
import { fetchMyAuctions } from '../store/actions/sellerActions'
import { toast } from 'react-toastify'
import { getMediaUrl } from '../config/api.config'

const SellerAuctionListings = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [allAuctions, setAllAuctions] = useState([])
  const [isLoadingAllPages, setIsLoadingAllPages] = useState(false)

  // Redux state
  const { myAuctions, isLoading, error } = useSelector(state => state.seller)

  // Fetch all pages of auctions on component mount
  useEffect(() => {
    const fetchAllPages = async () => {
      setIsLoadingAllPages(true)
      try {
        let allResults = []
        let nextPage = 1
        let hasMore = true

        while (hasMore) {
          const response = await dispatch(fetchMyAuctions({ page: nextPage })).unwrap()
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
        toast.error('Failed to load complete auction list')
      } finally {
        setIsLoadingAllPages(false)
      }
    }

    fetchAllPages()
  }, [dispatch])

  // Apply filter to complete dataset
  const filteredListings = useMemo(() => {
    return allAuctions.filter(listing => {
      if (filter === 'all') return true
      return listing?.status === filter
    })
  }, [allAuctions, filter])

  // Pagination configuration
  const itemsPerPage = 10
  const totalFilteredCount = filteredListings.length
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedListings = filteredListings.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [filter])

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

  // Status badge configuration
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      DRAFT: { text: 'DRAFT', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
      ACTIVE: { text: 'ACTIVE', color: '#39AE47', bg: 'rgba(140, 198, 63, 0.15)' },
      AWAITING_PAYMENT: { text: 'Awaiting Payment', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
      PENDING: { text: 'PENDING', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
      APPROVED: { text: 'APPROVED', color: '#39AE47', bg: 'rgba(16, 185, 129, 0.15)' },
      CLOSED: { text: 'CLOSED', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' },
      REJECTED: { text: 'REJECTED', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
    }
    const config = statusConfig[status] || statusConfig.ACTIVE
    return (
      <span
        className="s-status-badge"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}`
        }}
      >
        {config.text}
      </span>
    )
  }, [])

  // Get image with fallback
  const getAuctionImage = useCallback((media) => {
    if (!media || !Array.isArray(media) || media.length === 0) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E'
    }
    return getMediaUrl(media[0]?.file) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E'
  }, [])

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (allAuctions.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C17.7893 5.21071 17.5304 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="empty-state-title">No listings yet</h3>
          <p className="empty-state-description">You haven't created any auction listings yet. Start by creating your first product to begin selling.</p>
          <div className="empty-state-actions">
            <Link to="/seller/product" className="action-button primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Create Your First Listing
            </Link>
          </div>
        </div>
      )
    }

    if (filteredListings.length === 0) {
      const filterMessages = {
        ACTIVE: 'ACTIVE',
        APPROVED: 'APPROVED',
        PENDING: 'PENDING',
        CLOSED: 'CLOSED',
        DRAFT: 'DRAFT',
        AWAITING_PAYMENT: 'AWAITING_PAYMENT',
        REJECTED: 'REJECTED',
      }

      const filterIcon = {
        ACTIVE: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
        APPROVED: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
        CLOSED: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
        DRAFT: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M11 5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L9 16L10 13L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
        PENDING: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
        REJECTED: <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>,
      }

      const filterTitle = {
        ACTIVE: 'No Active Listings',
        APPROVED: 'No Approved Listings',
        PENDING: 'No Pending Listings',
        CLOSED: 'No Closed Auctions',
        DRAFT: 'No Drafts Found',
        AWAITING_PAYMENT: 'No Awaiting Payments Found',
        REJECTED: 'No Rejected Auctions',
      }

      const filterDescription = {
        ACTIVE: "You don't have any ACTIVE auctions running at the moment. Create a new listing or activate your drafts.",
        APPROVED: "You don't have any approved listings. Approved listings are ready to be activated.",
        PENDING: "You don't have any pending listings. Start creating a new product to save as draft.",
        CLOSED: "You don't have any ended auctions. All your ACTIVE listings are still running.",
        DRAFT: "You don't have any draft listings. Start creating a new product to save as draft.",
        AWAITING_PAYMENT: "You don't have any draft listings. Start creating a new product to save as draft.",
        REJECTED: "You don't have any rejected listings. Start creating a new product to save as draft.",
      }

      return (
        <div className="empty-state empty-state-filtered">
          <div className="empty-state-icon">{filterIcon[filter] || filterIcon.ACTIVE}</div>
          <h3 className="empty-state-title">{filterTitle[filter] || 'No Listings Found'}</h3>
          <p className="empty-state-description">{filterDescription[filter] || `You don't have any ${filterMessages[filter] || ''} listings.`}</p>
          <div className="empty-state-actions">
            <button className="action-button primary" onClick={() => setFilter('all')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 12L9 18L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View All Listings
            </button>
            {filter === 'DRAFT' && (
              <Link to="/seller/product" className="secondary-button empty-state-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create New Draft
              </Link>
            )}
          </div>
        </div>
      )
    }

    return null
  }, [allAuctions.length, filteredListings.length, filter])

  return (
    <div className="seller-page">
      <main className="seller-main">
        <div className="page-container">
          <div className="page-header">
            <div className="page-title-section">
              <h1 className="page-title">My Products</h1>
              <p className="page-subtitle">Manage all your auction products in one place</p>
            </div>
            <div className="page-actions">
              <Link to="/seller/product" className="action-button primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create New Product
              </Link>
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
              <p className="auctions-error-message">{error?.message || error?.detail || 'Failed to load auctions'}</p>
              <button className="auctions-retry-btn" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {/* Filter Section */}
          {!isLoadingAllPages && !error && allAuctions.length > 0 && (
            <div className="filters-section">
              <div className="filters-left">
                <div className="filter-group">
                  <label className="filter-label">Filter by:</label>
                  <div className="filter-buttons">
                    {['all', 'ACTIVE', 'APPROVED', 'PENDING', 'DRAFT', 'CLOSED', 'AWAITING_PAYMENT', 'REJECTED'].map(status => (
                      <button
                        key={status}
                        className={`filter-button ${filter === status ? 'active' : ''}`}
                        onClick={() => setFilter(status)}
                      >
                        {status === 'all' ? 'All Listings' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isLoadingAllPages && !error && paginatedListings.length > 0 ? (
            <div>
              <div className="listings-grid">
                {paginatedListings.map((listing) => (
                  <div key={listing.id} className="s-listing-card">
                    <div className="listing-card-header">
                      <div className="listing-image">
                        <img
                          src={getAuctionImage(listing?.media)}
                          alt={listing?.title}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EImage Failed to Load%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      </div>
                      <div className="listing-status">
                        {getStatusBadge(listing?.status)}
                      </div>
                    </div>
                    <div className="parent-container">
                      <div className="listing-card-body">
                        <h3 className="s-listing-title">{listing?.title}</h3>
                        <div className="flex items-center justify-between gap-2 w-full">
                          <p className="s-listing-category text-white">Category:</p>
                          <p className="s-listing-category">{listing?.category_name}</p>
                        </div>
                        <div className="listing-metrics">
                          <div className="metric">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>{listing?.total_bids} bids</span>
                          </div>
                        </div>
                        {listing.status === 'ACTIVE' && listing.end_date && (
                          <div className="listing-time">
                            <span>Ends in   </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span> {new Date(listing.end_date).toLocaleDateString()} </span>
                          </div>
                        )}
                      </div>
                      <div className="listing-card-footer">
                        <button
                          onClick={
                            () => navigate(`/seller/listing/${listing.id}`, {
                              state: { from: 'auction-listings', listing: listing }
                            })
                          }
                          className="s-primary-button small">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalFilteredCount > itemsPerPage && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={!hasPrevPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasPrevPage ? 'text-[#39AE47] border-[#39AE47] hover:bg-[#39AE47] hover:text-black cursor-pointer transition-all duration-200' : 'border-white/20 bg-black text-white/40 cursor-not-allowed'}`}
                  >
                    Previous
                  </button>
                  <button disabled className="px-4 py-2 rounded-sm border-[1px] border-[#39AE47] text-[#39AE47] bg-black">
                    <strong className="text-sm">{page} of {totalPages}</strong>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNextPage}
                    className={`px-4 py-2 rounded border-[1px] ${hasNextPage ? 'text-[#39AE47] border-[#39AE47] hover:bg-[#39AE47] hover:text-black cursor-pointer transition-all duration-200' : 'border-white/20 bg-black text-white/40 cursor-not-allowed'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : !isLoadingAllPages && !error ? (
            renderEmptyState()
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default SellerAuctionListings