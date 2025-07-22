import React, { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { Container, Typography, Box, Paper, Button, Grid, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { supabase } from '../supabaseClient';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const Cart = () => {
  const { cart, removeFromCart, setCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const totalQuantity = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleCheckout = async () => {
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }
    setLoading(true);
    setError('');
    const today = new Date();
    // Insert each cart item as a new order
    const inserts = cart.map(item => {
      const start_date = today.toISOString().split('T')[0];
      let end_date;
      if (item.frequency === 'weekly') {
        end_date = addDays(today, 7).toISOString().split('T')[0];
      } else {
        end_date = addMonths(today, 1).toISOString().split('T')[0];
      }
      return {
        listing_id: item.id,
        frequency: item.frequency,
        price: item.price,
        start_date,
        end_date,
        status: 'Ordered',
        user_id: user.id,
      };
    });
    const { data: insertData, error: orderError } = await supabase.from('orders').insert(inserts);
    console.log('Order insert result:', insertData, orderError);
    if (orderError) {
      setLoading(false);
      setError(orderError.message || 'Failed to place order. Please try again.');
      return;
    }
    // Update inventory for each listing in cart
    for (const item of cart) {
      // Set rented_quantity to 1 and available_quantity to listed_quantity - rented_quantity (assume listed_quantity is 1)
      await supabase.from('inventory').update({ rented_quantity: 1, available_quantity: 0 }).eq('listing_id', item.id);
    }
    // Update listings for each listing in cart
    for (const item of cart) {
      const updatePayload = { available_quantity: 0, rented_quantity: 1, available: false };
      console.log('Updating listings for id:', item.id, 'with payload:', updatePayload);
      const { error: listingsError } = await supabase.from('listings').update(updatePayload).eq('id', item.id);
      if (listingsError) {
        console.error('Listings update error:', listingsError.message);
        setError('Listings update error: ' + listingsError.message);
        setLoading(false);
        return;
      }
    }

    // Trigger Edge Function to sync listings
    const { error: funcError } = await supabase.functions.invoke('sync-listings');
    if (funcError) {
      // Log the error but don't block the user
      console.error('Error syncing listings:', funcError.message);
    }

    setLoading(false);
    setSuccess(true);
    setCart([]);
    navigate('/my-rentals');
  };

  const handleLogin = () => {
    setLoginPromptOpen(false);
    navigate('/login');
  };
  const handleSignup = () => {
    setLoginPromptOpen(false);
    navigate('/signup');
  };

  return (
    <Container sx={{ py: 6 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Back to Home
      </Button>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Your Cart
      </Typography>
      {cart.length === 0 ? (
        <>
          <Typography variant="body1">Your cart is empty.</Typography>
          <Box mt={6} textAlign="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#d97706', fontSize: 18 }}>
              Please collect your books from BCU, Halcyon I-2401 between 9AM - 6PM.<br/>
              You may drop an WA message on 8884560710 prior to pickup for convenience.
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Grid container spacing={3}>
            {cart.map((item, idx) => (
              <Grid item xs={12} md={6} key={item.id + item.frequency}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography variant="body2">Frequency: <b>{item.frequency}</b></Typography>
                  <Typography variant="body2">Price: <b>Rs.{item.price}</b></Typography>
                  <Button color="error" onClick={() => removeFromCart(item.id, item.frequency)}>
                    Remove
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Box mt={4}>
            <Typography variant="h6">Total Quantity: {totalQuantity}</Typography>
            <Typography variant="h6">Total Price: Rs.{totalPrice}</Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Placing Order...' : 'Checkout'}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)}>
              <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                Order placed successfully!<br/>
                <span style={{ fontWeight: 'bold', color: '#d97706' }}>
                  Please collect your books from BCU, Halcyon I-2401 between 9AM - 6PM.<br/>
                  You may drop an WA message on 8884560710 prior to pickup for convenience.
                </span>
              </Alert>
            </Snackbar>
          </Box>
          <Box mt={6} textAlign="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#d97706', fontSize: 18 }}>
              Please collect your books from BCU, Halcyon I-2401 between 9AM - 6PM.<br/>
              You may drop an WA message on 8884560710 prior to pickup for convenience.
            </Typography>
          </Box>
          {/* Login/Signup Prompt Dialog */}
          <Dialog open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)}>
            <DialogTitle>Login or Signup Required</DialogTitle>
            <DialogContent>
              <Typography>You must be logged in to place an order. Please login or signup to continue.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleLogin}>Login</Button>
              <Button onClick={handleSignup}>Sign Up</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default Cart;
