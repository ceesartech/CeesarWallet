package tech.ceesar.ceesarwallet.frontend

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import tech.ceesar.ceesarwallet.frontend.ui.screens.MainScreen
import tech.ceesar.ceesarwallet.frontend.ui.theme.CeesarWalletTheme

fun main() = application {
    val windowState = rememberWindowState()
    
    Window(
        onCloseRequest = ::exitApplication,
        title = "CeesarWallet - Algorithmic Trading Platform",
        state = windowState
    ) {
        CeesarWalletTheme {
            MainScreen()
        }
    }
}
