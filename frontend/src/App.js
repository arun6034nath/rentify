import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import MyRentals from './pages/MyRentals';
import AdminListings from './pages/AdminListings';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';
import { CartProvider } from './CartContext';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-rentals" element={<MyRentals />} />
            <Route path="/admin-listings" element={<AdminListings />} />
            <Route path="/admin-orders" element={<AdminOrders />} />
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
