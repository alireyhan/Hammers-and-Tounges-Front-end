const randomLetters = (len = 3) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

export const generateEventId = () => {
  const now = new Date();
  const tsMs = BigInt(now.getTime()); // 13-digit ms timestamp
  const tzMin = BigInt(-now.getTimezoneOffset()); // minutes from UTC (e.g. +180)

  // Mix timestamp + timezone into a stable 10-digit number.
  // Note: still client-generated; backend should treat as unique identifier.
  const mixed = (tsMs * 1000n + (tzMin + 720n)) * 97n;
  const num = mixed % 10000000000n; // 10 digits
  const digits = num.toString().padStart(10, '0');
  const prefix = randomLetters(3);
  return `${prefix}-${digits}`;
};

