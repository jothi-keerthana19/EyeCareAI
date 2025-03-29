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
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                updateStatus('Camera connected. Loading models...');
                streaming = true;
                
                // Wait for video metadata to load to set canvas dimensions
                video.addEventListener('loadedmetadata', function() {
                    canvasOutput.width = video.videoWidth;
                    canvasOutput.height = video.videoHeight;
                    loadClassifiers();
                });
            })
            .catch(function(err) {
                console.error('An error occurred: ' + err);
                updateStatus('Camera error: ' + err.message);
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
        updateStatus('Camera stopped');
        
        // Clear canvas
        canvasOutputCtx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
        
        // Update button text
        const trackingButton = document.querySelector('.tracking-toggle');
        if (trackingButton) {
            trackingButton.innerHTML = '<i class="bi bi-play-circle"></i> Start Tracking';
        }
        
        // Update status badge
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
}

// Process video frames for eye detection
function processVideo() {
    if (!streaming) {
        return;
    }
    
    try {
        const begin = Date.now();
        
        // Create OpenCV matrices
        if (!src) {
            src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            dstC1 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            dstC3 = new cv.Mat(video.height, video.width, cv.CV_8UC3);
            dstC4 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        }
        
        // Capture a frame from the video
        const cap = new cv.VideoCapture(video);
        cap.read(src);
        
        // Convert the image to grayscale
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
            
            // Create rectangle around the face
            const point1 = new cv.Point(face.x, face.y);
            const point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(src, point1, point2, [0, 255, 0, 255], 2);
            
            // Detect eyes within the face region
            let eyes = new cv.RectVector();
            eyeClassifier.detectMultiScale(faceROI, eyes, 1.1, 3, 0);
            
            eyesDetected = eyes.size();
            
            // Process each detected eye
            for (let j = 0; j < eyes.size(); ++j) {
                const eye = eyes.get(j);
                
                // Adjust eye coordinates relative to the face
                const eyePoint1 = new cv.Point(face.x + eye.x, face.y + eye.y);
                const eyePoint2 = new cv.Point(face.x + eye.x + eye.width, face.y + eye.y + eye.height);
                
                // Create rectangle around the eye
                cv.rectangle(src, eyePoint1, eyePoint2, [255, 0, 0, 255], 2);
                
                // Extract the eye region for analysis
                const eyeROI = dstC1.roi(new cv.Rect(face.x + eye.x, face.y + eye.y, eye.width, eye.height));
                
                // Simple analysis: if the eye height is very small, consider it closed
                if (eye.height > eye.width * 0.35) {
                    eyesOpen++;
                }
                
                eyeROI.delete();
            }
            
            faceROI.delete();
            eyes.delete();
        }
        
        // Detect blinks based on eye state changes
        const currentEyeState = (eyesOpen >= eyesDetected * 0.5) ? 'open' : 'closed';
        
        if (currentEyeState === 'closed' && lastEyeState === 'open') {
            // Eye just closed - potential start of a blink
            eyeClosedFrames = 1;
        } else if (currentEyeState === 'closed' && lastEyeState === 'closed') {
            // Eye still closed
            eyeClosedFrames++;
        } else if (currentEyeState === 'open' && lastEyeState === 'closed') {
            // Eye just reopened - potential end of a blink
            if (eyeClosedFrames >= 1 && eyeClosedFrames <= 7) {  // Normal blink is 100-400ms (3-12 frames at 30fps)
                blinkCount++;
                const blinkTime = Date.now();
                
                // Calculate blink rate (blinks per minute)
                const timeDiff = blinkTime - lastBlinkTime;
                if (timeDiff > 0) {
                    const blinkRate = 60000 / timeDiff;  // Convert to blinks per minute
                    blinkRates.push(blinkRate);
                    
                    // Keep only the last 10 blink rates for the average
                    if (blinkRates.length > 10) {
                        blinkRates.shift();
                    }
                }
                
                lastBlinkTime = blinkTime;
            }
            eyeClosedFrames = 0;
        }
        
        lastEyeState = currentEyeState;
        
        // Calculate average blink rate
        let avgBlinkRate = 0;
        if (blinkRates.length > 0) {
            avgBlinkRate = blinkRates.reduce((a, b) => a + b, 0) / blinkRates.length;
        }
        
        // Calculate drowsiness level based on blink rate and eye closure time
        // Low blink rate or long closure time indicates drowsiness
        if (avgBlinkRate < 10 || eyeClosedFrames > 15) {  // If eyes closed for more than 0.5 seconds
            drowsinessLevel = Math.min(100, drowsinessLevel + 5);
        } else {
            drowsinessLevel = Math.max(0, drowsinessLevel - 2);
        }
        
        // Check for alerts
        const now = Date.now();
        if (drowsinessLevel > 70 && now - lastAlertTime > 10000) {  // Alert every 10 seconds if drowsy
            showNotification('Drowsiness Alert!', 'You appear to be drowsy. Take a break!');
            lastAlertTime = now;
        } else if (avgBlinkRate < 12 && avgBlinkRate > 0 && now - lastAlertTime > 30000) {  // Alert every 30 seconds if low blink rate
            showNotification('Low Blink Rate', 'Your blink rate is low. Remember to blink more frequently.');
            lastAlertTime = now;
        }
        
        // Update UI elements with detection results
        updateMetrics(avgBlinkRate, drowsinessLevel, eyesDetected, eyeClosedFrames);
        
        // Display the result
        cv.imshow('canvasOutput', src);
        
        // Clean up
        faces.delete();
        
        // Calculate processing time and request next frame
        const delay = 1000 / 30 - (Date.now() - begin);
        setTimeout(processVideo, delay > 0 ? delay : 0);
    } catch (err) {
        console.error(err);
        updateStatus('Error: ' + err.message);
    }
}

