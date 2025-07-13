package tech.ceesar.ceesarwallet.core.dto

import tech.ceesar.ceesarwallet.core.domain.core.dto.Side
import kotlin.test.Test
import kotlin.test.assertEquals

class SideTest {
    @Test
    fun `enum Side values should be correct`() {
        assertEquals(listOf(Side.BUY, Side.SELL, Side.HOLD), Side.values().toList())
    }
}