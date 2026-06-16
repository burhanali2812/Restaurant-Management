import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";

import {
  connectQZ,
  printCustomerBill,
  printPaidBill,
  printKitchenToken,
  printWaiterToken,
} from "../services/qzPrintService";
function OrderManagement() {
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
 const [loading, setLoading] = useState(false);
const [deletingId, setDeletingId] = useState(null);
const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const today = new Date();

const [startDate, setStartDate] = useState(
  new Date(today.getFullYear(), today.getMonth(), today.getDate())
);

const [endDate, setEndDate] = useState(
  new Date(today.getFullYear(), today.getMonth(), today.getDate())
);

const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

  // ================= FETCH =================
const fetchOrders = async () => {
  if (startDate > endDate) {
    return alert("Start date cannot be greater than end date");
  }

  setLoading(true);

  try {
    const res = await axios.get(
      "https://restaurant-manage-backend.vercel.app/api/orders/getOrders",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          startDate: formatDateForInput(startDate),
          endDate: formatDateForInput(endDate),
        },
      }
    );

    setOrders(res.data.data || []);
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= STATUS UPDATE =================
 const updateStatus = async (id, status) => {
  setUpdatingId(id);

  try {
    const res = await axios.put(
      `https://restaurant-manage-backend.vercel.app/api/orders/updateOrder/${id}`,
      {
        status,
        amount: orders.find((o) => o._id === id)?.total || 0,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Update UI instantly
    setOrders((prev) =>
      prev.map((o) =>
        o._id === id ? { ...o, status } : o
      )
    );

    if (status === "served") {
      await connectQZ();
      await printCustomerBill(res.data.data, res.data.restaurant);
    }

    if (status === "paid") {
      await connectQZ();
      await printPaidBill(
        res.data.data,
        res.data.restaurant,
        res.data.waiter
      );
    }
  } catch (err) {
    alert("Status update failed");
    fetchOrders();
  } finally {
    setUpdatingId(null);
  }
};

  // ================= DELETE =================
const deleteOrder = async (id) => {
  if (!window.confirm("Delete this order?")) return;

  const previousOrders = [...orders];

  setDeletingId(id);

  // Remove instantly from UI
  setOrders((prev) => prev.filter((o) => o._id !== id));

  try {
    await axios.delete(
      `https://restaurant-manage-backend.vercel.app/api/orders/deleteOrder/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    setOrders(previousOrders);
    alert("Delete failed");
  } finally {
    setDeletingId(null);
  }
};

  // ================= FILTER =================
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.OrderNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.tableNo?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // ================= STATUS COLOR =================
  const statusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in-progress":
        return "primary";
      case "ready":
        return "secondary";
      case "served":
        return "info";
      case "paid":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "dark";
    }
  };
  const printInvoices = async (order) => {
    console.log("Printing invoices for order:", order);
    const res = await axios.get(
      `https://restaurant-manage-backend.vercel.app/api/users/getRestaurant/${order.restaurantId._id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.data.success) {
      const restaurant = res.data.data;
      if (order.status === "paid") {
        console.log(restaurant.data);
        await printPaidBill(
          order,
          restaurant,
          order.waiterId ? order.waiterId : "N/A",
        );
      } else if (order.status === "served") {
        await printCustomerBill(order, restaurant);
      } else if (order.status === "pending" || order.status === "in-progress" ) {
        await printKitchenToken(order);
        await printWaiterToken(
          order,
          order.waiterId ? order.waiterId.name : "N/A",
        );
      }
      else if (order.status === "ready") {
        await printWaiterToken(
          order,
          order.waiterId ? order.waiterId.name : "N/A",
        );
      }
    }
  };
  const editOrder = (order) => {
    navigate("/new-order", { state: { order } });
  }
  const statusCounts = {
  all: orders.length,
  pending: orders.filter(o => o.status === "pending").length,
  "in-progress": orders.filter(o => o.status === "in-progress").length,
  ready: orders.filter(o => o.status === "ready").length,
  served: orders.filter(o => o.status === "served").length,
  paid: orders.filter(o => o.status === "paid").length,
  cancelled: orders.filter(o => o.status === "cancelled").length,
};

  return (
    <div>
      <TopBar />

    {
      loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
          <div className="spinner-border text-primary" role="status"> 
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ):(
          <div className="container-fluid p-3">
        {/* HEADER */}
        <div className="d-flex justify-content-between mb-3">
          <h4>
            <i className="fa fa-receipt me-2"></i>Orders
          </h4>

         <button
  className="btn btn-dark"
  onClick={fetchOrders}
  disabled={loading}
>
  {loading ? (
    <>
      <span className="spinner-border spinner-border-sm me-2"></span>
      Refreshing...
    </>
  ) : (
    <>
      <i className="fa fa-sync me-1"></i> Refresh
    </>
  )}
</button>
        </div>
        

        {/* FILTERS */}
        <div className="row mb-3">
  <div className="row mb-3">
  <div className="col-md-4 mb-2">
    <input
      className="form-control"
      placeholder="Search Order No / Table"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  <div className="col-md-3 mb-2">
    <input
      type="date"
      className="form-control"
      value={formatDateForInput(startDate)}
      onChange={(e) => {
        const [y, m, d] = e.target.value.split("-");
        setStartDate(new Date(y, m - 1, d));
      }}
    />
  </div>

  <div className="col-md-3 mb-2">
    <input
      type="date"
      className="form-control"
      value={formatDateForInput(endDate)}
      onChange={(e) => {
        const [y, m, d] = e.target.value.split("-");
        setEndDate(new Date(y, m - 1, d));
      }}
    />
  </div>

  <div className="col-md-2 mb-2">
    <button
      className="btn btn-primary w-100"
      onClick={fetchOrders}
    >
      Apply Filter
    </button>
  </div>
</div>
<div className="row mb-4">
  {[
  { key: "all", label: "All Orders", color: "#f59e0b" },       // Slate
  { key: "pending", label: "Pending", color: "#f59e0b" },      // Soft Amber
  { key: "in-progress", label: "In Progress", color: "#f59e0b" }, // Blue
  { key: "ready", label: "Ready", color: "#f59e0b" },          // Gray
  { key: "served", label: "Served", color: "#f59e0b" },        // Cyan
  { key: "paid", label: "Paid", color: "#f59e0b" },            // Emerald
  { key: "cancelled", label: "Cancelled", color: "#f59e0b" },  // Red
].map((item) => (
    <div className="col" key={item.key}>
   <div
  className="card shadow-sm "
  style={{
    cursor: "pointer",
    backgroundColor:
      statusFilter === item.key ? item.color : "#ffffff",
    color:
      statusFilter === item.key ? "#ffffff" : "#111827",
    transition: "all 0.2s ease",
  }}
  onClick={() => setStatusFilter(item.key)}
>
  <div className="card-body text-center py-3">
    <div className="small fw-semibold">{item.label}</div>
    <div className="fs-4 fw-bold">
      {statusCounts[item.key]}
    </div>
  </div>
</div>
    </div>
  ))}
</div>

      
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Order</th>
                <th>Table</th>
                <th>Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Change</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No orders found please change your date filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <React.Fragment key={o._id}>
                    {/* MAIN ROW */}
                    <tr>
                      <td>
                        <b>{o.OrderNo}</b>
                        <br />
                        <small>{new Date(o.createdAt).toLocaleString()}</small>

                        <br />

                        <button
                          className="btn btn-sm btn-outline-dark mt-1"
                          onClick={() =>
                            setExpandedOrder(
                              expandedOrder === o._id ? null : o._id,
                            )
                          }
                        >
                          <i className="fa fa-eye me-1"></i>
                          {expandedOrder === o._id ? "Hide" : "View"} Items
                        </button>
                      </td>

                      <td>{o.tableNo || "-"}</td>

                      <td>
                        <span className="badge bg-dark">{o.orderType}</span>
                      </td>

                      <td>
                        <b>Rs {o.total}</b>
                      </td>

                    <td>
  <span className={`badge bg-${statusColor(o.status)}`}>
    {o.status}
  </span>

  {updatingId === o._id && (
    <span className="spinner-border spinner-border-sm ms-2"></span>
  )}
</td>

                      <td>
                       <select
  className="form-select form-select-sm"
  value={o.status}
  disabled={updatingId === o._id}
  onChange={(e) => updateStatus(o._id, e.target.value)}
>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="ready">Ready</option>
                          <option value="served">Served</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td>
                       <button
  className="btn btn-sm btn-danger"
  onClick={() => deleteOrder(o._id)}
  disabled={deletingId === o._id}
>
  {deletingId === o._id ? (
    <span className="spinner-border spinner-border-sm"></span>
  ) : (
    <i className="fa fa-trash"></i>
  )}
</button>

                        <button
                          className="btn btn-sm btn-primary ms-2"
                          onClick={() => printInvoices(o)}
                        >
                          <i className="fa fa-file-invoice"></i>
                        </button>
                         <button
                          className="btn btn-sm btn-success ms-2"
                          onClick={() => editOrder(o)}
                        >
                        <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                      </td>
                    </tr>

                    {/* ITEMS ROW (EXPANDABLE) */}
                    {expandedOrder === o._id && (
                      <tr>
                        <td colSpan="7">
                          <div className="bg-light p-3 rounded">
                            <h6 className="mb-3">
                              <i className="fa fa-utensils me-2"></i>
                              Order Items
                            </h6>

                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Qty</th>
                                  <th>Price</th>
                                  <th>Total</th>
                                </tr>
                              </thead>

                              <tbody>
                                {o.items?.map((i, idx) => (
                                  <tr key={idx}>
                                    <td>{i.name}</td>
                                    <td>{i.quantity}</td>
                                    <td>Rs {i.price}</td>
                                    <td>
                                      Rs {i.total || i.price * i.quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )

    }
    </div>
  );
}

export default OrderManagement;
