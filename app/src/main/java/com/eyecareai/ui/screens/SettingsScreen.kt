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
import com.eyecareai.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = viewModel()
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
            text = stringResource(R.string.settings_title),
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Alerts Section
        SettingsSectionHeader(title = stringResource(R.string.settings_alerts))
        
        SettingsSwitch(
            title = stringResource(R.string.settings_drowsiness_detection),
            isChecked = uiState.drowsinessDetectionEnabled,
            onCheckedChange = { viewModel.updateDrowsinessDetection(it) }
        )
        
        SettingsSwitch(
            title = stringResource(R.string.settings_blink_reminder),
            isChecked = uiState.blinkReminderEnabled,
            onCheckedChange = { viewModel.updateBlinkReminder(it) }
        )
        
        SettingsSwitch(
            title = stringResource(R.string.settings_break_reminder),
            isChecked = uiState.breakReminderEnabled,
            onCheckedChange = { viewModel.updateBreakReminder(it) }
        )
        
        // Break Interval Slider
        if (uiState.breakReminderEnabled) {
            BreakIntervalSlider(
                value = uiState.breakIntervalMinutes.toFloat(),
                onValueChange = { viewModel.updateBreakInterval(it.toInt()) }
            )
        }
        
        Divider(modifier = Modifier.padding(vertical = 16.dp))
        
        // Accessibility Section
        SettingsSectionHeader(title = stringResource(R.string.settings_accessibility))
        
        SettingsSwitch(
            title = stringResource(R.string.settings_gaze_control),
            isChecked = uiState.gazeControlEnabled,
            onCheckedChange = { viewModel.updateGazeControl(it) }
        )
        
        SettingsSwitch(
            title = stringResource(R.string.settings_blink_control),
            isChecked = uiState.blinkControlEnabled,
            onCheckedChange = { viewModel.updateBlinkControl(it) }
        )
        
        Divider(modifier = Modifier.padding(vertical = 16.dp))
        
        // About Section
        SettingsSectionHeader(title = stringResource(R.string.settings_about))
        
        Text(
            text = stringResource(R.string.settings_version),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(start = 16.dp, bottom = 16.dp)
        )
        
        // Reset Settings button
        Button(
            onClick = { viewModel.resetSettings() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondary
            )
        ) {
            Text("Reset to Default Settings")
        }
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(vertical = 8.dp)
    )
}

@Composable
private fun SettingsSwitch(
    title: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun BreakIntervalSlider(
    value: Float,
    onValueChange: (Float) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Text(
            text = stringResource(R.string.settings_break_interval),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Slider(
                value = value,
                onValueChange = onValueChange,
                valueRange = 10f..60f,
                steps = 5,
                modifier = Modifier.weight(1f)
            )
            
            Text(
                text = "${value.toInt()} min",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}
