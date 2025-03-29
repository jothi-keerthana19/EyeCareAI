package com.eyecareai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.eyecareai.R
import com.eyecareai.Screen
import com.eyecareai.ui.components.EyeHealthStatus
import com.eyecareai.ui.components.EyeStatusCard
import com.eyecareai.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // Header
        Text(
            text = stringResource(R.string.home_welcome),
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(vertical = 16.dp)
        )

        // Main Start Tracking button
        Button(
            onClick = { navController.navigate(Screen.LiveTracking.route) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                text = stringResource(R.string.home_start_tracking),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Eye Health Status
        Text(
            text = stringResource(R.string.home_status),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        // Blink Rate Card
        EyeStatusCard(
            title = stringResource(R.string.home_blink_rate),
            value = "${uiState.currentBlinkRate}",
            subtitle = stringResource(R.string.home_blink_rate_unit),
            status = when {
                uiState.currentBlinkRate < 10 -> EyeHealthStatus.ALERT
                uiState.currentBlinkRate < 15 -> EyeHealthStatus.WARNING
                else -> EyeHealthStatus.NORMAL
            }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Screen Time Card
        EyeStatusCard(
            title = stringResource(R.string.home_screen_time),
            value = uiState.screenTimeToday,
            status = when {
                uiState.screenTimeHours > 4 -> EyeHealthStatus.ALERT
                uiState.screenTimeHours > 2 -> EyeHealthStatus.WARNING
                else -> EyeHealthStatus.NORMAL
            }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Last Break Card
        EyeStatusCard(
            title = stringResource(R.string.home_last_break),
            value = uiState.lastBreakTime,
            status = when {
                uiState.minutesSinceLastBreak > 60 -> EyeHealthStatus.ALERT
                uiState.minutesSinceLastBreak > 30 -> EyeHealthStatus.WARNING
                else -> EyeHealthStatus.NORMAL
            }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Quick Tips
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Eye Health Tips",
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "• Remember the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "• Blink regularly to keep your eyes lubricated",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "• Maintain proper lighting in your work environment",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // View Reports button
        OutlinedButton(
            onClick = { navController.navigate(Screen.Reports.route) },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "View Detailed Reports",
                style = MaterialTheme.typography.titleSmall
            )
        }
    }
}
