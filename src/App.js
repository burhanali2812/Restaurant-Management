import React,{useEffect} from "react";
import {Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import Products from "./pages/Products";
import Category from "./pages/Category";
import Waiters from "./pages/Waiters";
import OrderPlace from "./pages/OrderPlace";
import OrderManagement from "./pages/OrderManagement";
import TestPrint from "./pages/TestPrint";
    import qz from "qz-tray";

function App() {

useEffect(() => {
  const setupQZ = async () => {
    try {
      // allow unsigned (DEV ONLY)
      qz.security.setCertificatePromise((resolve) => {
        resolve(`-----BEGIN CERTIFICATE-----
MIID...YOUR_FAKE_CERT...IDAQAB
-----END CERTIFICATE-----`);
      });

      qz.security.setSignaturePromise((toSign) => {
        return (resolve) => resolve(""); // IMPORTANT FIX
      });

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }

      console.log("QZ READY ✔");
    } catch (err) {
      console.error("QZ INIT ERROR", err);
    }
  };

  setupQZ();
}, []);
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/owner" element={<RestaurantDashboard />} />
      <Route path="/dashboard/waiter" element={<RestaurantDashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/categories" element={<Category />} /> 
      <Route path="/waiters" element={<Waiters />} />
      <Route path="/new-order" element={<OrderPlace />} />
      <Route path="/orders" element={<OrderManagement />} />
      <Route path="/test" element={<TestPrint />} />

    </Routes>
  );
}

export default App;
