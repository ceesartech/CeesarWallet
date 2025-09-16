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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Slider,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Palette,
  Language,
  AccountCircle,
  VpnKey,
  Email,
  Phone,
  LocationOn,
  DarkMode,
  LightMode,
  VolumeUp,
  VolumeOff,
  Wifi,
  WifiOff,
  Save,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
  Delete,
  Edit,
  Add,
  Remove,
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // General Settings
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    
    // Trading Settings
    defaultOrderType: 'market',
    defaultQuantity: 100,
    maxPositionSize: 10000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    autoTrading: false,
    riskManagement: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    tradeAlerts: true,
    priceAlerts: true,
    newsAlerts: false,
    soundEnabled: true,
    volume: 50,
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: 30,
    loginNotifications: true,
    apiAccess: false,
    whitelistIPs: [],
    
    // Privacy Settings
    dataSharing: false,
    analytics: true,
    crashReports: true,
    marketingEmails: false,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings);
    // Here you would typically make an API call to save settings
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      console.log('Changing password...');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    setShowDeleteAccount(false);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

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
      <AppNavigation currentPage="settings" />
      
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
                    <Settings />
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
                      Settings
                    </Typography>
                    <Typography variant="body1" sx={{ color: LINEAR_COLORS.textSecondary }}>
                      Customize your trading experience
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    sx={{
                      borderColor: LINEAR_COLORS.border,
                      color: LINEAR_COLORS.textPrimary,
                      '&:hover': {
                        borderColor: LINEAR_COLORS.accent,
                        backgroundColor: LINEAR_COLORS.surfaceHover,
                      },
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveSettings}
                    sx={{
                      background: LINEAR_COLORS.accentGradient,
                      color: LINEAR_COLORS.textPrimary,
                      '&:hover': {
                        background: LINEAR_COLORS.accentHover,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 24px ${LINEAR_COLORS.accentGlow}`,
                      },
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              }
            />
          </Card>
        </motion.div>

        {/* Main Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountCircle />
                      General
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings />
                      Trading
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Notifications />
                      Notifications
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security />
                      Security
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Palette />
                      Appearance
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* General Settings */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Language & Region
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Language</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      {languages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      {currencies.map((currency) => (
                        <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Timezone</InputLabel>
                    <Select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      {timezones.map((tz) => (
                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Account Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Email"
                    value="user@example.com"
                    disabled
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value="+1 (555) 123-4567"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<VpnKey />}
                    onClick={() => setShowChangePassword(true)}
                    sx={{
                      borderColor: LINEAR_COLORS.border,
                      color: LINEAR_COLORS.textPrimary,
                      '&:hover': {
                        borderColor: LINEAR_COLORS.accent,
                        backgroundColor: LINEAR_COLORS.surfaceHover,
                      },
                    }}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Trading Settings */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Order Defaults
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Default Order Type</InputLabel>
                    <Select
                      value={settings.defaultOrderType}
                      onChange={(e) => handleSettingChange('defaultOrderType', e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      <MenuItem value="market">Market</MenuItem>
                      <MenuItem value="limit">Limit</MenuItem>
                      <MenuItem value="stop">Stop</MenuItem>
                      <MenuItem value="stop_limit">Stop Limit</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Default Quantity"
                    type="number"
                    value={settings.defaultQuantity}
                    onChange={(e) => handleSettingChange('defaultQuantity', parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Max Position Size"
                    type="number"
                    value={settings.maxPositionSize}
                    onChange={(e) => handleSettingChange('maxPositionSize', parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Risk Management
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary, mb: 1 }}>
                      Stop Loss Percentage: {settings.stopLossPercentage}%
                    </Typography>
                    <Slider
                      value={settings.stopLossPercentage}
                      onChange={(e, value) => handleSettingChange('stopLossPercentage', value)}
                      min={1}
                      max={20}
                      step={1}
                      sx={{
                        color: LINEAR_COLORS.accent,
                        '& .MuiSlider-thumb': {
                          backgroundColor: LINEAR_COLORS.accent,
                        },
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary, mb: 1 }}>
                      Take Profit Percentage: {settings.takeProfitPercentage}%
                    </Typography>
                    <Slider
                      value={settings.takeProfitPercentage}
                      onChange={(e, value) => handleSettingChange('takeProfitPercentage', value)}
                      min={5}
                      max={50}
                      step={1}
                      sx={{
                        color: LINEAR_COLORS.accent,
                        '& .MuiSlider-thumb': {
                          backgroundColor: LINEAR_COLORS.accent,
                        },
                      }}
                    />
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoTrading}
                        onChange={(e) => handleSettingChange('autoTrading', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Enable Auto Trading"
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.riskManagement}
                        onChange={(e) => handleSettingChange('riskManagement', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Enable Risk Management"
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Notification Settings */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Notification Channels
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Email Notifications"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Push Notifications"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smsNotifications}
                        onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="SMS Notifications"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Alert Types
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.tradeAlerts}
                        onChange={(e) => handleSettingChange('tradeAlerts', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Trade Alerts"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.priceAlerts}
                        onChange={(e) => handleSettingChange('priceAlerts', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Price Alerts"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.newsAlerts}
                        onChange={(e) => handleSettingChange('newsAlerts', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="News Alerts"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: LINEAR_COLORS.textSecondary, mb: 1 }}>
                      Sound Volume: {settings.volume}%
                    </Typography>
                    <Slider
                      value={settings.volume}
                      onChange={(e, value) => handleSettingChange('volume', value)}
                      min={0}
                      max={100}
                      step={10}
                      sx={{
                        color: LINEAR_COLORS.accent,
                        '& .MuiSlider-thumb': {
                          backgroundColor: LINEAR_COLORS.accent,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Security Settings */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Authentication
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Two-Factor Authentication"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Session Timeout</InputLabel>
                    <Select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                      sx={{ color: LINEAR_COLORS.textPrimary }}
                    >
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                      <MenuItem value={0}>Never</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.loginNotifications}
                        onChange={(e) => handleSettingChange('loginNotifications', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Login Notifications"
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    API Access
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.apiAccess}
                        onChange={(e) => handleSettingChange('apiAccess', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Enable API Access"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}
                  />
                  
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      backgroundColor: LINEAR_COLORS.surface,
                      border: `1px solid ${LINEAR_COLORS.warning}`,
                      '& .MuiAlert-icon': {
                        color: LINEAR_COLORS.warning,
                      },
                    }}
                  >
                    API access allows third-party applications to access your account. Use with caution.
                  </Alert>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setShowDeleteAccount(true)}
                    sx={{
                      mt: 2,
                      borderColor: LINEAR_COLORS.danger,
                      color: LINEAR_COLORS.danger,
                      '&:hover': {
                        borderColor: LINEAR_COLORS.danger,
                        backgroundColor: 'rgba(218, 54, 51, 0.1)',
                      },
                    }}
                  >
                    Delete Account
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Appearance Settings */}
            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Theme
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Card
                      sx={{
                        background: settings.theme === 'dark' ? LINEAR_COLORS.surfaceHover : LINEAR_COLORS.surfaceGradient,
                        border: `2px solid ${settings.theme === 'dark' ? LINEAR_COLORS.accent : LINEAR_COLORS.border}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        p: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleSettingChange('theme', 'dark')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DarkMode />
                        <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>Dark</Typography>
                      </Box>
                    </Card>
                    <Card
                      sx={{
                        background: settings.theme === 'light' ? LINEAR_COLORS.surfaceHover : LINEAR_COLORS.surfaceGradient,
                        border: `2px solid ${settings.theme === 'light' ? LINEAR_COLORS.accent : LINEAR_COLORS.border}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        p: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleSettingChange('theme', 'light')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LightMode />
                        <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>Light</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                    Privacy
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.dataSharing}
                        onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Share Data for Analytics"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.crashReports}
                        onChange={(e) => handleSettingChange('crashReports', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Send Crash Reports"
                    sx={{ color: LINEAR_COLORS.textPrimary, mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.marketingEmails}
                        onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: LINEAR_COLORS.accent,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: LINEAR_COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Marketing Emails"
                    sx={{ color: LINEAR_COLORS.textPrimary }}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </motion.div>

        {/* Change Password Dialog */}
        <Dialog
          open={showChangePassword}
          onClose={() => setShowChangePassword(false)}
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
            Change Password
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            {newPassword !== confirmPassword && confirmPassword && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Passwords do not match
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowChangePassword(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 8}
              sx={{
                background: LINEAR_COLORS.accentGradient,
                color: LINEAR_COLORS.textPrimary,
                '&:hover': {
                  background: LINEAR_COLORS.accentHover,
                },
              }}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog
          open={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
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
          <DialogTitle sx={{ color: LINEAR_COLORS.danger, fontWeight: 600 }}>
            Delete Account
          </DialogTitle>
          <DialogContent>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                backgroundColor: LINEAR_COLORS.surface,
                border: `1px solid ${LINEAR_COLORS.danger}`,
                '& .MuiAlert-icon': {
                  color: LINEAR_COLORS.danger,
                },
              }}
            >
              This action cannot be undone. All your data will be permanently deleted.
            </Alert>
            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>
              Are you sure you want to delete your account? This will permanently remove all your trading data, positions, and account information.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowDeleteAccount(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              sx={{
                background: LINEAR_COLORS.dangerGradient,
                color: LINEAR_COLORS.textPrimary,
                '&:hover': {
                  background: '#f85149',
                },
              }}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SettingsPage;
