import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const [portfolioValue, setPortfolioValue] = useState(125000);
  const [dailyChange, setDailyChange] = useState(2500);
  const [dailyChangePercent, setDailyChangePercent] = useState(2.04);

  const mockPositions = [
    { symbol: 'AAPL', quantity: 100, price: 150.25, change: 2.5, changePercent: 1.69 },
    { symbol: 'GOOGL', quantity: 50, price: 2800.00, change: -15.50, changePercent: -0.55 },
    { symbol: 'MSFT', quantity: 75, price: 320.15, change: 5.25, changePercent: 1.67 },
    { symbol: 'TSLA', quantity: 25, price: 250.80, change: -8.20, changePercent: -3.16 },
  ];

  const mockAlerts = [
    { id: 1, message: 'AAPL reached target price of $150', time: '2 min ago', type: 'success' },
    { id: 2, message: 'Portfolio risk level increased', time: '15 min ago', type: 'warning' },
    { id: 3, message: 'New trading signal generated', time: '1 hour ago', type: 'info' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good morning, Trader</Text>
          <Text style={styles.portfolioValue}>${portfolioValue.toLocaleString()}</Text>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={dailyChange >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={dailyChange >= 0 ? '#00d4aa' : '#ff6b6b'} 
            />
            <Text style={[
              styles.dailyChange,
              { color: dailyChange >= 0 ? '#00d4aa' : '#ff6b6b' }
            ]}>
              {dailyChange >= 0 ? '+' : ''}${dailyChange.toLocaleString()} ({dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent}%)
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#00d4aa', '#00b894']}
            style={styles.actionGradient}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.actionText}>Buy</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#ff6b6b', '#e74c3c']}
            style={styles.actionGradient}
          >
            <Ionicons name="remove" size={24} color="#ffffff" />
            <Text style={styles.actionText}>Sell</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#74b9ff', '#0984e3']}
            style={styles.actionGradient}
          >
            <Ionicons name="analytics" size={24} color="#ffffff" />
            <Text style={styles.actionText}>Analyze</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Positions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Open Positions</Title>
          {mockPositions.map((position, index) => (
            <View key={index} style={styles.positionItem}>
              <View style={styles.positionLeft}>
                <Text style={styles.symbol}>{position.symbol}</Text>
                <Text style={styles.quantity}>{position.quantity} shares</Text>
              </View>
              <View style={styles.positionRight}>
                <Text style={styles.price}>${position.price.toFixed(2)}</Text>
                <Text style={[
                  styles.change,
                  { color: position.change >= 0 ? '#00d4aa' : '#ff6b6b' }
                ]}>
                  {position.change >= 0 ? '+' : ''}${position.change.toFixed(2)} ({position.changePercent >= 0 ? '+' : ''}{position.changePercent}%)
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Alerts */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Recent Alerts</Title>
          {mockAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={[
                styles.alertIcon,
                { backgroundColor: alert.type === 'success' ? '#00d4aa' : alert.type === 'warning' ? '#f39c12' : '#74b9ff' }
              ]}>
                <Ionicons 
                  name={alert.type === 'success' ? 'checkmark' : alert.type === 'warning' ? 'warning' : 'information'} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* ML Trading Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>ML Trading Status</Title>
          <View style={styles.mlStatus}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Active Models</Text>
              <Text style={styles.statusValue}>3</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Signals Today</Text>
              <Text style={styles.statusValue}>12</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Accuracy</Text>
              <Text style={styles.statusValue}>87%</Text>
            </View>
          </View>
          <Button 
            mode="contained" 
            style={styles.mlButton}
            onPress={() => Alert.alert('ML Trading', 'ML trading controls would open here')}
          >
            Manage ML Trading
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyChange: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  actionGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  positionLeft: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  quantity: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 2,
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  change: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.6,
  },
  mlStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d4aa',
  },
  mlButton: {
    backgroundColor: '#00d4aa',
  },
});

export default DashboardScreen;
