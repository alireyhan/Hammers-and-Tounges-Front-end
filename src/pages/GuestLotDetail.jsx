import React from 'react';
import { useLocation } from 'react-router-dom';
import LotDetailReadOnly from '../components/LotDetailReadOnly';

/**
 * Guest-facing lot detail page. Uses LotDetailReadOnly which displays full
 * item details without any bid options—guests can view everything but cannot bid.
 */
const GuestLotDetail = () => {
  const location = useLocation();
  const { backPath, eventId } = location.state || {};

  // Resolve back path: explicit backPath, or event page, or home
  const resolvedBackPath = backPath || (eventId ? `/event/${eventId}` : '/');

  return <LotDetailReadOnly backPath={resolvedBackPath} />;
};

export default GuestLotDetail;
