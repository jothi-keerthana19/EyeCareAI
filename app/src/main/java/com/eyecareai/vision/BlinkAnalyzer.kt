package com.eyecareai.vision

import android.content.Context
import android.util.Log
import java.util.*

/**
 * Analyzes eye blink patterns to determine blink rate and eye health metrics
 */
class BlinkAnalyzer(private val context: Context) {
    private val TAG = "BlinkAnalyzer"
    
    // Queue to store recent blink events with timestamps
    private val blinkEvents = LinkedList<Long>()
    
    // Constants for blink analysis
    private val BLINK_WINDOW_MS = 60000 // 1 minute window for calculating blink rate
    private val MIN_HEALTHY_BLINK_RATE = 15 // Minimum healthy blinks per minute
    private val MAX_HEALTHY_BLINK_RATE = 20 // Maximum healthy blinks per minute
    
    // Eye aspect ratio thresholds for blink detection
    private val EAR_THRESHOLD = 0.2 // Threshold for considering eyes closed
    private val BLINK_DURATION_THRESHOLD_MS = 400 // Max duration for a normal blink
    
    // Tracking state
    private var isEyeClosed = false
    private var lastBlinkStartTime = 0L
    private var currentBlinkDuration = 0L
    private var totalBlinkDuration = 0L
    private var blinkCount = 0
    
    /**
     * Records a blink event and updates the blink metrics
     */
    fun recordBlink() {
        val currentTime = System.currentTimeMillis()
        blinkEvents.add(currentTime)
        blinkCount++
        
        // Remove blink events older than the window
        while (blinkEvents.isNotEmpty() && 
               blinkEvents.first < currentTime - BLINK_WINDOW_MS) {
            blinkEvents.removeFirst()
        }
        
        Log.d(TAG, "Blink recorded. Current blink rate: ${getCurrentBlinkRate()}")
    }
    
    /**
     * Analyzes the eye aspect ratio to determine if a blink has occurred
     * 
     * @param eyeAspectRatio The current eye aspect ratio value
     * @param timestamp The timestamp of the current frame
     * @return True if a complete blink was detected
     */
    fun analyzeEyeAspectRatio(eyeAspectRatio: Float, timestamp: Long): Boolean {
        // If eyes are open and EAR goes below threshold, start tracking a blink
        if (!isEyeClosed && eyeAspectRatio < EAR_THRESHOLD) {
            isEyeClosed = true
            lastBlinkStartTime = timestamp
            return false
        }
        
        // If eyes are closed and now open, complete the blink
        if (isEyeClosed && eyeAspectRatio >= EAR_THRESHOLD) {
            isEyeClosed = false
            currentBlinkDuration = timestamp - lastBlinkStartTime
            
            // Only count as a blink if duration is within normal range
            if (currentBlinkDuration <= BLINK_DURATION_THRESHOLD_MS) {
                totalBlinkDuration += currentBlinkDuration
                recordBlink()
                return true
            }
        }
        
        return false
    }
    
    /**
     * Calculates the current blink rate (blinks per minute)
     * 
     * @return Float representing blinks per minute
     */
    fun getCurrentBlinkRate(): Float {
        val currentTime = System.currentTimeMillis()
        val windowStartTime = currentTime - BLINK_WINDOW_MS
        
        // Count blinks in the time window
        val blinksInWindow = blinkEvents.count { it >= windowStartTime }
        
        // Calculate actual window duration (might be less than BLINK_WINDOW_MS when just starting)
        val oldestBlinkTime = if (blinkEvents.isEmpty()) currentTime else blinkEvents.first
        val actualWindowDuration = (currentTime - oldestBlinkTime).coerceAtMost(BLINK_WINDOW_MS)
        
        // Calculate blinks per minute
        return if (actualWindowDuration > 0) {
            (blinksInWindow.toFloat() * 60000f) / actualWindowDuration
        } else {
            0f
        }
    }
    
    /**
     * Checks if the current blink rate indicates dry eyes
     * 
     * @return Boolean indicating if dry eyes are likely
     */
    fun isDryEyesLikely(): Boolean {
        val currentRate = getCurrentBlinkRate()
        return currentRate < MIN_HEALTHY_BLINK_RATE
    }
    
    /**
     * Gets the average blink duration
     * 
     * @return Float representing average blink duration in milliseconds
     */
    fun getAverageBlinkDuration(): Float {
        return if (blinkCount > 0) {
            totalBlinkDuration.toFloat() / blinkCount
        } else {
            0f
        }
    }
    
    /**
     * Gets a health status message based on current blink rate
     * 
     * @return String with eye health advice
     */
    fun getEyeHealthAdvice(): String {
        val currentRate = getCurrentBlinkRate()
        return when {
            currentRate < MIN_HEALTHY_BLINK_RATE * 0.7f -> 
                "Your blink rate is very low. Take a break and use eye drops."
            currentRate < MIN_HEALTHY_BLINK_RATE -> 
                "Your blink rate is lower than recommended. Try to blink more often."
            currentRate > MAX_HEALTHY_BLINK_RATE * 1.3f -> 
                "Your blink rate is unusually high. This may indicate eye irritation."
            currentRate > MAX_HEALTHY_BLINK_RATE -> 
                "Your blink rate is slightly elevated. Check for eye irritants."
            else -> 
                "Your blink rate is within the healthy range."
        }
    }
    
    /**
     * Resets the blink analyzer state
     */
    fun reset() {
        blinkEvents.clear()
        isEyeClosed = false
        lastBlinkStartTime = 0L
        currentBlinkDuration = 0L
        totalBlinkDuration = 0L
        blinkCount = 0
    }
}
