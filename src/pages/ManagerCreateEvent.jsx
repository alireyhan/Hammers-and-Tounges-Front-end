import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { toast } from 'react-toastify';
import { generateEventId } from '../utils/eventId';
import { toDateTimeLocalString, validateEventSchedule } from '../utils/eventDateTimeLocal';
import './ManagerCreateEvent.css';

const formatDateTimeForDisplay = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return '';
  const d = new Date(datetimeLocalValue);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

export default function ManagerCreateEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/clerk')
    ? '/clerk'
    : location.pathname.startsWith('/admin')
      ? '/admin'
      : '/manager';
  const features = useSelector((state) => state.permissions?.features);
  const permissionsLoading = useSelector((state) => state.permissions?.isLoading);
  const canCreateEvents = features?.manage_events?.create === true;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const [formData, setFormData] = useState(() => ({
    event_id: generateEventId(),
    title: '',
    start_time: '',
    end_time: '',
  }));

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

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    const minNowStr = toDateTimeLocalString(new Date());

    if (name === 'start_time') {
      let v = value;
      if (v && v < minNowStr) v = minNowStr;
      setFormData((prev) => {
        const next = { ...prev, start_time: v };
        if (v && prev.end_time && prev.end_time <= v) {
          const sd = new Date(v);
          if (!Number.isNaN(sd.getTime())) {
            sd.setMinutes(sd.getMinutes() + 1);
            next.end_time = toDateTimeLocalString(sd);
          }
        }
        return next;
      });
      return;
    }

    if (name === 'end_time') {
      setFormData((prev) => {
        const endMin =
          prev.start_time && prev.start_time > minNowStr ? prev.start_time : minNowStr;
        let v = value;
        if (v && v < endMin) v = endMin;
        return { ...prev, end_time: v };
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.title?.trim()) {
        toast.error('Please enter an event name.');
        return;
      }
      const schedule = validateEventSchedule(formData.start_time, formData.end_time);
      if (!schedule.ok) {
        toast.error(schedule.message);
        return;
      }
      setIsSubmitting(true);
      try {
        const payload = new FormData();
        payload.append('event_id', String(formData.event_id));
        payload.append('title', formData.title.trim());
        payload.append('start_time', new Date(formData.start_time).toISOString());
        payload.append('end_time', new Date(formData.end_time).toISOString());
        payload.append('status', 'SCHEDULED');
        if (imageFile) payload.append('image', imageFile);

        const createdEvent = await auctionService.createEvent(payload);
        toast.success('Event created successfully!');
        navigate(`${basePath}/dashboard`, {
          state: {
            eventCreated: true,
            createdEventId: createdEvent?.id ?? null,
            createdEventCode: createdEvent?.event_id ?? formData.event_id,
          },
        });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
        toast.error(msg || 'Failed to create event. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, imageFile, navigate, basePath]
  );

  const handleCancel = () => {
    navigate(`${basePath}/dashboard`);
  };

  if (permissionsLoading || !features) {
    return (
      <div className="create-event-page">
        <div className="create-event-content">
          <div className="create-event-card">Loading permissions...</div>
        </div>
      </div>
    );
  }

  const minNowStr = toDateTimeLocalString(new Date());
  const endMinStr =
    formData.start_time && formData.start_time > minNowStr ? formData.start_time : minNowStr;

  if (!canCreateEvents) {
    return (
      <div className="create-event-page">
        <div className="create-event-content">
          <div className="create-event-card">
            <h1 className="create-event-title">Not authorized</h1>
            <p className="create-event-subtitle">You do not have access to create events.</p>
            <button type="button" className="primary-action-btn" onClick={handleCancel}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <header className="create-event-header">
        <div>
          <h1 className="create-event-title">Create Event</h1>
          <p className="create-event-subtitle">
            Add a new auction event. All fields marked with * are required.
          </p>
        </div>
      </header>

      <div className="create-event-content">
        <div className="create-event-card">
          <form onSubmit={handleSubmit} className="create-event-form">
            <div className="create-event-form-group">
              <label>Event ID <span className="required">*</span></label>
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
                  min={minNowStr}
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
                  min={endMinStr}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Create Event
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
