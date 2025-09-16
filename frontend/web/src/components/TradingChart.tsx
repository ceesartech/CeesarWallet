'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Chip, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { motion } from 'framer-motion';

interface TradingChartProps {
  data: any[];
  symbol: string;
  timeframe: string;
  height?: number;
  theme?: 'light' | 'dark';
  onDataUpdate?: (data: any) => void;
  symbols?: string[];
  duration?: string;
  onSymbolChange?: (symbol: string) => void;
  onDurationChange?: (duration: string) => void;
  selectedSymbols?: string[]; // New prop for selected symbols
  onSymbolsChange?: (symbols: string[]) => void; // New prop for symbol selection
}

const TradingChart: React.FC<TradingChartProps> = ({
  data,
  symbol,
  timeframe,
  height = 400,
  theme = 'dark',
  onDataUpdate,
  symbols = [],
  duration = '1d',
  onSymbolChange,
  onDurationChange,
  selectedSymbols = [],
  onSymbolsChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use selectedSymbols from props instead of local state

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#0d1117' : '#ffffff' },
        textColor: theme === 'dark' ? '#f0f6fc' : '#24292f',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#30363d' : '#d0d7de' },
        horzLines: { color: theme === 'dark' ? '#30363d' : '#d0d7de' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: theme === 'dark' ? '#238636' : '#0969da',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: theme === 'dark' ? '#238636' : '#0969da',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#30363d' : '#d0d7de',
        textColor: theme === 'dark' ? '#8b949e' : '#656d76',
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#30363d' : '#d0d7de',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme === 'dark' ? '#238636' : '#0969da',
      downColor: theme === 'dark' ? '#da3633' : '#d1242f',
      borderVisible: false,
      wickUpColor: theme === 'dark' ? '#238636' : '#0969da',
      wickDownColor: theme === 'dark' ? '#da3633' : '#d1242f',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height]);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      // Transform data to candlestick format for lightweight-charts
      const safeData = Array.isArray(data) ? data : [];
      const chartData = safeData.map((item) => ({
        time: new Date(item.timestamp).getTime() / 1000 as any,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
      }));

      seriesRef.current.setData(chartData);
      setIsLoading(false);
      setError(null);

      if (onDataUpdate) {
        onDataUpdate(chartData);
      }
    } catch (err) {
      setError('Failed to process chart data');
      setIsLoading(false);
    }
  }, [data, onDataUpdate]);

  // Update comparison symbols
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      // Clear existing line series
      if (lineSeriesRefs.current && typeof lineSeriesRefs.current.forEach === 'function') {
        lineSeriesRefs.current.forEach((series) => {
          if (chartRef.current && series) {
            chartRef.current.removeSeries(series);
          }
        });
        lineSeriesRefs.current.clear();
      }

      // Add new line series for selected symbols
      const comparisonColors = [
        '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'
      ];
      
      const symbolsToProcess = Array.isArray(selectedSymbols) ? selectedSymbols : [];
      
      symbolsToProcess.forEach((sym, index) => {
        if (index < 5 && sym && typeof sym === 'string') { // Limit to 5 comparison symbols
          try {
            const lineSeries = chartRef.current?.addLineSeries({
              color: comparisonColors[index] || '#8b5cf6',
              lineWidth: 2,
              title: sym,
            });
            if (lineSeries && lineSeriesRefs.current) {
              lineSeriesRefs.current.set(sym, lineSeries);
              
              // Add mock data for demonstration
              const mockData = Array.from({ length: 50 }, (_, i) => ({
                time: (Date.now() / 1000) - (50 - i) * 3600 as any,
                value: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
              }));
              lineSeries.setData(mockData);
            }
          } catch (error) {
            console.warn('Error adding line series for symbol:', sym, error);
          }
        }
      });
    } catch (error) {
      console.warn('Error updating comparison symbols:', error);
    }
  }, [selectedSymbols]);

  // Update symbol and timeframe
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });
    }
  }, [symbol, timeframe]);

  if (error) {
    return (
      <Alert severity="error" sx={{ height: height }}>
        {error}
      </Alert>
    );
  }

  const durationOptions = [
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' },
  ];

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Chart Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 2
      }}>
        {/* Symbol Selection */}
        {symbols.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: theme === 'dark' ? '#f0f6fc' : '#24292f' }}>
              Symbol
            </InputLabel>
            <Select
              value={symbol}
              label="Symbol"
              onChange={(e) => onSymbolChange?.(e.target.value)}
              sx={{
                color: theme === 'dark' ? '#f0f6fc' : '#24292f',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#30363d' : '#d0d7de',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#238636' : '#0969da',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#238636' : '#0969da',
                },
              }}
            >
              {symbols.map((sym) => (
                <MenuItem key={sym} value={sym}>
                  {sym}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Duration Selection */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: theme === 'dark' ? '#f0f6fc' : '#24292f' }}>
            Time Period
          </InputLabel>
          <Select
            value={duration}
            label="Time Period"
            onChange={(e) => onDurationChange?.(e.target.value)}
            sx={{
              color: theme === 'dark' ? '#f0f6fc' : '#24292f',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme === 'dark' ? '#30363d' : '#d0d7de',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme === 'dark' ? '#238636' : '#0969da',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme === 'dark' ? '#238636' : '#0969da',
              },
            }}
          >
            {durationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Symbol Selection Dropdown */}
      {symbols.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ 
            color: theme === 'dark' ? '#8b949e' : '#656d76',
            mb: 1,
            fontWeight: 500
          }}>
            Select Symbols to Compare (max 5):
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel sx={{ color: theme === 'dark' ? '#f0f6fc' : '#24292f' }}>
              Add Symbol
            </InputLabel>
            <Select
              value=""
              label="Add Symbol"
                onChange={(e) => {
                  const newSymbol = e.target.value;
                  const currentSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];
                  if (newSymbol && !currentSymbols.includes(newSymbol) && currentSymbols.length < 5) {
                    onSymbolsChange?.([...currentSymbols, newSymbol]);
                  }
                }}
              sx={{
                color: theme === 'dark' ? '#f0f6fc' : '#24292f',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#30363d' : '#d0d7de',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#238636' : '#0969da',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme === 'dark' ? '#238636' : '#0969da',
                },
              }}
            >
              {(Array.isArray(symbols) ? symbols : [])
                .filter(sym => !(Array.isArray(selectedSymbols) ? selectedSymbols : []).includes(sym))
                .map((sym) => (
                  <MenuItem key={sym} value={sym}>
                    {sym}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Selected Symbols Visualization (Non-clickable) */}
        {Array.isArray(selectedSymbols) && selectedSymbols.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ 
            color: theme === 'dark' ? '#8b949e' : '#656d76',
            mb: 1,
            fontWeight: 500
          }}>
            Tracked Symbols:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(Array.isArray(selectedSymbols) ? selectedSymbols : []).map((sym, index) => {
              const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
              return (
                <Chip
                  key={sym}
                  label={sym}
                  variant="filled"
                  size="small"
                  onDelete={() => {
                    const currentSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];
                    onSymbolsChange?.(currentSymbols.filter(s => s !== sym));
                  }}
                  sx={{
                    backgroundColor: colors[index],
                    color: '#ffffff',
                    '& .MuiChip-deleteIcon': {
                      color: '#ffffff',
                      '&:hover': {
                        color: '#ffffff',
                        opacity: 0.8,
                      },
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}


      {/* Chart Container */}
      <Box sx={{ position: 'relative', width: '100%', height: height }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0.3 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            ref={chartContainerRef}
            style={{
              width: '100%',
              height: height,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          />
        </motion.div>
      </Box>
    </Box>
  );
};

export default TradingChart;