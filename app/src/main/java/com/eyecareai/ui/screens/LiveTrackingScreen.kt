package com.eyecareai.ui.screens

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eyecareai.R
import com.eyecareai.ui.components.AlertSeverity
import com.eyecareai.ui.components.EyeCareAlertDialog
import com.eyecareai.ui.theme.AlertRed
import com.eyecareai.ui.theme.HealthyGreen
import com.eyecareai.ui.theme.WarningYellow
import com.eyecareai.util.PermissionManager
import com.eyecareai.viewmodel.LiveTrackingViewModel

@Composable
fun LiveTrackingScreen(
    permissionManager: PermissionManager,
    viewModel: LiveTrackingViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cameraPermissionGranted = permissionManager.hasCameraPermission()
    
    var showDrowsinessAlert by remember { mutableStateOf(false) }
    var showBlinkRateAlert by remember { mutableStateOf(false) }
    
    // Request camera permission if not granted
    LaunchedEffect(key1 = Unit) {
        if (!cameraPermissionGranted) {
            permissionManager.requestCameraPermission()
        } else {
            viewModel.startEyeTracking()
        }
    }
    
    // Handle drowsiness detection
    LaunchedEffect(key1 = uiState.isDrowsy) {
        if (uiState.isDrowsy) {
            showDrowsinessAlert = true
        }
    }
    
    // Handle low blink rate alert
    LaunchedEffect(key1 = uiState.blinkRate) {
        if (uiState.blinkRate < 10 && uiState.isTracking && !uiState.isDrowsy) {
            showBlinkRateAlert = true
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (!cameraPermissionGranted) {
            // Permission request UI
            PermissionRequestContent(
                onRequestPermission = {
                    permissionManager.requestCameraPermission()
                }
            )
        } else {
            // Main tracking UI
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Camera preview
                CameraPreviewWithOverlay(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .border(
                            width = 2.dp,
                            color = if (uiState.eyesDetected) 
                                HealthyGreen else Color.Gray,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    viewModel = viewModel,
                    uiState = uiState
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Eye tracking status
                StatusIndicator(
                    label = "Tracking Status",
                    value = if (uiState.isTracking) "Active" else "Paused",
                    color = if (uiState.isTracking) HealthyGreen else Color.Gray
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Eye detection status
                StatusIndicator(
                    label = "Eyes Detected",
                    value = if (uiState.eyesDetected) "Yes" else "No",
                    color = if (uiState.eyesDetected) HealthyGreen else WarningYellow
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Metrics
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    MetricCard(
                        title = "Blink Rate",
                        value = "${uiState.blinkRate}",
                        unit = "blinks/min",
                        status = when {
                            uiState.blinkRate < 10 -> MetricStatus.ALERT
                            uiState.blinkRate < 15 -> MetricStatus.WARNING
                            else -> MetricStatus.NORMAL
                        },
                        modifier = Modifier.weight(1f)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    MetricCard(
                        title = "Drowsiness",
                        value = "${uiState.drowsinessLevel}",
                        unit = "%",
                        status = when {
                            uiState.drowsinessLevel > 70 -> MetricStatus.ALERT
                            uiState.drowsinessLevel > 40 -> MetricStatus.WARNING
                            else -> MetricStatus.NORMAL
                        },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Tips based on current status
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = when {
                            uiState.isDrowsy -> "You appear to be drowsy. Consider taking a break."
                            uiState.blinkRate < 10 -> "Your blink rate is low. Remember to blink more often."
                            !uiState.eyesDetected && uiState.isTracking -> "Position your face in front of the camera."
                            else -> "Keep your face visible to the camera for accurate tracking."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp),
                        textAlign = TextAlign.Center
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Start/Stop button
                Button(
                    onClick = {
                        if (uiState.isTracking) {
                            viewModel.stopEyeTracking()
                        } else {
                            viewModel.startEyeTracking()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (uiState.isTracking) AlertRed else HealthyGreen
                    )
                ) {
                    Text(
                        text = if (uiState.isTracking) "Stop Tracking" else "Start Tracking",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }
            
            // Drowsiness Alert Dialog
            if (showDrowsinessAlert) {
                EyeCareAlertDialog(
                    title = stringResource(R.string.alert_drowsy),
                    message = stringResource(R.string.alert_drowsy_desc),
                    severity = AlertSeverity.ALERT,
                    onDismiss = { showDrowsinessAlert = false },
                    onAction = { /* Take a break action */ },
                    actionText = "Take a Break",
                    dismissText = "I'm Awake"
                )
            }
            
            // Low Blink Rate Alert Dialog
            if (showBlinkRateAlert) {
                EyeCareAlertDialog(
                    title = stringResource(R.string.alert_blink),
                    message = stringResource(R.string.alert_blink_desc),
                    severity = AlertSeverity.WARNING,
                    onDismiss = { showBlinkRateAlert = false },
                    actionText = "Got It"
                )
            }
        }
    }
}

@Composable
private fun PermissionRequestContent(
    onRequestPermission: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stringResource(R.string.permission_camera_title),
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = stringResource(R.string.permission_camera_message),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = onRequestPermission
        ) {
            Text(text = stringResource(R.string.permission_grant))
        }
    }
}

@Composable
private fun CameraPreviewWithOverlay(
    modifier: Modifier = Modifier,
    viewModel: LiveTrackingViewModel,
    uiState: LiveTrackingViewModel.UiState
) {
    Box(
        modifier = modifier
    ) {
        // This would be replaced with the actual camera preview implementation
        AndroidView(
            factory = { context ->
                // In a real implementation, this would be the camera preview surface
                // using CameraX and OpenCV processing
                viewModel.createCameraPreviewView(context)
            },
            modifier = Modifier.fillMaxSize()
        )
        
        // Face detection overlay indicators
        if (uiState.eyesDetected) {
            // Left eye indicator
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .offset(x = uiState.leftEyeX.dp, y = uiState.leftEyeY.dp)
                    .background(HealthyGreen.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            )
            
            // Right eye indicator
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .offset(x = uiState.rightEyeX.dp, y = uiState.rightEyeY.dp)
                    .background(HealthyGreen.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            )
        }
        
        // Tracking status overlay
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(8.dp)
                .background(
                    color = if (uiState.isTracking) 
                        HealthyGreen.copy(alpha = 0.7f) 
                    else 
                        Color.Gray.copy(alpha = 0.7f),
                    shape = RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = if (uiState.isTracking) "Recording" else "Paused",
                color = Color.White,
                style = MaterialTheme.typography.labelMedium
            )
        }
    }
}

@Composable
private fun StatusIndicator(
    label: String,
    value: String,
    color: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.titleSmall,
            modifier = Modifier.weight(1f)
        )
        
        Box(
            modifier = Modifier
                .size(12.dp)
                .background(color, RoundedCornerShape(6.dp))
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

enum class MetricStatus {
    NORMAL, WARNING, ALERT
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    unit: String,
    status: MetricStatus,
    modifier: Modifier = Modifier
) {
    val color = when (status) {
        MetricStatus.NORMAL -> HealthyGreen
        MetricStatus.WARNING -> WarningYellow
        MetricStatus.ALERT -> AlertRed
    }
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = color
            )
            
            Text(
                text = unit,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
