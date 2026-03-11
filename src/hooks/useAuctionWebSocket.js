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
      if (!payload) return;
      const bidLotId = payload.lot_id ?? payload.lot ?? payload.item_id;
      if (currentLotId && bidLotId && Number(bidLotId) !== Number(currentLotId)) return;
      try {
        const bids = await buyerService.getLotBids(currentLotId);
        dispatch(setAuctionBidsFromWebSocket(bids));
        onBidUpdate?.(bids);
      } catch {
        // Silently ignore refresh errors
      }
    },
    [dispatch, onBidUpdate]
  );

  useEffect(() => {
    if (!eventId || !lotId) return;

    const base = API_CONFIG.WEB_SOCKET_URL || 'ws://207.180.233.44:8001';
    const url = `${base}/ws/auction/event/${eventId}/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data?.type ?? data?.message_type;
        const payload = data?.payload ?? data?.data ?? data ?? {};
        if (type === 'bid' || type === 'new_bid' || type === 'bid_placed' || !type) {
          handleBidMessage(payload, lotIdRef.current);
        }
      } catch {
        // Ignore non-JSON or invalid messages
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [eventId, lotId, handleBidMessage]);
}
