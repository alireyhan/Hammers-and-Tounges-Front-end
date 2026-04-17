import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getLotImageUrls } from '../utils/lotMedia';
import { auctionService } from '../services/interceptors/auction.service';
import { grvService } from '../services/interceptors/grv.service';
import { toast } from 'react-toastify';
import './GuestLotDrawer.css';
import './GrvLotDrawer.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) =>
  String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeGrvList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const pickGrvForLot = (list, lotId) => {
  const id = Number(lotId);
  const match = list.find((r) => Number(r?.lot) === id);
  return match || list[0] || null;
};

/**
 * Lot detail panel matching guest/admin event lot drawer layout, with GRV checklist CRUD.
 */
const GrvLotDrawer = ({ lot: initialLot, onClose, onGrvChanged }) => {
  const location = useLocation();
  const features = useSelector((state) => state.permissions?.features);

  const isAdminGrvRoute = location.pathname.startsWith('/admin/');
  const mg = features?.manage_grv || {};
  const canGrvCreate = isAdminGrvRoute || mg.create === true;
  const canGrvUpdate = isAdminGrvRoute || mg.update === true;
  const canGrvDelete = isAdminGrvRoute || mg.delete === true;

  const [lot, setLot] = useState(initialLot);
  const [loadingLot, setLoadingLot] = useState(true);
  const [grvLoading, setGrvLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const [grvId, setGrvId] = useState(null);
  const [checklistCompleted, setChecklistCompleted] = useState(false);
  const [conditionConfirmed, setConditionConfirmed] = useState(false);
  const [adminSignedOff, setAdminSignedOff] = useState(false);
  const [notes, setNotes] = useState('');
  const [statusDisplay, setStatusDisplay] = useState('');

  const effectiveLot = lot || initialLot;
  const eventTitle = effectiveLot?.event_title || '—';

  const imageUrls = getLotImageUrls(effectiveLot);
  const displayImage = imageUrls[selectedImage] || imageUrls[0];

  const specificData = useMemo(() => {
    let sd = effectiveLot?.specific_data;
    if (typeof sd === 'string') {
      try {
        sd = JSON.parse(sd) || {};
      } catch {
        sd = {};
      }
    }
    return sd || {};
  }, [effectiveLot?.specific_data]);

  const currency = effectiveLot?.currency || 'USD';
  const currentBid = effectiveLot?.current_price ?? effectiveLot?.highest_bid ?? effectiveLot?.initial_price;

  const loadGrv = useCallback(async (lotId) => {
    if (lotId == null) return;
    setGrvLoading(true);
    try {
      const raw = await grvService.list({ lot: lotId });
      const list = normalizeGrvList(raw);
      const rec = pickGrvForLot(list, lotId);
      if (rec) {
        setGrvId(rec.id);
        setChecklistCompleted(!!rec.checklist_completed);
        setConditionConfirmed(!!rec.condition_confirmed);
        setAdminSignedOff(!!rec.admin_signed_off);
        setNotes(rec.notes != null ? String(rec.notes) : '');
        setStatusDisplay(String(rec.status || '').toUpperCase() || '—');
      } else {
        setGrvId(null);
        setChecklistCompleted(false);
        setConditionConfirmed(false);
        setAdminSignedOff(false);
        setNotes('');
        setStatusDisplay('—');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to load GRV');
      setGrvId(null);
      setChecklistCompleted(false);
      setConditionConfirmed(false);
      setAdminSignedOff(false);
      setNotes('');
      setStatusDisplay('—');
    } finally {
      setGrvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLot?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingLot(true);
      try {
        const data = await auctionService.getLot(initialLot.id);
        if (!cancelled) setLot(data);
      } catch {
        if (!cancelled) setLot(initialLot);
      } finally {
        if (!cancelled) setLoadingLot(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLot?.id, initialLot]);

  useEffect(() => {
    if (effectiveLot?.id) loadGrv(effectiveLot.id);
  }, [effectiveLot?.id, loadGrv]);

  const hasRecord = grvId != null;

  const fieldsEditable =
    isAdminGrvRoute ||
    (!hasRecord && canGrvCreate) ||
    (hasRecord && canGrvUpdate);

  const showSaveOrCreate =
    (!hasRecord && canGrvCreate) || (hasRecord && canGrvUpdate);

  const showGrvPermissionHint =
    !isAdminGrvRoute &&
    !fieldsEditable &&
    (!hasRecord || !canGrvDelete);

  const handleCreateOrSave = async () => {
    const lotId = effectiveLot?.id;
    if (lotId == null) return;
    if (hasRecord && !canGrvUpdate) {
      toast.error('You do not have permission to update this checklist.');
      return;
    }
    if (!hasRecord && !canGrvCreate) {
      toast.error('You do not have permission to create a checklist for this lot.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        lot: Number(lotId),
        checklist_completed: checklistCompleted,
        condition_confirmed: conditionConfirmed,
        admin_signed_off: adminSignedOff,
        notes: notes.trim() || '',
      };
      if (hasRecord) {
        await grvService.update(grvId, {
          checklist_completed: checklistCompleted,
          condition_confirmed: conditionConfirmed,
          admin_signed_off: adminSignedOff,
          notes: notes.trim() || '',
        });
        toast.success('GRV updated.');
        await loadGrv(lotId);
        onGrvChanged?.();
      } else {
        await grvService.create(payload);
        toast.success('GRV checklist created.');
        await loadGrv(lotId);
        onGrvChanged?.();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save GRV';
      toast.error(typeof msg === 'string' ? msg : 'Failed to save GRV');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (grvId == null) return;
    if (!canGrvDelete) {
      toast.error('You do not have permission to delete this checklist.');
      return;
    }
    if (
      !window.confirm(
        'Delete this GRV report? This may remove ACTIVE capabilities from the lot. Continue?'
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await grvService.delete(grvId);
      toast.success('GRV deleted.');
      setGrvId(null);
      setChecklistCompleted(false);
      setConditionConfirmed(false);
      setAdminSignedOff(false);
      setNotes('');
      setStatusDisplay('—');
      onGrvChanged?.();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete GRV';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete GRV');
    } finally {
      setDeleting(false);
    }
  };

  if (!effectiveLot) return null;

  const checklistDone = checklistCompleted && conditionConfirmed;

  return (
    <>
      <div className="guest-lot-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="guest-lot-drawer" role="dialog" aria-modal="true" aria-label="GRV lot details">
        <div className="guest-lot-drawer__inner">
          <header className="guest-lot-drawer__header">
            <button type="button" className="guest-lot-drawer__close" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h2 className="guest-lot-drawer__lot-no">
              Lot #{effectiveLot.lot_number || effectiveLot.id}
            </h2>
          </header>

          {loadingLot ? (
            <div className="guest-lot-drawer__loading">
              <div className="guest-lot-drawer__spinner" />
              <p>Loading...</p>
            </div>
          ) : (
            <div className="guest-lot-drawer__scroll">
              <div className="guest-lot-drawer__main">
                <div className="guest-lot-drawer__content">
                  <div className="guest-lot-drawer__media">
                    {displayImage ? (
                      <>
                        <div className="guest-lot-drawer__image-wrap">
                          <img src={displayImage} alt={effectiveLot.title || ''} />
                        </div>
                        {imageUrls.length > 1 && (
                          <div className="guest-lot-drawer__thumbs">
                            {imageUrls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`guest-lot-drawer__thumb ${i === selectedImage ? 'active' : ''}`}
                                onClick={() => setSelectedImage(i)}
                              >
                                <img src={url} alt="" />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="guest-lot-drawer__placeholder">📷 No image</div>
                    )}
                  </div>

                  <div className="guest-lot-drawer__body">
                    <h3 className="guest-lot-drawer__title">{effectiveLot.title || 'Untitled'}</h3>
                    <p className="guest-lot-drawer__meta-line">
                      {eventTitle}
                      {effectiveLot.category_name && ` • ${effectiveLot.category_name}`}
                    </p>
                    {effectiveLot.description && (
                      <p className="guest-lot-drawer__desc">{effectiveLot.description}</p>
                    )}

                    {Object.keys(specificData).length > 0 && (
                      <div className="guest-lot-drawer__specs">
                        <h4 className="guest-lot-drawer__section-title">Details</h4>
                        <div className="guest-lot-drawer__spec-list">
                          {Object.entries(specificData).map(([key, value]) => (
                            <div key={key} className="guest-lot-drawer__spec-row">
                              <span className="guest-lot-drawer__spec-key">{formatSpecificKey(key)}</span>
                              <span className="guest-lot-drawer__spec-value">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="guest-lot-drawer__sidebar">
                  <div className="guest-lot-drawer__bid-card">
                    <div className="guest-lot-drawer__bid">
                      <div className="guest-lot-drawer__bid-icon">!</div>
                      <div>
                        <span className="guest-lot-drawer__bid-label">STARTING PRICE</span>
                        <span className="guest-lot-drawer__bid-value">
                          {currency} {formatPrice(currentBid)}
                        </span>
                      </div>
                    </div>
                    <div className="guest-lot-drawer__bid-not-available">Draft lot · GRV verification</div>
                  </div>
                </aside>
              </div>

              <section className="grv-panel">
                <h4 className="guest-lot-drawer__section-title">Goods received verification</h4>
                {grvLoading ? (
                  <p className="guest-lot-drawer__muted">Loading checklist…</p>
                ) : (
                  <>
                    {checklistDone && hasRecord && (
                      <p className="grv-panel__badge">Checklist items were completed for this lot.</p>
                    )}
                    {showGrvPermissionHint && (
                      <p className="guest-lot-drawer__muted">
                        {hasRecord
                          ? 'View only. You need GRV update access to change this checklist.'
                          : 'You do not have permission to create a checklist for this lot.'}
                      </p>
                    )}
                    <div className="grv-panel__meta">
                      <span>Status</span>
                      <strong>{statusDisplay}</strong>
                    </div>
                    <label className="grv-panel__check">
                      <input
                        type="checkbox"
                        checked={checklistCompleted}
                        onChange={(e) => setChecklistCompleted(e.target.checked)}
                        disabled={!fieldsEditable}
                      />
                      <span>Checklist completed</span>
                    </label>
                    <label className="grv-panel__check">
                      <input
                        type="checkbox"
                        checked={conditionConfirmed}
                        onChange={(e) => setConditionConfirmed(e.target.checked)}
                        disabled={!fieldsEditable}
                      />
                      <span>Condition confirmed</span>
                    </label>
                    <label className="grv-panel__check">
                      <input
                        type="checkbox"
                        checked={adminSignedOff}
                        onChange={(e) => setAdminSignedOff(e.target.checked)}
                        disabled={!fieldsEditable}
                      />
                      <span>Admin signed off</span>
                    </label>
                    <label className="grv-panel__notes-label" htmlFor="grv-notes">
                      Notes
                    </label>
                    <textarea
                      id="grv-notes"
                      className="grv-panel__notes"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes…"
                      readOnly={!fieldsEditable}
                    />
                    <div className="grv-panel__actions">
                      {showSaveOrCreate && (
                        <button
                          type="button"
                          className="grv-panel__btn grv-panel__btn--primary"
                          onClick={handleCreateOrSave}
                          disabled={saving}
                        >
                          {saving ? 'Saving…' : hasRecord ? 'Save changes' : 'Create checklist'}
                        </button>
                      )}
                      {hasRecord && canGrvDelete && (
                        <button
                          type="button"
                          className="grv-panel__btn grv-panel__btn--danger"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting…' : 'Delete checklist'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default GrvLotDrawer;
