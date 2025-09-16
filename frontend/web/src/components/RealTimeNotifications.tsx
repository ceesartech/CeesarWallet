import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Chip, IconButton } from '@mui/material';
import { CheckCircle, Error, Warning, Info, Close } from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  read: boolean;
}

interface RealTimeNotificationsProps {
  notifications?: Notification[];
  onClose?: () => void;
  theme?: 'light' | 'dark';
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ 
  notifications = [], 
  onClose,
  theme = 'dark' 
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'error':
        return <Error sx={{ color: '#f44336' }} />;
      case 'warning':
        return <Warning sx={{ color: '#ff9800' }} />;
      case 'info':
        return <Info sx={{ color: '#2196f3' }} />;
      default:
        return <Info sx={{ color: '#2196f3' }} />;
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Box sx={{ 
      backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? '#30363d' : '#e1e4e8'}`,
      borderRadius: 2,
      p: 2,
      maxHeight: 400,
      overflow: 'auto',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Real-time Notifications
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </Box>
      
      {notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            No notifications
          </Typography>
        </Box>
      ) : (
        <List>
          {notifications.map((notification) => (
            <ListItem 
              key={notification.id}
              sx={{ 
                backgroundColor: notification.read ? 'transparent' : 
                  (theme === 'dark' ? '#1b2d1b' : '#e8f5e8'),
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemIcon>
                {getIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {notification.message}
                    </Typography>
                    <Chip
                      label={notification.type.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getColor(notification.type),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary">
                    {formatTimestamp(notification.timestamp)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
