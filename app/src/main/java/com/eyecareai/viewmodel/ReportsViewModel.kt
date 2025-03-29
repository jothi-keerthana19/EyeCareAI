package com.eyecareai.viewmodel

import android.app.Application
import android.net.Uri
import android.os.Environment
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eyecareai.data.EyeHealthRepository
import com.eyecareai.data.local.EyeHealthDatabase
import com.eyecareai.data.model.BlinkData
import com.eyecareai.data.model.EyeMetrics
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * ViewModel for the Reports screen
 */
class ReportsViewModel(application: Application) : AndroidViewModel(application) {
    private val TAG = "ReportsViewModel"
    
    // Repository for eye health data
    private val repository: EyeHealthRepository
    
    // UI state
    private val _uiState = MutableStateFlow(ReportsUiState())
    val uiState: StateFlow<ReportsUiState> = _uiState.asStateFlow()
    
    // Cached data
    private var cachedBlinkData: List<BlinkData> = emptyList()
    private var cachedEyeMetrics: List<EyeMetrics> = emptyList()
    
    init {
        val eyeHealthDao = EyeHealthDatabase.getDatabase(application).eyeHealthDao()
        repository = EyeHealthRepository(eyeHealthDao)
        
        // Load daily data by default
        loadDailyData()
    }
    
    /**
     * Loads eye health data for the current day
     */
    fun loadDailyData() {
        viewModelScope.launch {
            try {
                // Get daily blink data
                cachedBlinkData = repository.getBlinkDataForToday().first()
                
                // Calculate average blink rate
                val averageBlinkRate = repository.getAverageBlinkRateForToday()
                
                // Get screen time
                val screenTimeMinutes = repository.getTotalScreenTimeForToday()
                val screenTimeFormatted = formatScreenTime(screenTimeMinutes)
                
                // Get drowsy episodes
                val drowsyEpisodes = repository.countDrowsyEpisodesForToday()
                
                // Generate blink rate timeline data
                val (blinkRates, timeLabels) = generateTimelineData(cachedBlinkData)
                
                // Generate health insights
                val insights = generateHealthInsights(
                    averageBlinkRate, 
                    screenTimeMinutes, 
                    drowsyEpisodes,
                    "today"
                )
                
                // Update UI state
                _uiState.value = ReportsUiState(
                    averageBlinkRate = averageBlinkRate,
                    totalScreenTime = screenTimeFormatted,
                    screenTimeHours = screenTimeMinutes / 60f,
                    drowsyEpisodes = drowsyEpisodes,
                    blinkRates = blinkRates,
                    timeLabels = timeLabels,
                    healthInsights = insights,
                    isLoading = false
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error loading daily data: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load daily data",
                    isLoading = false
                )
            }
        }
    }
    
    /**
     * Loads eye health data for the past week
     */
    fun loadWeeklyData() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // Get weekly blink data
                cachedBlinkData = repository.getBlinkDataForPastWeek().first()
                
                // Calculate average blink rate
                val averageBlinkRate = repository.getAverageBlinkRateForPastWeek()
                
                // Get screen time
                val screenTimeMinutes = repository.getTotalScreenTimeForPastWeek()
                val screenTimeFormatted = formatScreenTime(screenTimeMinutes)
                
                // Get drowsy episodes
                val drowsyEpisodes = repository.countDrowsyEpisodesForPastWeek()
                
                // Generate blink rate timeline data
                val (blinkRates, timeLabels) = generateWeeklyTimelineData(cachedBlinkData)
                
                // Generate health insights
                val insights = generateHealthInsights(
                    averageBlinkRate, 
                    screenTimeMinutes, 
                    drowsyEpisodes,
                    "this week"
                )
                
