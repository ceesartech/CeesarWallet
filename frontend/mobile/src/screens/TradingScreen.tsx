import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button, SegmentedButtons } from 'react-native-paper';

const { width } = Dimensions.get('window');

const TradingScreen = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(150.25);

  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META'];
  const orderTypes = ['market', 'limit', 'stop', 'stop_limit'];

  const mockMarketData = {
    AAPL: { price: 150.25, change: 2.5, changePercent: 1.69, volume: '45.2M' },
    GOOGL: { price: 2800.00, change: -15.50, changePercent: -0.55, volume: '1.8M' },
    MSFT: { price: 320.15, change: 5.25, changePercent: 1.67, volume: '28.5M' },
    TSLA: { price: 250.80, change: -8.20, changePercent: -3.16, volume: '52.1M' },
    AMZN: { price: 3200.50, change: 12.75, changePercent: 0.40, volume: '3.2M' },
    META: { price: 450.30, change: -5.80, changePercent: -1.27, volume: '15.8M' },
  };

  useEffect(() => {
    const marketData = mockMarketData[selectedSymbol as keyof typeof mockMarketData];
    if (marketData) {
      setCurrentPrice(marketData.price);
      setPrice(marketData.price.toString());
    }
  }, [selectedSymbol]);

  const handlePlaceOrder = () => {
    if (!quantity || !price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const orderData = {
      symbol: selectedSymbol,
      side,
      orderType,
      quantity: parseInt(quantity),
      price: parseFloat(price),
    };

    Alert.alert(
      'Confirm Order',
      `${side.toUpperCase()} ${quantity} shares of ${selectedSymbol} at $${price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            Alert.alert('Success', 'Order placed successfully!');
            setQuantity('');
            setPrice('');
          }
        },
      ]
    );
  };

  const marketData = mockMarketData[selectedSymbol as keyof typeof mockMarketData];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Market Data Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.marketData}>
          <Text style={styles.symbol}>{selectedSymbol}</Text>
          <Text style={styles.price}>${marketData?.price.toFixed(2)}</Text>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={marketData?.change >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={marketData?.change >= 0 ? '#00d4aa' : '#ff6b6b'} 
            />
            <Text style={[
              styles.change,
              { color: marketData?.change >= 0 ? '#00d4aa' : '#ff6b6b' }
            ]}>
              {marketData?.change >= 0 ? '+' : ''}${marketData?.change.toFixed(2)} ({marketData?.changePercent >= 0 ? '+' : ''}{marketData?.changePercent}%)
            </Text>
          </View>
          <Text style={styles.volume}>Vol: {marketData?.volume}</Text>
        </View>
      </LinearGradient>

      {/* Symbol Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Select Symbol</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.symbolScroll}>
            {symbols.map((symbol) => (
              <TouchableOpacity
                key={symbol}
                style={[
                  styles.symbolButton,
                  selectedSymbol === symbol && styles.selectedSymbolButton
                ]}
                onPress={() => setSelectedSymbol(symbol)}
              >
                <Text style={[
                  styles.symbolText,
                  selectedSymbol === symbol && styles.selectedSymbolText
                ]}>
                  {symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Order Type */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Order Type</Title>
          <SegmentedButtons
            value={orderType}
            onValueChange={setOrderType}
            buttons={[
              { value: 'market', label: 'Market' },
              { value: 'limit', label: 'Limit' },
              { value: 'stop', label: 'Stop' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Buy/Sell Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Side</Title>
          <View style={styles.sideButtons}>
            <TouchableOpacity
              style={[
                styles.sideButton,
                side === 'buy' && styles.buyButton
              ]}
              onPress={() => setSide('buy')}
            >
              <LinearGradient
                colors={side === 'buy' ? ['#00d4aa', '#00b894'] : ['#3d3d3d', '#2d2d2d']}
                style={styles.sideButtonGradient}
              >
                <Ionicons name="trending-up" size={24} color="#ffffff" />
                <Text style={styles.sideButtonText}>Buy</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sideButton,
                side === 'sell' && styles.sellButton
              ]}
              onPress={() => setSide('sell')}
            >
              <LinearGradient
                colors={side === 'sell' ? ['#ff6b6b', '#e74c3c'] : ['#3d3d3d', '#2d2d2d']}
                style={styles.sideButtonGradient}
              >
                <Ionicons name="trending-down" size={24} color="#ffffff" />
                <Text style={styles.sideButtonText}>Sell</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Order Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Order Details</Title>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>

          {orderType !== 'market' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.orderSummary}>
            <Text style={styles.summaryLabel}>Order Summary</Text>
            <Text style={styles.summaryText}>
              {side.toUpperCase()} {quantity || '0'} shares of {selectedSymbol}
              {orderType !== 'market' && price && ` at $${price}`}
            </Text>
            {quantity && price && (
              <Text style={styles.totalValue}>
                Total: ${(parseFloat(quantity) * parseFloat(price)).toFixed(2)}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Place Order Button */}
      <View style={styles.orderButtonContainer}>
        <TouchableOpacity
          style={[
            styles.orderButton,
            side === 'buy' ? styles.buyOrderButton : styles.sellOrderButton
          ]}
          onPress={handlePlaceOrder}
        >
          <LinearGradient
            colors={side === 'buy' ? ['#00d4aa', '#00b894'] : ['#ff6b6b', '#e74c3c']}
            style={styles.orderButtonGradient}
          >
            <Text style={styles.orderButtonText}>
              Place {side.toUpperCase()} Order
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ML Trading Panel */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>ML Trading</Title>
          <View style={styles.mlPanel}>
            <View style={styles.mlStatus}>
              <Text style={styles.mlLabel}>ML Signal:</Text>
              <Text style={styles.mlValue}>BUY</Text>
            </View>
            <View style={styles.mlStatus}>
              <Text style={styles.mlLabel}>Confidence:</Text>
              <Text style={styles.mlValue}>87%</Text>
            </View>
            <Button 
              mode="outlined" 
              style={styles.mlButton}
              onPress={() => Alert.alert('ML Trading', 'ML trading controls would open here')}
            >
              Auto Trade
            </Button>
          </View>
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
  marketData: {
    alignItems: 'center',
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  volume: {
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
  symbolScroll: {
    marginTop: 10,
  },
  symbolButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#3d3d3d',
  },
  selectedSymbolButton: {
    backgroundColor: '#00d4aa',
  },
  symbolText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSymbolText: {
    color: '#ffffff',
  },
  segmentedButtons: {
    marginTop: 10,
  },
  sideButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  sideButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  sideButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  sideButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  buyButton: {
    // Additional styles for buy button
  },
  sellButton: {
    // Additional styles for sell button
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4d4d4d',
  },
  orderSummary: {
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 16,
    color: '#00d4aa',
    fontWeight: '600',
  },
  orderButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  orderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buyOrderButton: {
    // Additional styles for buy order button
  },
  sellOrderButton: {
    // Additional styles for sell order button
  },
  mlPanel: {
    marginTop: 10,
  },
  mlStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mlLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  mlValue: {
    fontSize: 14,
    color: '#00d4aa',
    fontWeight: '600',
  },
  mlButton: {
    marginTop: 10,
    borderColor: '#00d4aa',
  },
});

export default TradingScreen;