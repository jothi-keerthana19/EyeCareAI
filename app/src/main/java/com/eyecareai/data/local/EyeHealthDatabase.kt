package com.eyecareai.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.eyecareai.data.model.BlinkData
import com.eyecareai.data.model.EyeMetrics
import com.eyecareai.data.model.UserSettings
import com.eyecareai.util.DateConverter

/**
 * Room database for eye health tracking data
 */
@Database(
    entities = [BlinkData::class, EyeMetrics::class, UserSettings::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DateConverter::class)
abstract class EyeHealthDatabase : RoomDatabase() {
    
    abstract fun eyeHealthDao(): EyeHealthDao
    
    companion object {
        @Volatile
        private var INSTANCE: EyeHealthDatabase? = null
        
        fun getDatabase(context: Context): EyeHealthDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    EyeHealthDatabase::class.java,
                    "eye_health_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

