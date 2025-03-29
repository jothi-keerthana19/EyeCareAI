package com.eyecareai.vision

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import org.opencv.core.Mat
import org.opencv.core.Point
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.*

/**
 * Detects driver drowsiness based on eye closure patterns and head position
 */
class DrowsinessDetector(private val context: Context) {
    private val TAG = "DrowsinessDetector"
    
    // TensorFlow Lite model interpreter
    private var interpreter: Interpreter? = null
    
    // Constants for drowsiness detection
    private val PERCLOS_WINDOW_MS = 60000 // 1 minute window for PERCLOS calculation
    private val DROWSINESS_THRESHOLD = 0.6 // PERCLOS threshold for drowsiness
    private val EAR_THRESHOLD = 0.2 // Eye aspect ratio threshold for eye closure
    
    // Eye closure tracking
    private val eyeClosureEvents = LinkedList<EyeClosureEvent>()
    
    // Current drowsiness level (0-100)
    private var drowsinessLevel = 0f
    
    init {
        try {
            // Load TensorFlow Lite model
            val modelFile = FileUtil.loadMappedFile(context, "drowsiness_model.tflite")
            val options = Interpreter.Options()
            interpreter = Interpreter(modelFile, options)
            Log.d(TAG, "TensorFlow Lite model loaded successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error loading TensorFlow Lite model: ${e.message}")
        }
    }
    
    /**
     * Records an eye closure event
     * 
     * @param timestamp Time when eyes were detected as closed
     * @param duration Duration of eye closure in milliseconds
     */
    fun recordEyeClosure(timestamp: Long, duration: Long) {
        eyeClosureEvents.add(EyeClosureEvent(timestamp, duration))
        
        // Remove events older than the window
        val currentTime = System.currentTimeMillis()
        while (eyeClosureEvents.isNotEmpty() && 
               eyeClosureEvents.first.timestamp < currentTime - PERCLOS_WINDOW_MS) {
            eyeClosureEvents.removeFirst()
        }
        
        // Update drowsiness level based on PERCLOS
        drowsinessLevel = calculatePERCLOS() * 100f
        
        Log.d(TAG, "Eye closure recorded. Current drowsiness level: $drowsinessLevel%")
    }
    
    /**
     * Calculates the PERCLOS value (percentage of eye closure over time)
     * 
     * @return Float value between 0 and 1 representing PERCLOS
     */
    private fun calculatePERCLOS(): Float {
        val currentTime = System.currentTimeMillis()
        val windowStartTime = currentTime - PERCLOS_WINDOW_MS
        
        // Calculate total eye closure time in the window
        var totalClosureTime = 0L
        for (event in eyeClosureEvents) {
            if (event.timestamp >= windowStartTime) {
                totalClosureTime += event.duration
            }
        }
        
        // Calculate PERCLOS (percentage of eye closure)
        return (totalClosureTime.toFloat() / PERCLOS_WINDOW_MS).coerceIn(0f, 1f)
    }
    
    /**
     * Detects drowsiness using TensorFlow Lite model and eye closure patterns
     * 
     * @param eyeAspectRatio Current eye aspect ratio
     * @param headPose Head pose information (if available)
     * @param facialLandmarks Facial landmarks (if available)
     * @return Float value between 0 and 100 representing drowsiness level
     */
    fun detectDrowsiness(
        eyeAspectRatio: Float,
        headPose: HeadPose? = null,
        facialLandmarks: List<Point>? = null
    ): Float {
        // Check if eyes are currently closed
        val eyesClosed = eyeAspectRatio < EAR_THRESHOLD
        
        // Update drowsiness level
        if (interpreter != null && facialLandmarks != null) {
            // For real implementation: Use TensorFlow Lite model with facial landmarks
            // For now, we'll use simplified logic based on PERCLOS
            drowsinessLevel = calculatePERCLOS() * 100f
        } else {
            // Simplified drowsiness detection based on PERCLOS
            drowsinessLevel = calculatePERCLOS() * 100f
        }
        
        return drowsinessLevel
    }
    
    /**
     * Checks if drowsiness is detected based on current metrics
     * 
     * @return Boolean indicating if the user is drowsy
     */
    fun isDrowsy(): Boolean {
        return drowsinessLevel / 100f >= DROWSINESS_THRESHOLD
    }
    
    /**
     * Gets the current drowsiness level
     * 
     * @return Float value between 0 and 100
     */
    fun getDrowsinessLevel(): Float {
        return drowsinessLevel
    }
    
    /**
     * Process frame using TensorFlow Lite model for drowsiness detection
     * 
     * @param frame Camera frame to analyze
     * @return Float representing drowsiness probability
     */
    fun processFrameForDrowsiness(frame: Bitmap): Float {
        if (interpreter == null) {
            return 0f
        }
        
        try {
            // Resize the bitmap to model input size
            val modelInputWidth = 96
            val modelInputHeight = 96
            
            val resizedBitmap = Bitmap.createScaledBitmap(
                frame, modelInputWidth, modelInputHeight, true
            )
            
            // Prepare input buffer
            val inputBuffer = ByteBuffer.allocateDirect(
                modelInputWidth * modelInputHeight * 3 * 4
            ).apply {
                order(ByteOrder.nativeOrder())
            }
            
            // Fill input buffer with pixel values
            for (y in 0 until modelInputHeight) {
                for (x in 0 until modelInputWidth) {
                    val pixelValue = resizedBitmap.getPixel(x, y)
                    
                    // Extract RGB values and normalize to [-1, 1]
                    inputBuffer.putFloat(((pixelValue shr 16 and 0xFF) / 127.5f) - 1f)
                    inputBuffer.putFloat(((pixelValue shr 8 and 0xFF) / 127.5f) - 1f)
                    inputBuffer.putFloat(((pixelValue and 0xFF) / 127.5f) - 1f)
                }
            }
            
            // Prepare output buffer
            val outputBuffer = ByteBuffer.allocateDirect(4).apply {
                order(ByteOrder.nativeOrder())
            }
            
            // Run inference
            interpreter?.run(inputBuffer, outputBuffer)
            
            // Get result
            outputBuffer.rewind()
            val drowsinessProbability = outputBuffer.float
            
            return drowsinessProbability * 100f
        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame: ${e.message}")
            return 0f
        }
    }
    
    /**
     * Releases resources used by the drowsiness detector
     */
    fun release() {
        interpreter?.close()
        interpreter = null
    }
    
    /**
     * Data class representing an eye closure event
     */
    data class EyeClosureEvent(
        val timestamp: Long, // When the eyes were closed
        val duration: Long   // How long the eyes were closed in ms
    )
    
    /**
     * Data class representing head pose
     */
    data class HeadPose(
        val roll: Float,  // Roll angle in degrees
        val pitch: Float, // Pitch angle in degrees
        val yaw: Float    // Yaw angle in degrees
    )
}
