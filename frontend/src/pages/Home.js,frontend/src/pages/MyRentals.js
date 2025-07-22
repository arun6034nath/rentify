import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions,
  Box, IconButton, Badge, Alert
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext';

const Home = () => {
  const { cart } = useCart();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hasOverdueRentals, setHasOverdueRentals] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        if (session.user.email.startsWith('+6034603484')) {
          setIsAdmin(true);
        } else {
          checkOverdueRentals(session.user.id);
        }
      }
    };

    fetchSession();

    if (location.state?.overdue) {
      setHasOverdueRentals(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        if (session.user.email.startsWith('+6034603484')) {
          setIsAdmin(true);
          setHasOverdueRentals(false);
        } else {
          setIsAdmin(false);
          checkOverdueRentals(session.user.id);
        }
      } else {
        setIsAdmin(false);
        setHasOverdueRentals(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [location.state]);

  const checkOverdueRentals = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'Ordered')
      .lt('end_date', today);

    if (error) {
      console.error('Error checking overdue rentals:', error);
      return;
    }

    if (data && data.length > 0) {
      setHasOverdueRentals(true);
    } else {
      setHasOverdueRentals(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Container sx={{ py: 6 }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main', color: 'white', mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rentify
          </Typography>
          <Button color="inherit" onClick={() => navigate('/cart')}>
            <Badge badgeContent={cart.length} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </Button>
          {user ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {hasOverdueRentals && (
        <Alert severity="error" sx={{ borderRadius: 0, justifyContent: 'center' }}>
          One or more orders are past the due date. Please return or extend them in 'My Rentals'.
        </Alert>
      )}

      {/* Hero Section */}
      <Box sx={{ bgcolor: '#e3f2fd', color: 'primary.main', p: { xs: 4, md: 8 }, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Rentify
        </Typography>
        <Typography variant="h6" component="p" paragraph>
          Discover amazing products to rent.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          View Products
        </Button>
      </Box>

      {/* Featured Products */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Featured Products
        </Typography>
        <Grid container spacing={4}>
          {/* Placeholder for product cards */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3">Product 1</Typography>
                <Typography variant="body2">Description for Product 1</Typography>
                <Typography variant="h5" component="h4" sx={{ mt: 2 }}>Price: $10/day</Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Rent Now</Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3">Product 2</Typography>
                <Typography variant="body2">Description for Product 2</Typography>
                <Typography variant="h5" component="h4" sx={{ mt: 2 }}>Price: $20/day</Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Rent Now</Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3">Product 3</Typography>
                <Typography variant="body2">Description for Product 3</Typography>
                <Typography variant="h5" component="h4" sx={{ mt: 2 }}>Price: $5/day</Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Rent Now</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Container>
  );
};

export default Home; 