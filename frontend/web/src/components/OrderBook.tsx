import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface OrderBookProps {
  symbol?: string;
  theme?: 'light' | 'dark';
}

export const OrderBook: React.FC<OrderBookProps> = ({ symbol = 'AAPL', theme = 'dark' }) => {
  // Mock order book data
  const bids = [
    { price: 150.25, quantity: 100 },
    { price: 150.20, quantity: 200 },
    { price: 150.15, quantity: 150 },
    { price: 150.10, quantity: 300 },
    { price: 150.05, quantity: 250 },
  ];

  const asks = [
    { price: 150.30, quantity: 120 },
    { price: 150.35, quantity: 180 },
    { price: 150.40, quantity: 220 },
    { price: 150.45, quantity: 160 },
    { price: 150.50, quantity: 190 },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Book - {symbol}
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {asks.slice().reverse().map((ask, index) => (
              <TableRow key={`ask-${index}`} sx={{ backgroundColor: theme === 'dark' ? '#2d1b1b' : '#ffebee' }}>
                <TableCell sx={{ color: theme === 'dark' ? '#f44336' : '#d32f2f' }}>{ask.price}</TableCell>
                <TableCell>{ask.quantity}</TableCell>
                <TableCell>{(ask.price * ask.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: theme === 'dark' ? '#1b2d1b' : '#e8f5e8' }}>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Spread: {(asks[0].price - bids[0].price).toFixed(2)}
                </Typography>
              </TableCell>
            </TableRow>
            {bids.map((bid, index) => (
              <TableRow key={`bid-${index}`} sx={{ backgroundColor: theme === 'dark' ? '#1b2d1b' : '#e8f5e8' }}>
                <TableCell sx={{ color: theme === 'dark' ? '#4caf50' : '#2e7d32' }}>{bid.price}</TableCell>
                <TableCell>{bid.quantity}</TableCell>
                <TableCell>{(bid.price * bid.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
