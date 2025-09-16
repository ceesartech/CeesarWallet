import React from 'react';
import { Box, Typography, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Assessment, Security } from '@mui/icons-material';
import { Portfolio, PerformanceMetrics as PerformanceMetricsType } from '../types/trading';

interface PerformanceMetricsProps {
  portfolio?: Portfolio;
  theme?: 'light' | 'dark';
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ portfolio, theme = 'dark' }) => {
  // Mock performance data
  const metrics: PerformanceMetricsType = {
    totalReturn: 12.5,
    dailyReturn: 0.8,
    sharpeRatio: 1.85,
    maxDrawdown: -5.2,
    winRate: 68.5,
    profitFactor: 2.1,
  };

  const metricsData = [
    {
      title: 'Total Return',
      value: `${metrics.totalReturn}%`,
      icon: <TrendingUp />,
      color: metrics.totalReturn >= 0 ? '#4caf50' : '#f44336',
      progress: Math.min(Math.abs(metrics.totalReturn), 100),
    },
    {
      title: 'Daily Return',
      value: `${metrics.dailyReturn}%`,
      icon: <TrendingUp />,
      color: metrics.dailyReturn >= 0 ? '#4caf50' : '#f44336',
      progress: Math.min(Math.abs(metrics.dailyReturn) * 10, 100),
    },
    {
      title: 'Sharpe Ratio',
      value: metrics.sharpeRatio.toFixed(2),
      icon: <Assessment />,
      color: metrics.sharpeRatio >= 1 ? '#4caf50' : '#f44336',
      progress: Math.min(metrics.sharpeRatio * 20, 100),
    },
    {
      title: 'Max Drawdown',
      value: `${metrics.maxDrawdown}%`,
      icon: <TrendingDown />,
      color: '#f44336',
      progress: Math.min(Math.abs(metrics.maxDrawdown) * 10, 100),
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate}%`,
      icon: <Security />,
      color: metrics.winRate >= 60 ? '#4caf50' : '#f44336',
      progress: metrics.winRate,
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      icon: <Assessment />,
      color: metrics.profitFactor >= 1.5 ? '#4caf50' : '#f44336',
      progress: Math.min(metrics.profitFactor * 30, 100),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Metrics
      </Typography>
      <Grid container spacing={2}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#30363d' : '#e1e4e8'}`,
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: metric.color, mr: 1 }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {metric.title}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: metric.color, mb: 1 }}>
                  {metric.value}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.progress}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme === 'dark' ? '#30363d' : '#e1e4e8',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: metric.color,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
