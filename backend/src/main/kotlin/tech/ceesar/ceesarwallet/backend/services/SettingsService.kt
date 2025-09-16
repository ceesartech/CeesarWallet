package tech.ceesar.ceesarwallet.backend.services

import kotlinx.serialization.Serializable
import mu.KotlinLogging
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.*
import tech.ceesar.ceesarwallet.backend.models.UpdateSettingsRequest
import tech.ceesar.ceesarwallet.backend.models.UserSettings
import java.time.Instant

private val logger = KotlinLogging.logger {}

interface SettingsService {
    suspend fun getUserSettings(userId: String): UserSettings
    suspend fun updateUserSettings(userId: String, request: UpdateSettingsRequest): UserSettings
    suspend fun resetUserSettings(userId: String): UserSettings
    suspend fun validateSettings(settings: UserSettings): List<String>
}

class SettingsServiceImpl(
    private val dynamoDbClient: DynamoDbClient,
    private val tableName: String
) : SettingsService {
    
    override suspend fun getUserSettings(userId: String): UserSettings {
        try {
            logger.debug { "Getting settings for user $userId" }
            
            val request = GetItemRequest.builder()
                .tableName(tableName)
                .key(mapOf("userId" to AttributeValue.builder().s(userId).build()))
                .build()
            
            val response = dynamoDbClient.getItem(request)
            
            if (response.hasItem()) {
                val item = response.item()
                val settings = UserSettings(
                    userId = userId,
                    riskTolerance = item["riskTolerance"]?.s() ?: "MEDIUM",
                    maxPositionSize = item["maxPositionSize"]?.s() ?: "10000.0",
                    stopLossPercentage = item["stopLossPercentage"]?.s() ?: "2.0",
                    takeProfitPercentage = item["takeProfitPercentage"]?.s() ?: "4.0",
                    tradingEnabled = item["tradingEnabled"]?.bool() ?: true,
                    notificationsEnabled = item["notificationsEnabled"]?.bool() ?: true,
                    autoTradingEnabled = item["autoTradingEnabled"]?.bool() ?: false,
                    preferredBroker = item["preferredBroker"]?.s() ?: "ALPACA",
                    timezone = item["timezone"]?.s() ?: "UTC",
                    metadata = item["metadata"]?.m()?.mapValues { it.value.s() } ?: emptyMap()
                )
                
                logger.debug { "Retrieved settings for user $userId" }
                return settings
            } else {
                // Return default settings for new user
                val defaultSettings = UserSettings(userId = userId)
                saveUserSettings(defaultSettings)
                logger.debug { "Created default settings for new user $userId" }
                return defaultSettings
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting settings for user $userId" }
            throw RuntimeException("Failed to get user settings", e)
        }
    }
    
    override suspend fun updateUserSettings(userId: String, request: UpdateSettingsRequest): UserSettings {
        try {
            logger.info { "Updating settings for user $userId" }
            
            val currentSettings = getUserSettings(userId)
            val updatedSettings = currentSettings.copy(
                riskTolerance = request.riskTolerance ?: currentSettings.riskTolerance,
                maxPositionSize = request.maxPositionSize ?: currentSettings.maxPositionSize,
                stopLossPercentage = request.stopLossPercentage ?: currentSettings.stopLossPercentage,
                takeProfitPercentage = request.takeProfitPercentage ?: currentSettings.takeProfitPercentage,
                tradingEnabled = request.tradingEnabled ?: currentSettings.tradingEnabled,
                notificationsEnabled = request.notificationsEnabled ?: currentSettings.notificationsEnabled,
                autoTradingEnabled = request.autoTradingEnabled ?: currentSettings.autoTradingEnabled,
                preferredBroker = request.preferredBroker ?: currentSettings.preferredBroker,
                timezone = request.timezone ?: currentSettings.timezone
            )
            
            val validationErrors = validateSettings(updatedSettings)
            if (validationErrors.isNotEmpty()) {
                logger.warn { "Settings validation failed for user $userId: $validationErrors" }
                throw IllegalArgumentException("Invalid settings: ${validationErrors.joinToString(", ")}")
            }
            
            saveUserSettings(updatedSettings)
            logger.info { "Settings updated successfully for user $userId" }
            return updatedSettings
            
        } catch (e: Exception) {
            logger.error(e) { "Error updating settings for user $userId" }
            throw RuntimeException("Failed to update user settings", e)
        }
    }
    
    override suspend fun resetUserSettings(userId: String): UserSettings {
        try {
            logger.info { "Resetting settings for user $userId" }
            
            val defaultSettings = UserSettings(userId = userId)
            saveUserSettings(defaultSettings)
            
            logger.info { "Settings reset successfully for user $userId" }
            return defaultSettings
            
        } catch (e: Exception) {
            logger.error(e) { "Error resetting settings for user $userId" }
            throw RuntimeException("Failed to reset user settings", e)
        }
    }
    
    override suspend fun validateSettings(settings: UserSettings): List<String> {
        val errors = mutableListOf<String>()
        
        // Validate risk tolerance
        if (!listOf("LOW", "MEDIUM", "HIGH").contains(settings.riskTolerance)) {
            errors.add("Invalid risk tolerance: ${settings.riskTolerance}")
        }
        
        // Validate position size
        try {
            val maxPositionSize = settings.maxPositionSize.toDouble()
            if (maxPositionSize <= 0 || maxPositionSize > 1000000) {
                errors.add("Max position size must be between 0 and 1,000,000")
            }
        } catch (e: NumberFormatException) {
            errors.add("Invalid max position size format")
        }
        
        // Validate stop loss percentage
        try {
            val stopLossPct = settings.stopLossPercentage.toDouble()
            if (stopLossPct <= 0 || stopLossPct > 50) {
                errors.add("Stop loss percentage must be between 0 and 50")
            }
        } catch (e: NumberFormatException) {
            errors.add("Invalid stop loss percentage format")
        }
        
        // Validate take profit percentage
        try {
            val takeProfitPct = settings.takeProfitPercentage.toDouble()
            if (takeProfitPct <= 0 || takeProfitPct > 100) {
                errors.add("Take profit percentage must be between 0 and 100")
            }
        } catch (e: NumberFormatException) {
            errors.add("Invalid take profit percentage format")
        }
        
        // Validate broker
        if (!listOf("ALPACA", "INTERACTIVE_BROKERS", "OANDA", "BINANCE", "KRAKEN").contains(settings.preferredBroker)) {
            errors.add("Invalid preferred broker: ${settings.preferredBroker}")
        }
        
        return errors
    }
    
    private suspend fun saveUserSettings(settings: UserSettings) {
        val item = mapOf(
            "userId" to AttributeValue.builder().s(settings.userId).build(),
            "riskTolerance" to AttributeValue.builder().s(settings.riskTolerance).build(),
            "maxPositionSize" to AttributeValue.builder().s(settings.maxPositionSize).build(),
            "stopLossPercentage" to AttributeValue.builder().s(settings.stopLossPercentage).build(),
            "takeProfitPercentage" to AttributeValue.builder().s(settings.takeProfitPercentage).build(),
            "tradingEnabled" to AttributeValue.builder().bool(settings.tradingEnabled).build(),
            "notificationsEnabled" to AttributeValue.builder().bool(settings.notificationsEnabled).build(),
            "autoTradingEnabled" to AttributeValue.builder().bool(settings.autoTradingEnabled).build(),
            "preferredBroker" to AttributeValue.builder().s(settings.preferredBroker).build(),
            "timezone" to AttributeValue.builder().s(settings.timezone).build(),
            "lastUpdated" to AttributeValue.builder().s(Instant.now().toString()).build()
        )
        
        val request = PutItemRequest.builder()
            .tableName(tableName)
            .item(item)
            .build()
        
        dynamoDbClient.putItem(request)
    }
}
