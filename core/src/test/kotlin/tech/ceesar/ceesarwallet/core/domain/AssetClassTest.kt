package tech.ceesar.ceesarwallet.core.domain

import tech.ceesar.ceesarwallet.core.domain.core.domain.AssetClass
import kotlin.test.Test
import kotlin.test.assertEquals

class AssetClassTest {
    @Test
    fun `enum values should be correct`() {
        assertEquals(listOf(AssetClass.EQUITY, AssetClass.FX, AssetClass.CRYPTO, AssetClass.OTHER),
                     AssetClass.values().toList())
    }
}