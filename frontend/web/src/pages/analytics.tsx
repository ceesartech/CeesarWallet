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
  Switch,
  FormControlLabel,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShowChart,
  Timeline,
  AttachMoney,
  AccountBalance,
  Security,
  Speed,
  Refresh,
  Download,
  FilterList,
  CalendarToday,
  CompareArrows,
  Assessment,
  Analytics,
  PieChartOutline,
  TimelineOutlined,
  ShowChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  SpeedOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AppNavigation from '../components/AppNavigation';

// Modern analytics-inspired color palette
const ANALYTICS_COLORS = {
  background: '#0f172a',
  backgroundGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  surfaceGradient: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
  surfaceHover: 'linear-gradient(145deg, #334155 0%, #475569 100%)',
  border: '#475569',
  borderGlow: 'rgba(59, 130, 246, 0.3)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  accent: '#3b82f6',
  accentGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  accentHover: '#1d4ed8',
  accentGlow: 'rgba(59, 130, 246, 0.4)',
  success: '#10b981',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: '#f59e0b',
  warningGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  danger: '#ef4444',
  dangerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  info: '#06b6d4',
  infoGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  shadow: 'rgba(0, 0, 0, 0.6)',
  shadowElevated: 'rgba(0, 0, 0, 0.8)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
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

const AnalyticsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('1M');
  const [selectedMetric, setSelectedMetric] = useState('portfolio');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const performanceData = {
    totalReturn: 15.7,
    totalReturnPercent: 12.3,
    sharpeRatio: 1.8,
    maxDrawdown: -8.2,
    winRate: 68.5,
    avgWin: 2.4,
    avgLoss: -1.8,
    profitFactor: 1.9,
  };

  const portfolioMetrics = [
    { label: 'Total Return', value: '$15,700', change: '+12.3%', trend: 'up' },
    { label: 'Sharpe Ratio', value: '1.8', change: '+0.2', trend: 'up' },
    { label: 'Max Drawdown', value: '-8.2%', change: '-1.1%', trend: 'down' },
    { label: 'Win Rate', value: '68.5%', change: '+2.1%', trend: 'up' },
    { label: 'Profit Factor', value: '1.9', change: '+0.3', trend: 'up' },
    { label: 'Avg Win/Loss', value: '2.4/-1.8', change: '+0.2/-0.1', trend: 'up' },
  ];

  const assetAllocation = [
    { name: 'Stocks', value: 45, color: ANALYTICS_COLORS.accent, amount: '$45,000' },
    { name: 'Crypto', value: 25, color: ANALYTICS_COLORS.success, amount: '$25,000' },
    { name: 'Bonds', value: 20, color: ANALYTICS_COLORS.info, amount: '$20,000' },
    { name: 'Commodities', value: 10, color: ANALYTICS_COLORS.warning, amount: '$10,000' },
  ];

  const topPerformers = [
    { symbol: 'AAPL', name: 'Apple Inc.', return: 18.5, amount: '$5,200' },
    { symbol: 'TSLA', name: 'Tesla Inc.', return: 15.2, amount: '$3,800' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', return: 22.1, amount: '$4,100' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', return: 12.8, amount: '$3,200' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', return: 9.7, amount: '$2,100' },
  ];

  const riskMetrics = [
    { label: 'VaR (95%)', value: '-2.1%', level: 'low' },
    { label: 'Beta', value: '1.2', level: 'medium' },
    { label: 'Volatility', value: '18.5%', level: 'medium' },
    { label: 'Correlation', value: '0.65', level: 'high' },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp /> : <TrendingDown />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? ANALYTICS_COLORS.success : ANALYTICS_COLORS.danger;
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return ANALYTICS_COLORS.success;
      case 'medium': return ANALYTICS_COLORS.warning;
      case 'high': return ANALYTICS_COLORS.danger;
      default: return ANALYTICS_COLORS.textSecondary;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: ANALYTICS_COLORS.backgroundGradient,
      color: ANALYTICS_COLORS.textPrimary,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <AppNavigation currentPage="analytics" />
      
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{
            background: ANALYTICS_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${ANALYTICS_COLORS.shadowElevated}`,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 80,
                        height: 80,
                        background: ANALYTICS_COLORS.accentGradient,
                        boxShadow: `0 8px 32px ${ANALYTICS_COLORS.accentGlow}`,
                        border: `3px solid ${ANALYTICS_COLORS.glassBorder}`,
                      }}
                    >
                      <Analytics sx={{ fontSize: 40 }} />
                    </Avatar>
                  </motion.div>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: ANALYTICS_COLORS.textPrimary,
                      background: ANALYTICS_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      Portfolio Analytics
                    </Typography>
                    <Typography variant="h6" sx={{ color: ANALYTICS_COLORS.textSecondary, fontWeight: 400 }}>
                      Advanced performance metrics and risk analysis
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: ANALYTICS_COLORS.textSecondary }}>Time Range</InputLabel>
                    <Select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      sx={{ color: ANALYTICS_COLORS.textPrimary }}
                    >
                      <MenuItem value="1W">1 Week</MenuItem>
                      <MenuItem value="1M">1 Month</MenuItem>
                      <MenuItem value="3M">3 Months</MenuItem>
                      <MenuItem value="6M">6 Months</MenuItem>
                      <MenuItem value="1Y">1 Year</MenuItem>
                      <MenuItem value="ALL">All Time</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => setShowExportDialog(true)}
                    sx={{
                      borderColor: ANALYTICS_COLORS.glassBorder,
                      color: ANALYTICS_COLORS.textPrimary,
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: ANALYTICS_COLORS.accent,
                        background: ANALYTICS_COLORS.surfaceHover,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    sx={{
                      background: ANALYTICS_COLORS.accentGradient,
                      color: ANALYTICS_COLORS.textPrimary,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.accentGlow}`,
                      '&:hover': {
                        background: ANALYTICS_COLORS.accentHover,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 40px ${ANALYTICS_COLORS.accentGlow}`,
                      },
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              }
            />
          </Card>
        </motion.div>

        {/* Key Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {portfolioMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={metric.label}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{
                    background: ANALYTICS_COLORS.glass,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                    borderRadius: 3,
                    boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: metric.trend === 'up' 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
                      pointerEvents: 'none',
                    },
                  }}>
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                          color: ANALYTICS_COLORS.textSecondary,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {metric.label}
                        </Typography>
                        <Box sx={{ 
                          color: getTrendColor(metric.trend),
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          {getTrendIcon(metric.trend)}
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: ANALYTICS_COLORS.textPrimary, 
                        fontWeight: 700,
                        mb: 1,
                      }}>
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: getTrendColor(metric.trend),
                        fontWeight: 600,
                      }}>
                        {metric.change}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Main Analytics Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{
            background: ANALYTICS_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${ANALYTICS_COLORS.shadowElevated}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ borderBottom: `1px solid ${ANALYTICS_COLORS.glassBorder}` }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: ANALYTICS_COLORS.textSecondary,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '16px',
                    '&.Mui-selected': {
                      color: ANALYTICS_COLORS.accent,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: ANALYTICS_COLORS.accent,
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                  },
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChartOutlined />
                      Performance
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartOutline />
                      Allocation
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineOutlined />
                      Risk Analysis
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment />
                      Reports
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Performance Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={4}>
                <Grid item xs={12} lg={8}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Performance Chart
                          </Typography>
                        }
                        action={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              <CompareArrows />
                            </IconButton>
                            <IconButton size="small" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              <FilterList />
                            </IconButton>
                          </Box>
                        }
                      />
                      <CardContent>
                        <Box sx={{ 
                          height: 400, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: ANALYTICS_COLORS.surface,
                          borderRadius: 2,
                          border: `1px solid ${ANALYTICS_COLORS.border}`,
                        }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <ShowChart sx={{ 
                              fontSize: 80, 
                              color: ANALYTICS_COLORS.textSecondary,
                              mb: 2,
                            }} />
                            <Typography variant="h6" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Interactive Performance Chart
                            </Typography>
                            <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Chart visualization would be integrated here
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Top Performers
                          </Typography>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          {topPerformers.map((performer, index) => (
                            <motion.div
                              key={performer.symbol}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <ListItem
                                sx={{
                                  borderBottom: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                                  '&:hover': {
                                    background: ANALYTICS_COLORS.surfaceHover,
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <ListItemIcon>
                                  <Avatar sx={{ 
                                    background: performer.return >= 0 ? ANALYTICS_COLORS.successGradient : ANALYTICS_COLORS.dangerGradient,
                                    width: 40,
                                    height: 40,
                                  }}>
                                    {performer.return >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1" sx={{ color: ANALYTICS_COLORS.textPrimary, fontWeight: 600 }}>
                                        {performer.symbol}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                                        {performer.name}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Typography variant="body2" sx={{ 
                                        color: performer.return >= 0 ? ANALYTICS_COLORS.success : ANALYTICS_COLORS.danger,
                                        fontWeight: 600,
                                      }}>
                                        {performer.return >= 0 ? '+' : ''}{performer.return}%
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                                        {performer.amount}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </motion.div>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Allocation Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Asset Allocation
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Box sx={{ 
                          height: 300, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: ANALYTICS_COLORS.surface,
                          borderRadius: 2,
                          border: `1px solid ${ANALYTICS_COLORS.border}`,
                        }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <PieChart sx={{ 
                              fontSize: 80, 
                              color: ANALYTICS_COLORS.textSecondary,
                              mb: 2,
                            }} />
                            <Typography variant="h6" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Pie Chart Visualization
                            </Typography>
                            <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Asset allocation chart would be integrated here
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Allocation Details
                          </Typography>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          {assetAllocation.map((asset, index) => (
                            <motion.div
                              key={asset.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <ListItem sx={{ px: 0, py: 2 }}>
                                <ListItemIcon>
                                  <Box sx={{ 
                                    width: 20, 
                                    height: 20, 
                                    borderRadius: '50%', 
                                    background: asset.color,
                                    boxShadow: `0 0 10px ${asset.color}40`,
                                  }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Typography variant="body1" sx={{ color: ANALYTICS_COLORS.textPrimary, fontWeight: 600 }}>
                                        {asset.name}
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: ANALYTICS_COLORS.textPrimary, fontWeight: 600 }}>
                                        {asset.value}%
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                                      {asset.amount}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ width: 100, ml: 2 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={asset.value}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      backgroundColor: ANALYTICS_COLORS.surface,
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: asset.color,
                                        borderRadius: 4,
                                      },
                                    }}
                                  />
                                </Box>
                              </ListItem>
                            </motion.div>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Risk Analysis Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Risk Metrics
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={3}>
                          {riskMetrics.map((metric, index) => (
                            <Grid item xs={6} key={metric.label}>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <Card sx={{
                                  background: ANALYTICS_COLORS.surface,
                                  border: `1px solid ${ANALYTICS_COLORS.border}`,
                                  borderRadius: 2,
                                  p: 2,
                                  textAlign: 'center',
                                }}>
                                  <Typography variant="body2" sx={{ 
                                    color: ANALYTICS_COLORS.textSecondary,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    mb: 1,
                                  }}>
                                    {metric.label}
                                  </Typography>
                                  <Typography variant="h5" sx={{ 
                                    color: getRiskLevelColor(metric.level),
                                    fontWeight: 700,
                                    mb: 1,
                                  }}>
                                    {metric.value}
                                  </Typography>
                                  <Chip
                                    label={metric.level}
                                    size="small"
                                    sx={{
                                      background: getRiskLevelColor(metric.level),
                                      color: ANALYTICS_COLORS.textPrimary,
                                      fontWeight: 600,
                                    }}
                                  />
                                </Card>
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{
                      background: ANALYTICS_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ANALYTICS_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Risk Analysis
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Box sx={{ 
                          height: 300, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: ANALYTICS_COLORS.surface,
                          borderRadius: 2,
                          border: `1px solid ${ANALYTICS_COLORS.border}`,
                        }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <SecurityOutlined sx={{ 
                              fontSize: 80, 
                              color: ANALYTICS_COLORS.textSecondary,
                              mb: 2,
                            }} />
                            <Typography variant="h6" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Risk Analysis Chart
                            </Typography>
                            <Typography variant="body2" sx={{ color: ANALYTICS_COLORS.textSecondary }}>
                              Risk visualization would be integrated here
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Reports Tab */}
            <TabPanel value={tabValue} index={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: ANALYTICS_COLORS.glass,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${ANALYTICS_COLORS.shadow}`,
                }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        color: ANALYTICS_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        Generate Reports
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Assessment sx={{ 
                        fontSize: 80, 
                        color: ANALYTICS_COLORS.textSecondary,
                        mb: 3,
                      }} />
                      <Typography variant="h5" sx={{ 
                        color: ANALYTICS_COLORS.textPrimary, 
                        fontWeight: 600,
                        mb: 2,
                      }}>
                        Comprehensive Reports
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: ANALYTICS_COLORS.textSecondary,
                        mb: 4,
                      }}>
                        Generate detailed performance reports, risk analysis, and compliance documents.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          sx={{
                            borderColor: ANALYTICS_COLORS.glassBorder,
                            color: ANALYTICS_COLORS.textPrimary,
                            '&:hover': {
                              borderColor: ANALYTICS_COLORS.accent,
                              background: ANALYTICS_COLORS.surfaceHover,
                            },
                          }}
                        >
                          Performance Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<SecurityOutlined />}
                          sx={{
                            borderColor: ANALYTICS_COLORS.glassBorder,
                            color: ANALYTICS_COLORS.textPrimary,
                            '&:hover': {
                              borderColor: ANALYTICS_COLORS.accent,
                              background: ANALYTICS_COLORS.surfaceHover,
                            },
                          }}
                        >
                          Risk Report
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Assessment />}
                          sx={{
                            background: ANALYTICS_COLORS.accentGradient,
                            color: ANALYTICS_COLORS.textPrimary,
                            '&:hover': {
                              background: ANALYTICS_COLORS.accentHover,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          Full Report
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </TabPanel>
          </Card>
        </motion.div>

        {/* Export Dialog */}
        <Dialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: ANALYTICS_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${ANALYTICS_COLORS.glassBorder}`,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${ANALYTICS_COLORS.shadowElevated}`,
            },
          }}
        >
          <DialogTitle sx={{ color: ANALYTICS_COLORS.textPrimary, fontWeight: 600 }}>
            Export Analytics Data
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: ANALYTICS_COLORS.textSecondary, mb: 3 }}>
              Choose the format and data range for your export:
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: ANALYTICS_COLORS.textSecondary }}>Format</InputLabel>
              <Select
                defaultValue="pdf"
                sx={{ color: ANALYTICS_COLORS.textPrimary }}
              >
                <MenuItem value="pdf">PDF Report</MenuItem>
                <MenuItem value="csv">CSV Data</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: ANALYTICS_COLORS.textSecondary }}>Time Range</InputLabel>
              <Select
                defaultValue="1M"
                sx={{ color: ANALYTICS_COLORS.textPrimary }}
              >
                <MenuItem value="1W">1 Week</MenuItem>
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
                <MenuItem value="1Y">1 Year</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowExportDialog(false)}
              sx={{ color: ANALYTICS_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowExportDialog(false)}
              sx={{
                background: ANALYTICS_COLORS.accentGradient,
                color: ANALYTICS_COLORS.textPrimary,
                '&:hover': {
                  background: ANALYTICS_COLORS.accentHover,
                },
              }}
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;
