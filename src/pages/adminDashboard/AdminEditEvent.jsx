import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auctionService } from '../../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import '../ManagerCreateEvent.css';

const toDatetimeLocal = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const formatDateTimeForDisplay = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return '';
  const d = new Date(datetimeLocalValue);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

export default function AdminEditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    start_time: '',
    end_time: '',
  });

  const openPicker = useCallback((ref) => {
    const el = ref?.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
      return;
    }
    el.focus();
    el.click();
  }, []);

  const startDisplay = useMemo(
    () => formatDateTimeForDisplay(formData.start_time),
    [formData.start_time]
  );
  const endDisplay = useMemo(
    () => formatDateTimeForDisplay(formData.end_time),
    [formData.end_time]
  );

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!eventId) {
      setLoadingEvent(false);
      return;
    }
    let cancelled = false;
    setLoadingEvent(true);
    auctionService
      .getEvent(eventId)
      .then((ev) => {
        if (!cancelled) {
          setEvent(ev);
          const evId = ev.event_id ?? ev.event_code ?? ev.code ?? '';
          setFormData({
            event_id: String(evId || ''),
            title: ev.title ?? '',
            start_time: toDatetimeLocal(ev.start_time),
            end_time: toDatetimeLocal(ev.end_time),
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err?.message || 'Failed to load event');
          navigate('/admin/dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEvent(false);
      });
    return () => { cancelled = true; };
  }, [eventId, navigate]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!eventId) return;
      if (!formData.title?.trim()) {
        toast.error('Please enter an event name.');
        return;
      }
      if (!formData.start_time || !formData.end_time) {
        toast.error('Please set start and end date/time.');
        return;
      }
      setIsSubmitting(true);
      try {
        const payload = new FormData();
        payload.append('title', formData.title.trim());
        payload.append('start_time', new Date(formData.start_time).toISOString());
        payload.append('end_time', new Date(formData.end_time).toISOString());
        if (imageFile) payload.append('image', imageFile);

        await auctionService.updateEvent(eventId, payload);
        toast.success('Event updated successfully!');
        navigate('/admin/dashboard');
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
        toast.error(msg || 'Failed to update event. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [eventId, formData, imageFile, navigate]
  );

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  if (loadingEvent || (!event && eventId)) {
    return (
      <div className="create-event-page">
        <div className="create-event-header">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event && !loadingEvent) return null;

  return (
    <div className="create-event-page">
      <header className="create-event-header">
        <div>
          <h1 className="create-event-title">Edit Event</h1>
          <p className="create-event-subtitle">
            Update auction event details. All fields marked with * are required.
          </p>
        </div>
      </header>

      <div className="create-event-content">
        <div className="create-event-card">
          <form onSubmit={handleSubmit} className="create-event-form">
            <div className="create-event-form-group">
              <label>Event ID</label>
              <input
                type="text"
                name="event_id"
                value={formData.event_id}
                disabled
              />
            </div>

            <div className="create-event-form-group">
              <label>Event Name <span className="required">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                disabled={isSubmitting}
                placeholder="e.g. Mega Auto Auction"
              />
            </div>

            <div className="create-event-form-group">
              <label>Event Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              {imagePreviewUrl ? (
                <div className="event-image-preview">
                  <img src={imagePreviewUrl} alt="Selected event" />
                  <button
                    type="button"
                    className="event-image-remove"
                    onClick={() => setImageFile(null)}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="create-event-form-row">
              <div className="create-event-form-group">
                <label>Start Date & Time <span className="required">*</span></label>
                <button
                  type="button"
                  className="create-event-datebox"
                  onClick={() => openPicker(startInputRef)}
                  disabled={isSubmitting}
                >
                  <span className={startDisplay ? 'create-event-datebox-value' : 'create-event-datebox-placeholder'}>
                    {startDisplay || 'Select start date & time'}
                  </span>
                </button>
                <input
                  ref={startInputRef}
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleFormChange}
                  required
                  disabled={isSubmitting}
                  className="create-event-hidden-datetime"
                  tabIndex={-1}
                />
              </div>
              <div className="create-event-form-group">
                <label>End Date & Time <span className="required">*</span></label>
                <button
                  type="button"
                  className="create-event-datebox"
                  onClick={() => openPicker(endInputRef)}
                  disabled={isSubmitting}
                >
                  <span className={endDisplay ? 'create-event-datebox-value' : 'create-event-datebox-placeholder'}>
                    {endDisplay || 'Select end date & time'}
                  </span>
                </button>
                <input
                  ref={endInputRef}
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleFormChange}
                  required
                  disabled={isSubmitting}
                  className="create-event-hidden-datetime"
                  tabIndex={-1}
                />
              </div>
            </div>

            <div className="create-event-form-actions">
              <button
                type="submit"
                className="create-event-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="create-event-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                className="create-event-btn-secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
