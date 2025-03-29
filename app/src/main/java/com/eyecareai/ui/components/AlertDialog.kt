package com.eyecareai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.eyecareai.ui.theme.AlertRed
import com.eyecareai.ui.theme.WarningYellow

@Composable
fun EyeCareAlertDialog(
    title: String,
    message: String,
    severity: AlertSeverity = AlertSeverity.WARNING,
    onDismiss: () -> Unit,
    onAction: () -> Unit = {},
    actionText: String = "Take Action",
    dismissText: String = "Dismiss"
) {
    val backgroundColor = when (severity) {
        AlertSeverity.WARNING -> WarningYellow.copy(alpha = 0.1f)
        AlertSeverity.ALERT -> AlertRed.copy(alpha = 0.1f)
    }
    
    val iconColor = when (severity) {
        AlertSeverity.WARNING -> WarningYellow
        AlertSeverity.ALERT -> AlertRed
    }
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true
        )
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth()
            ) {
                // Header with icon
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Using a simple circle as the icon
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(
                                color = iconColor.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(20.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        // Simplified icon representation
                        Icon(
                            imageVector = if (severity == AlertSeverity.ALERT) {
                                androidx.compose.material.icons.Icons.Filled.Warning
                            } else {
                                androidx.compose.material.icons.Icons.Filled.Info
                            },
                            contentDescription = null,
                            tint = iconColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Message
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = backgroundColor,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(16.dp),
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = onDismiss
                    ) {
                        Text(dismissText)
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            onAction()
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = iconColor
                        )
                    ) {
                        Text(actionText)
                    }
                }
            }
        }
    }
}

enum class AlertSeverity {
    WARNING, ALERT
}
