package com.eyecareai.data

import com.eyecareai.data.local.EyeHealthDao
import com.eyecareai.data.model.BlinkData
import com.eyecareai.data.model.EyeMetrics
import com.eyecareai.data.model.UserSettings
import kotlinx.coroutines.flow.Flow
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for managing eye health data
 */
@Singleton
class EyeHealthRepository @Inject constructor(
    private val eyeHealthDao: EyeHealthDao
) {
    // Blink data operations
    suspend fun insertBlinkData(blinkData: BlinkData): Long {
        return eyeHealthDao.insertBlinkData(blinkData)
    }
    
    fun getAllBlinkData(): Flow<List<BlinkData>> {
        return eyeHealthDao.getAllBlinkData()
    }
    
    fun getBlinkDataForToday(): Flow<List<BlinkData>> {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startDate = calendar.time
        
        return eyeHealthDao.getBlinkDataBetweenDates(startDate, endDate)
    }
    
    fun getBlinkDataForPastWeek(): Flow<List<BlinkData>> {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.DAY_OF_YEAR, -7)
        val startDate = calendar.time
        
        return eyeHealthDao.getBlinkDataBetweenDates(startDate, endDate)
    }
    
    fun getBlinkDataForPastMonth(): Flow<List<BlinkData>> {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.MONTH, -1)
        val startDate = calendar.time
        
        return eyeHealthDao.getBlinkDataBetweenDates(startDate, endDate)
    }
    
    suspend fun getAverageBlinkRateForToday(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startDate = calendar.time
        
        return eyeHealthDao.getAverageBlinkRateBetweenDates(startDate, endDate)
    }
    
    suspend fun getAverageBlinkRateForPastWeek(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.DAY_OF_YEAR, -7)
        val startDate = calendar.time
        
        return eyeHealthDao.getAverageBlinkRateBetweenDates(startDate, endDate)
    }
    
    suspend fun getAverageBlinkRateForPastMonth(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.MONTH, -1)
        val startDate = calendar.time
        
        return eyeHealthDao.getAverageBlinkRateBetweenDates(startDate, endDate)
    }
    
    // Eye metrics operations
    suspend fun insertEyeMetrics(eyeMetrics: EyeMetrics): Long {
        return eyeHealthDao.insertEyeMetrics(eyeMetrics)
    }
    
    fun getAllEyeMetrics(): Flow<List<EyeMetrics>> {
        return eyeHealthDao.getAllEyeMetrics()
    }
    
    fun getEyeMetricsForToday(): Flow<List<EyeMetrics>> {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startDate = calendar.time
        
        return eyeHealthDao.getEyeMetricsBetweenDates(startDate, endDate)
    }
    
    suspend fun countDrowsyEpisodesForToday(): Int {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startDate = calendar.time
        
        return eyeHealthDao.countDrowsyEpisodesBetweenDates(startDate, endDate)
    }
    
    suspend fun countDrowsyEpisodesForPastWeek(): Int {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.DAY_OF_YEAR, -7)
        val startDate = calendar.time
        
        return eyeHealthDao.countDrowsyEpisodesBetweenDates(startDate, endDate)
    }
    
    suspend fun countDrowsyEpisodesForPastMonth(): Int {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.MONTH, -1)
        val startDate = calendar.time
        
        return eyeHealthDao.countDrowsyEpisodesBetweenDates(startDate, endDate)
    }
    
    suspend fun getTotalScreenTimeForToday(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startDate = calendar.time
        
        return eyeHealthDao.getTotalScreenTimeBetweenDates(startDate, endDate)
    }
    
    suspend fun getTotalScreenTimeForPastWeek(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.DAY_OF_YEAR, -7)
        val startDate = calendar.time
        
        return eyeHealthDao.getTotalScreenTimeBetweenDates(startDate, endDate)
    }
    
    suspend fun getTotalScreenTimeForPastMonth(): Float {
        val calendar = Calendar.getInstance()
        val endDate = calendar.time
        
        calendar.add(Calendar.MONTH, -1)
        val startDate = calendar.time
        
        return eyeHealthDao.getTotalScreenTimeBetweenDates(startDate, endDate)
    }
    
    // User settings operations
    suspend fun updateUserSettings(userSettings: UserSettings) {
        eyeHealthDao.insertOrUpdateUserSettings(userSettings)
    }
    
    fun getUserSettings(): Flow<UserSettings?> {
        return eyeHealthDao.getUserSettings()
    }
    
    suspend fun resetUserSettings() {
        eyeHealthDao.insertOrUpdateUserSettings(
            UserSettings(
                id = 1,
                drowsinessDetectionEnabled = true,
                blinkReminderEnabled = true,
                breakReminderEnabled = true,
                breakIntervalMinutes = 20,
                gazeControlEnabled = false,
                blinkControlEnabled = false,
                eyeDetectionSensitivity = 5,
                drowsinessThreshold = 60,
                minHealthyBlinkRate = 15,
                darkModeEnabled = false,
                dataCollectionEnabled = true
            )
        )
    }
}
