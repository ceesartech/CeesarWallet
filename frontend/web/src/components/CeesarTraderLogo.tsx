'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, ShowChart, Timeline } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface CeesarTraderLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'text';
  color?: 'primary' | 'secondary' | 'accent';
  animated?: boolean;
}

const CeesarTraderLogo: React.FC<CeesarTraderLogoProps> = ({
  size = 'medium',
  variant = 'full',
  color = 'primary',
  animated = true,
}) => {
  const sizeMap = {
    small: { icon: 24, text: 'h6', spacing: 1 },
    medium: { icon: 32, text: 'h5', spacing: 1.5 },
    large: { icon: 48, text: 'h4', spacing: 2 },
  };

  const colorMap = {
    primary: {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      glow: 'rgba(139, 92, 246, 0.4)',
      text: '#8b5cf6',
    },
    secondary: {
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: '#10b981',
    },
    accent: {
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      glow: 'rgba(245, 158, 11, 0.4)',
      text: '#f59e0b',
    },
  };

  const currentSize = sizeMap[size];
  const currentColor = colorMap[color];

  const LogoIcon = () => (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: currentSize.icon * 1.5,
        height: currentSize.icon * 1.5,
        borderRadius: '50%',
        background: currentColor.gradient,
        boxShadow: `0 8px 32px ${currentColor.glow}`,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <TrendingUp sx={{ 
          fontSize: currentSize.icon,
          color: '#ffffff',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
        }} />
      </Box>
      
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          width: currentSize.icon * 0.3,
          height: currentSize.icon * 0.3,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.3)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: currentSize.icon * 0.2,
          height: currentSize.icon * 0.2,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          zIndex: 0,
        }}
      />
    </Box>
  );

  const LogoText = () => (
    <Typography
      variant={currentSize.text as any}
      sx={{
        fontWeight: 700,
        background: currentColor.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      CeesarTrader
    </Typography>
  );

  const AnimatedWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!animated) return <>{children}</>;
    
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  };

  if (variant === 'icon') {
    return (
      <AnimatedWrapper>
        <LogoIcon />
      </AnimatedWrapper>
    );
  }

  if (variant === 'text') {
    return (
      <AnimatedWrapper>
        <LogoText />
      </AnimatedWrapper>
    );
  }

  return (
    <AnimatedWrapper>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: currentSize.spacing,
        cursor: 'pointer',
        userSelect: 'none',
      }}>
        <LogoIcon />
        <LogoText />
      </Box>
    </AnimatedWrapper>
  );
};

export default CeesarTraderLogo;
