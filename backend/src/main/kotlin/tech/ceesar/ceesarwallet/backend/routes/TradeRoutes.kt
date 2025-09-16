package tech.ceesar.ceesarwallet.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import mu.KotlinLogging
import software.amazon.awssdk.services.kinesis.KinesisClient
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest
import tech.ceesar.ceesarwallet.backend.config.HttpClients
import tech.ceesar.ceesarwallet.backend.models.*
import tech.ceesar.ceesarwallet.backend.producers.KinesisProducer
import tech.ceesar.ceesarwallet.backend.services.TradeService
import tech.ceesar.ceesarwallet.backend.services.TradeServiceImpl

private val logger = KotlinLogging.logger {}

object TradeRoutes {
    
    fun configure(application: Application) {
        application.routing {
            route("/api/trades") {
                authenticate("jwt") {
                    val tradeService = createTradeService()
                    
                    post("/orders") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val request = call.receive<CreateOrderRequest>()
                            logger.info { "Creating order for user $userId: ${request.symbol}" }
                            
                            val ip = call.request.headers["X-Forwarded-For"] ?: call.request.origin.remoteHost
                            val deviceId = call.request.headers["X-Device-ID"]
                            val geo = call.request.headers["X-Geo-Location"]
                            
                            val response = tradeService.createOrder(userId, request, ip, deviceId, geo)
                            call.respond(HttpStatusCode.Created, response)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for trade request" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error creating order" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "ORDER_CREATION_FAILED",
                                message = e.message ?: "Failed to create order"
                            ))
                        }
                    }
                    
                    put("/orders/{orderId}") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val orderId = call.parameters["orderId"] 
                                ?: throw IllegalArgumentException("Order ID is required")
                            
                            val request = call.receive<UpdateOrderRequest>()
                            logger.info { "Updating order $orderId for user $userId" }
                            
                            val response = tradeService.updateOrder(userId, request.copy(orderId = orderId))
                            call.respond(HttpStatusCode.OK, response)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for order update" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error updating order" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "ORDER_UPDATE_FAILED",
                                message = e.message ?: "Failed to update order"
                            ))
                        }
                    }
                    
                    delete("/orders/{orderId}") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val orderId = call.parameters["orderId"] 
                                ?: throw IllegalArgumentException("Order ID is required")
                            
                            logger.info { "Cancelling order $orderId for user $userId" }
                            
                            val success = tradeService.cancelOrder(userId, CancelOrderRequest(orderId))
                            
                            if (success) {
                                call.respond(HttpStatusCode.OK, mapOf("message" to "Order cancelled successfully"))
                            } else {
                                call.respond(HttpStatusCode.BadRequest, ErrorResponse(
                                    error = "ORDER_CANCELLATION_FAILED",
                                    message = "Failed to cancel order"
                                ))
                            }
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for order cancellation" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error cancelling order" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "ORDER_CANCELLATION_FAILED",
                                message = e.message ?: "Failed to cancel order"
                            ))
                        }
                    }
                    
                    get("/orders") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val symbol = call.request.queryParameters["symbol"]
                            val status = call.request.queryParameters["status"]
                            
                            logger.debug { "Getting orders for user $userId" }
                            
                            val orders = tradeService.getOrders(userId, symbol, status)
                            call.respond(HttpStatusCode.OK, orders)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for get orders" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting orders" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "GET_ORDERS_FAILED",
                                message = e.message ?: "Failed to get orders"
                            ))
                        }
                    }
                    
                    get("/positions") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            logger.debug { "Getting positions for user $userId" }
                            
                            val positions = tradeService.getPositions(userId)
                            call.respond(HttpStatusCode.OK, positions)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for get positions" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting positions" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "GET_POSITIONS_FAILED",
                                message = e.message ?: "Failed to get positions"
                            ))
                        }
                    }
                    
                    get("/history") {
                        try {
                            val principal = call.principal<JWTPrincipal>()
                            val userId = principal?.payload?.getClaim("username")?.asString() 
                                ?: throw AuthenticationException("User not authenticated")
                            
                            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100
                            
                            logger.debug { "Getting order history for user $userId" }
                            
                            val history = tradeService.getOrderHistory(userId, limit)
                            call.respond(HttpStatusCode.OK, history)
                            
                        } catch (e: AuthenticationException) {
                            logger.warn(e) { "Authentication failed for get history" }
                            call.respond(HttpStatusCode.Unauthorized, ErrorResponse(
                                error = "AUTHENTICATION_FAILED",
                                message = "User not authenticated"
                            ))
                        } catch (e: Exception) {
                            logger.error(e) { "Error getting order history" }
                            call.respond(HttpStatusCode.InternalServerError, ErrorResponse(
                                error = "GET_HISTORY_FAILED",
                                message = e.message ?: "Failed to get order history"
                            ))
                        }
                    }
                }
            }
        }
    }
    
    private fun createTradeService(): TradeService {
        val kinesisProducer = createKinesisProducer()
        return TradeServiceImpl(HttpClients.createEngineClient(), kinesisProducer)
    }
    
    private fun createKinesisProducer(): KinesisProducer {
        val ssmClient = SsmClient.create()
        val streamName = getParameter(ssmClient, "/trading-platform/kinesis-stream-name")
        
        return KinesisProducer(
            KinesisClient.create(),
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
            "events-raw"
        }
    }
}
