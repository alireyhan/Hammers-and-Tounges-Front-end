import React, { useState, useMemo } from 'react';
import { getMediaUrl } from '../config/api.config';
import './EventListingRow.css';


const CATEGORY_CONFIG = [
  { keywords: ['farm', 'agriculture', 'farming'], color: '#39AE47', label: 'Farming & Agriculture' },
  { keywords: ['goods', 'harare'], color: '#eab308', label: 'Goods' },
  { keywords: ['machinery', 'tools'], color: '#f97316', label: 'Machinery & Tools' },
  { keywords: ['building', 'construction'], color: '#3b82f6', label: 'Building & Construction' },
  { keywords: ['vehicle', 'auto', 'car'], color: '#6366f1', label: 'Vehicles' },
  { keywords: ['estate', 'property', 'real'], color: '#ec4899', label: 'Real Estate' },
];

const getCategoryFromEvent = (event) => {
  const title = (event.title || '').toLowerCase();
  const categoryName = (event.category_name || '').toLowerCase();
  const search = `${title} ${categoryName}`;
  for (const cfg of CATEGORY_CONFIG) {
    if (cfg.keywords.some((k) => search.includes(k))) return cfg;
  }
  return { color: '#39AE47', label: event.category_name || 'Auction' };
};

const getDisplayStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'CLOSING') return 'Closed';
  return status || 'Auction';
};

const formatDateBlock = (isoStr) => {
  if (!isoStr) return { month: '—', day: '—' };
  try {
    const d = new Date(isoStr);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: String(d.getDate()),
    };
  } catch {
    return { month: '—', day: '—' };
  }
};

const EventListingRow = ({ event, onClick, renderActions }) => {
  const [imageError, setImageError] = useState(false);
  const category = useMemo(() => getCategoryFromEvent(event), [event]);

  const getThumbnail = () => {
    if (imageError) return null;
    const media = event.media ?? event.images ?? [];
    const arr = Array.isArray(media) ? media : [];
    const img = arr.find((m) => (m.media_type || m.mediatype) === 'image') || arr[0];
    const raw =
      img?.file ||
      event.image_url ||
      event.thumbnail ||
      (typeof event.image === 'string' ? event.image : null);
    return raw ? getMediaUrl(raw) : null;
  };

  const displayEventId =
    event.event_id ??
    event.event_code ??
    event.code ??
    event.eventId ??
    '';

  const startDate = formatDateBlock(event.start_time);
  const endDate = formatDateBlock(event.end_time);
  const thumbnail = getThumbnail();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <article
      className="event-listing-row"
      onClick={() => onClick?.(event)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div
        className="event-listing-row__thumb"
        style={{ '--category-color': category.color }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="event-listing-row__thumb-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="event-listing-row__thumb-placeholder">No image</div>
        )}
        <div className="event-listing-row__category-badge">
          <CategoryIcon color={category.color} />
          <span>{category.label}</span>
        </div>
      </div>

      <div className="event-listing-row__dates">
        <div className="event-listing-row__date-block event-listing-row__date-block--start">
          <span className="event-listing-row__date-month">{startDate.month}</span>
          <span className="event-listing-row__date-day">{startDate.day}</span>
        </div>
        <div className="event-listing-row__date-block event-listing-row__date-block--end">
          <span className="event-listing-row__date-month">{endDate.month}</span>
          <span className="event-listing-row__date-day">{endDate.day}</span>
        </div>
      </div>

      <div className="event-listing-row__body">
        <h3 className="event-listing-row__title">{event.title || 'Untitled Event'}</h3>
        {displayEventId ? (
          <div className="event-listing-row__meta">
            <span className="event-listing-row__event-id" title="Event ID">
              {displayEventId}
            </span>
          </div>
        ) : null}
        <p className="event-listing-row__desc">
          {event.description || event.event_type || getDisplayStatus(event.status)}
        </p>
      </div>

      <div className="event-listing-row__lots">
        <span className="event-listing-row__lots-badge">
          {event.lots_count ?? 0} lots
        </span>
      </div>
      {renderActions && (
        <div className="event-listing-row__actions" onClick={(e) => e.stopPropagation()}>
          {renderActions(event)}
        </div>
      )}
    </article>
  );
};

const CategoryIcon = ({ color }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className="event-listing-row__category-icon"
    style={{ color }}
  >
    <path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default EventListingRow;
