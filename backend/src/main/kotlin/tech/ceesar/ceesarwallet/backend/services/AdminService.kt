package tech.ceesar.ceesarwallet.backend.services

import kotlinx.serialization.Serializable
import mu.KotlinLogging
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.*
import tech.ceesar.ceesarwallet.backend.models.AdminStats
import tech.ceesar.ceesarwallet.backend.models.UserManagementRequest
import java.time.Instant

private val logger = KotlinLogging.logger {}

interface AdminService {
    suspend fun getSystemStats(): AdminStats
    suspend fun getUserStats(userId: String): UserStats
    suspend fun manageUser(request: UserManagementRequest): Boolean
    suspend fun getFraudAlerts(limit: Int = 100): List<FraudAlert>
    suspend fun getSystemHealth(): SystemHealth
}

data class UserStats(
    val userId: String,
    val totalTrades: Long,
    val totalVolume: String,
    val profitLoss: String,
    val riskScore: Double,
    val lastActivity: String,
    val accountStatus: String
)

data class FraudAlert(
    val alertId: String,
    val userId: String,
    val eventType: String,
    val score: Double,
    val action: String,
    val timestamp: String,
    val description: String,
    val resolved: Boolean
)

data class SystemHealth(
    val status: String, // HEALTHY, DEGRADED, DOWN
    val components: Map<String, ComponentHealth>,
    val lastCheck: String,
    val uptime: String
)

data class ComponentHealth(
    val status: String,
    val latency: Long?,
    val errorRate: Double?,
    val lastError: String?
)

