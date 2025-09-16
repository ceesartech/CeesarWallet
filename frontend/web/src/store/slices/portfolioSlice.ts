import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PortfolioState {
  portfolio: {
    balance: number;
    positions: Array<{
      symbol: string;
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      unrealizedPnL: number;
    }>;
    totalValue: number;
    totalPnL: number;
  };
}

const initialState: PortfolioState = {
  portfolio: {
    balance: 100000,
    positions: [],
    totalValue: 100000,
    totalPnL: 0,
  },
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updateBalance: (state, action: PayloadAction<number>) => {
      state.portfolio.balance = action.payload;
    },
    addPosition: (state, action: PayloadAction<PortfolioState['portfolio']['positions'][0]>) => {
      state.portfolio.positions.push(action.payload);
    },
    updatePosition: (state, action: PayloadAction<{ symbol: string; currentPrice: number }>) => {
      const position = state.portfolio.positions.find(p => p.symbol === action.payload.symbol);
      if (position) {
        position.currentPrice = action.payload.currentPrice;
        position.unrealizedPnL = (position.currentPrice - position.averagePrice) * position.quantity;
      }
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.portfolio.positions = state.portfolio.positions.filter(p => p.symbol !== action.payload);
    },
    updateTotalValue: (state) => {
      const positionsValue = state.portfolio.positions.reduce((total, position) => {
        return total + (position.currentPrice * position.quantity);
      }, 0);
      state.portfolio.totalValue = state.portfolio.balance + positionsValue;
      state.portfolio.totalPnL = state.portfolio.totalValue - 100000; // Assuming initial value of 100k
    },
  },
});

export const { updateBalance, addPosition, updatePosition, removePosition, updateTotalValue } = portfolioSlice.actions;
export default portfolioSlice.reducer;
