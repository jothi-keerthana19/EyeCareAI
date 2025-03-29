package com.eyecareai.data.local

import androidx.room.*
import com.eyecareai.data.model.BlinkData
import com.eyecareai.data.model.EyeMetrics
import com.eyecareai.data.model.UserSettings
import kotlinx.coroutines.flow.Flow
import java.util.Date

/**
 * Data Access Object for eye health related entities
 */
@Dao
interface EyeHealthDao {
    // Blink Data Operations
    @Insert
    suspend fun insertBlinkData(blinkData: BlinkData): Long
    
    @Update
    suspend fun updateBlinkData(blinkData: BlinkData)
    
    @Delete
    suspend fun deleteBlinkData(blinkData: BlinkData)
    
    @Query("SELECT * FROM blink_data ORDER BY timestamp DESC")
    fun getAllBlinkData(): Flow<List<BlinkData>>
    
    @Query("SELECT * FROM blink_data WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp ASC")
    fun getBlinkDataBetweenDates(startDate: Date, endDate: Date): Flow<List<BlinkData>>
    
    @Query("SELECT AVG(blinkRate) FROM blink_data WHERE timestamp BETWEEN :startDate AND :endDate")
    suspend fun getAverageBlinkRateBetweenDates(startDate: Date, endDate: Date): Float
    
    // Eye Metrics Operations
    @Insert
    suspend fun insertEyeMetrics(eyeMetrics: EyeMetrics): Long
    
    @Update
    suspend fun updateEyeMetrics(eyeMetrics: EyeMetrics)
    
    @Delete
    suspend fun deleteEyeMetrics(eyeMetrics: EyeMetrics)
    
    @Query("SELECT * FROM eye_metrics ORDER BY timestamp DESC")
    fun getAllEyeMetrics(): Flow<List<EyeMetrics>>
    
    @Query("SELECT * FROM eye_metrics WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp ASC")
    fun getEyeMetricsBetweenDates(startDate: Date, endDate: Date): Flow<List<EyeMetrics>>
    
    @Query("SELECT COUNT(*) FROM eye_metrics WHERE drowsinessDetected = 1 AND timestamp BETWEEN :startDate AND :endDate")
    suspend fun countDrowsyEpisodesBetweenDates(startDate: Date, endDate: Date): Int
    
    @Query("SELECT SUM(sessionDuration) FROM eye_metrics WHERE timestamp BETWEEN :startDate AND :endDate")
    suspend fun getTotalScreenTimeBetweenDates(startDate: Date, endDate: Date): Float
    
    // User Settings Operations
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateUserSettings(userSettings: UserSettings)
    
    @Query("SELECT * FROM user_settings WHERE id = 1")
    fun getUserSettings(): Flow<UserSettings?>
    
    @Query("DELETE FROM user_settings")
    suspend fun deleteAllUserSettings()
    
    // Advanced Queries
    @Query("SELECT * FROM blink_data WHERE blinkRate < :threshold AND timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp ASC")
    fun getLowBlinkRateEpisodes(threshold: Float, startDate: Date, endDate: Date): Flow<List<BlinkData>>
    
    @Query("SELECT * FROM eye_metrics WHERE drowsinessLevel > :threshold AND timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp ASC")
    fun getHighDrowsinessEpisodes(threshold: Float, startDate: Date, endDate: Date): Flow<List<EyeMetrics>>
}
