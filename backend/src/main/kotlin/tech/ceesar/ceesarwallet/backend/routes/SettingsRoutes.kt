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
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import tech.ceesar.ceesarwallet.backend.models.UpdateSettingsRequest
import tech.ceesar.ceesarwallet.backend.models.UserSettings
import tech.ceesar.ceesarwallet.backend.services.SettingsService
import tech.ceesar.ceesarwallet.backend.services.SettingsServiceImpl

private val logger = KotlinLogging.logger {}

object SettingsRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/settings") {
                authenticate("jwt") {
                    val settingsService = createSettingsService()
                    
                    get {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            logger.debug { "Getting settings for user $userId" }
                            
                            val settings = settingsService.getUserSettings(userId)
                            call.respond(HttpStatusCode.OK, settings)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for get settings" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting settings" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "GET_SETTINGS_FAILED",
                                message = e.message ?: "Failed to get settings"
                            ))
                        }
                    }
                    
                    put {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<UpdateSettingsRequest>()
                            logger.info { "Updating settings for user $userId" }
                            
                            val settings = settingsService.updateUserSettings(userId, request)
                            call.respond(HttpStatusCode.OK, settings)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for update settings" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: IllegalArgumentException) {
                            logger.warn(e) { "Invalid settings update request" }
                            call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                                error = "INVALID_SETTINGS",
                                message = e.message ?: "Invalid settings"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error updating settings" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "UPDATE_SETTINGS_FAILED",
                                message = e.message ?: "Failed to update settings"
                            ))
                        }
                    }
                    
                    delete {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            logger.info { "Resetting settings for user $userId" }
                            
                            val settings = settingsService.resetUserSettings(userId)
                            call.respond(HttpStatusCode.OK, settings)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for reset settings" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error resetting settings" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "RESET_SETTINGS_FAILED",
                                message = e.message ?: "Failed to reset settings"
                            ))
                        }
                    }
                    
                    post("/validate") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<UpdateSettingsRequest>()
                            logger.debug { "Validating settings for user $userId" }
                            
                            // Create temporary settings object for validation
                            val currentSettings = settingsService.getUserSettings(userId)
                            val tempSettings = currentSettings.copy(
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
                            
                            val validationErrors = settingsService.validateSettings(tempSettings)
                            
                            call.respond(HttpStatusCode.OK, mapOf(
                                "valid" to validationErrors.isEmpty(),
                                "errors" to validationErrors
                            ))
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for validate settings" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error validating settings" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "VALIDATE_SETTINGS_FAILED",
                                message = e.message ?: "Failed to validate settings"
                            ))
                        }
                    }
                }
            }
        }
    }
    
    private fun createSettingsService(): SettingsService {
        val dynamoDbClient = DynamoDbClient.create()
        val ssmClient = SsmClient.create()
        
        val tableName = getParameter(ssmClient, "/trading-platform/settings-table-name")
        
        return SettingsServiceImpl(dynamoDbClient, tableName)
    }
    
    private fun getParameter(ssmClient: SsmClient, parameterName: String): String {
        return try {
            val request = GetParameterRequest.builder()
                .name(parameterName)
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            logger.warn(e) { "Failed to get parameter $parameterName, using default" }
            "user-settings"
        }
    }
}
