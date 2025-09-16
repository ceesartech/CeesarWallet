import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

// GraphQL schema for real-time trading data
export const TRADING_SCHEMA = `
  type MarketData {
    symbol: String!
    timestamp: AWSDateTime!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Float!
  }

  type TradeSignal {
    id: ID!
    symbol: String!
    side: String!
    quantity: Float!
    price: Float
    orderType: String!
    timestamp: AWSDateTime!
    modelName: String!
    confidence: Float
  }

  type TradeExecution {
    id: ID!
    signalId: String!
    symbol: String!
    side: String!
    executedPrice: Float!
    executedQuantity: Float!
    executionTime: AWSDateTime!
    fees: Float!
    status: String!
    brokerOrderId: String
  }

  type Position {
    id: ID!
    symbol: String!
    side: String!
    quantity: Float!
    averagePrice: Float!
    currentPrice: Float!
    unrealizedPnL: Float!
    realizedPnL: Float!
    timestamp: AWSDateTime!
  }

  type Portfolio {
    id: ID!
    totalValue: Float!
    cashBalance: Float!
    investedValue: Float!
    totalPnL: Float!
    dailyPnL: Float!
    timestamp: AWSDateTime!
  }

  type FraudAlert {
    id: ID!
    userId: String!
    transactionId: String!
    fraudScore: Float!
    riskLevel: String!
    reason: String!
    timestamp: AWSDateTime!
  }

  type RiskAlert {
    id: ID!
    userId: String!
    riskType: String!
    currentValue: Float!
    threshold: Float!
    message: String!
    timestamp: AWSDateTime!
  }

  type Query {
    getMarketData(symbol: String!, limit: Int): [MarketData]
    getTradeSignals(limit: Int): [TradeSignal]
    getTradeExecutions(limit: Int): [TradeExecution]
    getPositions: [Position]
    getPortfolio: Portfolio
    getFraudAlerts(limit: Int): [FraudAlert]
    getRiskAlerts(limit: Int): [RiskAlert]
  }

  type Mutation {
    createTradeSignal(input: CreateTradeSignalInput!): TradeSignal
    executeTrade(input: ExecuteTradeInput!): TradeExecution
    closePosition(input: ClosePositionInput!): Position
    updateRiskSettings(input: UpdateRiskSettingsInput!): RiskSettings
  }

  type Subscription {
    onMarketDataUpdate(symbol: String!): MarketData
    onTradeSignalCreated: TradeSignal
    onTradeExecuted: TradeExecution
    onPositionUpdated: Position
    onPortfolioUpdated: Portfolio
    onFraudAlert: FraudAlert
    onRiskAlert: RiskAlert
  }

  input CreateTradeSignalInput {
    symbol: String!
    side: String!
    quantity: Float!
    price: Float
    orderType: String!
    modelName: String!
    confidence: Float
  }

  input ExecuteTradeInput {
    signalId: String!
    broker: String!
  }

  input ClosePositionInput {
    positionId: String!
    quantity: Float
  }

  input UpdateRiskSettingsInput {
    maxPositionSize: Float
    maxDailyLoss: Float
    stopLossPercentage: Float
  }

  type RiskSettings {
    id: ID!
    userId: String!
    maxPositionSize: Float!
    maxDailyLoss: Float!
    stopLossPercentage: Float!
    timestamp: AWSDateTime!
  }
`;

// GraphQL operations
export const GET_MARKET_DATA = `
  query GetMarketData($symbol: String!, $limit: Int) {
    getMarketData(symbol: $symbol, limit: $limit) {
      symbol
      timestamp
      open
      high
      low
      close
      volume
    }
  }
`;

export const GET_TRADE_SIGNALS = `
  query GetTradeSignals($limit: Int) {
    getTradeSignals(limit: $limit) {
      id
      symbol
      side
      quantity
      price
      orderType
      timestamp
      modelName
      confidence
    }
  }
`;

export const GET_TRADE_EXECUTIONS = `
  query GetTradeExecutions($limit: Int) {
    getTradeExecutions(limit: $limit) {
      id
      signalId
      symbol
      side
      executedPrice
      executedQuantity
      executionTime
      fees
      status
      brokerOrderId
    }
  }
`;

export const GET_POSITIONS = `
  query GetPositions {
    getPositions {
      id
      symbol
      side
      quantity
      averagePrice
      currentPrice
      unrealizedPnL
      realizedPnL
      timestamp
    }
  }
`;

export const GET_PORTFOLIO = `
  query GetPortfolio {
    getPortfolio {
      id
      totalValue
      cashBalance
      investedValue
      totalPnL
      dailyPnL
      timestamp
    }
  }
`;

export const CREATE_TRADE_SIGNAL = `
  mutation CreateTradeSignal($input: CreateTradeSignalInput!) {
    createTradeSignal(input: $input) {
      id
      symbol
      side
      quantity
      price
      orderType
      timestamp
      modelName
      confidence
    }
  }
`;

