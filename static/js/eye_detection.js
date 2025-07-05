
// Eye Detection using OpenCV.js

let video = null;
let canvasOutput = null;
let canvasOutputCtx = null;
let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;
let streaming = false;

let faceClassifier = null;
let eyeClassifier = null;

let blinkCount = 0;
let lastEyeState = 'open';
let eyeClosedFrames = 0;
let lastBlinkTime = Date.now();
let blinkRates = [];

let drowsinessLevel = 0;
let lastAlertTime = 0;

// Track if OpenCV has been initialized to prevent double initialization
let isOpenCVInitialized = false;

// Motion detection variables for fallback blink detection
let previousFrame = null;
let motionThreshold = 50;
let brightnessSamples = [];
let lastMotionTime = 0;

// Initialize the video and canvas elements
function initElements() {
    video = document.getElementById('videoInput');
    canvasOutput = document.getElementById('canvasOutput');

    if (!canvasOutput) {
        console.error('Canvas output element not found');
        return;
    }

    // Set initial canvas size
    canvasOutput.width = 640;  // Default width
    canvasOutput.height = 480; // Default height

    canvasOutputCtx = canvasOutput.getContext('2d');

    // Clear the canvas
    canvasOutputCtx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);

    // Add status text while loading OpenCV
    canvasOutputCtx.font = '18px Arial';
    canvasOutputCtx.fillStyle = 'white';
    canvasOutputCtx.fillText('Loading OpenCV...', 20, 40);
}

// Setup event listeners for UI elements
function setupEventListeners() {
    const trackingButton = document.querySelector('.tracking-toggle');
    if (trackingButton) {
        trackingButton.addEventListener('click', function() {
            const isStarting = this.innerHTML.includes('Start');
            
            if (isStarting) {
                this.innerHTML = '<i class="bi bi-stop-circle"></i> Stop Tracking';
                startCamera();
                
                // Update status badge
                const statusBadge = document.querySelector('.tracking-status');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-success tracking-status';
                    statusBadge.textContent = 'Tracking Active';
                }
            } else {
                this.innerHTML = '<i class="bi bi-play-circle"></i> Start Tracking';
                stopCamera();
                
                // Update status badge
                const statusBadge = document.querySelector('.tracking-status');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-secondary tracking-status';
                    statusBadge.textContent = 'Tracking Stopped';
                }
            }
        });
    }
}

// Start the video capture
function startCamera() {
    if (!streaming) {
        updateStatus('Requesting camera access...');

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            updateStatus('Camera access not supported in this browser');
            return;
        }

        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: 'user' 
            }, 
            audio: false 
        })
        .then(function(stream) {
            video.srcObject = stream;

            // Add event listener before play to ensure it fires
            video.addEventListener('loadedmetadata', function() {
                console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);

                // Update canvas size to match video
                canvasOutput.width = video.videoWidth || 640;
                canvasOutput.height = video.videoHeight || 480;

                // Initialize or reinitialize matrices with correct dimensions
                if (src) {
                    src.delete();
                    dstC1.delete();
                    dstC3.delete();
                    if (dstC4) dstC4.delete();
                }

                updateStatus('Camera connected. Loading models...');
                loadClassifiers();
            }, { once: true });

            video.play().then(() => {
                streaming = true;
                console.log('Video started successfully');
            }).catch(err => {
                console.error('Error starting video:', err);
                updateStatus('Error starting video: ' + err.message);
            });
        })
        .catch(function(err) {
            console.error('Camera access error:', err);
            let errorMessage = 'Camera access denied';

            if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found';
            } else if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access and refresh.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera is being used by another application';
            }

            updateStatus(errorMessage);
        });
    } else {
        stopCamera();
    }
}

