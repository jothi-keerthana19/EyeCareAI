package com.eyecareai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Entity representing blink data recorded during eye tracking sessions
 */
@Entity(tableName = "blink_data")
data class BlinkData(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    
    /**
     * Timestamp when the blink data was recorded
     */
    val timestamp: Date,
    
    /**
     * Number of blinks per minute
     */
    val blinkRate: Float,
    
    /**
     * Average duration of blinks in milliseconds
     */
    val blinkDuration: Float,
    
    /**
     * Session ID to group related blink data
     */
    val sessionId: String,
    
    /**
     * Flag indicating if the blink rate was low enough to trigger an alert
     */
    val isLowBlinkRate: Boolean
)
