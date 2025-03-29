package com.eyecareai.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.eyecareai.ui.theme.AlertRed
import com.eyecareai.ui.theme.HealthyGreen
import com.eyecareai.ui.theme.WarningYellow

@Composable
fun BlinkRateChart(
    blinkRates: List<Float>,
    times: List<String>,
    healthyRangeMin: Float = 15f,
    healthyRangeMax: Float = 20f,
    modifier: Modifier = Modifier
) {
    val maxBlinkRate = blinkRates.maxOrNull()?.plus(5f) ?: 25f
    val minBlinkRate = blinkRates.minOrNull()?.minus(5f)?.coerceAtLeast(0f) ?: 0f
    
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = "Blink Rate Over Time",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
        ) {
            Canvas(
                modifier = Modifier.fillMaxSize()
            ) {
                val width = size.width
                val height = size.height
                val xAxisY = height * 0.9f
                
                // Calculate scales
                val xScale = width / (blinkRates.size - 1).coerceAtLeast(1)
                val yScale = height * 0.8f / (maxBlinkRate - minBlinkRate).coerceAtLeast(1f)
                
                // Draw X and Y axis
                drawLine(
                    color = Color.Gray,
                    start = Offset(0f, xAxisY),
                    end = Offset(width, xAxisY),
                    strokeWidth = 2f
                )
                
                drawLine(
                    color = Color.Gray,
                    start = Offset(0f, 0f),
                    end = Offset(0f, xAxisY),
                    strokeWidth = 2f
                )
                
                // Draw healthy range
                val healthyMinY = xAxisY - (healthyRangeMin - minBlinkRate) * yScale
                val healthyMaxY = xAxisY - (healthyRangeMax - minBlinkRate) * yScale
                
                drawRect(
                    color = HealthyGreen.copy(alpha = 0.2f),
                    topLeft = Offset(0f, healthyMaxY),
                    size = androidx.compose.ui.geometry.Size(width, healthyMinY - healthyMaxY)
                )
                
                // Draw healthy range lines
                drawLine(
                    color = HealthyGreen,
                    start = Offset(0f, healthyMinY),
                    end = Offset(width, healthyMinY),
                    strokeWidth = 1f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                )
                
                drawLine(
                    color = HealthyGreen,
                    start = Offset(0f, healthyMaxY),
                    end = Offset(width, healthyMaxY),
                    strokeWidth = 1f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                )
                
                // Connect the points with lines
                if (blinkRates.size > 1) {
                    for (i in 0 until blinkRates.size - 1) {
                        val startX = i * xScale
                        val startY = xAxisY - (blinkRates[i] - minBlinkRate) * yScale
                        val endX = (i + 1) * xScale
                        val endY = xAxisY - (blinkRates[i + 1] - minBlinkRate) * yScale
                        
                        // Line color based on health status
                        val lineColor = when {
                            blinkRates[i] < healthyRangeMin * 0.7f || blinkRates[i] > healthyRangeMax * 1.3f -> 
                                AlertRed
                            blinkRates[i] < healthyRangeMin || blinkRates[i] > healthyRangeMax -> 
                                WarningYellow
                            else -> 
                                HealthyGreen
                        }
                        
                        drawLine(
                            color = lineColor,
                            start = Offset(startX, startY),
                            end = Offset(endX, endY),
                            strokeWidth = 3f
                        )
                    }
                }
                
                // Draw points
                blinkRates.forEachIndexed { index, rate ->
                    val x = index * xScale
                    val y = xAxisY - (rate - minBlinkRate) * yScale
                    
                    val pointColor = when {
                        rate < healthyRangeMin * 0.7f || rate > healthyRangeMax * 1.3f -> 
                            AlertRed
                        rate < healthyRangeMin || rate > healthyRangeMax -> 
                            WarningYellow
                        else -> 
                            HealthyGreen
                    }
                    
                    drawCircle(
                        color = pointColor,
                        radius = 6f,
                        center = Offset(x, y)
                    )
                    
                    drawCircle(
                        color = Color.White,
                        radius = 3f,
                        center = Offset(x, y)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Draw X-axis labels
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            times.forEach { time ->
                Text(
                    text = time,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Legend
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = HealthyGreen,
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )
            
            Text(
                text = "Healthy",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 4.dp, end = 12.dp)
            )
            
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = WarningYellow,
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )
            
            Text(
                text = "Warning",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 4.dp, end = 12.dp)
            )
            
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = AlertRed,
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )
            
            Text(
                text = "Alert",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
    }
}
