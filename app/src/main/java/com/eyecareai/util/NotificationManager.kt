package com.eyecareai.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.eyecareai.MainActivity
import com.eyecareai.R

/**
 * Manages notifications for eye health alerts
 */
class NotificationManager(private val context: Context) {
    
    companion object {
        private const val CHANNEL_ID_ALERTS = "eye_health_alerts"
        private const val CHANNEL_ID_REMINDERS = "eye_health_reminders"
        
        const val NOTIFICATION_ID_DROWSINESS = 1001
        const val NOTIFICATION_ID_BLINK_REMINDER = 1002
        const val NOTIFICATION_ID_BREAK_REMINDER = 1003
    }
    
    init {
        createNotificationChannels()
    }
    
    /**
     * Creates notification channels for Android O and above
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create the high priority alert channel
            val alertChannel = NotificationChannel(
                CHANNEL_ID_ALERTS,
                "Eye Health Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Important alerts about eye health and drowsiness"
                enableVibration(true)
                enableLights(true)
            }
            
            // Create the normal priority reminder channel
            val reminderChannel = NotificationChannel(
                CHANNEL_ID_REMINDERS,
                "Eye Health Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Regular reminders for blink breaks and screen time"
            }
            
            // Register the channels with the system
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(alertChannel)
            notificationManager.createNotificationChannel(reminderChannel)
        }
    }
    
    /**
     * Shows a drowsiness alert notification
     */
    fun showDrowsinessAlert() {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val builder = NotificationCompat.Builder(context, CHANNEL_ID_ALERTS)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // Replace with appropriate icon
            .setContentTitle(context.getString(R.string.alert_drowsy))
            .setContentText(context.getString(R.string.alert_drowsy_desc))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 250, 500))
        
        notify(NOTIFICATION_ID_DROWSINESS, builder.build())
        vibrate()
    }
    
    /**
     * Shows a blink reminder notification
     */
    fun showBlinkReminder() {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val builder = NotificationCompat.Builder(context, CHANNEL_ID_REMINDERS)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // Replace with appropriate icon
            .setContentTitle(context.getString(R.string.alert_blink))
            .setContentText(context.getString(R.string.alert_blink_desc))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
        
        notify(NOTIFICATION_ID_BLINK_REMINDER, builder.build())
    }
    
    /**
     * Shows a break reminder notification
     */
    fun showBreakReminder() {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val builder = NotificationCompat.Builder(context, CHANNEL_ID_REMINDERS)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // Replace with appropriate icon
            .setContentTitle(context.getString(R.string.alert_break))
            .setContentText(context.getString(R.string.alert_break_desc))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
        
        notify(NOTIFICATION_ID_BREAK_REMINDER, builder.build())
    }
    
    /**
     * Notifies with the given id and notification
     */
    private fun notify(id: Int, notification: android.app.Notification) {
        with(NotificationManagerCompat.from(context)) {
            try {
                notify(id, notification)
            } catch (e: SecurityException) {
                // Permission might be denied
            }
        }
    }
    
    /**
     * Triggers device vibration for alerts
     */
    private fun vibrate() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(500)
                }
            }
        } catch (e: Exception) {
            // Vibration may not be available on all devices
        }
    }
    
    /**
     * Cancels a specific notification
     */
    fun cancelNotification(notificationId: Int) {
        NotificationManagerCompat.from(context).cancel(notificationId)
    }
    
    /**
     * Cancels all notifications
     */
    fun cancelAllNotifications() {
        NotificationManagerCompat.from(context).cancelAll()
    }
}
