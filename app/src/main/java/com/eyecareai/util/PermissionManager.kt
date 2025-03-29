package com.eyecareai.util

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Manages runtime permissions for the app
 */
class PermissionManager(private val activity: ComponentActivity) {
    
    private lateinit var cameraPermissionLauncher: ActivityResultLauncher<String>
    private lateinit var storagePermissionLauncher: ActivityResultLauncher<String>
    private lateinit var multiplePermissionsLauncher: ActivityResultLauncher<Array<String>>
    
    private var cameraPermissionCallback: ((Boolean) -> Unit)? = null
    private var storagePermissionCallback: ((Boolean) -> Unit)? = null
    private var multiplePermissionsCallback: ((Map<String, Boolean>) -> Unit)? = null
    
    init {
        setupPermissionLaunchers()
    }
    
    /**
     * Sets up the permission launchers
     */
    private fun setupPermissionLaunchers() {
        // Camera permission launcher
        cameraPermissionLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted ->
            cameraPermissionCallback?.invoke(isGranted)
        }
        
        // Storage permission launcher
        storagePermissionLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted ->
            storagePermissionCallback?.invoke(isGranted)
        }
        
        // Multiple permissions launcher
        multiplePermissionsLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            multiplePermissionsCallback?.invoke(permissions)
        }
    }
    
    /**
     * Checks if camera permission is granted
     */
    fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Checks if storage permission is granted
     */
    fun hasStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            true // Android 10+ has scoped storage, no need for storage permission
        } else {
            ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }
    
    /**
     * Requests camera permission
     * 
     * @param callback Optional callback to handle the permission result
     */
    fun requestCameraPermission(callback: ((Boolean) -> Unit)? = null) {
        when {
            hasCameraPermission() -> {
                // Permission already granted
                callback?.invoke(true)
            }
            
            ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.CAMERA
            ) -> {
                // Show permission rationale to the user
                // This should be handled by the UI
                callback?.invoke(false)
            }
            
            else -> {
                // Request the permission
                cameraPermissionCallback = callback
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }
    
    /**
     * Requests storage permission (for devices below Android 10)
     * 
     * @param callback Optional callback to handle the permission result
     */
    fun requestStoragePermission(callback: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ has scoped storage, no need for storage permission
            callback?.invoke(true)
            return
        }
        
        when {
            hasStoragePermission() -> {
                // Permission already granted
                callback?.invoke(true)
            }
            
            ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) -> {
                // Show permission rationale to the user
                // This should be handled by the UI
                callback?.invoke(false)
            }
            
            else -> {
                // Request the permission
                storagePermissionCallback = callback
                storagePermissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
    }
    
    /**
     * Requests all required permissions at once
     * 
     * @param callback Optional callback to handle the permissions result
     */
    fun requestAllPermissions(callback: ((Map<String, Boolean>) -> Unit)? = null) {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(Manifest.permission.CAMERA)
        } else {
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.READ_EXTERNAL_STORAGE
            )
        }
        
        multiplePermissionsCallback = callback
        multiplePermissionsLauncher.launch(permissions)
    }
}
