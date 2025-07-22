import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart((prev) => {
      // Only one entry per book/frequency combo
      const filtered = prev.filter(
        (i) => !(i.id === item.id && i.frequency === item.frequency)
      );
      return [...filtered, item];
    });
  };

  const removeFromCart = (id, frequency) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.frequency === frequency)));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
} 