class AdminServiceImpl(
    private val dynamoDbClient: DynamoDbClient,
    private val usersTableName: String,
    private val tradesTableName: String,
    private val fraudService: FraudService
) : AdminService {
    
    override suspend fun getSystemStats(): AdminStats {
        try {
            logger.debug { "Getting system statistics" }
            
            // In a real implementation, these would be aggregated from multiple sources
            // For now, return mock data
            val stats = AdminStats(
                totalUsers = 1250,
                activeUsers = 890,
                totalTrades = 45678L,
                totalVolume = "12,345,678.90",
                fraudEvents = 234L,
                blockedTrades = 45L,
                systemHealth = "HEALTHY",
                lastUpdated = Instant.now().toString()
            )
            
            logger.debug { "Retrieved system statistics" }
            return stats
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting system stats" }
            throw RuntimeException("Failed to get system stats", e)
        }
    }
    
    override suspend fun getUserStats(userId: String): UserStats {
        try {
            logger.debug { "Getting stats for user $userId" }
            
            // Query user trades
            val tradesQuery = QueryRequest.builder()
                .tableName(tradesTableName)
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(mapOf(":userId" to AttributeValue.builder().s(userId).build()))
                .build()
            
            val tradesResponse = dynamoDbClient.query(tradesQuery)
            val trades = tradesResponse.items()
            
            val totalTrades = trades.size.toLong()
            val totalVolume = trades.sumOf { 
                it["notional"]?.s()?.toDoubleOrNull() ?: 0.0 
            }.toString()
            
            val profitLoss = trades.sumOf { 
                it["pnl"]?.s()?.toDoubleOrNull() ?: 0.0 
            }.toString()
            
            val riskScore = calculateRiskScore(trades)
            
            val lastActivity = trades.maxByOrNull { 
                it["timestamp"]?.s() ?: "0" 
            }?.get("timestamp")?.s() ?: "Never"
            
            val userStats = UserStats(
                userId = userId,
                totalTrades = totalTrades,
                totalVolume = totalVolume,
                profitLoss = profitLoss,
                riskScore = riskScore,
                lastActivity = lastActivity,
                accountStatus = "ACTIVE" // Would be determined by user management logic
            )
            
            logger.debug { "Retrieved stats for user $userId" }
            return userStats
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting user stats for $userId" }
            throw RuntimeException("Failed to get user stats", e)
        }
    }
    
    override suspend fun manageUser(request: UserManagementRequest): Boolean {
        try {
            logger.info { "Managing user ${request.userId}: ${request.action}" }
            
            when (request.action) {
                "SUSPEND" -> suspendUser(request.userId, request.reason)
                "ACTIVATE" -> activateUser(request.userId)
                "DELETE" -> deleteUser(request.userId)
                else -> throw IllegalArgumentException("Invalid action: ${request.action}")
            }
            
            logger.info { "User management completed for ${request.userId}" }
            return true
            
        } catch (e: Exception) {
            logger.error(e) { "Error managing user ${request.userId}" }
            return false
        }
    }
    
    override suspend fun getFraudAlerts(limit: Int): List<FraudAlert> {
        try {
            logger.debug { "Getting fraud alerts (limit: $limit)" }
            
            // In a real implementation, this would query a fraud alerts table
            // For now, return mock data
            val alerts = listOf(
                FraudAlert(
                    alertId = "alert-001",
                    userId = "user-123",
                    eventType = "HIGH_VELOCITY_TRADING",
                    score = 0.85,
                    action = "BLOCK",
                    timestamp = Instant.now().minusSeconds(3600).toString(),
                    description = "User exceeded velocity threshold",
                    resolved = false
                ),
                FraudAlert(
                    alertId = "alert-002",
                    userId = "user-456",
                    eventType = "UNUSUAL_GEO_LOCATION",
                    score = 0.72,
                    action = "MFA",
                    timestamp = Instant.now().minusSeconds(7200).toString(),
                    description = "Login from unusual geographic location",
                    resolved = true
                )
            )
            
            logger.debug { "Retrieved ${alerts.size} fraud alerts" }
            return alerts.take(limit)
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting fraud alerts" }
            throw RuntimeException("Failed to get fraud alerts", e)
        }
    }
    
    override suspend fun getSystemHealth(): SystemHealth {
        try {
            logger.debug { "Checking system health" }
            
            val components = mapOf(
                "database" to ComponentHealth(
                    status = "HEALTHY",
                    latency = 15L,
                    errorRate = 0.001,
                    lastError = null
                ),
                "inference-service" to ComponentHealth(
                    status = "HEALTHY",
                    latency = 250L,
                    errorRate = 0.005,
                    lastError = null
                ),
                "engine-service" to ComponentHealth(
                    status = "HEALTHY",
                    latency = 180L,
                    errorRate = 0.002,
                    lastError = null
                ),
                "fraud-detection" to ComponentHealth(
                    status = "HEALTHY",
                    latency = 120L,
                    errorRate = 0.001,
                    lastError = null
                )
            )
            
            val overallStatus = if (components.values.all { it.status == "HEALTHY" }) {
                "HEALTHY"
            } else if (components.values.any { it.status == "DOWN" }) {
                "DOWN"
            } else {
                "DEGRADED"
            }
            
            val health = SystemHealth(
                status = overallStatus,
                components = components,
                lastCheck = Instant.now().toString(),
                uptime = "99.9%" // Would be calculated from actual uptime
            )
            
            logger.debug { "System health: $overallStatus" }
            return health
            
        } catch (e: Exception) {
            logger.error(e) { "Error checking system health" }
            throw RuntimeException("Failed to check system health", e)
        }
    }
    
    private suspend fun suspendUser(userId: String, reason: String?) {
        // Update user status in database
        val updateRequest = UpdateItemRequest.builder()
            .tableName(usersTableName)
            .key(mapOf("userId" to AttributeValue.builder().s(userId).build()))
            .updateExpression("SET accountStatus = :status, suspendedAt = :timestamp, suspensionReason = :reason")
            .expressionAttributeValues(mapOf(
                ":status" to AttributeValue.builder().s("SUSPENDED").build(),
                ":timestamp" to AttributeValue.builder().s(Instant.now().toString()).build(),
                ":reason" to AttributeValue.builder().s(reason ?: "Administrative action").build()
            ))
            .build()
        
        dynamoDbClient.updateItem(updateRequest)
    }
    
    private suspend fun activateUser(userId: String) {
        val updateRequest = UpdateItemRequest.builder()
            .tableName(usersTableName)
            .key(mapOf("userId" to AttributeValue.builder().s(userId).build()))
            .updateExpression("SET accountStatus = :status, activatedAt = :timestamp REMOVE suspendedAt, suspensionReason")
            .expressionAttributeValues(mapOf(
                ":status" to AttributeValue.builder().s("ACTIVE").build(),
                ":timestamp" to AttributeValue.builder().s(Instant.now().toString()).build()
            ))
            .build()
        
        dynamoDbClient.updateItem(updateRequest)
    }
    
    private suspend fun deleteUser(userId: String) {
        // Soft delete - mark as deleted rather than actually removing
        val updateRequest = UpdateItemRequest.builder()
            .tableName(usersTableName)
            .key(mapOf("userId" to AttributeValue.builder().s(userId).build()))
            .updateExpression("SET accountStatus = :status, deletedAt = :timestamp")
            .expressionAttributeValues(mapOf(
                ":status" to AttributeValue.builder().s("DELETED").build(),
                ":timestamp" to AttributeValue.builder().s(Instant.now().toString()).build()
            ))
            .build()
        
        dynamoDbClient.updateItem(updateRequest)
    }
    
    private fun calculateRiskScore(trades: List<Map<String, AttributeValue>>): Double {
        // Simple risk score calculation based on trade frequency and size
        val tradeCount = trades.size
        val avgTradeSize = trades.mapNotNull { 
            it["notional"]?.s()?.toDoubleOrNull() 
        }.average()
        
        return when {
            tradeCount > 100 && avgTradeSize > 10000 -> 0.8
            tradeCount > 50 && avgTradeSize > 5000 -> 0.6
            tradeCount > 20 -> 0.4
            else -> 0.2
        }
    }
}
