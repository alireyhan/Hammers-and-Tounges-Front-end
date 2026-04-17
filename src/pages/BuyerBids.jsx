import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './BuyerBids.css'
import './GuestEventLots.css'
import { useSelector, useDispatch } from 'react-redux'
import { fetchMyBids } from '../store/actions/buyerActions'
import { getMediaUrl } from '../config/api.config'
import { auctionService } from '../services/interceptors/auction.service'
import LotRow from '../components/LotRow'
import GuestLotDrawer from '../components/GuestLotDrawer'
import { formatBidDateTime } from '../utils/formatBidDateTime'

const BuyerBids = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { myBids, isLoading, error, nextPage, prevPage, totalCount } = useSelector(state => state.buyer)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [lotCache, setLotCache] = useState({})
  const [lotsFetching, setLotsFetching] = useState(false)
  const [lotsFetchComplete, setLotsFetchComplete] = useState(false)
  const [selectedLot, setSelectedLot] = useState(null)

  useEffect(() => {
    setCurrentPage(1)
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

  const bidToLot = useCallback((bid) => {
    const itemId = getBidItemId(bid)
    const lotNumber = getBidLotNumber(bid)
    const cachedLot = (itemId ? lotCache[itemId] : null) ?? (lotNumber ? lotCache[lotNumber] : null)
    const lot = bid.lot ?? bid.lot_details ?? bid.item ?? cachedLot
    const media = getBidMedia(bid, cachedLot)
    const nestedBidEvent =
      bid.auction_event && typeof bid.auction_event === 'object'
        ? bid.auction_event
        : bid.event && typeof bid.event === 'object'
          ? bid.event
          : null
    return {
      ...(cachedLot || {}),
      id: cachedLot?.id ?? itemId,
      lot_number: cachedLot?.lot_number ?? lotNumber ?? itemId,
      title: cachedLot?.title ?? getBidItemTitle(bid),
      media: Array.isArray(media) ? media : [],
      current_price: cachedLot?.current_price,
      highest_bid: cachedLot?.highest_bid,
      initial_price: cachedLot?.initial_price,
      currency: cachedLot?.currency ?? 'USD',
      event_start_time:
        cachedLot?.event_start_time ??
        bid.event_start_time ??
        nestedBidEvent?.start_time ??
        nestedBidEvent?.start_date,
      event_end_time:
        cachedLot?.event_end_time ??
        bid.event_end_time ??
        nestedBidEvent?.end_time ??
        nestedBidEvent?.end_date ??
        bid.auction_end_time,
      end_date:
        cachedLot?.event_end_time ??
        cachedLot?.end_date ??
        cachedLot?.enddate ??
        nestedBidEvent?.end_date ??
        nestedBidEvent?.end_time ??
        bid.event_end_time ??
        bid.auction_end_time,
      end_time:
        cachedLot?.event_end_time ??
        cachedLot?.end_time ??
        nestedBidEvent?.end_date ??
        nestedBidEvent?.end_time ??
        bid.event_end_time,
      start_date:
        cachedLot?.event_start_time ??
        cachedLot?.start_date ??
        cachedLot?.startdate ??
        nestedBidEvent?.start_date ??
        nestedBidEvent?.start_time ??
        bid.event_start_time,
      location: cachedLot?.location,
      venue: cachedLot?.venue,
      event_title: bid.event_title,
      event_status:
        bid.event_status ?? cachedLot?.event_status ?? nestedBidEvent?.status ?? nestedBidEvent?.event_status,
      event_id: bid.event_id ?? bid.event ?? nestedBidEvent?.id,
    }
  }, [lotCache])

  const handleLotClick = useCallback((lot) => {
    setSelectedLot(lot)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedLot(null)
  }, [])

  const handlePageChange = (url, direction) => {
    if (!url) return
    if (direction === 'next') {
      setCurrentPage((p) => p + 1)
      dispatch(fetchMyBids(url))
    } else if (direction === 'prev') {
      setCurrentPage((p) => Math.max(1, p - 1))
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
              <button
                onClick={() => {
                  setCurrentPage(1)
                  dispatch(fetchMyBids())
                }}
                className="retry-btn"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`my-bids-page ${selectedLot ? 'my-bids-page--drawer-open' : ''}`}>
      <div className="my-bids-content">
        <div className="my-bids-container">
          <nav className="breadcrumbs">
            <Link to="/buyer/dashboard">Live Auction</Link>
            <span>/</span>
            <span>My Bids</span>
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

          <div className="my-bids-list-wrap">
            <p className="guest-event-lots__results-count">
              Your search returned {filteredBids?.length ?? 0} result{(filteredBids?.length ?? 0) !== 1 ? 's' : ''}
            </p>
            {filteredBids?.length > 0 ? (
              <div className="guest-event-lots__list">
                {filteredBids.map((bid) => {
                  const lot = bidToLot(bid)
                  return (
                    <div key={bid.id}>
                      <LotRow
                        lot={lot}
                        eventStartTime={lot.event_start_time ?? lot.start_date}
                        eventEndTime={lot.event_end_time ?? lot.end_date ?? lot.end_time}
                        eventTitle={lot.event_title}
                        eventStatus={lot.event_status}
                        subCaption={bid.created_at ? `Bid placed ${formatBidDateTime(bid.created_at)}` : null}
                        onOpenDetail={handleLotClick}
                        showFavorite
                        isFavorite={lot.is_favourite ?? false}
                      />
                    </div>
                  )
                })}
              </div>
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
                onClick={() => handlePageChange(prevPage, 'prev')}
                disabled={!prevPage}
                aria-label="Previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>

              <div className="mybids-page-info">
                <span>
                  Page {currentPage} of {totalCount ? Math.ceil(totalCount / 10) : (nextPage ? currentPage + 1 : currentPage)}
                </span>
              </div>

              <button
                className="mybids-pagination-btn mybids-next-btn"
                onClick={() => handlePageChange(nextPage, 'next')}
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

      {selectedLot && (
        <GuestLotDrawer
          lot={selectedLot}
          eventStartTime={selectedLot.event_start_time ?? selectedLot.start_date}
          eventEndTime={selectedLot.event_end_time ?? selectedLot.end_date ?? selectedLot.end_time}
          eventTitle={selectedLot.event_title}
          eventId={selectedLot.event_id}
          eventStatus={selectedLot.event_status}
          onClose={handleCloseDrawer}
          isBuyer
        />
      )}
    </div>
  )
}

export default BuyerBids