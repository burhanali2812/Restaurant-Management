import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

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

  // ================= FETCH =================
  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "https://restaurant-manage-backend.vercel.app/api/orders/getOrders",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setOrders(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= STATUS UPDATE =================
  const updateStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await axios.put(
        `https://restaurant-manage-backend.vercel.app/api/orders/updateOrder/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
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
          res.data.waiter,
        );
      }
      

      fetchOrders();
      setLoading(false);
    } catch (err) {
      alert("Status update failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;

    await axios.delete(
      `https://restaurant-manage-backend.vercel.app/api/orders/deleteOrder/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    fetchOrders();
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
      } else if (order.status === "pending" || order.status === "in-progress" || order.status === "ready") {
        await printKitchenToken(order);
        await printWaiterToken(
          order,
          order.waiterId ? order.waiterId.name : "N/A",
        );
      }
    }
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

          <button className="btn btn-dark" onClick={fetchOrders}>
            <i className="fa fa-sync me-1"></i> Refresh
          </button>
        </div>

        {/* FILTERS */}
        <div className="row mb-3">
          <div className="col-md-6 mb-2">
            <input
              className="form-control"
              placeholder="Search Order No / Table"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-6 mb-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
                    No orders found
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
                      </td>

                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={o.status}
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
                        >
                          <i className="fa fa-trash"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-primary ms-2"
                          onClick={() => printInvoices(o)}
                        >
                          <i className="fa fa-file-invoice"></i>
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
