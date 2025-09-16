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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Badge,
  Alert,
  LinearProgress,
  MenuItem,
} from '@mui/material';
import {
  Help,
  Support,
  Chat,
  Email,
  Phone,
  Search,
  ExpandMore,
  QuestionAnswer,
  Article,
  VideoLibrary,
  School,
  BugReport,
  Feedback,
  ContactSupport,
  LiveHelp,
  Forum,
  Book,
  Lightbulb,
  Security,
  Speed,
  TrendingUp,
  AccountBalance,
  Settings,
  Notifications,
  Add,
  Send,
  Close,
  CheckCircle,
  Schedule,
  Person,
  Group,
  Star,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Modern support-inspired color palette
const SUPPORT_COLORS = {
  background: '#0f1419',
  backgroundGradient: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3142 100%)',
  surface: '#1a1f2e',
  surfaceElevated: '#2d3142',
  surfaceGradient: 'linear-gradient(145deg, #1a1f2e 0%, #2d3142 100%)',
  surfaceHover: 'linear-gradient(145deg, #2d3142 0%, #3d4152 100%)',
  border: '#3d4152',
  borderGlow: 'rgba(16, 185, 129, 0.3)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#10b981',
  accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentHover: '#059669',
  accentGlow: 'rgba(16, 185, 129, 0.4)',
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
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
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

const HelpSupportPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showAccountRecovery, setShowAccountRecovery] = useState(false);
  const [showTradingHelp, setShowTradingHelp] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: 'general',
    message: '',
  });

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: <School />,
      questions: [
        {
          question: 'How do I create my first trade?',
          answer: 'To create your first trade, navigate to the dashboard and click the "New Trade" button. Select your symbol, choose the order type (market, limit, or stop), enter the quantity, and click "Place Order".',
        },
        {
          question: 'What is the minimum deposit amount?',
          answer: 'The minimum deposit amount is $100. You can deposit funds through bank transfer, wire transfer, credit card, or cryptocurrency.',
        },
        {
          question: 'How do I verify my account?',
          answer: 'Go to Account Management > Verification and follow the KYC process. You\'ll need to provide a government-issued ID and proof of address.',
        },
      ],
    },
    {
      title: 'Trading',
      icon: <TrendingUp />,
      questions: [
        {
          question: 'What trading fees do you charge?',
          answer: 'We charge competitive trading fees starting at 0.1% per trade. Fees vary by order type and market conditions.',
        },
        {
          question: 'Can I trade cryptocurrencies?',
          answer: 'Yes, we support trading of major cryptocurrencies including Bitcoin, Ethereum, and many altcoins.',
        },
        {
          question: 'What are the trading hours?',
          answer: 'Stock markets follow regular trading hours (9:30 AM - 4:00 PM EST), while cryptocurrency markets are open 24/7.',
        },
      ],
    },
    {
      title: 'Account & Security',
      icon: <Security />,
      questions: [
        {
          question: 'How do I enable two-factor authentication?',
          answer: 'Go to Settings > Security and toggle on "Two-Factor Authentication". Follow the setup process to link your authenticator app.',
        },
        {
          question: 'What should I do if I suspect unauthorized access?',
          answer: 'Immediately change your password and contact our security team. We also recommend enabling 2FA if you haven\'t already.',
        },
        {
          question: 'How do I update my personal information?',
          answer: 'Navigate to Account Management > Profile and click "Edit Profile" to update your personal information.',
        },
      ],
    },
    {
      title: 'Funding & Withdrawals',
      icon: <AccountBalance />,
      questions: [
        {
          question: 'How long do withdrawals take?',
          answer: 'Withdrawal times vary by method: Bank transfers take 1-3 business days, wire transfers are same-day, and cryptocurrency withdrawals take 10-30 minutes.',
        },
        {
          question: 'Are there withdrawal limits?',
          answer: 'Withdrawal limits depend on your account verification level. Basic accounts have a $10,000 daily limit, while verified accounts have higher limits.',
        },
        {
          question: 'What withdrawal methods are available?',
          answer: 'We support bank transfers, wire transfers, cryptocurrency, and PayPal for withdrawals.',
        },
      ],
    },
  ];

  const supportChannels = [
    {
      name: 'Live Chat',
      icon: <Chat />,
      description: 'Get instant help from our support team',
      availability: '24/7',
      responseTime: '< 2 minutes',
      color: SUPPORT_COLORS.success,
    },
    {
      name: 'Email Support',
      icon: <Email />,
      description: 'Send us a detailed message',
      availability: '24/7',
      responseTime: '< 4 hours',
      color: SUPPORT_COLORS.info,
    },
    {
      name: 'Phone Support',
      icon: <Phone />,
      description: 'Speak directly with our team',
      availability: 'Mon-Fri 9AM-6PM EST',
      responseTime: 'Immediate',
      color: SUPPORT_COLORS.warning,
    },
    {
      name: 'Community Forum',
      icon: <Forum />,
      description: 'Connect with other traders',
      availability: '24/7',
      responseTime: 'Varies',
      color: SUPPORT_COLORS.accent,
    },
  ];

  const quickActions = [
    { title: 'Report a Bug', icon: <BugReport />, color: SUPPORT_COLORS.danger },
    { title: 'Request Feature', icon: <Lightbulb />, color: SUPPORT_COLORS.warning },
    { title: 'Account Recovery', icon: <Security />, color: SUPPORT_COLORS.info },
    { title: 'Trading Help', icon: <TrendingUp />, color: SUPPORT_COLORS.success },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Report a Bug':
        setShowBugReport(true);
        break;
      case 'Request Feature':
        setShowFeatureRequest(true);
        break;
      case 'Account Recovery':
        setShowAccountRecovery(true);
        break;
      case 'Trading Help':
        setShowTradingHelp(true);
        break;
      default:
        break;
    }
  };

  const handleContactSubmit = () => {
    console.log('Contact form submitted:', contactForm);
    setShowContactDialog(false);
    setContactForm({ name: '', email: '', subject: '', message: '', priority: 'medium' });
  };

  const handleFeedbackSubmit = () => {
    console.log('Feedback submitted:', feedbackForm);
    setShowFeedbackDialog(false);
    setFeedbackForm({ rating: 5, category: 'general', message: '' });
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: SUPPORT_COLORS.backgroundGradient,
      color: SUPPORT_COLORS.textPrimary,
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
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{
            background: SUPPORT_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${SUPPORT_COLORS.shadowElevated}`,
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
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
                        background: SUPPORT_COLORS.accentGradient,
                        boxShadow: `0 8px 32px ${SUPPORT_COLORS.accentGlow}`,
                        border: `3px solid ${SUPPORT_COLORS.glassBorder}`,
                      }}
                    >
                      <Help sx={{ fontSize: 40 }} />
                    </Avatar>
                  </motion.div>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: SUPPORT_COLORS.textPrimary,
                      background: SUPPORT_COLORS.accentGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      Help & Support
                    </Typography>
                    <Typography variant="h6" sx={{ color: SUPPORT_COLORS.textSecondary, fontWeight: 400 }}>
                      Get help, find answers, and connect with our support team
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Feedback />}
                    onClick={() => setShowFeedbackDialog(true)}
                    sx={{
                      borderColor: SUPPORT_COLORS.glassBorder,
                      color: SUPPORT_COLORS.textPrimary,
                      background: SUPPORT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: SUPPORT_COLORS.accent,
                        background: SUPPORT_COLORS.surfaceHover,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Feedback
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ContactSupport />}
                    onClick={() => setShowContactDialog(true)}
                    sx={{
                      background: SUPPORT_COLORS.accentGradient,
                      color: SUPPORT_COLORS.textPrimary,
                      boxShadow: `0 8px 32px ${SUPPORT_COLORS.accentGlow}`,
                      '&:hover': {
                        background: SUPPORT_COLORS.accentHover,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 40px ${SUPPORT_COLORS.accentGlow}`,
                      },
                    }}
                  >
                    Contact Support
                  </Button>
                </Box>
              }
            />
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={action.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{
                    background: SUPPORT_COLORS.glass,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
                    borderRadius: 3,
                    boxShadow: `0 8px 32px ${SUPPORT_COLORS.shadow}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${SUPPORT_COLORS.shadowElevated}`,
                    },
                  }}
                  onClick={() => handleQuickAction(action.title)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        background: action.color,
                        width: 60,
                        height: 60,
                        mx: 'auto',
                        mb: 2,
                        boxShadow: `0 4px 16px ${action.color}40`,
                      }}>
                        {action.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: SUPPORT_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        {action.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{
            background: SUPPORT_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${SUPPORT_COLORS.shadowElevated}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}>
            <Box sx={{ borderBottom: `1px solid ${SUPPORT_COLORS.glassBorder}` }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: SUPPORT_COLORS.textSecondary,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '16px',
                    '&.Mui-selected': {
                      color: SUPPORT_COLORS.accent,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: SUPPORT_COLORS.accent,
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                  },
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuestionAnswer />
                      FAQ
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Support />
                      Support Channels
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Article />
                      Documentation
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* FAQ Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: SUPPORT_COLORS.textSecondary, mr: 1 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: SUPPORT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: SUPPORT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: SUPPORT_COLORS.textSecondary,
                    },
                  }}
                />
              </Box>
              
              {filteredFAQs.map((category, categoryIndex) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                >
                  <Accordion
                    sx={{
                      background: SUPPORT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
                      borderRadius: 2,
                      mb: 2,
                      '&:before': {
                        display: 'none',
                      },
                      '&.Mui-expanded': {
                        margin: '0 0 16px 0',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ color: SUPPORT_COLORS.textSecondary }} />}
                      sx={{
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          gap: 2,
                        },
                      }}
                    >
                      <Avatar sx={{ 
                        background: SUPPORT_COLORS.accentGradient,
                        width: 40,
                        height: 40,
                      }}>
                        {category.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: SUPPORT_COLORS.textPrimary, 
                        fontWeight: 600,
                      }}>
                        {category.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {category.questions.map((faq, faqIndex) => (
                        <Box key={faqIndex} sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ 
                            color: SUPPORT_COLORS.textPrimary, 
                            fontWeight: 600,
                            mb: 1,
                          }}>
                            {faq.question}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: SUPPORT_COLORS.textSecondary,
                            lineHeight: 1.6,
                          }}>
                            {faq.answer}
                          </Typography>
                          {faqIndex < category.questions.length - 1 && (
                            <Divider sx={{ mt: 2, borderColor: SUPPORT_COLORS.glassBorder }} />
                          )}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              ))}
            </TabPanel>

            {/* Support Channels Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                {supportChannels.map((channel, index) => (
                  <Grid item xs={12} md={6} key={channel.name}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card sx={{
                        background: SUPPORT_COLORS.glass,
                        backdropFilter: 'blur(10px)',
                        border: `2px solid ${channel.color}`,
                        borderRadius: 3,
                        boxShadow: `0 8px 32px ${SUPPORT_COLORS.shadow}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 40px ${SUPPORT_COLORS.shadowElevated}`,
                        },
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ 
                              background: channel.color,
                              width: 50,
                              height: 50,
                            }}>
                              {channel.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ 
                                color: SUPPORT_COLORS.textPrimary, 
                                fontWeight: 600,
                              }}>
                                {channel.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: SUPPORT_COLORS.textSecondary }}>
                                {channel.description}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: SUPPORT_COLORS.textSecondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                Availability
                              </Typography>
                              <Typography variant="body2" sx={{ color: SUPPORT_COLORS.textPrimary }}>
                                {channel.availability}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: SUPPORT_COLORS.textSecondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                Response Time
                              </Typography>
                              <Typography variant="body2" sx={{ color: SUPPORT_COLORS.textPrimary }}>
                                {channel.responseTime}
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              background: channel.color,
                              color: SUPPORT_COLORS.textPrimary,
                              '&:hover': {
                                background: channel.color,
                                opacity: 0.9,
                              },
                            }}
                          >
                            Contact {channel.name}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Documentation Tab */}
            <TabPanel value={tabValue} index={2}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      background: SUPPORT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${SUPPORT_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              background: SUPPORT_COLORS.infoGradient,
                              width: 40,
                              height: 40,
                            }}>
                              <Book />
                            </Avatar>
                            <Typography variant="h6" sx={{ 
                              color: SUPPORT_COLORS.textPrimary, 
                              fontWeight: 600,
                            }}>
                              User Guide
                            </Typography>
                          </Box>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          {[
                            'Getting Started Guide',
                            'Trading Basics',
                            'Account Management',
                            'Security Best Practices',
                            'API Documentation',
                          ].map((item, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <Article sx={{ color: SUPPORT_COLORS.textSecondary }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography sx={{ color: SUPPORT_COLORS.textPrimary }}>
                                    {item}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      background: SUPPORT_COLORS.glass,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${SUPPORT_COLORS.shadow}`,
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              background: SUPPORT_COLORS.warningGradient,
                              width: 40,
                              height: 40,
                            }}>
                              <VideoLibrary />
                            </Avatar>
                            <Typography variant="h6" sx={{ 
                              color: SUPPORT_COLORS.textPrimary, 
                              fontWeight: 600,
                            }}>
                              Video Tutorials
                            </Typography>
                          </Box>
                        }
                      />
                      <CardContent>
                        <List sx={{ p: 0 }}>
                          {[
                            'Platform Overview',
                            'How to Place Orders',
                            'Portfolio Management',
                            'Risk Management',
                            'Advanced Features',
                          ].map((item, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <VideoLibrary sx={{ color: SUPPORT_COLORS.textSecondary }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography sx={{ color: SUPPORT_COLORS.textPrimary }}>
                                    {item}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </motion.div>
            </TabPanel>
          </Card>
        </motion.div>

        {/* Contact Dialog */}
        <Dialog
          open={showContactDialog}
          onClose={() => setShowContactDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: SUPPORT_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${SUPPORT_COLORS.shadowElevated}`,
            },
          }}
        >
          <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary, fontWeight: 600 }}>
            Contact Support
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: SUPPORT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: SUPPORT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: SUPPORT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: SUPPORT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: SUPPORT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: SUPPORT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: SUPPORT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: SUPPORT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: SUPPORT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  multiline
                  rows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: SUPPORT_COLORS.textPrimary,
                      '& fieldset': {
                        borderColor: SUPPORT_COLORS.glassBorder,
                      },
                      '&:hover fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: SUPPORT_COLORS.accent,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: SUPPORT_COLORS.textSecondary,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowContactDialog(false)}
              sx={{ color: SUPPORT_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContactSubmit}
              disabled={!contactForm.name || !contactForm.email || !contactForm.message}
              sx={{
                background: SUPPORT_COLORS.accentGradient,
                color: SUPPORT_COLORS.textPrimary,
                '&:hover': {
                  background: SUPPORT_COLORS.accentHover,
                },
              }}
            >
              Send Message
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          open={showFeedbackDialog}
          onClose={() => setShowFeedbackDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: SUPPORT_COLORS.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${SUPPORT_COLORS.glassBorder}`,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${SUPPORT_COLORS.shadowElevated}`,
            },
          }}
        >
          <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary, fontWeight: 600 }}>
            Share Feedback
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: SUPPORT_COLORS.textSecondary, mb: 2 }}>
                How would you rate your experience?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <IconButton
                    key={rating}
                    onClick={() => setFeedbackForm(prev => ({ ...prev, rating }))}
                    sx={{
                      color: rating <= feedbackForm.rating ? SUPPORT_COLORS.warning : SUPPORT_COLORS.textSecondary,
                    }}
                  >
                    <Star />
                  </IconButton>
                ))}
              </Box>
              <TextField
                fullWidth
                label="Feedback"
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                multiline
                rows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: SUPPORT_COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: SUPPORT_COLORS.glassBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: SUPPORT_COLORS.accent,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: SUPPORT_COLORS.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: SUPPORT_COLORS.textSecondary,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowFeedbackDialog(false)}
              sx={{ color: SUPPORT_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={!feedbackForm.message}
              sx={{
                background: SUPPORT_COLORS.accentGradient,
                color: SUPPORT_COLORS.textPrimary,
                '&:hover': {
                  background: SUPPORT_COLORS.accentHover,
                },
              }}
            >
              Submit Feedback
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Bug Report Dialog */}
      <Dialog open={showBugReport} onClose={() => setShowBugReport(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary }}>
          Report a Bug
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bug Description"
            multiline
            rows={4}
            sx={{ mb: 2, mt: 1 }}
            placeholder="Please describe the bug you encountered..."
          />
          <TextField
            fullWidth
            label="Steps to Reproduce"
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="1. Go to... 2. Click on... 3. See error..."
          />
          <TextField
            fullWidth
            label="Expected Behavior"
            sx={{ mb: 2 }}
            placeholder="What should have happened?"
          />
          <TextField
            fullWidth
            label="Browser/Device Info"
            sx={{ mb: 2 }}
            placeholder="Chrome 120, macOS 14, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBugReport(false)}>Cancel</Button>
          <Button onClick={() => {
            console.log('Bug report submitted');
            setShowBugReport(false);
          }} variant="contained">Submit Bug Report</Button>
        </DialogActions>
      </Dialog>

      {/* Feature Request Dialog */}
      <Dialog open={showFeatureRequest} onClose={() => setShowFeatureRequest(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary }}>
          Request a Feature
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Feature Title"
            sx={{ mb: 2, mt: 1 }}
            placeholder="Brief title for your feature request"
          />
          <TextField
            fullWidth
            label="Feature Description"
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Describe the feature you'd like to see..."
          />
          <TextField
            fullWidth
            label="Use Case"
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="How would this feature help you?"
          />
          <TextField
            fullWidth
            label="Priority"
            select
            sx={{ mb: 2 }}
            defaultValue="medium"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeatureRequest(false)}>Cancel</Button>
          <Button onClick={() => {
            console.log('Feature request submitted');
            setShowFeatureRequest(false);
          }} variant="contained">Submit Request</Button>
        </DialogActions>
      </Dialog>

      {/* Account Recovery Dialog */}
      <Dialog open={showAccountRecovery} onClose={() => setShowAccountRecovery(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary }}>
          Account Recovery
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            If you're having trouble accessing your account, we can help you recover it.
          </Alert>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            sx={{ mb: 2, mt: 1 }}
            placeholder="Enter your registered email"
          />
          <TextField
            fullWidth
            label="Account Username"
            sx={{ mb: 2 }}
            placeholder="Enter your username (if known)"
          />
          <TextField
            fullWidth
            label="Issue Description"
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Describe the issue you're experiencing..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAccountRecovery(false)}>Cancel</Button>
          <Button onClick={() => {
            console.log('Account recovery request submitted');
            setShowAccountRecovery(false);
          }} variant="contained">Submit Recovery Request</Button>
        </DialogActions>
      </Dialog>

      {/* Trading Help Dialog */}
      <Dialog open={showTradingHelp} onClose={() => setShowTradingHelp(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ color: SUPPORT_COLORS.textPrimary }}>
          Trading Help & Support
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Getting Started</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="How to place your first trade" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Understanding market data" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Setting up alerts" />
                  </ListItem>
                </List>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Advanced Features</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="ML Trading Algorithms" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Risk Management" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Portfolio Analytics" />
                  </ListItem>
                </List>
              </Card>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Specific Question"
            multiline
            rows={3}
            sx={{ mb: 2, mt: 2 }}
            placeholder="Ask a specific trading question..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTradingHelp(false)}>Close</Button>
          <Button onClick={() => {
            console.log('Trading help request submitted');
            setShowTradingHelp(false);
          }} variant="contained">Submit Question</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HelpSupportPage;