export const EXECUTE_TRADE = `
  mutation ExecuteTrade($input: ExecuteTradeInput!) {
    executeTrade(input: $input) {
      id
      signalId
      symbol
      side
      executedPrice
      executedQuantity
      executionTime
      fees
      status
      brokerOrderId
    }
  }
`;

export const CLOSE_POSITION = `
  mutation ClosePosition($input: ClosePositionInput!) {
    closePosition(input: $input) {
      id
      symbol
      side
      quantity
      averagePrice
      currentPrice
      unrealizedPnL
      realizedPnL
      timestamp
    }
  }
`;

// Subscriptions
export const ON_MARKET_DATA_UPDATE = `
  subscription OnMarketDataUpdate($symbol: String!) {
    onMarketDataUpdate(symbol: $symbol) {
      symbol
      timestamp
      open
      high
      low
      close
      volume
    }
  }
`;

export const ON_TRADE_SIGNAL_CREATED = `
  subscription OnTradeSignalCreated {
    onTradeSignalCreated {
      id
      symbol
      side
      quantity
      price
      orderType
      timestamp
      modelName
      confidence
    }
  }
`;

export const ON_TRADE_EXECUTED = `
  subscription OnTradeExecuted {
    onTradeExecuted {
      id
      signalId
      symbol
      side
      executedPrice
      executedQuantity
      executionTime
      fees
      status
      brokerOrderId
    }
  }
`;

export const ON_POSITION_UPDATED = `
  subscription OnPositionUpdated {
    onPositionUpdated {
      id
      symbol
      side
      quantity
      averagePrice
      currentPrice
      unrealizedPnL
      realizedPnL
      timestamp
    }
  }
`;

export const ON_PORTFOLIO_UPDATED = `
  subscription OnPortfolioUpdated {
    onPortfolioUpdated {
      id
      totalValue
      cashBalance
      investedValue
      totalPnL
      dailyPnL
      timestamp
    }
  }
`;

export const ON_FRAUD_ALERT = `
  subscription OnFraudAlert {
    onFraudAlert {
      id
      userId
      transactionId
      fraudScore
      riskLevel
      reason
      timestamp
    }
  }
`;

export const ON_RISK_ALERT = `
  subscription OnRiskAlert {
    onRiskAlert {
      id
      userId
      riskType
      currentValue
      threshold
      message
      timestamp
    }
  }
`;

// Real-time data service
export class RealTimeDataService {
  private client: any;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.client = generateClient();
  }

  // Subscribe to market data updates
  subscribeToMarketData(symbol: string, callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_MARKET_DATA_UPDATE,
      variables: { symbol },
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onMarketDataUpdate);
      },
      error: (error: any) => {
        console.error('Market data subscription error:', error);
      },
    });

    this.subscriptions.set(`market_${symbol}`, subscription);
    return subscription;
  }

  // Subscribe to trade signals
  subscribeToTradeSignals(callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_TRADE_SIGNAL_CREATED,
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onTradeSignalCreated);
      },
      error: (error: any) => {
        console.error('Trade signal subscription error:', error);
      },
    });

    this.subscriptions.set('trade_signals', subscription);
    return subscription;
  }

  // Subscribe to trade executions
  subscribeToTradeExecutions(callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_TRADE_EXECUTED,
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onTradeExecuted);
      },
      error: (error: any) => {
        console.error('Trade execution subscription error:', error);
      },
    });

    this.subscriptions.set('trade_executions', subscription);
    return subscription;
  }

  // Subscribe to portfolio updates
  subscribeToPortfolioUpdates(callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_PORTFOLIO_UPDATED,
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onPortfolioUpdated);
      },
      error: (error: any) => {
        console.error('Portfolio subscription error:', error);
      },
    });

    this.subscriptions.set('portfolio', subscription);
    return subscription;
  }

  // Subscribe to fraud alerts
  subscribeToFraudAlerts(callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_FRAUD_ALERT,
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onFraudAlert);
      },
      error: (error: any) => {
        console.error('Fraud alert subscription error:', error);
      },
    });

    this.subscriptions.set('fraud_alerts', subscription);
    return subscription;
  }

  // Subscribe to risk alerts
  subscribeToRiskAlerts(callback: (data: any) => void) {
    const subscription = this.client.graphql({
      query: ON_RISK_ALERT,
    }).subscribe({
      next: (data: any) => {
        callback(data.data.onRiskAlert);
      },
      error: (error: any) => {
        console.error('Risk alert subscription error:', error);
      },
    });

    this.subscriptions.set('risk_alerts', subscription);
    return subscription;
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // Execute GraphQL queries
  async query(query: string, variables: any = {}) {
    try {
      const result = await this.client.graphql({
        query,
        variables,
      });
      return result.data;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }

  // Execute GraphQL mutations
  async mutate(mutation: string, variables: any = {}) {
    try {
      const result = await this.client.graphql({
        query: mutation,
        variables,
      });
      return result.data;
    } catch (error) {
      console.error('GraphQL mutation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
