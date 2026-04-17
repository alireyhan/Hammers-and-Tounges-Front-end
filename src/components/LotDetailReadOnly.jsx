import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auctionService } from '../services/interceptors/auction.service';
import { buyerService } from '../services/interceptors/buyer.service';
import { toast } from 'react-toastify';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import { logLotMediaFromApi } from '../utils/logLotMediaDebug';
import { getLotImageUrls } from '../utils/lotMedia';
import './LotDetailReadOnly.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const LotDetailReadOnly = ({ backPath }) => {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lotFromState = location.state?.lot;

  const [lot, setLot] = useState(lotFromState);
  const [loading, setLoading] = useState(!lotFromState);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState(null);

  const imageUrls = getLotImageUrls(lot);
  const requestedLotId = lotId || lotFromState?.id;

  useEffect(() => {
    if (!requestedLotId) {
      navigate(backPath || -1);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(requestedLotId);
        logLotMediaFromApi('LotDetailReadOnly getLot()', data);
        if (!cancelled) setLot(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || 'Failed to load lot');
          navigate(backPath, { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [requestedLotId, backPath, navigate]);

  useEffect(() => {
    if (lotFromState?.id) {
      logLotMediaFromApi('LotDetailReadOnly navigation state (initial, refetching full lot)', lotFromState);
    }
  }, [lotFromState?.id]);

  // Fetch bid history when lot is available
  const effectiveLotId = lot?.id ?? requestedLotId;
  useEffect(() => {
    if (!effectiveLotId) return;
    let cancelled = false;
    setBidsLoading(true);
    setBidsError(null);
    buyerService
      .getLotBids(effectiveLotId)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
          setBids(list);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBidsError(err?.message || 'Unable to load bid history');
          setBids([]);
        }
      })
      .finally(() => {
        if (!cancelled) setBidsLoading(false);
      });
    return () => { cancelled = true; };
  }, [effectiveLotId]);

  const handleBack = () => {
    navigate(backPath);
  };

  if (loading && !lot) {
    return (
      <div className="lot-detail-ro">
        <div className="lot-detail-ro__loading">
          <div className="lot-detail-ro__spinner" />
          <p>Loading lot...</p>
        </div>
      </div>
    );
  }

  if (!lot) return null;

  const specificData = lot.specific_data || {};
  const displayImage = imageUrls[selectedImage] || imageUrls[0];

  return (
    <div className="lot-detail-ro">
      <header className="lot-detail-ro__header">
        <button
          className="lot-detail-ro__back"
          onClick={handleBack}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="lot-detail-ro__header-content">
          <h1 className="lot-detail-ro__title">Lot Detail</h1>
          <p className="lot-detail-ro__subtitle">Lot #{lot.lot_number || lot.id}</p>
        </div>
      </header>

      <main className="lot-detail-ro__main">
        <div className="lot-detail-ro__media">
          {displayImage ? (
            <div className="lot-detail-ro__image-wrap">
              <img src={displayImage} alt={lot.title} />
              {imageUrls.length > 1 && (
                <div className="lot-detail-ro__slider-dots">
                  {imageUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`lot-detail-ro__dot ${i === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(i)}
                      aria-hidden
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="lot-detail-ro__placeholder">📷 No image</div>
          )}
        </div>

        <div className="lot-detail-ro__body">
          <div className="lot-detail-ro__lot-no">LOT #{lot.lot_number || lot.id}</div>
          <h2 className="lot-detail-ro__lot-title">{lot.title || 'Untitled'}</h2>
          {lot.description && <p className="lot-detail-ro__desc">{lot.description}</p>}
          <div className="lot-detail-ro__meta">
            <span className="lot-detail-ro__category">{lot.category_name || '—'}</span>
            <span className="lot-detail-ro__price">
              {lot.currency || 'USD'} {formatPrice(lot.initial_price)}
            </span>
          </div>

          {Object.keys(specificData).length > 0 && (
            <div className="lot-detail-ro__specific">
              <h3 className="lot-detail-ro__section-title">Details</h3>
              <div className="lot-detail-ro__specific-grid">
                {Object.entries(specificData).map(([key, value]) => (
                  <div key={key} className="lot-detail-ro__specific-item">
                    <span className="lot-detail-ro__specific-key">{formatSpecificKey(key)}</span>
                    <span className="lot-detail-ro__specific-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="lot-detail-ro__bids">
            {lot.total_bids != null ? `${lot.total_bids} bid(s)` : '0 bid(s)'}
          </div>

          <div className="lot-detail-ro__bid-history">
            <h3 className="lot-detail-ro__section-title">Bid History</h3>
            {bidsLoading ? (
              <p className="lot-detail-ro__bids-loading">Loading bid history...</p>
            ) : bidsError ? (
              <p className="lot-detail-ro__bids-error">{bidsError}</p>
            ) : bids && bids.length > 0 ? (
              <div className="lot-detail-ro__bid-list">
                {bids.slice(0, 15).map((bid, index) => (
                  <div key={bid.id ?? index} className="lot-detail-ro__bid-item">
                    <div className="lot-detail-ro__bid-rank">#{index + 1}</div>
                    <div className="lot-detail-ro__bid-info">
                      <div className="lot-detail-ro__bid-bidder">
                        {maskBidderName(bid.bidder_name ?? bid.user_name ?? bid.bidder ?? 'Bidder')}
                      </div>
                      <div className="lot-detail-ro__bid-time">
                        {formatBidDateTime(bid.created_at)}
                      </div>
                    </div>
                    <div className="lot-detail-ro__bid-amount">
                      {lot.currency || 'USD'} {formatPrice(bid.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lot-detail-ro__no-bids">No bids yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LotDetailReadOnly;
