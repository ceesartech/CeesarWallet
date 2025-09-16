'use client';

import React, { useState } from 'react';
import AppNavigation from '../components/AppNavigation';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Grid,
  Paper,
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
  Switch,
  FormControlLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Security,
  VerifiedUser,
  Edit,
  Save,
  Cancel,
  Add,
  Delete,
  Warning,
  CheckCircle,
  Error,
  Info,
  AccountBalance,
  CreditCard,
  Fingerprint,
  Shield,
  Lock,
  Visibility,
  VisibilityOff,
  QrCode,
  Download,
  Upload,
  CloudUpload,
  CloudDownload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Modern fintech-inspired color palette
const MODERN_COLORS = {
  background: '#0a0e27',
  backgroundGradient: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #2d3142 100%)',
  surface: '#1a1d3a',
  surfaceElevated: '#2d3142',
  surfaceGradient: 'linear-gradient(145deg, #1a1d3a 0%, #2d3142 100%)',
  surfaceHover: 'linear-gradient(145deg, #2d3142 0%, #3d4152 100%)',
  border: '#3d4152',
  borderGlow: 'rgba(99, 102, 241, 0.3)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#6366f1',
  accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  accentHover: '#8b5cf6',
  accentGlow: 'rgba(99, 102, 241, 0.4)',
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
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
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

const AccountManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showEditPaymentMethod, setShowEditPaymentMethod] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [showKYC, setShowKYC] = useState(false);
  const [kycStep, setKycStep] = useState(0);
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    dateOfBirth: '1990-01-01',
    ssn: '***-**-1234',
    profilePicture: null,
    verificationStatus: 'verified',
    kycStatus: 'completed',
    twoFactorEnabled: true,
    biometricEnabled: false,
  });

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'pm_001',
      type: 'bank',
      name: 'Chase Bank ****1234',
      isDefault: true,
      verified: true,
      lastUsed: '2024-01-15',
    },
    {
      id: 'pm_002',
      type: 'card',
      name: 'Visa ****5678',
      isDefault: false,
      verified: true,
      lastUsed: '2024-01-14',
    },
  ]);

  const [securityEvents, setSecurityEvents] = useState([
    {
      id: 'se_001',
      type: 'login',
      description: 'Successful login from Chrome on Mac',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      location: 'New York, NY',
      ip: '192.168.1.1',
      status: 'success',
    },
    {
      id: 'se_002',
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: new Date('2024-01-14T14:20:00Z'),
      location: 'New York, NY',
      ip: '192.168.1.1',
      status: 'success',
    },
    {
      id: 'se_003',
      type: 'failed_login',
      description: 'Failed login attempt',
      timestamp: new Date('2024-01-13T09:15:00Z'),
      location: 'Unknown',
      ip: '203.0.113.1',
      status: 'warning',
    },
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Here you would typically make an API call to save the profile
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentMethod(true);
  };

  const handleEditPaymentMethod = (method: any) => {
    setEditingPaymentMethod(method);
    setShowEditPaymentMethod(true);
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  const handleKYCStart = () => {
    setShowKYC(true);
    setKycStep(0);
  };

  const handleKYCNext = () => {
    setKycStep(prev => prev + 1);
  };

  const handleKYCBack = () => {
    setKycStep(prev => prev - 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return MODERN_COLORS.success;
      case 'pending': return MODERN_COLORS.warning;
      case 'failed': return MODERN_COLORS.danger;
      case 'success': return MODERN_COLORS.success;
      case 'warning': return MODERN_COLORS.warning;
      default: return MODERN_COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle />;
      case 'pending': return <Warning />;
      case 'failed': return <Error />;
      case 'success': return <CheckCircle />;
      case 'warning': return <Warning />;
      default: return <Info />;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: MODERN_COLORS.backgroundGradient,
      color: MODERN_COLORS.textPrimary,
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
          radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <AppNavigation currentPage="account" />
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{
            background: MODERN_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${MODERN_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${MODERN_COLORS.shadowElevated}`,
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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
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
                        background: MODERN_COLORS.accentGradient,
                        boxShadow: `0 8px 32px ${MODERN_COLORS.accentGlow}`,
                        border: `3px solid ${MODERN_COLORS.glassBorder}`,
                      }}
                    >
                      <Person sx={{ fontSize: 40 }} />
                    </Avatar>
                  </motion.div>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: MODERN_COLORS.textPrimary,
                      background: MODERN_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      Account Management
                    </Typography>
                    <Typography variant="h6" sx={{ color: MODERN_COLORS.textSecondary, fontWeight: 400 }}>
                      Manage your profile, security, and payment methods
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{
                      borderColor: MODERN_COLORS.glassBorder,
                      color: MODERN_COLORS.textPrimary,
                      background: MODERN_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: MODERN_COLORS.accent,
                        background: MODERN_COLORS.surfaceHover,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Export Data
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(!isEditing)}
                    sx={{
                      background: MODERN_COLORS.accentGradient,
                      color: MODERN_COLORS.textPrimary,
                      boxShadow: `0 8px 32px ${MODERN_COLORS.accentGlow}`,
                      '&:hover': {
                        background: MODERN_COLORS.accentHover,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 40px ${MODERN_COLORS.accentGlow}`,
                      },
                    }}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
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
            background: MODERN_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${MODERN_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${MODERN_COLORS.shadowElevated}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ borderBottom: `1px solid ${MODERN_COLORS.glassBorder}` }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: MODERN_COLORS.textSecondary,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '16px',
                    '&.Mui-selected': {
                      color: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: MODERN_COLORS.accent,
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                  },
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person />
                      Profile
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
                      <CreditCard />
                      Payment Methods
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUser />
                      Verification
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: MODERN_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${MODERN_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: MODERN_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Personal Information
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="First Name"
                              value={profile.firstName}
                              onChange={(e) => handleProfileChange('firstName', e.target.value)}
                              disabled={!isEditing}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: MODERN_COLORS.textPrimary,
                                  '& fieldset': {
                                    borderColor: MODERN_COLORS.glassBorder,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Last Name"
                              value={profile.lastName}
                              onChange={(e) => handleProfileChange('lastName', e.target.value)}
                              disabled={!isEditing}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: MODERN_COLORS.textPrimary,
                                  '& fieldset': {
                                    borderColor: MODERN_COLORS.glassBorder,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Email"
                              value={profile.email}
                              onChange={(e) => handleProfileChange('email', e.target.value)}
                              disabled={!isEditing}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: MODERN_COLORS.textPrimary,
                                  '& fieldset': {
                                    borderColor: MODERN_COLORS.glassBorder,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Phone Number"
                              value={profile.phone}
                              onChange={(e) => handleProfileChange('phone', e.target.value)}
                              disabled={!isEditing}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: MODERN_COLORS.textPrimary,
                                  '& fieldset': {
                                    borderColor: MODERN_COLORS.glassBorder,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Address"
                              value={profile.address}
                              onChange={(e) => handleProfileChange('address', e.target.value)}
                              disabled={!isEditing}
                              multiline
                              rows={2}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: MODERN_COLORS.textPrimary,
                                  '& fieldset': {
                                    borderColor: MODERN_COLORS.glassBorder,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: MODERN_COLORS.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                        
                        {/* Save Button - Only show when editing */}
                        {isEditing && (
                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                              variant="outlined"
                              onClick={() => setIsEditing(false)}
                              sx={{
                                color: MODERN_COLORS.textSecondary,
                                borderColor: MODERN_COLORS.glassBorder,
                                '&:hover': {
                                  borderColor: MODERN_COLORS.accent,
                                  backgroundColor: 'rgba(35, 134, 54, 0.1)',
                                },
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<Save />}
                              onClick={handleSaveProfile}
                              sx={{
                                background: MODERN_COLORS.accentGradient,
                                color: MODERN_COLORS.textPrimary,
                                boxShadow: `0 8px 32px ${MODERN_COLORS.accentGlow}`,
                                '&:hover': {
                                  background: MODERN_COLORS.accentHover,
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 12px 40px ${MODERN_COLORS.accentGlow}`,
                                },
                              }}
                            >
                              Save Changes
                            </Button>
                          </Box>
                        )}
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
                      background: MODERN_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${MODERN_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: MODERN_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Account Status
                          </Typography>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                background: MODERN_COLORS.successGradient,
                                width: 40,
                                height: 40,
                              }}>
                                <CheckCircle />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary="Email Verified"
                              secondary="Your email address is verified"
                              sx={{
                                '& .MuiListItemText-primary': {
                                  color: MODERN_COLORS.textPrimary,
                                  fontWeight: 600,
                                },
                                '& .MuiListItemText-secondary': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                            <Chip
                              icon={getStatusIcon(profile.verificationStatus)}
                              label="Verified"
                              size="small"
                              sx={{
                                background: getStatusColor(profile.verificationStatus),
                                color: MODERN_COLORS.textPrimary,
                                fontWeight: 600,
                              }}
                            />
                          </ListItem>
                          
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                background: MODERN_COLORS.successGradient,
                                width: 40,
                                height: 40,
                              }}>
                                <VerifiedUser />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary="KYC Completed"
                              secondary="Identity verification completed"
                              sx={{
                                '& .MuiListItemText-primary': {
                                  color: MODERN_COLORS.textPrimary,
                                  fontWeight: 600,
                                },
                                '& .MuiListItemText-secondary': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                            <Chip
                              icon={getStatusIcon(profile.kycStatus)}
                              label="Completed"
                              size="small"
                              sx={{
                                background: getStatusColor(profile.kycStatus),
                                color: MODERN_COLORS.textPrimary,
                                fontWeight: 600,
                              }}
                            />
                          </ListItem>
                          
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                background: MODERN_COLORS.accentGradient,
                                width: 40,
                                height: 40,
                              }}>
                                <Security />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary="Two-Factor Authentication"
                              secondary="Enhanced security enabled"
                              sx={{
                                '& .MuiListItemText-primary': {
                                  color: MODERN_COLORS.textPrimary,
                                  fontWeight: 600,
                                },
                                '& .MuiListItemText-secondary': {
                                  color: MODERN_COLORS.textSecondary,
                                },
                              }}
                            />
                            <Switch
                              checked={profile.twoFactorEnabled}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: MODERN_COLORS.accent,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: MODERN_COLORS.accent,
                                },
                              }}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{
                      background: MODERN_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${MODERN_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: MODERN_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Security Events
                          </Typography>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          {securityEvents.map((event, index) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <ListItem
                                sx={{
                                  borderBottom: `1px solid ${MODERN_COLORS.glassBorder}`,
                                  '&:hover': {
                                    background: MODERN_COLORS.surfaceHover,
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <ListItemIcon>
                                  <Avatar sx={{ 
                                    background: getStatusColor(event.status) === MODERN_COLORS.success 
                                      ? MODERN_COLORS.successGradient 
                                      : MODERN_COLORS.warningGradient,
                                    width: 40,
                                    height: 40,
                                  }}>
                                    {getStatusIcon(event.status)}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body1" sx={{ color: MODERN_COLORS.textPrimary, fontWeight: 600 }}>
                                      {event.description}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" sx={{ color: MODERN_COLORS.textSecondary }}>
                                        {event.timestamp.toLocaleString()} • {event.location}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: MODERN_COLORS.textSecondary }}>
                                        IP: {event.ip}
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

                <Grid item xs={12} md={4}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{
                      background: MODERN_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${MODERN_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ 
                            color: MODERN_COLORS.textPrimary, 
                            fontWeight: 600,
                          }}>
                            Security Settings
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={() => setShowChangePassword(true)}
                            sx={{
                              borderColor: MODERN_COLORS.glassBorder,
                              color: MODERN_COLORS.textPrimary,
                              '&:hover': {
                                borderColor: MODERN_COLORS.accent,
                                background: MODERN_COLORS.surfaceHover,
                              },
                            }}
                          >
                            Change Password
                          </Button>
                          
                          <Button
                            variant="outlined"
                            startIcon={<Fingerprint />}
                            sx={{
                              borderColor: MODERN_COLORS.glassBorder,
                              color: MODERN_COLORS.textPrimary,
                              '&:hover': {
                                borderColor: MODERN_COLORS.accent,
                                background: MODERN_COLORS.surfaceHover,
                              },
                            }}
                          >
                            Enable Biometric
                          </Button>
                          
                          <Button
                            variant="outlined"
                            startIcon={<QrCode />}
                            sx={{
                              borderColor: MODERN_COLORS.glassBorder,
                              color: MODERN_COLORS.textPrimary,
                              '&:hover': {
                                borderColor: MODERN_COLORS.accent,
                                background: MODERN_COLORS.surfaceHover,
                              },
                            }}
                          >
                            Setup 2FA
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Payment Methods Tab */}
            <TabPanel value={tabValue} index={2}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: MODERN_COLORS.glass,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${MODERN_COLORS.glassBorder}`,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        color: MODERN_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        Payment Methods
                      </Typography>
                    }
                    action={
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddPaymentMethod}
                        sx={{
                          background: MODERN_COLORS.accentGradient,
                          color: MODERN_COLORS.textPrimary,
                          '&:hover': {
                            background: MODERN_COLORS.accentHover,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Add Method
                      </Button>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      {paymentMethods.map((method, index) => (
                        <Grid item xs={12} sm={6} key={method.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card
                              sx={{
                                background: MODERN_COLORS.glass,
                                backdropFilter: 'blur(10px)',
                                border: `2px solid ${method.isDefault ? MODERN_COLORS.accent : MODERN_COLORS.glassBorder}`,
                                borderRadius: 3,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 12px 40px ${MODERN_COLORS.shadowElevated}`,
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <Avatar sx={{ 
                                    background: MODERN_COLORS.accentGradient,
                                    width: 40,
                                    height: 40,
                                  }}>
                                    {method.type === 'bank' ? <AccountBalance /> : <CreditCard />}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ color: MODERN_COLORS.textPrimary, fontWeight: 600 }}>
                                      {method.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: MODERN_COLORS.textSecondary }}>
                                      Last used: {method.lastUsed}
                                    </Typography>
                                  </Box>
                                  {method.isDefault && (
                                    <Chip
                                      label="Default"
                                      size="small"
                                      sx={{
                                        background: MODERN_COLORS.accentGradient,
                                        color: MODERN_COLORS.textPrimary,
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    startIcon={<Edit />}
                                    onClick={() => handleEditPaymentMethod(method)}
                                    sx={{
                                      color: MODERN_COLORS.textSecondary,
                                      '&:hover': {
                                        color: MODERN_COLORS.accent,
                                      },
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<Delete />}
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    sx={{
                                      color: MODERN_COLORS.textSecondary,
                                      '&:hover': {
                                        color: MODERN_COLORS.danger,
                                      },
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </TabPanel>

            {/* Verification Tab */}
            <TabPanel value={tabValue} index={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: MODERN_COLORS.glass,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${MODERN_COLORS.glassBorder}`,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${MODERN_COLORS.shadow}`,
                }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        color: MODERN_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        Identity Verification
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Avatar sx={{ 
                        background: MODERN_COLORS.successGradient,
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 3,
                        boxShadow: `0 8px 32px ${MODERN_COLORS.accentGlow}`,
                      }}>
                        <CheckCircle sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Typography variant="h5" sx={{ 
                        color: MODERN_COLORS.textPrimary, 
                        fontWeight: 600,
                        mb: 2,
                      }}>
                        Verification Complete
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: MODERN_COLORS.textSecondary,
                        mb: 4,
                      }}>
                        Your identity has been successfully verified. You can now access all trading features.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<VerifiedUser />}
                        sx={{
                          background: MODERN_COLORS.accentGradient,
                          color: MODERN_COLORS.textPrimary,
                          '&:hover': {
                            background: MODERN_COLORS.accentHover,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        View Verification Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </TabPanel>
          </Card>
        </motion.div>
      </Box>

      {/* Add Payment Method Dialog */}
      <Dialog
        open={showAddPaymentMethod}
        onClose={() => setShowAddPaymentMethod(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: MODERN_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${MODERN_COLORS.glassBorder}`,
            borderRadius: 3,
            boxShadow: `0 20px 40px ${MODERN_COLORS.shadowElevated}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: MODERN_COLORS.textPrimary,
          fontWeight: 600,
          borderBottom: `1px solid ${MODERN_COLORS.glassBorder}`,
        }}>
          Add Payment Method
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="John Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${MODERN_COLORS.glassBorder}` }}>
          <Button
            onClick={() => setShowAddPaymentMethod(false)}
            sx={{
              color: MODERN_COLORS.textSecondary,
              borderColor: MODERN_COLORS.glassBorder,
              '&:hover': {
                borderColor: MODERN_COLORS.accent,
                backgroundColor: 'rgba(35, 134, 54, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Add payment method logic here
              setShowAddPaymentMethod(false);
            }}
            sx={{
              background: MODERN_COLORS.accentGradient,
              color: MODERN_COLORS.textPrimary,
              '&:hover': {
                background: MODERN_COLORS.accentHover,
              },
            }}
          >
            Add Payment Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Payment Method Dialog */}
      <Dialog
        open={showEditPaymentMethod}
        onClose={() => setShowEditPaymentMethod(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: MODERN_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${MODERN_COLORS.glassBorder}`,
            borderRadius: 3,
            boxShadow: `0 20px 40px ${MODERN_COLORS.shadowElevated}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: MODERN_COLORS.textPrimary,
          fontWeight: 600,
          borderBottom: `1px solid ${MODERN_COLORS.glassBorder}`,
        }}>
          Edit Payment Method
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                defaultValue={editingPaymentMethod?.cardNumber || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
                defaultValue={editingPaymentMethod?.expiryDate || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
                defaultValue={editingPaymentMethod?.cvv || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="John Doe"
                defaultValue={editingPaymentMethod?.cardholderName || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: MODERN_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: MODERN_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: MODERN_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: MODERN_COLORS.textSecondary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={editingPaymentMethod?.isDefault || false}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: MODERN_COLORS.accent,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: MODERN_COLORS.accent,
                      },
                    }}
                  />
                }
                label="Set as default payment method"
                sx={{ color: MODERN_COLORS.textPrimary }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${MODERN_COLORS.glassBorder}` }}>
          <Button
            onClick={() => setShowEditPaymentMethod(false)}
            sx={{
              color: MODERN_COLORS.textSecondary,
              borderColor: MODERN_COLORS.glassBorder,
              '&:hover': {
                borderColor: MODERN_COLORS.accent,
                backgroundColor: 'rgba(35, 134, 54, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Update payment method logic here
              setShowEditPaymentMethod(false);
              setEditingPaymentMethod(null);
            }}
            sx={{
              background: MODERN_COLORS.accentGradient,
              color: MODERN_COLORS.textPrimary,
              '&:hover': {
                background: MODERN_COLORS.accentHover,
              },
            }}
          >
            Update Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountManagement;
