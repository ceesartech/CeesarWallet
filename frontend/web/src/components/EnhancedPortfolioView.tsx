'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
  Paper,
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Security,
  Visibility,
  VisibilityOff,
  FilterList,
  Sort,
  Download,
  Share,
  MoreVert,
  Close,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedPortfolioViewProps {
  portfolio: any;
  positions: any[];
  onRefresh?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

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

const EnhancedPortfolioView: React.FC<EnhancedPortfolioViewProps> = ({
  portfolio,
  positions,
  onRefresh,
  onExport,
  onShare,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const filteredPositions = positions.filter(position => {
    if (filterBy === 'all') return true;
    if (filterBy === 'profitable') return position.unrealizedPnL > 0;
    if (filterBy === 'losing') return position.unrealizedPnL < 0;
    if (filterBy === 'large') return Math.abs(position.unrealizedPnL) > 1000;
    return true;
  });

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.quantity * b.currentPrice - a.quantity * a.currentPrice;
      case 'pnl':
        return b.unrealizedPnL - a.unrealizedPnL;
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      default:
        return 0;
    }
  });

  const totalValue = portfolio?.totalValue || 0;
  const totalPnL = portfolio?.totalPnL || 0;
  const totalPnLPercentage = portfolio?.totalPnLPercentage || 0;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Enhanced Portfolio Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: LINEAR_COLORS.textPrimary,
                  background: LINEAR_COLORS.accentGradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Portfolio Overview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh Portfolio" arrow>
                    <IconButton
                      onClick={onRefresh}
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
                      <AccountBalance />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Data" arrow>
                    <IconButton
                      onClick={() => setShowExportDialog(true)}
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
                  <Tooltip title="Share Portfolio" arrow>
                    <IconButton
                      onClick={onShare}
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
                      <Share />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* Total Value */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    background: LINEAR_COLORS.surfaceGradient,
                    border: `1px solid ${LINEAR_COLORS.border}`,
                    borderRadius: 2,
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadow}`,
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
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        background: LINEAR_COLORS.accentGradient,
                        mr: 2,
                        boxShadow: `0 4px 16px ${LINEAR_COLORS.accentGlow}`,
                      }}
                    >
                      <AccountBalance />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Total Value
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: LINEAR_COLORS.textPrimary, 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    ${totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    Portfolio Value
                  </Typography>
                </Paper>
              </Grid>

              {/* Total P&L */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    background: LINEAR_COLORS.surfaceGradient,
                    border: `1px solid ${LINEAR_COLORS.border}`,
                    borderRadius: 2,
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadow}`,
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
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        background: totalPnL >= 0 ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                        mr: 2,
                        boxShadow: totalPnL >= 0 
                          ? `0 4px 16px ${LINEAR_COLORS.accentGlow}`
                          : `0 4px 16px rgba(218, 54, 51, 0.4)`,
                      }}
                    >
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
                    {totalPnLPercentage.toFixed(2)}% Return
                  </Typography>
                </Paper>
              </Grid>

              {/* Positions Count */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    background: LINEAR_COLORS.surfaceGradient,
                    border: `1px solid ${LINEAR_COLORS.border}`,
                    borderRadius: 2,
                    boxShadow: `0 4px 16px ${LINEAR_COLORS.shadow}`,
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
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        background: LINEAR_COLORS.infoGradient,
                        mr: 2,
                        boxShadow: `0 4px 16px rgba(88, 166, 255, 0.4)`,
                      }}
                    >
                      <Security />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                      Active Positions
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: LINEAR_COLORS.textPrimary, 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {positions.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                    Open Positions
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Positions List */}
      <Box sx={{ mt: 3 }}>
        <Paper
          sx={{
            background: LINEAR_COLORS.surfaceGradient,
            border: `1px solid ${LINEAR_COLORS.border}`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${LINEAR_COLORS.shadow}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3, borderBottom: `1px solid ${LINEAR_COLORS.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                Position Details
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Filter</InputLabel>
                  <Select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  >
                    <MenuItem value="all">All Positions</MenuItem>
                    <MenuItem value="profitable">Profitable</MenuItem>
                    <MenuItem value="losing">Losing</MenuItem>
                    <MenuItem value="large">Large Positions</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  >
                    <MenuItem value="value">Value</MenuItem>
                    <MenuItem value="pnl">P&L</MenuItem>
                    <MenuItem value="symbol">Symbol</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          <List sx={{ p: 0 }}>
            <AnimatePresence>
              {sortedPositions.map((position, index) => (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
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
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                            {position.symbol}
                          </Typography>
                          <Chip
                            label={position.side}
                            size="small"
                            sx={{
                              background: position.side === 'long' ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                              color: LINEAR_COLORS.textPrimary,
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={position.status}
                            size="small"
                            sx={{
                              background: position.status === 'open' ? LINEAR_COLORS.infoGradient : LINEAR_COLORS.warningGradient,
                              color: LINEAR_COLORS.textPrimary,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                            Quantity: {position.quantity} | Entry: ${position.entryPrice} | Current: ${position.currentPrice}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: position.unrealizedPnL >= 0 ? LINEAR_COLORS.success : LINEAR_COLORS.danger,
                              fontWeight: 600,
                            }}
                          >
                            P&L: ${position.unrealizedPnL.toLocaleString()} ({((position.unrealizedPnL / (position.quantity * position.entryPrice)) * 100).toFixed(2)}%)
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 700 }}>
                          ${(position.quantity * position.currentPrice).toLocaleString()}
                        </Typography>
                        <IconButton
                          onClick={() => setShowDetails(!showDetails)}
                          sx={{
                            color: LINEAR_COLORS.textSecondary,
                            '&:hover': {
                              color: LINEAR_COLORS.accent,
                            },
                          }}
                        >
                          {showDetails ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Paper>
      </Box>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
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
          Export Portfolio Data
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              sx={{ color: LINEAR_COLORS.textPrimary }}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="pdf">PDF Report</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowExportDialog(false)}
            sx={{ color: LINEAR_COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Exporting portfolio data as', exportFormat);
              setShowExportDialog(false);
            }}
            sx={{
              background: LINEAR_COLORS.accentGradient,
              color: LINEAR_COLORS.textPrimary,
              '&:hover': {
                background: LINEAR_COLORS.accentHover,
              },
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPortfolioView;
