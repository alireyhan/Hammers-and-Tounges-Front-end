import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './BuyerBids.css'
import { useSelector, useDispatch } from 'react-redux'
import { fetchMyBids } from '../store/actions/buyerActions'
import { getMediaUrl } from '../config/api.config'
import { auctionService } from '../services/interceptors/auction.service'

const BuyerBids = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { myBids, isLoading, error, nextPage, prevPage } = useSelector(state => state.buyer)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPageUrl, setCurrentPageUrl] = useState(null)
  const [lotCache, setLotCache] = useState({})
  const [lotsFetching, setLotsFetching] = useState(false)
  const [lotsFetchComplete, setLotsFetchComplete] = useState(false)

  useEffect(() => {
    dispatch(fetchMyBids())
  }, [dispatch])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      ACTIVE: 'active',
      CLOSED: 'closed',
      AWAITING_PAYMENT: 'awaiting_payment'
    }
    return statusMap[status] || 'active'
  }

  const getFirstImage = (media) => {
    if (!media || !Array.isArray(media) || media.length === 0) {
      return 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&q=80'
    }
    const imageMedia = media.find(m => m.media_type === 'image')
    return imageMedia ? getMediaUrl(imageMedia.file) : 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&q=80'
  }

  const getBidItemId = (bid) => {
    const lot = bid.lot ?? bid.lot_details ?? bid.item
    if (lot && typeof lot === 'object' && lot.id != null) return lot.id
    if (lot && typeof lot === 'number') return lot
    return bid.lot_id ?? bid.auction_id ?? bid.lot
  }
  const getBidLotNumber = (bid) => {
    const lot = bid.lot ?? bid.lot_details ?? bid.item
    if (lot && typeof lot === 'object' && lot.lot_number != null) return String(lot.lot_number)
    return bid.lot_number != null ? String(bid.lot_number) : null
  }
  const getBidItemTitle = (bid) => {
    const lot = bid.lot ?? bid.lot_details ?? bid.item
    if (lot && typeof lot === 'object') {
      const t = lot.title ?? lot.name ?? lot.lot_name
      if (t) return t
    }
    return bid.lot_title ?? bid.lot_name ?? bid.title ?? bid.auction_title ?? 'Lot'
  }
  const getBidMedia = useCallback((bid, cachedLot) => {
    const lot = bid.lot ?? bid.lot_details ?? bid.item ?? cachedLot
    if (lot && typeof lot === 'object' && Array.isArray(lot.media)) return lot.media
    const m = bid.lot_media ?? bid.media ?? bid.auction_media
    return Array.isArray(m) ? m : []
  }, [])

  useEffect(() => {
    const bidsList = Array.isArray(myBids) ? myBids : (myBids?.results ?? [])
    const seen = new Set()
    const toFetch = bidsList
      .map((b) => {
        const numericId = getBidItemId(b)
        const lotNumber = getBidLotNumber(b)
        const cacheKey = numericId ?? lotNumber
        return { numericId, lotNumber, cacheKey }
      })
      .filter(({ cacheKey }) => cacheKey != null && !lotCache[cacheKey])
      .filter(({ cacheKey }) => {
        if (seen.has(cacheKey)) return false
        seen.add(cacheKey)
        return true
      })

    if (toFetch.length === 0) {
      setLotsFetching(false)
      setLotsFetchComplete(true)
      return
    }
    setLotsFetching(true)
    setLotsFetchComplete(false)
    let cancelled = false

    const fetchLot = async ({ numericId, lotNumber, cacheKey }) => {
      try {
        if (lotNumber != null) {
          const lot = await auctionService.getLotByLotId(lotNumber)
          return { cacheKey, lot, lotId: lot?.id }
        }
        if (numericId != null) {
          try {
            const lot = await auctionService.getLot(numericId)
            return { cacheKey, lot, lotId: lot?.id }
          } catch {
            const lot = await auctionService.getLotByLotId(String(numericId))
            return { cacheKey, lot, lotId: lot?.id }
          }
        }
      } catch {
        return { cacheKey, lot: null }
      }
      return { cacheKey, lot: null }
    }

    Promise.all(toFetch.map(fetchLot)).then((results) => {
      if (cancelled) return
      setLotCache((prev) => {
        const next = { ...prev }
        results.forEach(({ cacheKey, lot }) => {
          if (lot && cacheKey != null) {
            next[cacheKey] = lot
            if (lot.id != null) next[lot.id] = lot
            if (lot.lot_number != null) next[String(lot.lot_number)] = lot
          }
        })
        return next
      })
      setLotsFetching(false)
      setLotsFetchComplete(true)
    }).catch(() => {
      if (!cancelled) {
        setLotsFetching(false)
        setLotsFetchComplete(true)
      }
    })
    return () => { cancelled = true }
  }, [myBids])

  const bidsList = Array.isArray(myBids) ? myBids : (myBids?.results ?? [])
  const filteredBids = bidsList?.filter(bid => {
    const title = getBidItemTitle(bid)
    const lotNum = getBidLotNumber(bid)
    const itemId = getBidItemId(bid)
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (typeof title === 'string' && title.toLowerCase().includes(q)) ||
      bid.id.toString().includes(searchQuery) ||
      (itemId != null && String(itemId).includes(searchQuery)) ||
      (lotNum != null && lotNum.toLowerCase().includes(q))
  })

  const handlePageChange = (url) => {
    if (url) {
      setCurrentPageUrl(url)
      dispatch(fetchMyBids(url))
    }
  }

  const hasBids = Array.isArray(myBids) ? myBids.length > 0 : (myBids?.results?.length ?? 0) > 0
  const bidsListForLots = Array.isArray(myBids) ? myBids : (myBids?.results ?? [])
  const bidsNeedingLots = bidsListForLots.filter((b) => getBidItemId(b) != null || getBidLotNumber(b) != null)
  const needsLotData = bidsNeedingLots.length > 0
  const allLotsCached = !needsLotData || bidsNeedingLots.every((b) => {
    const key = getBidItemId(b) ?? getBidLotNumber(b)
    return key != null && lotCache[key] != null
  })
  const showLotsLoading = hasBids && needsLotData && !allLotsCached && !lotsFetchComplete
  if ((isLoading && !hasBids) || showLotsLoading) {
    return (
      <div className="my-bids-page">
        <div className="my-bids-content">
          <div className="my-bids-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{showLotsLoading ? 'Loading lot details...' : 'Loading your bids...'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-bids-page">
        <div className="my-bids-content">
          <div className="my-bids-container">
            <div className="error-state">
              <p>Unable to load your bids. Please try again later.</p>
              <button onClick={() => dispatch(fetchMyBids())} className="retry-btn">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-bids-page">
      <div className="my-bids-content">
        <div className="my-bids-container">
          <nav className="breadcrumbs">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Bids</span>
          </nav>

          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">My Bids</h1>
              <p className="bid-count">{filteredBids?.length} active bid{filteredBids?.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="header-right">
              <div className="live-updates-indicator">
                <span className="live-dot">•</span>
                <span>Live Updates Enabled</span>
              </div>
            </div>
          </div>

          <div className="search-bar">
            <div className="search-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search by Lot Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bids-grid">
            {filteredBids?.length > 0 ? (
              filteredBids?.map(bid => {
                const statusDisplay = getStatusDisplay(bid.status)
                const itemTitle = getBidItemTitle(bid)
                const itemId = getBidItemId(bid)
                const lotNumber = getBidLotNumber(bid)
                const cachedLot = (itemId ? lotCache[itemId] : null) ?? (lotNumber ? lotCache[lotNumber] : null)
                const media = getBidMedia(bid, cachedLot)
                const imageUrl = getFirstImage(media)
                const lotIdForNav = cachedLot?.id ?? itemId
                const lotDisplayNumber = cachedLot?.lot_number ?? lotNumber ?? itemId

                return (
                  <div
                    key={bid.id}
                    className={`bid-card ${statusDisplay}`}
                  >
                    <div className="bid-image">
                      <img src={imageUrl} alt={itemTitle} onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&q=80'} />
                      {/* {isLive && (
                        <div className="live-badge">
                          <span className="live-dot">•</span>
                          <span>Live</span>
                        </div>
                      )} */}
                      <div className={`status-badge ${statusDisplay}`}>
                        {bid.status === 'AWAITING_PAYMENT' ? 'Awaiting Payment' : bid.status}
                      </div>
                    </div>

                    <div className="mybid-details">
                      <div className="bid-lot-id">Lot #{lotDisplayNumber}</div>
                      <h3 className="bid-title">{itemTitle}</h3>
                      {cachedLot?.description && (
                        <p className="bid-description">{cachedLot.description}</p>
                      )}
                      <div className="bid-date">{new Date(bid.created_at).toLocaleDateString()}</div>
                      {cachedLot?.category_name && (
                        <div className="bid-category">{cachedLot.category_name}</div>
                      )}

                      <div className="mybidding-info">
                        <div className="bid-row">
                          <span className="bid-label">Your Bid</span>
                          <span className="bid-value">{formatCurrency(bid.amount ?? 0)}</span>
                        </div>
                        {cachedLot?.initial_price != null && (
                          <div className="bid-row">
                            <span className="bid-label">Start Price</span>
                            <span className="bid-value bid-value--muted">{formatCurrency(cachedLot.initial_price)}</span>
                          </div>
                        )}
                        <div className="bid-row">
                          <span className="bid-label">Status</span>
                          <span className={`bid-status ${statusDisplay}`}>
                            {bid.status === 'AWAITING_PAYMENT' ? 'Awaiting Payment' : bid.status}
                          </span>
                        </div>
                      </div>

                      {/* <div className="status-message"> */}
                      {/* {bid.status === 'ACTIVE' && (
                          <div className="status-banner active-banner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Bid is active</span>
                          </div>
                        )} */}
                      {/* {bid.status === 'CLOSED' && (
                          <div className="status-banner closed-banner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Auction closed</span>
                          </div>
                        )} */}
                      {/* {bid.status === 'AWAITING_PAYMENT' && (
                          <div className="status-banner payment-banner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>Action required: Complete payment</span>
                          </div>
                        )} */}
                      {/* </div> */}
                    </div>

                    <div className="mybid-actions">
                      {lotIdForNav ? (
                        <Link
                          to={`/buyer/auction/${lotIdForNav}`}
                          state={{ listing: cachedLot ?? bid }}
                          className="bids-action-btn secondary"
                          style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
                        >
                          View Lot
                        </Link>
                      ) : (
                        <span className="bids-action-btn secondary" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                          View Lot
                        </span>
                      )}
                      {/* {bid.status === 'AWAITING_PAYMENT' && (
                        <button
                          className="bids-action-btn primary"
                          // onClick={() => navigate(`/checkout/${bid.id}`)}
                        >
                          Pay Now
                        </button>
                      )}
                      {bid.status === 'ACTIVE' && (
                        <button
                          className="bids-action-btn primary"
                          onClick={() => navigate(`/buyer/auction/${bid.auction_id}`, {state: {listing: bid}})}
                        >
                          Increase Bid
                        </button>
                      )} */}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p>No bids found matching your search.</p>
              </div>
            )}
          </div>

          {(nextPage || prevPage) && (
            <div className="mybids-pagination">
              <button
                className="mybids-pagination-btn mybids-prev-btn"
                onClick={() => handlePageChange(prevPage)}
                disabled={!prevPage}
                aria-label="Previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>

              <div className="mybids-page-info">
                <span>Page {myBids?.length > 0 ? '1' : '0'}</span>
              </div>

              <button
                className="mybids-pagination-btn mybids-next-btn"
                onClick={() => handlePageChange(nextPage)}
                disabled={!nextPage}
                aria-label="Next page"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyerBids