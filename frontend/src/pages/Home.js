import React, { useEffect, useState, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Paper, CircularProgress, Alert, IconButton, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { supabase } from '../supabaseClient';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Badge from '@mui/material/Badge';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

const features = [
  {
    icon: <MenuBookIcon fontSize="large" color="primary" />,
    title: 'Popular Collection',
    desc: 'Your favourite books across all genres and categories',
  },
  {
    icon: <AccessTimeIcon fontSize="large" color="success" />,
    title: 'Flexible Rentals',
    desc: 'Weekly or monthly rental options',
  },
  {
    icon: <VerifiedUserIcon fontSize="large" color="warning" />,
    title: 'Quality Guaranteed',
    desc: 'All books are carefully maintained and sanitized',
  },
  {
    icon: <GroupIcon fontSize="large" color="secondary" />,
    title: 'Community',
    desc: 'Join thousands of book lovers like you',
  },
];

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const featuredRef = useRef(null);
  const [descDialogOpen, setDescDialogOpen] = useState(false);
  const [descDialogContent, setDescDialogContent] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [cartDialogBook, setCartDialogBook] = useState(null);
  const [cartDialogFrequency, setCartDialogFrequency] = useState('weekly');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dialogImageUrl, setDialogImageUrl] = useState('');
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState(null);
  const isAdminMenuOpen = Boolean(adminMenuAnchorEl);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };
  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  const handleImageClick = (url) => {
    setDialogImageUrl(url);
    setImageDialogOpen(true);
  };
  const handleDialogClose = () => {
    setImageDialogOpen(false);
    setDialogImageUrl('');
  };

  const handleAdminMenuOpen = (event) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };
  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };
  const handleAdminMenuSelect = (route) => {
    handleAdminMenuClose();
    if (route === 'logout') {
      handleLogout();
    } else {
      navigate(route);
    }
  };

  const handleContactDialogOpen = () => {
    setContactDialogOpen(true);
  };
  const handleContactDialogClose = () => {
    setContactDialogOpen(false);
  };

  const handleScroll = () => {
    const scrollTop = window.pageYOffset;
    setShowBackToTop(scrollTop > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      let query = supabase.from('listings').select('*');
      if (!viewAll) {
        query = query.limit(12);
      }
      const { data, error } = await query;
      if (error) {
        setError('Failed to load featured books.');
        setBooks([]);
      } else {
        setBooks(data || []);
        // Extract unique subcategories for filter
        const uniqueSubs = Array.from(new Set((data || []).map(b => b.subcategory).filter(Boolean)));
        setSubcategories(uniqueSubs);
      }
      setLoading(false);
    };
    fetchBooks();
    // Fetch user on mount
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user && data.user.email === '+6034603484@yourapp.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    fetchUser();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewAll]);

  // Filter books by selected subcategory and search term
  const filteredBooks = books
    .filter(book => selectedSubcategory === 'All' || book.subcategory === selectedSubcategory)
    .filter(book =>
      searchTerm.trim() === '' ||
      (book.title && book.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    );

  // Apply View All/View Less logic
  const displayedBooks = viewAll ? filteredBooks : filteredBooks.slice(0, 12);

  // Handler for Browse Catalog button
  const handleBrowseCatalog = () => {
    if (featuredRef.current) {
      featuredRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setViewAll(true); // Always show all when searching
  };

  // Handler for opening description dialog
  const handleOpenDescDialog = (desc) => {
    setDescDialogContent(desc);
    setDescDialogOpen(true);
  };
  const handleCloseDescDialog = () => {
    setDescDialogOpen(false);
    setDescDialogContent('');
  };

  // Handler for Add to Cart button
  const handleAddToCartClick = (book) => {
    setCartDialogBook(book);
    setCartDialogFrequency('weekly');
    setCartDialogOpen(true);
  };
  const handleCartDialogClose = () => {
    setCartDialogOpen(false);
    setCartDialogBook(null);
  };
  const handleCartDialogConfirm = () => {
    if (!cartDialogBook) return;
    const price = cartDialogFrequency === 'weekly'
      ? parseInt(cartDialogBook.price_per_week, 10)
      : parseInt(cartDialogBook.price_per_month, 10);
    addToCart({
      id: cartDialogBook.id,
      title: cartDialogBook.title,
      frequency: cartDialogFrequency,
      price,
    });
    setCartDialogOpen(false);
    setCartDialogBook(null);
  };

  const totalQuantity = cart.length;

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar position="static" color="inherit" elevation={1} sx={{ mb: 2 }}>
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f3c7b', mr: 2 }}>
              Rentify
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            {isAdmin ? (
              <>
                <IconButton color="inherit" onClick={handleAdminMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={adminMenuAnchorEl}
                  open={isAdminMenuOpen}
                  onClose={handleAdminMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={() => handleAdminMenuSelect('/admin-listings')}>Listings</MenuItem>
                  <MenuItem onClick={() => handleAdminMenuSelect('/admin-orders')}>Orders</MenuItem>
                  <MenuItem onClick={() => handleAdminMenuSelect('/admin-users')}>Users</MenuItem>
                  <MenuItem onClick={() => handleAdminMenuSelect('logout')}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <IconButton color="inherit" sx={{ mx: 1 }} onClick={() => navigate('/cart')}>
                  {totalQuantity > 0 ? (
                    <Badge badgeContent={totalQuantity} color="error">
                      <ShoppingCartIcon />
                    </Badge>
                  ) : (
                    <ShoppingCartIcon />
                  )}
                </IconButton>
                {user && (
                  <Button color="inherit" sx={{ mx: 1, fontWeight: 500 }} onClick={() => navigate('/my-rentals')}>My Rentals</Button>
                )}
                {user ? (
                  <Button color="error" variant="outlined" sx={{ fontWeight: 600, ml: 1 }} onClick={handleLogout}>
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button color="inherit" sx={{ mx: 1, fontWeight: 500 }} onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="contained" color="primary" sx={{ ml: 1, fontWeight: 700, borderRadius: 2 }} onClick={() => navigate('/signup')}>Sign Up</Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ background: 'linear-gradient(90deg, #0f3c7b 0%, #2563eb 100%)', color: 'white', py: isMobile ? 1 : 1.5 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant={isMobile ? 'h5' : 'h3'} fontWeight={700} gutterBottom>
            Discover Your Next Great Read
          </Typography>
          <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ mb: isMobile ? 1 : 0.75 }}>
            Read More, Spend Less - your favourite books available at affordable rent and flexible duration within our society
          </Typography>
        </Container>
      </Box>

      {/* Featured Books Section */}
      <Container sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 700, mb: 4 }}>
          Featured Books
        </Typography>

        {/* Desktop Controls */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>Filter by:</Typography>
                <Select value={selectedSubcategory} onChange={e => setSelectedSubcategory(e.target.value)} size="small" sx={{ minWidth: 150 }}>
                    <MenuItem value="All">All Categories</MenuItem>
                    {subcategories.map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                </Select>
                <TextField
                    label="Search by title"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    sx={{ width: { md: 450 } }} // 3x typical 150px width
                />
            </Box>
            {filteredBooks.length > 6 && (
                <Button onClick={() => setViewAll(!viewAll)}>
                    {viewAll ? 'View Less' : 'View All'}
                </Button>
            )}
        </Box>

        {/* Mobile Controls */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth sx={{ flex: 1 }}>
                    <Select value={selectedSubcategory} onChange={e => setSelectedSubcategory(e.target.value)} size="small">
                        <MenuItem value="All">All Categories</MenuItem>
                        {subcategories.map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                    </Select>
                </FormControl>
                {filteredBooks.length > 6 && (
                    <Button variant="outlined" onClick={() => setViewAll(!viewAll)} sx={{ flex: 1 }}>
                        {viewAll ? 'View Less' : 'View All'}
                    </Button>
                )}
            </Box>
            <TextField
                label="Search by title"
                variant="outlined"
                fullWidth
                size="small"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </Box>

        <Grid container spacing={4}>
          {displayedBooks.map((book) => (
            <Grid item key={book.id} xs={12} sm={6} md={4}>
              <Paper elevation={2} sx={{ p: 0, borderRadius: 3, height: isMobile ? 340 : 420, width: isMobile ? '100%' : 320, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: isMobile ? '0' : '0 auto' }}>
                {/* Book Image */}
                {book.image_url ? (
                  <Box sx={{ cursor: 'pointer', width: '100%', height: isMobile ? 120 : 200, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }} onClick={() => handleImageClick(book.image_url)}>
                    <img
                      src={book.image_url}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ height: isMobile ? 120 : 200, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MenuBookIcon sx={{ fontSize: isMobile ? 40 : 60, color: '#bdbdbd' }} />
                  </Box>
                )}
                <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Subcategory and Status Badges */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ background: '#e3eafd', color: '#2563eb', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                      {book.subcategory || 'Genre'}
                    </Typography>
                    <Typography variant="caption" sx={{ background: book.available === false ? '#f87171' : '#0f172a', color: book.available === false ? 'white' : 'white', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                      {book.available === false ? 'Unavailable' : (book.status || 'Available')}
                    </Typography>
                  </Box>
                  {/* Title */}
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.title || 'Book Title'}
                  </Typography>
                  {/* Author */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    by {book.author || 'Author'}
                  </Typography>
                  {/* Description with [..] and popup */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: 36, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.description && book.description.length > 40
                      ? <>
                          {book.description.slice(0, 40)}<span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => handleOpenDescDialog(book.description)}>[..]</span>
                        </>
                      : book.description || 'No description available.'}
                  </Typography>
                  {/* Pricing and Condition */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="success.main" fontWeight={700}>
                        {book.price_per_week ? `Rs.${parseInt(book.price_per_week, 10)}/week` : ''}
                      </Typography>
                      {book.price_per_week && book.price_per_month && (
                        <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ mx: 0.5 }}>
                          or
                        </Typography>
                      )}
                      <Typography variant="body2" color="primary.main" fontWeight={700}>
                        {book.price_per_month ? `Rs.${parseInt(book.price_per_month, 10)}/month` : ''}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ background: '#f3f4f6', color: '#6b7280', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                      {book.item_condition || ''}
                    </Typography>
                  </Box>
                  {/* Add to Cart Button or Unavailable Message */}
                  {book.available === false ? (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="error" fontWeight={700}>Will be available soon</Typography>
                    </Box>
                  ) : (
                    <Button variant="contained" fullWidth sx={{ mt: 1, background: '#0f172a', color: 'white', fontWeight: 700, textTransform: 'none', py: 1 }} onClick={() => handleAddToCartClick(book)}>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MenuBookIcon sx={{ fontSize: 20, mr: 1 }} /> Add to Cart
                      </Box>
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {/* Description Dialog */}
        <Dialog open={descDialogOpen} onClose={handleCloseDescDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Book Description
            <IconButton
              aria-label="close"
              onClick={handleCloseDescDialog}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1">{descDialogContent}</Typography>
          </DialogContent>
        </Dialog>
        {/* Add to Cart Dialog */}
        <Dialog open={cartDialogOpen} onClose={handleCartDialogClose} maxWidth="xs" fullWidth>
          <DialogTitle>Select Rental Frequency</DialogTitle>
          <DialogContent>
            <RadioGroup
              value={cartDialogFrequency}
              onChange={e => setCartDialogFrequency(e.target.value)}
            >
              <FormControlLabel value="weekly" control={<Radio />} label={`Weekly (${cartDialogBook ? `Rs.${cartDialogBook.price_per_week}` : ''})`} />
              <FormControlLabel value="monthly" control={<Radio />} label={`Monthly (${cartDialogBook ? `Rs.${cartDialogBook.price_per_month}` : ''})`} />
            </RadioGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCartDialogClose}>Cancel</Button>
            <Button variant="contained" onClick={handleCartDialogConfirm} disabled={!cartDialogBook}>Confirm</Button>
          </DialogActions>
        </Dialog>
        {/* Image Dialog Popup */}
        <Dialog open={imageDialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle sx={{ m: 0, p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <span>Book Image</span>
              <IconButton aria-label="close" onClick={handleDialogClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
            {dialogImageUrl && (
              <img src={dialogImageUrl} alt="Book Full" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
            )}
          </DialogContent>
        </Dialog>
      </Container>

      {/* Features Section (Why Choose Rentify) - moved below Featured Books */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
          Why Choose Rentify?
        </Typography>
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Box textAlign="center">
                {feature.icon}
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action Footer */}
      <Box sx={{ background: 'linear-gradient(90deg, #ff7e1b 0%, #ffb347 100%)', color: 'white', py: 6, mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Want to Rent out your books?
        </Typography>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Reach out to thousands of readers who trust Rentify for their reading needs
        </Typography>
        <Button variant="contained" color="default" size="large" sx={{ background: 'white', color: '#ff7e1b', fontWeight: 700 }} onClick={handleContactDialogOpen}>
          Sign Up Today
        </Button>
      </Box>

      {/* Back to Top Button */}
      <Zoom in={showBackToTop}>
        <Fab
          color="primary"
          size="large"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: '#0f3c7b',
            '&:hover': {
              bgcolor: '#2563eb'
            }
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={handleContactDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Contact to List Your Books
          <IconButton
            aria-label="close"
            onClick={handleContactDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Arunangshu Nath
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            WA: +918884560710
          </Typography>
          <Typography variant="body1">
            Halcyon I-2401
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Home;
