import React, { useState } from 'react'
import './SellerAnalytics.css'

const SellerAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30d')

    const analyticsData = {
        overview: {
            totalRevenue: 125000,
            totalSales: 67,
            averagePrice: 1865.67,
            conversionRate: 12.5,
            activeListings: 12,
            visitorCount: 5360
        },
        revenueData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: [8500, 9200, 10500, 9800, 11200, 12500, 11800, 13200, 14500, 13800, 15200, 16500]
        },
        topCategories: [
            { name: 'Furniture', sales: 28, revenue: 65200, percentage: 52 },
            { name: 'Home Decor', sales: 18, revenue: 28400, percentage: 23 },
            { name: 'Lighting', sales: 12, revenue: 18600, percentage: 15 },
            { name: 'Art', sales: 9, revenue: 12800, percentage: 10 }
        ],
        topItems: [
            { name: 'Vintage Tiffany Lamp', views: 245, bids: 12, soldPrice: 1250 },
            { name: 'Persian Silk Carpet', views: 321, bids: 15, soldPrice: 3200 },
            { name: 'Mid-century Modern Sofa', views: 189, bids: 8, soldPrice: 2200 },
            { name: 'Victorian Writing Desk', views: 178, bids: 9, soldPrice: 1800 },
            { name: 'Antique Bronze Clock', views: 132, bids: 6, soldPrice: 450 }
        ],
        monthlyComparison: {
            currentMonth: {
                revenue: 16500,
                sales: 12,
                views: 2450,
                bids: 145
            },
            previousMonth: {
                revenue: 15200,
                sales: 11,
                views: 2310,
                bids: 132
            }
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const calculateGrowth = (current, previous) => {
        if (previous === 0) return 100
        return ((current - previous) / previous * 100).toFixed(1)
    }

    const getGrowthColor = (value) => {
        return value >= 0 ? '#39AE47' : '#EF4444'
    }

    const renderRevenueChart = () => {
        const maxValue = Math.max(...analyticsData.revenueData.data)

        return (
            <div className="chart-container">
                <div className="chart-bars">
                    {analyticsData.revenueData.data.map((value, index) => {
                        const height = (value / maxValue) * 100

                        return (
                            <div key={index} className="chart-bar-container">
                                <div className="chart-bar-wrapper">
                                    <div
                                        className="chart-bar"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                                <span className="chart-label">{analyticsData.revenueData.labels[index]}</span>
                                <div className="chart-tooltip">
                                    {formatCurrency(value)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderCategoryChart = () => {
        return (
            <div className="categories-chart">
                {analyticsData.topCategories.map((category, index) => (
                    <div key={category.name} className="category-item">
                        <div className="category-header">
                            <span className="category-name">{category.name}</span>
                            <span className="category-percentage">{category.percentage}%</span>
                        </div>
                        <div className="category-bar">
                            <div
                                className="category-fill"
                                style={{
                                    width: `${category.percentage}%`,
                                    backgroundColor: index === 0 ? '#3B82F6' :
                                        index === 1 ? '#39AE47' :
                                            index === 2 ? '#FFC107' : '#8B5CF6'
                                }}
                            ></div>
                        </div>
                        <div className="category-stats">
                            <span className="category-stat">{category.sales} sales</span>
                            <span className="category-stat">{formatCurrency(category.revenue)}</span>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="seller-page">
            <main className="seller-main">
                <div className="page-container">
                    <div className="page-header">
                        <div className="page-title-section">
                            <h1 className="page-title">Analytics Dashboard</h1>
                            <p className="page-subtitle">Track your performance and optimize your sales strategy</p>
                        </div>
                        <div className="welcome-actions">
                            <select
                                className="filter-select"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                                <option value="all">All time</option>
                            </select>
                            {/* <button className="action-button primary-button primary">Request Payout</button> */}
                        </div>
                    </div>

                    <div className="charts-section">
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Monthly Revenue</h3>
                                <span className="chart-subtitle">Last 12 months</span>
                            </div>
                            <div className="chart-content">
                                {renderRevenueChart()}
                            </div>
                            <div className="chart-footer">
                                <div className="chart-stat">
                                    <span className="stat-label">Current Month</span>
                                    <span className="stat-value">{formatCurrency(analyticsData.monthlyComparison.currentMonth.revenue)}</span>
                                </div>
                                <div className="chart-stat">
                                    <span className="stat-label">Previous Month</span>
                                    <span className="stat-value">{formatCurrency(analyticsData.monthlyComparison.previousMonth.revenue)}</span>
                                </div>
                                <div className="chart-stat">
                                    <span className="stat-label">Growth</span>
                                    <span className="stat-value" style={{ color: getGrowthColor(calculateGrowth(analyticsData.monthlyComparison.currentMonth.revenue, analyticsData.monthlyComparison.previousMonth.revenue)) }}>
                                        {calculateGrowth(analyticsData.monthlyComparison.currentMonth.revenue, analyticsData.monthlyComparison.previousMonth.revenue)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Sales by Category</h3>
                                <span className="chart-subtitle">Revenue distribution</span>
                            </div>
                            <div className="chart-content">
                                {renderCategoryChart()}
                            </div>
                            <div className="chart-footer">
                                <div className="chart-legend">
                                    {analyticsData.topCategories.map((category, index) => (
                                        <div key={category.name} className="legend-item">
                                            <div
                                                className="legend-color"
                                                style={{
                                                    backgroundColor: index === 0 ? '#3B82F6' :
                                                        index === 1 ? '#39AE47' :
                                                            index === 2 ? '#FFC107' : '#8B5CF6'
                                                }}
                                            ></div>
                                            <span className="legend-label">{category.name}</span>
                                            <span className="legend-value">{category.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="top-items-section">
                        <h2 className="section-title">Top Performing Items</h2>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Views</th>
                                        <th>Bids</th>
                                        <th>Sold Price</th>
                                        <th>Performance</th>
                                        <th>Conversion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.topItems.map((item, index) => {
                                        const conversionRate = (item.bids / item.views * 100).toFixed(1)
                                        const performance = (item.bids * 100 / analyticsData.topItems.reduce((sum, i) => sum + i.bids, 0)).toFixed(1)

                                        return (
                                            <tr key={item.name}>
                                                <td>
                                                    <div className="item-cell">
                                                        <span className="item-rank">{index + 1}</span>
                                                        <span className="item-name">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="views-cell">{item.views.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="bids-cell">{item.bids}</span>
                                                </td>
                                                <td>
                                                    <span className="price-cell">{formatCurrency(item.soldPrice)}</span>
                                                </td>
                                                <td>
                                                    <div className="performance-cell">
                                                        <div className="performance-bar">
                                                            <div
                                                                className="performance-fill"
                                                                style={{ width: `${performance}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="performance-value">{performance}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`conversion-cell ${parseFloat(conversionRate) > 5 ? 'high' : parseFloat(conversionRate) > 2 ? 'medium' : 'low'}`}>
                                                        {conversionRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="insights-section">
                        <h2 className="section-title">Performance Insights</h2>
                        <div className="insights-grid">
                            <div className="insight-card">
                                <h3 className="insight-title">Best Time to List</h3>
                                <div className="insight-content">
                                    <div className="insight-stat">
                                        <span className="stat-label">Peak Bidding Time</span>
                                        <span className="stat-value">7-9 PM EST</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Highest Conversion Day</span>
                                        <span className="stat-value">Sunday</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Recommended Duration</span>
                                        <span className="stat-value">7 days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="insight-card">
                                <h3 className="insight-title">Pricing Strategy</h3>
                                <div className="insight-content">
                                    <div className="insight-stat">
                                        <span className="stat-label">Average Starting Price</span>
                                        <span className="stat-value">{formatCurrency(425)}</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Average Sale Price</span>
                                        <span className="stat-value">{formatCurrency(1865)}</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Price Premium</span>
                                        <span className="stat-value" style={{ color: '#39AE47' }}>+338%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="insight-card">
                                <h3 className="insight-title">Buyer Behavior</h3>
                                <div className="insight-content">
                                    <div className="insight-stat">
                                        <span className="stat-label">Average Bids per Item</span>
                                        <span className="stat-value">8.5</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Bid Increment Pattern</span>
                                        <span className="stat-value">+12.5% avg</span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="stat-label">Last-Minute Bids</span>
                                        <span className="stat-value">68% of sales</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default SellerAnalytics