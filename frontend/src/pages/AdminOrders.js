import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Box, TableSortLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState({ orderId: null, type: null });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('orders_with_profile_and_listing')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to fetch orders: ' + error.message);
      console.error(error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleReturn = async (orderId, currentOrdersState = orders) => {
    setUpdatingId(orderId);

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Returned' })
      .eq('id', orderId);

    if (updateError) {
      setError('Failed to update order status.');
      console.error(updateError);
      setUpdatingId(null);
      return;
    }

    // Non-blocking call to sync listings for better UI responsiveness
    supabase.functions.invoke('sync-listings').then(({ error: funcError }) => {
      if (funcError) {
        console.error('Error syncing listings:', funcError.message);
      }
    });

    // Update local state to reflect the change
    setOrders(currentOrdersState.map(order =>
        order.id === orderId ? { ...order, status: 'Returned' } : order
      )
    );

    setUpdatingId(null);
  };

  const handlePayment = async (orderId, amount, type) => {
    setProcessingPayment({ orderId, type });

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setProcessingPayment({ orderId: null, type: null });
      return;
    }
    
    const currentAmountPaid = order.amount_paid || 0;
    const newAmountPaid = currentAmountPaid + amount;
    
    // Update amount_paid in Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({ amount_paid: newAmountPaid })
      .eq('id', orderId);

    if (updateError) {
      setError('Failed to update payment status.');
      console.error(updateError);
      setProcessingPayment({ orderId: null, type: null });
      return;
    }

    // Update local state immediately for UI responsiveness
    const updatedOrder = { ...order, amount_paid: newAmountPaid };
    const newOrdersState = orders.map(o => (o.id === orderId ? updatedOrder : o));
    setOrders(newOrdersState);
    setProcessingPayment({ orderId: null, type: null });

    // Removed: automatic status change to Returned
  };

  const renderPriceCell = (order, header) => {
    const price = order.price || 0;
    const extendPrice = order.extend_price || 0;
    const amountPaid = order.amount_paid || 0;
    const value = order[header];
    
    if (!value || value === 0) return '-';

    let showPaidButton = false;
    if (header === 'price') {
      // For price column, show button if amount_paid is less than price
      showPaidButton = amountPaid < price;
    } else if (header === 'extend_price') {
      // For extend_price column, only show button if:
      // 1. Base price is fully paid (amountPaid >= price)
      // 2. Extended price is not yet fully paid (amountPaid < price + extendPrice)
      showPaidButton = amountPaid >= price && amountPaid < (price + extendPrice);
    }

    return (
      <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
        <Typography>
          {value}
          {!showPaidButton && (
            <Typography component="span" color="success.main" sx={{ ml: 1, fontSize: '0.8em' }}>
              (Paid)
            </Typography>
          )}
        </Typography>
        {showPaidButton && (
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => handlePayment(order.id, value, header)}
            disabled={processingPayment.orderId === order.id && processingPayment.type === header}
          >
            {processingPayment.orderId === order.id && processingPayment.type === header 
              ? 'Processing...' 
              : 'Pay'}
          </Button>
        )}
      </Box>
    );
  };

  const originalHeaders = orders.length > 0 ? Object.keys(orders[0]) : [];
  
  const tableHeaders = [
    { key: 'id', label: 'Order ID' },
    { key: 'created_at', label: 'Order Date' },
    { key: 'user_id', label: 'User' },
    { key: 'listing_id', label: 'Book Title' },
    { key: 'status', label: 'Status' },
    { key: 'price', label: 'Price' },
    { key: 'extend_price', label: 'Extend Price' },
    { key: 'amount_paid', label: 'Amount Paid' },
  ].filter(header => originalHeaders.includes(header.key));


  return (
    <Container sx={{ py: 6 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mr: 2 }}>
          Back to Home
        </Button>
        <Typography variant="h4" fontWeight={700} flexGrow={1}>Admin: Orders Management</Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                {tableHeaders.map(header => (
                  <TableCell
                    key={header.key}
                    sortDirection={sortConfig.key === header.key ? sortConfig.direction : false}
                    sx={{ fontWeight: 'bold' }}
                  >
                    <TableSortLabel
                      active={sortConfig.key === header.key}
                      direction={sortConfig.key === header.key ? sortConfig.direction : 'asc'}
                      onClick={() => requestSort(header.key)}
                    >
                      {header.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders.map(order => (
                <TableRow key={order.id}>
                  {tableHeaders.map(header => (
                    <TableCell key={header.key}>
                      {header.key === 'status' && order.status === 'Ordered' ? (
                        <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
                          <Typography>{order.status}</Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleReturn(order.id)}
                            disabled={updatingId === order.id}
                          >
                            {updatingId === order.id ? 'Processing...' : 'Return'}
                          </Button>
                        </Box>
                      ) : header.key === 'price' || header.key === 'extend_price' ? (
                        renderPriceCell(order, header.key)
                      ) : header.key === 'user_id' ? (
                        order.user_full_name || order.user_id
                      ) : header.key === 'listing_id' ? (
                        order.book_title || order.listing_id
                      ) : (
                        typeof order[header.key] === 'boolean' ? String(order[header.key]) : order[header.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AdminOrders; 