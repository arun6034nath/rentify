import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Home', () => () => <div data-testid="home">Home</div>);
jest.mock('./pages/Login', () => () => <div data-testid="login">Login</div>);
jest.mock('./pages/Signup', () => () => <div data-testid="signup">Signup</div>);
jest.mock('./pages/Cart', () => () => <div data-testid="cart">Cart</div>);
jest.mock('./pages/MyRentals', () => () => <div data-testid="my-rentals">MyRentals</div>);
jest.mock('./pages/AdminListings', () => () => <div data-testid="admin-listings">AdminListings</div>);
jest.mock('./pages/AdminOrders', () => () => <div data-testid="admin-orders">AdminOrders</div>);
jest.mock('./pages/AdminUsers', () => () => <div data-testid="admin-users">AdminUsers</div>);
jest.mock('./pages/NotFound', () => () => <div data-testid="not-found">NotFound</div>);

test('renders app and default route', () => {
  render(<App />);
});
