import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import './SellerDashboard.css'
import { auctionService } from '../services/interceptors/auction.service'
import { getMediaUrl } from '../config/api.config'
import { toast } from 'react-toastify'

const SellerDashboard = () => {
    const { token, user } = useSelector((state) => state.auth)
    const [lots, setLots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchLots = useCallback(async () => {
        if (!token) {
            setLoading(false)
            setLots([])
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await auctionService.getLots({
                page: 1,
                page_size: 50,
            })
            console.log('SellerDashboard API response:', res)
            const raw = res?.results || res || []
            const all = Array.isArray(raw) ? raw : []
            const lots = user?.id != null
                ? all.filter((lot) => Number(lot.seller) === Number(user.id))
                : all
            console.log('Extracted lots:', lots, 'count:', lots.length)
            setLots(lots)
        } catch (err) {
            setError(err?.message || 'Failed to fetch lots')
            toast.error(err?.message || 'Failed to fetch lots')
            setLots([])
        } finally {
            setLoading(false)
        }
    }, [token, user?.id])

    useEffect(() => {
        fetchLots()
    }, [fetchLots])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getLotImage = (lot) => {
        const media = lot?.media?.filter((m) => m.media_type === 'image') || []
        const first = media[0]
        return first ? getMediaUrl(first.file) : null
    }


    return (
        <div className="seller-dashboard-page">
            <header className="seller-dashboard-header">
                <div className="seller-dashboard-header-content">
                    <h1 className="seller-dashboard-title">Seller Dashboard</h1>
                    <p className="seller-dashboard-subtitle">Your dashboard is updated in real-time</p>
                </div>
                {error && (
                    <div className="seller-dashboard-alert" role="alert">
                        <span>{error}</span>
                    </div>
                )}
            </header>

            <main className="seller-dashboard-main">
                <section className="seller-dashboard-card" aria-label="Recent activity">
                    <div className="seller-dashboard-card-header">
                        <h2 className="seller-dashboard-card-title">Recent Activity</h2>
                    </div>
                    <div className="sales-list">
                                {loading ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                                                <path d="M12 6v6l4 2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <p className="empty-state-description">Loading lots...</p>
                                    </div>
                                ) : lots.length > 0 ? (
                                    lots.map((lot) => {
                                        const imgSrc = getLotImage(lot)
                                        const lotStatus = (lot.status || lot.listing_status || '').toUpperCase()
                                        const eventStatus = (lot.event_status || lot.event?.status || '').toUpperCase()
                                        return (
                                            <Link key={lot.id} to={`/seller/lot/${lot.id}`} className="sale-item">
                                                <div className="sale-image">
                                                    {imgSrc ? <img src={imgSrc} alt={lot.title} /> : <span className="sale-image-placeholder">📷</span>}
                                                </div>
                                                <div className="sale-content">
                                                    <div className="sale-header">
                                                        <h4 className="sale-title">LOT #{lot.lot_number || lot.id} – {lot.title || 'Untitled'}</h4>
                                                        <span className="sale-price">{lot.currency || 'USD'} {formatCurrency(lot.initial_price)}</span>
                                                    </div>
                                                    <div className="sale-details">
                                                        <span>{lot.event_title || lot.event?.title || '—'}</span>
                                                        <span>{lot.total_bids ?? 0} bid(s)</span>
                                                    </div>
                                                    <div className="sale-footer">
                                                        <span className={`status-badge sale-status ${lotStatus === 'ACTIVE' ? 'sale-status--active' : ''}`}>
                                                            {lotStatus || eventStatus || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                                <path d="M20.5 7.5L9 15L4 11" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 13V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V9" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="18" cy="6" r="2" />
                                            </svg>
                                        </div>
                                        <h3 className="empty-state-title">No activity yet</h3>
                                        <p className="empty-state-description">Your lots will appear here once you add them.</p>
                                        <span className="empty-state-action" style={{ cursor: 'default' }}>
                                            View lots below
                                        </span>
                                    </div>
                                )}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default SellerDashboard