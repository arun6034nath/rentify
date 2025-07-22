import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Box, TableSortLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, tower, apartment_number');

      if (error) {
        setError('Failed to fetch users: ' + error.message);
        console.error(error);
        setUsers([]);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const tableHeaders = [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Tower', key: 'tower' },
    { label: 'Apartment Number', key: 'apartment_number' },
  ];

  return (
    <Container sx={{ py: 6 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mr: 2 }}>
          Back to Home
        </Button>
        <Typography variant="h4" fontWeight={700} flexGrow={1}>Admin: Users</Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
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
              {sortedUsers.map((user, index) => (
                <TableRow key={index}>
                  {tableHeaders.map(header => (
                    <TableCell key={header.key}>{user[header.key]}</TableCell>
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

export default AdminUsers; 