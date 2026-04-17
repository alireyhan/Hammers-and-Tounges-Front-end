import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auctionService } from '../services/interceptors/auction.service';
import { buyerService } from '../services/interceptors/buyer.service';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import { logLotMediaFromApi } from '../utils/logLotMediaDebug';
import { getLotImageUrls } from '../utils/lotMedia';
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

const ManagerLotDetail = () => {
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
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const intervalRef = useRef(null);

  const eventStatus = event?.status ?? eventFromState?.status ?? lot?.event_status ?? null;
  const lotStatus = (lot?.status ?? lot?.listing_status ?? '').toUpperCase();
  const isEventCompleted = (eventStatus || '').toUpperCase() === 'CLOSING' || (eventStatus || '').toUpperCase() === 'CLOSED';
  const stcEligible = lot?.stc_eligible === true || lot?.stc_eligible === 'true';
  const reservePrice = parseFloat(lot?.reserve_price || 0);
  const hasBids = bids.length > 0;
  const highestBid = hasBids
    ? Math.max(...bids.map((b) => parseFloat(b.amount || 0)))
    : 0;
  const highestBidBelowReserve = hasBids && reservePrice > 0 && highestBid < reservePrice;
  const showStcNotice = isEventCompleted && stcEligible && highestBidBelowReserve && !bidsLoading;
  const isLotActive = lotStatus === 'ACTIVE';
  const features = useSelector((state) => state.permissions?.features);
  const manageEventsPerm = features?.manage_events || {};
  const canUpdateEvents = manageEventsPerm?.update === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;
  const canEdit = eventStatus === 'SCHEDULED' && !isLotActive && canUpdateEvents;
  const canDelete = eventStatus === 'SCHEDULED' && !isLotActive && canDeleteEvents;

  const imageUrls = getLotImageUrls(lot);
  const requestedLotId = lotId || lotFromState?.id;

  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when no state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  useEffect(() => {
    if (!requestedLotId) {
      navigate('/manager/dashboard');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(requestedLotId);
        logLotMediaFromApi('ManagerLotDetail getLot()', data);
        if (!cancelled) setLot(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || 'Failed to load lot');
          navigate(`/manager/event/${eventId}`, { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [requestedLotId, eventId, navigate]);

  useEffect(() => {
    if (lotFromState?.id) {
      logLotMediaFromApi('ManagerLotDetail navigation state (initial, refetching full lot)', lotFromState);
    }
  }, [lotFromState?.id]);

  // Fetch event when visiting via direct URL (no event in state)
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

  // Fetch event when visiting via direct URL (no event in state)
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

  // Fetch event when visiting via direct URL (no event in state)
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

  // Fetch event when not in state (for edit/delete permission)
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

  // Fetch event when not in state (e.g. direct URL) to determine edit/delete permissions
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

  // Fetch event when not in state (for edit/delete permission)
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

  // Fetch event when no state (e.g. direct URL) to determine edit/delete permissions
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
    if (!requestedLotId) return;
    let cancelled = false;
    (async () => {
      setBidsLoading(true);
      try {
        const data = await buyerService.getLotBids(requestedLotId);
        if (!cancelled) setBids(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setBids([]);
      } finally {
        if (!cancelled) setBidsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [requestedLotId]);

  useEffect(() => {
    if (lot) {
      console.log('Manager lot details (all data):', lot);
      console.log('Manager lot bids:', bids);
    }
  }, [lot, bids]);

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imageUrls.length]);

  const handleBack = () => {
    navigate(`/manager/event/${eventId}`, { state: { event: eventFromState } });
  };

  const handleEdit = () => {
    if (!canUpdateEvents) {
      toast.error('You do not have permission to edit lots.');
      return;
    }
    navigate('/manager/publishnew', {
      state: { eventId, event: eventFromState, lotId: lot.id, lot, isEdit: true },
    });
  };

  const handleDelete = async () => {
    if (!canDeleteEvents) {
      toast.error('You do not have permission to delete lots.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this lot?')) return;
    setDeleting(true);
    try {
      await auctionService.deleteLot(lot.id);
      toast.success('Lot deleted successfully.');
      handleBack();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete lot');
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <div className="manager-lot-detail">
      <header className="manager-lot-detail__header">
        <button
          className="manager-lot-detail__back"
          onClick={handleBack}
          aria-label="Back to event"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="manager-lot-detail__header-content">
          <h1 className="manager-lot-detail__title">{eventFromState?.title || 'Lot Detail'}</h1>
          <p className="manager-lot-detail__subtitle">1 lot in this event</p>
        </div>
        {(canEdit || canDelete) && (
          <div className="manager-lot-detail__actions">
            {canEdit && (
              <button
                className="manager-lot-detail__btn manager-lot-detail__btn--edit"
                onClick={handleEdit}
                aria-label="Edit lot"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                className="manager-lot-detail__btn manager-lot-detail__btn--delete"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete lot"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
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

          {showStcNotice && (
            <div className="manager-lot-detail__stc-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>This lot is submitted for subject confirmation. Kindly confirm.</p>
            </div>
          )}

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

export default ManagerLotDetail;
