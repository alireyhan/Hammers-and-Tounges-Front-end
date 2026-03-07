import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auctionService } from '../../services/interceptors/auction.service';
import { getMediaUrl } from '../../config/api.config';
import { toast } from 'react-toastify';
import './AdminEventLots.css';

const PAGE_SIZE = 12;

const formatDate = (str) => {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const SpecificDataList = ({ data }) => {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;
  return (
    <div className="admin-event-lots__specific-data">
      {entries.map(([key, value]) => (
        <div key={key} className="admin-event-lots__specific-item">
          <span className="admin-event-lots__specific-key">{formatSpecificKey(key)}</span>
          <span className="admin-event-lots__specific-value">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const LotCard = ({ lot }) => {
  const imageMedia = lot.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef(null);

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
    <article className="admin-event-lots__card">
      <div className="admin-event-lots__card-media">
        {displayUrl ? (
          <img src={displayUrl} alt={lot.title} loading="lazy" />
        ) : (
          <div className="admin-event-lots__card-placeholder">📷</div>
        )}
        {hasMultipleImages && (
          <div className="admin-event-lots__card-slider-dots">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={`admin-event-lots__card-dot ${i === currentImageIndex ? 'active' : ''}`}
                aria-hidden
              />
            ))}
          </div>
        )}
        <span className={`admin-event-lots__card-status admin-event-lots__card-status--${(lot.status || '').toLowerCase()}`}>
          {lot.status || '—'}
        </span>
      </div>
      <div className="admin-event-lots__card-body">
        <div className="admin-event-lots__card-lot-no">Lot #{lot.lot_number || lot.id}</div>
        <h3 className="admin-event-lots__card-title">{lot.title || 'Untitled'}</h3>
        {lot.description && (
          <p className="admin-event-lots__card-desc">{lot.description}</p>
        )}
        <div className="admin-event-lots__card-meta">
          <span className="admin-event-lots__card-category">{lot.category_name || '—'}</span>
          <span className="admin-event-lots__card-price">
            {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
          </span>
        </div>
        <SpecificDataList data={lot.specific_data} />
        <div className="admin-event-lots__card-footer">
          <span className="admin-event-lots__card-seller">{lot.seller_name || '—'}</span>
          {lot.total_bids != null && (
            <span className="admin-event-lots__card-bids">{lot.total_bids} bid(s)</span>
          )}
        </div>
      </div>
    </article>
  );
};

const AdminEventLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const eventFromState = location.state?.event;

  const [lots, setLots] = useState([]);
  const [eventTitle, setEventTitle] = useState(eventFromState?.title || 'Event Lots');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const fetchLots = useCallback(async (pageNum = 1) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.getLots({
        event: id,
        page: pageNum,
        page_size: PAGE_SIZE,
      });
      setLots(res.results || []);
      setTotalCount(res.count ?? res.results?.length ?? 0);
      if (res.results?.[0]?.event_title && !eventFromState?.title) {
        setEventTitle(res.results[0].event_title);
      }
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError(err.message || 'Failed to load lots');
      toast.error('Failed to load lots');
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [id, eventFromState?.title]);

  useEffect(() => {
    fetchLots(page);
  }, [fetchLots, page]);

  return (
    <div className="admin-event-lots">
      <header className="admin-event-lots__header">
        <button
          className="admin-event-lots__back"
          onClick={() => navigate('/admin/dashboard')}
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="admin-event-lots__header-content">
          <h1 className="admin-event-lots__title">{eventTitle}</h1>
          <p className="admin-event-lots__subtitle">
            {totalCount} lot{totalCount !== 1 ? 's' : ''} in this event
          </p>
        </div>
      </header>

      <main className="admin-event-lots__main">
        {loading && lots.length === 0 ? (
          <div className="admin-event-lots__loading">
            <div className="admin-event-lots__spinner" />
            <p>Loading lots...</p>
          </div>
        ) : error ? (
          <div className="admin-event-lots__error">
            <p>{error}</p>
            <button onClick={() => fetchLots(page)}>Retry</button>
          </div>
        ) : lots.length === 0 ? (
          <div className="admin-event-lots__empty">
            <p>No lots found for this event.</p>
          </div>
        ) : (
          <>
            <div className="admin-event-lots__grid">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="admin-event-lots__pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="admin-event-lots__page-info">
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
    </div>
  );
};

export default AdminEventLots;
