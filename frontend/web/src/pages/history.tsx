'use client';

import React, { useState } from 'react';
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
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  History,
  TrendingUp,
  TrendingDown,
  Receipt,
  Download,
  FilterList,
  Search,
  Visibility,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  AttachMoney,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AppNavigation from '../components/AppNavigation';
import dataExportService from '../services/dataExportService';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TradingHistory: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSymbol, setFilterSymbol] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);

  const trades = [
    {
      id: 'trade_001',
      symbol: 'AAPL',
      side: 'buy',
      quantity: 100,
      price: 150.25,
      total: 15025,
      status: 'filled',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      fees: 15.03,
      pnl: 250.00,
      strategy: 'Momentum',
    },
    {
      id: 'trade_002',
      symbol: 'MSFT',
      side: 'sell',
      quantity: 50,
      price: 380.50,
      total: 19025,
      status: 'filled',
      timestamp: new Date('2024-01-14T14:20:00Z'),
      fees: 19.03,
      pnl: -125.00,
      strategy: 'Mean Reversion',
    },
    {
      id: 'trade_003',
      symbol: 'GOOGL',
      side: 'buy',
      quantity: 25,
      price: 142.80,
      total: 3570,
      status: 'pending',
      timestamp: new Date('2024-01-13T09:15:00Z'),
      fees: 3.57,
      pnl: 0,
      strategy: 'Breakout',
    },
    {
      id: 'trade_004',
      symbol: 'TSLA',
      side: 'sell',
      quantity: 75,
      price: 245.30,
      total: 18397.5,
      status: 'filled',
      timestamp: new Date('2024-01-12T16:45:00Z'),
      fees: 18.40,
      pnl: 450.00,
      strategy: 'Trend Following',
    },
    {
      id: 'trade_005',
      symbol: 'NVDA',
      side: 'buy',
      quantity: 30,
      price: 520.75,
      total: 15622.5,
      status: 'cancelled',
      timestamp: new Date('2024-01-11T11:30:00Z'),
      fees: 0,
      pnl: 0,
      strategy: 'Scalping',
    },
  ];

  const orders = [
    {
      id: 'order_001',
      symbol: 'AAPL',
      side: 'buy',
      type: 'limit',
      quantity: 100,
      price: 150.00,
      status: 'open',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      filled: 0,
      remaining: 100,
    },
    {
      id: 'order_002',
      symbol: 'MSFT',
      side: 'sell',
      type: 'stop',
      quantity: 50,
      price: 375.00,
      status: 'open',
      timestamp: new Date('2024-01-14T14:20:00Z'),
      filled: 0,
      remaining: 50,
    },
  ];

  const positions = [
    {
      id: 'pos_001',
      symbol: 'AAPL',
      side: 'long',
      quantity: 100,
      entryPrice: 150.25,
      currentPrice: 152.50,
      unrealizedPnL: 225.00,
      unrealizedPnLPercent: 1.50,
      timestamp: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: 'pos_002',
      symbol: 'TSLA',
      side: 'short',
      quantity: 75,
      entryPrice: 245.30,
      currentPrice: 240.00,
      unrealizedPnL: 397.50,
      unrealizedPnLPercent: 2.16,
      timestamp: new Date('2024-01-12T16:45:00Z'),
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewTrade = (trade: any) => {
    setSelectedTrade(trade);
    setShowTradeDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return LINEAR_COLORS.success;
      case 'pending': return LINEAR_COLORS.warning;
      case 'cancelled': return LINEAR_COLORS.danger;
      case 'open': return LINEAR_COLORS.info;
      default: return LINEAR_COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled': return <CheckCircle />;
      case 'pending': return <Warning />;
      case 'cancelled': return <Error />;
      case 'open': return <Info />;
      default: return <Info />;
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;
    const matchesSymbol = filterSymbol === 'all' || trade.symbol === filterSymbol;
    const matchesSearch = searchQuery === '' || 
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSymbol && matchesSearch;
  });

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalFees = trades.reduce((sum, trade) => sum + trade.fees, 0);
  const totalVolume = trades.reduce((sum, trade) => sum + trade.total, 0);

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
      <AppNavigation currentPage="history" />
      
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
                    <History />
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
                      Trading History
                    </Typography>
                    <Typography variant="body1" sx={{ color: LINEAR_COLORS.textSecondary }}>
                      View and analyze your trading activity
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh Data" arrow>
                    <IconButton 
                      onClick={() => {
                        // Refresh trading history data
                        window.location.reload();
                      }}
                      sx={{
                        color: LINEAR_COLORS.textSecondary,
                        background: 'rgba(35, 134, 54, 0.1)',
                        border: `1px solid ${LINEAR_COLORS.border}`,
                        '&:hover': {
                          background: LINEAR_COLORS.surfaceHover,
                          color: LINEAR_COLORS.accent,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Data" arrow>
                    <IconButton 
                      onClick={() => {
                        // Export trading history
                        dataExportService.exportTradingHistory(trades);
                      }}
                      sx={{
                        color: LINEAR_COLORS.textSecondary,
                        background: 'rgba(35, 134, 54, 0.1)',
                        border: `1px solid ${LINEAR_COLORS.border}`,
                        '&:hover': {
                          background: LINEAR_COLORS.surfaceHover,
                          color: LINEAR_COLORS.accent,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
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
                  background: totalPnL >= 0 
                    ? 'linear-gradient(135deg, rgba(35, 134, 54, 0.1) 0%, transparent 50%)'
                    : 'linear-gradient(135deg, rgba(218, 54, 51, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      background: totalPnL >= 0 ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                      mr: 2,
                      boxShadow: totalPnL >= 0 
                        ? `0 4px 16px ${LINEAR_COLORS.accentGlow}`
                        : `0 4px 16px rgba(218, 54, 51, 0.4)`,
                    }}>
                      {totalPnL >= 0 ? <TrendingUp /> : <TrendingDown />}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Total P&L
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: totalPnL >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger, 
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    ${totalPnL.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    All Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      background: LINEAR_COLORS.infoGradient,
                      mr: 2,
                      boxShadow: `0 4px 16px rgba(88, 166, 255, 0.4)`,
                    }}>
                      <AttachMoney />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Total Volume
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: LINEAR_COLORS.textPrimary, 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    ${totalVolume.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    Trading Volume
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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
                  background: 'linear-gradient(135deg, rgba(210, 153, 34, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      background: LINEAR_COLORS.warningGradient,
                      mr: 2,
                      boxShadow: `0 4px 16px rgba(210, 153, 34, 0.4)`,
                    }}>
                      <Receipt />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Total Fees
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: LINEAR_COLORS.textPrimary, 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    ${totalFees.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    Trading Fees
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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
                  background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      background: LINEAR_COLORS.accentGradient,
                      mr: 2,
                      boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                    }}>
                      <Timeline />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Total Trades
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: LINEAR_COLORS.textPrimary, 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {trades.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    Executed Trades
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
            <Box sx={{ borderBottom: `1px solid ${LINEAR_COLORS.border}` }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: LINEAR_COLORS.textSecondary,
                    '&.Mui-selected': {
                      color: LINEAR_COLORS.accent,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: LINEAR_COLORS.accent,
                  },
                }}
              >
                <Tab 
                  label={
                    <Badge badgeContent={trades.length} color="primary">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt />
                        Trades
                      </Box>
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={orders.length} color="primary">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline />
                        Orders
                      </Box>
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={positions.length} color="primary">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShowChart />
                        Positions
                      </Box>
                    </Badge>
                  } 
                />
              </Tabs>
            </Box>

            {/* Filters */}
            <Box sx={{ p: 3, borderBottom: `1px solid ${LINEAR_COLORS.border}` }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Search trades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ color: LINEAR_COLORS.textSecondary, mr: 1 }} />,
                    }}
                    sx={{
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
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="filled">Filled</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Symbol</InputLabel>
                    <Select
                      value={filterSymbol}
                      onChange={(e) => setFilterSymbol(e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      <MenuItem value="all">All Symbols</MenuItem>
                      <MenuItem value="AAPL">AAPL</MenuItem>
                      <MenuItem value="MSFT">MSFT</MenuItem>
                      <MenuItem value="GOOGL">GOOGL</MenuItem>
                      <MenuItem value="TSLA">TSLA</MenuItem>
                      <MenuItem value="NVDA">NVDA</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{
                      borderColor: LINEAR_COLORS.border,
                      color: LINEAR_COLORS.textPrimary,
                      '&:hover': {
                        borderColor: LINEAR_COLORS.accent,
                        backgroundColor: LINEAR_COLORS.surfaceHover,
                      },
                    }}
                  >
                    Export CSV
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Trade ID</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Symbol</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Side</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Price</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>P&L</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTrades
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((trade) => (
                        <TableRow
                          key={trade.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: LINEAR_COLORS.surfaceHover,
                            },
                          }}
                        >
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{trade.id}</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>{trade.symbol}</TableCell>
                          <TableCell>
                            <Chip
                              label={trade.side}
                              size="small"
                              sx={{
                                background: trade.side === 'buy' ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                                color: LINEAR_COLORS.textPrimary,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{trade.quantity}</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>${trade.price}</TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>${trade.total.toLocaleString()}</TableCell>
                          <TableCell sx={{ 
                            color: trade.pnl >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                            fontWeight: 600,
                          }}>
                            ${trade.pnl.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(trade.status)}
                              label={trade.status}
                              size="small"
                              sx={{
                                background: getStatusColor(trade.status),
                                color: LINEAR_COLORS.textPrimary,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: LINEAR_COLORS.textSecondary }}>
                            {trade.timestamp.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details" arrow>
                              <IconButton
                                onClick={() => handleViewTrade(trade)}
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
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredTrades.length}
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
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Order ID</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Symbol</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Side</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Price</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Filled</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: LINEAR_COLORS.surfaceHover,
                          },
                        }}
                      >
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{order.id}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>{order.symbol}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.side}
                            size="small"
                            sx={{
                              background: order.side === 'buy' ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                              color: LINEAR_COLORS.textPrimary,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{order.type}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{order.quantity}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>${order.price}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{order.filled}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(order.status)}
                            label={order.status}
                            size="small"
                            sx={{
                              background: getStatusColor(order.status),
                              color: LINEAR_COLORS.textPrimary,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textSecondary }}>
                          {order.timestamp.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Position ID</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Symbol</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Side</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Entry Price</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Current Price</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Unrealized P&L</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>P&L %</TableCell>
                      <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow
                        key={position.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: LINEAR_COLORS.surfaceHover,
                          },
                        }}
                      >
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{position.id}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>{position.symbol}</TableCell>
                        <TableCell>
                          <Chip
                            label={position.side}
                            size="small"
                            sx={{
                              background: position.side === 'long' ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                              color: LINEAR_COLORS.textPrimary,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>{position.quantity}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>${position.entryPrice}</TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textPrimary }}>${position.currentPrice}</TableCell>
                        <TableCell sx={{ 
                          color: position.unrealizedPnL >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                          fontWeight: 600,
                        }}>
                          ${position.unrealizedPnL.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ 
                          color: position.unrealizedPnL >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                          fontWeight: 600,
                        }}>
                          {position.unrealizedPnLPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell sx={{ color: LINEAR_COLORS.textSecondary }}>
                          {position.timestamp.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Card>
        </motion.div>

        {/* Trade Details Dialog */}
        <Dialog
          open={showTradeDetails}
          onClose={() => setShowTradeDetails(false)}
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
            Trade Details
          </DialogTitle>
          <DialogContent>
            {selectedTrade && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Trade Information
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Trade ID:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>{selectedTrade.id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Symbol:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>{selectedTrade.symbol}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Side:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>{selectedTrade.side}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Quantity:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>{selectedTrade.quantity}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Price:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>${selectedTrade.price}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Total:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>${selectedTrade.total.toLocaleString()}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Performance
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>P&L:</Typography>
                    <Typography sx={{ 
                      color: selectedTrade.pnl >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                      fontWeight: 600,
                    }}>
                      ${selectedTrade.pnl.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Fees:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>${selectedTrade.fees.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Strategy:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>{selectedTrade.strategy}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Status:</Typography>
                    <Chip
                      icon={getStatusIcon(selectedTrade.status)}
                      label={selectedTrade.status}
                      size="small"
                      sx={{
                        background: getStatusColor(selectedTrade.status),
                        color: LINEAR_COLORS.textPrimary,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Date:</Typography>
                    <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>
                      {selectedTrade.timestamp.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowTradeDetails(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TradingHistory;
