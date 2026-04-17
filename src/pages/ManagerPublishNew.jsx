import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminService } from '../services/interceptors/admin.service';
import { auctionService } from '../services/interceptors/auction.service';
import { getMediaUrl } from '../config/api.config';
import { getLotImageUrls } from '../utils/lotMedia';
import {
  sanitizeDecimalPriceInput,
  sanitizeDigitsOnly,
  sanitizeYearInput,
} from '../utils/numericFormInput';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import './ManagerPublishNew.css';

const MAX_IMAGES = 8;

const ManagerPublishNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const authUserRole = useSelector((state) => (state.auth?.user?.role || '').toLowerCase());
  const features = useSelector((state) => state.permissions?.features);
  const manageEventsPerm = features?.manage_events || {};
  const canCreateEvents = manageEventsPerm?.create === true;
  const canUpdateEvents = manageEventsPerm?.update === true;
  const isManagerFlow = location?.pathname?.startsWith('/manager') === true;
  const isClerkFlow = location?.pathname?.startsWith('/clerk') === true;

  const { eventId, event, lotId, lot: existingLot, isEdit, fromAdmin } = location.state || {};
  const fromClerk = location.state?.fromClerk;
  const lot = existingLot;

  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    seller: '',
    title: '',
    description: '',
    category: '',
    initial_price: '',
    reserve_price: '',
    stc_eligible: false,
    specific_data: {},
  });

  const [images, setImages] = useState([]); // { id, file, label }

  // Redirect if no event context (unless editing, we need eventId from lot's auction_event)
  useEffect(() => {
    const effectiveEventId = eventId || existingLot?.auction_event;
    if (!effectiveEventId) {
      toast.info('Please select an event first.');
      navigate(fromAdmin ? '/admin/dashboard' : fromClerk ? '/clerk/dashboard' : '/manager/dashboard');
    }
  }, [eventId, existingLot?.auction_event, fromAdmin, fromClerk, navigate]);

  // Clerks can only create draft lots (no edit flow)
  useEffect(() => {
    if (authUserRole === 'clerk' && isEdit) {
      toast.info('Clerks can only create draft lots.');
      const effectiveEventId = eventId || existingLot?.auction_event;
      if (effectiveEventId) {
        navigate(`/clerk/event/${effectiveEventId}`, { state: { event }, replace: true });
      } else {
        navigate('/clerk/dashboard', { replace: true });
      }
    }
  }, [authUserRole, isEdit, eventId, existingLot?.auction_event, event, navigate]);

  // Pre-populate form when editing
  useEffect(() => {
    if (!isEdit || !existingLot) return;
    setFormData({
      seller: String(existingLot.seller ?? existingLot.seller_details?.id ?? ''),
      title: existingLot.title ?? '',
      description: existingLot.description ?? '',
      category: String(existingLot.category ?? existingLot.category_id ?? ''),
      initial_price: existingLot.initial_price ?? '',
      reserve_price: existingLot.reserve_price ?? '',
      stc_eligible: Boolean(existingLot.stc_eligible),
      specific_data: existingLot.specific_data && typeof existingLot.specific_data === 'object' ? { ...existingLot.specific_data } : {},
    });
    if (existingLot.media?.length) {
      setImages(
        getLotImageUrls(existingLot.media).map((url, i) => ({
          id: `existing-${i}`,
          file: url,
          label: `Image ${i + 1}`,
        }))
      );
    }
  }, [isEdit, existingLot]);

  // Fetch sellers and categories from admin flow
  const effectiveEventId = eventId || existingLot?.auction_event;
  useEffect(() => {
    if (!effectiveEventId) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const [usersRes, catsRes] = await Promise.all([
          adminService.getUsersList({ role: 'seller', page_size: 200 }),
          adminService.getCategories(),
        ]);
        if (cancelled) return;
        const userList = usersRes?.results || [];
        const sellerList = userList.filter((u) => u.role === 'seller');
        setSellers(sellerList);
        const catList = Array.isArray(catsRes) ? catsRes : catsRes?.results || catsRes?.data || [];
        setCategories(catList);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading sellers/categories:', err);
          toast.error('Failed to load sellers and categories.');
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveEventId]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'category') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        specific_data: {},
      }));
      return;
    }
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'initial_price' || name === 'reserve_price') {
      setFormData((prev) => ({ ...prev, [name]: sanitizeDecimalPriceInput(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSpecificDataChange = useCallback((fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      specific_data: {
        ...prev.specific_data,
        [fieldName]: value,
      },
    }));
  }, []);

  const formatFieldLabel = (fieldName) =>
    fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const selectedCategory = categories.find((c) => String(c.id) === String(formData.category));
  const validationSchema = selectedCategory?.validation_schema || {};

  const renderSpecificField = useCallback(
    (fieldName, fieldConfig) => {
      const label = formatFieldLabel(fieldName);
      const value = formData.specific_data[fieldName];
      const isRequired = fieldConfig.required;

      // Dropdown (enum)
      if (fieldConfig.enum && Array.isArray(fieldConfig.enum)) {
        return (
          <div key={fieldName} className="mpn-form-group">
            <label className="mpn-form-label">
              {label} {isRequired && <span className="mpn-required">*</span>}
            </label>
            <select
              className="mpn-select"
              value={value ?? ''}
              onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
              required={isRequired}
            >
              <option value="">Select {label}</option>
              {fieldConfig.enum.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }

      // Textarea
      if (fieldConfig.type === 'textarea') {
        return (
          <div key={fieldName} className="mpn-form-group">
            <label className="mpn-form-label">
              {label} {isRequired && <span className="mpn-required">*</span>}
            </label>
            <textarea
              className="mpn-textarea"
              value={value ?? ''}
              onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              rows={3}
              required={isRequired}
            />
          </div>
        );
      }

      // Checkbox
      if (fieldConfig.type === 'checkbox') {
        return (
          <div key={fieldName} className="mpn-form-group mpn-checkbox-field">
            <label className="mpn-checkbox-field-label">
              <input
                type="checkbox"
                className="mpn-checkbox-native"
                checked={!!value}
                onChange={(e) => handleSpecificDataChange(fieldName, e.target.checked)}
              />
              <span className="mpn-checkbox-field-text">
                {label} {isRequired && <span className="mpn-required">*</span>}
              </span>
            </label>
          </div>
        );
      }

      // Year (often text in schema) — digits only
      if (fieldName.toLowerCase() === 'year' || fieldName.toLowerCase() === 'model_year') {
        return (
          <div key={fieldName} className="mpn-form-group">
            <label className="mpn-form-label">
              {label} {isRequired && <span className="mpn-required">*</span>}
            </label>
            <input
              type="text"
              className="mpn-input"
              inputMode="numeric"
              autoComplete="off"
              value={value ?? ''}
              onChange={(e) => handleSpecificDataChange(fieldName, sanitizeYearInput(e.target.value))}
              placeholder={`Enter ${label.toLowerCase()}...`}
              maxLength={4}
              required={isRequired}
            />
          </div>
        );
      }

      // Range
      if (fieldConfig.type === 'range') {
        const minR = fieldConfig.min ?? 0;
        const maxR = fieldConfig.max ?? 100;
        const parsed = value !== '' && value !== undefined && value !== null ? Number(value) : minR;
        const numValue = Number.isNaN(parsed) ? minR : Math.min(maxR, Math.max(minR, parsed));
        return (
          <div key={fieldName} className="mpn-form-group">
            <label className="mpn-form-label">
              {label} {isRequired && <span className="mpn-required">*</span>}
            </label>
            <div className="mpn-form-row" style={{ alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                className="mpn-input"
                min={minR}
                max={maxR}
                value={numValue}
                onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
              />
              <input
                type="text"
                className="mpn-input"
                style={{ maxWidth: '100px' }}
                inputMode="numeric"
                autoComplete="off"
                value={String(numValue)}
                onChange={(e) => {
                  const v = sanitizeDigitsOnly(e.target.value);
                  if (v === '') {
                    handleSpecificDataChange(fieldName, String(minR));
                    return;
                  }
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  const clamped = Math.min(maxR, Math.max(minR, n));
                  handleSpecificDataChange(fieldName, String(clamped));
                }}
              />
            </div>
          </div>
        );
      }

      // Number
      if (fieldConfig.type === 'number' || fieldConfig.type === 'integer') {
        return (
          <div key={fieldName} className="mpn-form-group">
            <label className="mpn-form-label">
              {label} {isRequired && <span className="mpn-required">*</span>}
            </label>
            <input
              type="text"
              className="mpn-input"
              inputMode={fieldConfig.type === 'integer' ? 'numeric' : 'decimal'}
              autoComplete="off"
              value={value ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                const next =
                  fieldConfig.type === 'integer'
                    ? sanitizeDigitsOnly(raw)
                    : sanitizeDecimalPriceInput(raw);
                handleSpecificDataChange(fieldName, next);
              }}
              placeholder={`Enter ${label.toLowerCase()}...`}
              required={isRequired}
            />
          </div>
        );
      }

      // Text (default)
      return (
        <div key={fieldName} className="mpn-form-group">
          <label className="mpn-form-label">
            {label} {isRequired && <span className="mpn-required">*</span>}
          </label>
          <input
            type="text"
            className="mpn-input"
            value={value ?? ''}
            onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            required={isRequired}
          />
        </div>
      );
    },
    [formData.specific_data, handleSpecificDataChange]
  );

  const handleImageUpload = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - images.length;
    const toAdd = valid.slice(0, remaining).map((file) => ({
      id: Date.now() + Math.random(),
      file,
      label: file.name.replace(/\.[^/.]+$/, ''),
    }));
    setImages((prev) => [...prev, ...toAdd]);
  }, [images.length]);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const updateImageLabel = useCallback((id, label) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, label } : img))
    );
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      handleImageUpload(e.dataTransfer.files);
    },
    [handleImageUpload]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('mpn-drag-active');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('mpn-drag-active');
  }, []);

  const buildFormData = useCallback(
    (status = 'DRAFT') => {
      const evId = eventId || existingLot?.auction_event;
      const fd = new FormData();
      fd.append('seller', formData.seller);
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('auction_event', evId);
      fd.append('initial_price', formData.initial_price || '0');
      fd.append('reserve_price', formData.reserve_price || '0');
      fd.append('stc_eligible', formData.stc_eligible ? 'true' : 'false');
      fd.append('status', status);
      const specificData = formData.specific_data;
      fd.append(
        'specific_data',
        JSON.stringify(
          specificData && typeof specificData === 'object' ? specificData : {}
        )
      );
      images.forEach((img, idx) => {
        if (img.file instanceof File) {
          fd.append(`image_${idx + 1}`, img.file);
          fd.append('media_labels', img.label || `Image ${idx + 1}`);
        }
      });
      return fd;
    },
    [formData, eventId, existingLot?.auction_event, images]
  );

  const handleSubmit = useCallback(
    async (status = 'DRAFT') => {
      const evId = eventId || existingLot?.auction_event;
      if (!evId) return;
      if (authUserRole === 'clerk' && isEdit) {
        toast.info('Clerks cannot edit lots.');
        return;
      }
      if (!formData.seller || !formData.title || !formData.description || !formData.category) {
        toast.error('Please fill in required fields: Seller, Title, Description, Category.');
        return;
      }
      const initial = parseFloat(formData.initial_price);
      if (isNaN(initial) || initial < 0) {
        toast.error('Please enter a valid initial price.');
        return;
      }
      setSubmitting(true);
      try {
        const effectiveStatus = authUserRole === 'clerk' ? 'DRAFT' : status;
        if (isManagerFlow) {
          if (isEdit && lotId && !canUpdateEvents) {
            toast.error('You do not have permission to edit lots.');
            setSubmitting(false);
            return;
          }
          if (!isEdit && !canCreateEvents) {
            toast.error('You do not have permission to create lots.');
            setSubmitting(false);
            return;
          }
        }
        if (isClerkFlow) {
          // Clerks can only create draft lots; still gate by manage_events.create/update
          if (!isEdit && !canCreateEvents) {
            toast.error('You do not have permission to create lots/events.');
            setSubmitting(false);
            return;
          }
          if (isEdit && lotId && !canUpdateEvents) {
            toast.error('You do not have permission to update lots.');
            setSubmitting(false);
            return;
          }
        }

        if (isEdit && lotId) {
          const evId = eventId || existingLot?.auction_event;
          const payload = {
            seller: Number(formData.seller),
            title: formData.title,
            description: formData.description,
            category: Number(formData.category),
            auction_event: Number(evId),
            initial_price: String(formData.initial_price || '0'),
            reserve_price: String(formData.reserve_price || '0'),
            stc_eligible: Boolean(formData.stc_eligible),
            status: effectiveStatus,
            specific_data: formData.specific_data && Object.keys(formData.specific_data).length > 0
              ? formData.specific_data
              : {},
          };
          await auctionService.updateLot(lotId, payload);
          toast.success('Lot updated successfully.');
        } else {
          const fd = buildFormData(effectiveStatus);
          const mediaParts = [];
          const labelParts = [];
          for (const [key, value] of fd.entries()) {
            if (/^image_\d+$/.test(key)) {
              mediaParts.push(
                value instanceof File
                  ? { field: key, kind: 'File', name: value.name, size: value.size, type: value.type }
                  : { field: key, kind: typeof value, preview: String(value).slice(0, 120) }
              );
            } else if (key === 'media_labels') {
              labelParts.push(value);
            }
          }
          const nonFileSlots = images.filter((img) => !(img.file instanceof File)).length;
          console.log('[HT LotCreate][web] submitting lot images', {
            selectedImagesCount: images.length,
            nonFileSlotsSkipped: nonFileSlots,
            selectedImageNames: images.map((img) =>
              img.file instanceof File ? img.file.name : String(img.file || '')
            ),
            formDataMediaCount: mediaParts.length,
            formDataLabelsCount: labelParts.length,
            formDataMediaParts: mediaParts,
            formDataLabelParts: labelParts,
          });
          const createdLot = await auctionService.createLot(fd);
          console.log('[HT LotCreate][web] create response media', {
            lotId: createdLot?.id,
            mediaArrayLength: Array.isArray(createdLot?.media) ? createdLot.media.length : 0,
            media: createdLot?.media,
          });
          toast.success('Lot created successfully.');
          // Pass created lot back so clerk can see it even if list API omits drafts
          if (fromAdmin) {
            navigate(`/admin/event/${evId}`, { state: { event, lotCreated: true, createdLot } });
            return;
          }
          if (fromClerk || authUserRole === 'clerk') {
            navigate(`/clerk/event/${evId}`, { state: { event, lotCreated: true, createdLot } });
            return;
          }
          navigate(`/manager/event/${evId}`, { state: { event, lotCreated: true, createdLot } });
          return;
        }
        if (fromAdmin) {
          navigate(`/admin/event/${evId}`, { state: { event, lotCreated: true } });
        } else if (fromClerk || authUserRole === 'clerk') {
          navigate(`/clerk/event/${evId}`, { state: { event, lotCreated: true } });
        } else {
          navigate(`/manager/event/${evId}`, { state: { event, lotCreated: true } });
        }
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          (isEdit ? 'Failed to update lot.' : 'Failed to create lot.');
        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setSubmitting(false);
      }
    },
    [eventId, existingLot?.auction_event, event, formData, buildFormData, navigate, isEdit, lotId, fromAdmin, fromClerk, authUserRole]
  );

  const handleSaveDraft = useCallback(() => handleSubmit('DRAFT'), [handleSubmit]);
  const handlePublish = useCallback(() => handleSubmit('DRAFT'), [handleSubmit]);

  const handleBack = useCallback(() => {
    const evId = eventId || existingLot?.auction_event;
    if (evId) {
      if (fromAdmin) {
        navigate(`/admin/event/${evId}`, { state: { event } });
      } else if (fromClerk || authUserRole === 'clerk') {
        navigate(`/clerk/event/${evId}`, { state: { event } });
      } else {
        navigate(`/manager/event/${evId}`, { state: { event } });
      }
    } else {
      navigate(fromAdmin ? '/admin/dashboard' : fromClerk ? '/clerk/dashboard' : '/manager/dashboard');
    }
  }, [eventId, existingLot?.auction_event, event, fromAdmin, fromClerk, authUserRole, navigate]);

  if (!eventId && !existingLot?.auction_event) return null;

  if (loadingData) {
    return (
      <div className="mpn-container mpn-loading-screen">
        <div className="mpn-spinner" />
        <p>Loading sellers and categories...</p>
      </div>
    );
  }

  return (
    <div className="mpn-container">
      <header className="mpn-header">
        <div className="mpn-header-content">
          <div>
            <button
              type="button"
              className="mpn-btn mpn-btn-back"
              onClick={handleBack}
              aria-label="Back to event"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h1 className="mpn-title">{isEdit ? 'Edit Lot' : 'Create Lot'}</h1>
            <p className="mpn-subtitle">
              {event?.title ? `Event: ${event.title}` : 'Add a new lot to this event'}
            </p>
          </div>
          <button
            type="button"
            className="mpn-btn mpn-btn-outline"
            onClick={handleSaveDraft}
            disabled={submitting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" />
              <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" />
            </svg>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="mpn-main-grid">
        <div className="mpn-left-column">
          <div className="mpn-card">
            <div className="mpn-card-header">
              <h2 className="mpn-card-title">Lot Details</h2>
            </div>

            <div className="mpn-form-group">
              <label className="mpn-form-label">
                Seller <span className="mpn-required">*</span>
              </label>
              <select
                className="mpn-select"
                name="seller"
                value={formData.seller}
                onChange={handleChange}
                required
              >
                <option value="">Select a seller</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.seller_details?.id ?? s.id}>
                    {s.full_name || s.email || `Seller #${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mpn-form-group">
              <label className="mpn-form-label">
                Lot Title <span className="mpn-required">*</span>
              </label>
              <input
                type="text"
                className="mpn-input"
                placeholder="e.g., 2015 Toyota Hilux"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mpn-form-group">
              <label className="mpn-form-label">
                Description <span className="mpn-required">*</span>
              </label>
              <textarea
                className="mpn-textarea"
                placeholder="Describe the lot in detail..."
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                spellCheck={false}
                required
              />
              <div className="mpn-textarea-counter">{formData.description.length}/2000</div>
            </div>

            <div className="mpn-form-group">
              <label className="mpn-form-label">
                Category <span className="mpn-required">*</span>
              </label>
              <select
                className="mpn-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.slug || `Category #${c.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mpn-form-row">
              <div className="mpn-form-group">
                <label className="mpn-form-label">
                  Initial Price ($) <span className="mpn-required">*</span>
                </label>
                <div className="mpn-input-with-prefix">
                  <span className="mpn-input-prefix">$</span>
                  <input
                    type="text"
                    className="mpn-input"
                    placeholder="0.00"
                    name="initial_price"
                    value={formData.initial_price}
                    onChange={handleChange}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
              <div className="mpn-form-group">
                <label className="mpn-form-label">Reserve Price ($)</label>
                <div className="mpn-input-with-prefix">
                  <span className="mpn-input-prefix">$</span>
                  <input
                    type="text"
                    className="mpn-input"
                    placeholder="0.00"
                    name="reserve_price"
                    value={formData.reserve_price}
                    onChange={handleChange}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="mpn-toggle-group">
              <div className="mpn-toggle-content">
                <div className="mpn-toggle-label">
                  <span className="mpn-toggle-title">STC Eligible</span>
                  <span className="mpn-toggle-description">Subject to Confirmation</span>
                </div>
                <label className="mpn-switch">
                  <input
                    type="checkbox"
                    name="stc_eligible"
                    checked={formData.stc_eligible}
                    onChange={handleChange}
                  />
                  <span className="mpn-slider" />
                </label>
              </div>
            </div>

            {formData.category && Object.keys(validationSchema).length > 0 && (
              <div className="mpn-specific-data-section">
                {Object.entries(validationSchema).map(([fieldName, fieldConfig]) =>
                  renderSpecificField(fieldName, fieldConfig)
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mpn-right-column">
          <div className="mpn-card">
            <div className="mpn-card-header">
              <h2 className="mpn-card-title">Images & Media</h2>
              {images.length > 0 && (
                <span className="mpn-image-count">{images.length}/{MAX_IMAGES}</span>
              )}
            </div>

            <div
              className={`mpn-drop-area ${images.length > 0 ? 'mpn-has-images' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mpn-drop-area-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="mpn-drop-area-text">
                  <p className="mpn-drop-area-title">Drop images here or click to upload</p>
                  <p className="mpn-drop-area-subtitle">
                    JPG, PNG, GIF up to 5MB each (max {MAX_IMAGES}) - multi-select supported
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="mpn-file-input"
              />
            </div>

            {images.length > 0 && (
              <div className="mpn-image-grid">
                {images.map((img) => {
                  const src =
                    img.file instanceof File || img.file instanceof Blob
                      ? URL.createObjectURL(img.file)
                      : getMediaUrl(img.file) || '';
                  return (
                    <div key={img.id} className="mpn-image-preview">
                      <img
                        src={src}
                        alt={img.label}
                        className="mpn-preview-img"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        className="mpn-remove-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        aria-label={`Remove ${img.label}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        className="mpn-image-label"
                        placeholder="Label"
                        value={img.label}
                        onChange={(e) => updateImageLabel(img.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManagerPublishNew;
