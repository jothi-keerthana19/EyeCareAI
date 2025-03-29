package com.eyecareai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entity for storing user preferences and settings
 */
@Entity(tableName = "user_settings")
data class UserSettings(
    @PrimaryKey
    val id: Int = 1, // Only one settings record will exist
    
    /**
     * Enable/disable drowsiness detection alerts
     */
    val drowsinessDetectionEnabled: Boolean = true,
    
    /**
     * Enable/disable blink rate reminders
     */
    val blinkReminderEnabled: Boolean = true,
    
    /**
     * Enable/disable break reminders
     */
    val breakReminderEnabled: Boolean = true,
    
    /**
     * Interval between break reminders in minutes
     */
    val breakIntervalMinutes: Int = 20,
    
    /**
     * Enable/disable gaze-based controls for accessibility
     */
    val gazeControlEnabled: Boolean = false,
    
    /**
     * Enable/disable blink-based controls for accessibility
     */
    val blinkControlEnabled: Boolean = false,
    
    /**
     * Sensitivity level for eye detection (1-10)
     */
    val eyeDetectionSensitivity: Int = 5,
    
    /**
     * Threshold for drowsiness detection (0-100)
     */
    val drowsinessThreshold: Int = 60,
    
    /**
     * Minimum healthy blink rate (blinks per minute)
     */
    val minHealthyBlinkRate: Int = 15,
    
    /**
     * Dark mode preference
     */
    val darkModeEnabled: Boolean = false,
    
    /**
     * Enable/disable data collection for reports
     */
    val dataCollectionEnabled: Boolean = true
)
