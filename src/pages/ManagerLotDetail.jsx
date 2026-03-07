import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auctionService } from '../services/interceptors/auction.service';
import { getMediaUrl } from '../config/api.config';
import { toast } from 'react-toastify';
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
  const [loading, setLoading] = useState(!lotFromState);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const intervalRef = useRef(null);

  const eventStatus = event?.status ?? eventFromState?.status ?? null;
  const canEditDelete = eventStatus === 'SCHEDULED';

  const imageMedia = lot?.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);

  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when no state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  // Fetch lot when not in state (e.g. direct URL)
  useEffect(() => {
    if (lotFromState) return;
    if (!lotId) {
      navigate('/manager/dashboard');
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
          navigate(`/manager/event/${eventId}`, { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lotId, lotFromState, eventId, navigate]);

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

  // Fetch event when not in state (for edit/delete permission when visiting via direct URL)
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
    navigate('/manager/publishnew', {
      state: { eventId, event: eventFromState, lotId: lot.id, lot, isEdit: true },
    });
  };

  const handleDelete = async () => {
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
        {canEditDelete && (
          <div className="manager-lot-detail__actions">
            <button
              className="manager-lot-detail__btn manager-lot-detail__btn--edit"
              onClick={handleEdit}
              aria-label="Edit lot"
            >
              Edit
            </button>
            <button
              className="manager-lot-detail__btn manager-lot-detail__btn--delete"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete lot"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
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
          <span className={`manager-lot-detail__status manager-lot-detail__status--${(lot.status || '').toLowerCase()}`}>
            {lot.status || '—'}
          </span>
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

          <div className="manager-lot-detail__bids">
            {lot.total_bids != null ? `${lot.total_bids} bid(s)` : '0 bid(s)'}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerLotDetail;
