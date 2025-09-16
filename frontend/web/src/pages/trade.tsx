'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
  Info,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AppNavigation from '../components/AppNavigation';

// Modern color scheme inspired by Linear
const TRADE_COLORS = {
  background: '#0a0a0a',
  backgroundGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
  surface: '#1a1a1a',
  surfaceElevated: '#2a2a2a',
  glass: 'rgba(26, 26, 26, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  accent: '#238636',
  accentGradient: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
  accentHover: '#2ea043',
  accentGlow: 'rgba(35, 134, 54, 0.3)',
  success: '#2ea043',
  warning: '#f85149',
  error: '#f85149',
  border: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowElevated: 'rgba(0, 0, 0, 0.5)',
};

const TradePage: React.FC = () => {
  const router = useRouter();
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA'];

  const handleSubmit = () => {
    // Simulate trade submission
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: TRADE_COLORS.backgroundGradient,
      color: TRADE_COLORS.textPrimary,
      p: 3,
    }}>
      <AppNavigation currentPage="trade" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{ 
              color: TRADE_COLORS.textSecondary,
              mr: 2,
              '&:hover': {
                backgroundColor: TRADE_COLORS.surfaceElevated,
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ 
            fontWeight: 700,
            background: TRADE_COLORS.accentGradient,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            New Trade
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Trade Form */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{
              background: TRADE_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${TRADE_COLORS.glassBorder}`,
              borderRadius: 4,
              boxShadow: `0 20px 40px ${TRADE_COLORS.shadowElevated}`,
            }}>
              <CardHeader
                title={
                  <Typography variant="h5" sx={{ 
                    color: TRADE_COLORS.textPrimary,
                    fontWeight: 600,
                  }}>
                    Place Order
                  </Typography>
                }
                subheader="Execute your trading strategy"
              />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Order Type */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: TRADE_COLORS.textSecondary }}>
                        Order Type
                      </InputLabel>
                      <Select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        sx={{
                          color: TRADE_COLORS.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.glassBorder,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                        }}
                      >
                        <MenuItem value="market">Market Order</MenuItem>
                        <MenuItem value="limit">Limit Order</MenuItem>
                        <MenuItem value="stop">Stop Order</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Side */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: TRADE_COLORS.textSecondary }}>
                        Side
                      </InputLabel>
                      <Select
                        value={side}
                        onChange={(e) => setSide(e.target.value)}
                        sx={{
                          color: TRADE_COLORS.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.glassBorder,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                        }}
                      >
                        <MenuItem value="buy">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUp sx={{ color: TRADE_COLORS.success, mr: 1 }} />
                            Buy
                          </Box>
                        </MenuItem>
                        <MenuItem value="sell">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingDown sx={{ color: TRADE_COLORS.warning, mr: 1 }} />
                            Sell
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Symbol */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: TRADE_COLORS.textSecondary }}>
                        Symbol
                      </InputLabel>
                      <Select
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        sx={{
                          color: TRADE_COLORS.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.glassBorder,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: TRADE_COLORS.accent,
                          },
                        }}
                      >
                        {symbols.map((sym) => (
                          <MenuItem key={sym} value={sym}>{sym}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: TRADE_COLORS.textPrimary,
                          '& fieldset': {
                            borderColor: TRADE_COLORS.glassBorder,
                          },
                          '&:hover fieldset': {
                            borderColor: TRADE_COLORS.accent,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: TRADE_COLORS.accent,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: TRADE_COLORS.textSecondary,
                        },
                      }}
                    />
                  </Grid>

                  {/* Price (for limit orders) */}
                  {orderType === 'limit' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Limit Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: TRADE_COLORS.textPrimary,
                            '& fieldset': {
                              borderColor: TRADE_COLORS.glassBorder,
                            },
                            '&:hover fieldset': {
                              borderColor: TRADE_COLORS.accent,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: TRADE_COLORS.accent,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: TRADE_COLORS.textSecondary,
                          },
                        }}
                      />
                    </Grid>
                  )}

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={!quantity || (orderType === 'limit' && !price)}
                      sx={{
                        background: TRADE_COLORS.accentGradient,
                        color: TRADE_COLORS.textPrimary,
                        py: 2,
                        borderRadius: 2,
                        boxShadow: `0 8px 32px ${TRADE_COLORS.accentGlow}`,
                        '&:hover': {
                          background: TRADE_COLORS.accentHover,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${TRADE_COLORS.accentGlow}`,
                        },
                        '&:disabled': {
                          background: TRADE_COLORS.surfaceElevated,
                          color: TRADE_COLORS.textSecondary,
                        },
                      }}
                    >
                      {side === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{
              background: TRADE_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${TRADE_COLORS.glassBorder}`,
              borderRadius: 4,
              boxShadow: `0 20px 40px ${TRADE_COLORS.shadowElevated}`,
            }}>
              <CardHeader
                title={
                  <Typography variant="h6" sx={{ 
                    color: TRADE_COLORS.textPrimary,
                    fontWeight: 600,
                  }}>
                    Order Summary
                  </Typography>
                }
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                    Symbol
                  </Typography>
                  <Typography variant="h6" sx={{ color: TRADE_COLORS.textPrimary }}>
                    {symbol}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                    Side
                  </Typography>
                  <Chip
                    label={side.toUpperCase()}
                    color={side === 'buy' ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                    Order Type
                  </Typography>
                  <Typography variant="body1" sx={{ color: TRADE_COLORS.textPrimary }}>
                    {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                    Quantity
                  </Typography>
                  <Typography variant="body1" sx={{ color: TRADE_COLORS.textPrimary }}>
                    {quantity || '0'} shares
                  </Typography>
                </Box>

                {orderType === 'limit' && price && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                      Limit Price
                    </Typography>
                    <Typography variant="body1" sx={{ color: TRADE_COLORS.textPrimary }}>
                      ${price}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2, borderColor: TRADE_COLORS.glassBorder }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: TRADE_COLORS.textSecondary }}>
                    Estimated Total
                  </Typography>
                  <Typography variant="h6" sx={{ color: TRADE_COLORS.textPrimary }}>
                    ${orderType === 'market' ? 'Market Price' : (parseFloat(price || '0') * parseFloat(quantity || '0')).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{
            background: TRADE_COLORS.success,
            color: TRADE_COLORS.textPrimary,
            '& .MuiAlert-icon': {
              color: TRADE_COLORS.textPrimary,
            },
          }}
        >
          Order placed successfully! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TradePage;
