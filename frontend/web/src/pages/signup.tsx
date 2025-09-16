'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Link,
  Container,
  Avatar,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Apple,
  Facebook,
  ShoppingCart,
  TrendingUp,
  Email,
  Lock,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import oAuthService, { OAuthResponse } from '../services/oauthService';

const AUTH_COLORS = {
  background: '#0d1117',
  backgroundGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
  surface: '#161b22',
  surfaceElevated: '#21262d',
  border: '#30363d',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  accent: '#8b5cf6',
  accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  accentHover: '#7c3aed',
  accentGlow: 'rgba(139, 92, 246, 0.3)',
  error: '#da3633',
  success: '#2ea043',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowElevated: 'rgba(0, 0, 0, 0.6)',
};

const SignUpPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation
      if (!agreeToTerms) {
        setError('Please agree to the Terms of Service and Privacy Policy');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any valid form
      if (formData.firstName && formData.lastName && formData.email && formData.password) {
        router.push('/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: string) => {
    try {
      setIsLoading(true);
      
      // For demo purposes, simulate OAuth flow
      // In production, this would redirect to OAuth provider
      const mockResponse = await new Promise<OAuthResponse>(resolve => 
        setTimeout(() => resolve({
          success: true,
          token: `mock-jwt-token-${provider}`,
          user: {
            id: `${provider}-user-123`,
            email: `user@${provider}.com`,
            name: `${provider} User`,
            provider: provider
          }
        }), 1000)
      );
      
      if (mockResponse.success && mockResponse.token && mockResponse.user) {
        oAuthService.setAuthData(mockResponse.token, mockResponse.user);
        router.push('/dashboard');
      }
    } catch (error) {
      setError(`${provider} authentication failed`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: AUTH_COLORS.backgroundGradient,
      color: AUTH_COLORS.textPrimary,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{
            background: AUTH_COLORS.glass,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${AUTH_COLORS.glassBorder}`,
            borderRadius: 4,
            boxShadow: `0 20px 40px ${AUTH_COLORS.shadowElevated}`,
            overflow: 'hidden',
          }}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar sx={{
                    width: 80,
                    height: 80,
                    background: AUTH_COLORS.accentGradient,
                    margin: '0 auto 16px',
                    boxShadow: `0 8px 32px ${AUTH_COLORS.accentGlow}`,
                  }}>
                    <TrendingUp sx={{ fontSize: 40 }} />
                  </Avatar>
                </motion.div>
                
                <Typography variant="h4" sx={{
                  fontWeight: 700,
                  background: AUTH_COLORS.accentGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}>
                  CeesarTrader
                </Typography>
                
                <Typography variant="h6" sx={{
                  color: AUTH_COLORS.textSecondary,
                  fontWeight: 400,
                }}>
                  Create your trading account
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Sign Up Form */}
              <Box component="form" onSubmit={handleSignUp} sx={{ mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: AUTH_COLORS.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: AUTH_COLORS.textPrimary,
                        '& fieldset': { borderColor: AUTH_COLORS.border },
                        '&:hover fieldset': { borderColor: AUTH_COLORS.accent },
                        '&.Mui-focused fieldset': { borderColor: AUTH_COLORS.accent },
                      },
                      '& .MuiInputLabel-root': { color: AUTH_COLORS.textSecondary },
                    }}
                  />

                  <TextField
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: AUTH_COLORS.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: AUTH_COLORS.textPrimary,
                        '& fieldset': { borderColor: AUTH_COLORS.border },
                        '&:hover fieldset': { borderColor: AUTH_COLORS.accent },
                        '&.Mui-focused fieldset': { borderColor: AUTH_COLORS.accent },
                      },
                      '& .MuiInputLabel-root': { color: AUTH_COLORS.textSecondary },
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: AUTH_COLORS.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: AUTH_COLORS.textPrimary,
                      '& fieldset': { borderColor: AUTH_COLORS.border },
                      '&:hover fieldset': { borderColor: AUTH_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: AUTH_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: AUTH_COLORS.textSecondary },
                  }}
                />

                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: AUTH_COLORS.textSecondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: AUTH_COLORS.textSecondary }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: AUTH_COLORS.textPrimary,
                      '& fieldset': { borderColor: AUTH_COLORS.border },
                      '&:hover fieldset': { borderColor: AUTH_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: AUTH_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: AUTH_COLORS.textSecondary },
                  }}
                />

                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: AUTH_COLORS.textSecondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: AUTH_COLORS.textSecondary }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: AUTH_COLORS.textPrimary,
                      '& fieldset': { borderColor: AUTH_COLORS.border },
                      '&:hover fieldset': { borderColor: AUTH_COLORS.accent },
                      '&.Mui-focused fieldset': { borderColor: AUTH_COLORS.accent },
                    },
                    '& .MuiInputLabel-root': { color: AUTH_COLORS.textSecondary },
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      sx={{
                        color: AUTH_COLORS.accent,
                        '&.Mui-checked': {
                          color: AUTH_COLORS.accent,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: AUTH_COLORS.textSecondary }}>
                      I agree to the{' '}
                      <Link href="/terms" sx={{ color: AUTH_COLORS.accent }}>
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" sx={{ color: AUTH_COLORS.accent }}>
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    background: AUTH_COLORS.accentGradient,
                    color: AUTH_COLORS.textPrimary,
                    borderRadius: 2,
                    py: 1.5,
                    boxShadow: `0 8px 32px ${AUTH_COLORS.accentGlow}`,
                    '&:hover': {
                      background: AUTH_COLORS.accentHover,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 40px ${AUTH_COLORS.accentGlow}`,
                    },
                    '&:disabled': {
                      background: '#2a2a2a',
                      color: '#a0a0a0',
                    },
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
                <Divider sx={{ flex: 1, borderColor: AUTH_COLORS.border }} />
                <Typography variant="body2" sx={{
                  color: AUTH_COLORS.textSecondary,
                  px: 2,
                }}>
                  OR
                </Typography>
                <Divider sx={{ flex: 1, borderColor: AUTH_COLORS.border }} />
              </Box>

              {/* OAuth Buttons */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={() => handleOAuthSignUp('Google')}
                  sx={{
                    borderColor: AUTH_COLORS.border,
                    color: AUTH_COLORS.textPrimary,
                    '&:hover': {
                      borderColor: '#db4437',
                      backgroundColor: 'rgba(219, 68, 55, 0.1)',
                    },
                  }}
                >
                  Google
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Apple />}
                  onClick={() => handleOAuthSignUp('Apple')}
                  sx={{
                    borderColor: AUTH_COLORS.border,
                    color: AUTH_COLORS.textPrimary,
                    '&:hover': {
                      borderColor: '#000000',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Apple
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Facebook />}
                  onClick={() => handleOAuthSignUp('Facebook')}
                  sx={{
                    borderColor: AUTH_COLORS.border,
                    color: AUTH_COLORS.textPrimary,
                    '&:hover': {
                      borderColor: '#1877f2',
                      backgroundColor: 'rgba(24, 119, 242, 0.1)',
                    },
                  }}
                >
                  Facebook
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                  onClick={() => handleOAuthSignUp('Amazon')}
                  sx={{
                    borderColor: AUTH_COLORS.border,
                    color: AUTH_COLORS.textPrimary,
                    '&:hover': {
                      borderColor: '#ff9900',
                      backgroundColor: 'rgba(255, 153, 0, 0.1)',
                    },
                  }}
                >
                  Amazon
                </Button>
              </Box>

              {/* Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: AUTH_COLORS.textSecondary }}>
                  Already have an account?{' '}
                  <Link
                    href="/signin"
                    sx={{
                      color: AUTH_COLORS.accent,
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SignUpPage;
