'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AppNavigation from '../components/AppNavigation';
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
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Slider,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Notifications,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Email,
  Sms,
  Phone,
  Warning,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Settings,
  Security,
  Speed,
  Refresh,
  FilterList,
  Search,
  MoreVert,
  Close,
  Save,
  Cancel,
  Schedule,
  Timer,
  Repeat,
  LocationOn,
  Person,
  Group,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Modern notification-inspired color palette
const ALERT_COLORS = {
  background: '#0c0f1c',
  backgroundGradient: 'linear-gradient(135deg, #0c0f1c 0%, #1a1d2e 50%, #2d3142 100%)',
  surface: '#1a1d2e',
  surfaceElevated: '#2d3142',
  surfaceGradient: 'linear-gradient(145deg, #1a1d2e 0%, #2d3142 100%)',
  surfaceHover: 'linear-gradient(145deg, #2d3142 0%, #3d4152 100%)',
  border: '#3d4152',
  borderGlow: 'rgba(139, 92, 246, 0.3)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#8b5cf6',
  accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  accentHover: '#7c3aed',
  accentGlow: 'rgba(139, 92, 246, 0.4)',
  success: '#10b981',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: '#f59e0b',
  warningGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  danger: '#ef4444',
  dangerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  info: '#3b82f6',
  infoGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
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

const AlertsPage: React.FC = () => {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert_001',
      name: 'AAPL Price Alert',
      type: 'price',
      symbol: 'AAPL',
      condition: 'above',
      value: 180,
      status: 'active',
      channels: ['email', 'push'],
      lastTriggered: '2024-01-15T10:30:00Z',
      triggerCount: 3,
    },
    {
      id: 'alert_002',
      name: 'Portfolio Loss Alert',
      type: 'portfolio',
      condition: 'below',
      value: -5,
      status: 'active',
      channels: ['email', 'sms'],
      lastTriggered: null,
      triggerCount: 0,
    },
    {
      id: 'alert_003',
      name: 'High Volume Alert',
      type: 'volume',
      symbol: 'TSLA',
      condition: 'above',
      value: 50000000,
      status: 'paused',
      channels: ['push'],
      lastTriggered: '2024-01-14T14:20:00Z',
      triggerCount: 1,
    },
    {
      id: 'alert_004',
      name: 'Market Open Alert',
      type: 'time',
      condition: 'at',
      value: '09:30',
      status: 'active',
      channels: ['email', 'push'],
      lastTriggered: '2024-01-15T09:30:00Z',
      triggerCount: 5,
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif_001',
      type: 'price',
      title: 'AAPL Price Alert Triggered',
      message: 'AAPL has reached $182.50 (above $180.00)',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      read: false,
      priority: 'high',
    },
    {
      id: 'notif_002',
      type: 'portfolio',
      title: 'Portfolio Performance Update',
      message: 'Your portfolio is up 2.3% today',
      timestamp: new Date('2024-01-15T09:45:00Z'),
      read: false,
      priority: 'medium',
    },
    {
      id: 'notif_003',
      type: 'security',
      title: 'New Login Detected',
      message: 'Login from Chrome on Mac at 10:30 AM',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      read: true,
      priority: 'low',
    },
    {
      id: 'notif_004',
      type: 'trade',
      title: 'Trade Executed',
      message: 'Buy order for 100 AAPL shares executed at $182.50',
      timestamp: new Date('2024-01-15T10:25:00Z'),
      read: true,
      priority: 'high',
    },
  ]);

  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'price',
    symbol: '',
    condition: 'above',
    value: '',
    channels: ['email'],
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateAlert = () => {
    const alert = {
      id: `alert_${Date.now()}`,
      name: newAlert.name,
      type: newAlert.type,
      symbol: newAlert.symbol,
      condition: newAlert.condition,
      value: parseFloat(newAlert.value) || 0,
      status: 'active',
      channels: newAlert.channels,
      lastTriggered: '',
      triggerCount: 0,
    };
    setAlerts(prev => [...prev, alert]);
    setShowCreateAlert(false);
    setNewAlert({
      name: '',
      type: 'price',
      symbol: '',
      condition: 'above',
      value: '',
      channels: ['email'],
    });
  };

  const handleEditAlert = (alert: any) => {
    setEditingAlert(alert);
    setShowEditAlert(true);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id 
        ? { ...alert, status: alert.status === 'active' ? 'paused' : 'active' }
        : alert
    ));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return <AttachMoney />;
      case 'portfolio': return <TrendingUp />;
      case 'volume': return <Speed />;
      case 'time': return <Schedule />;
      case 'security': return <Security />;
      default: return <Notifications />;
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price': return ALERT_COLORS.accent;
      case 'portfolio': return ALERT_COLORS.success;
      case 'volume': return ALERT_COLORS.info;
      case 'time': return ALERT_COLORS.warning;
      case 'security': return ALERT_COLORS.danger;
      default: return ALERT_COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return ALERT_COLORS.danger;
      case 'medium': return ALERT_COLORS.warning;
      case 'low': return ALERT_COLORS.info;
      default: return ALERT_COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return ALERT_COLORS.success;
      case 'paused': return ALERT_COLORS.warning;
      case 'inactive': return ALERT_COLORS.textSecondary;
      default: return ALERT_COLORS.textSecondary;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: ALERT_COLORS.backgroundGradient,
      color: ALERT_COLORS.textPrimary,
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
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <AppNavigation currentPage="alerts" />
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{
            background: ALERT_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${ALERT_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${ALERT_COLORS.shadowElevated}`,
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
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
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
                    <Badge badgeContent={unreadCount} color="error">
                      <Avatar 
                        sx={{ 
                          width: 80,
                          height: 80,
                          background: ALERT_COLORS.accentGradient,
                          boxShadow: `0 8px 32px ${ALERT_COLORS.accentGlow}`,
                          border: `3px solid ${ALERT_COLORS.glassBorder}`,
                        }}
                      >
                        <Notifications sx={{ fontSize: 40 }} />
                      </Avatar>
                    </Badge>
                  </motion.div>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: ALERT_COLORS.textPrimary,
                      background: ALERT_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      Alerts & Notifications
                    </Typography>
                    <Typography variant="h6" sx={{ color: ALERT_COLORS.textSecondary, fontWeight: 400 }}>
                      Stay informed with smart alerts and real-time notifications
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    sx={{
                      borderColor: ALERT_COLORS.glassBorder,
                      color: ALERT_COLORS.textPrimary,
                      background: ALERT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: ALERT_COLORS.accent,
                        background: ALERT_COLORS.surfaceHover,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowCreateAlert(true)}
                    sx={{
                      background: ALERT_COLORS.accentGradient,
                      color: ALERT_COLORS.textPrimary,
                      boxShadow: `0 8px 32px ${ALERT_COLORS.accentGlow}`,
                      '&:hover': {
                        background: ALERT_COLORS.accentHover,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 40px ${ALERT_COLORS.accentGlow}`,
                      },
                    }}
                  >
                    Create Alert
                  </Button>
                </Box>
              }
            />
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card sx={{
            background: ALERT_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${ALERT_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${ALERT_COLORS.shadowElevated}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ borderBottom: `1px solid ${ALERT_COLORS.glassBorder}` }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: ALERT_COLORS.textSecondary,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '16px',
                    '&.Mui-selected': {
                      color: ALERT_COLORS.accent,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: ALERT_COLORS.accent,
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                  },
                }}
              >
                <Tab 
                  label={
                    <Badge badgeContent={alerts.filter(a => a.status === 'active').length} color="primary">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer />
                        Active Alerts
                      </Box>
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={unreadCount} color="error">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notifications />
                        Notifications
                      </Box>
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings />
                      Settings
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Active Alerts Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {alerts.map((alert, index) => (
                  <Grid item xs={12} md={6} lg={4} key={alert.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card sx={{
                        background: ALERT_COLORS.glass,
                        backdropFilter: 'blur(10px)',
                        border: `2px solid ${alert.status === 'active' ? ALERT_COLORS.accent : ALERT_COLORS.glassBorder}`,
                        borderRadius: 3,
                        boxShadow: `0 8px 32px ${ALERT_COLORS.shadow}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 40px ${ALERT_COLORS.shadowElevated}`,
                        },
                      }}>
                        <CardHeader
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ 
                                background: getAlertTypeColor(alert.type),
                                width: 40,
                                height: 40,
                              }}>
                                {getAlertTypeIcon(alert.type)}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ 
                                  color: ALERT_COLORS.textPrimary, 
                                  fontWeight: 600,
                                }}>
                                  {alert.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: ALERT_COLORS.textSecondary }}>
                                  {alert.symbol && `${alert.symbol} • `}{alert.condition} {alert.value}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          action={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title={alert.status === 'active' ? 'Pause' : 'Resume'} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleAlert(alert.id)}
                                  sx={{
                                    color: alert.status === 'active' ? ALERT_COLORS.success : ALERT_COLORS.warning,
                                  }}
                                >
                                  {alert.status === 'active' ? <Pause /> : <PlayArrow />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditAlert(alert)}
                                  sx={{ color: ALERT_COLORS.textSecondary }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAlert(alert.id)}
                                  sx={{ color: ALERT_COLORS.danger }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Chip
                              label={alert.status}
                              size="small"
                              sx={{
                                background: getStatusColor(alert.status),
                                color: ALERT_COLORS.textPrimary,
                                fontWeight: 600,
                              }}
                            />
                            <Typography variant="body2" sx={{ color: ALERT_COLORS.textSecondary }}>
                              Triggered {alert.triggerCount} times
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            {alert.channels.map((channel) => (
                              <Chip
                                key={channel}
                                label={channel}
                                size="small"
                                sx={{
                                  background: ALERT_COLORS.surface,
                                  color: ALERT_COLORS.textPrimary,
                                  fontSize: '10px',
                                }}
                              />
                            ))}
                          </Box>
                          {alert.lastTriggered && (
                            <Typography variant="caption" sx={{ color: ALERT_COLORS.textSecondary }}>
                              Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={1}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: ALERT_COLORS.glass,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${ALERT_COLORS.glassBorder}`,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${ALERT_COLORS.shadow}`,
                }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        color: ALERT_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        Recent Notifications
                      </Typography>
                    }
                    action={
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
                        }}
                        sx={{
                          borderColor: ALERT_COLORS.glassBorder,
                          color: ALERT_COLORS.textPrimary,
                          '&:hover': {
                            borderColor: ALERT_COLORS.accent,
                            background: ALERT_COLORS.surfaceHover,
                          },
                        }}
                      >
                        Mark All Read
                      </Button>
                    }
                  />
                  <CardContent>
                    <List sx={{ p: 0 }}>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ListItem
                            sx={{
                              borderBottom: `1px solid ${ALERT_COLORS.glassBorder}`,
                              backgroundColor: notification.read ? 'transparent' : ALERT_COLORS.surface,
                              '&:hover': {
                                background: ALERT_COLORS.surfaceHover,
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <ListItemIcon>
                              <Avatar sx={{ 
                                background: getPriorityColor(notification.priority),
                                width: 40,
                                height: 40,
                              }}>
                                {getAlertTypeIcon(notification.type)}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ 
                                    color: ALERT_COLORS.textPrimary, 
                                    fontWeight: notification.read ? 400 : 600,
                                  }}>
                                    {notification.title}
                                  </Typography>
                                  {!notification.read && (
                                    <Box sx={{ 
                                      width: 8, 
                                      height: 8, 
                                      borderRadius: '50%', 
                                      background: ALERT_COLORS.accent,
                                    }} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: ALERT_COLORS.textSecondary }}>
                                    {notification.message}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: ALERT_COLORS.textSecondary }}>
                                    {notification.timestamp.toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Details" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      // Show detailed view of the notification
                                      alert(`Notification Details:\n\nTitle: ${notification.title}\nMessage: ${notification.message}\nType: ${notification.type}\nPriority: ${notification.priority}\nTimestamp: ${notification.timestamp.toLocaleString()}`);
                                    }}
                                    sx={{ color: ALERT_COLORS.textSecondary }}
                                  >
                                    <Info />
                                  </IconButton>
                                </Tooltip>
                                {!notification.read && (
                                  <Tooltip title="Mark as Read" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      sx={{ color: ALERT_COLORS.textSecondary }}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    sx={{ color: ALERT_COLORS.danger }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </motion.div>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: ALERT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ALERT_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ALERT_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ALERT_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Notification Channels
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                defaultChecked
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: ALERT_COLORS.accent,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: ALERT_COLORS.accent,
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email />
                                <Typography sx={{ color: ALERT_COLORS.textPrimary }}>
                                  Email Notifications
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                defaultChecked
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: ALERT_COLORS.accent,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: ALERT_COLORS.accent,
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Notifications />
                                <Typography sx={{ color: ALERT_COLORS.textPrimary }}>
                                  Push Notifications
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: ALERT_COLORS.accent,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: ALERT_COLORS.accent,
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Sms />
                                <Typography sx={{ color: ALERT_COLORS.textPrimary }}>
                                  SMS Notifications
                                </Typography>
                              </Box>
                            }
                          />
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
                      background: ALERT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${ALERT_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${ALERT_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: ALERT_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Alert Preferences
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Box>
                            <Typography sx={{ color: ALERT_COLORS.textSecondary, mb: 1 }}>
                              Notification Frequency
                            </Typography>
                            <Slider
                              defaultValue={50}
                              sx={{
                                color: ALERT_COLORS.accent,
                                '& .MuiSlider-thumb': {
                                  backgroundColor: ALERT_COLORS.accent,
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ color: ALERT_COLORS.textSecondary, mb: 1 }}>
                              Quiet Hours
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <TextField
                                size="small"
                                placeholder="22:00"
                                sx={{ flex: 1 }}
                              />
                              <Typography sx={{ color: ALERT_COLORS.textSecondary, alignSelf: 'center' }}>
                                to
                              </Typography>
                              <TextField
                                size="small"
                                placeholder="08:00"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </motion.div>

        {/* Create Alert Dialog */}
        <Dialog
          open={showCreateAlert}
          onClose={() => setShowCreateAlert(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: ALERT_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${ALERT_COLORS.glassBorder}`,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${ALERT_COLORS.shadowElevated}`,
            },
          }}
        >
          <DialogTitle sx={{ color: ALERT_COLORS.textPrimary, fontWeight: 600 }}>
            Create New Alert
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Name"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: ALERT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: ALERT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: ALERT_COLORS.textSecondary }}>Alert Type</InputLabel>
                  <Select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value }))}
                    sx={{ color: ALERT_COLORS.textPrimary }}
                  >
                    <MenuItem value="price">Price Alert</MenuItem>
                    <MenuItem value="portfolio">Portfolio Alert</MenuItem>
                    <MenuItem value="volume">Volume Alert</MenuItem>
                    <MenuItem value="time">Time Alert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Symbol"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, symbol: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: ALERT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: ALERT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: ALERT_COLORS.textSecondary }}>Condition</InputLabel>
                  <Select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
                    sx={{ color: ALERT_COLORS.textPrimary }}
                  >
                    <MenuItem value="above">Above</MenuItem>
                    <MenuItem value="below">Below</MenuItem>
                    <MenuItem value="equals">Equals</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Value"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, value: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: ALERT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: ALERT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: ALERT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowCreateAlert(false)}
              sx={{ color: ALERT_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlert}
              disabled={!newAlert.name || !newAlert.value}
              sx={{
                background: ALERT_COLORS.accentGradient,
                color: ALERT_COLORS.textPrimary,
                '&:hover': {
                  background: ALERT_COLORS.accentHover,
                },
              }}
            >
              Create Alert
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Alert Dialog */}
        <Dialog
          open={showEditAlert}
          onClose={() => setShowEditAlert(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: ALERT_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${ALERT_COLORS.glassBorder}`,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${ALERT_COLORS.shadowElevated}`,
            },
          }}
        >
          <DialogTitle sx={{ color: ALERT_COLORS.textPrimary, fontWeight: 600 }}>
            Edit Alert
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Name"
                  value={editingAlert?.name || ''}
                  onChange={(e) => setEditingAlert((prev: any) => ({ ...prev, name: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': { borderColor: ALERT_COLORS.glassBorder },
                      '&:hover fieldset': { borderColor: ALERT_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: ALERT_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: ALERT_COLORS.textSecondary },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Symbol"
                  value={editingAlert?.symbol || ''}
                  onChange={(e) => setEditingAlert((prev: any) => ({ ...prev, symbol: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': { borderColor: ALERT_COLORS.glassBorder },
                      '&:hover fieldset': { borderColor: ALERT_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: ALERT_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: ALERT_COLORS.textSecondary },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Value"
                  type="number"
                  value={editingAlert?.value || ''}
                  onChange={(e) => setEditingAlert((prev: any) => ({ ...prev, value: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': { borderColor: ALERT_COLORS.glassBorder },
                      '&:hover fieldset': { borderColor: ALERT_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: ALERT_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: ALERT_COLORS.textSecondary },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Condition"
                  select
                  value={editingAlert?.condition || 'above'}
                  onChange={(e) => setEditingAlert((prev: any) => ({ ...prev, condition: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: ALERT_COLORS.textPrimary,
                      '& fieldset': { borderColor: ALERT_COLORS.glassBorder },
                      '&:hover fieldset': { borderColor: ALERT_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: ALERT_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: ALERT_COLORS.textSecondary },
                  }}
                >
                  <MenuItem value="above">Above</MenuItem>
                  <MenuItem value="below">Below</MenuItem>
                  <MenuItem value="at">At</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: ALERT_COLORS.textSecondary, mb: 1 }}>
                  Notification Channels
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['email', 'push', 'sms'].map((channel) => (
                    <Chip
                      key={channel}
                      label={channel}
                      size="small"
                      color={editingAlert?.channels?.includes(channel) ? 'primary' : 'default'}
                      onClick={() => {
                        const channels = editingAlert?.channels || [];
                        const newChannels = channels.includes(channel)
                          ? channels.filter((c: string) => c !== channel)
                          : [...channels, channel];
                        setEditingAlert((prev: any) => ({ ...prev, channels: newChannels }));
                      }}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: editingAlert?.channels?.includes(channel) 
                          ? ALERT_COLORS.accent 
                          : ALERT_COLORS.surface,
                        color: editingAlert?.channels?.includes(channel) 
                          ? ALERT_COLORS.textPrimary 
                          : ALERT_COLORS.textSecondary,
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowEditAlert(false)}
              sx={{ color: ALERT_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Update the alert in the alerts array
                setAlerts(prev => prev.map(alert => 
                  alert.id === editingAlert.id ? editingAlert : alert
                ));
                setShowEditAlert(false);
                setEditingAlert(null);
              }}
              disabled={!editingAlert?.name || !editingAlert?.value}
              sx={{
                background: ALERT_COLORS.accentGradient,
                color: ALERT_COLORS.textPrimary,
                '&:hover': {
                  background: ALERT_COLORS.accentHover,
                },
                '&:disabled': {
                  background: '#2a2a2a',
                  color: '#a0a0a0',
                },
              }}
            >
              Update Alert
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AlertsPage;
