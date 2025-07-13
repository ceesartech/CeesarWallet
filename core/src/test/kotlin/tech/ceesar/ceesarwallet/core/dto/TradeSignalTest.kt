package tech.ceesar.ceesarwallet.core.dto

import tech.ceesar.ceesarwallet.core.domain.core.domain.AssetClass
import tech.ceesar.ceesarwallet.core.domain.core.domain.Instrument
import tech.ceesar.ceesarwallet.core.domain.core.dto.Side
import tech.ceesar.ceesarwallet.core.domain.core.dto.TradeSignal
import kotlin.test.Test
import kotlin.test.assertEquals

class TradeSignalTest {
    @Test
    fun `trade signal should encapsulate instrument, side, and quantity`() {
        val instrument = Instrument("EURUSD", AssetClass.FX)
        val tradeSignal = TradeSignal(instrument, Side.BUY, 50.0)
        assertEquals(instrument, tradeSignal.instrument)
        assertEquals(Side.BUY, tradeSignal.side)
        assertEquals(50.0, tradeSignal.quantity)
    }
}