import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

interface PortfolioState {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayReturn: number;
  dayReturnPercent: number;
  positions: Position[];
  cashBalance: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  totalValue: 125000,
  totalReturn: 15000,
  totalReturnPercent: 13.6,
  dayReturn: 2500,
  dayReturnPercent: 2.04,
  positions: [
    {
      symbol: 'AAPL',
      quantity: 100,
      avgPrice: 145.50,
      currentPrice: 150.25,
      marketValue: 15025,
      unrealizedPL: 475,
      unrealizedPLPercent: 3.26,
    },
    {
      symbol: 'GOOGL',
      quantity: 50,
      avgPrice: 2850.00,
      currentPrice: 2800.00,
      marketValue: 140000,
      unrealizedPL: -2500,
      unrealizedPLPercent: -1.75,
    },
  ],
  cashBalance: 10000,
  isLoading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    fetchPortfolioStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPortfolioSuccess: (state, action: PayloadAction<Partial<PortfolioState>>) => {
      state.isLoading = false;
      state.totalValue = action.payload.totalValue || state.totalValue;
      state.totalReturn = action.payload.totalReturn || state.totalReturn;
      state.totalReturnPercent = action.payload.totalReturnPercent || state.totalReturnPercent;
      state.dayReturn = action.payload.dayReturn || state.dayReturn;
      state.dayReturnPercent = action.payload.dayReturnPercent || state.dayReturnPercent;
      state.positions = action.payload.positions || state.positions;
      state.cashBalance = action.payload.cashBalance || state.cashBalance;
      state.error = null;
    },
    fetchPortfolioFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updatePosition: (state, action: PayloadAction<{ symbol: string; position: Partial<Position> }>) => {
      const index = state.positions.findIndex(pos => pos.symbol === action.payload.symbol);
      if (index !== -1) {
        state.positions[index] = { ...state.positions[index], ...action.payload.position };
      }
    },
    addPosition: (state, action: PayloadAction<Position>) => {
      state.positions.push(action.payload);
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter(pos => pos.symbol !== action.payload);
    },
    updateMarketData: (state, action: PayloadAction<{ symbol: string; currentPrice: number }>) => {
      const position = state.positions.find(pos => pos.symbol === action.payload.symbol);
      if (position) {
        position.currentPrice = action.payload.currentPrice;
        position.marketValue = position.quantity * position.currentPrice;
        position.unrealizedPL = position.marketValue - (position.quantity * position.avgPrice);
        position.unrealizedPLPercent = (position.unrealizedPL / (position.quantity * position.avgPrice)) * 100;
      }
    },
  },
});

export const {
  fetchPortfolioStart,
  fetchPortfolioSuccess,
  fetchPortfolioFailure,
  updatePosition,
  addPosition,
  removePosition,
  updateMarketData,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
