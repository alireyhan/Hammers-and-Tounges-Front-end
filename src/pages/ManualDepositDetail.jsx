import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getMediaUrl } from '../config/api.config'
import { adminService } from '../services/interceptors/admin.service'
import './AdminFinance.css'

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

const ManualDepositDetail = () => {
  const { depositId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const idNum = Number(depositId)

  const listPath = location.pathname.startsWith('/manager/') ? '/manager/finance' : '/admin/finance'

  const stateMatches =
    location.state?.deposit != null && Number(location.state.deposit.id) === idNum

  const [deposit, setDeposit] = useState(() => (stateMatches ? location.state.deposit : null))
  const [loading, setLoading] = useState(!stateMatches)
  const [notFound, setNotFound] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!Number.isFinite(idNum)) {
      setNotFound(true)
      setDeposit(null)
      setLoading(false)
      return undefined
    }

    const fromState = location.state?.deposit
    if (fromState != null && Number(fromState.id) === idNum) {
      setDeposit(fromState)
      setNotFound(false)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const data = await adminService.getAdminManualDeposits({})
        const list = normalizeManualDepositsList(data)
        const found = list.find((r) => Number(r.id) === idNum)
        if (cancelled) return
        if (found) {
          setDeposit(found)
          setNotFound(false)
        } else {
          setDeposit(null)
          setNotFound(true)
        }
      } catch (err) {
        if (cancelled) return
        const raw =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load deposit'
        toast.error(typeof raw === 'string' ? raw : 'Failed to load deposit')
        setDeposit(null)
        setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [idNum, location.state])

  const openReject = (row) => {
    setRejectTarget(row)
    setRejectReason('')
  }

  const closeReject = () => {
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleApprove = async () => {
    if (deposit?.id == null) return
    setActionId(deposit.id)
    try {
      await adminService.reviewAdminManualDeposit(deposit.id, { decision: 'APPROVED' })
      toast.success('Deposit approved.')
      navigate(listPath)
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Approve failed'
      toast.error(typeof raw === 'string' ? raw : 'Approve failed')
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
      navigate(listPath)
    } catch (err) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Reject failed'
      toast.error(typeof raw === 'string' ? raw : 'Reject failed')
    } finally {
      setActionId(null)
    }
  }

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

  const proofUrl = deposit ? getMediaUrl(deposit.proof_of_payment) : ''
  const isPending = deposit && String(deposit.status || '').toUpperCase() === 'PENDING'

  return (
    <div className="finance-dashboard">
      <main className="finance-main">
        <div className="finance-container finance-md-detail-screen">
          <div className="finance-md-detail-toolbar">
            <button
              type="button"
              className="finance-md-btn finance-md-btn--ghost finance-md-detail-back"
              onClick={() => navigate(listPath)}
            >
              ← Back to Finance
            </button>
          </div>

          {loading ? (
            <p className="finance-md-detail-loading">Loading…</p>
          ) : notFound || !deposit ? (
            <div className="finance-empty-state finance-md-detail-missing">
              <h3>Deposit not found</h3>
              <p>This request may have been removed or the link is invalid.</p>
              <button type="button" className="finance-primary-btn finance-primary-btn--compact" onClick={() => navigate(listPath)}>
                Return to Finance
              </button>
            </div>
          ) : (
            <article className="finance-md-detail-card">
              <header className="finance-md-detail-card-header">
                <h1 className="finance-title finance-md-detail-screen-title">Cash deposit</h1>
                <p className="finance-md-detail-id">Request #{deposit.id}</p>
              </header>

              <dl className="finance-md-detail-dl">
                <div className="finance-md-detail-row">
                  <dt>User</dt>
                  <dd>{deposit.user_name || '—'}</dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Email</dt>
                  <dd>
                    {deposit.user_email ? (
                      <a href={`mailto:${deposit.user_email}`} className="finance-md-detail-link">
                        {deposit.user_email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Amount</dt>
                  <dd>${parseFloat(deposit.amount ?? 0).toFixed(2)}</dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Reference</dt>
                  <dd>{deposit.reference_number || '—'}</dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Status</dt>
                  <dd>
                    <span className={statusBadgeClass(deposit.status)}>{deposit.status || '—'}</span>
                  </dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(deposit.created_at)}</dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Reviewed by</dt>
                  <dd>{deposit.reviewed_by_name || '—'}</dd>
                </div>
                <div className="finance-md-detail-row">
                  <dt>Reviewed at</dt>
                  <dd>{formatDateTime(deposit.reviewed_at)}</dd>
                </div>
                {deposit.rejection_reason ? (
                  <div className="finance-md-detail-row finance-md-detail-row--block">
                    <dt>Rejection reason</dt>
                    <dd>{deposit.rejection_reason}</dd>
                  </div>
                ) : null}
              </dl>

              {proofUrl ? (
                <div className="finance-md-detail-proof-wrap">
                  <p className="finance-md-detail-proof-label">Proof of payment</p>
                  <button
                    type="button"
                    className="finance-md-detail-proof-hit"
                    onClick={() => setPreviewUrl(proofUrl)}
                  >
                    <img src={proofUrl} alt="" className="finance-md-detail-proof-img" />
                  </button>
                  <p className="finance-md-detail-proof-hint">Tap image to open full size</p>
                </div>
              ) : (
                <p className="finance-md-detail-no-proof">No proof image uploaded.</p>
              )}

              <footer className="finance-md-detail-actions">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      className="finance-md-btn finance-md-btn--approve"
                      onClick={handleApprove}
                      disabled={actionId === deposit.id}
                    >
                      {actionId === deposit.id ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="finance-md-btn finance-md-btn--reject"
                      onClick={() => openReject(deposit)}
                      disabled={actionId === deposit.id}
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </footer>
            </article>
          )}
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
            <label className="finance-md-label" htmlFor="finance-md-reject-reason-detail">
              Rejection reason (required)
            </label>
            <textarea
              id="finance-md-reject-reason-detail"
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

export default ManualDepositDetail
