'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Badge,
  Tooltip,
  Fade,
  Slide,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Security,
  Notifications,
  Settings,
  Refresh,
  Search,
  FilterList,
  ViewList,
  ViewModule,
  MoreVert,
  Add,
  Close,
  CheckCircle,
  Warning,
  Error,
  Info,
  Menu as MenuIcon,
  ChevronRight,
  KeyboardArrowDown,
  Star,
  StarBorder,
  BarChart,
  Person,
  Help,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AppNavigation from '../components/AppNavigation';
import { useGetPortfolioQuery, useGetPositionsQuery, useGetMarketDataQuery } from '../store/api/tradingApi';
import TradingChart from '../components/TradingChart';
import { OrderBook } from '../components/OrderBook';
import { PositionsTable } from '../components/PositionsTable';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { RiskMonitor } from '../components/RiskMonitor';
import TradeExecutionPanel from '../components/TradeExecutionPanel';
import { RealTimeNotifications } from '../components/RealTimeNotifications';
// import EnhancedPortfolioView from '../components/EnhancedPortfolioView';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSelectedSymbol, setTimeframe } from '../store/slices/tradingSlice';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';
import CeesarTraderLogo from '../components/CeesarTraderLogo';
import dataExportService from '../services/dataExportService';
import MLTradingPanel from '../components/MLTradingPanel';

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

