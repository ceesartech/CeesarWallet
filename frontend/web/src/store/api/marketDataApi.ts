import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const marketDataApi = createApi({
  reducerPath: 'marketDataApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/market-data',
  }),
  endpoints: (builder) => ({
    getMarketData: builder.query<MarketData[], string>({
      query: (symbol) => `/${symbol}`,
    }),
    getMarketDataHistory: builder.query<MarketData[], { symbol: string; days: number }>({
      query: ({ symbol, days }) => `/${symbol}/history?days=${days}`,
    }),
  }),
});

export const { useGetMarketDataQuery, useGetMarketDataHistoryQuery } = marketDataApi;
