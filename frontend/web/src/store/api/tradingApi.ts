import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { 
  TradeSignal, 
  TradeExecution, 
  Position, 
  OrderBook, 
  MarketData,
  Portfolio,
  PerformanceMetrics
} from '../../types/trading';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: async (headers) => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
    } catch (error) {
      // User not authenticated
      console.log('User not authenticated:', error);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const tradingApi = createApi({
  reducerPath: 'tradingApi',
  baseQuery,
  tagTypes: ['TradeSignal', 'TradeExecution', 'Position', 'Portfolio', 'MarketData'],
  endpoints: (builder) => ({
    // Market Data
    getMarketData: builder.query<MarketData[], { symbol: string; interval: string; limit?: number }>({
      query: ({ symbol, interval, limit = 100 }) => ({
        url: `/market-data/${symbol}`,
        params: { interval, limit },
      }),
      providesTags: ['MarketData'],
      // Add mock data for development
      transformResponse: (response: any) => {
        if (!response || response.length === 0) {
          // Generate mock market data
          const mockData = [];
          const basePrice = 150.00;
          const now = Date.now();
          
          for (let i = 0; i < 100; i++) {
            const timestamp = new Date(now - (100 - i) * 3600000); // Hourly data
            const priceVariation = (Math.random() - 0.5) * 10; // ±5 price variation
            const open = basePrice + priceVariation;
            const close = open + (Math.random() - 0.5) * 2;
            const high = Math.max(open, close) + Math.random() * 1;
            const low = Math.min(open, close) - Math.random() * 1;
            const volume = Math.floor(Math.random() * 1000000) + 100000;
            
            mockData.push({
              timestamp: timestamp.toISOString(),
              open: open.toFixed(2),
              high: high.toFixed(2),
              low: low.toFixed(2),
              close: close.toFixed(2),
              volume: volume.toString(),
            });
          }
          return mockData;
        }
        return response;
      },
    }),

    getOrderBook: builder.query<OrderBook, { symbol: string }>({
      query: ({ symbol }) => ({
        url: `/market-data/${symbol}/orderbook`,
      }),
      providesTags: ['MarketData'],
    }),

    // Trading Signals
    getSignals: builder.query<TradeSignal[], { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => ({
        url: '/signals',
        params: { limit, offset },
      }),
      providesTags: ['TradeSignal'],
    }),

    createSignal: builder.mutation<TradeSignal, Partial<TradeSignal>>({
      query: (signal) => ({
        url: '/signals',
        method: 'POST',
        body: signal,
      }),
      invalidatesTags: ['TradeSignal'],
    }),

    // Trade Execution
    executeTrade: builder.mutation<TradeExecution, { signalId: string; broker: string }>({
      query: ({ signalId, broker }) => ({
        url: '/trades/execute',
        method: 'POST',
        body: { signalId, broker },
      }),
      invalidatesTags: ['TradeExecution', 'Position', 'Portfolio'],
    }),

    getExecutions: builder.query<TradeExecution[], { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => ({
        url: '/trades/executions',
        params: { limit, offset },
      }),
      providesTags: ['TradeExecution'],
    }),

    // Positions
    getPositions: builder.query<Position[], void>({
      query: () => ({
        url: '/positions',
      }),
      providesTags: ['Position'],
      // Add mock data for development
      transformResponse: (response: any) => {
        if (!response || response.length === 0) {
          return [
            {
              id: 'pos-1',
              symbol: 'AAPL',
              side: 'long',
              quantity: 100,
              entryPrice: 150.00,
              currentPrice: 152.50,
              unrealizedPnL: 250.00,
              timestamp: Date.now(),
            },
            {
              id: 'pos-2',
              symbol: 'TSLA',
              side: 'short',
              quantity: 50,
              entryPrice: 200.00,
              currentPrice: 195.00,
              unrealizedPnL: 250.00,
              timestamp: Date.now(),
            },
          ];
        }
        return response;
      },
    }),

    closePosition: builder.mutation<Position, { positionId: string; quantity?: number }>({
      query: ({ positionId, quantity }) => ({
        url: `/positions/${positionId}/close`,
        method: 'POST',
        body: { quantity },
      }),
      invalidatesTags: ['Position', 'Portfolio'],
    }),

    // Portfolio
    getPortfolio: builder.query<Portfolio, void>({
      query: () => ({
        url: '/portfolio',
      }),
      providesTags: ['Portfolio'],
      // Add mock data for development
      transformResponse: (response: any) => {
        if (!response) {
          return {
            id: 'demo-portfolio',
            totalValue: 125000.00,
            totalPnL: 2500.00,
            totalPnLPercent: 2.04,
            cashBalance: 25000.00,
            positions: [
              { symbol: 'AAPL', quantity: 100, value: 15000.00, pnl: 500.00 },
              { symbol: 'MSFT', quantity: 50, value: 17500.00, pnl: 750.00 },
              { symbol: 'GOOGL', quantity: 25, value: 35000.00, pnl: 1250.00 },
            ],
            lastUpdated: new Date().toISOString(),
          };
        }
        return response;
      },
    }),

    getPerformanceMetrics: builder.query<PerformanceMetrics, { period: string }>({
      query: ({ period }) => ({
        url: '/portfolio/performance',
        params: { period },
      }),
      providesTags: ['Portfolio'],
    }),

    // Risk Management
    getRiskMetrics: builder.query<any, void>({
      query: () => ({
        url: '/risk/metrics',
      }),
    }),

    updateRiskSettings: builder.mutation<any, any>({
      query: (settings) => ({
        url: '/risk/settings',
        method: 'PUT',
        body: settings,
      }),
    }),

    // Fraud Detection
    checkFraud: builder.mutation<any, { amount: number; userId: string }>({
      query: (data) => ({
        url: '/fraud/check',
        method: 'POST',
        body: data,
      }),
    }),

    // Model Predictions
    getPredictions: builder.query<any[], { symbol: string; model: string }>({
      query: ({ symbol, model }) => ({
        url: `/predictions/${symbol}`,
        params: { model },
      }),
      // Add mock data for development
      transformResponse: (response: any) => {
        if (!response || response.length === 0) {
          // Return mock predictions for development
          return [
            {
              symbol: 'AAPL',
              signal: 'buy',
              confidence: 0.87,
              timestamp: new Date().toISOString(),
              price: 150.25,
              model: 'tft'
            },
            {
              symbol: 'AAPL',
              signal: 'hold',
              confidence: 0.73,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              price: 149.80,
              model: 'tft'
            }
          ];
        }
        return response;
      },
    }),

    // Real-time subscriptions
    subscribeToMarketData: builder.query<EventSource, { symbol: string }>({
      query: ({ symbol }) => ({
        url: `/market-data/${symbol}/stream`,
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      }),
    }),
  }),
});

export const {
  useGetMarketDataQuery,
  useGetOrderBookQuery,
  useGetSignalsQuery,
  useCreateSignalMutation,
  useExecuteTradeMutation,
  useGetExecutionsQuery,
  useGetPositionsQuery,
  useClosePositionMutation,
  useGetPortfolioQuery,
  useGetPerformanceMetricsQuery,
  useGetRiskMetricsQuery,
  useUpdateRiskSettingsMutation,
  useCheckFraudMutation,
  useGetPredictionsQuery,
  useSubscribeToMarketDataQuery,
} = tradingApi;
