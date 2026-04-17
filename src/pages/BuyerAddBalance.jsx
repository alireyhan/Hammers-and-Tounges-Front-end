import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMediaUrl } from "../config/api.config";
import { profileService } from "../services/interceptors/profile.service";
import "./BuyerAddBalance.css";

const TABS = [
  { id: "bank", label: "Online Deposit" },
  { id: "manual", label: "Cash Deposit" },
];

function formatManualDate(iso) {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function manualStatusClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "buyer-manual-status buyer-manual-status--approved";
  if (s === "REJECTED") return "buyer-manual-status buyer-manual-status--rejected";
  return "buyer-manual-status buyer-manual-status--pending";
}

function isLikelyImageProof(pathOrUrl) {
  const s = String(pathOrUrl || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(s);
}

function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  const n = String(file.name || "");
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n);
}

const BuyerAddBalance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bank");

  const [amount, setAmount] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const quickAmounts = [25, 50, 100, 250];

  const [manualList, setManualList] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualFormMode, setManualFormMode] = useState(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualReference, setManualReference] = useState("");
  const [manualFile, setManualFile] = useState(null);
  const [manualProofPreviewUrl, setManualProofPreviewUrl] = useState(null);
  const [manualFileKey, setManualFileKey] = useState(0);
  const [resubmitDepositId, setResubmitDepositId] = useState(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const loadManualList = useCallback(async () => {
    setManualLoading(true);
    try {
      const rows = await profileService.getManualDeposits();
      const sorted = [...rows].sort((a, b) => {
        const ta = new Date(a?.created_at || 0).getTime();
        const tb = new Date(b?.created_at || 0).getTime();
        return tb - ta;
      });
      setManualList(sorted);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not load cash deposit requests.";
      toast.error(message);
      setManualList([]);
    } finally {
      setManualLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "manual") {
      loadManualList();
    }
  }, [activeTab, loadManualList]);

  const closeManualForm = useCallback(() => {
    setManualFormMode(null);
    setResubmitDepositId(null);
    setManualAmount("");
    setManualReference("");
    setManualFile(null);
    setManualFileKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!detailItem && !manualFormMode) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (manualFormMode) {
        if (!manualSubmitting) closeManualForm();
      } else if (detailItem) {
        setDetailItem(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailItem, manualFormMode, manualSubmitting, closeManualForm]);

  useEffect(() => {
    if (!manualFile || !isImageFile(manualFile)) {
      setManualProofPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(manualFile);
    setManualProofPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [manualFile]);

  const openNewManualForm = () => {
    setManualFormMode("new");
    setResubmitDepositId(null);
    setManualAmount("");
    setManualReference("");
    setManualFile(null);
    setManualFileKey((k) => k + 1);
  };

  const openResubmitForm = (item) => {
    setManualFormMode("resubmit");
    setResubmitDepositId(item?.id ?? null);
    setManualAmount(item?.amount != null ? String(item.amount) : "");
    setManualReference(item?.reference_number != null ? String(item.reference_number) : "");
    setManualFile(null);
    setManualFileKey((k) => k + 1);
  };

  const handleDeletePending = async (item) => {
    const id = item?.id;
    if (id == null) return;
    const status = String(item?.status || "").toUpperCase();
    if (status !== "PENDING") return;
    const ok = window.confirm("Delete this pending request? This cannot be undone.");
    if (!ok) return;
    try {
      setDeletingId(id);
      await profileService.deleteManualDeposit(id);
      toast.success("Request deleted.");
      if (detailItem?.id === id) setDetailItem(null);
      loadManualList();
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Could not delete this request.";
      toast.error(typeof message === "string" ? message : "Could not delete this request.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!cellNumber.trim()) {
      toast.error("Please enter your cell number");
      return;
    }

    try {
      setSubmitting(true);
      const response = await profileService.deposit({
        amount: parsedAmount,
        cell_number: cellNumber.trim(),
      });
      const redirectUrl =
        response?.redirect_url ||
        response?.redirectUrl ||
        response?.url ||
        response?.data?.redirect_url ||
        response?.data?.redirectUrl ||
        response?.data?.url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      toast.success("Payment initialized successfully");
      navigate("/buyer/wallet");
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to initialize payment. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(manualAmount);
    if (!manualAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!manualFile) {
      toast.error("Please attach proof of payment");
      return;
    }

    try {
      setManualSubmitting(true);
      await profileService.submitManualDeposit({
        amount: parsedAmount,
        proofFile: manualFile,
        ...(manualFormMode === "resubmit"
          ? {
              deposit_id: resubmitDepositId,
              reference_number: manualReference.trim() || undefined,
            }
          : {}),
      });
      toast.success(
        manualFormMode === "resubmit" ? "Resubmitted for review." : "Cash deposit request submitted."
      );
      closeManualForm();
      loadManualList();
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Could not submit cash deposit request.";
      toast.error(typeof message === "string" ? message : "Could not submit cash deposit request.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const subtitle =
    activeTab === "bank"
      ? "Initialize your online deposit with amount and cell number."
      : "Submit your cash deposit proof or track your cash deposit requests.";

  return (
    <div className="buyer-add-balance-page">
      <div className="buyer-add-balance-header">
        <div>
          <h1 className="buyer-add-balance-title">Add Balance</h1>
          <p className="buyer-add-balance-subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="buyer-add-balance-top-back"
          onClick={() => navigate(-1)}
          disabled={submitting || manualSubmitting}
        >
          Back
        </button>
      </div>

      <div className="buyer-add-balance-tabs" role="tablist" aria-label="Deposit method">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`buyer-add-balance-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="buyer-add-balance-layout">
        <section className="buyer-add-balance-card">
          {activeTab === "bank" ? (
            <>
              <h2 className="buyer-add-balance-card-title">Deposit Details</h2>
              <form className="buyer-add-balance-form" onSubmit={handleBankSubmit}>
                <div className="buyer-add-balance-field">
                  <label htmlFor="amount">Amount</label>
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="buyer-add-balance-quick">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      className="buyer-add-balance-quick-btn"
                      onClick={() => setAmount(String(quickAmount))}
                    >
                      ${quickAmount}
                    </button>
                  ))}
                </div>

                <div className="buyer-add-balance-field">
                  <label htmlFor="cellNumber">Cell Number</label>
                  <input
                    id="cellNumber"
                    type="text"
                    placeholder="Enter cell number"
                    value={cellNumber}
                    onChange={(e) => setCellNumber(e.target.value)}
                  />
                </div>

                <div className="buyer-add-balance-actions">
                  <button
                    type="button"
                    className="buyer-add-balance-btn secondary"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="buyer-add-balance-btn primary" disabled={submitting}>
                    {submitting ? "Processing..." : "Add Balance"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="buyer-manual-toolbar">
                <h2 className="buyer-add-balance-card-title buyer-manual-toolbar-title">Cash deposits</h2>
                <button
                  type="button"
                  className="buyer-add-balance-btn primary buyer-manual-new-btn"
                  onClick={openNewManualForm}
                  disabled={manualSubmitting || deletingId != null}
                >
                  New cash deposit
                </button>
              </div>

              {manualLoading ? (
                <p className="buyer-manual-muted">Loading requests…</p>
              ) : manualList.length === 0 ? (
                <p className="buyer-manual-muted">No cash deposit requests yet.</p>
              ) : (
                <ul className="buyer-manual-list">
                  {manualList.map((item) => {
                    const proofUrl = item?.proof_of_payment ? getMediaUrl(item.proof_of_payment) : "";
                    const thumbIsImage = proofUrl && isLikelyImageProof(item.proof_of_payment);
                    const status = String(item?.status || "").toUpperCase();
                    return (
                      <li key={item.id} className="buyer-manual-row">
                        <div className="buyer-manual-row-main">
                          {proofUrl && thumbIsImage ? (
                            <button
                              type="button"
                              className="buyer-manual-thumb-wrap"
                              onClick={() => setDetailItem(item)}
                              aria-label="View proof and details"
                            >
                              <img src={proofUrl} alt="" className="buyer-manual-thumb" />
                            </button>
                          ) : proofUrl ? (
                            <button
                              type="button"
                              className="buyer-manual-thumb-wrap buyer-manual-thumb-wrap--doc"
                              onClick={() => setDetailItem(item)}
                              aria-label="View proof and details"
                            >
                              <span className="buyer-manual-doc-label">PDF / file</span>
                            </button>
                          ) : (
                            <div className="buyer-manual-thumb-placeholder" aria-hidden />
                          )}
                          <div className="buyer-manual-row-text">
                            <div className="buyer-manual-row-top">
                              <span className="buyer-manual-amount">
                                ${Number(item?.amount ?? 0).toFixed(2)}
                              </span>
                              <span className={manualStatusClass(item?.status)}>{status || "—"}</span>
                            </div>
                            <div className="buyer-manual-meta">{formatManualDate(item?.created_at)}</div>
                            {item?.reference_number ? (
                              <div className="buyer-manual-ref">Ref: {item.reference_number}</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="buyer-manual-row-actions">
                          <button
                            type="button"
                            className="buyer-add-balance-btn secondary buyer-manual-row-btn"
                            onClick={() => setDetailItem(item)}
                          >
                            View
                          </button>
                          {status === "REJECTED" ? (
                            <button
                              type="button"
                              className="buyer-add-balance-btn primary buyer-manual-row-btn"
                              onClick={() => openResubmitForm(item)}
                              disabled={manualSubmitting || deletingId != null}
                            >
                              Resubmit
                            </button>
                          ) : null}
                          {status === "PENDING" ? (
                            <button
                              type="button"
                              className="buyer-add-balance-btn buyer-manual-row-btn buyer-manual-row-btn--danger"
                              onClick={() => handleDeletePending(item)}
                              disabled={manualSubmitting || deletingId === item.id}
                            >
                              {deletingId === item.id ? "Deleting…" : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>

        <aside className="buyer-add-balance-info">
          {activeTab === "bank" ? (
            <>
              <h3>Before you continue</h3>
              <ul>
                <li>Enter the cell number.</li>
                <li>Use the exact amount you want to deposit.</li>
                <li>You will be redirected/processed after initialization.</li>
              </ul>
              <div className="buyer-add-balance-highlight">
                Payments are securely initialized through ContiPay.
              </div>
            </>
          ) : (
            <>
              <h3>Cash Deposit</h3>
              <ul>
                <li>
                  Use <strong>New cash deposit</strong> to open the submission form in a dialog (no need to scroll
                  past a long list).
                </li>
                <li>Make your cash deposit and keep the proof (receipt or screenshot) ready to upload.</li>
                <li>Pending requests are reviewed by the team; approved amounts credit your wallet.</li>
                <li>If a request is rejected, you can resubmit with updated proof.</li>
                <li>Pending requests can be deleted if you no longer need them.</li>
              </ul>
              <div className="buyer-add-balance-highlight">
                Only amount and proof are required for a new request. Reference and deposit id are used when
                resubmitting a rejected request.
              </div>
            </>
          )}
        </aside>
      </div>

      {detailItem ? (
        <div
          className="buyer-manual-modal-overlay"
          role="presentation"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="buyer-manual-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-manual-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="buyer-manual-modal-close"
              aria-label="Close"
              onClick={() => setDetailItem(null)}
            >
              ×
            </button>
            <h2 id="buyer-manual-modal-title" className="buyer-manual-modal-title">
              Cash deposit #{detailItem.id}
            </h2>
            <div className="buyer-manual-modal-body">
              <p className="buyer-manual-modal-line">
                <strong>Amount:</strong> ${Number(detailItem.amount ?? 0).toFixed(2)}
              </p>
              <p className="buyer-manual-modal-line">
                <strong>Status:</strong>{" "}
                <span className={manualStatusClass(detailItem.status)}>{detailItem.status}</span>
              </p>
              <p className="buyer-manual-modal-line">
                <strong>Submitted:</strong> {formatManualDate(detailItem.created_at)}
              </p>
              {detailItem.reference_number ? (
                <p className="buyer-manual-modal-line">
                  <strong>Reference:</strong> {detailItem.reference_number}
                </p>
              ) : null}
              {detailItem.rejection_reason ? (
                <p className="buyer-manual-modal-line buyer-manual-modal-reject">
                  <strong>Rejection reason:</strong> {detailItem.rejection_reason}
                </p>
              ) : null}
              {detailItem.reviewed_at ? (
                <p className="buyer-manual-modal-line">
                  <strong>Reviewed:</strong> {formatManualDate(detailItem.reviewed_at)}
                  {detailItem.reviewed_by_name ? ` · ${detailItem.reviewed_by_name}` : ""}
                </p>
              ) : null}
              {detailItem.proof_of_payment ? (
                <div className="buyer-manual-modal-proof">
                  <strong>Proof of payment</strong>
                  <a
                    href={getMediaUrl(detailItem.proof_of_payment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="buyer-manual-modal-proof-link"
                  >
                    Open file
                  </a>
                  {isLikelyImageProof(detailItem.proof_of_payment) ? (
                    <img
                      src={getMediaUrl(detailItem.proof_of_payment)}
                      alt="Proof of payment"
                      className="buyer-manual-modal-img"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="buyer-manual-modal-footer">
              {String(detailItem.status || "").toUpperCase() === "PENDING" ? (
                <button
                  type="button"
                  className="buyer-add-balance-btn buyer-manual-modal-delete"
                  onClick={() => handleDeletePending(detailItem)}
                  disabled={deletingId === detailItem.id}
                >
                  {deletingId === detailItem.id ? "Deleting…" : "Delete request"}
                </button>
              ) : null}
              {String(detailItem.status || "").toUpperCase() === "REJECTED" ? (
                <button
                  type="button"
                  className="buyer-add-balance-btn primary"
                  onClick={() => {
                    openResubmitForm(detailItem);
                    setDetailItem(null);
                  }}
                  disabled={deletingId != null}
                >
                  Resubmit
                </button>
              ) : null}
              <button
                type="button"
                className="buyer-add-balance-btn secondary"
                onClick={() => setDetailItem(null)}
                disabled={deletingId === detailItem.id}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manualFormMode ? (
        <div
          className="buyer-manual-modal-overlay buyer-manual-modal-overlay--form"
          role="presentation"
          onClick={() => {
            if (!manualSubmitting) closeManualForm();
          }}
        >
          <div
            className="buyer-manual-modal buyer-manual-modal--form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-manual-form-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="buyer-manual-modal-close"
              aria-label="Close"
              onClick={closeManualForm}
              disabled={manualSubmitting}
            >
              ×
            </button>
            <form className="buyer-manual-form buyer-manual-form--in-modal" onSubmit={handleManualSubmit}>
              <h2 id="buyer-manual-form-modal-title" className="buyer-manual-modal-title">
                {manualFormMode === "resubmit" ? "Resubmit proof" : "New cash deposit"}
              </h2>
              <p className="buyer-manual-form-hint">
                {manualFormMode === "resubmit"
                  ? "Upload a new proof document. Your previous request was rejected."
                  : "Upload proof after you complete your cash deposit."}
              </p>
              <div className="buyer-add-balance-field">
                <label htmlFor="manualAmount">Amount</label>
                <input
                  id="manualAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  required
                />
              </div>
              {manualFormMode === "resubmit" ? (
                <div className="buyer-add-balance-field">
                  <label htmlFor="manualReference">Reference number (optional)</label>
                  <input
                    id="manualReference"
                    type="text"
                    placeholder="Bank reference"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="buyer-add-balance-field">
                <label htmlFor="manualProof">Proof of payment</label>
                <input
                  key={manualFileKey}
                  id="manualProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setManualFile(e.target.files?.[0] ?? null)}
                  required
                />
                {manualProofPreviewUrl ? (
                  <div className="buyer-manual-proof-preview">
                    <img
                      src={manualProofPreviewUrl}
                      alt="Selected proof preview"
                      className="buyer-manual-proof-preview-img"
                    />
                    <span className="buyer-manual-proof-preview-caption" title={manualFile?.name}>
                      {manualFile?.name}
                    </span>
                  </div>
                ) : manualFile && !isImageFile(manualFile) ? (
                  <p className="buyer-manual-proof-preview-doc" title={manualFile.name}>
                    Selected file: {manualFile.name}
                  </p>
                ) : null}
              </div>
              <div className="buyer-add-balance-actions buyer-manual-form-actions">
                <button
                  type="button"
                  className="buyer-add-balance-btn secondary"
                  onClick={closeManualForm}
                  disabled={manualSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="buyer-add-balance-btn primary" disabled={manualSubmitting}>
                  {manualSubmitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BuyerAddBalance;
