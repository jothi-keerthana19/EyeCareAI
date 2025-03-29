package com.eyecareai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Entity for storing comprehensive eye tracking metrics
 */
@Entity(tableName = "eye_metrics")
data class EyeMetrics(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    
    /**
     * Timestamp when the metrics were recorded
     */
    val timestamp: Date,
    
    /**
     * Current blink rate (blinks per minute)
     */
    val blinkRate: Float,
    
    /**
     * Percentage indicating drowsiness level (0-100)
     */
    val drowsinessLevel: Float,
    
    /**
     * Duration of the session in minutes
     */
    val sessionDuration: Float,
    
    /**
     * Flag indicating if drowsiness was detected during the session
     */
    val drowsinessDetected: Boolean,
    
    /**
     * Unique ID for the tracking session
     */
    val sessionId: String,
    
    /**
     * Number of breaks taken during the session
     */
    val breaksTaken: Int,
    
    /**
     * Additional notes or insights about the session
     */
    val notes: String = ""
)
