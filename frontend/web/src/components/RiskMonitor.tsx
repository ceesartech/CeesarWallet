import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert, Chip } from '@mui/material';
import { Warning, Security, TrendingDown, Assessment } from '@mui/icons-material';
import { Portfolio, Position } from '../types/trading';

interface RiskMonitorProps {
  portfolio?: Portfolio;
  positions?: Position[];
  theme?: 'light' | 'dark';
}

export const RiskMonitor: React.FC<RiskMonitorProps> = ({ portfolio, positions = [], theme = 'dark' }) => {
  // Calculate risk metrics
  const totalValue = portfolio?.totalValue || 100000;
  const totalPnL = portfolio?.totalPnL || 0;
  const dailyPnL = totalPnL * 0.1; // Mock daily PnL calculation
  
  const riskMetrics = [
    {
      title: 'Portfolio Risk',
      value: 'Low',
      color: '#4caf50',
      icon: <Security />,
      description: 'Risk level is within acceptable limits',
    },
    {
      title: 'Daily P&L',
      value: `$${dailyPnL.toFixed(2)}`,
      color: dailyPnL >= 0 ? '#4caf50' : '#f44336',
      icon: <TrendingDown />,
      description: `Daily profit/loss: ${dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}`,
    },
    {
      title: 'Max Drawdown',
      value: '-2.5%',
      color: '#ff9800',
      icon: <Warning />,
      description: 'Current drawdown from peak',
    },
    {
      title: 'VaR (95%)',
      value: '$1,250',
      color: '#ff9800',
      icon: <Assessment />,
      description: 'Value at Risk (95% confidence)',
    },
  ];

  const alerts = [
    {
      severity: 'warning' as const,
      message: 'Position size for TSLA exceeds 5% of portfolio',
      action: 'Consider reducing position size',
    },
    {
      severity: 'info' as const,
      message: 'Stop loss triggered for AAPL position',
      action: 'Position closed at $148.50',
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Risk Monitor
      </Typography>
      
      {/* Risk Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {riskMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
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
                <Typography variant="caption" color="textSecondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Risk Alerts */}
      <Typography variant="h6" gutterBottom>
        Risk Alerts
      </Typography>
      {alerts.map((alert, index) => (
        <Alert 
          key={index}
          severity={alert.severity} 
          sx={{ mb: 2 }}
          action={
            <Chip 
              label="View Details" 
              size="small" 
              color="primary" 
              variant="outlined"
              onClick={() => {
                // Navigate to alerts page or show detailed view
                window.location.href = '/alerts';
              }}
              sx={{ cursor: 'pointer' }}
            />
          }
        >
          <Typography variant="body2">
            {alert.message}
          </Typography>
          <Typography variant="caption" display="block">
            {alert.action}
          </Typography>
        </Alert>
      ))}

      {/* Risk Summary */}
      <Card sx={{ 
        backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#30363d' : '#e1e4e8'}`,
        mt: 2,
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Total Positions
              </Typography>
              <Typography variant="h6">
                {positions.length}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Portfolio Value
              </Typography>
              <Typography variant="h6">
                ${totalValue.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Unrealized P&L
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ color: totalPnL >= 0 ? '#4caf50' : '#f44336' }}
              >
                ${totalPnL.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Risk Score
              </Typography>
              <Typography variant="h6" sx={{ color: '#4caf50' }}>
                7.2/10
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
