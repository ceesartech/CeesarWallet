import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TradingState {
  selectedSymbol: string;
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  isExecuting: boolean;
  timeframe: string;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: number;
  selectedBroker: 'alpaca' | 'binance' | 'oanda';
  riskSettings: {
    maxPositionSize: number;
    stopLossPercentage: number;
    takeProfitPercentage: number;
    maxDailyLoss: number;
  };
  tradingMode: 'live' | 'paper' | 'backtest';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    read: boolean;
  }>;
}

const initialState: TradingState = {
  selectedSymbol: 'AAPL',
  orderType: 'market',
  quantity: 1,
  price: 0,
  isExecuting: false,
  timeframe: '1h',
  isConnected: false,
  connectionStatus: 'disconnected',
  lastUpdate: Date.now(),
  selectedBroker: 'alpaca',
  riskSettings: {
    maxPositionSize: 10000,
    stopLossPercentage: 2,
    takeProfitPercentage: 4,
    maxDailyLoss: 1000,
  },
  tradingMode: 'paper',
  notifications: [],
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setSelectedSymbol: (state, action: PayloadAction<string>) => {
      state.selectedSymbol = action.payload;
    },
    setOrderType: (state, action: PayloadAction<TradingState['orderType']>) => {
      state.orderType = action.payload;
    },
    setQuantity: (state, action: PayloadAction<number>) => {
      state.quantity = action.payload;
    },
    setPrice: (state, action: PayloadAction<number>) => {
      state.price = action.payload;
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
    setTimeframe: (state, action: PayloadAction<string>) => {
      state.timeframe = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<TradingState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
    setLastUpdate: (state, action: PayloadAction<number>) => {
      state.lastUpdate = action.payload;
    },
    setSelectedBroker: (state, action: PayloadAction<TradingState['selectedBroker']>) => {
      state.selectedBroker = action.payload;
    },
    updateRiskSettings: (state, action: PayloadAction<Partial<TradingState['riskSettings']>>) => {
      state.riskSettings = { ...state.riskSettings, ...action.payload };
    },
    setTradingMode: (state, action: PayloadAction<TradingState['tradingMode']>) => {
      state.tradingMode = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<TradingState['notifications'][0], 'id' | 'timestamp' | 'read'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      });
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { 
  setSelectedSymbol, 
  setOrderType, 
  setQuantity, 
  setPrice, 
  setExecuting,
  setTimeframe,
  setConnectionStatus,
  setLastUpdate,
  setSelectedBroker,
  updateRiskSettings,
  setTradingMode,
  addNotification,
  markNotificationAsRead,
  clearNotifications
} = tradingSlice.actions;
export default tradingSlice.reducer;
