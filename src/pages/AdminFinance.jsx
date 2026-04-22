import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getMediaUrl } from '../config/api.config'
import { adminService } from '../services/interceptors/admin.service'
import './AdminFinance.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const TAB_BANK_TRANSFERS = 'bank_transfers'
const TAB_CASH_DEPOSIT = 'cash_deposit'

function normalizeManualDepositsList(data) {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  return []
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(iso)
  }
}

function statusBadgeClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'APPROVED') {
    return 'finance-action-badge finance-md-status finance-md-status--approved'
  }
  if (s === 'REJECTED') {
    return 'finance-action-badge finance-md-status finance-md-status--rejected'
  }
  return 'finance-action-badge finance-md-status finance-md-status--pending'
}

function getUserDisplayName(user) {
  const full =
    user?.full_name ||
    user?.display_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
  return full || user?.email || `User #${user?.id ?? user?.user_id ?? user?.userId ?? 'N/A'}`
}

const AdminFinance = () => {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const financeBase = routeLocation.pathname.startsWith('/manager/') ? '/manager/finance' : '/admin/finance'

  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [activeTab, setActiveTab] = useState(TAB_BANK_TRANSFERS)
  const [items, setItems] = useState([])
  const [depositHistory, setDepositHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isCashDepositModalOpen, setIsCashDepositModalOpen] = useState(false)
  const [buyers, setBuyers] = useState([])
  const [buyersLoading, setBuyersLoading] = useState(false)
  const [buyerQuery, setBuyerQuery] = useState('')
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [cashDepositAmount, setCashDepositAmount] = useState('')
  const [cashDepositSubmitting, setCashDepositSubmitting] = useState(false)

  const loadBankTransfers = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const data = await adminService.getAdminManualDeposits(params)
      setItems(normalizeManualDepositsList(data))
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load bank transfer requests'
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map((e) => e?.message || e).join(' ') : 'Failed to load bank transfer requests'
      toast.error(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const loadCashDepositHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getDepositHistory()
      setDepositHistory(normalizeManualDepositsList(data))
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load cash deposit history'
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map((e) => e?.message || e).join(' ') : 'Failed to load cash deposit history'
      toast.error(msg)
      setDepositHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === TAB_CASH_DEPOSIT) {
      loadCashDepositHistory()
      return
    }
    loadBankTransfers()
  }, [activeTab, loadBankTransfers, loadCashDepositHistory])

  const openReject = (row) => {
    setRejectTarget(row)
    setRejectReason('')
  }

  const closeReject = () => {
    setRejectTarget(null)
    setRejectReason('')
  }

  const closeCashDepositModal = useCallback((force = false) => {
    if (cashDepositSubmitting && !force) return
    setIsCashDepositModalOpen(false)
    setBuyerQuery('')
    setSelectedBuyer(null)
    setCashDepositAmount('')
    setBuyers([])
  }, [cashDepositSubmitting])

  const loadBuyersForCashDeposit = useCallback(async () => {
    setBuyersLoading(true)
    try {
      const pageSize = 100
      let page = 1
      let hasNext = true
      const allBuyers = []

      while (hasNext) {
        const data = await adminService.getUsersList({
          role: 'buyer',
          page,
          page_size: pageSize,
        })
        const chunk = Array.isArray(data?.results) ? data.results : []
        allBuyers.push(...chunk)
        hasNext = !!data?.has_next
        page += 1
      }

      const seen = new Set()
      const uniqueBuyers = allBuyers.filter((u) => {
        const id = String(u?.id ?? u?.user_id ?? u?.userId ?? '')
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
      setBuyers(uniqueBuyers)
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load buyers'
      toast.error(typeof raw === 'string' ? raw : 'Failed to load buyers')
      setBuyers([])
    } finally {
      setBuyersLoading(false)
    }
  }, [])

  const openCashDepositModal = async () => {
    setIsCashDepositModalOpen(true)
    setBuyerQuery('')
    setSelectedBuyer(null)
    setCashDepositAmount('')
    await loadBuyersForCashDeposit()
  }

  const handleApprove = async (row) => {
    const id = row.id
    if (id == null) return
    setActionId(id)
    try {
      await adminService.reviewAdminManualDeposit(id, { decision: 'APPROVED' })
      toast.success('Deposit approved.')
      await loadBankTransfers()
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Approve failed'
      const msg = typeof raw === 'string' ? raw : 'Approve failed'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  const submitReject = async () => {
    if (!rejectTarget?.id) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error('Please enter a rejection reason.')
      return
    }
    setActionId(rejectTarget.id)
    try {
      await adminService.reviewAdminManualDeposit(rejectTarget.id, {
        decision: 'REJECTED',
        rejection_reason: reason,
      })
      toast.success('Deposit rejected.')
      closeReject()
      await loadBankTransfers()
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Reject failed'
      const msg = typeof raw === 'string' ? raw : 'Reject failed'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = useMemo(
    () => items.filter((r) => String(r.status || '').toUpperCase() === 'PENDING').length,
    [items]
  )

  const filteredBuyers = useMemo(() => {
    const q = buyerQuery.trim().toLowerCase()
    if (!q) return buyers
    return buyers.filter((user) => {
      const name = getUserDisplayName(user).toLowerCase()
      const email = String(user?.email || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [buyerQuery, buyers])

  const submitCashDeposit = async () => {
    const buyerId = selectedBuyer?.id ?? selectedBuyer?.user_id ?? selectedBuyer?.userId
    if (buyerId == null) {
      toast.error('Please select a buyer.')
      return
    }
    const amountNum = Number(cashDepositAmount)
    if (!cashDepositAmount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid deposit amount.')
      return
    }

    setCashDepositSubmitting(true)
    try {
      await adminService.addFunds({
        user_id: buyerId,
        amount: amountNum.toFixed(2),
        description: `Offline bank transfer receipt #${Date.now()}`,
      })
      toast.success('Cash deposit added successfully.')
      closeCashDepositModal(true)
      await loadCashDepositHistory()
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to submit cash deposit'
      const msg = typeof raw === 'string' ? raw : 'Failed to submit cash deposit'
      toast.error(msg)
    } finally {
      setCashDepositSubmitting(false)
    }
  }

  useEffect(() => {
    if (!previewUrl && !rejectTarget && !isCashDepositModalOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (previewUrl) setPreviewUrl(null)
      else if (isCashDepositModalOpen) closeCashDepositModal()
      else if (rejectTarget) {
        setRejectTarget(null)
        setRejectReason('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewUrl, rejectTarget, isCashDepositModalOpen, closeCashDepositModal])

  return (
    <div className="finance-dashboard">
      <main className="finance-main">
        <div className="finance-container">
          <header className="finance-header">
            <div className="finance-header-content">
              <h1 className="finance-title">Finance</h1>
              <p className="finance-subtitle">
                Manage bank transfer requests and cash deposit transactions.
              </p>
            </div>
            <div className="finance-header-actions">
              {activeTab === TAB_CASH_DEPOSIT ? (
                <button
                  type="button"
                  className="finance-primary-btn finance-primary-btn--compact finance-primary-btn--cash-deposit"
                  onClick={openCashDepositModal}
                  disabled={cashDepositSubmitting}
                >
                  Cash Deposit
                </button>
              ) : null}
              <button
                type="button"
                className="finance-primary-btn finance-primary-btn--compact"
                onClick={activeTab === TAB_CASH_DEPOSIT ? loadCashDepositHistory : loadBankTransfers}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </header>

          <section className="finance-tabs" aria-label="Finance tabs">
            <button
              type="button"
              className={`finance-tab ${activeTab === TAB_BANK_TRANSFERS ? 'is-active' : ''}`}
              onClick={() => setActiveTab(TAB_BANK_TRANSFERS)}
            >
              Bank transfers
            </button>
            <button
              type="button"
              className={`finance-tab ${activeTab === TAB_CASH_DEPOSIT ? 'is-active' : ''}`}
              onClick={() => setActiveTab(TAB_CASH_DEPOSIT)}
            >
              Cash deposit
            </button>
          </section>

          {activeTab === TAB_BANK_TRANSFERS ? (
          <section className="finance-filters-section-1">
            <div className="finance-filters-container">
              <div className="finance-filter-controls finance-filter-controls--single">
                <div className="finance-filter-group">
                  <label className="finance-filter-label" htmlFor="finance-md-status">
                    Status
                  </label>
                  <div className="finance-filter-select-wrapper">
                    <select
                      id="finance-md-status"
                      className="finance-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value || 'all'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>
          ) : null}

          <section className="finance-logs-section" aria-live="polite">
            <div className="finance-section-header">
              <h2 className="finance-section-title">
                {activeTab === TAB_CASH_DEPOSIT ? 'Cash deposit history' : 'Bank transfer'}
              </h2>
              <span className="finance-results-info">
                {loading
                  ? 'Loading…'
                  : activeTab === TAB_CASH_DEPOSIT
                    ? `${depositHistory.length} transaction${depositHistory.length !== 1 ? 's' : ''}`
                    : `${items.length} request${items.length !== 1 ? 's' : ''}`}
                {activeTab === TAB_BANK_TRANSFERS && statusFilter === 'PENDING' && !loading && pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
                {activeTab === TAB_BANK_TRANSFERS && !loading && items.length > 0 ? ' · Tap a row to open details' : ''}
              </span>
            </div>

            {!loading && (activeTab === TAB_CASH_DEPOSIT ? depositHistory.length === 0 : items.length === 0) ? (
              <div className="finance-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3>
                  {activeTab === TAB_CASH_DEPOSIT ? 'No cash deposit history' : 'No bank transfer requests'}
                </h3>
                <p>{activeTab === TAB_CASH_DEPOSIT ? 'No transactions found.' : 'Nothing matches this filter.'}</p>
              </div>
            ) : (
              <div
                className="finance-table-container finance-md-table-scroll"
                role="region"
                aria-label={activeTab === TAB_CASH_DEPOSIT ? 'Cash deposit history table' : 'Bank transfer table'}
                tabIndex={0}
              >
                <div className="finance-table-wrapper">
                  <table className="finance-table finance-md-table">
                    {activeTab === TAB_BANK_TRANSFERS ? (
                    <thead>
                      <tr>
                        <th>Proof</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Amount</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Review</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    ) : (
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    )}
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={activeTab === TAB_CASH_DEPOSIT ? 6 : 9} className="finance-md-loading-cell">
                            Loading…
                          </td>
                        </tr>
                      ) : activeTab === TAB_CASH_DEPOSIT ? (
                        depositHistory.map((row) => (
                          <tr key={row.id} className="finance-table-row">
                            <td>{row.user_name || '—'}</td>
                            <td>
                              <span className="finance-details-text" title={row.user_email}>
                                {row.user_email || '—'}
                              </span>
                            </td>
                            <td>${parseFloat(row.amount ?? 0).toFixed(2)}</td>
                            <td>{row.transaction_type_display || row.transaction_type || '—'}</td>
                            <td>
                              <span className="finance-details-text" title={row.description}>
                                {row.description || '—'}
                              </span>
                            </td>
                            <td>
                              <span className="finance-date-text">{formatDateTime(row.created_at)}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        items.map((row) => {
                          const proofUrl = getMediaUrl(row.proof_of_payment)
                          const isPending = String(row.status || '').toUpperCase() === 'PENDING'
                          const busy = actionId === row.id
                          return (
                            <tr
                              key={row.id}
                              className="finance-table-row finance-md-row-clickable"
                              onClick={() =>
                                navigate(`${financeBase}/manual-deposits/${row.id}`, {
                                  state: { deposit: row },
                                })
                              }
                            >
                              <td>
                                {proofUrl ? (
                                  <button
                                    type="button"
                                    className="finance-md-proof-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewUrl(proofUrl)
                                    }}
                                    title="View proof full size"
                                  >
                                    <img src={proofUrl} alt="" className="finance-md-proof-thumb" />
                                  </button>
                                ) : (
                                  <span className="finance-md-no-proof">—</span>
                                )}
                              </td>
                              <td>{row.user_name || '—'}</td>
                              <td>
                                <span className="finance-details-text" title={row.user_email}>
                                  {row.user_email || '—'}
                                </span>
                              </td>
                              <td>${parseFloat(row.amount ?? 0).toFixed(2)}</td>
                              <td>{row.reference_number || '—'}</td>
                              <td>
                                <span className={statusBadgeClass(row.status)}>{row.status || '—'}</span>
                              </td>
                              <td>
                                <span className="finance-date-text">{formatDateTime(row.created_at)}</span>
                              </td>
                              <td>
                                <div className="finance-md-review-cell">
                                  <span className="finance-date-text">{row.reviewed_by_name || '—'}</span>
                                  {row.reviewed_at ? (
                                    <span className="finance-md-review-date">{formatDateTime(row.reviewed_at)}</span>
                                  ) : null}
                                  {row.rejection_reason ? (
                                    <span className="finance-md-reject-reason" title={row.rejection_reason}>
                                      {row.rejection_reason}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                {isPending ? (
                                  <div className="finance-md-actions">
                                    <button
                                      type="button"
                                      className="finance-md-btn finance-md-btn--approve"
                                      onClick={() => handleApprove(row)}
                                      disabled={busy}
                                    >
                                      {busy ? '…' : 'Approve'}
                                    </button>
                                    <button
                                      type="button"
                                      className="finance-md-btn finance-md-btn--reject"
                                      onClick={() => openReject(row)}
                                      disabled={busy}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="finance-md-actions-done">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {previewUrl ? (
        <div
          className="finance-md-modal-overlay"
          role="presentation"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="finance-md-modal finance-md-modal--image"
            role="dialog"
            aria-modal="true"
            aria-label="Proof preview"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="finance-md-modal-close"
              onClick={() => setPreviewUrl(null)}
              aria-label="Close"
            >
              ×
            </button>
            <img src={previewUrl} alt="Proof of payment" className="finance-md-modal-img" />
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="finance-md-modal-overlay" role="presentation" onClick={closeReject}>
          <div
            className="finance-md-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-md-reject-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="finance-md-reject-title" className="finance-md-modal-title">
              Reject deposit
            </h2>
            <p className="finance-md-modal-desc">
              {rejectTarget.user_name} · ${parseFloat(rejectTarget.amount ?? 0).toFixed(2)}
            </p>
            <label className="finance-md-label" htmlFor="finance-md-reject-reason">
              Rejection reason (required)
            </label>
            <textarea
              id="finance-md-reject-reason"
              className="finance-md-textarea"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this deposit is rejected…"
            />
            <div className="finance-md-modal-footer">
              <button type="button" className="finance-md-btn finance-md-btn--ghost" onClick={closeReject}>
                Cancel
              </button>
              <button
                type="button"
                className="finance-md-btn finance-md-btn--reject"
                onClick={submitReject}
                disabled={actionId === rejectTarget.id}
              >
                {actionId === rejectTarget.id ? 'Submitting…' : 'Submit rejection'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCashDepositModalOpen && activeTab === TAB_CASH_DEPOSIT ? (
        <div className="finance-md-modal-overlay" role="presentation" onClick={closeCashDepositModal}>
          <div
            className="finance-md-modal finance-md-modal--cash-deposit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-cash-deposit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="finance-md-modal-close"
              onClick={closeCashDepositModal}
              aria-label="Close"
              disabled={cashDepositSubmitting}
            >
              ×
            </button>
            <h2 id="finance-cash-deposit-title" className="finance-md-modal-title">
              Cash Deposit
            </h2>
            <p className="finance-md-modal-desc">Select a buyer and submit a deposit amount.</p>

            <label className="finance-md-label" htmlFor="finance-cash-buyer-search">
              Buyer name
            </label>
            <input
              id="finance-cash-buyer-search"
              type="text"
              className="finance-md-input"
              placeholder="Type buyer name or email"
              value={buyerQuery}
              onChange={(e) => setBuyerQuery(e.target.value)}
              disabled={buyersLoading || cashDepositSubmitting}
            />

            <div className="finance-cash-buyer-list" role="listbox" aria-label="Buyers">
              {buyersLoading ? (
                <p className="finance-cash-buyer-empty">Loading buyers…</p>
              ) : filteredBuyers.length === 0 ? (
                <p className="finance-cash-buyer-empty">No buyers found.</p>
              ) : (
                filteredBuyers.map((user) => {
                  const userId = String(user?.id ?? user?.user_id ?? user?.userId ?? '')
                  const selectedId = String(selectedBuyer?.id ?? selectedBuyer?.user_id ?? selectedBuyer?.userId ?? '')
                  const isSelected = userId !== '' && selectedId === userId
                  return (
                    <button
                      key={userId || `${user?.email || ''}-${getUserDisplayName(user)}`}
                      type="button"
                      className={`finance-cash-buyer-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedBuyer(user)}
                      disabled={cashDepositSubmitting}
                    >
                      <span className="finance-cash-buyer-name">{getUserDisplayName(user)}</span>
                      <span className="finance-cash-buyer-email">{user?.email || '—'}</span>
                    </button>
                  )
                })
              )}
            </div>

            <label className="finance-md-label" htmlFor="finance-cash-amount">
              Deposit amount
            </label>
            <input
              id="finance-cash-amount"
              type="number"
              min="0"
              step="0.01"
              className="finance-md-input"
              placeholder="Enter amount"
              value={cashDepositAmount}
              onChange={(e) => setCashDepositAmount(e.target.value)}
              disabled={!selectedBuyer || cashDepositSubmitting}
            />

            <div className="finance-md-modal-footer">
              <button
                type="button"
                className="finance-md-btn finance-md-btn--ghost"
                onClick={closeCashDepositModal}
                disabled={cashDepositSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="finance-md-btn finance-md-btn--approve"
                onClick={submitCashDeposit}
                disabled={!selectedBuyer || cashDepositSubmitting}
              >
                {cashDepositSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminFinance
