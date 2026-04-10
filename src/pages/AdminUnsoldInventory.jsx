import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { adminService } from '../services/interceptors/admin.service'
import './AdminFinance.css'
import './AdminUnsoldInventory.css'

const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const parseErrorMessage = (err) => {
  const d = err?.response?.data
  if (typeof d === 'string') return d
  if (d?.detail) return Array.isArray(d.detail) ? d.detail.map((x) => x?.msg || x).join(' ') : String(d.detail)
  if (d?.message) return String(d.message)
  if (err?.message) return err.message
  return 'Something went wrong. Please try again.'
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const XYLineChart = ({ title, points, valueFormatter }) => {
  const width = 520
  const height = 220
  const margin = { top: 20, right: 16, bottom: 44, left: 52 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maxValue = points.reduce((max, p) => Math.max(max, Number(p.value) || 0), 0) || 1
  const yTicks = 4

  const getX = (idx) => {
    if (points.length <= 1) return margin.left + plotWidth / 2
    return margin.left + (idx / (points.length - 1)) * plotWidth
  }
  const getY = (value) => margin.top + plotHeight - ((Number(value) || 0) / maxValue) * plotHeight
  const polyline = points.map((p, idx) => `${getX(idx)},${getY(p.value)}`).join(' ')

  return (
    <section className="unsold-inventory-section" aria-label={title}>
      <div className="finance-section-header">
        <h2 className="finance-section-title">{title}</h2>
      </div>
      <div className="unsold-inventory-chart">
        <svg className="unsold-inventory-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} className="unsold-inventory-axis" />
          <line x1={margin.left} y1={margin.top + plotHeight} x2={margin.left + plotWidth} y2={margin.top + plotHeight} className="unsold-inventory-axis" />

          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const tickValue = (maxValue / yTicks) * i
            const y = getY(tickValue)
            return (
              <g key={`tick-${i}`}>
                <line x1={margin.left} y1={y} x2={margin.left + plotWidth} y2={y} className="unsold-inventory-grid-line" />
                <text x={margin.left - 8} y={y + 4} textAnchor="end" className="unsold-inventory-tick-label">
                  {valueFormatter ? valueFormatter(tickValue) : Math.round(tickValue)}
                </text>
              </g>
            )
          })}

          {points.length > 0 && <polyline points={polyline} fill="none" className="unsold-inventory-line" />}

          {points.map((p, idx) => {
            const x = getX(idx)
            const y = getY(p.value)
            return (
              <g key={`${p.label}-${idx}`}>
                <circle cx={x} cy={y} r="4.5" className="unsold-inventory-point" />
                <text x={x} y={margin.top + plotHeight + 24} textAnchor="middle" className="unsold-inventory-x-label">
                  {p.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

const AdminUnsoldInventory = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeller, setSelectedSeller] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState('all')

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await adminService.getAgingDashboard()
      setData(res)
    } catch (e) {
      setError(parseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const resetFilters = useCallback(() => {
    setSelectedCategory('all')
    setSelectedSeller('all')
    setSelectedEvent('all')
    setError(null)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const breakdowns = data?.breakdowns || {}
  const byCategory = Array.isArray(breakdowns.by_category) ? breakdowns.by_category : []
  const bySeller = Array.isArray(breakdowns.by_seller) ? breakdowns.by_seller : []
  const byEvent = Array.isArray(breakdowns.by_event) ? breakdowns.by_event : []
  const ageFromKnownKey = Array.isArray(breakdowns.by_age_bracket) ? breakdowns.by_age_bracket : []
  const ageFromUnknownKey = Object.values(breakdowns).find(
    (entry) => Array.isArray(entry) && entry.some((item) => item && typeof item === 'object' && 'bracket' in item)
  ) || []
  const byAge = ageFromKnownKey.length ? ageFromKnownKey : ageFromUnknownKey
  const lots = Array.isArray(data?.lots) ? data.lots : []

  const categoryOptions = useMemo(() => {
    const map = new Map()
    lots.forEach((lot) => {
      if (lot?.category_name) map.set(lot.category_name, lot.category_name)
    })
    if (map.size === 0) {
      byCategory.forEach((item) => {
        const name = item.category__name || ''
        if (name) map.set(name, name)
      })
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [lots, byCategory])

  const sellerOptions = useMemo(() => {
    const map = new Map()
    lots.forEach((lot) => {
      const value = String(lot?.seller ?? lot?.seller_name ?? '').trim()
      const label = lot?.seller_name || `Seller #${value}`
      if (value) map.set(value, label)
    })
    if (map.size === 0) {
      bySeller.forEach((item) => {
        const email = item.seller__email || ''
        if (email) map.set(email, email)
      })
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [lots, bySeller])

  const eventOptions = useMemo(() => {
    const map = new Map()
    lots.forEach((lot) => {
      const value = String(lot?.auction_event ?? lot?.event_title ?? '').trim()
      const label = lot?.event_title || `Event #${value}`
      if (value) map.set(value, label)
    })
    if (map.size === 0) {
      byEvent.forEach((item) => {
        const title = item.auction_event__title || ''
        if (title) map.set(title, title)
      })
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [lots, byEvent])

  const filteredLots = useMemo(
    () =>
      lots.filter((lot) => {
        const categoryOk =
          selectedCategory === 'all' || (lot?.category_name || '') === selectedCategory
        const sellerOk =
          selectedSeller === 'all' || String(lot?.seller ?? '') === selectedSeller
        const eventOk =
          selectedEvent === 'all' || String(lot?.auction_event ?? '') === selectedEvent
        return categoryOk && sellerOk && eventOk
      }),
    [lots, selectedCategory, selectedSeller, selectedEvent]
  )

  return (
    <div className="finance-dashboard unsold-inventory-dashboard">
      <main className="finance-main">
        <div className="finance-container">
          <header className="finance-header unsold-inventory-header">
            <div className="finance-header-content">
              <h1 className="finance-title">Unsold Inventory</h1>
              <p className="finance-subtitle">
                Long-stay aging overview: total value held in unsold lots and breakdowns by category, seller, event, and age.
              </p>
            </div>
            <div className="finance-header-actions">
              <button
                type="button"
                className="finance-primary-btn finance-primary-btn--compact"
                onClick={resetFilters}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset filters
              </button>
            </div>
          </header>

          {error && (
            <div className="unsold-inventory-error" role="alert">
              {error}
            </div>
          )}

          {loading && !data && (
            <div className="unsold-inventory-loading" aria-busy="true" aria-live="polite">
              <div className="unsold-inventory-loading-spinner" />
              <p>Loading aging dashboard…</p>
            </div>
          )}

          {data && (
            <>
              <div className="unsold-inventory-chart-row">
                <XYLineChart
                  title="By age bracket (total value)"
                  points={byAge.map((row) => ({
                    label: row?.bracket || 'Unknown',
                    value: Number(row?.total_value) || 0,
                  }))}
                  valueFormatter={(v) => `$${Math.round(v)}`}
                />

                <XYLineChart
                  title="By age bracket (lots count)"
                  points={byAge.map((row) => ({
                    label: row?.bracket || 'Unknown',
                    value: Number(row?.count) || 0,
                  }))}
                  valueFormatter={(v) => `${Math.round(v)}`}
                />
              </div>

              <section className="unsold-inventory-section" aria-labelledby="unsold-lot-filters-heading">
                <div className="finance-section-header">
                  <h2 className="finance-section-title" id="unsold-lot-filters-heading">
                    Lot filters
                  </h2>
                </div>
                <div className="unsold-inventory-filters">
                  <label className="unsold-inventory-filter-item">
                    <span>Category</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All categories</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value || option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="unsold-inventory-filter-item">
                    <span>Seller</span>
                    <select value={selectedSeller} onChange={(e) => setSelectedSeller(e.target.value)}>
                      <option value="all">All sellers</option>
                      {sellerOptions.map((option) => (
                        <option key={option.value || option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="unsold-inventory-filter-item">
                    <span>Event</span>
                    <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                      <option value="all">All events</option>
                      {eventOptions.map((option) => (
                        <option key={option.value || option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="unsold-inventory-section" aria-labelledby="unsold-lots-heading">
                <div className="finance-section-header">
                  <h2 className="finance-section-title" id="unsold-lots-heading">
                    Lots ({filteredLots.length})
                  </h2>
                </div>
                <div className="finance-table-container">
                  <div className="finance-table-wrapper unsold-inventory-lots-scroll">
                    <table className="finance-table unsold-inventory-table unsold-inventory-lots-table">
                      <thead>
                        <tr>
                          <th>Lot #</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Seller</th>
                          <th>Event</th>
                          <th>Age (days)</th>
                          <th>Initial price</th>
                          <th>Status</th>
                          <th>Live date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLots.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="unsold-inventory-empty-cell">
                              No lots found for selected filters.
                            </td>
                          </tr>
                        ) : (
                          filteredLots.map((lot) => (
                            <tr key={lot.id || lot.lot_number} className="finance-table-row">
                              <td>{lot.lot_number || lot.id || '—'}</td>
                              <td>{lot.title || '—'}</td>
                              <td>{lot.category_name || '—'}</td>
                              <td>{lot.seller_name || '—'}</td>
                              <td>{lot.event_title || '—'}</td>
                              <td>{lot.system_age_days ?? '—'}</td>
                              <td>{formatMoney(lot.initial_price)}</td>
                              <td>{lot.status || '—'}</td>
                              <td>{formatDateTime(lot.live_date)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminUnsoldInventory
