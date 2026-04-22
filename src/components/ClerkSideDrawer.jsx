import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import logo from "../assets/logo.png";
import ThemeToggle from "./ThemeToggle";
import "./ManagerSideDrawer.css";

const ClerkSideDrawer = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/signin", { replace: true });
  };

  const navItems = [
    {
      path: "/clerk/dashboard",
      label: "Dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      <div className={`manager-side-drawer__overlay ${isOpen ? "open" : ""}`} aria-hidden="true" />
      <aside className={`manager-side-drawer ${isOpen ? "open" : ""}`} role="dialog" aria-label="Clerk navigation">
        <div className="manager-side-drawer__header">
          <Link to="/clerk/dashboard" className="manager-side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>HT Clerk</span>
          </Link>
          <button className="manager-side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="manager-side-drawer__theme-toggle" />

        <nav className="manager-side-drawer__nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`manager-side-drawer__link ${isActive(item.path) ? "active" : ""}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="manager-side-drawer__actions">
          <span className="manager-side-drawer__badge">Clerk</span>
          <button type="button" className="manager-side-drawer__logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default ClerkSideDrawer;

