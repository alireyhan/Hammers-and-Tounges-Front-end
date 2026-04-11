import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { buyerService } from '../services/interceptors/buyer.service';
import {
  getAutoBidSaveErrorMessage,
  getAutoBidStopErrorMessage,
} from '../utils/autoBidErrorMessage';

/**
 * Auto-bid state + API for a single lot. Does not poll bid history — parent surfaces run their own
 * 3s interval (e.g. BuyerAuctionDetails, BuyerLotAutoBidPanel). `enabled` gates auto-bid fetch/UI only.
 */
export function useBuyerLotAutoBid({
  lotId,
  enabled,
  floorAmount,
  formatCurrency,
  onRefreshBids,
}) {
  const [autoBidRecord, setAutoBidRecord] = useState(null);
  const [autoBidLoading, setAutoBidLoading] = useState(false);
  const [autobidToggleOn, setAutobidToggleOn] = useState(false);
  const [autobidMaxInput, setAutobidMaxInput] = useState('');
  const [autobidSaving, setAutobidSaving] = useState(false);

  const refreshRef = useRef(onRefreshBids);
  refreshRef.current = onRefreshBids;

  const refreshAutoBidForLot = useCallback(
    async (targetLotId) => {
      if (!enabled || !targetLotId) {
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
          return Number(lid) === Number(targetLotId);
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
    [enabled]
  );

  useEffect(() => {
    if (!enabled || !lotId) {
      setAutoBidRecord(null);
      setAutobidToggleOn(false);
      setAutobidMaxInput('');
      return;
    }
    refreshAutoBidForLot(lotId);
  }, [enabled, lotId, refreshAutoBidForLot]);

  const handleAutobidToggle = useCallback(
    async (nextOn) => {
      if (!lotId) return;
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
            toast.error(getAutoBidStopErrorMessage(err));
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
    [lotId, autoBidRecord]
  );

  const handleSaveAutobid = useCallback(async () => {
    if (!lotId) return;
    const amt = parseFloat(String(autobidMaxInput).replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid max amount');
      return;
    }
    const floor = Number(floorAmount);
    if (!Number.isNaN(floor) && amt <= floor) {
      toast.error(`Max amount must be greater than ${formatCurrency(floor)}.`);
      return;
    }
    setAutobidSaving(true);
    try {
      if (autoBidRecord?.id) {
        await buyerService.updateAutoBid(lotId, amt);
        toast.success('Auto-bid updated');
      } else {
        await buyerService.createAutoBid({ lotId, maxAmount: amt });
        toast.success('Auto-bid started');
      }
      await refreshAutoBidForLot(lotId);
      try {
        refreshRef.current?.();
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(getAutoBidSaveErrorMessage(err));
    } finally {
      setAutobidSaving(false);
    }
  }, [
    lotId,
    autobidMaxInput,
    autoBidRecord?.id,
    floorAmount,
    formatCurrency,
    refreshAutoBidForLot,
  ]);

  return {
    autoBidRecord,
    autoBidLoading,
    autobidToggleOn,
    autobidMaxInput,
    setAutobidMaxInput,
    autobidSaving,
    handleAutobidToggle,
    handleSaveAutobid,
    refreshAutoBidForLot,
  };
}
