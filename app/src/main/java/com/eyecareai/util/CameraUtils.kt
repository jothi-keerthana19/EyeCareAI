package com.eyecareai.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import android.view.Surface
import android.view.View
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

/**
 * Utility class for camera operations using CameraX
 */
class CameraUtils(private val context: Context) {
    private val TAG = "CameraUtils"
    
    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var imageAnalyzer: ImageAnalysis? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    
    /**
     * Sets up the camera for preview and analysis
     *
     * @param lifecycleOwner The lifecycle owner for camera
     * @param previewView The PreviewView for displaying camera feed
     * @param analyzer The ImageAnalysis.Analyzer for processing frames
     * @return The Camera instance
     */
    suspend fun setupCamera(
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView,
        analyzer: ImageAnalysis.Analyzer
    ): Camera? {
        return suspendCoroutine { continuation ->
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            
            cameraProviderFuture.addListener({
                try {
                    // Camera provider is now guaranteed to be available
                    cameraProvider = cameraProviderFuture.get()
                    
                    // Build and bind the camera use cases
                    val camera = bindCameraUseCases(lifecycleOwner, previewView, analyzer)
                    continuation.resume(camera)
                } catch (e: Exception) {
                    Log.e(TAG, "Use case binding failed", e)
                    continuation.resumeWithException(e)
                }
            }, ContextCompat.getMainExecutor(context))
        }
    }
    
    /**
     * Binds camera use cases: preview and image analysis
     */
    private fun bindCameraUseCases(
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView,
        analyzer: ImageAnalysis.Analyzer
    ): Camera? {
        val cameraProvider = cameraProvider ?: return null
        
        // Set up the preview use case
        val preview = Preview.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .build()
            .also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

        // Set up the image analyzer
        imageAnalyzer = ImageAnalysis.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also {
                it.setAnalyzer(cameraExecutor, analyzer)
            }

        // Select front camera
        val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

        try {
            // Unbind use cases before rebinding
            cameraProvider.unbindAll()

            // Bind use cases to camera
            camera = cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalyzer
            )

            return camera
        } catch (e: Exception) {
            Log.e(TAG, "Use case binding failed", e)
            return null
        }
    }
    
    /**
     * Converts an image proxy to a bitmap
     */
    fun imageProxyToBitmap(imageProxy: ImageProxy): Bitmap? {
        val buffer = imageProxy.planes[0].buffer
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)
        
        val yuvImage = android.graphics.YuvImage(
            bytes,
            android.graphics.ImageFormat.NV21,
            imageProxy.width,
            imageProxy.height,
            null
        )
        
        val out = java.io.ByteArrayOutputStream()
        yuvImage.compressToJpeg(
            android.graphics.Rect(0, 0, imageProxy.width, imageProxy.height),
            100,
            out
        )
        val imageBytes = out.toByteArray()
        
        val bitmap = android.graphics.BitmapFactory.decodeByteArray(
            imageBytes, 0, imageBytes.size
        )
        
        // Rotate the bitmap based on the image rotation
        val rotatedBitmap = rotateBitmap(bitmap, imageProxy.imageInfo.rotationDegrees)
        
        // Recycle the original bitmap if needed
        if (rotatedBitmap != bitmap) {
            bitmap.recycle()
        }
        
        return rotatedBitmap
    }
    
    /**
     * Rotates a bitmap by the specified degrees
     */
    private fun rotateBitmap(bitmap: Bitmap, degrees: Int): Bitmap {
        if (degrees == 0) return bitmap
        
        val matrix = Matrix()
        matrix.postRotate(degrees.toFloat())
        
        return Bitmap.createBitmap(
            bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true
        )
    }
    
    /**
     * Creates a camera preview view for use in the UI
     */
    fun createCameraPreviewView(context: Context): PreviewView {
        return PreviewView(context).apply {
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }
    
    /**
     * Stops and releases camera resources
     */
    fun shutdown() {
        cameraExecutor.shutdown()
        imageAnalyzer?.clearAnalyzer()
        cameraProvider?.unbindAll()
    }
}
