import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { buyerService } from '../services/interceptors/buyer.service';
import { profileService } from '../services/interceptors/profile.service';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import BuyerLotAutoBidPanel from './BuyerLotAutoBidPanel';
import { placeBid } from '../store/actions/buyerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { toast } from 'react-toastify';
import InsufficientBalanceBidModal from './InsufficientBalanceBidModal';
import { flattenApiDetail, humanizeErrorDetailString } from '../utils/apiErrorMessage';
import { formatBidDateTime } from '../utils/formatBidDateTime';
import { maskBidderName } from '../utils/maskBidderName';
import { logLotMediaFromApi } from '../utils/logLotMediaDebug';
import { getLotImageUrls } from '../utils/lotMedia';
import { getLotBidDisplay, parseLotAmount, resolveLotEventBounds } from '../utils/lotDisplayUtils';
import { canWalletCoverBidAmount } from '../utils/walletBidEligibility';
import './GuestLotDrawer.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) =>
  String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Shown when activate fails (e.g. backend 500) because GRV is not satisfied. */
const ACTIVATE_REQUIRES_GRV_TOAST =
  'Lot cannot be activated. Please complete GRV first.';

const normalizeApiDetail = (data) => flattenApiDetail(data?.detail);

const shouldTreatActivateErrorAsGrv = (status, err) => {
  if (status === 500) return true;
  const blob = [
    normalizeApiDetail(err?.response?.data),
    humanizeErrorDetailString(err?.response?.data?.message || ''),
    err?.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /grv|goods received|verification required|checklist|sign.?off|must .*verif/i.test(blob);
};

const GuestLotDrawer = ({
  lot: initialLot,
  eventStartTime,
  eventEndTime,
  eventTitle,
  eventId,
  eventStatus,
  onClose,
  isBuyer = false,
  isAdmin = false,
  isManager = false,
  isClerk = false,
  event,
  onLotUpdated,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.buyer?.categories ?? state.seller?.categories ?? []);
  const features = useSelector((state) => state.permissions?.features);
  const manageEventsPerm = features?.manage_events || {};
  const canUpdateEvents = manageEventsPerm?.update === true;
  const canDeleteEvents = manageEventsPerm?.delete === true;
  const isPlacingBid = useSelector((state) => state.buyer?.isPlacingBid ?? false);

  const [lot, setLot] = useState(initialLot);
  const [loading, setLoading] = useState(!initialLot);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [walletSummary, setWalletSummary] = useState({
    availableBalance: null,
    biddingPower: null,
    lockedBalance: null,
    /** true for buyers until first fetch settles — avoids flashing "unavailable" before the request */
    loading: !!isBuyer,
  });
  /** null | 'low_balance' | 'wallet_unavailable' */
  const [insufficientBalanceModalKind, setInsufficientBalanceModalKind] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [autoBidSyncTick, setAutoBidSyncTick] = useState(0);

  const effectiveLot = useMemo(() => lot || initialLot, [lot, initialLot]);
  const eventData = useMemo(
    () => event || { id: eventId, title: eventTitle, status: eventStatus },
    [event, eventId, eventTitle, eventStatus]
  );

  const imageUrls = getLotImageUrls(effectiveLot);
  const displayImage = imageUrls[selectedImage] || imageUrls[0];

  // Event status from API is authoritative: when LIVE/ACTIVE, treat as live even if lot end_time suggests otherwise
  const effectiveEventStatus = eventStatus ?? lot?.event_status ?? initialLot?.event_status;
  const isEventLiveFromApi = useMemo(() => {
    const s = (effectiveEventStatus || '').toUpperCase();
    return s === 'LIVE' || s === 'ACTIVE';
  }, [effectiveEventStatus]);

  const eventStartFromContext =
    eventStartTime ?? event?.start_time ?? event?.start_date ?? eventData?.start_time ?? eventData?.start_date;
  const eventEndFromContext = eventEndTime ?? event?.end_time ?? event?.end_date ?? eventData?.end_time ?? eventData?.end_date;

  const { start: evStartRaw, end: evEndRaw } = useMemo(
    () => resolveLotEventBounds(effectiveLot, eventStartFromContext, eventEndFromContext),
    [effectiveLot, eventStartFromContext, eventEndFromContext]
  );

  const nowMs = Date.now();
  const startAt = evStartRaw ? new Date(evStartRaw) : null;
  const endAt = evEndRaw ? new Date(evEndRaw) : null;
  const startValid = Boolean(startAt && !Number.isNaN(startAt.getTime()));
  const endValid = Boolean(endAt && !Number.isNaN(endAt.getTime()));
  const shouldCountToStart = Boolean(startValid && startAt.getTime() > nowMs && !isEventLiveFromApi);

  /** Recomputed every render so we switch from start → end target when the start time passes. */
  let countdownTargetIso;
  if (shouldCountToStart) countdownTargetIso = startAt.toISOString();
  else if (endValid) countdownTargetIso = endAt.toISOString();
  else if (startValid && startAt.getTime() > nowMs) countdownTargetIso = startAt.toISOString();
  else countdownTargetIso = new Date(nowMs + 86400000).toISOString();

  const timer = useCountdownTimer(countdownTargetIso);
  const timerSaysEnded = (() => {
    if (!evEndRaw && !evStartRaw) return timer.isFinished;
    if (shouldCountToStart) return timer.isFinished && startValid && startAt.getTime() <= Date.now();
    if (endValid) return timer.isFinished || endAt.getTime() <= Date.now();
    return timer.isFinished;
  })();

  const isEnded = isEventLiveFromApi ? false : timerSaysEnded;

  const initialPrice = parseFloat(effectiveLot?.initial_price || 0);
  const highestBidAmount = useMemo(() => {
    if (bids?.length) {
      return Math.max(initialPrice, ...bids.map((b) => parseFloat(b.amount) || 0));
    }
    const hb = parseLotAmount(effectiveLot?.highest_bid);
    if (hb != null && hb > initialPrice) return hb;
    const cp = parseLotAmount(effectiveLot?.current_price);
    if (cp != null && cp > initialPrice) return cp;
    return null;
  }, [bids, effectiveLot, initialPrice]);

  const bidDisplay = useMemo(() => {
    if (bids?.length) {
      const mx = Math.max(initialPrice, ...bids.map((b) => parseFloat(b.amount) || 0));
      return {
        label: 'CURRENT BID',
        value: mx,
        currency: lot?.currency || effectiveLot?.currency || 'USD',
      };
    }
    return getLotBidDisplay(effectiveLot);
  }, [bids, effectiveLot, initialPrice, lot?.currency]);

  const currency = lot?.currency || effectiveLot?.currency || bidDisplay.currency || 'USD';

  const isEventLive = isEventLiveFromApi;

  const timeColumnLabel = shouldCountToStart ? 'STARTS IN' : 'TIME LEFT';
  const specificData = (() => {
    let sd = lot?.specific_data;
    if (typeof sd === 'string') {
      try {
        sd = JSON.parse(sd) || {};
      } catch {
        sd = {};
      }
    }
    return sd || {};
  })();

  const formatTimeLeft = () => {
    if (shouldCountToStart) {
      if (!timer.isFinished && startValid && startAt.getTime() > Date.now()) {
        const { days, hours, minutes, seconds } = timer;
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        return `${minutes}m ${seconds}s`;
      }
      return 'Scheduled';
    }
    if (endValid && endAt.getTime() > Date.now()) {
      if (!timer.isFinished) {
        const { days, hours, minutes, seconds } = timer;
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        return `${minutes}m ${seconds}s`;
      }
    }
    if (isEventLive && (timerSaysEnded || !endValid)) return 'Live';
    if (isEnded) return 'Ended';
    const { days, hours, minutes, seconds } = timer;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const categoryDetail = useMemo(() => {
    const categoryId = effectiveLot?.category ?? effectiveLot?.category_id;
    if (!categoryId) return null;
    const list = Array.isArray(categories) ? categories : categories?.results ?? [];
    if (!list.length) return null;
    const id = Number(categoryId);
    return list.find((c) => c.id === id || Number(c.id) === id) ?? null;
  }, [effectiveLot?.category, effectiveLot?.category_id, categories]);

  const { nextBidAmount, incrementRules, minBid, maxBid } = useMemo(() => {
    const ranges = categoryDetail?.increment_rules?.ranges;
    const current = highestBidAmount != null ? highestBidAmount : initialPrice;

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      return {
        nextBidAmount: current + 1,
        incrementRules: null,
        minBid: current + 1,
        maxBid: current + 1000,
      };
    }

    const sorted = [...ranges].sort((a, b) => (a.up_to ?? 0) - (b.up_to ?? 0));
    let increment = sorted[0]?.increment ?? 1;
    let upTo = sorted[0]?.up_to ?? Infinity;

    for (const r of sorted) {
      if (current < (r.up_to ?? Infinity)) {
        increment = Number(r.increment) || 1;
        upTo = Number(r.up_to) ?? Infinity;
        break;
      }
    }

    const nextRaw = current + increment;
    const nextBid = Math.min(nextRaw, current + upTo);
    const min = nextBid > current ? nextBid : current + increment;
    const maxAdd = upTo < Infinity ? upTo : 20 * increment;
    const max = current + Math.floor(maxAdd / increment) * increment;
    return {
      nextBidAmount: nextBid > current ? nextBid : null,
      incrementRules: { increment, upTo },
      minBid: min,
      maxBid: max,
    };
  }, [initialPrice, highestBidAmount, categoryDetail?.increment_rules?.ranges]);

  const isValidCustomBid = useMemo(() => {
    if (!customBidAmount || customBidAmount.trim() === '') return false;
    const amt = parseFloat(customBidAmount.replace(/[^0-9.-]/g, ''));
    if (isNaN(amt)) return false;
    return amt >= minBid && amt <= maxBid;
  }, [customBidAmount, minBid, maxBid]);

  const effectiveBidAmount = isValidCustomBid
    ? parseFloat(customBidAmount.replace(/[^0-9.-]/g, ''))
    : nextBidAmount;

  const formatCurrency = useCallback(
    (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [currency]
  );
  const formatWalletCurrency = useCallback(
    (amount) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(amount || 0)),
    [currency]
  );

  const refreshLotBidsFromApi = useCallback(() => {
    if (!lot?.id) return Promise.resolve();
    return buyerService.getLotBids(lot.id).then((data) => {
      const list = Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
      setBids(list);
    });
  }, [lot?.id]);

  const loadWalletSummary = useCallback(async () => {
    if (!isBuyer) {
      setWalletSummary({
        availableBalance: null,
        biddingPower: null,
        lockedBalance: null,
        loading: false,
      });
      return;
    }
    setWalletSummary((prev) => ({ ...prev, loading: true }));
    try {
      const wallet = await profileService.getWallet();
      setWalletSummary({
        availableBalance: wallet?.available_balance ?? wallet?.availableBalance ?? 0,
        biddingPower: wallet?.bidding_power ?? wallet?.biddingPower ?? 0,
        lockedBalance: wallet?.locked_balance ?? wallet?.lockedBalance ?? 0,
        loading: false,
      });
    } catch {
      setWalletSummary({
        availableBalance: null,
        biddingPower: null,
        lockedBalance: null,
        loading: false,
      });
    }
  }, [isBuyer]);

  const handleQuickBidAdd = useCallback(
    (addAmount) => {
      if (addAmount === 'max') {
        setCustomBidAmount(String(maxBid));
        return;
      }
      const prev = parseFloat(customBidAmount) || nextBidAmount || minBid;
      const next = Math.min(Math.max(prev + addAmount, minBid), maxBid);
      setCustomBidAmount(String(next));
    },
    [customBidAmount, nextBidAmount, minBid, maxBid]
  );

  const handlePlaceBidSubmit = useCallback(() => {
    const amount = effectiveBidAmount;
    const lotId = effectiveLot?.id;
    if (!lotId || amount == null || isPlacingBid) return;

    if (isBuyer) {
      if (
        !walletSummary.loading &&
        walletSummary.availableBalance != null &&
        !canWalletCoverBidAmount(walletSummary, amount)
      ) {
        setInsufficientBalanceModalKind('low_balance');
        return;
      }
      if (!walletSummary.loading && walletSummary.availableBalance == null) {
        setInsufficientBalanceModalKind('wallet_unavailable');
        return;
      }
    }

    dispatch(
      placeBid({
        lot_id: lotId,
        amount,
      })
    ).then((result) => {
      if (result.type === 'buyer/placeBid/fulfilled') {
        setCustomBidAmount('');
        buyerService.getLotBids(lotId).then((data) => {
          const list = Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
          setBids(list);
        });
        loadWalletSummary();
        if (isBuyer) setAutoBidSyncTick((t) => t + 1);
      }
    });
  }, [
    effectiveLot?.id,
    effectiveBidAmount,
    isPlacingBid,
    dispatch,
    loadWalletSummary,
    isBuyer,
    walletSummary.availableBalance,
    walletSummary.biddingPower,
    walletSummary.loading,
  ]);

  const handleInsufficientModalAddBalance = useCallback(() => {
    setInsufficientBalanceModalKind(null);
    navigate('/buyer/add-balance');
  }, [navigate]);

  useEffect(() => {
    setSelectedImage(0);
  }, [initialLot?.id]);

  useEffect(() => {
    if (!initialLot?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(initialLot.id);
        logLotMediaFromApi('GuestLotDrawer getLot()', data);
        if (!cancelled) setLot(data);
      } catch {
        if (!cancelled) setLot(initialLot);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialLot?.id]);

  useEffect(() => {
    if (!lot?.id) return;
    let cancelled = false;
    setBidsLoading(true);
    buyerService
      .getLotBids(lot.id)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
          setBids(list);
        }
      })
      .catch(() => {
        if (!cancelled) setBids([]);
      })
      .finally(() => {
        if (!cancelled) setBidsLoading(false);
      });
    return () => { cancelled = true; };
  }, [lot?.id]);

  useEffect(() => {
    loadWalletSummary();
  }, [loadWalletSummary, lot?.id]);

  const handleEdit = useCallback(() => {
    onClose?.();
    const path = isAdmin
      ? '/admin/publishnew'
      : isManager
        ? '/manager/publishnew'
        : '/clerk/publishnew';
    navigate(path, {
      state: {
        eventId: eventId || event?.id,
        event: eventData,
        lotId: effectiveLot?.id,
        lot: effectiveLot,
        isEdit: true,
        fromAdmin: isAdmin,
        fromClerk: isClerk,
      },
    });
  }, [navigate, eventId, event, eventData, effectiveLot, isAdmin, isManager, isClerk, onClose]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this lot?')) return;
    setDeleting(true);
    try {
      await auctionService.deleteLot(effectiveLot?.id);
      toast.success('Lot deleted successfully.');
      onClose?.();
      onLotUpdated?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete lot');
    } finally {
      setDeleting(false);
    }
  }, [effectiveLot?.id, onClose, onLotUpdated]);

  const handleSetActive = useCallback(async () => {
    if (!effectiveLot?.id) return;
    setActivating(true);
    try {
      const fullLot = await auctionService.getLot(effectiveLot.id);
      const payload = {
        seller: Number(fullLot.seller ?? fullLot.seller_id ?? fullLot.seller_details?.id ?? 0),
        title: fullLot.title ?? '',
        description: fullLot.description ?? '',
        category: Number(fullLot.category ?? fullLot.category_id ?? 0),
        auction_event: Number(fullLot.auction_event ?? fullLot.event_id ?? eventId ?? event?.id),
        initial_price: String(fullLot.initial_price ?? '0'),
        reserve_price: String(fullLot.reserve_price ?? '0'),
        stc_eligible: Boolean(fullLot.stc_eligible),
        status: 'ACTIVE',
        specific_data: fullLot.specific_data && typeof fullLot.specific_data === 'object' ? fullLot.specific_data : {},
      };
      await auctionService.updateLot(effectiveLot.id, payload);
      toast.success(`Lot #${effectiveLot.lot_number || effectiveLot.id} set to Active`);
      onClose?.();
      onLotUpdated?.();
    } catch (err) {
      const status = err?.response?.status;
      if (shouldTreatActivateErrorAsGrv(status, err)) {
        toast.error(ACTIVATE_REQUIRES_GRV_TOAST);
      } else {
        const detail = normalizeApiDetail(err?.response?.data);
        const msg =
          detail ||
          (typeof err?.response?.data?.message === 'string' ? err.response.data.message : '') ||
          err?.message ||
          'Failed to set lot active';
        toast.error(typeof msg === 'string' ? msg : 'Failed to set lot active');
      }
    } finally {
      setActivating(false);
    }
  }, [effectiveLot, eventId, event?.id, onClose, onLotUpdated]);

  const handleSignIn = () => {
    onClose?.();
    navigate('/signin', { state: { from: window.location.pathname } });
  };

  if (!effectiveLot) return null;

  const isStaffView = isAdmin || isManager || isClerk;
  const lotStatus = (effectiveLot?.status ?? effectiveLot?.listing_status ?? '').toUpperCase();
  const isLotActive = lotStatus === 'ACTIVE';
  const isLotDraft = lotStatus === 'DRAFT';
  const isEventCompleted = ((eventStatus ?? event?.status) || '').toUpperCase() === 'CLOSING' || ((eventStatus ?? event?.status) || '').toUpperCase() === 'CLOSED';
  const canEditDelete = (eventData?.status || '').toUpperCase() === 'SCHEDULED' && !isLotActive;

  return (
    <>
      <div className="guest-lot-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="guest-lot-drawer" role="dialog" aria-modal="true" aria-label="Lot details">
        <div className="guest-lot-drawer__inner">
          <header className="guest-lot-drawer__header">
            <button
              className="guest-lot-drawer__close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h2 className="guest-lot-drawer__lot-no">
              Lot #{effectiveLot.lot_number || effectiveLot.id}
            </h2>
            {(isAdmin || isManager || isClerk) && (
              <div className="guest-lot-drawer__staff-actions">
                {canEditDelete && (
                  <>
                    {/* Admin is unrestricted; managers/clerk follow manage_events.update */}
                    {(isAdmin || canUpdateEvents) && (
                      <button
                        type="button"
                        className="guest-lot-drawer__staff-btn guest-lot-drawer__staff-btn--edit"
                        onClick={handleEdit}
                        aria-label="Edit lot"
                      >
                        Edit
                      </button>
                    )}
                    {/* Admin is unrestricted; managers/clerk follow manage_events.delete */}
                    {(isAdmin || canDeleteEvents) && (
                      <button
                        type="button"
                        className="guest-lot-drawer__staff-btn guest-lot-drawer__staff-btn--delete"
                        onClick={handleDelete}
                        disabled={deleting}
                        aria-label="Delete lot"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </>
                )}
                {/* Activate (draft -> active) should also require update access for managers/clerks */}
                {isLotDraft && !isEventCompleted && (isAdmin || canUpdateEvents) && (
                  <button
                    type="button"
                    className="guest-lot-drawer__staff-btn guest-lot-drawer__staff-btn--active"
                    onClick={handleSetActive}
                    disabled={activating}
                    aria-label="Set lot as active"
                  >
                    {activating ? 'Activating...' : 'Set Active'}
                  </button>
                )}
              </div>
            )}
          </header>

          {loading ? (
            <div className="guest-lot-drawer__loading">
              <div className="guest-lot-drawer__spinner" />
              <p>Loading...</p>
            </div>
          ) : (
            <div className="guest-lot-drawer__scroll">
              {isBuyer && (
                <div className="guest-lot-drawer__wallet-top">
                  <div className="guest-lot-drawer__wallet-top-head">Wallet snapshot</div>
                  {walletSummary.loading ? (
                    <p className="guest-lot-drawer__wallet-summary-state">Loading wallet...</p>
                  ) : walletSummary.availableBalance == null ? (
                    <div className="guest-lot-drawer__wallet-unavailable">
                      <p className="guest-lot-drawer__wallet-summary-state">
                        Wallet info unavailable.
                      </p>
                      <button
                        type="button"
                        className="guest-lot-drawer__wallet-retry"
                        onClick={() => loadWalletSummary()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="guest-lot-drawer__wallet-top-grid">
                      <div className="guest-lot-drawer__wallet-top-item">
                        <span className="guest-lot-drawer__wallet-top-label">Available</span>
                        <span className="guest-lot-drawer__wallet-top-value">
                          {formatWalletCurrency(walletSummary.availableBalance)}
                        </span>
                      </div>
                      <div className="guest-lot-drawer__wallet-top-item">
                        <span className="guest-lot-drawer__wallet-top-label">Bidding power</span>
                        <span className="guest-lot-drawer__wallet-top-value">
                          {formatWalletCurrency(walletSummary.biddingPower)}
                        </span>
                      </div>
                      <div className="guest-lot-drawer__wallet-top-item">
                        <span className="guest-lot-drawer__wallet-top-label">Locked</span>
                        <span className="guest-lot-drawer__wallet-top-value">
                          {formatWalletCurrency(walletSummary.lockedBalance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="guest-lot-drawer__main">
                <div className="guest-lot-drawer__content">
                  <div className="guest-lot-drawer__media">
                    {displayImage ? (
                      <>
                        <div className="guest-lot-drawer__image-wrap">
                          <img src={displayImage} alt={effectiveLot.title} />
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
                      {effectiveLot.location || effectiveLot.venue || eventTitle || '—'}
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

                    <div className="guest-lot-drawer__bid-history">
                      <h4 className="guest-lot-drawer__section-title">Bid History</h4>
                      {bidsLoading ? (
                        <p className="guest-lot-drawer__muted">Loading bid history...</p>
                      ) : bids?.length > 0 ? (
                        <div className="guest-lot-drawer__bid-list">
                          {bids.slice(0, 15).map((bid, i) => (
                            <div key={bid.id ?? i} className="guest-lot-drawer__bid-item">
                              <span>#{i + 1}</span>
                              <span>{maskBidderName(bid.bidder_name ?? bid.user_name ?? 'Bidder')}</span>
                              <span className="guest-lot-drawer__bid-amt">
                                {currency} {formatPrice(bid.amount)}
                              </span>
                              <span>{formatBidDateTime(bid.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="guest-lot-drawer__muted">No bids yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="guest-lot-drawer__sidebar">
                  <div className="guest-lot-drawer__bid-card">
                    <div className="guest-lot-drawer__time">
                      <span className="guest-lot-drawer__time-label">{timeColumnLabel}</span>
                      <span className={`guest-lot-drawer__time-value ${isEnded ? 'ended' : ''}`}>
                        {formatTimeLeft()}
                      </span>
                    </div>
                    <div className="guest-lot-drawer__bid">
                      <div className="guest-lot-drawer__bid-icon">!</div>
                      <div>
                        <span className="guest-lot-drawer__bid-label">{bidDisplay.label}</span>
                        <span className="guest-lot-drawer__bid-value">
                          {currency} {formatPrice(bidDisplay.value)}
                        </span>
                      </div>
                    </div>
                    {isStaffView ? (
                      <div className="guest-lot-drawer__bid-not-available">
                        {(isAdmin || isManager) && canEditDelete ? 'View-only mode. Use Edit to modify this lot.' : 'View-only mode.'}
                      </div>
                    ) : isBuyer ? (
                      isEventLive && !isEnded ? (
                        <div className="guest-lot-drawer__bid-form">
                          <p className="guest-lot-drawer__increment-hint">
                            Min bid: {formatCurrency(minBid)}
                            {incrementRules?.increment != null && (
                              <> · Increment: {formatCurrency(incrementRules.increment)}</>
                            )}
                          </p>
                          <BuyerLotAutoBidPanel
                            lotId={lot?.id}
                            floorAmount={highestBidAmount != null ? highestBidAmount : initialPrice}
                            formatCurrency={formatCurrency}
                            onRefreshBids={refreshLotBidsFromApi}
                            syncTick={autoBidSyncTick}
                          />
                          <div className="guest-lot-drawer__custom-bid-row">
                            <label className="guest-lot-drawer__custom-bid-label">Bid amount</label>
                            <input
                              type="number"
                              className="guest-lot-drawer__bid-input"
                              min={minBid}
                              max={maxBid}
                              step={incrementRules?.increment ?? 1}
                              placeholder={`Min ${formatCurrency(minBid)} – Max ${formatCurrency(maxBid)}`}
                              value={customBidAmount}
                              onChange={(e) => setCustomBidAmount(e.target.value)}
                            />
                          </div>
                          <div className="guest-lot-drawer__quick-bid-buttons">
                            <button
                              type="button"
                              className="guest-lot-drawer__quick-bid-btn"
                              onClick={() => handleQuickBidAdd(incrementRules?.increment ?? 50)}
                            >
                              +{incrementRules?.increment ?? 50}
                            </button>
                            <button
                              type="button"
                              className="guest-lot-drawer__quick-bid-btn"
                              onClick={() => handleQuickBidAdd(100)}
                            >
                              +100
                            </button>
                            <button
                              type="button"
                              className="guest-lot-drawer__quick-bid-btn"
                              onClick={() => handleQuickBidAdd(500)}
                            >
                              +500
                            </button>
                            {maxBid < Infinity && (
                              <button
                                type="button"
                                className="guest-lot-drawer__quick-bid-btn guest-lot-drawer__quick-bid-max"
                                onClick={() => handleQuickBidAdd('max')}
                              >
                                Max
                              </button>
                            )}
                          </div>
                          {customBidAmount && !isValidCustomBid && (
                            <p className="guest-lot-drawer__bid-error">
                              Enter {formatCurrency(minBid)} – {formatCurrency(maxBid)}.
                            </p>
                          )}
                          <button
                            type="button"
                            className="guest-lot-drawer__signin-btn"
                            onClick={handlePlaceBidSubmit}
                            disabled={isPlacingBid || effectiveBidAmount == null}
                          >
                            {isPlacingBid
                              ? 'Placing bid...'
                              : `Place bid ${effectiveBidAmount != null ? formatCurrency(effectiveBidAmount) : ''}`}
                          </button>
                        </div>
                      ) : (
                        <div className="guest-lot-drawer__bid-not-available">
                          {isEnded ? 'Bidding has ended.' : eventStatus ? 'Bidding opens when the event is live.' : 'Bidding is not available.'}
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        className="guest-lot-drawer__signin-btn"
                        onClick={handleSignIn}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        Sign in to place a bid
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </aside>
      <InsufficientBalanceBidModal
        open={insufficientBalanceModalKind != null}
        variant={
          insufficientBalanceModalKind === 'wallet_unavailable'
            ? 'wallet_unavailable'
            : 'insufficient'
        }
        onClose={() => setInsufficientBalanceModalKind(null)}
        walletSummary={walletSummary}
        formatWalletCurrency={formatWalletCurrency}
        onAddBalance={handleInsufficientModalAddBalance}
      />
    </>
  );
};

export default GuestLotDrawer;
