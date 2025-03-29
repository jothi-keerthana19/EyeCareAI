package com.eyecareai.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eyecareai.data.EyeHealthRepository
import com.eyecareai.data.local.EyeHealthDatabase
import com.eyecareai.data.model.UserSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * ViewModel for the Settings screen
 */
class SettingsViewModel(application: Application) : AndroidViewModel(application) {
    
    // Repository for eye health data
    private val repository: EyeHealthRepository
    
    // UI state
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()
    
    init {
        val eyeHealthDao = EyeHealthDatabase.getDatabase(application).eyeHealthDao()
        repository = EyeHealthRepository(eyeHealthDao)
        
        // Load settings
        loadUserSettings()
    }
    
    /**
     * Loads user settings from the repository
     */
    private fun loadUserSettings() {
        viewModelScope.launch {
            try {
                // Get current user settings
                val settings = repository.getUserSettings().first()
                
                // If settings exist, update UI state
                if (settings != null) {
                    _uiState.value = SettingsUiState(
                        drowsinessDetectionEnabled = settings.drowsinessDetectionEnabled,
                        blinkReminderEnabled = settings.blinkReminderEnabled,
                        breakReminderEnabled = settings.breakReminderEnabled,
                        breakIntervalMinutes = settings.breakIntervalMinutes,
                        gazeControlEnabled = settings.gazeControlEnabled,
                        blinkControlEnabled = settings.blinkControlEnabled,
                        eyeDetectionSensitivity = settings.eyeDetectionSensitivity,
                        drowsinessThreshold = settings.drowsinessThreshold,
                        minHealthyBlinkRate = settings.minHealthyBlinkRate,
                        darkModeEnabled = settings.darkModeEnabled
                    )
                } else {
                    // If no settings exist, create default settings
                    repository.resetUserSettings()
                    loadUserSettings() // Reload settings
                }
            } catch (e: Exception) {
                // Handle error
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load settings"
                )
            }
        }
    }
    
    /**
     * Updates drowsiness detection setting
     */
    fun updateDrowsinessDetection(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(drowsinessDetectionEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Updates blink reminder setting
     */
    fun updateBlinkReminder(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(blinkReminderEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Updates break reminder setting
     */
    fun updateBreakReminder(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(breakReminderEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Updates break interval setting
     */
    fun updateBreakInterval(minutes: Int) {
        _uiState.value = _uiState.value.copy(breakIntervalMinutes = minutes)
        saveSettings()
    }
    
    /**
     * Updates gaze control setting
     */
    fun updateGazeControl(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(gazeControlEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Updates blink control setting
     */
    fun updateBlinkControl(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(blinkControlEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Updates eye detection sensitivity
     */
    fun updateEyeDetectionSensitivity(sensitivity: Int) {
        _uiState.value = _uiState.value.copy(eyeDetectionSensitivity = sensitivity)
        saveSettings()
    }
    
    /**
     * Updates drowsiness threshold
     */
    fun updateDrowsinessThreshold(threshold: Int) {
        _uiState.value = _uiState.value.copy(drowsinessThreshold = threshold)
        saveSettings()
    }
    
    /**
     * Updates minimum healthy blink rate
     */
    fun updateMinHealthyBlinkRate(rate: Int) {
        _uiState.value = _uiState.value.copy(minHealthyBlinkRate = rate)
        saveSettings()
    }
    
    /**
     * Updates dark mode setting
     */
    fun updateDarkMode(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(darkModeEnabled = enabled)
        saveSettings()
    }
    
    /**
     * Saves current settings to the repository
     */
    private fun saveSettings() {
        viewModelScope.launch {
            val settings = UserSettings(
                id = 1, // Always use ID 1 for settings
                drowsinessDetectionEnabled = _uiState.value.drowsinessDetectionEnabled,
                blinkReminderEnabled = _uiState.value.blinkReminderEnabled,
                breakReminderEnabled = _uiState.value.breakReminderEnabled,
                breakIntervalMinutes = _uiState.value.breakIntervalMinutes,
                gazeControlEnabled = _uiState.value.gazeControlEnabled,
                blinkControlEnabled = _uiState.value.blinkControlEnabled,
                eyeDetectionSensitivity = _uiState.value.eyeDetectionSensitivity,
                drowsinessThreshold = _uiState.value.drowsinessThreshold,
                minHealthyBlinkRate = _uiState.value.minHealthyBlinkRate,
                darkModeEnabled = _uiState.value.darkModeEnabled
            )
            
            repository.updateUserSettings(settings)
        }
    }
    
    /**
     * Resets all settings to defaults
     */
    fun resetSettings() {
        viewModelScope.launch {
            repository.resetUserSettings()
            loadUserSettings() // Reload settings from repository
        }
    }
    
    /**
     * UI state for the Settings screen
     */
    data class SettingsUiState(
        val drowsinessDetectionEnabled: Boolean = true,
        val blinkReminderEnabled: Boolean = true,
        val breakReminderEnabled: Boolean = true,
        val breakIntervalMinutes: Int = 20,
        val gazeControlEnabled: Boolean = false,
        val blinkControlEnabled: Boolean = false,
        val eyeDetectionSensitivity: Int = 5,
        val drowsinessThreshold: Int = 60,
        val minHealthyBlinkRate: Int = 15,
        val darkModeEnabled: Boolean = false,
        val errorMessage: String? = null
    )
}
