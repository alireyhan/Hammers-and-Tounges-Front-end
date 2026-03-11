import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auctionService } from '../../services/interceptors/auction.service';
import { buyerService } from '../../services/interceptors/buyer.service';
import { getMediaUrl } from '../../config/api.config';
import { toast } from 'react-toastify';
import './AdminLotDetail.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const AdminLotDetail = () => {
  const { eventId, lotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lotFromState = location.state?.lot;
  const eventFromState = location.state?.event;

  const [lot, setLot] = useState(lotFromState);
  const [event, setEvent] = useState(eventFromState);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(!lotFromState);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const imageMedia = lot?.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);

  useEffect(() => {
    if (lotFromState) return;
    if (!lotId) {
      navigate('/admin/dashboard');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(lotId);
        if (!cancelled) setLot(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || 'Failed to load lot');
          navigate(`/admin/event/${eventId}`, { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lotId, lotFromState, eventId, navigate]);

  useEffect(() => {
    if (eventFromState || !eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await auctionService.getEvent(eventId);
        if (!cancelled) setEvent(ev);
      } catch {
        if (!cancelled) setEvent(null);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, eventFromState]);

  useEffect(() => {
    if (!lotId) return;
    let cancelled = false;
    (async () => {
      setBidsLoading(true);
      try {
        const data = await buyerService.getLotBids(lotId);
        if (!cancelled) setBids(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setBids([]);
      } finally {
        if (!cancelled) setBidsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lotId]);

  const handleBack = () => {
    navigate(`/admin/event/${eventId}`, { state: { event: eventFromState || event } });
  };

  if (loading && !lot) {
    return (
      <div className="admin-lot-detail">
        <div className="admin-lot-detail__loading">
          <div className="admin-lot-detail__spinner" />
          <p>Loading lot...</p>
        </div>
      </div>
    );
  }

  if (!lot) return null;

  const specificData = lot.specific_data || {};
  const displayImage = imageUrls[selectedImage] || imageUrls[0];
  const bidCount = (bids.length || lot.total_bids) ?? 0;

  return (
    <div className="admin-lot-detail">
      <header className="admin-lot-detail__header">
        <button
          className="admin-lot-detail__back"
          onClick={handleBack}
          aria-label="Back to event"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="admin-lot-detail__header-content">
          <h1 className="admin-lot-detail__title">{event?.title || eventFromState?.title || 'Lot Detail'}</h1>
          <p className="admin-lot-detail__subtitle">LOT #{lot.lot_number || lot.id}</p>
        </div>
      </header>

      <main className="admin-lot-detail__main">
        <div className="admin-lot-detail__media">
          {displayImage ? (
            <div className="admin-lot-detail__image-wrap">
              <img src={displayImage} alt={lot.title} />
              {imageUrls.length > 1 && (
                <div className="admin-lot-detail__slider-dots">
                  {imageUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`admin-lot-detail__dot ${i === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(i)}
                      aria-hidden
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="admin-lot-detail__placeholder">No image</div>
          )}
        </div>

        <div className="admin-lot-detail__body">
          <div className="admin-lot-detail__lot-no">LOT #{lot.lot_number || lot.id}</div>
          <h2 className="admin-lot-detail__lot-title">{lot.title || 'Untitled'}</h2>
          {lot.description && <p className="admin-lot-detail__desc">{lot.description}</p>}
          <div className="admin-lot-detail__meta">
            <span className="admin-lot-detail__category">{lot.category_name || '—'}</span>
            <span className="admin-lot-detail__price">
              {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
            </span>
          </div>

          {Object.keys(specificData).length > 0 && (
            <div className="admin-lot-detail__specific">
              <h3 className="admin-lot-detail__section-title">Details</h3>
              <div className="admin-lot-detail__specific-grid">
                {Object.entries(specificData).map(([key, value]) => (
                  <div key={key} className="admin-lot-detail__specific-item">
                    <span className="admin-lot-detail__specific-key">{formatSpecificKey(key)}</span>
                    <span className="admin-lot-detail__specific-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-lot-detail__bids-section">
            <h3 className="admin-lot-detail__section-title">
              Bids ({bidCount})
            </h3>
            {bidsLoading ? (
              <p className="admin-lot-detail__bids-loading">Loading bids...</p>
            ) : bids.length > 0 ? (
              <div className="admin-lot-detail__bids-list">
                {bids.map((bid, index) => (
                  <div key={bid.id ?? index} className="admin-lot-detail__bid-item">
                    <div className="admin-lot-detail__bid-rank">#{index + 1}</div>
                    <div className="admin-lot-detail__bid-info">
                      <span className="admin-lot-detail__bid-bidder">
                        {bid.bidder_name ?? bid.user_name ?? bid.bidder ?? 'Bidder'}
                      </span>
                      <span className="admin-lot-detail__bid-time">
                        {bid.created_at ? new Date(bid.created_at).toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className="admin-lot-detail__bid-amount">
                      {lot.currency || 'USD'} {formatPrice(bid.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-lot-detail__no-bids">No bids yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLotDetail;
