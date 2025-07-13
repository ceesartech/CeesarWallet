package tech.ceesar.ceesarwallet.core.domain

import tech.ceesar.ceesarwallet.core.domain.core.domain.Forecast
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals

class ForecastTest {
    @Test
    fun `forecast properties should hold correct values`() {
        val now = Instant.parse("2025-05-09T12:00:00Z")
        val forecast = Forecast(100.0, 95.0, 105.0, now)
        assertEquals(100.0, forecast.forecast)
        assertEquals(95.0, forecast.ciLow)
        assertEquals(105.0, forecast.ciHigh)
        assertEquals(now, forecast.timestamp)
    }
}