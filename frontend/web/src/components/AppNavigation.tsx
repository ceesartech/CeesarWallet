'use client';

import React from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Home,
  TrendingUp,
  Search,
  Notifications,
  AccountBalance,
  Person,
  Settings,
  Help,
  Menu as MenuIcon,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CeesarTraderLogo from './CeesarTraderLogo';
import oAuthService from '../services/oauthService';

interface AppNavigationProps {
  title?: string;
  showBackButton?: boolean;
  currentPage?: string;
}

const AppNavigation: React.FC<AppNavigationProps> = ({
  title = 'CeesarTrader',
  showBackButton = false,
  currentPage = 'dashboard',
}) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  const navigationItems = [
    { name: 'Dashboard', icon: <Home />, path: '/dashboard' },
    { name: 'Market Scanner', icon: <Search />, path: '/scanner' },
    { name: 'Trading History', icon: <TrendingUp />, path: '/history' },
    { name: 'Analytics', icon: <TrendingUp />, path: '/analytics' },
    { name: 'Alerts', icon: <Notifications />, path: '/alerts' },
    { name: 'Funding', icon: <AccountBalance />, path: '/funding' },
    { name: 'Account', icon: <Person />, path: '/account' },
    { name: 'Settings', icon: <Settings />, path: '/settings' },
    { name: 'Help & Support', icon: <Help />, path: '/help' },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'rgba(13, 17, 23, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(48, 54, 61, 0.5)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 1200, // Ensure it's above other content
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {showBackButton && (
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: '#f0f6fc',
                '&:hover': {
                  backgroundColor: 'rgba(240, 246, 252, 0.1)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <CeesarTraderLogo 
              size="small" 
              variant="text" 
              animated={false}
            />
          </motion.div>

          <Chip
            label={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            size="small"
            sx={{
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navigationItems.slice(0, 4).map((item) => (
              <Button
                key={item.name}
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: currentPage === item.path.split('/')[1] ? '#8b5cf6' : '#8b949e',
                  textTransform: 'none',
                  fontWeight: currentPage === item.path.split('/')[1] ? 600 : 400,
                  '&:hover': {
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Notifications */}
          <IconButton
            sx={{
              color: '#8b949e',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
              },
            }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: '#8b949e',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                fontSize: '0.875rem',
              }}
            >
              U
            </Avatar>
          </IconButton>

          {/* Mobile Menu */}
          <IconButton
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: '#8b949e',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
              },
            }}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Navigation Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(22, 27, 34, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(48, 54, 61, 0.5)',
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        {navigationItems.map((item, index) => (
          <MenuItem
            key={item.name}
            onClick={() => handleNavigation(item.path)}
            sx={{
              color: currentPage === item.path.split('/')[1] ? '#8b5cf6' : '#f0f6fc',
              fontWeight: currentPage === item.path.split('/')[1] ? 600 : 400,
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.icon}
              {item.name}
            </Box>
          </MenuItem>
        ))}
        
        <Divider sx={{ borderColor: 'rgba(48, 54, 61, 0.5)', my: 1 }} />
        
        <MenuItem
          onClick={() => {
            oAuthService.logout();
            router.push('/signin');
            handleMenuClose();
          }}
          sx={{
            color: '#da3633',
            '&:hover': {
              backgroundColor: 'rgba(218, 54, 51, 0.1)',
            },
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default AppNavigation;
