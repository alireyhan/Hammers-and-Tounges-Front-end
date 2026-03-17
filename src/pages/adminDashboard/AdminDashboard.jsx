import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import "./AdminDashboard.css";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsersList } from "../../store/actions/adminActions";
import { adminService } from "../../services/interceptors/admin.service";
import { auctionService } from "../../services/interceptors/auction.service";
import { toast } from "react-toastify";
import { API_CONFIG } from "../../config/api.config";
import EventListingRow from "../../components/EventListingRow";

// Lazy load images for better performance
// const Car1 = lazy(() => import('../../assets/admin-assests/1.png'));
// const Car2 = lazy(() => import('../../assets/admin-assests/2.png'));
// const Car3 = lazy(() => import('../../assets/admin-assests/3.png'));
// const Car4 = lazy(() => import('../../assets/admin-assests/4.png'));

// Separate mock data to reduce bundle size
const mockAuctionsData = {
  count: 4,
  total_pages: 1,
  current_page: 1,
  results: []
};



// Memoized SVG components for better performance
const ProfileIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ReportIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 16v5h5M21 16v5h-5M16 3v5h5M8 3v5H3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 8h5l-5-5v5zM8 8H3l5-5v5zM8 16H3l5 5v-5zM16 16h5l-5 5v-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Optimized StatCard component
const StatCard = React.memo(({ icon: Icon, value, label, colorClass }) => (
  <div
    className="admin-dashboard-stat-card"
    role="article"
    aria-label={`${label}: ${value}`}
  >
    <div className={`admin-dashboard-stat-icon ${colorClass}`}>
      <Icon />
    </div>
    <div className="admin-dashboard-stat-content">
      <div className="admin-dashboard-stat-value" aria-live="polite">
        {value}
      </div>
      <div className="admin-dashboard-stat-label">{label}</div>
    </div>
  </div>
));

// Optimized ActivityItem component
const ActivityItem = React.memo(({ activity }) => (
  <div className="admin-dashboard-activity-item" role="listitem">
    <div className="admin-dashboard-activity-avatar" aria-hidden="true">
      {activity.user.charAt(0)}
    </div>
    <div className="admin-dashboard-activity-content">
      <div className="admin-dashboard-activity-text">
        <span className="admin-dashboard-activity-user">{activity.user}</span>{" "}
        {activity.action}
        {activity.amount && (
          <span className="admin-dashboard-activity-amount">
            {" "}
            {activity.amount}
          </span>
        )}
        {activity.auction && (
          <span className="admin-dashboard-activity-auction">
            {" "}
            "{activity.auction}"
          </span>
        )}
      </div>
      <div className="admin-dashboard-activity-time">{activity.time}</div>
    </div>
  </div>
));

