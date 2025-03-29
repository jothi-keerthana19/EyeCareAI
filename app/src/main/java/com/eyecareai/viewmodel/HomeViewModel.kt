package com.eyecareai.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eyecareai.data.EyeHealthRepository
import com.eyecareai.data.local.EyeHealthDatabase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * ViewModel for the Home screen
 */
class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    // Repository for eye health data
    private val repository: EyeHealthRepository
    
    // UI state
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        val eyeHealthDao = EyeHealthDatabase.getDatabase(application).eyeHealthDao()
        repository = EyeHealthRepository(eyeHealthDao)
        
        // Load initial data
        loadEyeHealthData()
    }
    
    /**
     * Loads eye health data from the repository
     */
    private fun loadEyeHealthData() {
        viewModelScope.launch {
            try {
                // Load average blink rate
                val averageBlinkRate = repository.getAverageBlinkRateForToday()
                
                // Load screen time
                val screenTimeMinutes = repository.getTotalScreenTimeForToday()
                val hours = screenTimeMinutes.toInt() / 60
                val minutes = screenTimeMinutes.toInt() % 60
                val screenTimeString = if (hours > 0) {
                    "$hours h $minutes min"
                } else {
                    "$minutes min"
                }
                
                // Calculate last break time
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.MINUTE, -35) // Mock last break time (35 minutes ago)
                val lastBreakDate = calendar.time
                val lastBreakString = getTimeAgo(lastBreakDate)
                
                // Update UI state
                _uiState.value = HomeUiState(
                    currentBlinkRate = averageBlinkRate.toInt(),
                    screenTimeToday = screenTimeString,
                    screenTimeHours = screenTimeMinutes / 60,
                    lastBreakTime = lastBreakString,
                    minutesSinceLastBreak = getMinutesDifference(lastBreakDate, Date())
                )
            } catch (e: Exception) {
                // Handle error
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load eye health data"
                )
            }
        }
    }
    
    /**
     * Formats time difference as a string
     */
    private fun getTimeAgo(past: Date): String {
        val now = Date()
        val minutes = getMinutesDifference(past, now)
        
        return when {
            minutes < 1 -> "Just now"
            minutes < 60 -> "$minutes minutes ago"
            minutes < 24 * 60 -> "${minutes / 60} hours ago"
            else -> SimpleDateFormat("h:mm a", Locale.getDefault()).format(past)
        }
    }
    
    /**
     * Calculates minutes between two dates
     */
    private fun getMinutesDifference(start: Date, end: Date): Int {
        val diffInMillis = end.time - start.time
        return TimeUnit.MILLISECONDS.toMinutes(diffInMillis).toInt()
    }
    
    /**
     * Manually refresh data
     */
    fun refreshData() {
        loadEyeHealthData()
    }
    
    /**
     * UI state for the Home screen
     */
    data class HomeUiState(
        val currentBlinkRate: Int = 15,
        val screenTimeToday: String = "0 h 0 min",
        val screenTimeHours: Float = 0f,
        val lastBreakTime: String = "N/A",
        val minutesSinceLastBreak: Int = 0,
        val errorMessage: String? = null
    )
}