// Stop the video capture
function stopCamera() {
    if (streaming) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach(function(track) {
            track.stop();
        });

        video.srcObject = null;
        streaming = false;

        // Clean up OpenCV resources
        if (src) {
            src.delete();
            dstC1.delete();
            dstC3.delete();
            if (dstC4) dstC4.delete();
            src = null;
            dstC1 = null;
            dstC3 = null;
            dstC4 = null;
        }
        
        // Clean up motion detection resources
        if (previousFrame) {
            previousFrame.delete();
            previousFrame = null;
        }
        brightnessSamples = [];
        lastMotionTime = 0;

        updateStatus('Camera stopped');

        // Clear canvas
        canvasOutputCtx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);

        // Update UI elements
        const trackingButton = document.querySelector('.tracking-toggle');
        if (trackingButton) {
            trackingButton.innerHTML = '<i class="bi bi-play-circle"></i> Start Tracking';
        }

        const statusBadge = document.querySelector('.tracking-status');
        if (statusBadge) {
            statusBadge.className = 'badge bg-secondary tracking-status';
            statusBadge.textContent = 'Tracking Stopped';
        }
    }
}

// Load the face and eye classifiers
function loadClassifiers() {
    updateStatus('Loading face classifier...');

    try {
        // Load the face classifier
        faceClassifier = new cv.CascadeClassifier();
        faceClassifier.load('haarcascade_frontalface_alt2');

        updateStatus('Loading eye classifier...');

        // Load the eye classifier
        eyeClassifier = new cv.CascadeClassifier();
        eyeClassifier.load('haarcascade_eye');

        updateStatus('Classifiers loaded. Starting detection...');

        // Start processing
        setTimeout(processVideo, 0);
    } catch (error) {
        console.error('Error loading classifiers:', error);
        updateStatus('Error loading classifiers. Using backup method...');

        // Try alternative loading method
        loadClassifiersAlternative();
    }
}

// Alternative method for loading classifiers
function loadClassifiersAlternative() {
    updateStatus('Loading classifiers (alternative method)...');

    // Create classifiers without explicit loading
    faceClassifier = new cv.CascadeClassifier();
    eyeClassifier = new cv.CascadeClassifier();

    // Load using the embedded OpenCV data
    if (typeof cv !== 'undefined' && cv.FS) {
        try {
            // These are built into OpenCV.js
            faceClassifier.load('haarcascade_frontalface_alt2');
            eyeClassifier.load('haarcascade_eye');

            updateStatus('Classifiers loaded successfully. Starting detection...');
            setTimeout(processVideo, 0);
        } catch (e) {
            console.error('Alternative loading failed:', e);
            updateStatus('Failed to load classifiers. Camera detection unavailable.');
        }
    } else {
        updateStatus('OpenCV not fully loaded. Please refresh the page.');
    }
}

// Detect blinks using motion and brightness changes when face is not visible
function detectBlinkFromMotion(grayFrame) {
    try {
        // Calculate overall brightness
        const mean = cv.mean(grayFrame);
        const brightness = mean[0];
        
        // Store brightness samples for trend analysis
        brightnessSamples.push(brightness);
        if (brightnessSamples.length > 10) {
            brightnessSamples.shift();
        }
        
        // Motion detection
        if (previousFrame) {
            const diff = new cv.Mat();
            cv.absdiff(grayFrame, previousFrame, diff);
            
            const totalMotion = cv.sum(diff)[0];
            const motionIntensity = totalMotion / (grayFrame.rows * grayFrame.cols);
            
            diff.delete();
            
            // Blink detection based on motion and brightness patterns
            if (brightnessSamples.length >= 5) {
                const recentBrightness = brightnessSamples.slice(-3);
                const avgRecent = recentBrightness.reduce((a, b) => a + b, 0) / recentBrightness.length;
                const olderBrightness = brightnessSamples.slice(-6, -3);
                
                if (olderBrightness.length > 0) {
                    const avgOlder = olderBrightness.reduce((a, b) => a + b, 0) / olderBrightness.length;
                    const brightnessDrop = avgOlder - avgRecent;
                    
                    // Detect quick brightness drop (potential blink) with motion
                    if (brightnessDrop > 5 && motionIntensity > motionThreshold) {
                        const currentTime = Date.now();
                        if (currentTime - lastMotionTime > 300) { // Minimum 300ms between detections
                            lastMotionTime = currentTime;
                            return true;
                        }
                    }
                }
            }
        }
        
        // Update previous frame
        if (previousFrame) {
            previousFrame.delete();
        }
        previousFrame = grayFrame.clone();
        
        return false;
    } catch (error) {
        console.error('Motion detection error:', error);
        return false;
    }
}