                // Update UI state
                _uiState.value = ReportsUiState(
                    averageBlinkRate = averageBlinkRate,
                    totalScreenTime = screenTimeFormatted,
                    screenTimeHours = screenTimeMinutes / 60f,
                    drowsyEpisodes = drowsyEpisodes,
                    blinkRates = blinkRates,
                    timeLabels = timeLabels,
                    healthInsights = insights,
                    isLoading = false
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error loading weekly data: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load weekly data",
                    isLoading = false
                )
            }
        }
    }
    
    /**
     * Loads eye health data for the past month
     */
    fun loadMonthlyData() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // Get monthly blink data
                cachedBlinkData = repository.getBlinkDataForPastMonth().first()
                
                // Calculate average blink rate
                val averageBlinkRate = repository.getAverageBlinkRateForPastMonth()
                
                // Get screen time
                val screenTimeMinutes = repository.getTotalScreenTimeForPastMonth()
                val screenTimeFormatted = formatScreenTime(screenTimeMinutes)
                
                // Get drowsy episodes
                val drowsyEpisodes = repository.countDrowsyEpisodesForPastMonth()
                
                // Generate blink rate timeline data
                val (blinkRates, timeLabels) = generateMonthlyTimelineData(cachedBlinkData)
                
                // Generate health insights
                val insights = generateHealthInsights(
                    averageBlinkRate, 
                    screenTimeMinutes, 
                    drowsyEpisodes,
                    "this month"
                )
                
                // Update UI state
                _uiState.value = ReportsUiState(
                    averageBlinkRate = averageBlinkRate,
                    totalScreenTime = screenTimeFormatted,
                    screenTimeHours = screenTimeMinutes / 60f,
                    drowsyEpisodes = drowsyEpisodes,
                    blinkRates = blinkRates,
                    timeLabels = timeLabels,
                    healthInsights = insights,
                    isLoading = false
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error loading monthly data: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load monthly data",
                    isLoading = false
                )
            }
        }
    }
    
    /**
     * Formats screen time in a human-readable format
     */
    private fun formatScreenTime(minutes: Float): String {
        val hours = minutes.toInt() / 60
        val mins = minutes.toInt() % 60
        
        return if (hours > 0) {
            "$hours h $mins min"
        } else {
            "$mins min"
        }
    }
    
    /**
     * Generates timeline data for daily view
     */
    private fun generateTimelineData(blinkData: List<BlinkData>): Pair<List<Float>, List<String>> {
        // If no data is available, return empty lists
        if (blinkData.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"))
        }
        
        // Group data by hour
        val hourlyData = blinkData.groupBy { 
            val calendar = Calendar.getInstance()
            calendar.time = it.timestamp
            calendar.get(Calendar.HOUR_OF_DAY)
        }
        
        // Calculate average blink rate for each hour
        val hourlyBlinkRates = mutableListOf<Pair<Int, Float>>()
        for (hour in 0..23) {
            val hourData = hourlyData[hour]
            if (!hourData.isNullOrEmpty()) {
                val avgRate = hourData.map { it.blinkRate }.average().toFloat()
                hourlyBlinkRates.add(Pair(hour, avgRate))
            }
        }
        
        // Sort by hour
        hourlyBlinkRates.sortBy { it.first }
        
        // If no data points, return default values
        if (hourlyBlinkRates.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"))
        }
        
        // Format for display (max 6 points)
        val steps = (hourlyBlinkRates.size / 6).coerceAtLeast(1)
        val displayPoints = hourlyBlinkRates.filterIndexed { index, _ -> index % steps == 0 }
                                          .take(6)
        
        val formatter = SimpleDateFormat("h a", Locale.getDefault())
        val calendar = Calendar.getInstance()
        
        val blinkRates = displayPoints.map { it.second }
        val timeLabels = displayPoints.map { 
            calendar.set(Calendar.HOUR_OF_DAY, it.first)
            formatter.format(calendar.time)
        }
        
        return Pair(blinkRates, timeLabels)
    }
    
    /**
     * Generates timeline data for weekly view
     */
    private fun generateWeeklyTimelineData(blinkData: List<BlinkData>): Pair<List<Float>, List<String>> {
        // If no data is available, return empty lists
        if (blinkData.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
        }
        
        // Group data by day of week
        val dailyData = blinkData.groupBy { 
            val calendar = Calendar.getInstance()
            calendar.time = it.timestamp
            calendar.get(Calendar.DAY_OF_WEEK)
        }
        
        // Calculate average blink rate for each day
        val dailyBlinkRates = mutableListOf<Pair<Int, Float>>()
        for (day in 1..7) { // Calendar.SUNDAY (1) to Calendar.SATURDAY (7)
            val dayData = dailyData[day]
            if (!dayData.isNullOrEmpty()) {
                val avgRate = dayData.map { it.blinkRate }.average().toFloat()
                dailyBlinkRates.add(Pair(day, avgRate))
            }
        }
        
        // Sort by day
        dailyBlinkRates.sortBy { it.first }
        
        // If no data points, return default days
        if (dailyBlinkRates.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
        }
        
        val blinkRates = dailyBlinkRates.map { it.second }
        val timeLabels = dailyBlinkRates.map { 
            when (it.first) {
                Calendar.SUNDAY -> "Sun"
                Calendar.MONDAY -> "Mon"
                Calendar.TUESDAY -> "Tue"
                Calendar.WEDNESDAY -> "Wed"
                Calendar.THURSDAY -> "Thu"
                Calendar.FRIDAY -> "Fri"
                Calendar.SATURDAY -> "Sat"
                else -> ""
            }
        }
        
        return Pair(blinkRates, timeLabels)
    }
    
    /**
     * Generates timeline data for monthly view
     */
    private fun generateMonthlyTimelineData(blinkData: List<BlinkData>): Pair<List<Float>, List<String>> {
        // If no data is available, return empty lists
        if (blinkData.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"))
        }
        
        // Group data by week of month
        val weeklyData = blinkData.groupBy { 
            val calendar = Calendar.getInstance()
            calendar.time = it.timestamp
            calendar.get(Calendar.WEEK_OF_MONTH)
        }
        
        // Calculate average blink rate for each week
        val weeklyBlinkRates = mutableListOf<Pair<Int, Float>>()
        for (week in 1..6) { // Weeks 1-6 in a month
            val weekData = weeklyData[week]
            if (!weekData.isNullOrEmpty()) {
                val avgRate = weekData.map { it.blinkRate }.average().toFloat()
                weeklyBlinkRates.add(Pair(week, avgRate))
            }
        }
        
        // Sort by week
        weeklyBlinkRates.sortBy { it.first }
        
        // If no data points, return default weeks
        if (weeklyBlinkRates.isEmpty()) {
            return Pair(listOf(0f, 0f, 0f, 0f, 0f, 0f), 
                        listOf("Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"))
        }
        
        val blinkRates = weeklyBlinkRates.map { it.second }
        val timeLabels = weeklyBlinkRates.map { "Week ${it.first}" }
        
        return Pair(blinkRates, timeLabels)
    }
    
    /**
     * Generates personalized health insights based on metrics
     */
    private fun generateHealthInsights(
        blinkRate: Float,
        screenTimeMinutes: Float,
        drowsyEpisodes: Int,
        timePeriod: String
    ): String {
        val insights = StringBuilder()
        
        // Blink rate insights
        insights.append("Your average blink rate $timePeriod is ${blinkRate.toInt()} blinks per minute. ")
        when {
            blinkRate < 10 -> insights.append("This is significantly below the healthy range of 15-20 blinks per minute, which may lead to dry eyes. Try to consciously blink more often.")
            blinkRate < 15 -> insights.append("This is slightly below the healthy range of 15-20 blinks per minute. Consider using eye drops to maintain moisture.")
            blinkRate <= 20 -> insights.append("This is within the healthy range of 15-20 blinks per minute. Keep up the good work!")
            else -> insights.append("This is above the typical range of 15-20 blinks per minute, which might indicate eye irritation or allergies.")
        }
        
        insights.append("\n\n")
        
        // Screen time insights
        val screenTimeHours = screenTimeMinutes / 60
        insights.append("Your total screen time $timePeriod is ${formatScreenTime(screenTimeMinutes)}. ")
        when {
            screenTimeHours > 8 -> insights.append("This is a high amount of screen time. Consider reducing your screen exposure and taking more frequent breaks.")
            screenTimeHours > 5 -> insights.append("This is a moderate amount of screen time. Remember to take regular breaks using the 20-20-20 rule.")
            else -> insights.append("This is a reasonable amount of screen time. Continue taking regular breaks to maintain eye health.")
        }
        
        insights.append("\n\n")
        
        // Drowsiness insights
        insights.append("You experienced $drowsyEpisodes drowsy episodes $timePeriod. ")
        when {
            drowsyEpisodes > 5 -> insights.append("This suggests you may be experiencing significant fatigue. Consider adjusting your sleep schedule or consulting a healthcare professional.")
            drowsyEpisodes > 2 -> insights.append("This indicates occasional fatigue. Try to get more rest and take breaks when working for long periods.")
            else -> insights.append("This suggests you're maintaining good alertness levels. Continue with your current rest patterns.")
        }
        
        return insights.toString()
    }
    
    /**
     * Exports eye health data to a CSV file
     */
    fun exportData() {
        viewModelScope.launch {
            try {
                // Create a file in Downloads directory
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                val fileName = "eye_health_data_$timeStamp.csv"
                val file = File(downloadsDir, fileName)
                
                // Write data to CSV
                FileWriter(file).use { writer ->
                    // Write header
                    writer.append("Timestamp,Blink Rate,Drowsiness Level,Session Duration,Drowsiness Detected\n")
                    
                    // Write data
                    for (metric in cachedEyeMetrics) {
                        val dateStr = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
                            .format(metric.timestamp)
                        
                        writer.append("$dateStr,${metric.blinkRate},${metric.drowsinessLevel},")
                        writer.append("${metric.sessionDuration},${metric.drowsinessDetected}\n")
                    }
                }
                
                _uiState.value = _uiState.value.copy(
                    exportSuccess = "Data exported to Downloads/$fileName"
                )
                
                Log.d(TAG, "Data exported successfully to ${file.absolutePath}")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error exporting data: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to export data: ${e.message}"
                )
            }
        }
    }
    
    /**
     * UI state for the Reports screen
     */
    data class ReportsUiState(
        val averageBlinkRate: Float = 0f,
        val totalScreenTime: String = "",
        val screenTimeHours: Float = 0f,
        val drowsyEpisodes: Int = 0,
        val blinkRates: List<Float> = listOf(0f, 0f, 0f, 0f, 0f, 0f),
        val timeLabels: List<String> = listOf("8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"),
        val healthInsights: String = "Loading your personalized eye health insights...",
        val isLoading: Boolean = true,
        val errorMessage: String? = null,
        val exportSuccess: String? = null
    )
}
