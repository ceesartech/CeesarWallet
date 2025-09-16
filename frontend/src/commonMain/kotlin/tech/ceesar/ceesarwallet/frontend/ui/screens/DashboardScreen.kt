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

@Composable
fun DashboardScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Trading Dashboard",
                style = MaterialTheme.typography.headlineMedium
            )
        }
        
        item {
            PortfolioSummaryCard()
        }
        
        item {
            MarketOverviewCard()
        }
        
        item {
            RecentTradesCard()
        }
        
        item {
            PerformanceMetricsCard()
        }
    }
}
