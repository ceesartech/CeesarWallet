package tech.ceesar.ceesarwallet.core.domain.core.domain

import java.time.Instant

data class Forecast(
    val forecast: Double,
    val ciLow: Double,
    val ciHigh: Double,
    val timestamp: Instant
)