const Dashboard: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedSymbol, timeframe, isConnected } = useAppSelector((state) => state.trading);
  const { isConnected: wsConnected } = useWebSocketConnection();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Chart state
  const [chartDuration, setChartDuration] = useState('1d');
  const [chartSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']);
  const [selectedChartSymbols, setSelectedChartSymbols] = useState<string[]>(['AAPL']);

  // Export functions
  const handleExportPortfolio = () => {
    if (portfolio) {
      dataExportService.exportPortfolio(portfolio);
    }
    setShowExportMenu(false);
  };

  const handleExportMarketData = () => {
    if (marketData) {
      dataExportService.exportMarketData(marketData, selectedSymbol);
    }
    setShowExportMenu(false);
  };

  const handleExportPositions = () => {
    if (positions) {
      dataExportService.exportTradingHistory(positions);
    }
    setShowExportMenu(false);
  };

  const handleExportAll = () => {
    // Export all available data
    if (portfolio) dataExportService.exportPortfolio(portfolio);
    if (marketData) dataExportService.exportMarketData(marketData, selectedSymbol);
    if (positions) dataExportService.exportTradingHistory(positions);
    setShowExportMenu(false);
  };

  // API queries
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = useGetPortfolioQuery();
  const { data: positions, isLoading: positionsLoading } = useGetPositionsQuery();
  const { data: marketData, isLoading: marketDataLoading } = useGetMarketDataQuery({
    symbol: selectedSymbol,
    interval: timeframe,
    limit: 1000,
  });

  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NFLX', 'NVDA', 'BTCUSDT', 'ETHUSDT', 'EUR_USD', 'GBP_USD'];

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const filteredSymbols = symbols.filter(symbol => 
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading only if all data is loading, otherwise render with available data
  const isAllDataLoading = portfolioLoading && positionsLoading && marketDataLoading;
  
  if (isAllDataLoading) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LINEAR_COLORS.background,
        color: LINEAR_COLORS.textPrimary
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress 
            sx={{ 
              width: 200, 
              mb: 2,
              '& .MuiLinearProgress-bar': {
                backgroundColor: LINEAR_COLORS.accent
              }
            }} 
          />
          <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary }}>
            Loading trading dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (portfolioError) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LINEAR_COLORS.background,
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            backgroundColor: LINEAR_COLORS.surface,
            color: LINEAR_COLORS.textPrimary,
            border: `1px solid ${LINEAR_COLORS.border}`,
            '& .MuiAlert-icon': {
              color: LINEAR_COLORS.danger
            }
          }}
        >
          Failed to load portfolio data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: LINEAR_COLORS.backgroundGradient,
      color: LINEAR_COLORS.textPrimary,
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '64px', // Account for fixed AppBar height
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
      <AppNavigation currentPage="dashboard" />
      
      {/* Sidebar */}
      <motion.div
        initial={{ width: sidebarOpen ? 280 : 0 }}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            background: LINEAR_COLORS.surfaceGradient,
            borderRadius: 0,
            borderRight: `1px solid ${LINEAR_COLORS.border}`,
            boxShadow: `inset -1px 0 0 ${LINEAR_COLORS.borderGlow}, 4px 0 20px ${LINEAR_COLORS.shadow}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(35, 134, 54, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${LINEAR_COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <CeesarTraderLogo 
              size="small" 
              variant="text" 
              animated={true}
            />
            <IconButton 
              size="small"
              onClick={() => setSidebarOpen(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: LINEAR_COLORS.textSecondary, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: LINEAR_COLORS.background,
                  borderColor: LINEAR_COLORS.border,
                  '&:hover': {
                    borderColor: LINEAR_COLORS.accent,
                  },
                  '&.Mui-focused': {
                    borderColor: LINEAR_COLORS.accent,
                  },
                },
                '& .MuiInputBase-input': {
                  color: LINEAR_COLORS.textPrimary,
                  '&::placeholder': {
                    color: LINEAR_COLORS.textSecondary,
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Favorites */}
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              color: LINEAR_COLORS.textSecondary,
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1
            }}>
              Favorites
            </Typography>
            {favorites.map((symbol) => (
              <motion.div
                key={symbol}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: LINEAR_COLORS.surfaceElevated,
                    },
                    backgroundColor: selectedSymbol === symbol ? LINEAR_COLORS.surfaceElevated : 'transparent',
                  }}
                  onClick={() => dispatch(setSelectedSymbol(symbol))}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ 
                      color: LINEAR_COLORS.warning, 
                      fontSize: 16, 
                      mr: 1 
                    }} />
                    <Typography variant="body2" sx={{ 
                      color: LINEAR_COLORS.textPrimary,
                      fontWeight: selectedSymbol === symbol ? 600 : 400
                    }}>
                      {symbol}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: LINEAR_COLORS.textSecondary,
                    fontWeight: 500
                  }}>
                    $150.25
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* All Symbols */}
          <Box sx={{ px: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ 
              color: LINEAR_COLORS.textSecondary,
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1
            }}>
              All Symbols
            </Typography>
            {filteredSymbols.map((symbol) => (
              <motion.div
                key={symbol}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: LINEAR_COLORS.surfaceElevated,
                    },
                    backgroundColor: selectedSymbol === symbol ? LINEAR_COLORS.surfaceElevated : 'transparent',
                  }}
                  onClick={() => dispatch(setSelectedSymbol(symbol))}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(symbol);
                      }}
                      sx={{ mr: 0.5, p: 0.5 }}
                    >
                      {favorites.includes(symbol) ? (
                        <Star sx={{ color: LINEAR_COLORS.warning, fontSize: 16 }} />
                      ) : (
                        <StarBorder sx={{ color: LINEAR_COLORS.textSecondary, fontSize: 16 }} />
                      )}
                    </IconButton>
                    <Typography variant="body2" sx={{ 
                      color: LINEAR_COLORS.textPrimary,
                      fontWeight: selectedSymbol === symbol ? 600 : 400
                    }}>
                      {symbol}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: LINEAR_COLORS.textSecondary,
                    fontWeight: 500
                  }}>
                    $150.25
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Paper>
      </motion.div>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Enhanced Top Bar with 3D Effects */}
        <Paper
          elevation={0}
          sx={{
            background: LINEAR_COLORS.surfaceGradient,
            borderBottom: `1px solid ${LINEAR_COLORS.border}`,
            borderRadius: 0,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
            boxShadow: `0 2px 20px ${LINEAR_COLORS.shadow}, inset 0 1px 0 ${LINEAR_COLORS.borderGlow}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, rgba(35, 134, 54, 0.03) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!sidebarOpen && (
              <IconButton
                onClick={() => setSidebarOpen(true)}
                sx={{ mr: 2, color: LINEAR_COLORS.textSecondary }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h5" sx={{ 
              fontWeight: 600,
              color: LINEAR_COLORS.textPrimary,
              mr: 3
            }}>
              Trading Dashboard
            </Typography>
            <Chip
              icon={wsConnected ? <CheckCircle /> : <Error />}
              label={wsConnected ? 'Connected' : 'Disconnected'}
              color={wsConnected ? 'success' : 'error'}
              size="small"
              sx={{
                backgroundColor: wsConnected ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                color: LINEAR_COLORS.textPrimary,
                '& .MuiChip-icon': {
                  color: LINEAR_COLORS.textPrimary,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 2 }}>
            <Tooltip title="Notifications" arrow>
              <IconButton 
                onClick={() => setShowNotifications(!showNotifications)}
                sx={{ 
                  color: LINEAR_COLORS.textSecondary,
                  background: 'rgba(35, 134, 54, 0.1)',
                  border: `1px solid ${LINEAR_COLORS.border}`,
                  borderRadius: 2,
                  p: 1,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${LINEAR_COLORS.shadow}`,
                  '&:hover': {
                    background: LINEAR_COLORS.surfaceHover,
                    color: LINEAR_COLORS.accent,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadowElevated}`,
                  },
                }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings" arrow>
              <IconButton 
                onClick={() => router.push('/settings')}
                sx={{ 
                  color: LINEAR_COLORS.textSecondary,
                  background: 'rgba(35, 134, 54, 0.1)',
                  border: `1px solid ${LINEAR_COLORS.border}`,
                  borderRadius: 2,
                  p: 1,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${LINEAR_COLORS.shadow}`,
                  '&:hover': {
                    background: LINEAR_COLORS.surfaceHover,
                    color: LINEAR_COLORS.accent,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadowElevated}`,
                  },
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Data" arrow>
              <IconButton 
                onClick={() => {
                  // Refresh all data
                  window.location.reload();
                }}
                sx={{ 
                  color: LINEAR_COLORS.textSecondary,
                  background: 'rgba(35, 134, 54, 0.1)',
                  border: `1px solid ${LINEAR_COLORS.border}`,
                  borderRadius: 2,
                  p: 1,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${LINEAR_COLORS.shadow}`,
                  '&:hover': {
                    background: LINEAR_COLORS.surfaceHover,
                    color: LINEAR_COLORS.accent,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadowElevated}`,
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Options" arrow>
              <IconButton 
                onClick={(e) => {
                  setExportMenuAnchor(e.currentTarget);
                  setShowExportMenu(true);
                }}
                sx={{ 
                  color: LINEAR_COLORS.textSecondary,
                  background: 'rgba(35, 134, 54, 0.1)',
                  border: `1px solid ${LINEAR_COLORS.border}`,
                  borderRadius: 2,
                  p: 1,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${LINEAR_COLORS.shadow}`,
                  '&:hover': {
                    background: LINEAR_COLORS.surfaceHover,
                    color: LINEAR_COLORS.accent,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadowElevated}`,
                  },
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                // Open new trade page
                router.push('/trade');
              }}
              sx={{
                background: LINEAR_COLORS.accentGradient,
                color: LINEAR_COLORS.textPrimary,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                border: `1px solid ${LINEAR_COLORS.accent}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: LINEAR_COLORS.accentHover,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 24px ${LINEAR_COLORS.accentGlow}`,
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
              }}
            >
              New Trade
            </Button>
          </Box>
        </Paper>


        {/* Main Dashboard Content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Grid container spacing={3}>
            {/* Left Column - Charts and Trading */}
            <Grid item xs={12} lg={8}>
              <Grid container spacing={3}>
                {/* Enhanced Trading Chart */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background: LINEAR_COLORS.surfaceGradient,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}, inset 0 1px 0 ${LINEAR_COLORS.borderGlow}`,
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
                    }}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" sx={{ 
                            color: LINEAR_COLORS.textPrimary,
                            fontWeight: 600
                          }}>
                            {selectedSymbol} Price Chart
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                              <Chip
                                key={tf}
                                label={tf}
                                variant={timeframe === tf ? 'filled' : 'outlined'}
                                onClick={() => dispatch(setTimeframe(tf))}
                                size="small"
                                sx={{
                                  backgroundColor: timeframe === tf ? LINEAR_COLORS.accent : 'transparent',
                                  color: timeframe === tf ? LINEAR_COLORS.textPrimary : LINEAR_COLORS.textSecondary,
                                  borderColor: LINEAR_COLORS.border,
                                  '&:hover': {
                                    backgroundColor: LINEAR_COLORS.surfaceElevated,
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <CardContent>
                      <TradingChart
                        data={marketData || []}
                        symbol={selectedSymbol || 'AAPL'}
                        timeframe={timeframe || '1d'}
                        height={400}
                        theme="dark"
                        symbols={chartSymbols || []}
                        duration={chartDuration || '1d'}
                        onSymbolChange={(symbol) => dispatch(setSelectedSymbol(symbol))}
                        onDurationChange={setChartDuration}
                        selectedSymbols={selectedChartSymbols || []}
                        onSymbolsChange={setSelectedChartSymbols}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Order Book and Trade Execution */}
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      backgroundColor: LINEAR_COLORS.surface,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <CardHeader title="Order Book" />
                    <CardContent>
                      <OrderBook symbol={selectedSymbol || 'AAPL'} theme="dark" />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      backgroundColor: LINEAR_COLORS.surface,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <CardHeader title="Trade Execution" />
                    <CardContent>
                      <TradeExecutionPanel
                        symbol={selectedSymbol}
                        onTradeExecuted={(trade) => {
                          setNotifications(prev => [...prev, {
                            id: Date.now(),
                            type: 'success',
                            message: `Trade executed: ${trade.symbol} ${trade.side}`,
                            timestamp: new Date(),
                          }]);
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* ML Trading Panel */}
                <Grid item xs={12}>
                  <MLTradingPanel symbol={selectedSymbol} theme="dark" />
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column - Enhanced Portfolio and Risk */}
            <Grid item xs={12} lg={4}>
              <Grid container spacing={3}>
                {/* Enhanced Portfolio Summary */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background: LINEAR_COLORS.surfaceGradient,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}, inset 0 1px 0 ${LINEAR_COLORS.borderGlow}`,
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
                    }}
                  >
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
                          Portfolio Overview
                        </Typography>
                      }
                      avatar={
                        <Avatar sx={{ 
                          background: LINEAR_COLORS.accentGradient,
                          boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                        }}>
                          <AccountBalance />
                        </Avatar>
                      }
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <PerformanceMetrics portfolio={portfolio || undefined} theme="dark" />
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Enhanced Risk Monitor */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background: LINEAR_COLORS.surfaceGradient,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}, inset 0 1px 0 ${LINEAR_COLORS.borderGlow}`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(210, 153, 34, 0.05) 0%, transparent 50%)',
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <CardHeader
                      title={
                        <Typography variant="h6" sx={{ 
                          color: LINEAR_COLORS.textPrimary, 
                          fontWeight: 600,
                          background: LINEAR_COLORS.warningGradient,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          Risk Monitor
                        </Typography>
                      }
                      avatar={
                        <Avatar sx={{ 
                          background: LINEAR_COLORS.warningGradient,
                          boxShadow: `0 4px 16px rgba(210, 153, 34, 0.4)`,
                        }}>
                          <Security />
                        </Avatar>
                      }
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <RiskMonitor portfolio={portfolio || undefined} positions={positions || []} theme="dark" />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Positions */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      backgroundColor: LINEAR_COLORS.surface,
                      border: `1px solid ${LINEAR_COLORS.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <CardHeader title="Open Positions" />
                    <CardContent>
                      <PositionsTable positions={positions || []} theme="dark" />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        autoHideDuration={6000}
      >
        <Box>
          <RealTimeNotifications
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            theme="dark"
          />
        </Box>
      </Snackbar>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={showExportMenu}
        onClose={() => setShowExportMenu(false)}
        PaperProps={{
          sx: {
            background: LINEAR_COLORS.surface,
            border: `1px solid ${LINEAR_COLORS.border}`,
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={handleExportPortfolio} sx={{ color: LINEAR_COLORS.textPrimary }}>
          Export Portfolio
        </MenuItem>
        <MenuItem onClick={handleExportMarketData} sx={{ color: LINEAR_COLORS.textPrimary }}>
          Export Market Data
        </MenuItem>
        <MenuItem onClick={handleExportPositions} sx={{ color: LINEAR_COLORS.textPrimary }}>
          Export Positions
        </MenuItem>
        <MenuItem onClick={handleExportAll} sx={{ color: LINEAR_COLORS.accent }}>
          Export All Data
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;