// Update the metrics display in the UI
function updateMetrics(blinkRate, drowsiness, eyesDetected, eyeClosedFrames) {
    // Update blink rate display
    const blinkRateElement = document.querySelector('.blink-value');
    if (blinkRateElement) {
        blinkRateElement.textContent = blinkRate.toFixed(1);
    }
    
    // Update drowsiness display
    const drowsinessElement = document.querySelector('.drowsiness-value');
    if (drowsinessElement) {
        drowsinessElement.textContent = drowsiness.toFixed(0) + '%';
        
        // Update drowsiness color based on level
        if (drowsiness > 70) {
            drowsinessElement.parentElement.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
        } else if (drowsiness > 50) {
            drowsinessElement.parentElement.style.backgroundColor = 'rgba(255, 193, 7, 0.8)';
        } else {
            drowsinessElement.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
    }
    
    // Update metrics in the side panel
    document.querySelectorAll('.list-group-item .badge').forEach((badge, index) => {
        switch (index) {
            case 0:  // Blink Rate
                badge.textContent = blinkRate.toFixed(1) + ' bpm';
                break;
            case 1:  // Blink Duration
                badge.textContent = (eyeClosedFrames * 33).toFixed(0) + ' ms';
                break;
            case 2:  // Drowsiness Level
                badge.textContent = drowsiness.toFixed(0) + '%';
                // Update badge color based on drowsiness level
                if (drowsiness > 70) {
                    badge.className = 'badge bg-danger rounded-pill';
                } else if (drowsiness > 50) {
                    badge.className = 'badge bg-warning rounded-pill';
                } else {
                    badge.className = 'badge bg-success rounded-pill';
                }
                break;
            case 3:  // PERCLOS
                const perclos = (eyeClosedFrames > 0) ? Math.min(100, eyeClosedFrames * 3) : 0;
                badge.textContent = perclos.toFixed(0) + '%';
                break;
        }
    });
}

// Display a browser notification
function showNotification(title, message) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
    }
    
    // Check notification permission
    if (Notification.permission === "granted") {
        new Notification(title, { body: message });
    } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                new Notification(title, { body: message });
            }
        });
    }
    
    // Also show an in-app alert
    const alertsContainer = document.getElementById('alertsContainer');
    if (alertsContainer) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertsContainer.appendChild(alertElement);
        
        // Auto dismiss after 5 seconds
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
    document.getElementById('status').textContent = 'OpenCV.js loaded';
    console.log('OpenCV.js loaded');
    
    initElements();
    
    // Handle camera toggle button
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
    
    // Request notification permission on page load
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Initialize when the page loads
window.onload = function() {
    // Check if OpenCV.js is already loaded
    if (typeof cv !== 'undefined') {
        onOpenCvReady();
    }
};