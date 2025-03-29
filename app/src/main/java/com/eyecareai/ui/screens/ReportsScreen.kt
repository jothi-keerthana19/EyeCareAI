package com.eyecareai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eyecareai.R
import com.eyecareai.ui.components.BlinkRateChart
import com.eyecareai.ui.components.EyeHealthStatus
import com.eyecareai.ui.components.EyeStatusCard
import com.eyecareai.viewmodel.ReportsViewModel

@Composable
fun ReportsScreen(
    viewModel: ReportsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    
    // Tab state
    var selectedTabIndex by remember { mutableStateOf(0) }
    val tabs = listOf("Daily", "Weekly", "Monthly")
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = stringResource(R.string.reports_title),
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Time period tabs
        TabRow(
            selectedTabIndex = selectedTabIndex
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { 
                        selectedTabIndex = index
                        when (index) {
                            0 -> viewModel.loadDailyData()
                            1 -> viewModel.loadWeeklyData()
                            2 -> viewModel.loadMonthlyData()
                        }
                    },
                    text = { Text(title) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Report content based on selected tab
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
        ) {
            // Chart
            BlinkRateChart(
                blinkRates = uiState.blinkRates,
                times = uiState.timeLabels,
                healthyRangeMin = 15f,
                healthyRangeMax = 20f
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Average Blink Rate
            EyeStatusCard(
                title = stringResource(R.string.reports_blink_rate),
                value = "${uiState.averageBlinkRate}",
                subtitle = stringResource(R.string.reports_healthy_range),
                status = when {
                    uiState.averageBlinkRate < 10 -> EyeHealthStatus.ALERT
                    uiState.averageBlinkRate < 15 -> EyeHealthStatus.WARNING
                    else -> EyeHealthStatus.NORMAL
                }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Screen Time
            EyeStatusCard(
                title = stringResource(R.string.reports_screen_time),
                value = uiState.totalScreenTime,
                status = when {
                    uiState.screenTimeHours > 8 -> EyeHealthStatus.ALERT
                    uiState.screenTimeHours > 5 -> EyeHealthStatus.WARNING
                    else -> EyeHealthStatus.NORMAL
                }
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Drowsy Episodes
            EyeStatusCard(
                title = stringResource(R.string.reports_drowsy_episodes),
                value = "${uiState.drowsyEpisodes}",
                status = when {
                    uiState.drowsyEpisodes > 5 -> EyeHealthStatus.ALERT
                    uiState.drowsyEpisodes > 2 -> EyeHealthStatus.WARNING
                    else -> EyeHealthStatus.NORMAL
                }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Health insights
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Eye Health Insights",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = uiState.healthInsights,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Export Data button
            Button(
                onClick = { viewModel.exportData() },
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text(text = stringResource(R.string.reports_export))
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
