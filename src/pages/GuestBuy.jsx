import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { auctionService } from '../services/interceptors/auction.service';
import { getMediaUrl } from '../config/api.config';
import { toast } from 'react-toastify';
import './GuestBuy.css';

const PAGE_SIZE = 12;

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getLotStatusModifier = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'DRAFT') return '--draft';
  if (s === 'ACTIVE' || s === 'APPROVED' || s === 'LIVE') return '--active';
  if (s === 'CLOSED' || s === 'COMPLETED') return '--closed';
  if (s === 'PENDING') return '--pending';
  return '--active';
};

const LotCard = ({ lot, onLotClick }) => {
  const imageMedia = lot.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef(null);
  const lotStatus = lot.status || lot.listing_status;

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imageUrls.length]);

  const displayUrl = imageUrls[currentImageIndex] || imageUrls[0];
  const hasMultipleImages = imageUrls.length > 1;

  return (
    <article
      className="guest-buy__card"
      onClick={() => onLotClick(lot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onLotClick(lot)}
    >
      <div className="guest-buy__card-media">
        {lotStatus && (
          <span className={`guest-buy__card-status guest-buy__card-status${getLotStatusModifier(lotStatus)}`}>
            {lotStatus}
          </span>
        )}
        {displayUrl ? (
          <img src={displayUrl} alt={lot.title} loading="lazy" />
        ) : (
          <div className="guest-buy__card-placeholder">📷</div>
        )}
        {hasMultipleImages && (
          <div className="guest-buy__card-slider-dots">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={`guest-buy__card-dot ${i === currentImageIndex ? 'active' : ''}`}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>
      <div className="guest-buy__card-body">
        <div className="guest-buy__card-lot-no">Lot #{lot.lot_number || lot.id}</div>
        <h3 className="guest-buy__card-title">{lot.title || 'Untitled'}</h3>
        {lot.description && (
          <p className="guest-buy__card-desc">{lot.description}</p>
        )}
        <div className="guest-buy__card-meta">
          <span className="guest-buy__card-category">{lot.category_name || '—'}</span>
          <span className="guest-buy__card-price">
            {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
          </span>
        </div>
        <div className="guest-buy__card-footer">
          <span className="guest-buy__card-login-hint">Click to view details</span>
        </div>
      </div>
    </article>
  );
};

const GuestBuy = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const selectedCategory = categoryFromUrl ? Number(categoryFromUrl) : null;

  if (!categoryFromUrl) {
    return <Navigate to="/" replace />;
  }

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

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

  const handleLotClick = useCallback(() => {
    setShowLoginModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const handleGoToSignIn = useCallback(() => {
    setShowLoginModal(false);
    navigate('/signin', { state: { from: '/buy' } });
  }, [navigate]);

  return (
    <div className="guest-buy">
      <header className="guest-buy__header">
        <h1 className="guest-buy__title">Buy</h1>
        <p className="guest-buy__subtitle">
          Select a category from the menu to browse available lots
        </p>
      </header>

      <main className="guest-buy__main">
        {!selectedCategory ? (
          <div className="guest-buy__empty-prompt">
            <div className="guest-buy__empty-icon">🛒</div>
            <p>Click a category in the menu to view lots</p>
          </div>
        ) : loading && lots.length === 0 ? (
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
            <div className="guest-buy__results-count">
              {totalCount} lot{totalCount !== 1 ? 's' : ''} found
            </div>
            <div className="guest-buy__grid">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} onLotClick={handleLotClick} />
              ))}
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

      {/* Login modal */}
      {showLoginModal && (
        <div className="guest-buy__modal-overlay" onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div
            className="guest-buy__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="guest-buy__modal-icon">🔒</div>
            <h2 className="guest-buy__modal-title">Login to see further details</h2>
            <p className="guest-buy__modal-text">
              Sign in or create an account to view lot details, place bids, and participate in auctions.
            </p>
            <div className="guest-buy__modal-actions">
              <button className="guest-buy__modal-btn guest-buy__modal-btn--outline" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="guest-buy__modal-btn guest-buy__modal-btn--primary" onClick={handleGoToSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBuy;
