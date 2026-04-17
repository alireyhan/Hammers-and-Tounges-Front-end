import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../pages/BuyerProfile.css";
import "./InsufficientBalanceBidModal.css";

/**
 * Shown when a buyer cannot place a bid due to balance, or when wallet could not be loaded.
 * `insufficient`: known balance < bid. `wallet_unavailable`: GET wallet failed — still offer Add Balance.
 */
export default function InsufficientBalanceBidModal({
  open,
  onClose,
  walletSummary,
  formatWalletCurrency,
  onAddBalance,
  variant = "insufficient"
}) {
  const primaryRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => primaryRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const isWalletUnavailable = variant === "wallet_unavailable";
  const dash = "—";
  const fmt = (v) =>
    isWalletUnavailable ? dash : formatWalletCurrency(v ?? 0);

  return createPortal(
    <div
      className="buyer-payment-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="buyer-payment-modal buyer-payment-modal--fail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-balance-bid-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="buyer-payment-modal__dismiss"
          aria-label="Close"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div
          className="buyer-payment-modal__icon buyer-payment-modal__icon--fail"
          aria-hidden
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          id="insufficient-balance-bid-modal-title"
          className="buyer-payment-modal__title"
        >
          {isWalletUnavailable ? "Wallet unavailable" : "Insufficient Balance"}
        </h2>
        <p className="buyer-payment-modal__message">
          {isWalletUnavailable
            ? "We couldn't load your wallet balance right now."
            : "You have insufficient balance to place this bid."}
        </p>
        <p className="buyer-payment-modal__message insufficient-balance-bid-modal__message-follow">
          {isWalletUnavailable
            ? "Add funds to your account to continue bidding. You can also try again in a moment."
            : "Please add funds to your account to continue bidding."}
        </p>

        <div className="insufficient-balance-bid-modal__card">
          <div className="insufficient-balance-bid-modal__row">
            <span className="insufficient-balance-bid-modal__label">
              Available Balance
            </span>
            <span className="insufficient-balance-bid-modal__value">
              {fmt(walletSummary?.availableBalance)}
            </span>
          </div>
          <div className="insufficient-balance-bid-modal__row">
            <span className="insufficient-balance-bid-modal__label">
              Locked Amount
            </span>
            <span className="insufficient-balance-bid-modal__value">
              {fmt(walletSummary?.lockedBalance)}
            </span>
          </div>
          <div className="insufficient-balance-bid-modal__row">
            <span className="insufficient-balance-bid-modal__label">
              Bidding Power
            </span>
            <span className="insufficient-balance-bid-modal__value">
              {fmt(walletSummary?.biddingPower)}
            </span>
          </div>
        </div>

        <div className="insufficient-balance-bid-modal__actions">
          <button
            ref={primaryRef}
            type="button"
            className="buyer-payment-modal__primary buyer-payment-modal__primary--success"
            onClick={onAddBalance}
          >
            Add Balance
          </button>
          <button
            type="button"
            className="insufficient-balance-bid-modal__close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
