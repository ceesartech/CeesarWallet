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
fun UserSettingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "User Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Profile information
            var firstName by remember { mutableStateOf("John") }
            var lastName by remember { mutableStateOf("Doe") }
            var email by remember { mutableStateOf("john.doe@example.com") }
            var phone by remember { mutableStateOf("+1 (555) 123-4567") }
            
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First Name") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last Name") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Button(
                onClick = { /* TODO: Save user settings */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Changes")
            }
        }
    }
}

@Composable
fun TradingSettingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Trading Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Default order settings
            var defaultOrderType by remember { mutableStateOf("Market") }
            var defaultQuantity by remember { mutableStateOf("100") }
            var enableAutoTrading by remember { mutableStateOf(false) }
            var enableStopLoss by remember { mutableStateOf(true) }
            var stopLossPercent by remember { mutableStateOf("5") }
            
            ExposedDropdownMenuBox(
                expanded = false,
                onExpandedChange = { }
            ) {
                OutlinedTextField(
                    value = defaultOrderType,
                    onValueChange = { defaultOrderType = it },
                    label = { Text("Default Order Type") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) }
                )
            }
            
            OutlinedTextField(
                value = defaultQuantity,
                onValueChange = { defaultQuantity = it },
                label = { Text("Default Quantity") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Enable Auto Trading")
                Switch(
                    checked = enableAutoTrading,
                    onCheckedChange = { enableAutoTrading = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Enable Stop Loss")
                Switch(
                    checked = enableStopLoss,
                    onCheckedChange = { enableStopLoss = it }
                )
            }
            
            if (enableStopLoss) {
                OutlinedTextField(
                    value = stopLossPercent,
                    onValueChange = { stopLossPercent = it },
                    label = { Text("Stop Loss Percentage") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            Button(
                onClick = { /* TODO: Save trading settings */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Settings")
            }
        }
    }
}

@Composable
fun RiskSettingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Risk Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Risk management settings
            var maxPositionSize by remember { mutableStateOf("10000") }
            var maxDailyLoss by remember { mutableStateOf("1000") }
            var maxDrawdown by remember { mutableStateOf("20") }
            var enableRiskLimits by remember { mutableStateOf(true) }
            
            OutlinedTextField(
                value = maxPositionSize,
                onValueChange = { maxPositionSize = it },
                label = { Text("Max Position Size ($)") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = maxDailyLoss,
                onValueChange = { maxDailyLoss = it },
                label = { Text("Max Daily Loss ($)") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = maxDrawdown,
                onValueChange = { maxDrawdown = it },
                label = { Text("Max Drawdown (%)") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Enable Risk Limits")
                Switch(
                    checked = enableRiskLimits,
                    onCheckedChange = { enableRiskLimits = it }
                )
            }
            
            Button(
                onClick = { /* TODO: Save risk settings */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Settings")
            }
        }
    }
}

@Composable
fun NotificationSettingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Notification Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Notification preferences
            var emailNotifications by remember { mutableStateOf(true) }
            var smsNotifications by remember { mutableStateOf(false) }
            var pushNotifications by remember { mutableStateOf(true) }
            var tradeAlerts by remember { mutableStateOf(true) }
            var priceAlerts by remember { mutableStateOf(false) }
            var riskAlerts by remember { mutableStateOf(true) }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Email Notifications")
                Switch(
                    checked = emailNotifications,
                    onCheckedChange = { emailNotifications = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("SMS Notifications")
                Switch(
                    checked = smsNotifications,
                    onCheckedChange = { smsNotifications = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Push Notifications")
                Switch(
                    checked = pushNotifications,
                    onCheckedChange = { pushNotifications = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Trade Alerts")
                Switch(
                    checked = tradeAlerts,
                    onCheckedChange = { tradeAlerts = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Price Alerts")
                Switch(
                    checked = priceAlerts,
                    onCheckedChange = { priceAlerts = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Risk Alerts")
                Switch(
                    checked = riskAlerts,
                    onCheckedChange = { riskAlerts = it }
                )
            }
            
            Button(
                onClick = { /* TODO: Save notification settings */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Settings")
            }
        }
    }
}

@Composable
fun SecuritySettingsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Security Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            // Security preferences
            var twoFactorAuth by remember { mutableStateOf(true) }
            var biometricAuth by remember { mutableStateOf(false) }
            var sessionTimeout by remember { mutableStateOf("30") }
            var enableAuditLog by remember { mutableStateOf(true) }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Two-Factor Authentication")
                Switch(
                    checked = twoFactorAuth,
                    onCheckedChange = { twoFactorAuth = it }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Biometric Authentication")
                Switch(
                    checked = biometricAuth,
                    onCheckedChange = { biometricAuth = it }
                )
            )
            
            ExposedDropdownMenuBox(
                expanded = false,
                onExpandedChange = { }
            ) {
                OutlinedTextField(
                    value = sessionTimeout,
                    onValueChange = { sessionTimeout = it },
                    label = { Text("Session Timeout (minutes)") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Enable Audit Log")
                Switch(
                    checked = enableAuditLog,
                    onCheckedChange = { enableAuditLog = it }
                )
            }
            
            Button(
                onClick = { /* TODO: Save security settings */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Settings")
            }
        }
    }
}
