import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./RestaurantDashboard.css";
import axios from "axios";
function RestaurantDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  const [userName, setUserName] = useState("Owner");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [showSalesModal, setShowSalesModal] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    productSummary: [],
  });
  const [loading, setLoading] = useState(false);
  const [waitersData, setWaitersData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const calendarRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch metrics
  useEffect(() => {
    fetchMetrics();
  }, []);
  

  const fetchMetrics = async () => {
    if (startDate > endDate) {
      alert("Start date cannot be greater than end date");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `https://restaurant-manage-backend.vercel.app/api/orders/metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            startDate: startDate.toLocaleDateString("en-CA"),
            endDate: endDate.toLocaleDateString("en-CA"),
          },
        },
      );

      if (response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      alert(error.response?.data?.message || "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  // Fetch waiters data
  const fetchWaitersData = async () => {
    setLoadingWaiters(true);
    try {
      const response = await axios.get(
        "https://restaurant-manage-backend.vercel.app/api/waiters/waiters-stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data) {
        setWaitersData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching waiters:", error);
      alert("Failed to fetch waiters data");
     
    } finally {
      setLoadingWaiters(false);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await axios.get(
        "https://restaurant-manage-backend.vercel.app/api/orders/recent-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data) {
        setRecentOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert(error.response?.data?.message || "Failed to fetch recent orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchWaitersData();
    fetchRecentOrders();
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleDateChange = (e, type) => {
    const date = new Date(e.target.value);
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  const filteredProducts = metrics.productSummary?.filter((item) =>
  item.productName.toLowerCase().includes(searchTerm.toLowerCase())
);

  const quickAccessButtons = [
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

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dashboard-top-bar">
        <div className="top-bar-left">
          <div className="logo-section">
            <img src="/images/logo2.PNG" alt="Logo" className="circular-logo" />
            <div className="logo-text">
              <h3 className="restaurant-name">
                {user?.restname} {" Restaurant"}
              </h3>
              <p className="dashboard-label">Dashboard</p>
            </div>
          </div>
        </div>

        <div className="top-bar-right">
          <div className="user-info">
            <i className="fas fa-user-circle user-icon"></i>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-status">Restaurant Owner</p>
            </div>
          </div>

          <div className="divider"></div>

          <div className="date-time-section">
            <div className="date-time-display">
              <i className="fas fa-calendar-alt"></i>
              <span className="date-text">{formatDate(currentDateTime)}</span>
            </div>
            <div className="time-display">
              <i className="fas fa-clock"></i>
              <span className="time-text">{formatTime(currentDateTime)}</span>
            </div>
          </div>

          <button
            className="calendar-btn"
            onClick={() => setShowCalendar(!showCalendar)}
            title="Select date range"
          >
            <i className="fas fa-calendar-days"></i>
          </button>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>

          {/* Calendar Dropdown */}
          {showCalendar && (
            <div className="calendar-dropdown" ref={calendarRef}>
              <h4>Filter by Date Range</h4>
              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate.toLocaleDateString("en-CA")}
                    onChange={(e) => handleDateChange(e, "start")}
                  />
                </div>
                <div className="date-input-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate.toLocaleDateString("en-CA")}
                    onChange={(e) => handleDateChange(e, "end")}
                  />
                </div>
              </div>
              <button
                className="apply-btn"
                onClick={() => {
                  setShowCalendar(false);
                  fetchMetrics();
                }}
              >
                Apply Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-section">
        <h3 className="section-title">
          <i className="fas fa-chart-bar"></i> Performance Metrics
        </h3>

        {loading ? (
          <div className="loading">Loading metrics...</div>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card total-sales"
              onClick={() => setShowSalesModal(true)}
  style={{ cursor: "pointer" }}
            >
              <div className="metric-header">
                <h4>Today's Sales</h4>
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <p className="metric-value">
                PKR {metrics.totalSales?.toLocaleString()}
              </p>
              <p className="metric-subtitle">Revenue generated today</p>
            </div>

            <div className="metric-card total-orders">
              <div className="metric-header">
                <h4>Today's Orders</h4>
                <i className="fas fa-shopping-cart"></i>
              </div>
              <p className="metric-value">{metrics.totalOrders}</p>
              <p className="metric-subtitle">Orders placed today</p>
            </div>

            <div className="metric-card pending-orders">
              <div className="metric-header">
                <h4>Pending Orders</h4>
                <i className="fas fa-hourglass-start"></i>
              </div>
              <p className="metric-value">{metrics.pendingOrders}</p>
              <p className="metric-subtitle">Awaiting processing</p>
            </div>

            <div className="metric-card active-orders">
              <div className="metric-header">
                <h4>Active Orders</h4>
                <i className="fas fa-lightning-bolt"></i>
              </div>
              <p className="metric-value">{metrics.activeOrders}</p>
              <p className="metric-subtitle">Currently active</p>
            </div>

            <div className="metric-card in-progress-orders">
              <div className="metric-header">
                <h4>In Progress</h4>
                <i className="fas fa-spinner"></i>
              </div>
              <p className="metric-value">{metrics.inProgressOrders}</p>
              <p className="metric-subtitle">Being prepared</p>
            </div>

            <div className="metric-card completed-orders">
              <div className="metric-header">
                <h4>Completed Orders</h4>
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="metric-value">{metrics.completedOrders}</p>
              <p className="metric-subtitle">Successfully delivered</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Buttons */}
      <div className="quick-access-section">
        <h3 className="section-title">
          <i className="fas fa-zap"></i> Quick Access
        </h3>
        <div className="quick-access-grid">
          {quickAccessButtons.map((btn, index) => (
            <a
              key={index}
              href={btn.href}
              className="quick-access-btn"
              style={{ "--accent-color": btn.color }}
            >
              <div className="btn-icon">
                <i className={`fas ${btn.icon}`}></i>
              </div>
              <span className="btn-label">{btn.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Waiters and Recent Orders Section */}
      <div className="tables-section">
        {/* Left Side - Waiters Table */}
        <div className="table-container waiters-table">
          <div className="table-header">
            <h3 className="table-title">
              <i className="fas fa-user-tie"></i> Waiter Performance
            </h3>
          </div>
          {loadingWaiters ? (
            <div className="table-loading">Loading waiters data...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waiter Name</th>
                  <th>Active</th>
                  <th>Completed</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {waitersData.length > 0 ? (
                  waitersData.map((waiter, index) => (
                    <tr key={index} className="table-row">
                      <td className="waiter-name">
                        <i className="fas fa-user-circle"></i> {waiter.name}
                      </td>
                      <td>
                        <span className="badge badge-active">
                          {waiter.activeOrders}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-completed">
                          {waiter.completedOrders}
                        </span>
                      </td>
                      <td className="amount">
                        <strong>
                          PKR {waiter.totalAmount?.toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Side - Recent Orders Table */}
        <div className="table-container recent-orders-table">
          <div className="table-header">
            <h3 className="table-title">
              <i className="fas fa-receipt"></i> Recent Orders
            </h3>
          </div>
          {loadingOrders ? (
            <div className="table-loading">Loading orders data...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Waiter</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={index} className="table-row">
                      <td className="order-no">{order.orderNo}</td>
                      <td>{order.waiter}</td>
                      <td>
                        <span
                          className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="amount">
                        PKR {order.amount?.toLocaleString()}
                      </td>
                      <td className="time">{order.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: "50px" }}></div>

      {showSalesModal && (
  <div className="modal-overlay" onClick={() => setShowSalesModal(false)}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div className="modal-header">
        <h3>Today Sales - Product Summary</h3>
 
        <button
          className="close-btn"
          onClick={() => setShowSalesModal(false)}
        >
          ✖
        </button>
      </div>
      <div>
               <p className="text-lead">From {startDate.toISOString().split('T')[0]} to {endDate.toISOString().split('T')[0]}</p>
        {/* add note to chnage date from main dashboard */}
        <span className="text-note">Change date range from the calendar icon on top right corner</span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search product..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      <div className="modal-table-wrapper">
        <table className="modal-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Amount</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts?.length > 0 ? (
              filteredProducts.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.totalQuantity}</td>
                  <td>PKR {item.totalAmount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default RestaurantDashboard;
