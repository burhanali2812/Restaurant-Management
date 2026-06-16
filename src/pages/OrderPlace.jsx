import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import {useLocation, useNavigate} from "react-router-dom"; 
import {
  connectQZ,
  printCustomerBill,
  printWaiterToken,
  printKitchenToken,
  printPaidBill,
} from "../services/qzPrintService";

// ─── tiny inline styles kept here so no extra CSS file is needed ───
const S = {
  page: {
    background: "#F7F8FA",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  // LEFT PANEL
  left: {
    padding: "20px",
    overflowY: "auto",
    height: "calc(100vh - 56px)",
  },
  // RIGHT PANEL
  right: {
    background: "#fff",
    borderLeft: "1px solid #E2E6EA",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 56px)",
    padding: "16px",
  },
  // ORDER TYPE BUTTON
  typeBtn: (active) => ({
    flex: 1,
    padding: "8px 4px",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "8px",
    border: active ? "none" : "1px solid #DEE2E6",
    background: active ? "#212529" : "#fff",
    color: active ? "#fff" : "#495057",
    cursor: "pointer",
    transition: "all .15s",
  }),
  // PRODUCT CARD
  productCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  productName: {
    fontWeight: 700,
    fontSize: "13px",
    color: "#212529",
    marginBottom: "2px",
    lineHeight: 1.3,
  },
  variantBtn: {
    fontSize: "12px",
    padding: "5px 8px",
    borderRadius: "6px",
    border: "1px solid #0d6efd",
    background: "#fff",
    color: "#0d6efd",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all .12s",
    textAlign: "left",
  },
  addBtn: {
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    background: "#0d6efd",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    marginTop: "auto",
  },
  // CART ITEM
  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "#F8F9FA",
    marginBottom: "6px",
    gap: "6px",
  },
  qtyBtn: (color) => ({
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: "none",
    background: color,
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6C757D",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  // CATEGORY PILL
  catBtn: (active) => ({
    padding: "5px 14px",
    borderRadius: "20px",
    border: active ? "none" : "1px solid #DEE2E6",
    background: active ? "#212529" : "#fff",
    color: active ? "#fff" : "#495057",
    fontWeight: 600,
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all .12s",
  }),
};

// ─── skeleton card ───
const SkeletonCard = () => (
  <div style={{ ...S.productCard, gap: "8px" }}>
    <div style={{ height: "14px", background: "#E9ECEF", borderRadius: "4px", width: "70%" }} />
    <div style={{ height: "28px", background: "#E9ECEF", borderRadius: "6px" }} />
  </div>
);

export default function OrderPlace() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const restaurantId = user?.restid || "";

  const [products, setProducts]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [waiters, setWaiters]             = useState([]);
  const [cart, setCart]                   = useState([]);
  const [fetching, setFetching]           = useState(true);  // initial data load
  const [placing, setPlacing]             = useState(false); // order submit

  const [orderType, setOrderType]         = useState("dine-in");
  const [tableNo, setTableNo]             = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [discount, setDiscount]           = useState("");

  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const location = useLocation();
    const navigate = useNavigate();
    // If coming from edit page, prefill the form
  useEffect(() => {
    if (location.state?.order) {
      const { order } = location.state;
      setOrderType(order.orderType);
      setTableNo(order.tableNo || "");
      setSelectedWaiter(order.waiterId || "");
      setDiscount(order.discount || "");
    setCart(
  order.items.map((i) => {
    const productId =
      typeof i.productId === "object"
        ? i.productId._id
        : i.productId;

    return {
      key: String(productId) + "-" + (i.variantName || "default"),
      productId: String(productId),
      name: i.name,
      variantName: i.variantName,
      price: Number(i.price),
      quantity: Number(i.quantity),
    };
  })
);
    }
    }, [location.state]);
    useEffect(() => {
  if (search.trim() !== "") {
    setCategoryFilter("all");
  }
}, [search]);

 

  const BASE = "https://restaurant-manage-backend.vercel.app/api";
  const headers = { Authorization: `Bearer ${token}` };

  // ─── FETCH ───
  useEffect(() => {
    (async () => {
      try {
        const [p, w, c] = await Promise.all([
          axios.get(`${BASE}/products/getProducts/${restaurantId}`, { headers }),
          axios.get(`${BASE}/waiters/getWaiters/${restaurantId}`, { headers }),
          axios.get(`${BASE}/category/getCategories/${restaurantId}`, { headers }),
        ]);
        setProducts(p.data || []);
        setWaiters(w.data || []);
        setCategories(c.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  // ─── CART ───
const addToCart = (product, variant = null) => {
  const productId = String(product._id);

  const key =
    productId + "-" + (variant?.name || "default");

  const price = variant
    ? Number(variant.price)
    : Number(product.price);

  setCart((prev) => {
    const hit = prev.find((i) => i.key === key);

    if (hit) {
      return prev.map((i) =>
        i.key === key
          ? { ...i, quantity: Number(i.quantity) + 1 }
          : i
      );
    }

    return [
      ...prev,
      {
        key,
        productId,
        name: product.name,
        variantName: variant?.name || null,
        price,
        quantity: 1,
      },
    ];
  });
};

const changeQty = (key, delta) => {
  setCart((prev) =>
    prev
      .map((i) =>
        i.key === key
          ? {
              ...i,
              quantity: Math.max(0, Number(i.quantity) + delta),
            }
          : i
      )
      .filter((i) => i.quantity > 0)
  );
};

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  // ─── FILTER ───
const filtered = products.filter((p) => {
  const matchSearch =
    search.trim() === "" ||
    p.name.toLowerCase().includes(search.toLowerCase());

  // category only applies when search is empty
  const matchCat =
    search.trim() !== ""
      ? true
      : categoryFilter === "all" ||
        p.categoryId?._id === categoryFilter;

  return matchSearch && matchCat && p.isAvailable !== false;
});

  // ─── TOTALS ───
  const subtotal   = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmt = Math.min(Number(discount || 0), subtotal);
  const total      = subtotal - discountAmt;

  // ─── VALIDATE ───
  const validate = () => {
    if (!cart.length)                                         { alert("Add items to the cart first.");           return false; }
    if (orderType === "dine-in" && !tableNo.trim())           { alert("Enter a table number.");                  return false; }
    if (orderType !== "takeaway" && !selectedWaiter)          { alert("Select a waiter / rider.");               return false; }
    if (Number(discount || 0) > subtotal)                     { alert("Discount can't exceed the subtotal.");    return false; }
    return true;
  };

  const updateOrder = async (orderId) => {
  if (!validate()) return;

  setPlacing(true);

  const payload = {
    tableNo,
    orderType,
    waiterId: selectedWaiter || null,
    discount: discountAmt,
    items: cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      variantName: i.variantName,
      quantity: i.quantity,
      
    })),
  };

  try {
    const res = await axios.put(
      `${BASE}/orders/update-whole-order/${orderId}`,
      payload,
      { headers }
    );
    if(res.data.success){
 alert("Order updated successfully!");
      printCustomerBill(res.data.data, res.data.restaurant);
    navigate("/orders");
    }

   
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to update order. Try again.");
  } finally {
    setPlacing(false);
  }
};

  // ─── PLACE ORDER ───
 const placeOrder = async () => {
  if (!validate()) return;
  setPlacing(true);

  const payload = {
    restaurantId,
    tableNo,
    orderType,
    waiterId: selectedWaiter || null,
    discount: Number(discountAmt) || 0,

    // no price, no total (backend handles everything)
    items: cart.map((i) => ({
      productId: i.productId,
      name: i.name,
      variantName: i.variantName || null,
      quantity: Number(i.quantity) || 0,
    })),
  };

  console.log("Payload:", payload);

  try {
    const res = await axios.post(
      `${BASE}/orders/addOrder`,
      payload,
      { headers }
    );

    const order = res.data.data;

    if (orderType === "dine-in") {
     await printKitchenToken(order);
     await printWaiterToken(order, res.data.waiter?.name || "N/A");
    } 
    else if (orderType === "takeaway" || orderType === "delivery") {
      await printKitchenToken(order);
      await printPaidBill(order, res.data.restaurant, res.data.waiter?.name || "N/A");
    } 
    else {
      await printKitchenToken(order);
      await printCustomerBill(order, res.data.restaurant);
    }

    // reset UI
    setCart([]);
    setTableNo("");
    setSelectedWaiter("");
    setDiscount("");

    alert("Order placed successfully!");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to place order. Try again.");
  } finally {
    setPlacing(false);
  }
};

  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);


  // ─── UI ───
  return (
    <div style={S.page}>
      <TopBar />

      <div className="container-fluid p-0">
        <div className="row g-0" style={{ height: "calc(100vh - 56px)" }}>

          {/* ══════════════ LEFT — MENU ══════════════ */}
          <div className="col-12 col-lg-8" style={S.left}>

            {/* Search */}
            <div className="input-group mb-3" style={{ maxWidth: "480px" }}>
              <span className="input-group-text" style={{ background: "#fff", border: "1px solid #DEE2E6", borderRight: "none" }}>
                <i className="fa fa-search text-muted" style={{ fontSize: "13px" }} />
              </span>
              <input
                className="form-control"
                style={{ borderLeft: "none", boxShadow: "none" }}
                placeholder="Search menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary"
                  style={{ borderLeft: "none", fontSize: "12px" }}
                  onClick={() => setSearch("")}
                >✕</button>
              )}
            </div>

            {/* Category pills */}
            <div className="d-flex gap-2 overflow-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
              <button style={S.catBtn(categoryFilter === "all")} onClick={() => setCategoryFilter("all")}>
                All{` (${products.length})`}
              </button>
              {categories.map((c) => (
                <button key={c._id} style={S.catBtn(categoryFilter === c._id)} onClick={() => setCategoryFilter(c._id)}>
                  {c.name}{` (${products.filter(p => p.categoryId?._id === c._id).length})`}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {fetching ? (
              <div className="row g-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="col-6 col-md-4 col-xl-3"><SkeletonCard /></div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="fa fa-search fa-2x mb-2 d-block" />
                No items match "{search || categoryFilter}"
              </div>
            ) : (
              <div className="row g-3">
                {filtered.map((p) => (
                  <div key={p._id} className="col-6 col-md-4 col-xl-3">
                    <div style={S.productCard}>
                      <div style={S.productName}>{p.name}</div>

                      {p.variants?.length > 0 ? (
                        p.variants.map((v, idx) => {
                          const key   = p._id + "-" + v.name;
                          const inCart = cart.find((c) => c.key === key);
                          return (
                            <button
                              key={idx}
                              style={{
                                ...S.variantBtn,
                                background: inCart ? "#0d6efd" : "#fff",
                                color: inCart ? "#fff" : "#0d6efd",
                              }}
                              onClick={() => addToCart(p, v)}
                            >
                              {v.name} &nbsp;·&nbsp; Rs.{v.price}
                              {inCart && <span style={{ marginLeft: "6px", fontSize: "11px" }}>×{inCart.quantity}</span>}
                            </button>
                          );
                        })
                      ) : (
                        (() => {
                          const key    = p._id + "-default";
                          const inCart = cart.find((c) => c.key === key);
                          return (
                            <button
                              style={{
                                ...S.addBtn,
                                background: inCart ? "#0d6efd" : "#f59e0b",
                              }}
                              onClick={() => addToCart(p)}
                            >
                              {inCart ? `×${inCart.quantity}  Rs.${p.price}` : `+ Rs.${p.price}`}
                            </button>
                          );
                        })()
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════ RIGHT — ORDER PANEL ══════════════ */}
          <div className="col-12 col-lg-4" style={S.right}>

            {/* Order type */}
            <p style={S.sectionLabel}>Order Type</p>
            <div className="d-flex gap-2 mb-3">
              {[
                { key: "dine-in",  icon: "fa-chair",        label: "Dine In"  },
                { key: "takeaway", icon: "fa-shopping-bag",  label: "Takeaway" },
                { key: "delivery", icon: "fa-truck",         label: "Delivery" },
              ].map((t) => (
                <button key={t.key} style={S.typeBtn(orderType === t.key)} onClick={() => setOrderType(t.key)}>
                  <i className={`fa ${t.icon} me-1`} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Table + Waiter */}
            {(orderType === "dine-in" || orderType === "delivery") && (
              <div className="mb-3">
                {orderType === "dine-in" && (
                  <input
                    className="form-control form-control-sm mb-2"
                    placeholder="Table number"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                  />
                )}
                <select
                  className="form-select form-select-sm"
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                >
                  <option value="">— Select waiter / rider —</option>
                  {waiters.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cart header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <p style={{ ...S.sectionLabel, marginBottom: 0 }}>
                Order Items
              </p>
              {cart.length > 0 && (
                <button
                  style={{ fontSize: "11px", background: "none", border: "none", color: "#DC3545", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => setCart([])}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Cart list — scrollable */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "8px", minHeight: 0 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", color: "#ADB5BD", paddingTop: "40px" }}>
                  <i className="fa fa-shopping-cart" style={{ fontSize: "32px", display: "block", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px" }}>No items added yet</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.key} style={S.cartItem}>
                    {/* Name + variant */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </div>
                      {item.variantName && (
                        <div style={{ fontSize: "11px", color: "#6C757D" }}>{item.variantName}</div>
                      )}
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0d6efd" }}>
                        Rs.{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="d-flex align-items-center gap-1">
                      <button style={S.qtyBtn("#DC3545")} onClick={() => changeQty(item.key, -1)}>−</button>
                      <span style={{ fontWeight: 700, fontSize: "14px", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                      <button style={S.qtyBtn("#198754")} onClick={() => changeQty(item.key, +1)}>+</button>
                      <button
                        style={{ ...S.qtyBtn("#6C757D"), marginLeft: "2px" }}
                        onClick={() => removeItem(item.key)}
                        title="Remove"
                      >
                        <i className="fa fa-trash" style={{ fontSize: "10px" }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill summary */}
            <div style={{ borderTop: "1px solid #E9ECEF", paddingTop: "10px" }}>
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                <span className="text-muted">Subtotal</span>
                <span>Rs.{subtotal.toLocaleString()}</span>
              </div>

              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="text-muted" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Discount</span>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">Rs.</span>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: "90px" }}
                    placeholder="0"
                    value={discount}
                    min={0}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>

              {discountAmt > 0 && (
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px", color: "#198754" }}>
                  <span>Discount applied</span>
                  <span>− Rs.{discountAmt.toLocaleString()}</span>
                </div>
              )}

              <div className="d-flex justify-content-between fw-bold mt-1" style={{ fontSize: "15px" }}>
                <span>Total</span>
                <span style={{ color: "#0d6efd" }}>Rs.{total.toLocaleString()}</span>
              </div>

              <button
                className="btn w-100 mt-3 fw-bold"
                style={{
                  background: placing ? "#6C757D" : "#212529",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "11px",
                  fontSize: "14px",
                  letterSpacing: ".02em",
                }}
                onClick={location.state?.order ? () => updateOrder(location.state.order._id) : placeOrder}
                disabled={placing || cart.length === 0}
              >
                {placing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                    Placing order…
                  </>
                ) : (
                  <>
                    <i className="fa fa-check-circle me-2" />
                    {location.state?.order ? "Update Order" : "Place Order"}
                    {cartCount > 0 && (
                      <span style={{ marginLeft: "8px", background: "#fff", color: "#212529", borderRadius: "12px", padding: "1px 8px", fontSize: "12px", fontWeight: 700 }}>
                        {cartCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}