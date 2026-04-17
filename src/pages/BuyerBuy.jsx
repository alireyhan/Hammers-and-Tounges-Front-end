import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { getMyFavoriteAuctions } from '../store/actions/buyerActions';
import LotRow from '../components/LotRow';
import GuestLotDrawer from '../components/GuestLotDrawer';
import './GuestBuy.css';
import './GuestEventLots.css';

const PAGE_SIZE = 12;

const BuyerBuy = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const selectedCategory = categoryFromUrl ? Number(categoryFromUrl) : null;
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  if (!categoryFromUrl) {
    return <Navigate to="/buyer/dashboard" replace />;
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    dispatch(getMyFavoriteAuctions({ page_size: 100 }))
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const items = res?.results ?? res ?? [];
        setFavoriteIds(new Set(items.map((x) => x.id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dispatch]);

  const fetchLots = useCallback(async (categoryId, pageNum = 1) => {
    if (!categoryId) {
      setLots([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.getLots({
        category: categoryId,
        page: pageNum,
        page_size: PAGE_SIZE,
      });
      const items = res.results || [];
      const total = res.count ?? items.length;
      setLots(items);
      setTotalCount(total);
    } catch (err) {
      console.error('Error fetching lots by category:', err);
      setError(err?.message || err?.response?.data?.detail || 'Failed to load lots');
      toast.error('Failed to load lots');
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchLots(selectedCategory, page);
    } else {
      setLots([]);
      setTotalCount(0);
      setLoading(false);
    }
  }, [selectedCategory, page, fetchLots]);

  const handleLotClick = useCallback((lot) => {
    setSelectedLot(lot);
  }, []);

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
  }, []);

  return (
    <div className={`guest-buy ${selectedLot ? 'guest-buy--drawer-open' : ''}`}>
      <header className="guest-buy__header">
        <h1 className="guest-buy__title">Buy</h1>
        <p className="guest-buy__subtitle">
          Browse available lots in this category
        </p>
      </header>

      <main className="guest-buy__main">
        {loading && lots.length === 0 ? (
          <div className="guest-buy__loading">
            <div className="guest-buy__spinner" />
            <p>Loading lots...</p>
          </div>
        ) : error ? (
          <div className="guest-buy__error">
            <p>{error}</p>
            <button onClick={() => fetchLots(selectedCategory, page)}>Retry</button>
          </div>
        ) : lots.length === 0 ? (
          <div className="guest-buy__empty">
            <p>No data found in this category.</p>
          </div>
        ) : (
          <>
            <div className="guest-buy__list-wrap">
              <p className="guest-event-lots__results-count">
                Your search returned {lots.length} result{lots.length !== 1 ? 's' : ''}
              </p>
              <div className="guest-event-lots__list">
                {lots.map((lot) => (
                  <LotRow
                    key={lot.id}
                    lot={lot}
                    eventStartTime={lot.event_start_time ?? lot.start_date}
                    eventEndTime={lot.event_end_time ?? lot.end_date ?? lot.end_time}
                    eventTitle={lot.event_title}
                    eventStatus={lot.event_status}
                    onOpenDetail={handleLotClick}
                    showFavorite
                    isFavorite={favoriteIds?.has(lot.id) ?? lot.is_favourite ?? false}
                    onFavoriteToggle={handleFavoriteToggle}
                    statusOnly
                  />
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="guest-buy__pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="guest-buy__page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selectedLot && (
        <GuestLotDrawer
          lot={selectedLot}
          eventStartTime={selectedLot.event_start_time ?? selectedLot.start_date}
          eventEndTime={selectedLot.event_end_time ?? selectedLot.end_date ?? selectedLot.end_time}
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

export default BuyerBuy;
