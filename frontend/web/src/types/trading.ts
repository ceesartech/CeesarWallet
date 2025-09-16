export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  confidence: number;
  timestamp: number;
  price: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  timestamp: number;
}

export interface Portfolio {
  balance: number;
  positions: Position[];
  totalValue: number;
  totalPnL: number;
}

export interface TradeExecution {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface OrderBook {
  symbol: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  timestamp: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  dailyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
}
