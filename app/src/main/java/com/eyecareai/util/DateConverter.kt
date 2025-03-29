package com.eyecareai.util

import androidx.room.TypeConverter
import java.util.Date

/**
 * Type converter for Room database to handle Date objects
 */
class DateConverter {
    
    /**
     * Converts a Date object to a Long timestamp for database storage
     */
    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }
    
    /**
     * Converts a Long timestamp to a Date object when reading from database
     */
    @TypeConverter
    fun timestampToDate(timestamp: Long?): Date? {
        return timestamp?.let { Date(it) }
    }
}
