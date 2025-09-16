package tech.ceesar.ceesarwallet.backend.services

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import mu.KotlinLogging
import tech.ceesar.ceesarwallet.backend.config.HttpClients
import tech.ceesar.ceesarwallet.backend.models.*
import tech.ceesar.ceesarwallet.backend.producers.KinesisProducer
import java.math.BigDecimal
import java.time.Instant

private val logger = KotlinLogging.logger {}

interface TradeService {
    suspend fun createOrder(userId: String, request: CreateOrderRequest, ip: String?, deviceId: String?, geo: String?): OrderResponse
    suspend fun updateOrder(userId: String, request: UpdateOrderRequest): OrderResponse
    suspend fun cancelOrder(userId: String, request: CancelOrderRequest): Boolean
    suspend fun getOrders(userId: String, symbol: String? = null, status: String? = null): List<OrderResponse>
    suspend fun getPositions(userId: String): List<PositionResponse>
    suspend fun getOrderHistory(userId: String, limit: Int = 100): List<OrderResponse>
}

class TradeServiceImpl(
    private val httpClient: HttpClient = HttpClients.createEngineClient(),
    private val kinesisProducer: KinesisProducer
) : TradeService {
    
    override suspend fun createOrder(
        userId: String, 
        request: CreateOrderRequest, 
        ip: String?, 
        deviceId: String?, 
        geo: String?
    ): OrderResponse {
        try {
            logger.info { "Creating order for user $userId: ${request.symbol} ${request.side} ${request.quantity}" }
            
            // Publish pre-trade fraud detection event
            kinesisProducer.publishPreTradeEvent(
                userId = userId,
                ip = ip,
                deviceId = deviceId,
                geo = geo,
                symbol = request.symbol,
                assetClass = "UNKNOWN", // Will be determined by engine
                qty = request.quantity,
                notional = calculateNotional(request.quantity, request.price)
            )
            
            // Wait for fraud detection score (simplified - in production would use async callback)
            Thread.sleep(100) // Simulate fraud detection latency
            
            val engineRequest = mapOf(
                "userId" to userId,
                "symbol" to request.symbol,
                "side" to request.side,
                "quantity" to request.quantity,
                "orderType" to request.orderType,
                "price" to request.price,
                "stopLoss" to request.stopLoss,
                "takeProfit" to request.takeProfit,
                "timeInForce" to request.timeInForce
            )
            
            val response = httpClient.post("/orders") {
                contentType(ContentType.Application.Json)
                setBody(engineRequest)
            }
            
            if (response.status.isSuccess()) {
                val orderResponse = response.body<OrderResponse>()
                
                // Publish post-trade fraud detection event
                kinesisProducer.publishPostTradeEvent(
                    userId = userId,
                    ip = ip,
                    deviceId = deviceId,
                    geo = geo,
                    symbol = request.symbol,
                    assetClass = "UNKNOWN",
                    qty = request.quantity,
                    notional = calculateNotional(request.quantity, request.price),
                    executionPrice = orderResponse.executedPrice ?: "0",
                    fees = orderResponse.fees ?: "0"
                )
                
                logger.info { "Order created successfully: ${orderResponse.orderId}" }
                return orderResponse
            } else {
                logger.error { "Order creation failed with status ${response.status}" }
                throw RuntimeException("Order creation failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error creating order for user $userId" }
            throw RuntimeException("Failed to create order", e)
        }
    }
    
    override suspend fun updateOrder(userId: String, request: UpdateOrderRequest): OrderResponse {
        try {
            logger.info { "Updating order ${request.orderId} for user $userId" }
            
            val updateRequest = mapOf(
                "userId" to userId,
                "orderId" to request.orderId,
                "quantity" to request.quantity,
                "price" to request.price,
                "stopLoss" to request.stopLoss,
                "takeProfit" to request.takeProfit
            )
            
            val response = httpClient.put("/orders/${request.orderId}") {
                contentType(ContentType.Application.Json)
                setBody(updateRequest)
            }
            
            if (response.status.isSuccess()) {
                val orderResponse = response.body<OrderResponse>()
                logger.info { "Order updated successfully: ${orderResponse.orderId}" }
                return orderResponse
            } else {
                logger.error { "Order update failed with status ${response.status}" }
                throw RuntimeException("Order update failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error updating order ${request.orderId} for user $userId" }
            throw RuntimeException("Failed to update order", e)
        }
    }
    
    override suspend fun cancelOrder(userId: String, request: CancelOrderRequest): Boolean {
        try {
            logger.info { "Cancelling order ${request.orderId} for user $userId" }
            
            val response = httpClient.delete("/orders/${request.orderId}") {
                parameter("userId", userId)
            }
            
            if (response.status.isSuccess()) {
                logger.info { "Order cancelled successfully: ${request.orderId}" }
                return true
            } else {
                logger.error { "Order cancellation failed with status ${response.status}" }
                return false
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error cancelling order ${request.orderId} for user $userId" }
            throw RuntimeException("Failed to cancel order", e)
        }
    }
    
    override suspend fun getOrders(userId: String, symbol: String?, status: String?): List<OrderResponse> {
        try {
            logger.debug { "Getting orders for user $userId" }
            
            val response = httpClient.get("/orders") {
                parameter("userId", userId)
                symbol?.let { parameter("symbol", it) }
                status?.let { parameter("status", it) }
            }
            
            if (response.status.isSuccess()) {
                val orders = response.body<List<OrderResponse>>()
                logger.debug { "Retrieved ${orders.size} orders for user $userId" }
                return orders
            } else {
                logger.error { "Get orders failed with status ${response.status}" }
                throw RuntimeException("Get orders failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting orders for user $userId" }
            throw RuntimeException("Failed to get orders", e)
        }
    }
    
    override suspend fun getPositions(userId: String): List<PositionResponse> {
        try {
            logger.debug { "Getting positions for user $userId" }
            
            val response = httpClient.get("/positions") {
                parameter("userId", userId)
            }
            
            if (response.status.isSuccess()) {
                val positions = response.body<List<PositionResponse>>()
                logger.debug { "Retrieved ${positions.size} positions for user $userId" }
                return positions
            } else {
                logger.error { "Get positions failed with status ${response.status}" }
                throw RuntimeException("Get positions failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting positions for user $userId" }
            throw RuntimeException("Failed to get positions", e)
        }
    }
    
    override suspend fun getOrderHistory(userId: String, limit: Int): List<OrderResponse> {
        try {
            logger.debug { "Getting order history for user $userId" }
            
            val response = httpClient.get("/orders/history") {
                parameter("userId", userId)
                parameter("limit", limit.toString())
            }
            
            if (response.status.isSuccess()) {
                val orders = response.body<List<OrderResponse>>()
                logger.debug { "Retrieved ${orders.size} historical orders for user $userId" }
                return orders
            } else {
                logger.error { "Get order history failed with status ${response.status}" }
                throw RuntimeException("Get order history failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting order history for user $userId" }
            throw RuntimeException("Failed to get order history", e)
        }
    }
    
    private fun calculateNotional(quantity: String, price: String?): String {
        return try {
            val qty = BigDecimal(quantity)
            val prc = price?.let { BigDecimal(it) } ?: BigDecimal.ZERO
            qty.multiply(prc).toString()
        } catch (e: Exception) {
            "0"
        }
    }
}
