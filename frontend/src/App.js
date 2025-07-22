import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyRentals from './pages/MyRentals';
import AdminListings from './pages/AdminListings';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import { CartProvider } from './CartContext';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/my-rentals" element={<MyRentals />} />
          <Route path="/admin-listings" element={<AdminListings />} />
          <Route path="/admin-orders" element={<AdminOrders />} />
          <Route path="/admin-users" element={<AdminUsers />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
