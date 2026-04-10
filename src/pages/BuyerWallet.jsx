import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { profileService } from "../services/interceptors/profile.service";
import "./BuyerProfile.css";
import "./BuyerWallet.css";

function listFromPaymentsHistoryPayload(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.transactions)) return raw.transactions;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.history)) return raw.history;
  if (Array.isArray(raw.payments)) return raw.payments;
  if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.results)) {
    return raw.data.results;
  }
  return [];
}

function pickPaymentRow(item, index) {
  if (!item || typeof item !== "object") return null;
  const amount =
    item.amount ??
    item.value ??
    item.total ??
    item.payment_amount ??
    item.paid_amount;
  const amtNum = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : null;
  const tt = String(item.transaction_type ?? item.type ?? "").toUpperCase();
  const isWithdrawal =
    tt.includes("LOCK") ||
    tt.includes("WITHDRAW") ||
    tt.includes("DEBIT") ||
    tt.includes("BID") ||
    (amtNum != null && amtNum < 0);
  const status = (
    item.status ??
    item.state ??
    item.payment_status ??
    item.transaction_type ??
    ""
  ).toString();
  const created =
    item.created_at ??
    item.created ??
    item.date ??
    item.timestamp ??
    item.updated_at;
  const title =
    item.transaction_type_display ??
    item.description ??
    item.type ??
    item.payment_type ??
    item.reference ??
    (item.transaction_id != null ? String(item.transaction_id) : null) ??
    (item.id != null ? `Payment #${item.id}` : "Payment");
  return {
    key: String(item.id ?? item.uuid ?? item.reference ?? `row-${index}`),
    title: String(title),
    amount: amtNum != null ? Math.abs(amtNum) : null,
    displayKind: isWithdrawal ? "withdrawal" : "deposit",
    status,
    created,
  };
}

function formatWalletCurrency(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "$0.00";
  return `$${v.toFixed(2)}`;
}

