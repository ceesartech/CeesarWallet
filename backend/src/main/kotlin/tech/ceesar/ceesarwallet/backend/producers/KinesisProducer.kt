package tech.ceesar.ceesarwallet.backend.producers

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import software.amazon.awssdk.services.kinesis.KinesisClient
import software.amazon.awssdk.services.kinesis.model.PutRecordRequest
import software.amazon.awssdk.core.SdkBytes
import mu.KotlinLogging
import java.time.Instant
import java.util.*

private val logger = KotlinLogging.logger {}

@Serializable
data class EventSchema(
    val type: String,
    val eventId: String,
    val userId: String,
    val ip: String? = null,
    val deviceId: String? = null,
    val geo: String? = null,
    val symbol: String? = null,
    val assetClass: String? = null,
    val qty: String? = null,
    val notional: String? = null,
    val ts: String
)

class KinesisProducer(
    private val kinesisClient: KinesisClient,
    private val streamName: String
) {
    
    private val json = Json { 
        prettyPrint = false
        ignoreUnknownKeys = true
    }
    
    suspend fun publishPreTradeEvent(
        userId: String,
        ip: String?,
        deviceId: String?,
        geo: String?,
        symbol: String,
        assetClass: String,
        qty: String,
        notional: String
    ) {
        val event = EventSchema(
            type = "PRE_TRADE",
            eventId = UUID.randomUUID().toString(),
            userId = userId,
            ip = ip,
            deviceId = deviceId,
            geo = geo,
            symbol = symbol,
            assetClass = assetClass,
            qty = qty,
            notional = notional,
            ts = Instant.now().toString()
        )
        
        publishEvent(event)
    }
    
    suspend fun publishPostTradeEvent(
        userId: String,
        ip: String?,
        deviceId: String?,
        geo: String?,
        symbol: String,
        assetClass: String,
        qty: String,
        notional: String,
        executionPrice: String,
        fees: String
    ) {
        val event = EventSchema(
            type = "POST_TRADE",
            eventId = UUID.randomUUID().toString(),
            userId = userId,
            ip = ip,
            deviceId = deviceId,
            geo = geo,
            symbol = symbol,
            assetClass = assetClass,
            qty = qty,
            notional = notional,
            ts = Instant.now().toString()
        )
        
        publishEvent(event)
    }
    
    suspend fun publishAuthEvent(
        userId: String,
        ip: String?,
        deviceId: String?,
        geo: String?,
        eventType: String // LOGIN, LOGOUT, FAILED_LOGIN
    ) {
        val event = EventSchema(
            type = "AUTH",
            eventId = UUID.randomUUID().toString(),
            userId = userId,
            ip = ip,
            deviceId = deviceId,
            geo = geo,
            ts = Instant.now().toString()
        )
        
        publishEvent(event)
    }
    
    suspend fun publishPaymentEvent(
        userId: String,
        ip: String?,
        deviceId: String?,
        geo: String?,
        amount: String,
        currency: String
    ) {
        val event = EventSchema(
            type = "PAYMENT",
            eventId = UUID.randomUUID().toString(),
            userId = userId,
            ip = ip,
            deviceId = deviceId,
            geo = geo,
            notional = amount,
            ts = Instant.now().toString()
        )
        
        publishEvent(event)
    }
    
    private suspend fun publishEvent(event: EventSchema) {
        try {
            val eventJson = json.encodeToString(event)
            val partitionKey = event.userId // Use userId as partition key for ordering
            
            val request = PutRecordRequest.builder()
                .streamName(streamName)
                .partitionKey(partitionKey)
                .data(SdkBytes.fromUtf8String(eventJson))
                .build()
            
            val response = kinesisClient.putRecord(request)
            logger.debug { "Published event ${event.eventId} to Kinesis with sequence number ${response.sequenceNumber()}" }
            
        } catch (e: Exception) {
            logger.error(e) { "Failed to publish event ${event.eventId} to Kinesis" }
            throw RuntimeException("Failed to publish fraud detection event", e)
        }
    }
}
