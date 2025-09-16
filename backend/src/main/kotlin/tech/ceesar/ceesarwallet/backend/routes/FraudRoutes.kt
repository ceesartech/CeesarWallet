package tech.ceesar.ceesarwallet.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import mu.KotlinLogging
import software.amazon.awssdk.services.frauddetector.FraudDetectorClient
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import tech.ceesar.ceesarwallet.backend.models.FraudEvent
import tech.ceesar.ceesarwallet.backend.models.FraudScore
import tech.ceesar.ceesarwallet.backend.services.FraudService
import tech.ceesar.ceesarwallet.backend.services.FraudServiceImpl

private val logger = KotlinLogging.logger {}

object FraudRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/fraud") {
                authenticate("jwt") {
                    val fraudService = createFraudService()
                    
                    post("/evaluate") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<FraudEvent>()
                            logger.info { "Fraud evaluation request for user $userId" }
                            
                            val score = fraudService.evaluateEvent(request)
                            call.respond(HttpStatusCode.OK, score)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for fraud evaluation" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error evaluating fraud event" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FRAUD_EVALUATION_FAILED",
                                message = e.message ?: "Failed to evaluate fraud event"
                            ))
                        }
                    }
                    
                    get("/stats") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            // Check if user has admin role
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@get
                            }
                            
                            logger.info { "Fraud stats request from user $userId" }
                            
                            val stats = fraudService.getFraudStats()
                            call.respond(HttpStatusCode.OK, stats)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for fraud stats" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting fraud stats" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FRAUD_STATS_FAILED",
                                message = e.message ?: "Failed to get fraud stats"
                            ))
                        }
                    }
                    
                    post("/rules") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@post
                            }
                            
                            val request = call.receive<UpdateFraudRulesRequest>()
                            logger.info { "Fraud rules update request from admin $userId" }
                            
                            val success = fraudService.updateFraudRules(request.rules)
                            
                            if (success) {
                                call.respond(HttpStatusCode.OK, mapOf("message" to "Fraud rules updated successfully"))
                            } else {
                                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                                    error = "FRAUD_RULES_UPDATE_FAILED",
                                    message = "Failed to update fraud rules"
                                ))
                            }
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for fraud rules update" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error updating fraud rules" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FRAUD_RULES_UPDATE_FAILED",
                                message = e.message ?: "Failed to update fraud rules"
                            ))
                        }
                    }
                    
                    get("/health") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@get
                            }
                            
                            logger.info { "Fraud service health check from admin $userId" }
                            
                            // Simple health check - try to get stats
                            val stats = fraudService.getFraudStats()
                            
                            call.respond(HttpStatusCode.OK, mapOf(
                                "status" to "HEALTHY",
                                "lastCheck" to java.time.Instant.now().toString(),
                                "totalEvents" to stats.totalEvents
                            ))
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for fraud health check" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error checking fraud service health" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FRAUD_HEALTH_CHECK_FAILED",
                                message = e.message ?: "Failed to check fraud service health"
                            ))
                        }
                    }
                }
            }
        }
    }
    
    private fun createFraudService(): FraudService {
        val fraudDetectorClient = FraudDetectorClient.create()
        val ssmClient = SsmClient.create()
        
        val detectorId = getParameter(ssmClient, "/trading-platform/fraud-detector-id")
        
        return FraudServiceImpl(fraudDetectorClient, detectorId)
    }
    
    private fun getParameter(ssmClient: SsmClient, parameterName: String): String {
        return try {
            val request = GetParameterRequest.builder()
                .name(parameterName)
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            logger.warn(e) { "Failed to get parameter $parameterName, using default" }
            "pre-trade-detector"
        }
    }
}

data class UpdateFraudRulesRequest(
    val rules: List<FraudRule>
)

data class FraudRule(
    val ruleId: String,
    val ruleName: String,
    val description: String,
    val expression: String,
    val outcome: String,
    val isActive: Boolean
)
