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

const AdminFinance = () => {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const financeBase = routeLocation.pathname.startsWith('/manager/') ? '/manager/finance' : '/admin/finance'

  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const load = useCallback(async () => {
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
        'Failed to load cash deposits'
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map((e) => e?.message || e).join(' ') : 'Failed to load cash deposits'
      toast.error(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const openReject = (row) => {
    setRejectTarget(row)
    setRejectReason('')
  }

  const closeReject = () => {
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleApprove = async (row) => {
    const id = row.id
    if (id == null) return
    setActionId(id)
    try {
      await adminService.reviewAdminManualDeposit(id, { decision: 'APPROVED' })
      toast.success('Deposit approved.')
      await load()
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
      await load()
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

  useEffect(() => {
    if (!previewUrl && !rejectTarget) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (previewUrl) setPreviewUrl(null)
      else if (rejectTarget) {
        setRejectTarget(null)
        setRejectReason('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewUrl, rejectTarget])

  return (
    <div className="finance-dashboard">
      <main className="finance-main">
        <div className="finance-container">
          <header className="finance-header">
            <div className="finance-header-content">
              <h1 className="finance-title">Finance</h1>
              <p className="finance-subtitle">
                Review buyer cash deposit requests. Approve or reject pending proofs of payment.
              </p>
            </div>
            <div className="finance-header-actions">
              <button
                type="button"
                className="finance-primary-btn finance-primary-btn--compact"
                onClick={load}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </header>

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

          <section className="finance-logs-section" aria-live="polite">
            <div className="finance-section-header">
              <h2 className="finance-section-title">Cash deposits</h2>
              <span className="finance-results-info">
                {loading ? 'Loading…' : `${items.length} request${items.length !== 1 ? 's' : ''}`}
                {statusFilter === 'PENDING' && !loading && pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
                {!loading && items.length > 0 ? ' · Tap a row to open details' : ''}
              </span>
            </div>

            {!loading && items.length === 0 ? (
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
                <h3>No cash deposits</h3>
                <p>Nothing matches this filter.</p>
              </div>
            ) : (
              <div
                className="finance-table-container finance-md-table-scroll"
                role="region"
                aria-label="Cash deposits table"
                tabIndex={0}
              >
                <div className="finance-table-wrapper">
                  <table className="finance-table finance-md-table">
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
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="finance-md-loading-cell">
                            Loading…
                          </td>
                        </tr>
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
    </div>
  )
}

export default AdminFinance