const formatEventDate = (isoStr) => {
  if (!isoStr) return "-----";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-----";
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { users, isLoading } = useSelector((state) => state.admin);
  const [events, setEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  // Fetch users on component mount
  useEffect(() => {
    dispatch(fetchUsersList());
  }, [dispatch]);

  // Fetch events on component mount (admin token attached for auth)
  useEffect(() => {
    const fetchEventsData = async () => {
      setIsLoadingEvents(true);
      try {
        const response = await auctionService.getEvents({ page: 1 });
        setEvents(response.results || []);
        setEventCount(response.count ?? response.results?.length ?? 0);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events. Please try again.");
        setEvents([]);
        setEventCount(0);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEventsData();
  }, []);

  // Calculate stats from users data
  const stats = useMemo(() => {
    if (!users?.results) {
      return {
        totalUsers: 0,
        totalEvents: eventCount,
        totalRevenue: "0"
      };
    }

    const allUsers = users.results;
    const totalUsers = allUsers.length;

    return {
      totalUsers,
      totalEvents: eventCount,
      totalRevenue: "0"
    };
  }, [users, eventCount]);

  // Memoized data
  const recentActivities = useMemo(
    () => [
      // { id: 1, user: "John Smith", action: "registered as seller", time: "10 minutes ago" },
      // { id: 2, user: "Sarah Johnson", action: "placed bid on BMW", amount: "$7,500", time: "30 minutes ago" },
      // { id: 3, user: "Admin", action: "approved auction listing", auction: "Vintage Watch", time: "1 hour ago" },
      // { id: 4, user: "System", action: "automatic backup completed", time: "2 hours ago" },
      // { id: 5, user: "Manager 1", action: "assigned inspection task", time: "3 hours ago" },
    ],
    []
  );

  const topSellers = useMemo(
    () => [
      // { id: 1, name: "Abdullah Afzal", auctions: 24, revenue: "$284,500", rating: 4.8 },
      // { id: 2, name: "Imran Ahmad", auctions: 18, revenue: "$192,300", rating: 4.9 },
      // { id: 3, name: "Luxury Jewelry", auctions: 15, revenue: "$156,800", rating: 4.7 },
      // { id: 4, name: "Art Gallery Co.", auctions: 12, revenue: "$128,400", rating: 4.6 },
    ],
    []
  );

  // Filter events based on selected status (ALL, SCHEDULED, LIVE, CLOSING, CLOSED)
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    if (filterStatus === "ALL") return events;

    return events.filter((event) => {
      const status = (event.status || "").toUpperCase();
      return status === filterStatus;
    });
  }, [events, filterStatus]);

  const handleViewDetails = useCallback(
    (eventId, event) => {
      navigate(`/admin/event/${eventId}`, { state: { event } });
    },
    [navigate]
  );

  const handleEditEvent = useCallback(
    (eventId) => {
      navigate(`/admin/event/${eventId}/edit`);
    },
    [navigate]
  );

  // Memoized stats cards data
  const statCards = useMemo(
    () => [
      {
        icon: () => (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M23 21v-2a4 4 0 0 0-3-3.87"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 3.13a4 4 0 0 1 0 7.75"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        value: stats.totalUsers.toLocaleString(),
        label: "Total Users",
        colorClass: "admin-dashboard-icon-users"
      },
      {
        icon: () => (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="16"
              y1="17"
              x2="8"
              y2="17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polyline
              points="10 9 9 9 8 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        value: stats.totalEvents.toLocaleString(),
        label: "Total Events",
        colorClass: "admin-dashboard-icon-events"
      },
      {
        icon: () => (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 1v22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        value: stats.totalRevenue,
        label: "Total Revenue",
        colorClass: "admin-dashboard-icon-revenue"
      }
    ],
    [stats]
  );

  return (
    <div className="admin-dashboard-container" role="main">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <h1 className="admin-dashboard-title">Admin Dashboard</h1>
          <p className="admin-dashboard-subtitle">
            Platform oversight and management console
          </p>
        </div>
        <div className="admin-dashboard-header-actions">
          <Link
            to="/admin/event/create"
            className="admin-dashboard-create-btn"
            aria-label="Create event"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Create Event
          </Link>
          {/* <button
            className="admin-dashboard-action-btn admin-dashboard-btn-primary"
            onClick={() => navigate('/admin/profile')}
            aria-label="Go to my profile"
          >
            <ProfileIcon />
            <span>My Profile</span>
          </button> */}
          {/* <button
            className="admin-dashboard-action-btn admin-dashboard-btn-outline"
            aria-label="Generate report"
          >
            <ReportIcon />
            <span>Generate Report</span>
          </button> */}
        </div>
      </header>

      {/* Stats Overview */}
      <section
        className="admin-dashboard-stats-overview"
        aria-label="Statistics overview"
      >
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </section>

      <div className="admin-dashboard-main">
        {/* Left Column - Commented out */}
        {/* <div className="admin-dashboard-left-column">
          <section className="admin-dashboard-card" aria-label="Recent activity">
            <div className="admin-dashboard-card-header">
              <h2 className="admin-dashboard-card-title">Recent Activity</h2>
              <button className="admin-dashboard-card-action">View All</button>
            </div>
            <div className="admin-dashboard-activity-list" role="list">
              {recentActivities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </section>

          <section className="admin-dashboard-card" aria-label="Top sellers">
            <div className="admin-dashboard-card-header">
              <h2 className="admin-dashboard-card-title">Top Sellers</h2>
              <button className="admin-dashboard-card-action">View All</button>
            </div>
            <div className="admin-dashboard-sellers-list" role="list">
              {topSellers.map(seller => (
                <div key={seller.id} className="admin-dashboard-seller-item" role="listitem">
                  <div className="admin-dashboard-seller-info">
                    <div className="admin-dashboard-seller-avatar">{seller.name.charAt(0)}</div>
                    <div className="admin-dashboard-seller-details">
                      <div className="admin-dashboard-seller-name">{seller.name}</div>
                      <div className="admin-dashboard-seller-stats">
                        <span className="admin-dashboard-seller-stat">{seller.auctions} auctions</span>
                        <span className="admin-dashboard-seller-divider">•</span>
                        <span className="admin-dashboard-seller-stat">{seller.revenue} revenue</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-dashboard-seller-rating">
                    <span className="admin-dashboard-rating-value">{seller.rating}</span>
                    <span className="admin-dashboard-rating-star">★</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div> */}

        {/* Full Width Column */}
        <div className="admin-dashboard-full-width-column">
          <section
            className="admin-dashboard-card"
            aria-label="Recent events"
          >
            <div className="admin-dashboard-card-header">
              <div className="admin-dashboard-card-title-wrapper">
                <h2 className="admin-dashboard-card-title">Recent Events</h2>
                {eventCount > 0 && (
                  <span className="admin-dashboard-event-count">
                    ({eventCount})
                  </span>
                )}
              </div>
              <div className="admin-dashboard-card-actions">
                <select
                  className="admin-dashboard-filter-select"
                  aria-label="Filter by status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="CLOSING">Completed</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div className="admin-dashboard-events-list-wrapper">
              {isLoadingEvents ? (
                <div className="admin-dashboard-events-loading">
                  Loading events...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="admin-dashboard-events-empty">
                  No events found
                </div>
              ) : (
                <div className="admin-dashboard-events-list">
                  {filteredEvents.map((event) => (
                    <EventListingRow
                      key={event.id}
                      event={event}
                      onClick={(e) => handleViewDetails(e.id, e)}
                      renderActions={(ev) => (
                        <>
                          <button
                            type="button"
                            className="admin-dashboard-event-action-btn"
                            onClick={() => handleViewDetails(ev.id, ev)}
                            title="View Details"
                            aria-label={`View details for ${ev.title}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            View
                          </button>
                          {(ev.status || "").toUpperCase() === "SCHEDULED" && (
                            <button
                              type="button"
                              className="admin-dashboard-event-action-btn"
                              onClick={() => handleEditEvent(ev.id)}
                              title="Edit Event"
                              aria-label={`Edit ${ev.title}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              Edit
                            </button>
                          )}
                        </>
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* <section className="admin-dashboard-quick-actions-grid" aria-label="Quick actions">
            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-header">
                <h2 className="admin-dashboard-card-title">Quick Actions</h2>
              </div>
              <div className="admin-dashboard-actions-grid">
                <button
                  className="admin-dashboard-quick-action"
                  // onClick={() => navigate('/admin/approvals')}
                  aria-label={`Review ${stats.pendingApprovals} pending approvals`}
                >
                  <div className="admin-dashboard-quick-action-icon">📋</div>
                  <div className="admin-dashboard-quick-action-label">Review Approvals</div>
                  {stats.pendingApprovals > 0 && (
                    <div className="admin-dashboard-quick-action-badge">{stats.pendingApprovals}</div>
                  )}
                </button>
                <button
                  className="admin-dashboard-quick-action"
                  onClick={() => navigate('/admin/users')}
                  aria-label="Manage users"
                >
                  <div className="admin-dashboard-quick-action-icon">👥</div>
                  <div className="admin-dashboard-quick-action-label">Manage Users</div>
                </button>
                <button
                  className="admin-dashboard-quick-action"
                  onClick={() => navigate('/admin/finance')}
                  aria-label="View finance dashboard"
                >
                  <div className="admin-dashboard-quick-action-icon">💰</div>
                  <div className="admin-dashboard-quick-action-label">Finance Dashboard</div>
                </button>
                <button
                  className="admin-dashboard-quick-action"
                  // onClick={() => navigate('/admin/system')}
                  aria-label="Access system settings"
                >
                  <div className="admin-dashboard-quick-action-icon">⚙️</div>
                  <div className="admin-dashboard-quick-action-label">System Settings</div>
                </button>
              </div>
            </div>
          </section> */}
        </div>
      </div>

    </div>
  );
};

export default React.memo(AdminDashboard);
