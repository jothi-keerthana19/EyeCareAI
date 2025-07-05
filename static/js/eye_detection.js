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

            eyesDetected = eyes.size();

            // Process detected eyes
            for (let j = 0; j < eyes.size(); ++j) {
                const eye = eyes.get(j);

                // Adjust eye coordinates relative to face
                const eyePoint1 = new cv.Point(face.x + eye.x, face.y + eye.y);
                const eyePoint2 = new cv.Point(face.x + eye.x + eye.width, face.y + eye.y + eye.height);

                // Draw eye rectangle
                cv.rectangle(src, eyePoint1, eyePoint2, [255, 0, 0, 255], 2);

                // Extract eye region
                const eyeROI = dstC1.roi(new cv.Rect(face.x + eye.x, face.y + eye.y, eye.width, eye.height));

                // Analyze eye state
                const mean = cv.mean(eyeROI);
                const brightness = mean[0];

                if (eye.height > eye.width * 0.35 && brightness > 50) {
                    eyesOpen++;
                    cv.putText(src, "Open", new cv.Point(face.x + eye.x, face.y + eye.y - 5),
                              cv.FONT_HERSHEY_SIMPLEX, 0.5, [0, 255, 0, 255], 1);
                } else {
                    cv.putText(src, "Closed", new cv.Point(face.x + eye.x, face.y + eye.y - 5),
                              cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 0, 0, 255], 1);
                }

                eyeROI.delete();
            }

            faceROI.delete();
            eyes.delete();
        }

        // Update blink detection
        const currentEyeState = (eyesOpen >= eyesDetected * 0.5) ? 'open' : 'closed';

        if (currentEyeState === 'closed' && lastEyeState === 'open') {
            eyeClosedFrames = 1;
        } else if (currentEyeState === 'closed') {
            eyeClosedFrames++;
        } else if (currentEyeState === 'open' && lastEyeState === 'closed') {
            if (eyeClosedFrames >= 1 && eyeClosedFrames <= 7) {
                blinkCount++;
                const blinkTime = Date.now();
                const timeDiff = blinkTime - lastBlinkTime;

                if (timeDiff > 0) {
                    const blinkRate = 60000 / timeDiff;
                    blinkRates.push(blinkRate);
                    if (blinkRates.length > 10) blinkRates.shift();
                }

                lastBlinkTime = blinkTime;
            }
            eyeClosedFrames = 0;
        }

        lastEyeState = currentEyeState;

        // Calculate metrics
        let avgBlinkRate = blinkRates.length > 0 
            ? blinkRates.reduce((a, b) => a + b, 0) / blinkRates.length 
            : 0;

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
            statusElement.textContent = 'OpenCV.js loaded successfully';
        }
        
        // Only initialize if not already done
        if (!video || !canvasOutput) {
            initElements();
        }
        if (!document.querySelector('.tracking-toggle').onclick) {
            setupEventListeners();
        }
    }, 100);
}

// Setup event listeners
function setupEventListeners() {
    const trackingButton = document.querySelector('.tracking-toggle');
    if (trackingButton) {
        trackingButton.addEventListener('click', function() {
            if (!streaming) {
                startCamera();
                this.innerHTML = '<i class="bi bi-pause-circle"></i> Pause Tracking';

                const statusBadge = document.querySelector('.tracking-status');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-success tracking-status';
                    statusBadge.textContent = 'Tracking Active';
                }
            } else {
                stopCamera();
                this.innerHTML = '<i class="bi bi-play-circle"></i> Start Tracking';

                const statusBadge = document.querySelector('.tracking-status');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-secondary tracking-status';
                    statusBadge.textContent = 'Tracking Stopped';
                }
            }
        });
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Track if OpenCV has been initialized to prevent double initialization
let isOpenCVInitialized = false;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing elements...');
    initElements();
    setupEventListeners();
    
    // Check if OpenCV is already loaded
    if (typeof cv !== 'undefined' && cv.Mat && !isOpenCVInitialized) {
        console.log('OpenCV already available');
        onOpenCvReady();
    }
});