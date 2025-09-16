import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Portfolio {
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
}

export const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/portfolio',
  }),
  endpoints: (builder) => ({
    getPortfolio: builder.query<Portfolio, void>({
      query: () => '/',
    }),
    updatePortfolio: builder.mutation<Portfolio, Partial<Portfolio>>({
      query: (portfolio) => ({
        url: '/',
        method: 'PUT',
        body: portfolio,
      }),
    }),
  }),
});

export const { useGetPortfolioQuery, useUpdatePortfolioMutation } = portfolioApi;
