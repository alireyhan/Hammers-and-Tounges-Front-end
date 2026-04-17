export const maskBidderName = (value) => {
  const name = String(value ?? '').trim();
  if (!name) return 'Bidder';

  if (name.length <= 2) return `${name[0]}*`;
  if (name.length === 3) return `${name[0]}*${name[2]}`;

  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
};