// Process video frames for eye detection
function processVideo() {
    if (!streaming) {
        return;
    }

    try {
        const begin = Date.now();

        // Ensure video dimensions are valid
        if (!video.videoWidth || !video.videoHeight) {
            setTimeout(processVideo, 100);
            return;
        }

        // Create or recreate matrices if needed
        if (!src || src.rows !== video.videoHeight || src.cols !== video.videoWidth) {
            // Clean up existing matrices
            if (src) {
                src.delete();
                dstC1.delete();
                dstC3.delete();
                if (dstC4) dstC4.delete();
            }

            // Create new matrices
            src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
            dstC1 = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
            dstC3 = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC3);
            dstC4 = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        }

        // Capture frame
        const cap = new cv.VideoCapture(video);
        cap.read(src);

        // Convert to grayscale
        cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);

        // Detect faces
        let faces = new cv.RectVector();
        faceClassifier.detectMultiScale(dstC1, faces, 1.1, 3, 0);

        // Process each detected face
        let eyesDetected = 0;
        let eyesOpen = 0;
        let faceDetected = faces.size() > 0;

        for (let i = 0; i < faces.size(); ++i) {
            const face = faces.get(i);
            const faceROI = dstC1.roi(face);

            // Draw face rectangle
            const point1 = new cv.Point(face.x, face.y);
            const point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(src, point1, point2, [0, 255, 0, 255], 2);

            // Detect eyes
            let eyes = new cv.RectVector();
            eyeClassifier.detectMultiScale(faceROI, eyes, 1.1, 3, 0);

            eyesDetected += eyes.size();

            // Process detected eyes
            for (let j = 0; j < eyes.size(); ++j) {
                const eye = eyes.get(j);

                // Adjust eye coordinates relative to face
                const eyePoint1 = new cv.Point(face.x + eye.x, face.y + eye.y);
                const eyePoint2 = new cv.Point(face.x + eye.x + eye.width, face.y + eye.y + eye.height);

                // Draw eye rectangle
                cv.rectangle(src, eyePoint1, eyePoint2, [255, 0, 0, 255], 2);

                // Extract eye region for analysis
                const eyeROI = dstC1.roi(new cv.Rect(face.x + eye.x, face.y + eye.y, eye.width, eye.height));

                // Calculate Eye Aspect Ratio (EAR) for better blink detection
                const eyeAspectRatio = eye.height / eye.width;
                const mean = cv.mean(eyeROI);
                const brightness = mean[0];

                // Improved eye state detection
                // EAR threshold: typically 0.2-0.25 for closed eyes, 0.3+ for open eyes
                const isEyeOpen = eyeAspectRatio > 0.25 && brightness > 45;
                
                if (isEyeOpen) {
                    eyesOpen++;
                    cv.putText(src, `Open (${eyeAspectRatio.toFixed(2)})`, 
                              new cv.Point(face.x + eye.x, face.y + eye.y - 5),
                              cv.FONT_HERSHEY_SIMPLEX, 0.4, [0, 255, 0, 255], 1);
                } else {
                    cv.putText(src, `Closed (${eyeAspectRatio.toFixed(2)})`, 
                              new cv.Point(face.x + eye.x, face.y + eye.y - 5),
                              cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255], 1);
                }

                eyeROI.delete();
            }

            faceROI.delete();
            eyes.delete();
        }

        // Enhanced blink detection logic with fallback when no face is detected
        let currentEyeState;
        
        if (faceDetected && eyesDetected > 0) {
            // Normal detection when face and eyes are visible
            currentEyeState = (eyesOpen >= Math.ceil(eyesDetected * 0.5)) ? 'open' : 'closed';
        } else {
            // Fallback detection when face is not visible
            // Use motion detection and brightness changes as proxy for blinks
            currentEyeState = detectBlinkFromMotion(dstC1) ? 'closed' : 'open';
            
            // Display warning message
            cv.putText(src, 'Face not detected - Using motion detection', 
                      new cv.Point(20, 200),
                      cv.FONT_HERSHEY_SIMPLEX, 0.6, [255, 255, 0, 255], 2);
        }

        if (currentEyeState === 'closed' && lastEyeState === 'open') {
            // Eyes just closed - start tracking closure
            eyeClosedFrames = 1;
            console.log('Eyes closed - blink started');
        } else if (currentEyeState === 'closed') {
            // Eyes still closed - increment frame count
            eyeClosedFrames++;
        } else if (currentEyeState === 'open' && lastEyeState === 'closed') {
            // Eyes opened - check if it was a valid blink
            const blinkDurationMs = eyeClosedFrames * (1000/30); // Assuming 30 FPS
            
            // Valid blink: 50ms to 500ms duration (1-15 frames at 30fps)
            if (eyeClosedFrames >= 2 && eyeClosedFrames <= 15) {
                blinkCount++;
                const currentTime = Date.now();
                const timeSinceLastBlink = currentTime - lastBlinkTime;
                
                console.log(`Blink detected! Count: ${blinkCount}, Duration: ${blinkDurationMs}ms`);
                
                // Calculate blink rate (only if enough time has passed)
                if (timeSinceLastBlink > 500) { // At least 500ms between blinks
                    const instantBlinkRate = 60000 / timeSinceLastBlink; // blinks per minute
                    blinkRates.push(instantBlinkRate);
                    
                    // Keep only recent blink rates (last 20 blinks)
                    if (blinkRates.length > 20) {
                        blinkRates.shift();
                    }
                }
                
                lastBlinkTime = currentTime;
                
                // Visual feedback for detected blink
                cv.putText(src, `BLINK! #${blinkCount}`, new cv.Point(20, 80),
                          cv.FONT_HERSHEY_SIMPLEX, 0.7, [0, 255, 255, 255], 2);
            } else if (eyeClosedFrames > 15) {
                console.log(`Long eye closure detected: ${blinkDurationMs}ms`);
            }
            
            eyeClosedFrames = 0;
        }

        lastEyeState = currentEyeState;

        // Calculate metrics
        let avgBlinkRate = blinkRates.length > 0 
            ? blinkRates.reduce((a, b) => a + b, 0) / blinkRates.length 
            : 0;

        // Add debug information to canvas
        cv.putText(src, `Face Detected: ${faceDetected ? 'Yes' : 'No'}`, new cv.Point(20, 120),
                  cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255], 1);
        cv.putText(src, `Eyes Detected: ${eyesDetected}`, new cv.Point(20, 140),
                  cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255], 1);
        cv.putText(src, `Eyes Open: ${eyesOpen}`, new cv.Point(20, 160),
                  cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255], 1);
        cv.putText(src, `Eye State: ${currentEyeState}`, new cv.Point(20, 180),
                  cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255], 1);
        cv.putText(src, `Detection Mode: ${faceDetected ? 'Face-based' : 'Motion-based'}`, new cv.Point(20, 200),
                  cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255], 1);

        if (avgBlinkRate < 10 || eyeClosedFrames > 15) {
            drowsinessLevel = Math.min(100, drowsinessLevel + 5);
        } else {
            drowsinessLevel = Math.max(0, drowsinessLevel - 2);
        }

        // Show alerts if needed
        const now = Date.now();
        if (drowsinessLevel > 70 && now - lastAlertTime > 10000) {
            showNotification('Drowsiness Alert!', 'You appear to be drowsy. Take a break!');
            lastAlertTime = now;
        }

        // Update UI
        updateMetrics(avgBlinkRate, drowsinessLevel, eyesDetected, eyeClosedFrames);

        // Display result
        cv.imshow('canvasOutput', src);

        // Clean up
        faces.delete();

        // Schedule next frame
        const delay = 1000/30 - (Date.now() - begin);
        setTimeout(processVideo, delay > 0 ? delay : 0);

    } catch (err) {
        console.error('Processing error:', err);
        setTimeout(processVideo, 30);
    }
}

