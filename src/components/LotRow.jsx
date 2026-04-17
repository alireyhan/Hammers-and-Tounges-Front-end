import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getMediaUrl } from '../config/api.config';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { addToFavorite, deleteFavorite } from '../store/actions/buyerActions';
import { toast } from 'react-toastify';
import './LotRow.css';

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatCountdown = ({ days, hours, minutes, seconds }) => {
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

/** Fallback when timer hook is briefly stale after targetDate switches */
const formatMsLeft = (ms) => {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatListingStatusLabel = (raw) => {
  const u = String(raw || '').toUpperCase();
  if (!u) return '—';
  return u.charAt(0) + u.slice(1).toLowerCase();
};

const LotRow = ({
  lot,
  eventStartTime,
  eventEndTime,
  eventTitle,
  eventStatus,
  onOpenDetail,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
  statusOnly = false,
  /** When true, right column shows lot listing status (e.g. Draft) instead of event timer / Live–Closed. */
  showListingStatus = false,
  /** Optional line under location (e.g. "Bid placed …" on My Bids). */
  subCaption = null,
}) => {
  const dispatch = useDispatch();
  const [isUpdating, setIsUpdating] = useState(false);

  const imageMedia = lot.media?.filter((m) => (m.media_type ?? m.mediatype) === 'image') || [];
  const imageUrls = imageMedia.map((m) => getMediaUrl(m.file)).filter(Boolean);
  const displayUrl = imageUrls[0];

  const nestedEvent =
    lot.auction_event && typeof lot.auction_event === 'object'
      ? lot.auction_event
      : lot.event && typeof lot.event === 'object'
        ? lot.event
        : null;

  const startTime =
    lot.start_date ||
    lot.start_time ||
    lot.startdate ||
    eventStartTime ||
    lot.event_start_time ||
    nestedEvent?.start_date ||
    nestedEvent?.start_time;
  const endTime =
    lot.end_date ||
    lot.end_time ||
    lot.enddate ||
    eventEndTime ||
    lot.event_end_time ||
    lot.auction_end_time ||
    nestedEvent?.end_date ||
    nestedEvent?.end_time;
  const now = new Date();
  const startAt = parseDate(startTime);
  const endAt = parseDate(endTime);

  const resolvedEventStatus =
    eventStatus ?? nestedEvent?.status ?? nestedEvent?.event_status ?? lot.event_status;
  const isEventLive =
    String(resolvedEventStatus || '').toUpperCase() === 'LIVE' ||
    String(resolvedEventStatus || '').toUpperCase() === 'ACTIVE';
  const shouldCountToStart = Boolean(startAt && startAt > now && !isEventLive);
  const hasValidEnd = Boolean(endAt && !Number.isNaN(endAt.getTime()));
  const timerTarget = shouldCountToStart
    ? startAt.toISOString()
    : hasValidEnd
      ? endAt.toISOString()
      : startAt && startAt > now
        ? startAt.toISOString()
        : new Date().toISOString();
  const timer = useCountdownTimer(timerTarget);
  const isEnded = Boolean(!shouldCountToStart && endAt && endAt <= now);
  const timeLabel = shouldCountToStart ? 'STARTS IN' : 'TIME LEFT';

  const currentBid = lot.current_price ?? lot.highest_bid ?? lot.initial_price;
  const currency = lot.currency || 'USD';

  const listingStatusRaw = String(lot?.status || lot?.listing_status || '').toUpperCase();

  const timeLeftDisplay = (() => {
    if (showListingStatus) {
      return formatListingStatusLabel(listingStatusRaw);
    }

    if (statusOnly) {
      return isEventLive ? 'Live' : 'Closed';
    }

    if (shouldCountToStart) {
      if (!timer.isFinished) return formatCountdown(timer);
      const toEndMs = hasValidEnd ? endAt.getTime() - Date.now() : NaN;
      if (!Number.isNaN(toEndMs) && toEndMs > 0) return formatMsLeft(toEndMs) ?? formatCountdown(timer);
      return '—';
    }

    if (hasValidEnd && endAt > new Date()) {
      if (!timer.isFinished) return formatCountdown(timer);
      return formatMsLeft(endAt.getTime() - Date.now()) ?? '—';
    }

    if (isEnded) return 'Ended';
    if (isEventLive && !hasValidEnd) return '—';
    return 'Scheduled';
  })();

  const isClosed = showListingStatus
    ? ['CLOSED', 'COMPLETED', 'REJECTED', 'ENDED'].includes(listingStatusRaw)
    : timeLeftDisplay === 'Closed' || timeLeftDisplay === 'Ended';

  const isDraftListing = showListingStatus && listingStatusRaw === 'DRAFT';

  const handleFavoriteClick = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!lot?.id || isUpdating) return;
      setIsUpdating(true);
      const prev = isFavorite;
      try {
        if (isFavorite) {
          await dispatch(deleteFavorite(lot.id)).unwrap();
          toast.success('Removed from favorites');
        } else {
          await dispatch(addToFavorite(lot.id)).unwrap();
          toast.success('Added to favorites');
        }
        onFavoriteToggle?.(lot.id, !isFavorite);
      } catch {
        toast.error('Failed to update favorite');
      } finally {
        setIsUpdating(false);
      }
    },
    [lot?.id, isFavorite, isUpdating, dispatch, onFavoriteToggle]
  );

  return (
    <article
      className="lot-row"
      onClick={() => onOpenDetail?.(lot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.(lot)}
    >
      <div className="lot-row__thumb">
        {displayUrl ? (
          <img src={displayUrl} alt={lot.title} loading="lazy" />
        ) : (
          <div className="lot-row__thumb-placeholder">📷</div>
        )}
      </div>
      <div className="lot-row__info">
        <h3 className="lot-row__title">{lot.title || 'Untitled'}</h3>
        <p className="lot-row__location">
          {lot.location || lot.venue || eventTitle || '—'}
        </p>
        {subCaption ? (
          <p className="lot-row__subcaption">{subCaption}</p>
        ) : null}
        <div className="lot-row__bid">
          <div className="lot-row__bid-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="lot-row__bid-content">
            <span className="lot-row__bid-label">CURRENT BID</span>
            <span className="lot-row__bid-value">
              {currency} {formatPrice(currentBid)}
            </span>
          </div>
        </div>
      </div>
      <div className="lot-row__right">
        {showFavorite && (
          <button
            type="button"
            className="lot-row__star"
            onClick={handleFavoriteClick}
            disabled={isUpdating}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="lot-row__heart-icon">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.18 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lot-row__heart-icon">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}
        <div className="lot-row__time">
          {(showListingStatus || !statusOnly) && (
            <span className="lot-row__time-label">{showListingStatus ? 'Lot status' : timeLabel}</span>
          )}
          <span
            className={`lot-row__time-value ${isClosed ? 'ended' : ''} ${isDraftListing ? 'lot-row__time-value--draft' : ''}`}
          >
            {timeLeftDisplay}
          </span>
        </div>
      </div>
    </article>
  );
};

export default LotRow;
