package tech.ceesar.ceesarwallet.frontend.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*

enum class NavigationItem(
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    TRADING("Trading", Icons.Default.TrendingUp),
    PORTFOLIO("Portfolio", Icons.Default.AccountBalance),
    ANALYTICS("Analytics", Icons.Default.Analytics),
    SETTINGS("Settings", Icons.Default.Settings)
}

@Composable
fun NavigationState() {
    // Navigation state management
}
