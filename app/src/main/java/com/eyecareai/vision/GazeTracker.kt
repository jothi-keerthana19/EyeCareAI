package com.eyecareai.vision

import android.content.Context
import android.graphics.Point
import android.util.Log
import org.opencv.core.Mat
import kotlin.math.abs

/**
 * Tracks gaze direction and eye movement for accessibility features
 */
class GazeTracker(private val context: Context) {
    private val TAG = "GazeTracker"
    
    // Calibration points
    private var calibrated = false
    private var centerX = 0
    private var centerY = 0
    private var leftBoundary = 0
    private var rightBoundary = 0
    private var topBoundary = 0
    private var bottomBoundary = 0
    
    // Current gaze position and history
    private var currentGazeX = 0f
    private var currentGazeY = 0f
    private val gazeHistory = ArrayList<GazePoint>()
    private val historySize = 10 // Number of points to keep for smoothing
    
    // Sensitivity settings
    private var horizontalSensitivity = 1.0f
    private var verticalSensitivity = 1.0f
    
    /**
     * Updates the gaze position based on eye positions
     * 
     * @param leftEyePosition Position of the left eye
     * @param rightEyePosition Position of the right eye
     * @param frameWidth Width of the camera frame
     * @param frameHeight Height of the camera frame
     * @return GazeDirection indicating the direction of gaze
     */
    fun updateGaze(
        leftEyePosition: org.opencv.core.Point,
        rightEyePosition: org.opencv.core.Point,
        frameWidth: Int,
        frameHeight: Int
    ): GazeDirection {
        // Initialize calibration if not done
        if (!calibrated) {
            calibrate(frameWidth, frameHeight)
        }
        
        // Calculate the midpoint between eyes
        val midpointX = (leftEyePosition.x + rightEyePosition.x) / 2
        val midpointY = (leftEyePosition.y + rightEyePosition.y) / 2
        
        // Calculate eye vector (direction between the eyes)
        val eyeVectorX = rightEyePosition.x - leftEyePosition.x
        val eyeVectorY = rightEyePosition.y - leftEyePosition.y
        
        // Simple gaze estimation based on eye positions
        // In a real implementation, this would be more sophisticated
        val gazeX = midpointX.toFloat()
        val gazeY = midpointY.toFloat()
        
        // Add to history
        gazeHistory.add(GazePoint(gazeX, gazeY, System.currentTimeMillis()))
        if (gazeHistory.size > historySize) {
            gazeHistory.removeAt(0)
        }
        
        // Smooth gaze position using recent history
        val smoothedGaze = smoothGaze()
        currentGazeX = smoothedGaze.first
        currentGazeY = smoothedGaze.second
        
        // Determine gaze direction
        return determineGazeDirection(currentGazeX, currentGazeY)
    }
    
    /**
     * Calibrates the gaze tracker based on frame dimensions
     * 
     * @param frameWidth Width of the camera frame
     * @param frameHeight Height of the camera frame
     */
    private fun calibrate(frameWidth: Int, frameHeight: Int) {
        centerX = frameWidth / 2
        centerY = frameHeight / 2
        
        // Set boundaries for gaze direction detection
        leftBoundary = frameWidth / 3
        rightBoundary = frameWidth * 2 / 3
        topBoundary = frameHeight / 3
        bottomBoundary = frameHeight * 2 / 3
        
        calibrated = true
        Log.d(TAG, "Gaze tracker calibrated with frame size: $frameWidth x $frameHeight")
    }
    
    /**
     * Smooths gaze position using recent history
     * 
     * @return Pair of Float containing smoothed X and Y coordinates
     */
    private fun smoothGaze(): Pair<Float, Float> {
        if (gazeHistory.isEmpty()) {
            return Pair(0f, 0f)
        }
        
        var totalX = 0f
        var totalY = 0f
        var totalWeight = 0f
        
        // Apply weighted average (more recent points have higher weight)
        for (i in gazeHistory.indices) {
            val weight = (i + 1).toFloat()
            totalX += gazeHistory[i].x * weight
            totalY += gazeHistory[i].y * weight
            totalWeight += weight
        }
        
        return Pair(
            totalX / totalWeight,
            totalY / totalWeight
        )
    }
    
    /**
     * Determines the gaze direction based on coordinates
     * 
     * @param x X-coordinate of gaze point
     * @param y Y-coordinate of gaze point
     * @return GazeDirection enum representing the direction
     */
    private fun determineGazeDirection(x: Float, y: Float): GazeDirection {
        val horizontalDirection = when {
            x < leftBoundary -> GazeDirection.LEFT
            x > rightBoundary -> GazeDirection.RIGHT
            else -> GazeDirection.CENTER
        }
        
        val verticalDirection = when {
            y < topBoundary -> GazeDirection.UP
            y > bottomBoundary -> GazeDirection.DOWN
            else -> GazeDirection.CENTER
        }
        
        // Combined direction
        return when {
            horizontalDirection == GazeDirection.LEFT && verticalDirection == GazeDirection.UP -> 
                GazeDirection.UP_LEFT
            horizontalDirection == GazeDirection.RIGHT && verticalDirection == GazeDirection.UP -> 
                GazeDirection.UP_RIGHT
            horizontalDirection == GazeDirection.LEFT && verticalDirection == GazeDirection.DOWN -> 
                GazeDirection.DOWN_LEFT
            horizontalDirection == GazeDirection.RIGHT && verticalDirection == GazeDirection.DOWN -> 
                GazeDirection.DOWN_RIGHT
            horizontalDirection == GazeDirection.LEFT -> 
                GazeDirection.LEFT
            horizontalDirection == GazeDirection.RIGHT -> 
                GazeDirection.RIGHT
            verticalDirection == GazeDirection.UP -> 
                GazeDirection.UP
            verticalDirection == GazeDirection.DOWN -> 
                GazeDirection.DOWN
            else -> 
                GazeDirection.CENTER
        }
    }
    
    /**
     * Gets the current gaze position
     * 
     * @return Point representing the current gaze position
     */
    fun getCurrentGazePosition(): Point {
        return Point(currentGazeX.toInt(), currentGazeY.toInt())
    }
    
    /**
     * Updates sensitivity settings for gaze tracking
     * 
     * @param horizontal Horizontal sensitivity (0.5-2.0)
     * @param vertical Vertical sensitivity (0.5-2.0)
     */
    fun updateSensitivity(horizontal: Float, vertical: Float) {
        horizontalSensitivity = horizontal.coerceIn(0.5f, 2.0f)
        verticalSensitivity = vertical.coerceIn(0.5f, 2.0f)
    }
    
    /**
     * Detects if a double blink has occurred for selection actions
     * 
     * @param blinkEvents List of blink timestamps
     * @return Boolean indicating if a double blink was detected
     */
    fun detectDoubleBlink(blinkEvents: List<Long>): Boolean {
        if (blinkEvents.size < 2) {
            return false
        }
        
        // Check the two most recent blinks
        val lastBlink = blinkEvents.last()
        val secondLastBlink = blinkEvents[blinkEvents.size - 2]
        
        // Double blink criteria: two blinks within 400ms
        val timeBetweenBlinks = lastBlink - secondLastBlink
        return timeBetweenBlinks in 100..400
    }
    
    /**
     * Data class representing a gaze point with timestamp
     */
    data class GazePoint(
        val x: Float,
        val y: Float,
        val timestamp: Long
    )
    
    /**
     * Enum representing gaze directions
     */
    enum class GazeDirection {
        CENTER, UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT
    }
}
