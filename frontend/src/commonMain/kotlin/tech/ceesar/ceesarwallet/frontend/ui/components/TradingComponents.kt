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
fun OrderFormCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Place Order",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Symbol selection
            var selectedSymbol by remember { mutableStateOf("") }
            ExposedDropdownMenuBox(
                expanded = false,
                onExpandedChange = { }
            ) {
                OutlinedTextField(
                    value = selectedSymbol,
                    onValueChange = { selectedSymbol = it },
                    label = { Text("Symbol") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) }
                )
            }
            
            // Order type selection
            var selectedOrderType by remember { mutableStateOf("Market") }
            ExposedDropdownMenuBox(
                expanded = false,
                onExpandedChange = { }
            ) {
                OutlinedTextField(
                    value = selectedOrderType,
                    onValueChange = { selectedOrderType = it },
                    label = { Text("Order Type") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) }
                )
            }
            
            // Side selection
            var selectedSide by remember { mutableStateOf("Buy") }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    onClick = { selectedSide = "Buy" },
                    label = { Text("Buy") },
                    selected = selectedSide == "Buy",
                    modifier = Modifier.weight(1f)
                )
                FilterChip(
                    onClick = { selectedSide = "Sell" },
                    label = { Text("Sell") },
                    selected = selectedSide == "Sell",
                    modifier = Modifier.weight(1f)
                )
            }
            
            // Quantity input
            var quantity by remember { mutableStateOf("") }
            OutlinedTextField(
                value = quantity,
                onValueChange = { quantity = it },
                label = { Text("Quantity") },
                modifier = Modifier.fillMaxWidth()
            )
            
            // Price input (for limit orders)
            if (selectedOrderType == "Limit") {
                var price by remember { mutableStateOf("") }
                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Price") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Submit button
            Button(
                onClick = { /* TODO: Submit order */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Place Order")
            }
        }
    }
}

@Composable
fun ActiveOrdersCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Active Orders",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Sample active orders
            ActiveOrderEntry("AAPL", "BUY", "150.00", "10", "Limit", "Pending")
            ActiveOrderEntry("TSLA", "SELL", "245.50", "5", "Stop", "Pending")
        }
    }
}

@Composable
fun ActiveOrderEntry(
    symbol: String,
    side: String,
    price: String,
    quantity: String,
    orderType: String,
    status: String
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
                text = "$side $quantity @ $price",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Column(
            horizontalAlignment = Alignment.End
        ) {
            Text(
                text = orderType,
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = status,
                style = MaterialTheme.typography.bodySmall,
                color = if (status == "Pending") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun MarketDataCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Market Data",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Sample market data
            MarketDataRow("AAPL", "150.25", "+1.25", "+0.84%")
            MarketDataRow("TSLA", "245.80", "-2.30", "-0.93%")
            MarketDataRow("MSFT", "378.90", "+3.45", "+0.92%")
            MarketDataRow("GOOGL", "142.15", "+0.85", "+0.60%")
        }
    }
}

@Composable
fun MarketDataRow(
    symbol: String,
    price: String,
    change: String,
    changePercent: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = symbol,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold
        )
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = price,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = change,
                style = MaterialTheme.typography.bodyMedium,
                color = if (change.startsWith("+")) PrimaryGreen else ErrorRed,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = changePercent,
                style = MaterialTheme.typography.bodyMedium,
                color = if (changePercent.startsWith("+")) PrimaryGreen else ErrorRed,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun TradingHistoryCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Trading History",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Sample trading history
            TradingHistoryEntry("AAPL", "BUY", "150.25", "10", "09:30 AM", "Filled")
            TradingHistoryEntry("TSLA", "SELL", "245.80", "5", "10:15 AM", "Filled")
            TradingHistoryEntry("MSFT", "BUY", "378.90", "8", "11:45 AM", "Filled")
        }
    }
}

@Composable
fun TradingHistoryEntry(
    symbol: String,
    side: String,
    price: String,
    quantity: String,
    time: String,
    status: String
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
                text = time,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = side,
                style = MaterialTheme.typography.bodyMedium,
                color = if (side == "BUY") PrimaryGreen else ErrorRed,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "$price x $quantity",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = status,
                style = MaterialTheme.typography.bodySmall,
                color = if (status == "Filled") PrimaryGreen else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
