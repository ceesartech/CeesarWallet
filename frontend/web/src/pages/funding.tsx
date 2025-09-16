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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Security,
  CheckCircle,
  Warning,
  Error,
  Info,
  Add,
  Remove,
  History,
  Receipt,
  QrCode,
  Lock,
  VerifiedUser,
  Speed,
  LocalAtm,
  Payment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

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

interface FundingWithdrawalsProps {
  onBack?: () => void;
}

const FundingWithdrawals: React.FC<FundingWithdrawalsProps> = ({ onBack }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([
    {
      id: 'tx_001',
      type: 'deposit',
      amount: 5000,
      currency: 'USD',
      method: 'Bank Transfer',
      status: 'completed',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      fee: 0,
    },
    {
      id: 'tx_002',
      type: 'withdraw',
      amount: 1000,
      currency: 'USD',
      method: 'Wire Transfer',
      status: 'pending',
      timestamp: new Date('2024-01-14T14:20:00Z'),
      fee: 25,
    },
    {
      id: 'tx_003',
      type: 'deposit',
      amount: 2500,
      currency: 'USD',
      method: 'Credit Card',
      status: 'completed',
      timestamp: new Date('2024-01-13T09:15:00Z'),
      fee: 12.50,
    },
  ]);

  const paymentMethods = [
    { id: 'bank_transfer', name: 'Bank Transfer', icon: <AccountBalance />, fee: 0, processingTime: '1-3 business days' },
    { id: 'wire_transfer', name: 'Wire Transfer', icon: <LocalAtm />, fee: 25, processingTime: 'Same day' },
    { id: 'credit_card', name: 'Credit Card', icon: <CreditCard />, fee: '2.5%', processingTime: 'Instant' },
    { id: 'crypto', name: 'Cryptocurrency', icon: <AccountBalanceWallet />, fee: '0.1%', processingTime: '10-30 minutes' },
    { id: 'paypal', name: 'PayPal', icon: <Payment />, fee: '2.9%', processingTime: 'Instant' },
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'BTC', 'ETH'];

  const steps = [
    'Select Transaction Type',
    'Choose Payment Method',
    'Enter Amount',
    'Review & Confirm',
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTransactionTypeChange = (type: 'deposit' | 'withdraw') => {
    setTransactionType(type);
    handleNext();
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    handleNext();
  };

  const handleAmountSubmit = () => {
    if (amount && parseFloat(amount) > 0) {
      handleNext();
    }
  };

  const handleConfirmTransaction = async () => {
    setIsProcessing(true);
    setShowConfirmDialog(false);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add to transaction history
    const newTransaction = {
      id: `tx_${Date.now()}`,
      type: transactionType,
      amount: parseFloat(amount),
      currency,
      method: paymentMethods.find(m => m.id === paymentMethod)?.name || '',
      status: 'pending',
      timestamp: new Date(),
      fee: transactionType === 'deposit' ? 0 : 25,
    };
    
    setTransactionHistory(prev => [newTransaction, ...prev]);
    setIsProcessing(false);
    
    // Reset form
    setActiveStep(0);
    setAmount('');
    setPaymentMethod('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return LINEAR_COLORS.success;
      case 'pending': return LINEAR_COLORS.warning;
      case 'failed': return LINEAR_COLORS.danger;
      default: return LINEAR_COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Warning />;
      case 'failed': return <Error />;
      default: return <Info />;
    }
  };

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
                    <AccountBalanceWallet />
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
                      Funding & Withdrawals
                    </Typography>
                    <Typography variant="body1" sx={{ color: LINEAR_COLORS.textSecondary }}>
                      Manage your account balance and transactions
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </Card>
        </motion.div>

        <Grid container spacing={3}>
          {/* Transaction Form */}
          <Grid item xs={12} lg={8}>
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
                      New Transaction
                    </Typography>
                  }
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {/* Step 1: Transaction Type */}
                    <Step>
                      <StepLabel sx={{ color: LINEAR_COLORS.textPrimary }}>
                        Select Transaction Type
                      </StepLabel>
                      <StepContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Button
                            variant={transactionType === 'deposit' ? 'contained' : 'outlined'}
                            startIcon={<Add />}
                            onClick={() => handleTransactionTypeChange('deposit')}
                            sx={{
                              background: transactionType === 'deposit' ? LINEAR_COLORS.successGradient : 'transparent',
                              border: `2px solid ${LINEAR_COLORS.success}`,
                              color: transactionType === 'deposit' ? LINEAR_COLORS.textPrimary : LINEAR_COLORS.success,
                              '&:hover': {
                                background: LINEAR_COLORS.accentHover,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 24px ${LINEAR_COLORS.accentGlow}`,
                              },
                            }}
                          >
                            Deposit Funds
                          </Button>
                          <Button
                            variant={transactionType === 'withdraw' ? 'contained' : 'outlined'}
                            startIcon={<Remove />}
                            onClick={() => handleTransactionTypeChange('withdraw')}
                            sx={{
                              background: transactionType === 'withdraw' ? LINEAR_COLORS.dangerGradient : 'transparent',
                              border: `2px solid ${LINEAR_COLORS.danger}`,
                              color: transactionType === 'withdraw' ? LINEAR_COLORS.textPrimary : LINEAR_COLORS.danger,
                              '&:hover': {
                                background: LINEAR_COLORS.danger,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 24px rgba(218, 54, 51, 0.4)`,
                              },
                            }}
                          >
                            Withdraw Funds
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>

                    {/* Step 2: Payment Method */}
                    <Step>
                      <StepLabel sx={{ color: LINEAR_COLORS.textPrimary }}>
                        Choose Payment Method
                      </StepLabel>
                      <StepContent>
                        <Grid container spacing={2}>
                          {paymentMethods.map((method) => (
                            <Grid item xs={12} sm={6} key={method.id}>
                              <Card
                                sx={{
                                  background: paymentMethod === method.id ? LINEAR_COLORS.surfaceHover : LINEAR_COLORS.surfaceGradient,
                                  border: `2px solid ${paymentMethod === method.id ? LINEAR_COLORS.accent : LINEAR_COLORS.border}`,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${LINEAR_COLORS.shadowElevated}`,
                                  },
                                }}
                                onClick={() => handlePaymentMethodChange(method.id)}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Avatar sx={{ 
                                      background: LINEAR_COLORS.accentGradient,
                                      width: 40,
                                      height: 40,
                                    }}>
                                      {method.icon}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                                      {method.name}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                                    Fee: {method.fee}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                                    Processing: {method.processingTime}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button onClick={handleBack} sx={{ color: LINEAR_COLORS.textSecondary }}>
                                Back
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>

                    {/* Step 3: Amount */}
                    <Step>
                      <StepLabel sx={{ color: LINEAR_COLORS.textPrimary }}>
                        Enter Amount
                      </StepLabel>
                      <StepContent>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                          <TextField
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            sx={{
                              flex: 1,
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
                          <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel sx={{ color: LINEAR_COLORS.textSecondary }}>Currency</InputLabel>
                            <Select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              sx={{ color: LINEAR_COLORS.textPrimary }}
                            >
                              {currencies.map((curr) => (
                                <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button onClick={handleBack} sx={{ color: LINEAR_COLORS.textSecondary }}>
                            Back
                          </Button>
                          <Button 
                            onClick={handleAmountSubmit}
                            disabled={!amount || parseFloat(amount) <= 0}
                            sx={{
                              background: LINEAR_COLORS.accentGradient,
                              color: LINEAR_COLORS.textPrimary,
                              '&:hover': {
                                background: LINEAR_COLORS.accentHover,
                              },
                            }}
                          >
                            Continue
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>

                    {/* Step 4: Review & Confirm */}
                    <Step>
                      <StepLabel sx={{ color: LINEAR_COLORS.textPrimary }}>
                        Review & Confirm
                      </StepLabel>
                      <StepContent>
                        <Paper sx={{
                          background: LINEAR_COLORS.surfaceGradient,
                          border: `1px solid ${LINEAR_COLORS.border}`,
                          borderRadius: 2,
                          p: 3,
                          mb: 2,
                        }}>
                          <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary, mb: 2 }}>
                            Transaction Summary
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Type:</Typography>
                            <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>
                              {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Method:</Typography>
                            <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>
                              {paymentMethods.find(m => m.id === paymentMethod)?.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Amount:</Typography>
                            <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>
                              {amount} {currency}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>Fee:</Typography>
                            <Typography sx={{ color: LINEAR_COLORS.textPrimary }}>
                              {transactionType === 'deposit' ? 'Free' : '$25'}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 2, borderColor: LINEAR_COLORS.border }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ color: LINEAR_COLORS.textPrimary }}>
                              Total:
                            </Typography>
                            <Typography variant="h6" sx={{ color: LINEAR_COLORS.accent }}>
                              {transactionType === 'deposit' ? amount : (parseFloat(amount) + 25).toFixed(2)} {currency}
                            </Typography>
                          </Box>
                        </Paper>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button onClick={handleBack} sx={{ color: LINEAR_COLORS.textSecondary }}>
                            Back
                          </Button>
                          <Button 
                            onClick={() => setShowConfirmDialog(true)}
                            sx={{
                              background: LINEAR_COLORS.accentGradient,
                              color: LINEAR_COLORS.textPrimary,
                              '&:hover': {
                                background: LINEAR_COLORS.accentHover,
                              },
                            }}
                          >
                            Confirm Transaction
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  </Stepper>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
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
                        <History />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: LINEAR_COLORS.textPrimary, 
                        fontWeight: 600,
                        background: LINEAR_COLORS.infoGradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        Transaction History
                      </Typography>
                    </Box>
                  }
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <List sx={{ p: 0 }}>
                    <AnimatePresence>
                      {transactionHistory.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
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
                                background: transaction.type === 'deposit' ? LINEAR_COLORS.successGradient : LINEAR_COLORS.dangerGradient,
                                width: 32,
                                height: 32,
                              }}>
                                {transaction.type === 'deposit' ? <Add /> : <Remove />}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                                    {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                  </Typography>
                                  <Chip
                                    icon={getStatusIcon(transaction.status)}
                                    label={transaction.status}
                                    size="small"
                                    sx={{
                                      background: getStatusColor(transaction.status),
                                      color: LINEAR_COLORS.textPrimary,
                                      fontWeight: 600,
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textSecondary }}>
                                    {transaction.method} • {transaction.timestamp.toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: LINEAR_COLORS.textPrimary, fontWeight: 600 }}>
                                    {transaction.amount.toLocaleString()} {transaction.currency}
                                    {transaction.fee > 0 && ` (Fee: ${transaction.fee})`}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
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
            Confirm Transaction
          </DialogTitle>
          <DialogContent>
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                backgroundColor: LINEAR_COLORS.surface,
                border: `1px solid ${LINEAR_COLORS.warning}`,
                '& .MuiAlert-icon': {
                  color: LINEAR_COLORS.warning,
                },
              }}
            >
              Please review all details carefully before confirming. This action cannot be undone.
            </Alert>
            <Typography sx={{ color: LINEAR_COLORS.textSecondary }}>
              Are you sure you want to proceed with this {transactionType} of {amount} {currency}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              sx={{ color: LINEAR_COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransaction}
              disabled={isProcessing}
              sx={{
                background: LINEAR_COLORS.accentGradient,
                color: LINEAR_COLORS.textPrimary,
                '&:hover': {
                  background: LINEAR_COLORS.accentHover,
                },
              }}
            >
              {isProcessing ? <CircularProgress size={20} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default FundingWithdrawals;
