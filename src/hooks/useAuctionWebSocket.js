import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { API_CONFIG } from '../config/api.config';
import { setAuctionBidsFromWebSocket } from '../store/slices/buyerSlice';
import { buyerService } from '../services/interceptors/buyer.service';

/**
 * WebSocket hook for live auction bidding.
 * Connects to ws://host/ws/auction/event/<event_id>/
 * Listens for bid updates and refreshes bid data for the current lot.
 */
export function useAuctionWebSocket(eventId, lotId, onBidUpdate) {
  const wsRef = useRef(null);
  const lotIdRef = useRef(lotId);
  const dispatch = useDispatch();

  lotIdRef.current = lotId;

  const handleBidMessage = useCallback(
    async (payload, currentLotId) => {
      if (!payload) {
        // eslint-disable-next-line no-console
        console.log("[Auction WS] handleBidMessage: empty payload, skip refresh");
        return;
      }
      const bidLotId = payload.lot_id ?? payload.lot ?? payload.item_id;
      if (currentLotId && bidLotId && Number(bidLotId) !== Number(currentLotId)) {
        // eslint-disable-next-line no-console
        console.log("[Auction WS] message targets different lot, skipping", {
          bidLotId,
          currentLotId,
        });
        return;
      }
      try {
        const bids = await buyerService.getLotBids(currentLotId);
        // eslint-disable-next-line no-console
        console.log("[Auction WS] refreshed bids after WS message", {
          lotId: currentLotId,
          count: Array.isArray(bids) ? bids.length : 0,
        });
        dispatch(setAuctionBidsFromWebSocket(bids));
        onBidUpdate?.(bids);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[Auction WS] getLotBids failed after message", err?.message || err);
      }
    },
    [dispatch, onBidUpdate]
  );

  useEffect(() => {
    if (!eventId || !lotId) {
      // eslint-disable-next-line no-console
      console.log("[Auction WS] skip connect (missing eventId or lotId)", { eventId, lotId });
      return;
    }

    const base = API_CONFIG.WEB_SOCKET_URL || "wss://developer.hashverx.com";
    const url = `${base}/ws/auction/event/${eventId}/`;
    // eslint-disable-next-line no-console
    console.log("[Auction WS] connecting", { url, eventId, lotId });
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.log("[Auction WS] open", { url });
    };

    ws.onerror = (ev) => {
      // eslint-disable-next-line no-console
      console.warn("[Auction WS] error", ev);
    };

    ws.onclose = (ev) => {
      // eslint-disable-next-line no-console
      console.log("[Auction WS] close", { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
    };

    ws.onmessage = (event) => {
      // eslint-disable-next-line no-console
      console.log("[Auction WS] raw message", event.data);
      try {
        const data = JSON.parse(event.data);
        const type = data?.type ?? data?.message_type;
        const payload = data?.payload ?? data?.data ?? data ?? {};
        // eslint-disable-next-line no-console
        console.log("[Auction WS] parsed", { type, payload, keys: data && typeof data === "object" ? Object.keys(data) : [] });

        const isBidLike =
          !type ||
          type === "bid" ||
          type === "new_bid" ||
          type === "bid_placed" ||
          type === "BID";

        if (isBidLike) {
          handleBidMessage(payload, lotIdRef.current);
        } else {
          // eslint-disable-next-line no-console
          console.log("[Auction WS] ignored (not handled as bid)", { type, data });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[Auction WS] parse error", e?.message, "raw:", event.data);
      }
    };

    return () => {
      // eslint-disable-next-line no-console
      console.log("[Auction WS] cleanup close");
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [eventId, lotId, handleBidMessage]);
}
