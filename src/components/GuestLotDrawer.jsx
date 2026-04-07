import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { buyerService } from '../services/interceptors/buyer.service';
import { profileService } from '../services/interceptors/profile.service';
import { getMediaUrl } from '../config/api.config';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { placeBid } from '../store/actions/buyerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { toast } from 'react-toastify';
import './GuestLotDrawer.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSpecificKey = (key) =>
  String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const GuestLotDrawer = ({ lot: initialLot, eventEndTime, eventTitle, eventId, eventStatus, onClose, isBuyer = false, isAdmin = false, isManager = false, isClerk = false, event, onLotUpdated }) => {
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
    loading: false,
  });
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [autoBidRecord, setAutoBidRecord] = useState(null);
  const [autoBidLoading, setAutoBidLoading] = useState(false);
  const [autobidToggleOn, setAutobidToggleOn] = useState(false);
  const [autobidMaxInput, setAutobidMaxInput] = useState('');
  const [autobidSaving, setAutobidSaving] = useState(false);

  const effectiveLot = useMemo(() => lot || initialLot, [lot, initialLot]);
  const eventData = useMemo(
    () => event || { id: eventId, title: eventTitle, status: eventStatus },
    [event, eventId, eventTitle, eventStatus]
  );

  const imageMedia = effectiveLot?.media?.filter((m) => m.media_type === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);
  const displayImage = imageUrls[selectedImage] || imageUrls[0];

  const endTime = lot?.end_date || lot?.end_time || eventEndTime;
  const timerTarget = endTime || new Date(Date.now() + 86400000).toISOString();
  const timer = useCountdownTimer(timerTarget);
  const timerSaysEnded = !endTime || timer.isFinished || (endTime && new Date(endTime) <= new Date());

  // Event status from API is authoritative: when LIVE/ACTIVE, treat as live even if lot end_time suggests otherwise
  const effectiveEventStatus = eventStatus ?? lot?.event_status ?? initialLot?.event_status;
  const isEventLiveFromApi = useMemo(() => {
    const s = (effectiveEventStatus || '').toUpperCase();
    return s === 'LIVE' || s === 'ACTIVE';
  }, [effectiveEventStatus]);
  const isEnded = isEventLiveFromApi ? false : timerSaysEnded;

  const initialPrice = parseFloat(effectiveLot?.initial_price || 0);
  const highestBidAmount = bids?.length
    ? Math.max(initialPrice, ...bids.map((b) => parseFloat(b.amount) || 0))
    : null;
  const currentBid =
    highestBidAmount != null
      ? highestBidAmount
      : (lot?.current_price ?? lot?.highest_bid ?? lot?.initial_price);
  const currency = lot?.currency || effectiveLot?.currency || 'USD';

  const isEventLive = isEventLiveFromApi;
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
    // When we have time left, always show the countdown
    if (!timer.isFinished && endTime && new Date(endTime) > new Date()) {
      const { days, hours, minutes, seconds } = timer;
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      return `${minutes}m ${seconds}s`;
    }
    if (isEventLive && timerSaysEnded) return 'Live';
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

  const loadWalletSummary = useCallback(async () => {
    if (!isBuyer) return;
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

  const refreshAutoBidForLot = useCallback(
    async (lotId) => {
      if (!isBuyer || !lotId) {
        setAutoBidRecord(null);
        setAutobidToggleOn(false);
        setAutobidMaxInput('');
        return null;
      }
      setAutoBidLoading(true);
      try {
        const list = await buyerService.getMyAutoBids();
        const match = list.find((r) => {
          const lid = r.lot?.id ?? r.lot;
          return Number(lid) === Number(lotId);
        });
        if (match) {
          setAutoBidRecord(match);
          setAutobidToggleOn(true);
          setAutobidMaxInput(String(match.max_amount ?? match.maxAmount ?? '').trim());
        } else {
          setAutoBidRecord(null);
          setAutobidToggleOn(false);
          setAutobidMaxInput('');
        }
        return match;
      } catch {
        setAutoBidRecord(null);
        return null;
      } finally {
        setAutoBidLoading(false);
      }
    },
    [isBuyer]
  );

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
        refreshAutoBidForLot(lotId);
      }
    });
  }, [effectiveLot?.id, effectiveBidAmount, isPlacingBid, dispatch, loadWalletSummary, refreshAutoBidForLot]);

  useEffect(() => {
    if (!initialLot?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await auctionService.getLot(initialLot.id);
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

  useEffect(() => {
    if (!isBuyer || !lot?.id) {
      setAutoBidRecord(null);
      setAutobidToggleOn(false);
      setAutobidMaxInput('');
      return;
    }
    refreshAutoBidForLot(lot.id);
  }, [isBuyer, lot?.id, refreshAutoBidForLot]);

  useEffect(() => {
    if (!isBuyer || !lot?.id || !autoBidRecord?.id) return undefined;
    const lid = autoBidRecord.lot?.id ?? autoBidRecord.lot;
    if (Number(lid) !== Number(lot.id)) return undefined;
    if (autoBidRecord.ceiling_reached === true) return undefined;
    const poll = () => {
      buyerService
        .getLotBids(lot.id)
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
          setBids(list);
        })
        .catch(() => {});
    };
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [isBuyer, lot?.id, autoBidRecord?.id, autoBidRecord?.lot, autoBidRecord?.ceiling_reached]);

  const handleAutobidToggle = useCallback(
    async (nextOn) => {
      if (!effectiveLot?.id) return;
      if (!nextOn) {
        if (autoBidRecord?.id) {
          try {
            setAutobidSaving(true);
            await buyerService.deleteAutoBid(autoBidRecord.id);
            toast.success('Auto-bid stopped');
            setAutoBidRecord(null);
            setAutobidToggleOn(false);
            setAutobidMaxInput('');
          } catch (err) {
            toast.error(
              err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                'Could not stop auto-bid'
            );
          } finally {
            setAutobidSaving(false);
          }
        } else {
          setAutobidToggleOn(false);
          setAutobidMaxInput('');
        }
        return;
      }
      setAutobidToggleOn(true);
      if (!autoBidRecord) {
        setAutobidMaxInput('');
      }
    },
    [effectiveLot?.id, autoBidRecord]
  );

  const handleSaveAutobid = useCallback(async () => {
    if (!effectiveLot?.id) return;
    const amt = parseFloat(String(autobidMaxInput).replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid max amount');
      return;
    }
    const latestBidOrStart = highestBidAmount != null ? highestBidAmount : initialPrice;
    if (amt <= latestBidOrStart) {
      toast.error(
        `Max amount must be greater than ${formatCurrency(latestBidOrStart)}.`
      );
      return;
    }
    setAutobidSaving(true);
    try {
      if (autoBidRecord?.id) {
        await buyerService.updateAutoBid(effectiveLot.id, amt);
        toast.success('Auto-bid updated');
      } else {
        await buyerService.createAutoBid({ lotId: effectiveLot.id, maxAmount: amt });
        toast.success('Auto-bid started');
      }
      await refreshAutoBidForLot(effectiveLot.id);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not save auto-bid'
      );
    } finally {
      setAutobidSaving(false);
    }
  }, [effectiveLot?.id, autobidMaxInput, autoBidRecord?.id, refreshAutoBidForLot, highestBidAmount, initialPrice, formatCurrency]);

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
      toast.error(err?.message || err?.response?.data?.detail || 'Failed to set lot active');
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
                    <p className="guest-lot-drawer__wallet-summary-state">Wallet info unavailable.</p>
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
                      <div className="guest-lot-drawer__image-wrap">
                        <img src={displayImage} alt={effectiveLot.title} />
                        {imageUrls.length > 1 && (
                          <div className="guest-lot-drawer__thumbs">
                            {imageUrls.slice(0, 5).map((url, i) => (
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
                      </div>
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
                          {bids.map((bid, i) => (
                            <div key={bid.id ?? i} className="guest-lot-drawer__bid-item">
                              <span>#{i + 1}</span>
                              <span>{bid.bidder_name ?? bid.user_name ?? 'Bidder'}</span>
                              <span className="guest-lot-drawer__bid-amt">
                                {currency} {formatPrice(bid.amount)}
                              </span>
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
                      <span className="guest-lot-drawer__time-label">TIME LEFT</span>
                      <span className={`guest-lot-drawer__time-value ${isEnded ? 'ended' : ''}`}>
                        {formatTimeLeft()}
                      </span>
                    </div>
                    <div className="guest-lot-drawer__bid">
                      <div className="guest-lot-drawer__bid-icon">!</div>
                      <div>
                        <span className="guest-lot-drawer__bid-label">CURRENT BID</span>
                        <span className="guest-lot-drawer__bid-value">
                          {currency} {formatPrice(currentBid)}
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
                          <div className="guest-lot-drawer__autobid">
                            <div className="guest-lot-drawer__autobid-row">
                              <label className="guest-lot-drawer__autobid-toggle">
                                <input
                                  type="checkbox"
                                  className="guest-lot-drawer__autobid-checkbox"
                                  checked={autobidToggleOn}
                                  onChange={(e) => handleAutobidToggle(e.target.checked)}
                                  disabled={autobidSaving || autoBidLoading}
                                />
                                <span className="guest-lot-drawer__autobid-toggle-text">Auto-bid</span>
                              </label>
                              {autoBidLoading ? (
                                <span className="guest-lot-drawer__autobid-loading">Loading…</span>
                              ) : null}
                            </div>
                            {autoBidRecord?.ceiling_reached === true && (
                              <p className="guest-lot-drawer__autobid-ceiling">
                                Auto-bid maximum reached for this lot.
                              </p>
                            )}
                            {autobidToggleOn && (
                              <>
                                <label className="guest-lot-drawer__custom-bid-label" htmlFor="guest-autobid-max">
                                  Max amount (auto-bid)
                                </label>
                                <input
                                  id="guest-autobid-max"
                                  type="number"
                                  className="guest-lot-drawer__bid-input"
                                  min={0}
                                  step="0.01"
                                  placeholder="Enter max amount"
                                  value={autobidMaxInput}
                                  onChange={(e) => setAutobidMaxInput(e.target.value)}
                                  disabled={autobidSaving}
                                />
                                <button
                                  type="button"
                                  className="guest-lot-drawer__autobid-save"
                                  onClick={handleSaveAutobid}
                                  disabled={autobidSaving}
                                >
                                  {autobidSaving
                                    ? 'Saving…'
                                    : autoBidRecord?.id
                                      ? 'Update auto-bid'
                                      : 'Start auto-bid'}
                                </button>
                              </>
                            )}
                          </div>
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
    </>
  );
};

export default GuestLotDrawer;
