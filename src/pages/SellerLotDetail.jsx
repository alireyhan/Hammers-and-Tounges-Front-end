import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionService } from '../services/interceptors/auction.service';
import { buyerService } from '../services/interceptors/buyer.service';
import { getMediaUrl } from '../config/api.config';
import { toast } from 'react-toastify';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import { logLotMediaFromApi } from '../utils/logLotMediaDebug';
import './ManagerLotDetail.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const SellerLotDetail = () => {
  const { lotId } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const imageMedia = lot?.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);

  useEffect(() => {
    if (!lotId) {
      navigate('/seller/dashboard');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(lotId);
        logLotMediaFromApi('SellerLotDetail getLot()', data);
        if (!cancelled) setLot(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || 'Failed to load lot');
          navigate('/seller/dashboard', { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lotId, navigate]);

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

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    const id = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => clearInterval(id);
  }, [imageUrls.length]);

  const handleBack = () => navigate('/seller/dashboard');

  if (loading && !lot) {
    return (
      <div className="manager-lot-detail">
        <div className="manager-lot-detail__loading">
          <div className="manager-lot-detail__spinner" />
          <p>Loading lot...</p>
        </div>
      </div>
    );
  }

  if (!lot) return null;

  const specificData = lot.specific_data || {};
  const displayImage = imageUrls[selectedImage] || imageUrls[0];
  const eventTitle = lot.event_title || lot.event?.title || 'Lot Detail';

  return (
    <div className="manager-lot-detail">
      <header className="manager-lot-detail__header">
        <button
          className="manager-lot-detail__back"
          onClick={handleBack}
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="manager-lot-detail__header-content">
          <h1 className="manager-lot-detail__title">{eventTitle}</h1>
          <p className="manager-lot-detail__subtitle">Lot #{lot.lot_number || lot.id}</p>
        </div>
      </header>

      <main className="manager-lot-detail__main">
        <div className="manager-lot-detail__media">
          {displayImage ? (
            <div className="manager-lot-detail__image-wrap">
              <img src={displayImage} alt={lot.title} />
              {imageUrls.length > 1 && (
                <div className="manager-lot-detail__slider-dots">
                  {imageUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`manager-lot-detail__dot ${i === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(i)}
                      aria-hidden
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="manager-lot-detail__placeholder">📷 No image</div>
          )}
        </div>

        <div className="manager-lot-detail__body">
          <div className="manager-lot-detail__lot-no">LOT #{lot.lot_number || lot.id}</div>
          <h2 className="manager-lot-detail__lot-title">{lot.title || 'Untitled'}</h2>
          {lot.description && <p className="manager-lot-detail__desc">{lot.description}</p>}
          <div className="manager-lot-detail__meta">
            <span className="manager-lot-detail__category">{lot.category_name || '—'}</span>
            <span className="manager-lot-detail__price">
              {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
            </span>
          </div>

          {Object.keys(specificData).length > 0 && (
            <div className="manager-lot-detail__specific">
              <h3 className="manager-lot-detail__section-title">Details</h3>
              <div className="manager-lot-detail__specific-grid">
                {Object.entries(specificData).map(([key, value]) => (
                  <div key={key} className="manager-lot-detail__specific-item">
                    <span className="manager-lot-detail__specific-key">{formatSpecificKey(key)}</span>
                    <span className="manager-lot-detail__specific-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="manager-lot-detail__bids-section">
            <h3 className="manager-lot-detail__section-title">
              Bids ({(bids.length || lot.total_bids) ?? 0})
            </h3>
            {bidsLoading ? (
              <p className="manager-lot-detail__bids-loading">Loading bids...</p>
            ) : bids.length > 0 ? (
              <div className="manager-lot-detail__bids-list">
                {bids.slice(0, 15).map((bid, index) => (
                  <div key={bid.id ?? index} className="manager-lot-detail__bid-item">
                    <div className="manager-lot-detail__bid-rank">#{index + 1}</div>
                    <div className="manager-lot-detail__bid-info">
                      <span className="manager-lot-detail__bid-bidder">
                        {maskBidderName(bid.bidder_name ?? bid.user_name ?? bid.bidder ?? 'Bidder')}
                      </span>
                      <span className="manager-lot-detail__bid-time">
                        {formatBidDateTime(bid.created_at)}
                      </span>
                    </div>
                    <div className="manager-lot-detail__bid-amount">
                      {lot.currency || 'USD'} {formatPrice(bid.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="manager-lot-detail__no-bids">No bids yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerLotDetail;
