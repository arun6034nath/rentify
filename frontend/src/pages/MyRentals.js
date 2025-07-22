import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Container, Typography, Box, Grid, Paper, Button, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, Alert,
  Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const getTileStyle = (dueDateString) => {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  
  // Normalize dates to midnight to compare days accurately
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Overdue: light red background
    return { backgroundColor: '#ffebee' }; 
  }
  if (diffDays <= 3) {
    // Due within 3 days: light amber background
    return { backgroundColor: '#fff8e1' };
  }
  // Default style
  return {};
};


const MyRentals = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendOrder, setExtendOrder] = useState(null);
  const [extendFrequency, setExtendFrequency] = useState('weekly');
  const [extendLoading, setExtendLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      setLoading(true);
      setError('');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(userData.user);
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userData.user.id)
        .single();
      setProfile(profileData);
      // Fetch orders for this user, join with listings
      const { data, error } = await supabase
        .from('orders')
        .select('id, start_date, end_date, frequency, listing_id, listings(title, price_per_week, price_per_month), price, extend_price, amount_paid')
        .eq('user_id', userData.user.id)
        .eq('status', 'Ordered')
        .order('start_date', { ascending: false });
      if (error) {
        setError('Failed to fetch rentals.');
        setOrders([]);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchUserAndOrders();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCancel = async (order) => {
    // 1. Update order status to 'Cancelled'
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', order.id);
    if (orderError) {
      setError('Failed to cancel order.');
      return;
    }
    // 2. Set rented_quantity in inventory to 0 for this listing
    await supabase
      .from('inventory')
      .update({ rented_quantity: 0, available_quantity: 1 })
      .eq('listing_id', order.listing_id);
    // 2b. Set available_quantity=1, rented_quantity=0, available=true in listings
    const updatePayload = { available_quantity: 1, rented_quantity: 0, available: true };
    console.log('Updating listings for id:', order.listing_id, 'with payload:', updatePayload);
    const { error: listingsError } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', order.listing_id);
    if (listingsError) {
      console.error('Listings update error:', listingsError.message);
      setError('Listings update error: ' + listingsError.message);
      return;
    }
    // 3. Refresh orders
    const { data: userData } = await supabase.auth.getUser();

    // Trigger Edge Function to sync listings before refreshing
    const { error: funcError } = await supabase.functions.invoke('sync-listings');
    if (funcError) {
      console.error('Error syncing listings:', funcError.message);
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, start_date, end_date, frequency, listing_id, listings(title, price_per_week, price_per_month), price, extend_price, amount_paid')
      .eq('user_id', userData.user.id)
      .eq('status', 'Ordered')
      .order('start_date', { ascending: false });
    if (error) {
      setError('Failed to fetch rentals.');
      setOrders([]);
    } else {
      setOrders(data || []);
    }
  };

  const handleExtendClick = (order) => {
    setExtendOrder(order);
    setExtendFrequency('weekly');
    setExtendDialogOpen(true);
  };

  const handleExtendConfirm = async () => {
    if (!extendOrder) return;
    setExtendLoading(true);
    let extend_price = 0;
    let new_end_date = extendOrder.end_date;
    if (extendFrequency === 'weekly') {
      extend_price = extendOrder.listings?.price_per_week ? parseInt(extendOrder.listings.price_per_week, 10) : 0;
      // Add 7 days to end_date
      const end = new Date(extendOrder.end_date);
      end.setDate(end.getDate() + 7);
      new_end_date = end.toISOString().split('T')[0];
    } else if (extendFrequency === 'monthly') {
      extend_price = extendOrder.listings?.price_per_month ? parseInt(extendOrder.listings.price_per_month, 10) : 0;
      // Add 1 month to end_date
      const end = new Date(extendOrder.end_date);
      end.setMonth(end.getMonth() + 1);
      new_end_date = end.toISOString().split('T')[0];
    }
    // Update order in Supabase
    const { error: extendError } = await supabase
      .from('orders')
      .update({
        extend_frequency: extendFrequency,
        extend_price,
        end_date: new_end_date,
      })
      .eq('id', extendOrder.id);
    setExtendLoading(false);
    setExtendDialogOpen(false);
    setExtendOrder(null);
    if (extendError) {
      setError('Failed to extend order: ' + extendError.message);
      return;
    }

    // Trigger Edge Function to sync listings
    const { error: funcErrorAfterExtend } = await supabase.functions.invoke('sync-listings');
    if (funcErrorAfterExtend) {
      console.error('Error syncing listings after extend:', funcErrorAfterExtend.message);
    }

    // Refresh orders
    const { data: userDataAfterExtend } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('orders')
      .select('id, start_date, end_date, frequency, extend_frequency, extend_price, listing_id, listings(title, price_per_week, price_per_month), price, extend_price, amount_paid')
      .eq('user_id', userDataAfterExtend.user.id)
      .eq('status', 'Ordered')
      .order('start_date', { ascending: false });
    if (error) {
      setError('Failed to fetch rentals.');
      setOrders([]);
    } else {
      setOrders(data || []);
    }
  };

  const calculateTotalPrice = (orders) => {
    return orders.reduce((total, order) => {
      const originalPrice = order.price || 0;
      const extendPrice = order.extend_price || 0;
      const amountPaid = order.amount_paid || 0;
      return total + (originalPrice + extendPrice - amountPaid);
    }, 0);
  };

  return (
    <Container sx={{ py: 6 }}>
      {/* Mobile Layout */}
      {isMobile ? (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Button size="small" startIcon={<ArrowBackIcon />} onClick={handleBackToHome} sx={{ minWidth: 0, pr: 1, fontSize: 12 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14, flex: 1, textAlign: 'right' }} noWrap>
              {profile?.full_name || ''}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
              My Rentals
            </Typography>
            <Button color="error" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12, ml: 1 }} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      ) : (
        <Box display="flex" alignItems="center" mb={3}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToHome} sx={{ mr: 2 }}>
            Back to Home
          </Button>
          <Typography variant="h4" fontWeight={700} flexGrow={1}>My Rentals</Typography>
          {user && (
            <Button color="error" variant="outlined" sx={{ fontWeight: 600, ml: 2 }} onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : orders.length === 0 ? (
        <>
          <Typography>No rentals found.</Typography>
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
            {orders.map(order => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Paper sx={{ p: 2, ...getTileStyle(order.end_date) }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{order.listings?.title || 'Book Title'}</Typography>
                  <Box mt={1}>
                    <Typography variant="body2">Order Date: <b>{order.start_date}</b></Typography>
                    <Typography variant="body2">Rental Duration: <b>{order.frequency === 'weekly' ? '1 Week' : '1 Month'}</b></Typography>
                    <Typography variant="body2">Due Date: <b>{order.end_date}</b></Typography>
                    {order.extend_frequency && (
                      <Typography variant="body2">Extension frequency: <b>{order.extend_frequency === 'weekly' ? '1 Week' : '1 Month'}</b></Typography>
                    )}
                    {order.extend_price && (
                      <Typography variant="body2">Extension Price: <b>Rs.{order.extend_price}</b></Typography>
                    )}
                    {(order.extend_price === null || order.extend_price === 0) && (
                      <Button variant="outlined" color="primary" sx={{ mt: 1, fontWeight: 700 }} onClick={() => handleExtendClick(order)}>
                        Extend
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {orders.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f3c7b' }}>
                Total Quantity: {orders.length}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f3c7b' }}>
                Total Price (Remaining): ₹{calculateTotalPrice(orders)}
              </Typography>
            </Box>
          )}
          <Box mt={6} textAlign="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#d97706', fontSize: 18 }}>
              Please collect your books from BCU, Halcyon I-2401 between 9AM - 6PM.<br/>
              You may drop an WA message on 8884560710 prior to pickup for convenience.
            </Typography>
          </Box>
        </>
      )}
      <Dialog open={extendDialogOpen} onClose={() => setExtendDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select Rental Frequency</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={extendFrequency}
            onChange={e => setExtendFrequency(e.target.value)}
          >
            <FormControlLabel value="weekly" control={<Radio />} label={`Weekly (Rs.${extendOrder?.listings?.price_per_week || ''})`} />
            <FormControlLabel value="monthly" control={<Radio />} label={`Monthly (Rs.${extendOrder?.listings?.price_per_month || ''})`} />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialogOpen(false)} disabled={extendLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleExtendConfirm} disabled={extendLoading}>
            {extendLoading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyRentals; 