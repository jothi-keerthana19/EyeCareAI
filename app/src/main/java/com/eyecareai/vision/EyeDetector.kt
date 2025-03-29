package com.eyecareai.vision

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import org.opencv.android.OpenCVLoader
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.imgproc.Imgproc
import org.opencv.objdetect.CascadeClassifier
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

/**
 * Responsible for detecting eyes in camera frames using OpenCV
 */
class EyeDetector(private val context: Context) {
    
    private var faceCascade: CascadeClassifier? = null
    private var eyeCascade: CascadeClassifier? = null
    private val TAG = "EyeDetector"
    
    init {
        try {
            // Initialize OpenCV
            if (!OpenCVLoader.initDebug()) {
                Log.e(TAG, "OpenCV initialization failed")
            } else {
                Log.d(TAG, "OpenCV initialization successful")
                initializeCascadeClassifiers()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing OpenCV: ${e.message}")
        }
    }
    
    private fun initializeCascadeClassifiers() {
        try {
            // Load face cascade classifier
            val faceXml = context.assets.open("haarcascade_frontalface_alt2.xml")
            val faceFile = File(context.cacheDir, "haarcascade_frontalface_alt2.xml")
            val faceOs = FileOutputStream(faceFile)
            val faceBuffer = ByteArray(4096)
            var faceRead: Int
            while (faceXml.read(faceBuffer).also { faceRead = it } != -1) {
                faceOs.write(faceBuffer, 0, faceRead)
            }
            faceXml.close()
            faceOs.close()
            faceCascade = CascadeClassifier(faceFile.absolutePath)
            
            // Load eye cascade classifier
            val eyeXml = context.assets.open("haarcascade_eye.xml")
            val eyeFile = File(context.cacheDir, "haarcascade_eye.xml")
            val eyeOs = FileOutputStream(eyeFile)
            val eyeBuffer = ByteArray(4096)
            var eyeRead: Int
            while (eyeXml.read(eyeBuffer).also { eyeRead = it } != -1) {
                eyeOs.write(eyeBuffer, 0, eyeRead)
            }
            eyeXml.close()
            eyeOs.close()
            eyeCascade = CascadeClassifier(eyeFile.absolutePath)
            
            if (faceCascade?.empty() == true) {
                Log.e(TAG, "Failed to load face cascade classifier")
                faceCascade = null
            } else {
                Log.d(TAG, "Loaded face cascade classifier")
            }
            
            if (eyeCascade?.empty() == true) {
                Log.e(TAG, "Failed to load eye cascade classifier")
                eyeCascade = null
            } else {
                Log.d(TAG, "Loaded eye cascade classifier")
            }
        } catch (e: IOException) {
            Log.e(TAG, "Error loading cascade classifiers: ${e.message}")
        }
    }
    
    /**
     * Processes an image frame to detect eyes and face
     * 
     * @param frame The bitmap image frame from the camera
     * @return EyeDetectionResult containing detection information
     */
    fun processFrame(frame: Bitmap): EyeDetectionResult {
        if (faceCascade == null || eyeCascade == null) {
            Log.e(TAG, "Cascade classifiers not initialized")
            return EyeDetectionResult(false, null, null)
        }
        
        // Convert bitmap to OpenCV Mat
        val rgbaMat = Mat()
        val grayMat = Mat()
        
        Utils.bitmapToMat(frame, rgbaMat)
        Imgproc.cvtColor(rgbaMat, grayMat, Imgproc.COLOR_RGBA2GRAY)
        
        // Equalize histogram for better detection in varying lighting
        Imgproc.equalizeHist(grayMat, grayMat)
        
        // Detect faces
        val faces = MatOfRect()
        faceCascade?.detectMultiScale(
            grayMat, faces, 1.1, 5, 0,
            Size(30.0, 30.0), Size()
        )
        
        val facesArray = faces.toArray()
        
        if (facesArray.isEmpty()) {
            return EyeDetectionResult(false, null, null)
        }
        
        // Process the first detected face
        val faceRect = facesArray[0]
        
        // Region of interest for the face
        val faceROI = grayMat.submat(faceRect)
        
        // Detect eyes within the face region
        val eyes = MatOfRect()
        eyeCascade?.detectMultiScale(
            faceROI, eyes, 1.1, 2, 0,
            Size(20.0, 20.0), Size()
        )
        
        val eyesArray = eyes.toArray()
        
        if (eyesArray.size < 2) {
            return EyeDetectionResult(false, null, null)
        }
        
        // Sort eyes by x-coordinate to determine left and right
        eyesArray.sortBy { it.x }
        
        // Calculate eye positions relative to the frame
        val leftEye = Point(
            faceRect.x + eyesArray[0].x + eyesArray[0].width / 2,
            faceRect.y + eyesArray[0].y + eyesArray[0].height / 2
        )
        
        val rightEye = Point(
            faceRect.x + eyesArray[1].x + eyesArray[1].width / 2,
            faceRect.y + eyesArray[1].y + eyesArray[1].height / 2
        )
        
        // Release OpenCV resources
        rgbaMat.release()
        grayMat.release()
        faces.release()
        eyes.release()
        
        return EyeDetectionResult(true, leftEye, rightEye)
    }
    
    /**
     * Checks if the eyes are closed based on eye aspect ratio
     * 
     * @param leftEye Left eye region
     * @param rightEye Right eye region
     * @return Boolean indicating if eyes are likely closed
     */
    fun areEyesClosed(leftEye: Mat, rightEye: Mat): Boolean {
        // This would implement eye aspect ratio (EAR) calculation
        // for determining if eyes are closed
        // For simplicity, we'll return a placeholder implementation
        return false
    }
    
    /**
     * Clean up resources when detector is no longer needed
     */
    fun release() {
        faceCascade = null
        eyeCascade = null
    }
    
    /**
     * Class representing eye detection results
     */
    data class EyeDetectionResult(
        val eyesDetected: Boolean,
        val leftEyePosition: Point?,
        val rightEyePosition: Point?
    )
}
