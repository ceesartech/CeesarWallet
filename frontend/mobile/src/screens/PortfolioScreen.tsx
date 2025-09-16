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
import { Card, Title, Paragraph, Button, ProgressBar } from 'react-native-paper';

const { width } = Dimensions.get('window');

const PortfolioScreen = () => {
  const [portfolioValue, setPortfolioValue] = useState(125000);
  const [totalReturn, setTotalReturn] = useState(15000);
  const [totalReturnPercent, setTotalReturnPercent] = useState(13.6);
  const [dayReturn, setDayReturn] = useState(2500);
  const [dayReturnPercent, setDayReturnPercent] = useState(2.04);

  const mockPositions = [
    { 
      symbol: 'AAPL', 
      quantity: 100, 
      avgPrice: 145.50, 
      currentPrice: 150.25, 
      marketValue: 15025, 
      unrealizedPL: 475, 
      unrealizedPLPercent: 3.26,
      allocation: 12.0
    },
    { 
      symbol: 'GOOGL', 
      quantity: 50, 
      avgPrice: 2850.00, 
      currentPrice: 2800.00, 
      marketValue: 140000, 
      unrealizedPL: -2500, 
      unrealizedPLPercent: -1.75,
      allocation: 11.2
    },
    { 
      symbol: 'MSFT', 
      quantity: 75, 
      avgPrice: 315.00, 
      currentPrice: 320.15, 
      marketValue: 24011.25, 
      unrealizedPL: 386.25, 
      unrealizedPLPercent: 1.63,
      allocation: 19.2
    },
    { 
      symbol: 'TSLA', 
      quantity: 25, 
      avgPrice: 260.00, 
      currentPrice: 250.80, 
      marketValue: 6270, 
      unrealizedPL: -230, 
      unrealizedPLPercent: -3.54,
      allocation: 5.0
    },
    { 
      symbol: 'AMZN', 
      quantity: 20, 
      avgPrice: 3200.00, 
      currentPrice: 3200.50, 
      marketValue: 64010, 
      unrealizedPL: 10, 
      unrealizedPLPercent: 0.02,
      allocation: 51.2
    },
  ];

  const mockPerformance = [
    { period: '1D', return: 2.04, color: '#00d4aa' },
    { period: '1W', return: 5.2, color: '#00d4aa' },
    { period: '1M', return: 8.7, color: '#00d4aa' },
    { period: '3M', return: 12.3, color: '#00d4aa' },
    { period: '1Y', return: 13.6, color: '#00d4aa' },
    { period: 'ALL', return: 15.8, color: '#00d4aa' },
  ];

  const totalMarketValue = mockPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPL = mockPositions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Portfolio Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.portfolioTitle}>Portfolio</Text>
          <Text style={styles.portfolioValue}>${portfolioValue.toLocaleString()}</Text>
          <View style={styles.returnContainer}>
            <Ionicons 
              name={totalReturn >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={totalReturn >= 0 ? '#00d4aa' : '#ff6b6b'} 
            />
            <Text style={[
              styles.totalReturn,
              { color: totalReturn >= 0 ? '#00d4aa' : '#ff6b6b' }
            ]}>
              {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()} ({totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent}%)
            </Text>
          </View>
          <Text style={styles.dayReturn}>
            Today: {dayReturn >= 0 ? '+' : ''}${dayReturn.toLocaleString()} ({dayReturnPercent >= 0 ? '+' : ''}{dayReturnPercent}%)
          </Text>
        </View>
      </LinearGradient>

      {/* Performance Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Performance</Title>
          <View style={styles.performanceGrid}>
            {mockPerformance.map((perf, index) => (
              <View key={index} style={styles.performanceItem}>
                <Text style={styles.performancePeriod}>{perf.period}</Text>
                <Text style={[styles.performanceReturn, { color: perf.color }]}>
                  {perf.return >= 0 ? '+' : ''}{perf.return}%
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Asset Allocation */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Asset Allocation</Title>
          {mockPositions.map((position, index) => (
            <View key={index} style={styles.allocationItem}>
              <View style={styles.allocationLeft}>
                <Text style={styles.allocationSymbol}>{position.symbol}</Text>
                <Text style={styles.allocationValue}>${position.marketValue.toLocaleString()}</Text>
              </View>
              <View style={styles.allocationRight}>
                <Text style={styles.allocationPercent}>{position.allocation}%</Text>
                <View style={styles.progressBarContainer}>
                  <ProgressBar 
                    progress={position.allocation / 100} 
                    color="#00d4aa" 
                    style={styles.progressBar}
                  />
                </View>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Positions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Positions</Title>
          {mockPositions.map((position, index) => (
            <View key={index} style={styles.positionItem}>
              <View style={styles.positionHeader}>
                <Text style={styles.positionSymbol}>{position.symbol}</Text>
                <Text style={[
                  styles.positionPL,
                  { color: position.unrealizedPL >= 0 ? '#00d4aa' : '#ff6b6b' }
                ]}>
                  {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                </Text>
              </View>
              <View style={styles.positionDetails}>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Quantity:</Text>
                  <Text style={styles.positionValue}>{position.quantity}</Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Avg Price:</Text>
                  <Text style={styles.positionValue}>${position.avgPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Current Price:</Text>
                  <Text style={styles.positionValue}>${position.currentPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Market Value:</Text>
                  <Text style={styles.positionValue}>${position.marketValue.toLocaleString()}</Text>
                </View>
                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Unrealized P&L:</Text>
                  <Text style={[
                    styles.positionValue,
                    { color: position.unrealizedPL >= 0 ? '#00d4aa' : '#ff6b6b' }
                  ]}>
                    {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)} ({position.unrealizedPLPercent >= 0 ? '+' : ''}{position.unrealizedPLPercent}%)
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Portfolio Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Portfolio Summary</Title>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Market Value</Text>
              <Text style={styles.summaryValue}>${totalMarketValue.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Unrealized P&L</Text>
              <Text style={[
                styles.summaryValue,
                { color: totalUnrealizedPL >= 0 ? '#00d4aa' : '#ff6b6b' }
              ]}>
                {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cash Balance</Text>
              <Text style={styles.summaryValue}>${(portfolioValue - totalMarketValue).toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Return</Text>
              <Text style={[
                styles.summaryValue,
                { color: totalReturn >= 0 ? '#00d4aa' : '#ff6b6b' }
              ]}>
                {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#00d4aa', '#00b894']}
            style={styles.actionGradient}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.actionText}>Add Position</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#74b9ff', '#0984e3']}
            style={styles.actionGradient}
          >
            <Ionicons name="analytics" size={20} color="#ffffff" />
            <Text style={styles.actionText}>Analytics</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  portfolioTitle: {
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
  returnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalReturn: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  dayReturn: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
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
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  performancePeriod: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 4,
  },
  performanceReturn: {
    fontSize: 16,
    fontWeight: '600',
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  allocationLeft: {
    flex: 1,
  },
  allocationSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  allocationValue: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 2,
  },
  allocationRight: {
    alignItems: 'flex-end',
    width: 100,
  },
  allocationPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4aa',
    marginBottom: 4,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  positionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  positionSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  positionPL: {
    fontSize: 16,
    fontWeight: '600',
  },
  positionDetails: {
    marginLeft: 10,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  positionLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
  positionValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PortfolioScreen;
