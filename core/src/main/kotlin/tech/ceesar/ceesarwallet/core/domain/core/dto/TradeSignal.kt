package tech.ceesar.ceesarwallet.core.domain.core.dto

import tech.ceesar.ceesarwallet.core.domain.core.domain.Instrument
import java.math.BigDecimal
import java.time.Instant

data class TradeSignal(
    val instrument: Instrument,
    val side: Side,
    val quantity: BigDecimal,
    val price: BigDecimal? = null, // null for market orders
    val orderType: OrderType = OrderType.MARKET,
    val stopLoss: BigDecimal? = null,
    val takeProfit: BigDecimal? = null,
    val confidence: Double = 1.0,
    val timestamp: Instant = Instant.now(),
    val metadata: Map<String, String> = emptyMap()
) {
    fun isValid(): Boolean {
        return quantity > BigDecimal.ZERO && 
               (stopLoss == null || takeProfit == null || stopLoss != takeProfit)
    }
    
    fun getRiskRewardRatio(): Double? {
        return if (stopLoss != null && takeProfit != null && price != null) {
            val risk = kotlin.math.abs(price.toDouble() - stopLoss.toDouble())
            val reward = kotlin.math.abs(takeProfit.toDouble() - price.toDouble())
            if (risk > 0) reward / risk else null
        } else null
    }
}

enum class OrderType {
    MARKET,
    LIMIT,
    STOP,
    STOP_LIMIT,
    BRACKET
}

data class TradeExecution(
    val signal: TradeSignal,
    val executionId: String,
    val executedPrice: BigDecimal,
    val executedQuantity: BigDecimal,
    val executionTime: Instant,
    val fees: BigDecimal,
    val status: ExecutionStatus,
    val brokerOrderId: String? = null
)

enum class ExecutionStatus {
    PENDING,
    PARTIALLY_FILLED,
    FILLED,
    CANCELLED,
    REJECTED,
    FAILED
}
