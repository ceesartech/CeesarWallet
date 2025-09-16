import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './api/authApi';
import { tradingApi } from './api/tradingApi';
import { marketDataApi } from './api/marketDataApi';
import { portfolioApi } from './api/portfolioApi';
import authSlice from './slices/authSlice';
import tradingSlice from './slices/tradingSlice';
import portfolioSlice from './slices/portfolioSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    trading: tradingSlice,
    portfolio: portfolioSlice,
    ui: uiSlice,
    [authApi.reducerPath]: authApi.reducer,
    [tradingApi.reducerPath]: tradingApi.reducer,
    [marketDataApi.reducerPath]: marketDataApi.reducer,
    [portfolioApi.reducerPath]: portfolioApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    })
      .concat(authApi.middleware)
      .concat(tradingApi.middleware)
      .concat(marketDataApi.middleware)
      .concat(portfolioApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
