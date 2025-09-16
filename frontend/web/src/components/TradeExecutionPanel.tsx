'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useExecuteTradeMutation, useGetMarketDataQuery } from '../store/api/tradingApi';
import { useAppSelector } from '../store/hooks';

// Validation schema
const tradeSchema = z.object({
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).default('GTC'),
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeExecutionPanelProps {
  symbol: string;
  onTradeExecuted?: (trade: any) => void;
}

const TradeExecutionPanel: React.FC<TradeExecutionPanelProps> = ({
  symbol,
  onTradeExecuted,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: marketData } = useGetMarketDataQuery({
    symbol,
    interval: '1m',
    limit: 1,
  });

  const [executeTrade] = useExecuteTradeMutation();
  const { portfolio } = useAppSelector((state) => state.portfolio);

  const currentPrice = marketData?.[0]?.close || 0;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      side: 'BUY',
      quantity: 0,
      orderType: 'MARKET',
      timeInForce: 'GTC',
    },
  });

  const watchedOrderType = watch('orderType');
  const watchedSide = watch('side');

  const onSubmit = async (data: TradeFormData) => {
    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      // Create trade signal
      const tradeSignal = {
        symbol,
        side: data.side,
        quantity: data.quantity,
        orderType: data.orderType,
        price: data.price,
        stopPrice: data.stopPrice,
        timeInForce: data.timeInForce,
        timestamp: new Date().toISOString(),
        modelName: 'manual',
      };

      // Execute trade
      const result = await executeTrade({
        signalId: `manual_${Date.now()}`,
        broker: 'alpaca', // Default broker
      }).unwrap();

      setExecutionResult(result);
      
      if (onTradeExecuted) {
        onTradeExecuted(result);
      }

      // Reset form
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to execute trade');
    } finally {
      setIsExecuting(false);
    }
  };

  const calculateTotal = (quantity: number, price?: number) => {
    const effectivePrice = price || currentPrice;
    return quantity * effectivePrice;
  };

  const getAvailableBalance = () => {
    if (!portfolio) return 0;
    return portfolio.balance;
  };

  const canAffordTrade = (quantity: number, price?: number) => {
    const total = calculateTotal(quantity, price);
    return total <= getAvailableBalance();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Execute Trade
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Symbol Display */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight="bold">
                  {symbol}
                </Typography>
                <Chip
                  label={`$${currentPrice.toFixed(2)}`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Grid>

            {/* Side Selection */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Side</InputLabel>
                <Controller
                  name="side"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Side">
                      <MenuItem value="BUY">Buy</MenuItem>
                      <MenuItem value="SELL">Sell</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Order Type */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Controller
                  name="orderType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Order Type">
                      <MenuItem value="MARKET">Market</MenuItem>
                      <MenuItem value="LIMIT">Limit</MenuItem>
                      <MenuItem value="STOP">Stop</MenuItem>
                      <MenuItem value="STOP_LIMIT">Stop Limit</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12}>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity"
                    type="number"
                    fullWidth
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            {/* Price (for Limit orders) */}
            {(watchedOrderType === 'LIMIT' || watchedOrderType === 'STOP_LIMIT') && (
              <Grid item xs={12}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Price"
                      type="number"
                      fullWidth
                      error={!!errors.price}
                      helperText={errors.price?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Stop Price (for Stop orders) */}
            {(watchedOrderType === 'STOP' || watchedOrderType === 'STOP_LIMIT') && (
              <Grid item xs={12}>
                <Controller
                  name="stopPrice"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stop Price"
                      type="number"
                      fullWidth
                      error={!!errors.stopPrice}
                      helperText={errors.stopPrice?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Time in Force */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Time in Force</InputLabel>
                <Controller
                  name="timeInForce"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Time in Force">
                      <MenuItem value="GTC">Good Till Canceled</MenuItem>
                      <MenuItem value="IOC">Immediate or Cancel</MenuItem>
                      <MenuItem value="FOK">Fill or Kill</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Trade Summary */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${calculateTotal(watch('quantity'), watch('price')).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Available Balance:</Typography>
                <Typography variant="body2">
                  ${getAvailableBalance().toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Error Display */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {/* Success Display */}
            {executionResult && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Trade executed successfully! Order ID: {executionResult.orderId}
                </Alert>
              </Grid>
            )}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isExecuting || !isValid || !canAffordTrade(watch('quantity'), watch('price'))}
                sx={{ height: 48 }}
              >
                {isExecuting ? (
                  <CircularProgress size={24} />
                ) : (
                  `${watchedSide} ${symbol}`
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradeExecutionPanel;
