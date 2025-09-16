package tech.ceesar.ceesarwallet.frontend.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tech.ceesar.ceesarwallet.frontend.ui.components.*
import tech.ceesar.ceesarwallet.frontend.ui.navigation.NavigationItem
import tech.ceesar.ceesarwallet.frontend.ui.navigation.NavigationState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    var selectedTab by remember { mutableStateOf(NavigationItem.DASHBOARD) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CeesarWallet") },
                actions = {
                    IconButton(onClick = { /* TODO: Settings */ }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationItem.values().forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title) },
                        selected = selectedTab == item,
                        onClick = { selectedTab = item }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedTab) {
                NavigationItem.DASHBOARD -> DashboardScreen()
                NavigationItem.TRADING -> TradingScreen()
                NavigationItem.PORTFOLIO -> PortfolioScreen()
                NavigationItem.ANALYTICS -> AnalyticsScreen()
                NavigationItem.SETTINGS -> SettingsScreen()
            }
        }
    }
}
