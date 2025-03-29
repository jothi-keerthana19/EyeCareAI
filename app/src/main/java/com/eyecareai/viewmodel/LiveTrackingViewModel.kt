package com.eyecareai.viewmodel

import android.app.Application
import android.content.Context
import android.util.Log
import android.view.View
import androidx.camera.view.PreviewView
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eyecareai.data.EyeHealthRepository
import com.eyecareai.data.local.EyeHealthDatabase
import com.eyecareai.data.model.BlinkData
import com.eyecareai.data.model.EyeMetrics
import com.eyecareai.util.CameraUtils
import com.eyecareai.util.NotificationManager
import com.eyecareai.vision.BlinkAnalyzer
import com.eyecareai.vision.DrowsinessDetector
import com.eyecareai.vision.EyeDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Date
import java.util.UUID

/**
 * ViewModel for the Live Tracking screen
 */
class LiveTrackingViewModel(application: Application) : AndroidViewModel(application) {
    private val TAG = "LiveTrackingViewModel"
    
    // Repository for eye health data
    private val repository: EyeHealthRepository
    
    // Vision processors
    private val eyeDetector: EyeDetector = EyeDetector(application)
    private val blinkAnalyzer: BlinkAnalyzer = BlinkAnalyzer(application)
    private val drowsinessDetector: DrowsinessDetector = DrowsinessDetector(application)
    
    // Camera utilities
    private val cameraUtils: CameraUtils = CameraUtils(application)
    
    // Notification manager
    private val notificationManager: NotificationManager = NotificationManager(application)
    
    // Session data
    private var sessionId: String = UUID.randomUUID().toString()
    private var sessionStartTime: Long = 0L
    private var tracking: Boolean = false
    private var trackingJob: Job? = null
    
    // UI state
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    init {
        val eyeHealthDao = EyeHealthDatabase.getDatabase(application).eyeHealthDao()
        repository = EyeHealthRepository(eyeHealthDao)
    }
    
    /**
     * Creates the camera preview view
     */
    fun createCameraPreviewView(context: Context): View {
        return cameraUtils.createCameraPreviewView(context)
    }
    
    /**
     * Starts eye tracking
     */
    fun startEyeTracking() {
        if (tracking) return
        
        tracking = true
        sessionId = UUID.randomUUID().toString()
        sessionStartTime = System.currentTimeMillis()
        
        _uiState.value = _uiState.value.copy(
            isTracking = true
        )
        
        // Start tracking in a coroutine
        trackingJob = viewModelScope.launch(Dispatchers.Default) {
            var lastBlinkCheckTime = 0L
            var lastDrowsinessCheckTime = 0L
            var lastDataSaveTime = 0L
            
            // Simulated eye tracking loop
            while (isActive && tracking) {
                val currentTime = System.currentTimeMillis()
                
                // Check blinks every 100ms
                if (currentTime - lastBlinkCheckTime >= 100) {
                    processEyeData()
                    lastBlinkCheckTime = currentTime
                }
                
                // Check drowsiness every 500ms
                if (currentTime - lastDrowsinessCheckTime >= 500) {
                    processDrowsinessData()
                    lastDrowsinessCheckTime = currentTime
                }
                
                // Save data to database every 5 seconds
                if (currentTime - lastDataSaveTime >= 5000) {
                    saveTrackingData()
                    lastDataSaveTime = currentTime
                }
                
                delay(50) // Small delay to avoid excessive CPU usage
            }
        }
    }
    
    /**
     * Stops eye tracking
     */
    fun stopEyeTracking() {
        if (!tracking) return
        
        tracking = false
        trackingJob?.cancel()
        trackingJob = null
        
        // Save final tracking data
        viewModelScope.launch {
            saveTrackingData()
        }
        
        _uiState.value = _uiState.value.copy(
            isTracking = false
        )
    }
    
