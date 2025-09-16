package tech.ceesar.ceesarwallet.backend.models

import kotlinx.serialization.Serializable
import tech.ceesar.ceesarwallet.core.domain.core.domain.AssetClass
import tech.ceesar.ceesarwallet.core.domain.core.dto.OrderType
import tech.ceesar.ceesarwallet.core.domain.core.dto.Side
import java.math.BigDecimal
import java.time.Instant

// Auth Models
@Serializable
data class AuthRequests(
    val loginRequest: LoginRequest,
    val registerRequest: RegisterRequest
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String,
    val email: String,
    val firstName: String,
    val lastName: String
)

// Trade Models
@Serializable
data class TradeRequests(
    val createOrderRequest: CreateOrderRequest,
    val updateOrderRequest: UpdateOrderRequest,
    val cancelOrderRequest: CancelOrderRequest
)

@Serializable
data class CreateOrderRequest(
    val symbol: String,
    val side: String,
    val quantity: String,
    val orderType: String = "MARKET",
    val price: String? = null,
    val stopLoss: String? = null,
    val takeProfit: String? = null,
    val timeInForce: String = "GTC"
)

@Serializable
data class UpdateOrderRequest(
    val orderId: String,
    val quantity: String? = null,
    val price: String? = null,
    val stopLoss: String? = null,
    val takeProfit: String? = null
)

@Serializable
data class CancelOrderRequest(
    val orderId: String
)

@Serializable
data class OrderResponse(
    val orderId: String,
    val symbol: String,
    val side: String,
    val quantity: String,
    val executedQuantity: String,
    val price: String?,
    val executedPrice: String?,
    val orderType: String,
    val status: String,
    val createdAt: String,
    val updatedAt: String,
    val fees: String? = null,
    val brokerOrderId: String? = null
)

@Serializable
data class PositionResponse(
    val symbol: String,
    val quantity: String,
    val averagePrice: String,
    val unrealizedPnL: String,
    val realizedPnL: String,
    val marketValue: String
)

// Fraud Models
@Serializable
data class FraudModels(
    val fraudEvent: FraudEvent,
    val fraudScore: FraudScore
)

@Serializable
data class FraudEvent(
    val eventId: String,
    val userId: String,
    val eventType: String,
    val timestamp: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val symbol: String? = null,
    val assetClass: String? = null,
    val quantity: String? = null,
    val notional: String? = null,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class FraudScore(
    val eventId: String,
    val userId: String,
    val score: Double,
    val action: String,
    val explanations: List<String> = emptyList(),
    val timestamp: String,
    val modelVersion: String? = null
)

// Inference Models
@Serializable
data class InferenceRequest(
    val symbol: String,
    val horizon: Int = 1,
    val includeFeatures: Boolean = false
)

@Serializable
data class InferenceResponse(
    val symbol: String,
    val forecast: String,
    val ciLow: String,
    val ciHigh: String,
    val confidence: Double,
    val modelName: String,
    val horizon: Int,
    val timestamp: String,
    val features: Map<String, Double> = emptyMap()
)

// Settings Models
@Serializable
data class UserSettings(
    val userId: String,
    val riskTolerance: String = "MEDIUM",
    val maxPositionSize: String = "10000.0",
    val stopLossPercentage: String = "2.0",
    val takeProfitPercentage: String = "4.0",
    val tradingEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val autoTradingEnabled: Boolean = false,
    val preferredBroker: String = "ALPACA",
    val timezone: String = "UTC",
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class UpdateSettingsRequest(
    val riskTolerance: String? = null,
    val maxPositionSize: String? = null,
    val stopLossPercentage: String? = null,
    val takeProfitPercentage: String? = null,
    val tradingEnabled: Boolean? = null,
    val notificationsEnabled: Boolean? = null,
    val autoTradingEnabled: Boolean? = null,
    val preferredBroker: String? = null,
    val timezone: String? = null
)

// Admin Models
@Serializable
data class AdminStats(
    val totalUsers: Int,
    val activeUsers: Int,
    val totalTrades: Long,
    val totalVolume: String,
    val fraudEvents: Long,
    val blockedTrades: Long,
    val systemHealth: String,
    val lastUpdated: String
)

@Serializable
data class UserManagementRequest(
    val userId: String,
    val action: String, // SUSPEND, ACTIVATE, DELETE
    val reason: String? = null
)
