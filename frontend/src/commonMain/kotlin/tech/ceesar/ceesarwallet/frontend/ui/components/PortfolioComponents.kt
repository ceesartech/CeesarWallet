package tech.ceesar.ceesarwallet.frontend.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.ceesar.ceesarwallet.frontend.ui.theme.PrimaryGreen
import tech.ceesar.ceesarwallet.frontend.ui.theme.ErrorRed

@Composable
fun HoldingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Holdings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Sample holdings
            HoldingEntry("AAPL", "150.25", "10", "1,502.50", "+125.30", "+8.34%")
            HoldingEntry("TSLA", "245.80", "5", "1,229.00", "-45.20", "-3.55%")
            HoldingEntry("MSFT", "378.90", "8", "3,031.20", "+234.50", "+8.39%")
            HoldingEntry("GOOGL", "142.15", "15", "2,132.25", "+156.75", "+7.94%")
        }
    }
}

@Composable
fun HoldingEntry(
    symbol: String,
    currentPrice: String,
    quantity: String,
    value: String,
    pnl: String,
    pnlPercent: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = symbol,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "$quantity shares @ $currentPrice",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Column(
            horizontalAlignment = Alignment.End
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = pnl,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (pnl.startsWith("+")) PrimaryGreen else ErrorRed,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = pnlPercent,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (pnlPercent.startsWith("+")) PrimaryGreen else ErrorRed,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun PerformanceChartCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Performance Chart",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Placeholder for chart
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Chart Placeholder",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun RiskMetricsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Risk Metrics",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                RiskMetricItem("Sharpe Ratio", "1.85", PrimaryGreen)
                RiskMetricItem("Max Drawdown", "-8.45%", ErrorRed)
                RiskMetricItem("Beta", "1.12", MaterialTheme.colorScheme.onSurface)
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                RiskMetricItem("Volatility", "18.5%", MaterialTheme.colorScheme.onSurface)
                RiskMetricItem("VaR (95%)", "-2.3%", ErrorRed)
                RiskMetricItem("Sortino", "2.34", PrimaryGreen)
            }
        }
    }
}

@Composable
fun RiskMetricItem(
    name: String,
    value: String,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = color,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun TradingAnalyticsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Trading Analytics",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TradingMetricItem("Total Trades", "247", MaterialTheme.colorScheme.onSurface)
                TradingMetricItem("Win Rate", "68.5%", PrimaryGreen)
                TradingMetricItem("Avg Trade", "+$125.30", PrimaryGreen)
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TradingMetricItem("Best Trade", "+$2,450", PrimaryGreen)
                TradingMetricItem("Worst Trade", "-$890", ErrorRed)
                TradingMetricItem("Avg Hold", "3.2 days", MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}

@Composable
fun TradingMetricItem(
    name: String,
    value: String,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = color,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun MarketAnalyticsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Market Analytics",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Market sentiment indicators
            MarketSentimentRow("Fear & Greed Index", "45", "Neutral", MaterialTheme.colorScheme.onSurface)
            MarketSentimentRow("VIX", "18.5", "Low", PrimaryGreen)
            MarketSentimentRow("Put/Call Ratio", "0.85", "Bullish", PrimaryGreen)
        }
    }
}

@Composable
fun MarketSentimentRow(
    name: String,
    value: String,
    sentiment: String,
    color: androidx.compose.ui.graphics.Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodyLarge
        )
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = sentiment,
                style = MaterialTheme.typography.bodyMedium,
                color = color,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