    /**
     * Processes eye data to detect blinks
     */
    private fun processEyeData() {
        // In a real implementation, this would get data from the camera
        // Here we'll use simulated data based on the current UI state
        
        val detectionProbability = if (_uiState.value.eyesDetected) 0.98f else 0.7f
        
        // Randomly decide if eyes are detected (with high probability if previously detected)
        val eyesDetected = Math.random() < detectionProbability
        
        if (eyesDetected) {
            // Update eye positions (simulated random movement)
            val leftEyeX = _uiState.value.leftEyeX + (Math.random() * 2 - 1).toFloat()
            val leftEyeY = _uiState.value.leftEyeY + (Math.random() * 2 - 1).toFloat()
            val rightEyeX = _uiState.value.rightEyeX + (Math.random() * 2 - 1).toFloat()
            val rightEyeY = _uiState.value.rightEyeY + (Math.random() * 2 - 1).toFloat()
            
            // Calculate a simulated blink rate that varies slightly
            val blinkRate = 12f + (Math.random() * 8 - 4).toFloat()
            
            // Update UI state
            _uiState.value = _uiState.value.copy(
                eyesDetected = true,
                leftEyeX = leftEyeX.coerceIn(50f, 150f),
                leftEyeY = leftEyeY.coerceIn(100f, 200f),
                rightEyeX = rightEyeX.coerceIn(200f, 300f),
                rightEyeY = rightEyeY.coerceIn(100f, 200f),
                blinkRate = blinkRate
            )
        } else {
            // Eyes not detected
            _uiState.value = _uiState.value.copy(
                eyesDetected = false
            )
        }
    }
    
    /**
     * Processes drowsiness data
     */
    private fun processDrowsinessData() {
        // In a real implementation, this would analyze eye closure patterns
        // Here we'll use simulated data that occasionally triggers drowsiness
        
        // Baseline drowsiness that increases slowly over time while tracking
        val sessionDurationMinutes = (System.currentTimeMillis() - sessionStartTime) / 60000f
        val baseDrowsiness = (sessionDurationMinutes * 5).coerceAtMost(40f)
        
        // Add random variation
        val drowsinessLevel = baseDrowsiness + (Math.random() * 30 - 15).toFloat()
        
        // Occasionally simulate high drowsiness (about 5% chance if tracking > 2 minutes)
        val isDrowsy = if (sessionDurationMinutes > 2 && Math.random() < 0.05) {
            // Set a high drowsiness level
            _uiState.value = _uiState.value.copy(
                drowsinessLevel = 75f + (Math.random() * 25).toFloat(),
                isDrowsy = true
            )
            
            // Show drowsiness alert
            viewModelScope.launch(Dispatchers.Main) {
                notificationManager.showDrowsinessAlert()
            }
            
            true
        } else {
            // Update with normal drowsiness level
            _uiState.value = _uiState.value.copy(
                drowsinessLevel = drowsinessLevel.coerceIn(0f, 100f),
                isDrowsy = drowsinessLevel > 70f
            )
            
            drowsinessLevel > 70f
        }
        
        // Log drowsiness detection
        if (isDrowsy) {
            Log.d(TAG, "Drowsiness detected: ${_uiState.value.drowsinessLevel}%")
        }
    }
    
    /**
     * Saves tracking data to the database
     */
    private suspend fun saveTrackingData() {
        try {
            // Calculate session duration
            val sessionDuration = (System.currentTimeMillis() - sessionStartTime) / 60000f
            
            // Save blink data
            val blinkData = BlinkData(
                timestamp = Date(),
                blinkRate = _uiState.value.blinkRate,
                blinkDuration = 200f, // Placeholder average blink duration
                sessionId = sessionId,
                isLowBlinkRate = _uiState.value.blinkRate < 10f
            )
            repository.insertBlinkData(blinkData)
            
            // Save eye metrics
            val eyeMetrics = EyeMetrics(
                timestamp = Date(),
                blinkRate = _uiState.value.blinkRate,
                drowsinessLevel = _uiState.value.drowsinessLevel,
                sessionDuration = sessionDuration,
                drowsinessDetected = _uiState.value.isDrowsy,
                sessionId = sessionId,
                breaksTaken = 0 // No breaks in this simple implementation
            )
            repository.insertEyeMetrics(eyeMetrics)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error saving tracking data: ${e.message}")
        }
    }
    
    /**
     * Clean up resources when ViewModel is cleared
     */
    override fun onCleared() {
        super.onCleared()
        stopEyeTracking()
        drowsinessDetector.release()
    }
    
    /**
     * UI state for the Live Tracking screen
     */
    data class UiState(
        val isTracking: Boolean = false,
        val eyesDetected: Boolean = false,
        val leftEyeX: Float = 100f,
        val leftEyeY: Float = 150f,
        val rightEyeX: Float = 250f,
        val rightEyeY: Float = 150f,
        val blinkRate: Float = 15f,
        val drowsinessLevel: Float = 0f,
        val isDrowsy: Boolean = false
    )
}
