package tech.ceesar.ceesarwallet.core.domain.core.domain

import java.math.BigDecimal

data class Instrument(
    val symbol: String,
    val assetClass: AssetClass,
    val exchange: String,
    val baseCurrency: String,
    val quoteCurrency: String,
    val tickSize: BigDecimal,
    val minOrderSize: BigDecimal,
    val maxOrderSize: BigDecimal,
    val isActive: Boolean = true,
    val metadata: Map<String, String> = emptyMap()
) {
    fun isValidOrderSize(size: BigDecimal): Boolean {
        return size >= minOrderSize && size <= maxOrderSize
    }
    
    fun roundToTickSize(price: BigDecimal): BigDecimal {
        return price.divide(tickSize).setScale(0, java.math.RoundingMode.HALF_UP)
            .multiply(tickSize)
    }
}
