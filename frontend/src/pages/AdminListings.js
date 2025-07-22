import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, CircularProgress, Box, Select, MenuItem, TableSortLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AdminListings = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editAvailable, setEditAvailable] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'ascending' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('listings').select('*');
      if (error) {
        setError('Failed to fetch books.');
        console.error(error);
      } else {
        setBooks(data);
      }
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const sortedBooks = useMemo(() => {
    let sortableBooks = [...books];
    if (sortConfig.key) {
      sortableBooks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBooks;
  }, [books, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAvailableChange = (id, value) => {
    setEditAvailable(prev => ({ ...prev, [id]: value }));
  };

  const handleAvailableSubmit = async (id) => {
    setUpdatingId(id);
    const value = editAvailable[id];
    const { error } = await supabase.from('listings').update({ available: value === 'Yes' }).eq('id', id);
    if (error) {
      alert('Error updating: ' + error.message);
      console.error('Listings update error:', error.message);
    } else {
      setBooks(prev => prev.map(book => book.id === id ? { ...book, available: value === 'Yes' } : book));
      setEditAvailable(prev => {
        const newEdit = { ...prev };
        delete newEdit[id];
        return newEdit;
      });
    }
    setUpdatingId(null);
  };

  const tableHeaders = [
    { label: 'Title', key: 'title' },
    { label: 'Available Quantity', key: 'available_quantity' },
    { label: 'Available', key: 'available' },
  ];

  return (
    <Container sx={{ py: 6 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mr: 2 }}>
          Back to Home
        </Button>
        <Typography variant="h4" fontWeight={700} flexGrow={1}>Admin: Listings Management</Typography>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
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
              {sortedBooks.map(book => {
                const isChanged = editAvailable[book.id] !== undefined && (editAvailable[book.id] === 'Yes') !== book.available;
                const editedValue = editAvailable[book.id] !== undefined ? editAvailable[book.id] : (book.available ? 'Yes' : 'No');

                return (
                  <TableRow key={book.id}>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.available_quantity}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Select
                          value={editedValue}
                          onChange={e => handleAvailableChange(book.id, e.target.value)}
                          size="small"
                          disabled={updatingId === book.id}
                        >
                          <MenuItem value="Yes">Yes</MenuItem>
                          <MenuItem value="No">No</MenuItem>
                        </Select>
                        {isChanged && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleAvailableSubmit(book.id)}
                            disabled={updatingId === book.id}
                          >
                            Submit
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AdminListings; 