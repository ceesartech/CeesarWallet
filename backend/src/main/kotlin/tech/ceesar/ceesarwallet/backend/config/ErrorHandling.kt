package tech.ceesar.ceesarwallet.backend.config

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: String,
    val requestId: String? = null
)

object ErrorHandling {
    
    fun configure(application: Application) {
        application.install(StatusPages) {
            exception<AuthenticationException> { call, cause ->
                logger.warn(cause) { "Authentication failed" }
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse(
                        error = "UNAUTHORIZED",
                        message = "Authentication required",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
            
            exception<AuthorizationException> { call, cause ->
                logger.warn(cause) { "Authorization failed" }
                call.respond(
                    HttpStatusCode.Forbidden,
                    ErrorResponse(
                        error = "FORBIDDEN",
                        message = "Insufficient permissions",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
            
            exception<ValidationException> { call, cause ->
                logger.info(cause) { "Validation failed" }
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(
                        error = "VALIDATION_ERROR",
                        message = cause.message ?: "Invalid request",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
            
            exception<FraudDetectionException> { call, cause ->
                logger.warn(cause) { "Fraud detection triggered" }
                call.respond(
                    HttpStatusCode.Forbidden,
                    ErrorResponse(
                        error = "FRAUD_DETECTED",
                        message = "Transaction blocked by fraud detection",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
            
            exception<BrokerException> { call, cause ->
                logger.error(cause) { "Broker error occurred" }
                call.respond(
                    HttpStatusCode.BadGateway,
                    ErrorResponse(
                        error = "BROKER_ERROR",
                        message = "Trading service temporarily unavailable",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
            
            exception<Throwable> { call, cause ->
                logger.error(cause) { "Unhandled exception" }
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse(
                        error = "INTERNAL_ERROR",
                        message = "An unexpected error occurred",
                        timestamp = java.time.Instant.now().toString(),
                        requestId = call.request.headers["X-Request-ID"]
                    )
                )
            }
        }
    }
}

class AuthenticationException(message: String) : Exception(message)
class AuthorizationException(message: String) : Exception(message)
class ValidationException(message: String) : Exception(message)
class FraudDetectionException(message: String) : Exception(message)
class BrokerException(message: String) : Exception(message)
