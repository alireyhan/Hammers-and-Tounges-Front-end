import React, { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import LotRow from '../components/LotRow'
import GuestLotDrawer from '../components/GuestLotDrawer'
import './BuyerWonItems.css'
import './GuestEventLots.css'

const BuyerWonItems = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('unpaid')
  const [selectedLot, setSelectedLot] = useState(null)
  const itemsPerPage = 8

  // Empty array - hook for future API: getWonItems()
  const wonItems = []

  const handleLotClick = useCallback((lot) => {
    setSelectedLot(lot)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedLot(null)
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Filter items based on active tab
  const filteredByTab = wonItems.filter(item => {
    if (activeTab === 'paid') {
      return item.paymentStatus === 'paid'
    } else {
      return item.paymentStatus === 'pending'
    }
  })

  const filteredItems = filteredByTab.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lotId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
  }

  const wonItemToLot = (item) => ({
    id: item.id,
    title: item.title,
    media: item.image ? [{ file: item.image, media_type: 'image' }] : [],
    current_price: item.winningPrice,
    highest_bid: item.winningPrice,
    initial_price: item.winningPrice,
    currency: 'USD',
    lot_number: item.lotId,
    location: item.location,
    venue: item.venue,
    event_title: item.eventTitle,
    event_status: 'CLOSED',
    event_start_time: item.eventStartTime ?? item.startDate,
    event_end_time: item.eventEndTime ?? item.endDate ?? item.endTime,
    end_date: item.endDate,
    end_time: item.endTime,
  })

  return (
    <div className={`won-items-page ${selectedLot ? 'won-items-page--drawer-open' : ''}`}>
      <div className="won-items-content">
        <div className="won-items-container">
      
          <nav className="breadcrumbs">
            <Link to="/buyer/dashboard">Live Auction</Link>
            <span>/</span>
            <span>Won Items</span>
          </nav>

          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">Won Items</h1>
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
                placeholder="Search by lot name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="won-items-tabs">
            <button
              className={`won-items-tab ${activeTab === 'unpaid' ? 'won-items-tab-active' : ''}`}
              onClick={() => handleTabChange('unpaid')}
            >
              UnPaid
            </button>
            <button
              className={`won-items-tab ${activeTab === 'paid' ? 'won-items-tab-active' : ''}`}
              onClick={() => handleTabChange('paid')}
            >
              Paid
            </button>
          </div>

          {/* Empty State */}
          {totalItems === 0 ? (
            <div className="won-items-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
              </svg>
              <h2>No items found</h2>
              <p>{activeTab === 'paid' ? 'You don\'t have any paid items yet.' : 'You don\'t have any unpaid items yet.'}</p>
            </div>
          ) : (
            <>
              <div className="won-items-list-wrap">
                <p className="guest-event-lots__results-count">
                  Your search returned {currentItems.length} result{currentItems.length !== 1 ? 's' : ''}
                </p>
                <div className="guest-event-lots__list">
                  {currentItems.map((item) => {
                    const lot = wonItemToLot(item)
                    return (
                      <LotRow
                        key={item.id}
                        lot={lot}
                        eventStartTime={item.eventStartTime ?? item.startDate}
                        eventEndTime={item.eventEndTime ?? item.endDate ?? item.endTime}
                        eventTitle={item.eventTitle}
                        onOpenDetail={handleLotClick}
                        showFavorite={false}
                      />
                    )
                  })}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="wonItems-pagination">
                  <button
                    className="wonItems-pagination-btn wonItems-prev-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Previous
                  </button>

                  <div className="wonItems-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <button
                        key={pageNumber}
                        className={`wonItems-page-number ${currentPage === pageNumber ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    className="wonItems-pagination-btn wonItems-next-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </>
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
          eventStatus={selectedLot.event_status ?? 'CLOSED'}
          onClose={handleCloseDrawer}
          isBuyer
        />
      )}
    </div>
  )
}

export default BuyerWonItems
