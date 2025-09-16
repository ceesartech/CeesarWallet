'use client';

import React, { useState, useEffect } from 'react';
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
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  TrendingDown,
  FilterList,
  Refresh,
  Star,
  StarBorder,
  Visibility,
  Add,
  Remove,
  VolumeUp,
  VolumeOff,
  Speed,
  ShowChart,
  BarChart,
  PieChart,
  Timeline,
  AttachMoney,
  Warning,
  CheckCircle,
  Error,
  Info,
  PlayArrow,
  Pause,
  Stop,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AppNavigation from '../components/AppNavigation';

// Enhanced 3D theme colors with gradients
const LINEAR_COLORS = {
  background: '#0d1117',
  backgroundGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
  surface: '#161b22',
  surfaceElevated: '#21262d',
  surfaceGradient: 'linear-gradient(145deg, #161b22 0%, #21262d 100%)',
  surfaceHover: 'linear-gradient(145deg, #21262d 0%, #30363d 100%)',
  border: '#30363d',
  borderGlow: 'rgba(35, 134, 54, 0.3)',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  accent: '#238636',
  accentGradient: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
  accentHover: '#2ea043',
  accentGlow: 'rgba(35, 134, 54, 0.4)',
  danger: '#da3633',
  dangerGradient: 'linear-gradient(135deg, #da3633 0%, #f85149 100%)',
  warning: '#d29922',
  warningGradient: 'linear-gradient(135deg, #d29922 0%, #f0c674 100%)',
  info: '#58a6ff',
  infoGradient: 'linear-gradient(135deg, #58a6ff 0%, #79c0ff 100%)',
  success: '#238636',
  successGradient: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowElevated: 'rgba(0, 0, 0, 0.6)',
};

