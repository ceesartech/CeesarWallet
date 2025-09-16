package tech.ceesar.ceesarwallet.backend.services

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import mu.KotlinLogging
import tech.ceesar.ceesarwallet.backend.config.HttpClients
import tech.ceesar.ceesarwallet.backend.models.InferenceRequest
import tech.ceesar.ceesarwallet.backend.models.InferenceResponse

private val logger = KotlinLogging.logger {}

@Serializable
data class ForecastRequest(
    val symbol: String,
    val horizon: Int = 1,
    val includeFeatures: Boolean = false
)

@Serializable
data class ForecastResponse(
    val symbol: String,
    val forecast: Double,
    val ciLow: Double,
    val ciHigh: Double,
    val confidence: Double,
    val modelName: String,
    val horizon: Int,
    val timestamp: String,
    val features: Map<String, Double> = emptyMap()
)

interface InferenceService {
    suspend fun getForecast(symbol: String, horizon: Int = 1): ForecastResponse
    suspend fun getBatchForecasts(symbols: List<String>, horizon: Int = 1): Map<String, ForecastResponse>
    suspend fun getModelStatus(): ModelStatus
}

data class ModelStatus(
    val isHealthy: Boolean,
    val models: List<ModelInfo>,
    val lastUpdate: String,
    val latency: Long
)

data class ModelInfo(
    val name: String,
    val version: String,
    val isActive: Boolean,
    val accuracy: Double?,
    val lastTrained: String?
)

class InferenceServiceImpl(
    private val httpClient: HttpClient = HttpClients.createInferenceClient()
) : InferenceService {
    
    override suspend fun getForecast(symbol: String, horizon: Int): ForecastResponse {
        try {
            logger.debug { "Requesting forecast for $symbol with horizon $horizon" }
            
            val request = ForecastRequest(
                symbol = symbol,
                horizon = horizon,
                includeFeatures = false
            )
            
            val response = httpClient.post("/forecast") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            
            if (response.status.isSuccess()) {
                val forecastResponse = response.body<ForecastResponse>()
                logger.debug { "Received forecast for $symbol: ${forecastResponse.forecast}" }
                return forecastResponse
            } else {
                logger.error { "Forecast request failed with status ${response.status}" }
                throw RuntimeException("Forecast request failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting forecast for $symbol" }
            throw RuntimeException("Failed to get forecast", e)
        }
    }
    
    override suspend fun getBatchForecasts(symbols: List<String>, horizon: Int): Map<String, ForecastResponse> {
        try {
            logger.debug { "Requesting batch forecasts for ${symbols.size} symbols" }
            
            val request = mapOf(
                "symbols" to symbols,
                "horizon" to horizon,
                "includeFeatures" to false
            )
            
            val response = httpClient.post("/forecast/batch") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            
            if (response.status.isSuccess()) {
                val forecasts = response.body<Map<String, ForecastResponse>>()
                logger.debug { "Received ${forecasts.size} batch forecasts" }
                return forecasts
            } else {
                logger.error { "Batch forecast request failed with status ${response.status}" }
                throw RuntimeException("Batch forecast request failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting batch forecasts" }
            throw RuntimeException("Failed to get batch forecasts", e)
        }
    }
    
    override suspend fun getModelStatus(): ModelStatus {
        try {
            logger.debug { "Requesting model status" }
            
            val response = httpClient.get("/status")
            
            if (response.status.isSuccess()) {
                val status = response.body<ModelStatus>()
                logger.debug { "Model status: healthy=${status.isHealthy}, latency=${status.latency}ms" }
                return status
            } else {
                logger.error { "Model status request failed with status ${response.status}" }
                throw RuntimeException("Model status request failed")
            }
            
        } catch (e: Exception) {
            logger.error(e) { "Error getting model status" }
            throw RuntimeException("Failed to get model status", e)
        }
    }
}
