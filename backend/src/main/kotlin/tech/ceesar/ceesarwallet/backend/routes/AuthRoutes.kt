package tech.ceesar.ceesarwallet.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import mu.KotlinLogging
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import tech.ceesar.ceesarwallet.backend.auth.AuthService
import tech.ceesar.ceesarwallet.backend.auth.CognitoAuthService
import tech.ceesar.ceesarwallet.backend.config.AuthenticationException
import tech.ceesar.ceesarwallet.backend.models.*
import tech.ceesar.ceesarwallet.backend.producers.KinesisProducer
import tech.ceesar.ceesarwallet.backend.services.FraudService

private val logger = KotlinLogging.logger {}

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

object AuthRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/auth") {
                val authService = createAuthService()
                val kinesisProducer = createKinesisProducer()
                
                post("/login") {
                    try {
                        val request = call.receive<LoginRequest>()
                        logger.info { "Login attempt for user: ${request.username}" }
                        
                        val response = authService.login(request)
                        
                        // Publish auth event for fraud detection
                        kinesisProducer.publishAuthEvent(
                            userId = request.username,
                            ip = call.request.headers["X-Forwarded-For"] ?: call.request.origin.remoteHost,
                            deviceId = call.request.headers["X-Device-ID"],
                            geo = call.request.headers["X-Geo-Location"],
                            eventType = "LOGIN"
                        )
                        
                        call.respond(HttpStatusCode.OK, response)
                        
                    } catch (e: AuthenticationException) {
                        logger.warn(e) { "Authentication failed" }
                        call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                            error = "AUTHENTICATION_FAILED",
                            message = e.message ?: "Invalid credentials"
                        ))
                    } catch (e: Exception) {
                        logger.error(e) { "Login error" }
                        call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                            error = "INTERNAL_ERROR",
                            message = "Login failed"
                        ))
                    }
                }
                
                post("/register") {
                    try {
                        val request = call.receive<RegisterRequest>()
                        logger.info { "Registration attempt for user: ${request.username}" }
                        
                        val response = authService.register(request)
                        call.respond(HttpStatusCode.Created, response)
                        
                    } catch (e: Exception) {
                        logger.error(e) { "Registration error" }
                        call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                            error = "REGISTRATION_FAILED",
                            message = e.message ?: "Registration failed"
                        ))
                    }
                }
                
                post("/refresh") {
                    try {
                        val request = call.receive<RefreshTokenRequest>()
                        logger.debug { "Token refresh request" }
                        
                        val response = authService.refreshToken(request.refreshToken)
                        call.respond(HttpStatusCode.OK, response)
                        
                    } catch (e: Exception) {
                        logger.error(e) { "Token refresh error" }
                        call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                            error = "REFRESH_FAILED",
                            message = "Token refresh failed"
                        ))
                    }
                }
                
                post("/logout") {
                    try {
                        val authHeader = call.request.headers["Authorization"]
                        val token = authHeader?.removePrefix("Bearer ") ?: ""
                        
                        authService.logout(token)
                        logger.info { "User logged out" }
                        
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Logged out successfully"))
                        
                    } catch (e: Exception) {
                        logger.error(e) { "Logout error" }
                        call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                            error = "LOGOUT_FAILED",
                            message = "Logout failed"
                        ))
                    }
                }
                
                get("/verify") {
                    try {
                        val authHeader = call.request.headers["Authorization"]
                        val token = authHeader?.removePrefix("Bearer ") ?: ""
                        
                        val isValid = authService.verifyToken(token)
                        
                        if (isValid) {
                            call.respond(HttpStatusCode.OK, mapOf("valid" to true))
                        } else {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("valid" to false))
                        }
                        
                    } catch (e: Exception) {
                        logger.error(e) { "Token verification error" }
                        call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                            error = "VERIFICATION_FAILED",
                            message = "Token verification failed"
                        ))
                    }
                }
            }
        }
    }
    
    private fun createAuthService(): AuthService {
        val cognitoClient = CognitoIdentityProviderClient.create()
        val ssmClient = SsmClient.create()
        
        val userPoolId = getParameter(ssmClient, "/trading-platform/cognito-user-pool-id")
        val clientId = getParameter(ssmClient, "/trading-platform/cognito-client-id")
        
        return CognitoAuthService(cognitoClient, userPoolId, clientId)
    }
    
    private fun createKinesisProducer(): KinesisProducer {
        val ssmClient = SsmClient.create()
        val streamName = getParameter(ssmClient, "/trading-platform/kinesis-stream-name")
        
        return KinesisProducer(
            software.amazon.awssdk.services.kinesis.KinesisClient.create(),
            streamName
        )
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
                "/trading-platform/cognito-user-pool-id" -> "us-east-1_XXXXXXXXX"
                "/trading-platform/cognito-client-id" -> "xxxxxxxxxxxxxxxxxxxxxxxxxx"
                "/trading-platform/kinesis-stream-name" -> "events-raw"
                else -> "default-value"
            }
        }
    }
}

@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: String = java.time.Instant.now().toString()
)