const MarketScanner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('stocks');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedFilters, setSelectedFilters] = useState({
    minVolume: 1000000,
    maxPrice: 1000,
    minPrice: 1,
    minChange: -10,
    maxChange: 10,
    marketCap: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<any>(null);
  const [showSymbolDetails, setShowSymbolDetails] = useState(false);

  // Mock data for demonstration
  const mockScanResults = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 185.25,
      change: 2.35,
      changePercent: 1.28,
      volume: 45000000,
      marketCap: 2900000000000,
      sector: 'Technology',
      rsi: 65.4,
      macd: 1.25,
      signal: 'bullish',
      trend: 'up',
      volatility: 0.18,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 245.80,
      change: -5.20,
      changePercent: -2.07,
      volume: 32000000,
      marketCap: 780000000000,
      sector: 'Automotive',
      rsi: 45.2,
      macd: -0.85,
      signal: 'bearish',
      trend: 'down',
      volatility: 0.35,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 520.75,
      change: 15.30,
      changePercent: 3.03,
      volume: 28000000,
      marketCap: 1300000000000,
      sector: 'Technology',
      rsi: 72.1,
      macd: 2.15,
      signal: 'bullish',
      trend: 'up',
      volatility: 0.28,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 380.50,
      change: 1.85,
      changePercent: 0.49,
      volume: 22000000,
      marketCap: 2800000000000,
      sector: 'Technology',
      rsi: 58.7,
      macd: 0.45,
      signal: 'neutral',
      trend: 'sideways',
      volatility: 0.15,
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 155.20,
      change: -2.10,
      changePercent: -1.33,
      volume: 18000000,
      marketCap: 1600000000000,
      sector: 'Consumer Discretionary',
      rsi: 42.8,
      macd: -0.65,
      signal: 'bearish',
      trend: 'down',
      volatility: 0.22,
    },
  ];

  const markets = [
    { id: 'stocks', name: 'Stocks', icon: <ShowChart /> },
    { id: 'crypto', name: 'Cryptocurrency', icon: <AttachMoney /> },
    { id: 'forex', name: 'Forex', icon: <Timeline /> },
    { id: 'commodities', name: 'Commodities', icon: <BarChart /> },
  ];

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  const sectors = [
    'Technology', 'Healthcare', 'Financial', 'Consumer Discretionary',
    'Industrial', 'Energy', 'Materials', 'Utilities', 'Real Estate',
    'Consumer Staples', 'Communication Services'
  ];

  useEffect(() => {
    // Simulate scanning process
    if (isScanning) {
      const timer = setTimeout(() => {
        setScanResults(mockScanResults);
        setIsScanning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResults([]);
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleAddToWatchlist = (symbol: string) => {
    setWatchlist(prev => [...prev, symbol]);
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  const handleViewSymbol = (symbol: any) => {
    setSelectedSymbol(symbol);
    setShowSymbolDetails(true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return LINEAR_COLORS.success;
      case 'bearish': return LINEAR_COLORS.danger;
      case 'neutral': return LINEAR_COLORS.warning;
      default: return LINEAR_COLORS.textSecondary;
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish': return <TrendingUp />;
      case 'bearish': return <TrendingDown />;
      case 'neutral': return <Timeline />;
      default: return <Info />;
    }
  };

  const filteredResults = scanResults.filter(result => {
    const matchesSearch = searchQuery === '' || 
      result.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVolume = result.volume >= selectedFilters.minVolume;
    const matchesPrice = result.price >= selectedFilters.minPrice && result.price <= selectedFilters.maxPrice;
    const matchesChange = result.changePercent >= selectedFilters.minChange && result.changePercent <= selectedFilters.maxChange;
    
    return matchesSearch && matchesVolume && matchesPrice && matchesChange;
  });

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: LINEAR_COLORS.backgroundGradient,
      color: LINEAR_COLORS.textPrimary,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(35, 134, 54, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(88, 166, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <AppNavigation currentPage="scanner" />
      
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{
            background: LINEAR_COLORS.surfaceGradient,
            border: `1px solid ${LINEAR_COLORS.border}`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}, inset 0 1px 0 ${LINEAR_COLORS.borderGlow}`,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    background: LINEAR_COLORS.accentGradient,
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                  }}>
                    <Search />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: LINEAR_COLORS.textPrimary,
                      background: LINEAR_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Market Scanner
                    </Typography>
                    <Typography variant="body1" sx={{ color: LINEAR_COLORS.textSecondary }}>
                      Discover trading opportunities across markets
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Advanced Filters" arrow>
                    <IconButton
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{
                        color: showFilters ? LINEAR_COLORS.accent : LINEAR_COLORS.textSecondary,
                        background: 'rgba(35, 134, 54, 0.1)',
                        border: `1px solid ${LINEAR_COLORS.border}`,
                        '&:hover': {
                          background: LINEAR_COLORS.surfaceHover,
                          color: LINEAR_COLORS.accent,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Data" arrow>
                    <IconButton sx={{
                      color: LINEAR_COLORS.textSecondary,
                      background: 'rgba(35, 134, 54, 0.1)',
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      '&:hover': {
                        background: LINEAR_COLORS.surfaceHover,
                        color: LINEAR_COLORS.accent,
                        transform: 'translateY(-2px)',
                      },
                    }}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
          </Card>
        </motion.div>

        <Grid container spacing={3}>
          {/* Scanner Controls */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{
                background: LINEAR_COLORS.surfaceGradient,
                border: `1px solid ${LINEAR_COLORS.border}`,
                borderRadius: 3,
                boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ 
                      color: LINEAR_COLORS.textPrimary, 
                      fontWeight: 600,
                      background: LINEAR_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Scanner Controls
                    </Typography>
                  }
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Market</InputLabel>
                        <Select
                          value={selectedMarket}
                          onChange={(e) => setSelectedMarket(e.target.value)}
                          sx={{ color: LINEAR_COLORS.textPrimary }}
                        >
                          {markets.map((market) => (
                            <MenuItem key={market.id} value={market.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {market.icon}
                                {market.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Timeframe</InputLabel>
                        <Select
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                          sx={{ color: LINEAR_COLORS.textPrimary }}
                        >
                          {timeframes.map((tf) => (
                            <MenuItem key={tf} value={tf}>{tf}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        placeholder="Search symbols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ color: LINEAR_COLORS.textSecondary, mr: 1 }} />,
                        }}
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            color: LINEAR_COLORS.textPrimary,
                            '& fieldset': {
                              borderColor: LINEAR_COLORS.border,
                            },
                            '&:hover fieldset': {
                              borderColor: LINEAR_COLORS.accent,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: LINEAR_COLORS.accent,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: LINEAR_COLORS.textSecondary,
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={isScanning ? <Stop /> : <PlayArrow />}
                          onClick={isScanning ? handleStopScan : handleStartScan}
                          disabled={isScanning}
                          sx={{
                            background: isScanning ? LINEAR_COLORS.dangerGradient : LINEAR_COLORS.accentGradient,
                            color: LINEAR_COLORS.textPrimary,
                            '&:hover': {
                              background: isScanning ? '#f85149' : LINEAR_COLORS.accentHover,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 24px ${LINEAR_COLORS.accentGlow}`,
                            },
                          }}
                        >
                          {isScanning ? 'Stop Scan' : 'Start Scan'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {isScanning && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary, mb: 1 }}>
                        Scanning markets...
                      </Typography>
                      <LinearProgress 
                        sx={{ 
                          backgroundColor: LINEAR_COLORS.surface,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }} 
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Watchlist */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card sx={{
                background: LINEAR_COLORS.surfaceGradient,
                border: `1px solid ${LINEAR_COLORS.border}`,
                borderRadius: 3,
                boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}`,
                mt: 3,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        background: LINEAR_COLORS.infoGradient,
                        boxShadow: `0 4px 16px rgba(88, 166, 255, 0.4)`,
                      }}>
                        <Star />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: LINEAR_COLORS.textPrimary, 
                        fontWeight: 600,
                        background: LINEAR_COLORS.infoGradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        Watchlist
                      </Typography>
                    </Box>
                  }
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <List sx={{ p: 0 }}>
                    {watchlist.map((symbol, index) => (
                      <motion.div
                        key={symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            borderBottom: `1px solid ${LINEAR_COLORS.border}`,
                            '&:hover': {
                              background: LINEAR_COLORS.surfaceHover,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ 
                              background: LINEAR_COLORS.accentGradient,
                              width: 32,
                              height: 32,
                            }}>
                              <Star />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                                {symbol}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                                {mockScanResults.find(r => r.symbol === symbol)?.name || 'Unknown'}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={() => handleRemoveFromWatchlist(symbol)}
                              sx={{
                                color: LINEAR_COLORS.textSecondary,
                                '&:hover': {
                                  color: LINEAR_COLORS.danger,
                                },
                              }}
                            >
                              <Remove />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Scan Results */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{
                background: LINEAR_COLORS.surfaceGradient,
                border: `1px solid ${LINEAR_COLORS.border}`,
                borderRadius: 3,
                boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        background: LINEAR_COLORS.accentGradient,
                        boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                      }}>
                        <ShowChart />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: LINEAR_COLORS.textPrimary, 
                        fontWeight: 600,
                        background: LINEAR_COLORS.accentGradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        Scan Results
                      </Typography>
                      <Badge badgeContent={filteredResults.length} color="primary">
                        <Box />
                      </Badge>
                    </Box>
                  }
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Symbol</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Price</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Change</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Volume</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Signal</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>RSI</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {filteredResults
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((result, index) => (
                              <motion.tr
                                key={result.symbol}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <TableRow
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: LINEAR_COLORS.surfaceHover,
                                    },
                                  }}
                                >
                                  <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                                    {result.symbol}
                                  </TableCell>
                                  <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>
                                    ${result.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ 
                                        color: result.change >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                                        fontWeight: 600,
                                      }}>
                                        {result.change >= 0 ? '+' : ''}{result.change.toFixed(2)}
                                      </Typography>
                                      <Typography sx={{ 
                                        color: result.change >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                                        fontWeight: 600,
                                      }}>
                                        ({result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%)
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>
                                    {(result.volume / 1000000).toFixed(1)}M
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      icon={getSignalIcon(result.signal)}
                                      label={result.signal}
                                      size="small"
                                      sx={{
                                        background: getSignalColor(result.signal),
                                        color: LINEAR_COLORS.textPrimary,
                                        fontWeight: 600,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>
                                    {result.rsi.toFixed(1)}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Tooltip title="View Details" arrow>
                                        <IconButton
                                          onClick={() => handleViewSymbol(result)}
                                          sx={{
                                            color: LINEAR_COLORS.textSecondary,
                                            '&:hover': {
                                              color: LINEAR_COLORS.accent,
                                            },
                                          }}
                                        >
                                          <Visibility />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Add to Watchlist" arrow>
                                        <IconButton
                                          onClick={() => handleAddToWatchlist(result.symbol)}
                                          disabled={watchlist.includes(result.symbol)}
                                          sx={{
                                            color: LINEAR_COLORS.textSecondary,
                                            '&:hover': {
                                              color: LINEAR_COLORS.accent,
                                            },
                                          }}
                                        >
                                          <Add />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              </motion.tr>
                            ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredResults.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      color: LINEAR_COLORS.textPrimary,
                      '& .MuiTablePagination-toolbar': {
                        color: LINEAR_COLORS.textPrimary,
                      },
                      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        color: LINEAR_COLORS.textPrimary,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Symbol Details Dialog */}
        <Dialog
          open={showSymbolDetails}
          onClose={() => setShowSymbolDetails(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: LINEAR_COLORS.surfaceGradient,
              border: `1px solid ${LINEAR_COLORS.border}`,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}`,
            },
          }}
        >
          <DialogTitle sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
            {selectedSymbol?.symbol} - {selectedSymbol?.name}
          </DialogTitle>
          <DialogContent>
            {selectedSymbol && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Price Information
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Current Price:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      ${selectedSymbol.price.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Change:</Typography>
                    <Typography sx={{ 
                      color: selectedSymbol.change >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                      fontWeight: 600,
                    }}>
                      {selectedSymbol.change >= 0 ? '+' : ''}{selectedSymbol.change.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Change %:</Typography>
                    <Typography sx={{ 
                      color: selectedSymbol.change >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                      fontWeight: 600,
                    }}>
                      {selectedSymbol.changePercent >= 0 ? '+' : ''}{selectedSymbol.changePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Volume:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      {(selectedSymbol.volume / 1000000).toFixed(1)}M
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Technical Analysis
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>RSI:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      {selectedSymbol.rsi.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>MACD:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      {selectedSymbol.macd.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Signal:</Typography>
                    <Chip
                      icon={getSignalIcon(selectedSymbol.signal)}
                      label={selectedSymbol.signal}
                      size="small"
                      sx={{
                        background: getSignalColor(selectedSymbol.signal),
                        color: LINEAR_COLORS.textPrimary,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Volatility:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      {(selectedSymbol.volatility * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowSymbolDetails(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedSymbol) {
                  handleAddToWatchlist(selectedSymbol.symbol);
                }
                setShowSymbolDetails(false);
              }}
              disabled={selectedSymbol && watchlist.includes(selectedSymbol.symbol)}
              sx={{
                background: LINEAR_COLORS.accentGradient,
                color: LINEAR_COLORS.textPrimary,
                '&:hover': {
                  background: LINEAR_COLORS.accentHover,
                },
              }}
            >
              Add to Watchlist
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MarketScanner;
