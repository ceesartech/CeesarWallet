package tech.ceesar.ceesarwallet.core.domain.core.domain

enum class AssetClass(val displayName: String, val tradingHours: String) {
    EQUITY("Equity", "09:30-16:00 EST"),
    FX("Foreign Exchange", "24/7"),
    CRYPTO("Cryptocurrency", "24/7"),
    COMMODITY("Commodity", "09:00-17:00 EST"),
    BOND("Bond", "08:00-17:00 EST"),
    OTHER("Other", "Market Hours")
}