import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { TextField, Button, Typography, Box, Alert, CircularProgress, MenuItem, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const towerOptions = [
  'BCU-Eden',
  'BCU-Serene',
  'BCU-Halcyon',
  'BCU-Tranquil',
  'BCU-Paradise',
];

const Signup = () => {
  const [name, setName] = useState('');
  const [tower, setTower] = useState('');
  const [apartment, setApartment] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!name || !tower || !apartment || !phone || !password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    // Convert phone to email format
    const email = `${phone.replace(/\s+/g, '')}@yourapp.com`;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Insert into profiles table
    const userId = data?.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: name,
        tower: tower,
        apartment_number: apartment,
        phone,
      });
      if (profileError) {
        setError('Signup succeeded but failed to save profile: ' + profileError.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setSuccess('Signup successful!');
    // Optionally redirect or refresh user state here
  };

  return (
    <Box maxWidth={440} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate('/')}
          sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" align="center" flexGrow={1}>Sign Up with Mobile Number</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      ) : (
        <form onSubmit={handleSignup}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Mobile Number"
            variant="outlined"
            fullWidth
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. +911234567890"
            sx={{ mb: 2 }}
            required
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Tower"
              variant="outlined"
              fullWidth
              value={tower}
              onChange={e => setTower(e.target.value)}
              required
              sx={{ flex: 1 }}
            >
              {towerOptions.map(option => (
                <MenuItem value={option} key={option} sx={{ fontSize: 18 }}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Apartment Number"
              variant="outlined"
              fullWidth
              value={apartment}
              onChange={e => setApartment(e.target.value)}
              placeholder="e.g. I-2401"
              required
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            passwords should be more than 6 characters/digits
          </Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
        </form>
      )}
    </Box>
  );
};

export default Signup;
