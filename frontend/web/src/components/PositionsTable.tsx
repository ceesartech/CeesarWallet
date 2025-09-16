import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Position } from '../types/trading';

interface PositionsTableProps {
  positions?: Position[];
  theme?: 'light' | 'dark';
}

export const PositionsTable: React.FC<PositionsTableProps> = ({ positions = [], theme = 'dark' }) => {
  // Mock positions data if none provided
  const mockPositions: Position[] = positions.length > 0 ? positions : [
    {
      id: '1',
      symbol: 'AAPL',
      side: 'long',
      quantity: 100,
      entryPrice: 150.00,
      currentPrice: 152.50,
      unrealizedPnL: 250.00,
      timestamp: Date.now(),
    },
    {
      id: '2',
      symbol: 'TSLA',
      side: 'short',
      quantity: 50,
      entryPrice: 200.00,
      currentPrice: 195.00,
      unrealizedPnL: 250.00,
      timestamp: Date.now(),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Open Positions ({mockPositions.length})
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>PnL</TableCell>
              <TableCell>PnL %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockPositions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {position.symbol}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={position.side.toUpperCase()}
                    color={position.side === 'long' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{position.quantity}</TableCell>
                <TableCell>${position.entryPrice.toFixed(2)}</TableCell>
                <TableCell>${position.currentPrice.toFixed(2)}</TableCell>
                <TableCell sx={{ 
                  color: position.unrealizedPnL >= 0 ? 
                    (theme === 'dark' ? '#4caf50' : '#2e7d32') : 
                    (theme === 'dark' ? '#f44336' : '#d32f2f')
                }}>
                  ${position.unrealizedPnL.toFixed(2)}
                </TableCell>
                <TableCell sx={{ 
                  color: position.unrealizedPnL >= 0 ? 
                    (theme === 'dark' ? '#4caf50' : '#2e7d32') : 
                    (theme === 'dark' ? '#f44336' : '#d32f2f')
                }}>
                  {((position.unrealizedPnL / (position.entryPrice * position.quantity)) * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
