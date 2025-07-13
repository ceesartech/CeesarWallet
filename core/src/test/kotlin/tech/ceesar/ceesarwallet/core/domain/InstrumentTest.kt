package tech.ceesar.ceesarwallet.core.domain

import tech.ceesar.ceesarwallet.core.domain.core.domain.AssetClass
import tech.ceesar.ceesarwallet.core.domain.core.domain.Instrument
import kotlin.test.Test
import kotlin.test.assertEquals

class InstrumentTest {
    @Test
    fun `instriment properties should match constructor arguments`() {
        val instrument = Instrument("AAPL", AssetClass.EQUITY)
        assertEquals("AAPL", instrument.symbol)
        assertEquals(AssetClass.EQUITY, instrument.assetClass)
    }
}