package tech.ceesar.ceesarwallet.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import mu.KotlinLogging
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.frauddetector.FraudDetectorClient
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import tech.ceesar.ceesarwallet.backend.models.AdminStats
import tech.ceesar.ceesarwallet.backend.models.UserManagementRequest
import tech.ceesar.ceesarwallet.backend.services.AdminService
import tech.ceesar.ceesarwallet.backend.services.AdminServiceImpl
import tech.ceesar.ceesarwallet.backend.services.FraudService
import tech.ceesar.ceesarwallet.backend.services.FraudServiceImpl

private val logger = KotlinLogging.logger {}

object AdminRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/admin") {
                authenticate("jwt") {
                    val adminService = createAdminService()
                    val fraudService = createFraudService()
                    
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
                            
                            logger.info { "Admin stats request from user $userId" }
                            
                            val stats = adminService.getSystemStats()
                            call.respond(HttpStatusCode.OK, stats)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for admin stats" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting admin stats" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "ADMIN_STATS_FAILED",
                                message = e.message ?: "Failed to get admin stats"
                            ))
                        }
                    }
                    
                    get("/users/{userId}/stats") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val adminUserId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@get
                            }
                            
                            val userId = call.parameters["userId"] 
                                ?: throw IllegalArgumentException("User ID is required")
                            
                            logger.info { "User stats request for $userId from admin $adminUserId" }
                            
                            val stats = adminService.getUserStats(userId)
                            call.respond(HttpStatusCode.OK, stats)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for user stats" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting user stats" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "USER_STATS_FAILED",
                                message = e.message ?: "Failed to get user stats"
                            ))
                        }
                    }
                    
                    post("/users/manage") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val adminUserId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@post
                            }
                            
                            val request = call.receive<UserManagementRequest>()
                            logger.info { "User management request from admin $adminUserId: ${request.action} for ${request.userId}" }
                            
                            val success = adminService.manageUser(request)
                            
                            if (success) {
                                call.respond(HttpStatusCode.OK, mapOf("message" to "User management completed successfully"))
                            } else {
                                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                                    error = "USER_MANAGEMENT_FAILED",
                                    message = "Failed to manage user"
                                ))
                            }
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for user management" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error managing user" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "USER_MANAGEMENT_FAILED",
                                message = e.message ?: "Failed to manage user"
                            ))
                        }
                    }
                    
                    get("/fraud/alerts") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val adminUserId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@get
                            }
                            
                            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100
                            
                            logger.info { "Fraud alerts request from admin $adminUserId" }
                            
                            val alerts = adminService.getFraudAlerts(limit)
                            call.respond(HttpStatusCode.OK, alerts)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for fraud alerts" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting fraud alerts" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FRAUD_ALERTS_FAILED",
                                message = e.message ?: "Failed to get fraud alerts"
                            ))
                        }
                    }
                    
                    get("/health") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val adminUserId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val roles = principal.payload.getClaim("cognito:groups")?.asList(String::class.java) ?: emptyList()
                            if (!roles.contains("admin")) {
                                call.respond(HttpStatusCode.Forbidden, ErrorResponse(
                                    error = "INSUFFICIENT_PERMISSIONS",
                                    message = "Admin access required"
                                ))
                                return@get
                            }
                            
                            logger.info { "System health check from admin $adminUserId" }
                            
                            val health = adminService.getSystemHealth()
                            call.respond(HttpStatusCode.OK, health)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for system health" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting system health" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "SYSTEM_HEALTH_FAILED",
                                message = e.message ?: "Failed to get system health"
                            ))
                        }
                    }
                }
            }
        }
    }
    
    private fun createAdminService(): AdminService {
        val dynamoDbClient = DynamoDbClient.create()
        val ssmClient = SsmClient.create()
        
        val usersTableName = getParameter(ssmClient, "/trading-platform/users-table-name")
        val tradesTableName = getParameter(ssmClient, "/trading-platform/trades-table-name")
        
        val fraudService = createFraudService()
        
        return AdminServiceImpl(dynamoDbClient, usersTableName, tradesTableName, fraudService)
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
            when (parameterName) {
                "/trading-platform/users-table-name" -> "users"
                "/trading-platform/trades-table-name" -> "trades"
                "/trading-platform/fraud-detector-id" -> "pre-trade-detector"
                else -> "default-value"
            }
        }
    }
}
