import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  const menu = [
    {
      label: "Dashboard",
      icon: "fa-dashboard",
      color: "#111827",
      href: "/dashboard/owner",
    },
    {
      label: "Place Order",
      icon: "fa-plus-circle",
      color: "#f59e0b",
      href: "/new-order",
    },
    {
      label: "Manage Orders",
      icon: "fa-list-check",
      color: "#3b82f6",
      href: "/orders",
    },
    {
      label: "Manage Categories",
      icon: "fa-list-ul",
      color: "#ef4444",
      href: "/categories",
    },
    {
      label: "Manage Products",
      icon: "fa-utensils",
      color: "#10b981",
      href: "/products",
    },
    {
      label: "Manage Waiters",
      icon: "fa-user-tie",
      color: "#8b5cf6",
      href: "/waiters",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogout(false);
    navigate("/");
  };

  return (
    <>
      {/* TOP BAR */}
      <div
        style={{
          backgroundColor: "white",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* CENTER MENU */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {menu.map((item, index) => {
            const isActive = location.pathname === item.href;

            return (
              <button
                key={index}
                onClick={() => navigate(item.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid transparent",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "#f59e0b" : "transparent",
                  color: isActive ? "white" : "#111827",
                  fontWeight: "600",
                  transition: "0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <i
                  className={`fa ${item.icon}`}
                  style={{ color: isActive ? "white" : item.color }}
                ></i>

                {item.label}
              </button>
            );
          })}
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => setShowLogout(true)}
          style={{
            position: "absolute",
            right: "20px",
            backgroundColor: "#ef4444",
            border: "none",
            color: "white",
            padding: "9px 14px",
            borderRadius: "10px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <i className="fa fa-sign-out" /> Logout
        </button>
      </div>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "320px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            <h5 style={{ marginBottom: "10px" }}>Confirm Logout</h5>
            <p style={{ color: "#6b7280" }}>
              Are you sure you want to logout?
            </p>

            <div className="d-flex justify-content-between mt-3">
              <button
                className="btn btn-light"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;