function formatPaymentWhen(isoOrStr) {
  if (isoOrStr == null || isoOrStr === "") return "—";
  const d = new Date(isoOrStr);
  if (Number.isNaN(d.getTime())) return String(isoOrStr);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentStatusClass(status) {
  const s = String(status).toLowerCase();
  if (/(success|completed|paid|complete|confirmed)/i.test(s)) return "wallet-history-status--success";
  if (/(pending|processing|init)/i.test(s)) return "wallet-history-status--pending";
  if (/(fail|error|cancel|declin)/i.test(s)) return "wallet-history-status--failed";
  return "wallet-history-status--neutral";
}

function parsePaymentFromSearch(search) {
  const raw = (search && search.startsWith("?") ? search.slice(1) : search) || "";
  const params = new URLSearchParams(raw);
  let paymentRaw = params.get("payment");

  if (paymentRaw && paymentRaw.includes("?")) {
    paymentRaw = paymentRaw.slice(0, paymentRaw.indexOf("?")).trim();
  }

  const payment = (paymentRaw || "").trim().toLowerCase();
  if (!payment) return { modal: null };

  const successTokens = ["success", "completed", "complete", "paid", "succeeded", "ok"];
  const cancelTokens = ["cancelled", "canceled", "cancel"];
  const failTokens = ["failed", "fail", "error", "declined", "rejected"];

  if (successTokens.includes(payment)) return { modal: "success" };
  if (cancelTokens.includes(payment)) return { modal: "cancelled" };
  if (failTokens.includes(payment)) return { modal: "fail" };

  return { modal: null };
}

const BuyerWallet = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [wallet, setWallet] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);
  const [paymentHistoryError, setPaymentHistoryError] = useState(null);
  /** Shown after payment redirect: success | fail | cancelled */
  const [paymentResultModal, setPaymentResultModal] = useState(null);
  const paymentModalPrimaryRef = useRef(null);

  const loadWalletAndHistory = useCallback(async () => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError(null);
    try {
      const walletResp = await profileService.getWallet();
      setWallet(walletResp);
      const rows = listFromPaymentsHistoryPayload(walletResp)
        .map((item, i) => pickPaymentRow(item, i))
        .filter(Boolean);
      setPaymentHistory(rows);
    } catch (err) {
      setWallet(null);
      setPaymentHistory([]);
      setPaymentHistoryError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not load wallet."
      );
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletAndHistory();
  }, [loadWalletAndHistory]);

  useEffect(() => {
    const { modal } = parsePaymentFromSearch(location.search);
    if (!modal) return undefined;

    setPaymentResultModal(modal);
    loadWalletAndHistory();

    // remove query params after we’ve consumed them (prevents modal from re-appearing)
    navigate(location.pathname, { replace: true });
    return undefined;
  }, [location.search, location.pathname, navigate, loadWalletAndHistory]);

  const closePaymentModal = useCallback(() => {
    setPaymentResultModal(null);
  }, []);

  useEffect(() => {
    if (!paymentResultModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePaymentModal();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      paymentModalPrimaryRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [paymentResultModal, closePaymentModal]);

  const paymentModalCopy = useMemo(() => {
    if (paymentResultModal === "success") {
      return {
        title: "Payment successful",
        message: "Your funds are on the way. Wallet balances usually update within a few moments.",
        variant: "success",
      };
    }
    if (paymentResultModal === "cancelled") {
      return {
        title: "Payment cancelled",
        message: "You left checkout before completing payment. You have not been charged.",
        variant: "fail",
      };
    }
    if (paymentResultModal === "fail") {
      return {
        title: "Payment failed",
        message:
          "We could not complete this payment. Check your payment method and try again, or contact support if the issue continues.",
        variant: "fail",
      };
    }
    return null;
  }, [paymentResultModal]);

  const paymentModalPortal =
    paymentModalCopy && typeof document !== "undefined"
      ? createPortal(
          <div className="buyer-payment-modal-overlay" role="presentation" onClick={closePaymentModal}>
            <div
              className={`buyer-payment-modal buyer-payment-modal--${paymentModalCopy.variant}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="buyer-payment-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="buyer-payment-modal__dismiss"
                aria-label="Close"
                onClick={closePaymentModal}
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
                className={`buyer-payment-modal__icon buyer-payment-modal__icon--${paymentModalCopy.variant}`}
                aria-hidden
              >
                {paymentModalCopy.variant === "success" ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              <h2 id="buyer-payment-modal-title" className="buyer-payment-modal__title">
                {paymentModalCopy.title}
              </h2>
              <p className="buyer-payment-modal__message">{paymentModalCopy.message}</p>

              <div className="buyer-payment-modal__actions">
                <button
                  ref={paymentModalPrimaryRef}
                  type="button"
                  className={`buyer-payment-modal__primary buyer-payment-modal__primary--${paymentModalCopy.variant}`}
                  onClick={closePaymentModal}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const available = wallet?.available_balance ?? 0;
  const locked = wallet?.locked_balance ?? 0;
  const biddingPower = wallet?.bidding_power ?? null;

  return (
    <>
      <div className="wallet-page">
        <div className="wallet-content">
          <div className="wallet-container">
            <nav className="breadcrumbs">
              <Link to="/buyer/dashboard">Live Auction</Link>
              <span>/</span>
              <span>Wallet</span>
            </nav>

            <div className="page-header">
              <h1 className="page-title">Wallet</h1>
            </div>

            <div className="wallet-grid">
              <div className="wallet-left-column">
                <div className="balance-card available-balance-card">
                  <div className="balance-label">Available Balance</div>
                  <div className="balance-amount">{formatWalletCurrency(available)}</div>
                  <button className="deposit-button" onClick={() => navigate("/buyer/add-balance")}>
                    <div className="deposit-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    Add Balance
                  </button>
                </div>

                <div className="balance-card reserved-card">
                  <div className="reserved-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Locked Balance</span>
                  </div>
                  <div className="reserved-amount">{formatWalletCurrency(locked)}</div>
                  <p className="reserved-description">
                    This amount is temporarily held for active bids and will be released when applicable.
                  </p>
                </div>

                {biddingPower != null && (
                  <div className="balance-card reserved-card">
                    <div className="reserved-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Bidding Power</span>
                    </div>
                    <div className="reserved-amount">{formatWalletCurrency(biddingPower)}</div>
                    <p className="reserved-description">Total limit you can use for bidding.</p>
                  </div>
                )}
              </div>

              <div className="wallet-right-column">
                <div className="transactions-card">
                  <div className="transactions-header">
                    <h2 className="transactions-title">Payment History</h2>
                  </div>

                  {paymentHistoryLoading && (
                    <div className="transactions-list">
                      <div className="transaction-item">Loading history…</div>
                    </div>
                  )}

                  {!paymentHistoryLoading && paymentHistoryError && (
                    <div className="transactions-list">
                      <div className="transaction-item">{paymentHistoryError}</div>
                    </div>
                  )}

                  {!paymentHistoryLoading && !paymentHistoryError && paymentHistory.length === 0 && (
                    <div className="transactions-list">
                      <div className="transaction-item">No payments yet.</div>
                    </div>
                  )}

                  {!paymentHistoryLoading && !paymentHistoryError && paymentHistory.length > 0 && (
                    <div className="transactions-list">
                      {paymentHistory.map((row) => {
                        const type = row.displayKind ?? (row.amount != null && row.amount >= 0 ? "deposit" : "withdrawal");
                        return (
                          <div key={row.key} className="transaction-item">
                            <div className="transaction-icon-wrapper">
                              <div
                                className={`transaction-icon ${
                                  type === "deposit" ? "deposit-icon-bg" : "withdrawal-icon-bg"
                                }`}
                              >
                                {type === "deposit" ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                      d="M12 5V19M5 12H19"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                      d="M5 12H19"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="transaction-details">
                              <div className="transaction-description">
                                {row.title}{" "}
                                {row.status ? (
                                  <span className={`wallet-history-status ${paymentStatusClass(row.status)}`}>
                                    {row.status}
                                  </span>
                                ) : null}
                              </div>
                              <div className="transaction-date">{formatPaymentWhen(row.created)}</div>
                            </div>
                            <div
                              className={`transaction-amount ${
                                type === "deposit" ? "deposit-amount" : "withdrawal-amount"
                              }`}
                            >
                              {row.amount != null ? (
                                <>
                                  {type === "deposit" ? "+" : "-"}
                                  {formatWalletCurrency(Math.abs(row.amount))}
                                </>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {paymentModalPortal}
    </>
  );
};

export default BuyerWallet;