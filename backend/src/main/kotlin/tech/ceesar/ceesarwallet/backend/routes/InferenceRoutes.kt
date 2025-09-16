package tech.ceesar.ceesarwallet.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import mu.KotlinLogging
import tech.ceesar.ceesarwallet.backend.config.HttpClients
import tech.ceesar.ceesarwallet.backend.models.InferenceRequest
import tech.ceesar.ceesarwallet.backend.models.InferenceResponse
import tech.ceesar.ceesarwallet.backend.services.InferenceService
import tech.ceesar.ceesarwallet.backend.services.InferenceServiceImpl

private val logger = KotlinLogging.logger {}

object InferenceRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/inference") {
                authenticate("jwt") {
                    val inferenceService = InferenceServiceImpl(HttpClients.createInferenceClient())
                    
                    post("/forecast") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<InferenceRequest>()
                            logger.info { "Forecast request for user $userId: ${request.symbol}" }
                            
                            val response = inferenceService.getForecast(request.symbol, request.horizon)
                            call.respond(HttpStatusCode.OK, response)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for forecast request" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting forecast" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "FORECAST_FAILED",
                                message = e.message ?: "Failed to get forecast"
                            ))
                        }
                    }
                    
                    post("/forecast/batch") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<BatchForecastRequest>()
                            logger.info { "Batch forecast request for user $userId: ${request.symbols.size} symbols" }
                            
                            val response = inferenceService.getBatchForecasts(request.symbols, request.horizon)
                            call.respond(HttpStatusCode.OK, response)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for batch forecast request" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting batch forecasts" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "BATCH_FORECAST_FAILED",
                                message = e.message ?: "Failed to get batch forecasts"
                            ))
                        }
                    }
                    
                    get("/status") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            logger.debug { "Model status request for user $userId" }
                            
                            val status = inferenceService.getModelStatus()
                            call.respond(HttpStatusCode.OK, status)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for model status request" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting model status" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "STATUS_FAILED",
                                message = e.message ?: "Failed to get model status"
                            ))
                        }
                    }
                }
            }
        }
    }
}

data class BatchForecastRequest(
    val symbols: List<String>,
    val horizon: Int = 1
)