// Update metrics display
function updateMetrics(blinkRate, drowsiness, eyesDetected, eyeClosedFrames) {
    const blinkRateElement = document.querySelector('.blink-value');
    if (blinkRateElement) {
        blinkRateElement.textContent = blinkRate.toFixed(1);
    }

    const drowsinessElement = document.querySelector('.drowsiness-value');
    if (drowsinessElement) {
        drowsinessElement.textContent = drowsiness.toFixed(0) + '%';
        drowsinessElement.parentElement.style.backgroundColor = 
            drowsiness > 70 ? 'rgba(220, 53, 69, 0.8)' :
            drowsiness > 50 ? 'rgba(255, 193, 7, 0.8)' :
            'rgba(0, 0, 0, 0.5)';
    }

    document.querySelectorAll('.list-group-item .badge').forEach((badge, index) => {
        switch (index) {
            case 0:
                badge.textContent = blinkRate.toFixed(1) + ' bpm';
                break;
            case 1:
                badge.textContent = (eyeClosedFrames * 33).toFixed(0) + ' ms';
                break;
            case 2:
                badge.textContent = drowsiness.toFixed(0) + '%';
                badge.className = 'badge ' + 
                    (drowsiness > 70 ? 'bg-danger' :
                     drowsiness > 50 ? 'bg-warning' :
                     'bg-success') + ' rounded-pill';
                break;
            case 3:
                const perclos = (eyeClosedFrames > 0) ? Math.min(100, eyeClosedFrames * 3) : 0;
                badge.textContent = perclos.toFixed(0) + '%';
                break;
        }
    });

    // Update total blink count display
    const totalBlinksElement = document.querySelector('.total-blinks');
    if (totalBlinksElement) {
        totalBlinksElement.textContent = blinkCount;
    }
}

