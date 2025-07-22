import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { TextField, Button, Typography, Box, Alert, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Link from '@mui/material/Link';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter phone, 2: enter new password
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    // Convert phone to email format
    const email = `${phone.replace(/\s+/g, '')}@yourapp.com`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Login successful!');
      navigate('/');
    }
  };

  const handleForgotSubmit = async () => {
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    // Instead of checking user, show support message
    setForgotSuccess('Please contact support at +918884560710 to reset your password.');
    setForgotStep(3);
    setForgotLoading(false);
  };

  const handleForgotPasswordUpdate = async () => {
    // This should never be called now, but keep for safety
    setForgotError('Password reset is only available via support.');
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" align="center" flexGrow={1}>Login with Mobile Number</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleLogin}>
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
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}>
            Forgot Password?
          </Link>
        </Box>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          disabled={loading || !phone || !password}
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
      </form>
      <Dialog open={forgotOpen} onClose={() => { setForgotOpen(false); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent>
          {forgotStep === 1 && (
            <>
              <TextField
                label="Registered Mobile Number"
                variant="outlined"
                fullWidth
                value={forgotPhone}
                onChange={e => setForgotPhone(e.target.value)}
                placeholder="e.g. +911234567890"
                sx={{ mb: 2 }}
                required
              />
              {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
            </>
          )}
          {forgotStep === 3 && (
            <Alert severity="success" sx={{ mb: 2 }}>{forgotSuccess}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          {forgotStep === 1 && (
            <Button onClick={handleForgotSubmit} disabled={forgotLoading} variant="contained">Next</Button>
          )}
          {forgotStep === 3 && (
            <Button onClick={() => { setForgotOpen(false); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }} variant="contained">Back to Login</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
