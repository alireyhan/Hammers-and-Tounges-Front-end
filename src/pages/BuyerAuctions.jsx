import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';
import { fetchAuctionsList, fetchCategories } from '../store/actions/AuctionsActions';
import { clearBuyerError } from '../store/slices/buyerSlice';
import './BuyerAuctions.css';
import { toast } from 'react-toastify';

const BuyerAuctionCard = lazy(() => import('../components/BuyerAuctionCard'));

const BuyerAuctions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);

  // Redux state
  const { auctions, isLoading, error, categories } = useSelector(state => state.buyer);
  const { token } = useSelector(state => state.auth);

  // Local state for complete dataset and filters
  const [allAuctions, setAllAuctions] = useState([]);
  const [isLoadingAllPages, setIsLoadingAllPages] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Status options
  const statusOptions = useMemo(() => [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DRAFT', label: 'Draft' }
  ], []);

  // Extract categories
  const extractedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories.map(cat => ({
      name: cat.name || cat.category_name,
      value: cat.id || cat.category,
      label: cat.name || cat.category_name
    }));
  }, [categories]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() =>
    selectedCategories.length > 0 ||
    selectedStatus.length > 0 ||
    debouncedSearch
    , [selectedCategories, selectedStatus, debouncedSearch]);

  // Debounced search
  const debouncedSetSearch = useMemo(() =>
    debounce((query) => setDebouncedSearch(query), 500)
    , []);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleCategoryToggle = useCallback((category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleStatusToggle = useCallback((status) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedStatus([]);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  }, []);

  const handleCheckAuth = useCallback(() => {
    if (!token) {
      toast.info('Please sign in to view auction details');
      navigate('/signin');
    }
  }, [token, navigate]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch all pages of auctions
  useEffect(() => {
    const fetchAllPages = async () => {
      setIsLoadingAllPages(true);
      try {
        let allResults = [];
        let nextPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await dispatch(fetchAuctionsList({ page: nextPage })).unwrap();
          allResults = [...allResults, ...(response.results || [])];

          if (response.next) {
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
    };

    fetchAllPages();
  }, [dispatch]);

  // Apply filters to complete dataset
  const filteredAuctions = useMemo(() => {
    return allAuctions.filter(auction => {


      // ✅ ONLY ACTIVE AUCTIONS
      if (auction.status !== 'ACTIVE') return false;

      // CATEGORY FILTER
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(Number(auction.category))
      ) {
        return false;
      }

      // STATUS FILTER
      if (
        selectedStatus.length > 0 &&
        !selectedStatus.includes(auction.status)
      ) {
        return false;
      }

      // SEARCH FILTER
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const title = auction.title?.toLowerCase() || '';
        if (!title.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [allAuctions, selectedCategories, selectedStatus, debouncedSearch]);

  // Paginate filtered results (10 per page)
  const itemsPerPage = 10;
  const totalFilteredCount = filteredAuctions.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedStatus, debouncedSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearBuyerError());
      debouncedSetSearch.cancel();
    };
  }, [dispatch, debouncedSetSearch]);

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
    setAllAuctions(prevAuctions =>
      prevAuctions.map(auction =>
        auction.id === auctionId
          ? { ...auction, is_favourite: isFavorite }
          : auction
      )
    );
  }, []);

  return (
    <div className="auctions-page pb-5">
      {/* Sticky Filter Bar */}
      <div className="auctions-filter-bar">
        <div className="auctions-filter-bar-content">
          <div className="filter-search-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.134 17 3 13.866 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="currentColor" strokeWidth="2" />
            </svg>
            <input
              type="text"
              placeholder="Search auctions..."
              className="filter-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={isLoadingAllPages}
            />
          </div>

          {/* Desktop Filters */}
          <div className="desktop-filters">
            <FilterDropdown
              label="Category"
              options={extractedCategories}
              selectedValues={selectedCategories}
              onToggle={handleCategoryToggle}
              disabled={isLoadingAllPages}
            />
            {/* <FilterDropdown
              label="Status"
              options={statusOptions}
              selectedValues={selectedStatus}
              onToggle={handleStatusToggle}
              disabled={isLoadingAllPages}
            /> */}

            {hasActiveFilters && (
              <button
                className="clear-filters-btn"
                onClick={handleClearFilters}
                disabled={isLoadingAllPages}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="active-filter-tags">
          {selectedCategories.map(cat => {
            const category = extractedCategories.find(c => c.value === cat);
            return category ? (
              <span key={cat} className="active-filter-tag">
                {category.label}
                <button
                  onClick={() => handleCategoryToggle(cat)}
                  disabled={isLoadingAllPages}
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
          {selectedStatus.map(status => {
            const statusObj = statusOptions.find(s => s.value === status);
            return statusObj ? (
              <span key={status} className="active-filter-tag">
                {statusObj.label}
                <button
                  onClick={() => handleStatusToggle(status)}
                  disabled={isLoadingAllPages}
                >
                  ×
                </button>
              </span>
            ) : null;
          })}

          {debouncedSearch && (
            <span className="active-filter-tag">
              Search: "{debouncedSearch}"
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                disabled={isLoadingAllPages}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="auctions-error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error.message || error.detail || 'Failed to load auctions'}
          <button
            className="error-dismiss-btn"
            onClick={() => dispatch(clearBuyerError())}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="auctions-main">
        <div className="auctions-header">
          <div className="auctions-header-content">
            <h1 className="buyer-auctions-page-title">Live Auctions</h1>
            <span className="auctions-results-count">
              {isLoadingAllPages ? 'Loading...' : `${totalFilteredCount} Results`}
            </span>
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
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAllPages && !error && paginatedAuctions.length === 0 && (
          <div className="auctions-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9 11L12 14L22 4" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#d1d5db" strokeWidth="2" />
            </svg>
            <h2>No auctions found</h2>
            <p>Try adjusting your filters or check back later</p>
            {hasActiveFilters && (
              <button
                className="auctions-clear-filters-btn"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            )}
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
                  <BuyerAuctionCard
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
                    onClick={() => navigate(`/buyer/auction/${auction.id}`, { state: { from: 'buyer-auctions', listing: auction } })}
                    onFavoriteUpdate={handleFavoriteUpdate}
                  />))}
              </Suspense>
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
      </main>
    </div>
  );
};

// Filter Dropdown Component
const FilterDropdown = ({ label, options, selectedValues, onToggle, disabled, type = 'checkbox' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    onToggle(value);
    if (type === 'radio') setIsOpen(false);
  };

  const selectionCount = Array.isArray(selectedValues) ? selectedValues.length : (selectedValues ? 1 : 0);

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        className={`filter-dropdown-trigger ${selectionCount > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {label}
        {selectionCount > 0 && <span className="filter-badge">{selectionCount}</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {isOpen && (
        <div className="filter-dropdown-menu">
          {options.length === 0 ? (
            <div className="filter-dropdown-empty">No options available</div>
          ) : (
            options.map(option => (
              <label key={option.value} className="filter-dropdown-item">
                <input
                  type={type}
                  name={type === 'radio' ? label : undefined}
                  checked={Array.isArray(selectedValues)
                    ? selectedValues.includes(option.value)
                    : selectedValues === option.value}
                  onChange={() => handleToggle(option.value)}
                  disabled={disabled}
                />
                <span>{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerAuctions;