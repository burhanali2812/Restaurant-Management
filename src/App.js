import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import Products from "./pages/Products";
import Category from "./pages/Category";
import Waiters from "./pages/Waiters";
import OrderPlace from "./pages/OrderPlace";
import OrderManagement from "./pages/OrderManagement";
import TestPrint from "./pages/TestPrint";



function App() {
  return (
    <Routes>
      <Route path="/"                   element={<Login />} />
      <Route path="/dashboard/owner"    element={<RestaurantDashboard />} />
      <Route path="/dashboard/waiter"   element={<RestaurantDashboard />} />
      <Route path="/products"           element={<Products />} />
      <Route path="/categories"         element={<Category />} />
      <Route path="/waiters"            element={<Waiters />} />
      <Route path="/new-order"          element={<OrderPlace />} />
      <Route path="/orders"             element={<OrderManagement />} />
      <Route path="/test"               element={<TestPrint />} />
    </Routes>
  );
}

export default App;