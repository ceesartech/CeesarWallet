package tech.ceesar.ceesarwallet.core.domain.core.dto

import tech.ceesar.ceesarwallet.core.domain.core.domain.Instrument

data class TradeSignal(
    val instrument: Instrument,
    val side: Side,
    val quantity: Double
)
