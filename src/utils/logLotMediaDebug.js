/**
 * Debug: log lot payload and media so we can verify the API returns images.
 * Filter DevTools console by: [HT LotDetail]
 */
export function logLotMediaFromApi(tag, lot) {
  if (lot == null || typeof lot !== 'object') {
    console.log('[HT LotDetail]', tag, { lot, note: 'no lot object' });
    return;
  }
  const raw = lot.media;
  const arr = Array.isArray(raw) ? raw : [];
  const images = arr.filter(
    (m) => (m?.media_type || m?.mediatype || '').toLowerCase() === 'image'
  );
  console.log('[HT LotDetail]', tag, {
    lotId: lot.id,
    lotNumber: lot.lot_number,
    title: lot.title,
    mediaArrayLength: arr.length,
    imageMediaCount: images.length,
    media: raw,
  });
}
