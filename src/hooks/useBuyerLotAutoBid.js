import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { buyerService } from '../services/interceptors/buyer.service';

const POLL_MS = 3000;

/**
 * Auto-bid state + API for a single lot. Polls bid history every POLL_MS while auto-bid is active
 * for this lot and ceiling_reached is false (via onRefreshBids).
 * Intended for buyer-only surfaces: mount only when the current user is a buyer (see BuyerLotAutoBidPanel).
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

  useEffect(() => {
    if (!enabled || !lotId || !autoBidRecord?.id) return undefined;
    const lid = autoBidRecord.lot?.id ?? autoBidRecord.lot;
    if (Number(lid) !== Number(lotId)) return undefined;
    if (autoBidRecord.ceiling_reached === true) return undefined;

    const poll = () => {
      try {
        const fn = refreshRef.current;
        if (typeof fn === 'function') fn();
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [enabled, lotId, autoBidRecord?.id, autoBidRecord?.lot, autoBidRecord?.ceiling_reached]);

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
            toast.error(
              err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                'Could not stop auto-bid'
            );
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
      toast.error(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not save auto-bid'
      );
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
