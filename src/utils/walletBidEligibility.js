/**
 * Whether the buyer wallet can cover a bid using available balance plus bidding power.
 * Some users have $0 available but positive bidding power and must still be allowed to bid.
 */
export function canWalletCoverBidAmount(walletSummary, amount) {
  const bid = Number(amount);
  if (!Number.isFinite(bid) || bid <= 0) return true;
  const available = Number(walletSummary?.availableBalance ?? 0);
  const power = Number(walletSummary?.biddingPower ?? 0);
  return available + power >= bid;
}
