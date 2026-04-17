import { getMediaUrl } from '../config/api.config';

const IMAGE_EXT_RE = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|svg|webp)(?:[?#].*)?$/i;
const NON_IMAGE_EXT_RE = /\.(avi|csv|doc|docx|mov|mp3|mp4|pdf|ppt|pptx|txt|wav|xls|xlsx|zip)(?:[?#].*)?$/i;

const normalizeType = (media) =>
  String(media?.media_type ?? media?.mediatype ?? media?.type ?? '')
    .trim()
    .toLowerCase();

const getRawFilePath = (media) => {
  const raw = media?.file ?? media?.url ?? media?.path ?? '';
  return typeof raw === 'string' ? raw.trim() : '';
};

const isLikelyImageMedia = (media) => {
  const type = normalizeType(media);
  const filePath = getRawFilePath(media);

  if (type.includes('image') || type.includes('photo')) return true;
  if (IMAGE_EXT_RE.test(filePath)) return true;
  if (!type && filePath && !NON_IMAGE_EXT_RE.test(filePath)) return true;

  return false;
};

export const getLotImageUrls = (lotOrMedia) => {
  const media = Array.isArray(lotOrMedia) ? lotOrMedia : lotOrMedia?.media;
  if (!Array.isArray(media) || media.length === 0) return [];

  // Keep one entry per media row (do not dedupe by URL — two uploads can normalize to the same path in edge cases).
  return media
    .filter(isLikelyImageMedia)
    .map((m) => getMediaUrl(m?.file ?? m?.url ?? m?.path))
    .filter(Boolean);
};
