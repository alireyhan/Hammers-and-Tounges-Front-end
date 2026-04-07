import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { profileService } from "../services/interceptors/profile.service";
import "./BuyerAddBalance.css";

const BuyerAddBalance = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const quickAmounts = [25, 50, 100, 250];

  const handleSubmit = async (e) => {
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
        cell_number: cellNumber.trim()
      });
      console.log("Deposit init response:", response);
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

  return (
    <div className="buyer-add-balance-page">
      <div className="buyer-add-balance-header">
        <div>
          <h1 className="buyer-add-balance-title">Add Balance</h1>
          <p className="buyer-add-balance-subtitle">
            Initialize your deposit with amount and cell number.
          </p>
        </div>
        <button
          type="button"
          className="buyer-add-balance-top-back"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          Back
        </button>
      </div>

      <div className="buyer-add-balance-layout">
        <section className="buyer-add-balance-card">
          <h2 className="buyer-add-balance-card-title">Deposit Details</h2>
          <form className="buyer-add-balance-form" onSubmit={handleSubmit}>
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
              <button
                type="submit"
                className="buyer-add-balance-btn primary"
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Add Balance"}
              </button>
            </div>
          </form>
        </section>

        <aside className="buyer-add-balance-info">
          <h3>Before you continue</h3>
          <ul>
            <li>Enter the cell number.</li>
            <li>Use the exact amount you want to deposit.</li>
            <li>You will be redirected/processed after initialization.</li>
          </ul>
          <div className="buyer-add-balance-highlight">
            Payments are securely initialized through ContiPay.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BuyerAddBalance;