// Show notification
function showNotification(title, message) {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, { body: message });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                new Notification(title, { body: message });
            }
        });
    }

    const alertsContainer = document.getElementById('alertsContainer');
    if (alertsContainer) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertsContainer.appendChild(alertElement);
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 150);
        }, 5000);
    }
}

// Update status message
function updateStatus(message) {
    console.log('Status:', message);
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }

    if (canvasOutput && canvasOutputCtx) {
        canvasOutputCtx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
        canvasOutputCtx.font = '18px Arial';
        canvasOutputCtx.fillStyle = 'white';
        canvasOutputCtx.fillText(message, 20, 40);
    }
}

// Handle OpenCV.js loaded event
function onOpenCvReady() {
    // Prevent multiple initializations
    if (isOpenCVInitialized) {
        console.log('OpenCV already initialized, skipping...');
        return;
    }

    console.log('OpenCV.js is ready');
    isOpenCVInitialized = true;

    // Wait a bit for OpenCV to fully initialize
    setTimeout(() => {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'OpenCV.js loaded successfully. Click Start Tracking to begin.';
        }

        if (canvasOutput && canvasOutputCtx) {
            canvasOutputCtx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
            canvasOutputCtx.font = '18px Arial';
            canvasOutputCtx.fillStyle = 'white';
            canvasOutputCtx.fillText('OpenCV.js loaded successfully. Click Start Tracking to begin.', 20, 40);
        }

        console.log('OpenCV initialization complete');
    }, 100);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing elements...');
    initElements();
    setupEventListeners();

    // Set up OpenCV loading check
    const checkOpenCVInterval = setInterval(() => {
        if (typeof cv !== 'undefined' && cv.Mat && !isOpenCVInitialized) {
            console.log('OpenCV now available');
            clearInterval(checkOpenCVInterval);
            onOpenCvReady();
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkOpenCVInterval);
        if (!isOpenCVInitialized) {
            console.error('OpenCV failed to load within 10 seconds');
            updateStatus('Failed to load OpenCV. Please refresh the page.');
        }
    }, 10000);
});
