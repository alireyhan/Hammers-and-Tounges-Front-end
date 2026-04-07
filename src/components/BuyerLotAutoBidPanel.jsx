import React, { useEffect } from 'react';
import { useBuyerLotAutoBid } from '../hooks/useBuyerLotAutoBid';

/**
 * Buyer-only: auto-bid UI + polling. Mount only when `isBuyer` (parent), so guest/staff/seller
 * flows never run auto-bid hooks or API calls.
 */
export default function BuyerLotAutoBidPanel({
  lotId,
  floorAmount,
  formatCurrency,
  onRefreshBids,
  /** Increment after a successful manual bid to resync auto-bid state */
  syncTick = 0,
}) {
  const {
    autoBidRecord,
    autoBidLoading,
    autobidToggleOn,
    autobidMaxInput,
    setAutobidMaxInput,
    autobidSaving,
    handleAutobidToggle,
    handleSaveAutobid,
    refreshAutoBidForLot,
  } = useBuyerLotAutoBid({
    lotId,
    enabled: Boolean(lotId),
    floorAmount,
    formatCurrency,
    onRefreshBids,
  });

  useEffect(() => {
    if (!syncTick || !lotId) return;
    void refreshAutoBidForLot(lotId);
  }, [syncTick, lotId, refreshAutoBidForLot]);

  return (
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
  );
}
