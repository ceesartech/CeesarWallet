import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    trading: boolean;
    alerts: boolean;
  };
  security: {
    biometric: boolean;
    twoFactor: boolean;
    sessionTimeout: number;
  };
  appearance: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    currency: string;
  };
  trading: {
    defaultOrderType: 'market' | 'limit';
    defaultQuantity: number;
    riskManagement: boolean;
    autoTrading: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    trading: true,
    alerts: true,
  },
  security: {
    biometric: true,
    twoFactor: false,
    sessionTimeout: 30,
  },
  appearance: {
    theme: 'dark',
    language: 'en',
    currency: 'USD',
  },
  trading: {
    defaultOrderType: 'market',
    defaultQuantity: 1,
    riskManagement: true,
    autoTrading: false,
  },
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    fetchSettingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSettingsSuccess: (state, action: PayloadAction<Partial<SettingsState>>) => {
      state.isLoading = false;
      state.notifications = { ...state.notifications, ...action.payload.notifications };
      state.security = { ...state.security, ...action.payload.security };
      state.appearance = { ...state.appearance, ...action.payload.appearance };
      state.trading = { ...state.trading, ...action.payload.trading };
      state.error = null;
    },
    fetchSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateNotificationSetting: (state, action: PayloadAction<{ key: keyof SettingsState['notifications']; value: boolean }>) => {
      state.notifications[action.payload.key] = action.payload.value;
    },
    updateSecuritySetting: (state, action: PayloadAction<{ key: keyof SettingsState['security']; value: boolean | number }>) => {
      (state.security as any)[action.payload.key] = action.payload.value;
    },
    updateAppearanceSetting: (state, action: PayloadAction<{ key: keyof SettingsState['appearance']; value: any }>) => {
      state.appearance[action.payload.key] = action.payload.value;
    },
    updateTradingSetting: (state, action: PayloadAction<{ key: keyof SettingsState['trading']; value: any }>) => {
      (state.trading as any)[action.payload.key] = action.payload.value;
    },
    saveSettingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    saveSettingsSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    saveSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetSettings: (state) => {
      state.notifications = initialState.notifications;
      state.security = initialState.security;
      state.appearance = initialState.appearance;
      state.trading = initialState.trading;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchSettingsStart,
  fetchSettingsSuccess,
  fetchSettingsFailure,
  updateNotificationSetting,
  updateSecuritySetting,
  updateAppearanceSetting,
  updateTradingSetting,
  saveSettingsStart,
  saveSettingsSuccess,
  saveSettingsFailure,
  resetSettings,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
