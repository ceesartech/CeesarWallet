import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: string;
}

interface TradingState {
  orders: Order[];
  selectedSymbol: string;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: string;
  price: string;
  isAutoTradingEnabled: boolean;
  mlSignal: 'buy' | 'sell' | 'hold';
  mlConfidence: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: TradingState = {
  orders: [],
  selectedSymbol: 'AAPL',
  orderType: 'market',
  side: 'buy',
  quantity: '',
  price: '',
  isAutoTradingEnabled: false,
  mlSignal: 'hold',
  mlConfidence: 0,
  isLoading: false,
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setSelectedSymbol: (state, action: PayloadAction<string>) => {
      state.selectedSymbol = action.payload;
    },
    setOrderType: (state, action: PayloadAction<'market' | 'limit' | 'stop' | 'stop_limit'>) => {
      state.orderType = action.payload;
    },
    setSide: (state, action: PayloadAction<'buy' | 'sell'>) => {
      state.side = action.payload;
    },
    setQuantity: (state, action: PayloadAction<string>) => {
      state.quantity = action.payload;
    },
    setPrice: (state, action: PayloadAction<string>) => {
      state.price = action.payload;
    },
    placeOrderStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    placeOrderSuccess: (state, action: PayloadAction<Order>) => {
      state.isLoading = false;
      state.orders.unshift(action.payload);
      state.quantity = '';
      state.price = '';
      state.error = null;
    },
    placeOrderFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<{ id: string; status: Order['status'] }>) => {
      const order = state.orders.find(o => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
      }
    },
    setAutoTrading: (state, action: PayloadAction<boolean>) => {
      state.isAutoTradingEnabled = action.payload;
    },
    updateMLSignal: (state, action: PayloadAction<{ signal: 'buy' | 'sell' | 'hold'; confidence: number }>) => {
      state.mlSignal = action.payload.signal;
      state.mlConfidence = action.payload.confidence;
    },
    clearTradingForm: (state) => {
      state.quantity = '';
      state.price = '';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSelectedSymbol,
  setOrderType,
  setSide,
  setQuantity,
  setPrice,
  placeOrderStart,
  placeOrderSuccess,
  placeOrderFailure,
  updateOrderStatus,
  setAutoTrading,
  updateMLSignal,
  clearTradingForm,
  clearError,
} = tradingSlice.actions;

export default tradingSlice.reducer;
