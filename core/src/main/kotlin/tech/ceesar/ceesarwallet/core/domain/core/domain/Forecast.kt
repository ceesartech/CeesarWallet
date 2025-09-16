package tech.ceesar.ceesarwallet.core.domain.core.domain

import java.math.BigDecimal
import java.time.Instant

data class Forecast(
    val instrument: Instrument,
    val forecast: BigDecimal,
    val ciLow: BigDecimal,
    val ciHigh: BigDecimal,
    val confidence: Double,
    val modelName: String,
    val horizon: Int, // minutes
    val timestamp: Instant,
    val features: Map<String, Double> = emptyMap(),
    val metadata: Map<String, String> = emptyMap()
) {
    fun isConfident(threshold: Double = 0.7): Boolean = confidence >= threshold
    
    fun getPredictionInterval(): BigDecimal = ciHigh - ciLow
    
    fun isWithinInterval(actualPrice: BigDecimal): Boolean {
        return actualPrice >= ciLow && actualPrice <= ciHigh
    }
}

data class ForecastEnsemble(
    val instrument: Instrument,
    val forecasts: List<Forecast>,
    val ensembleForecast: BigDecimal,
    val ensembleConfidence: Double,
    val timestamp: Instant
) {
    fun getBestForecast(): Forecast? = forecasts.maxByOrNull { it.confidence }
    
    fun getConsensus(): Forecast? {
        val avgForecast = forecasts.map { it.forecast }.average()
        return forecasts.minByOrNull { kotlin.math.abs(it.forecast.toDouble() - avgForecast) }
    }
}
