export function normalizeManualDepositsList(data) {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  return []
}

export function formatDepositDateTime(iso) {
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

export function depositStatusBadgeClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'APPROVED') {
    return 'finance-action-badge finance-md-status finance-md-status--approved'
  }
  if (s === 'REJECTED') {
    return 'finance-action-badge finance-md-status finance-md-status--rejected'
  }
  return 'finance-action-badge finance-md-status finance-md-status--pending'
}
