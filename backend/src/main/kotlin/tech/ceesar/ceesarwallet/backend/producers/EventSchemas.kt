package tech.ceesar.ceesarwallet.backend.producers

import kotlinx.serialization.Serializable

@Serializable
data class EventSchemas(
    val preTradeEvent: PreTradeEvent,
    val postTradeEvent: PostTradeEvent,
    val authEvent: AuthEvent,
    val paymentEvent: PaymentEvent
)

@Serializable
data class PreTradeEvent(
    val type: String = "PRE_TRADE",
    val eventId: String,
    val userId: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val symbol: String,
    val assetClass: String,
    val qty: String,
    val notional: String,
    val ts: String
)

@Serializable
data class PostTradeEvent(
    val type: String = "POST_TRADE",
    val eventId: String,
    val userId: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val symbol: String,
    val assetClass: String,
    val qty: String,
    val notional: String,
    val executionPrice: String,
    val fees: String,
    val ts: String
)

@Serializable
data class AuthEvent(
    val type: String = "AUTH",
    val eventId: String,
    val userId: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val authType: String, // LOGIN, LOGOUT, FAILED_LOGIN, MFA_REQUIRED
    val success: Boolean,
    val ts: String
)

@Serializable
data class PaymentEvent(
    val type: String = "PAYMENT",
    val eventId: String,
    val userId: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val amount: String,
    val currency: String,
    val paymentMethod: String? = null,
    val success: Boolean,
    val ts: String
)

@Serializable
data class FraudScoreEvent(
    val eventId: String,
    val userId: String,
    val score: Double,
    val action: String, // ALLOW, BLOCK, MFA, SHADOW
    val explanations: List<String> = emptyList(),
    val modelVersion: String? = null,
    val ts: String
)
