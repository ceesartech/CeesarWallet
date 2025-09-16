package tech.ceesar.ceesarwallet.backend.services

import kotlinx.serialization.Serializable
import mu.KotlinLogging
import software.amazon.awssdk.services.frauddetector.FraudDetectorClient
import software.amazon.awssdk.services.frauddetector.model.*
import tech.ceesar.ceesarwallet.backend.models.FraudEvent
import tech.ceesar.ceesarwallet.backend.models.FraudScore
import java.time.Instant

private val logger = KotlinLogging.logger {}

@Serializable
data class FraudDetectionRequest(
    val detectorId: String,
    val entityId: String,
    val eventTypeName: String,
    val eventTimestamp: String,
    val eventVariables: Map<String, String>
)

@Serializable
data class FraudDetectionResponse(
    val modelScores: Map<String, Double>,
    val rulesResults: List<RuleResult>,
    val outcomes: List<String>
)

@Serializable
data class RuleResult(
    val ruleId: String,
    val outcome: String
)

interface FraudService {
    suspend fun evaluateEvent(event: FraudEvent): FraudScore
    suspend fun getFraudStats(): FraudStats
    suspend fun updateFraudRules(rules: List<FraudRule>): Boolean
}

data class FraudStats(
    val totalEvents: Long,
    val blockedEvents: Long,
    val allowedEvents: Long,
    val mfaRequiredEvents: Long,
    val averageScore: Double,
    val lastUpdated: String
)

data class FraudRule(
    val ruleId: String,
    val ruleName: String,
    val description: String,
    val expression: String,
    val outcome: String,
    val isActive: Boolean
)

class FraudServiceImpl(
    private val fraudDetectorClient: FraudDetectorClient,
    private val detectorId: String
) : FraudService {
    
    override suspend fun evaluateEvent(event: FraudEvent): FraudScore {
        try {
            logger.debug { "Evaluating fraud event ${event.eventId} for user ${event.userId}" }
            
            val request = GetEventPredictionRequest.builder()
                .detectorId(detectorId)
                .eventId(event.eventId)
                .eventTypeName(event.eventType)
                .eventTimestamp(Instant.parse(event.timestamp))
                .entities(mapOf("userId" to Entity.builder().entityType("userId").entityId(event.userId).build()))
                .eventVariables(buildEventVariables(event))
                .build()
            
            val response = fraudDetectorClient.getEventPrediction(request)
            
            val score = response.modelScores()?.values()?.firstOrNull() ?: 0.0
            val outcome = response.outcomes()?.firstOrNull() ?: "ALLOW"
            
            val fraudScore = FraudScore(
                eventId = event.eventId,
                userId = event.userId,
                score = score,
                action = outcome,
                explanations = generateExplanations(score, outcome),
                timestamp = Instant.now().toString(),
                modelVersion = response.modelScores()?.keys()?.firstOrNull()
            )
            
            logger.debug { "Fraud evaluation completed: score=$score, action=$outcome" }
            return fraudScore
            
        } catch (e: Exception) {
            logger.error(e) { "Error evaluating fraud event ${event.eventId}" }
            // Return safe default - allow transaction but log for review
            return FraudScore(
                eventId = event.eventId,
                userId = event.userId,
                score = 0.5,
                action = "ALLOW",
                explanations = listOf("fraud-detection-error"),
                timestamp = Instant.now().toString()
            )
        }
    }
    
    override suspend fun getFraudStats(): FraudStats {
        try {
            logger.debug { "Getting fraud statistics" }
            
            // In a real implementation, this would query CloudWatch metrics or a database
            // For now, return mock data
            return FraudStats(
                totalEvents = 10000L,
                blockedEvents = 150L,
                allowedEvents = 9800L,
                mfaRequiredEvents = 50L,
                averageScore = 0.15,
                lastUpdated = Instant.now().toString()
            )
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting fraud stats" }
            throw RuntimeException("Failed to get fraud stats", e)
        }
    }
    
    override suspend fun updateFraudRules(rules: List<FraudRule>): Boolean {
        try {
            logger.info { "Updating ${rules.size} fraud rules" }
            
            // In a real implementation, this would update rules in AWS Fraud Detector
            // For now, just log the operation
            rules.forEach { rule ->
                logger.debug { "Rule: ${rule.ruleId} - ${rule.ruleName} (${rule.outcome})" }
            }
            
            return true
            
        } catch (e: Exception) {
            logger.error(e) { "Error updating fraud rules" }
            return false
        }
    }
    
    private fun buildEventVariables(event: FraudEvent): Map<String, String> {
        val variables = mutableMapOf<String, String>()
        
        event.ip?.let { variables["ip"] = it }
        event.deviceId?.let { variables["deviceId"] = it }
        event.geo?.let { variables["geo"] = it }
        event.symbol?.let { variables["symbol"] = it }
        event.assetClass?.let { variables["assetClass"] = it }
        event.quantity?.let { variables["quantity"] = it }
        event.notional?.let { variables["notional"] = it }
        
        // Add computed variables
        variables["eventType"] = event.eventType
        variables["timestamp"] = event.timestamp
        
        return variables
    }
    
    private fun generateExplanations(score: Double, outcome: String): List<String> {
        val explanations = mutableListOf<String>()
        
        when {
            score < 0.1 -> explanations.add("low-risk")
            score < 0.3 -> explanations.add("medium-risk")
            else -> explanations.add("high-risk")
        }
        
        when (outcome) {
            "ALLOW" -> explanations.add("transaction-approved")
            "BLOCK" -> explanations.add("transaction-blocked")
            "MFA" -> explanations.add("mfa-required")
            "SHADOW" -> explanations.add("shadow-mode")
        }
        
        return explanations
    }
}
