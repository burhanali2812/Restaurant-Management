import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import {
  connectQZ,
  printCustomerBill,
  printWaiterToken,
  printKitchenToken,
} from "../services/qzPrintService";

function OrderPlace() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const restaurantId = user?.restid || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [cart, setCart] = useState([]);

  const [orderType, setOrderType] = useState("dine-in");
  const [tableNo, setTableNo] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [discount, setDiscount] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      const [p, w, c] = await Promise.all([
        axios.get(
          `https://restaurant-manage-backend.vercel.app/api/products/getProducts/${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get(
          `https://restaurant-manage-backend.vercel.app/api/waiters/getWaiters/${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get(
          `https://restaurant-manage-backend.vercel.app/api/category/getCategories/${user?.restid}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      setProducts(p.data || []);
      setWaiters(w.data || []);
      setCategories(c.data || []);
    };

    fetchData();
  }, []);

  // ================= FIXED CART =================
  const addToCart = (product, variant = null) => {
    const key = product._id + "-" + (variant?.name || "default");
    const price = variant ? variant.price : product.price;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);

      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }

      return [
        ...prev,
        {
          key,
          productId: product._id,
          name: product.name,
          price,
          variantName: variant?.name || "default",
          quantity: 1,
        },
      ];
    });
  };

  const decreaseQty = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.key === item.key);

      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((i) => i.key !== item.key);
      }

      return prev.map((i) =>
        i.key === item.key ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  };

  const removeItem = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  // ================= FILTER =================
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "all" || p.categoryId?._id === categoryFilter;

    return matchSearch && matchCategory;
  });

  // ================= TOTAL =================
  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);

  const total = subtotal - Number(discount || 0);

  // ================= VALIDATION =================
  const validateOrder = () => {
    if (!cart.length) {
      alert("Cart is empty");
      return false;
    }

    if (orderType === "dine-in" && !tableNo) {
      alert("Enter table number");
      return false;
    }

    if (
      (orderType === "dine-in" || orderType === "delivery") &&
      !selectedWaiter
    ) {
      alert("Select waiter / rider");
      return false;
    }

    if (discount > subtotal) {
      alert("Discount cannot exceed subtotal");
      return false;
    }

    return true;
  };

  // ================= PLACE ORDER =================
  const placeOrder = async () => {
    if (!validateOrder()) return;

    const payload = {
      restaurantId,
      tableNo,
      orderType,
      waiterId: selectedWaiter,
      items: cart,
      subtotal,
      discount,
      total,
    };

    const res = await axios.post(
      "https://restaurant-manage-backend.vercel.app/api/orders/addOrder",
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    alert("Order Placed Successfully");
    if (orderType === "dine-in") {
      printKitchenToken(res.data.data);
      printWaiterToken(
        res.data.data,
        res.data.waiter ? res.data.waiter.name : "N/A",
      );
    } else if (orderType === "takeaway" || orderType === "delivery") {
      printKitchenToken(res.data.data);
      printCustomerBill(res.data.data, res.data.restaurant);
    }

    setCart([]);
    setTableNo("");
    setSelectedWaiter("");
    setDiscount(0);
  };

  // ================= UI =================
  return (
    <div>
      <TopBar />

      <div className="container-fluid bg-light vh-100">
        <div className="row h-100">
          {/* ================= LEFT ================= */}
          <div className="col-12 col-lg-8 p-3 overflow-auto">
            {/* SEARCH */}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fa fa-search"></i>
              </span>
              <input
                className="form-control"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* CATEGORY FILTER */}
            <div className="d-flex gap-2 overflow-auto mb-3">
              <button
                className={`btn ${categoryFilter === "all" ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </button>

              {categories.map((c) => (
                <button
                  key={c._id}
                  className={`btn ${categoryFilter === c._id ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setCategoryFilter(c._id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* PRODUCTS */}
            <div className="row g-3">
              {filteredProducts.map((p) => (
                <div key={p._id} className="col-6 col-md-4 col-lg-3">
                  <div className="card shadow-sm border-0 p-2 h-100">
                    <h6 className="fw-bold">
                      <i className="fa fa-utensils me-2"></i>
                      {p.name}
                    </h6>

                    {p.variants?.length > 0 ? (
                      p.variants.map((v, i) => (
                        <button
                          key={i}
                          className="btn btn-sm btn-outline-primary mb-1 w-100"
                          onClick={() => addToCart(p, v)}
                        >
                          {v.name} - Rs {v.price}
                        </button>
                      ))
                    ) : (
                      <button
                        className="btn btn-primary btn-sm mt-auto"
                        onClick={() => addToCart(p)}
                      >
                        <i className="fa fa-plus me-1"></i>
                        Add Rs {p.price}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="col-12 col-lg-4 bg-white border-start p-3 d-flex flex-column vh-100">
            {/* ORDER TYPE */}
            <div className="d-flex gap-2 mb-3">
              {[
                { key: "dine-in", icon: "fa-chair", label: "Dine In" },
                { key: "takeaway", icon: "fa-shopping-bag", label: "Takeaway" },
                { key: "delivery", icon: "fa-truck", label: "Delivery" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`btn flex-fill ${orderType === t.key ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setOrderType(t.key)}
                >
                  <i className={`fa ${t.icon} me-1`}></i>
                  {t.label}
                </button>
              ))}
            </div>

            {/* TABLE + WAITER */}
            {(orderType === "dine-in" || orderType === "delivery") && (
              <div className="mb-2">
                {orderType === "dine-in" && (
                  <input
                    className="form-control mb-2"
                    placeholder="Table No"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                  />
                )}

                <select
                  className="form-select"
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                >
                  <option value="">Select Waiter / Rider</option>
                  {waiters.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CART */}
            <div className="flex-grow-0 overflow-auto">
              {cart.length === 0 ? (
                <div className="text-center text-muted mt-5">
                  <i className="fa fa-shopping-cart fa-3x"></i>
                  <p>No items</p>
                </div>
              ) : (
                <div className="list-group">
                  {cart.map((item) => (
                    <div
                      key={item.key}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <div>
                        <b>{item.name}</b>
                        <br />
                        <small>{item.variantName}</small>
                        <br />
                        Rs {item.price * item.quantity}
                      </div>

                      <div className="text-end">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => decreaseQty(item)}
                        >
                          <i className="fa fa-minus"></i>
                        </button>

                        <span className="mx-2 fw-bold">{item.quantity}</span>

                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            addToCart(
                              {
                                _id: item.productId,
                                name: item.name,
                                price: item.price,
                              },
                              { name: item.variantName, price: item.price },
                            )
                          }
                        >
                          <i className="fa fa-plus"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-dark ms-1"
                          onClick={() => removeItem(item.key)}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BILL */}
            <div className="border-top pt-2">
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <b>Rs {subtotal}</b>
              </div>
              <label className="form-label mt-2">Discount</label>

              <input
                className="form-control my-2"
                type="number"
                placeholder="Discount"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />

              <div className="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span>Rs {total}</span>
              </div>

              <button
                className="btn btn-success w-100 mt-3"
                onClick={placeOrder}
              >
                <i className="fa fa-check me-2"></i>
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPlace;
