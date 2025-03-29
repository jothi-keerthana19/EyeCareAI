package com.eyecareai.util

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import org.opencv.android.OpenCVLoader
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.imgproc.Imgproc
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

/**
 * Utility class for OpenCV operations
 */
class OpenCVUtils(private val context: Context) {
    private val TAG = "OpenCVUtils"
    
    init {
        initializeOpenCV()
    }
    
    /**
     * Initializes OpenCV library
     */
    private fun initializeOpenCV() {
        if (!OpenCVLoader.initDebug()) {
            Log.e(TAG, "OpenCV initialization failed")
        } else {
            Log.d(TAG, "OpenCV initialization successful")
        }
    }
    
    /**
     * Loads a cascade classifier from assets
     */
    fun loadCascadeFromAssets(fileName: String): CascadeClassifier? {
        try {
            // Create a temporary file to store the cascade classifier
            val inputStream = context.assets.open(fileName)
            val cascadeDir = context.getDir("cascade", Context.MODE_PRIVATE)
            val cascadeFile = File(cascadeDir, fileName)
            
            val outputStream = FileOutputStream(cascadeFile)
            val buffer = ByteArray(4096)
            var bytesRead: Int
            
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
            }
            
            inputStream.close()
            outputStream.close()
            
            // Load the cascade classifier
            val cascade = CascadeClassifier(cascadeFile.absolutePath)
            
            // Delete the temporary file
            cascadeFile.delete()
            cascadeDir.delete()
            
            if (cascade.empty()) {
                Log.e(TAG, "Failed to load cascade classifier: $fileName")
                return null
            }
            
            return cascade
        } catch (e: IOException) {
            Log.e(TAG, "Error loading cascade classifier: ${e.message}")
            return null
        }
    }
    
    /**
     * Converts a Bitmap to an OpenCV Mat
     */
    fun bitmapToMat(bitmap: Bitmap): Mat {
        val mat = Mat()
        Utils.bitmapToMat(bitmap, mat)
        return mat
    }
    
    /**
     * Converts an OpenCV Mat to a Bitmap
     */
    fun matToBitmap(mat: Mat): Bitmap {
        val bitmap = Bitmap.createBitmap(mat.cols(), mat.rows(), Bitmap.Config.ARGB_8888)
        Utils.matToBitmap(mat, bitmap)
        return bitmap
    }
    
    /**
     * Calculates the Eye Aspect Ratio (EAR) for blink detection
     * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
     */
    fun calculateEAR(eyePoints: List<Point>): Float {
        if (eyePoints.size < 6) {
            return 1.0f // Default to open eye if not enough points
        }
        
        // Calculate Euclidean distances
        val distance1 = euclideanDistance(eyePoints[1], eyePoints[5])
        val distance2 = euclideanDistance(eyePoints[2], eyePoints[4])
        val distance3 = euclideanDistance(eyePoints[0], eyePoints[3])
        
        // Avoid division by zero
        if (distance3 == 0.0) {
            return 1.0f
        }
        
        // Calculate EAR
        return ((distance1 + distance2) / (2.0 * distance3)).toFloat()
    }
    
    /**
     * Calculates Euclidean distance between two points
     */
    private fun euclideanDistance(p1: Point, p2: Point): Double {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2.0) + Math.pow(p2.y - p1.y, 2.0))
    }
    
    /**
     * Detects faces in an image
     */
    fun detectFaces(mat: Mat, faceCascade: CascadeClassifier): Array<Rect> {
        // Convert to grayscale for face detection
        val grayMat = Mat()
        Imgproc.cvtColor(mat, grayMat, Imgproc.COLOR_RGBA2GRAY)
        
        // Equalize histogram for better detection in varying lighting
        Imgproc.equalizeHist(grayMat, grayMat)
        
        // Detect faces
        val faces = MatOfRect()
        faceCascade.detectMultiScale(
            grayMat, faces, 1.1, 5, 0,
            Size(30.0, 30.0), Size()
        )
        
        grayMat.release()
        
        return faces.toArray()
    }
    
    /**
     * Detects eyes within a face region
     */
    fun detectEyes(mat: Mat, faceRect: Rect, eyeCascade: CascadeClassifier): Array<Rect> {
        // Region of interest for the face
        val faceROI = mat.submat(faceRect)
        
        // Convert to grayscale for eye detection
        val grayROI = Mat()
        Imgproc.cvtColor(faceROI, grayROI, Imgproc.COLOR_RGBA2GRAY)
        
        // Equalize histogram for better detection
        Imgproc.equalizeHist(grayROI, grayROI)
        
        // Detect eyes within the face region
        val eyes = MatOfRect()
        eyeCascade.detectMultiScale(
            grayROI, eyes, 1.1, 2, 0,
            Size(20.0, 20.0), Size()
        )
        
        faceROI.release()
        grayROI.release()
        
        return eyes.toArray()
    }
    
    /**
     * Draws bounding boxes around detected faces and eyes on a Mat
     */
    fun drawDetections(mat: Mat, faces: Array<Rect>, eyes: Map<Rect, Array<Rect>>) {
        // Draw face rectangles
        for (face in faces) {
            Imgproc.rectangle(
                mat,
                Point(face.x.toDouble(), face.y.toDouble()),
                Point((face.x + face.width).toDouble(), (face.y + face.height).toDouble()),
                Scalar(0.0, 255.0, 0.0),
                2
            )
            
            // Draw eye rectangles if available for this face
            val eyesForFace = eyes[face]
            if (eyesForFace != null) {
                for (eye in eyesForFace) {
                    Imgproc.rectangle(
                        mat,
                        Point((face.x + eye.x).toDouble(), (face.y + eye.y).toDouble()),
                        Point((face.x + eye.x + eye.width).toDouble(), (face.y + eye.y + eye.height).toDouble()),
                        Scalar(255.0, 0.0, 0.0),
                        2
                    )
                }
            }
        }
    }
    
    /**
     * Releases OpenCV resources
     */
    fun release() {
        // No specific resources to release in this class
    }
}
