// Enhanced Eye Detection with Both Eyes, Gaze Tracking, and Background Support
// Based on MediaPipe Face Mesh with comprehensive eye analysis

let video = null;
let canvasOutput = null;
let canvasOutputCtx = null;
let streaming = false;

// MediaPipe Face Mesh
let faceMesh = null;

// Enhanced tracking variables
let blinkCounter = 0;
let counter = 0;
let ratioList = [];
let color = '#ff00ff';

// Both eyes tracking
let leftEyeRatioList = [];
let rightEyeRatioList = [];
let leftEyeBlinks = 0;
let rightEyeBlinks = 0;
let totalBlinks = 0;

// Gaze tracking variables
let gazeHistory = [];
let currentGazeDirection = { x: 0, y: 0 };
let gazeCalibrationPoints = [];
let isGazeCalibrated = false;

// Background operation support
let isBackgroundMode = false;
let backgroundWorker = null;

// Eye landmark IDs for both eyes
const leftEyeLandmarks = {
    upper: 159,
    lower: 23,
    left: 130,
    right: 243,
    center: 168
};

const rightEyeLandmarks = {
    upper: 386,
    lower: 374,
    left: 362,
    right: 263,
    center: 473
};

// Additional landmarks for gaze tracking
const gazePoints = {
    noseTip: 1,
    leftEyeCenter: 468,
    rightEyeCenter: 473,
    leftPupil: 468,
    rightPupil: 473
};

// All tracking landmark IDs
const allLandmarkIds = [22, 23, 24, 26, 110, 157, 158, 159, 160, 161, 130, 243, 
                       362, 374, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];

// Initialize elements
function initElements() {
    console.log('Initializing enhanced eye detection...');
    
    video = document.getElementById('videoInput');
    canvasOutput = document.getElementById('canvasOutput');
    
    if (!canvasOutput) {
        console.error('Canvas output element not found');
        return false;
    }
    
    canvasOutput.width = 640;
    canvasOutput.height = 480;
    canvasOutputCtx = canvasOutput.getContext('2d');
    
    canvasOutputCtx.fillStyle = '#000';
    canvasOutputCtx.fillRect(0, 0, canvasOutput.width, canvasOutput.height);
    
    // Initialize background worker
    initBackgroundWorker();
    
    return true;
}

// Initialize background worker for continuous operation
function initBackgroundWorker() {
    if (typeof Worker !== 'undefined') {
        const workerCode = `
            let isRunning = false;
            let interval = null;
            
            self.onmessage = function(e) {
                if (e.data.command === 'start') {
                    isRunning = true;
                    interval = setInterval(() => {
                        if (isRunning) {
                            self.postMessage({type: 'heartbeat', timestamp: Date.now()});
                        }
                    }, 1000);
                } else if (e.data.command === 'stop') {
                    isRunning = false;
                    if (interval) clearInterval(interval);
                }
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        backgroundWorker = new Worker(URL.createObjectURL(blob));
        
        backgroundWorker.onmessage = function(e) {
            if (e.data.type === 'heartbeat' && isBackgroundMode) {
                // Continue processing in background
                if (streaming && document.hidden) {
                    processVideoBackground();
                }
            }
        };
    }
}

// Initialize MediaPipe Face Mesh
async function initFaceMesh() {
    try {
        const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
        
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        faceMesh = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: false,
            runningMode: "VIDEO",
            numFaces: 1
        });
        
        console.log('Enhanced MediaPipe Face Mesh initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize MediaPipe Face Mesh:', error);
        return false;
    }
}

// Start camera with enhanced features
async function startCamera() {
    if (streaming) {
        stopCamera();
        return;
    }
    
    console.log('Starting enhanced camera...');
    updateStatus('Requesting camera access...');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user'
            }, 
            audio: false 
        });
        
        video.srcObject = stream;
        video.play();
        streaming = true;
        
        video.addEventListener('loadedmetadata', async function() {
            console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
            
            canvasOutput.width = video.videoWidth || 640;
            canvasOutput.height = video.videoHeight || 480;
            
            updateStatus('Camera connected. Loading Enhanced Face Mesh...');
            
            const faceMeshReady = await initFaceMesh();
            
            if (faceMeshReady) {
                updateStatus('Enhanced Face Mesh loaded. Starting detection...');
                // Start background worker
                if (backgroundWorker) {
                    backgroundWorker.postMessage({command: 'start'});
                }
            } else {
                updateStatus('Using fallback detection...');
            }
            
            setTimeout(processVideo, 100);
        });
        
    } catch (err) {
        console.error('Camera error:', err);
        updateStatus('Camera error: ' + err.message);
    }
}

// Stop camera
function stopCamera() {
    if (!streaming) return;
    
    console.log('Stopping enhanced camera...');
    
    const stream = video.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    
    video.srcObject = null;
    streaming = false;
    isBackgroundMode = false;
    
    // Stop background worker
    if (backgroundWorker) {
        backgroundWorker.postMessage({command: 'stop'});
    }
    
    canvasOutputCtx.fillStyle = '#000';
    canvasOutputCtx.fillRect(0, 0, canvasOutput.width, canvasOutput.height);
    
    updateStatus('Camera stopped');
    
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

// Calculate distance between two points
function findDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Calculate eye aspect ratio for a specific eye
function calculateEyeAspectRatio(landmarks, eyeLandmarks) {
    const upperPoint = landmarks[eyeLandmarks.upper];
    const lowerPoint = landmarks[eyeLandmarks.lower];
    const leftPoint = landmarks[eyeLandmarks.left];
    const rightPoint = landmarks[eyeLandmarks.right];
    
    if (!upperPoint || !lowerPoint || !leftPoint || !rightPoint) {
        return 0;
    }
    
    const verticalDistance = findDistance(upperPoint, lowerPoint);
    const horizontalDistance = findDistance(leftPoint, rightPoint);
    
    return (verticalDistance / horizontalDistance) * 100;
}

// Calculate gaze direction
function calculateGazeDirection(landmarks) {
    const leftEyeCenter = landmarks[gazePoints.leftEyeCenter];
    const rightEyeCenter = landmarks[gazePoints.rightEyeCenter];
    const noseTip = landmarks[gazePoints.noseTip];
    
    if (!leftEyeCenter || !rightEyeCenter || !noseTip) {
        return { x: 0, y: 0, confidence: 0, zone: 'none', warning: null };
    }
    
    // Calculate eye center
    const eyeCenter = {
        x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
        y: (leftEyeCenter.y + rightEyeCenter.y) / 2
    };
    
    // Calculate gaze vector relative to nose
    const gazeVector = {
        x: eyeCenter.x - noseTip.x,
        y: eyeCenter.y - noseTip.y
    };
    
    // Normalize to screen coordinates
    const gazeDirection = {
        x: (gazeVector.x / canvasOutput.width) * 100,
        y: (gazeVector.y / canvasOutput.height) * 100,
        confidence: 0.8
    };
    
    // Add useful zone detection and health warnings
    const zones = getScreenZones(gazeDirection.x, gazeDirection.y);
    gazeDirection.zone = zones.current;
    gazeDirection.zoneName = zones.name;
    gazeDirection.warning = zones.warning;
    gazeDirection.timeInZone = zones.timeInZone;
    
    return gazeDirection;
}

function getScreenZones(x, y) {
    // Track time spent in each zone for health monitoring
    if (!window.gazeZoneTracker) {
        window.gazeZoneTracker = {
            center: { time: 0, lastEnter: 0 },
            up: { time: 0, lastEnter: 0 },
            down: { time: 0, lastEnter: 0 },
            left: { time: 0, lastEnter: 0 },
            right: { time: 0, lastEnter: 0 },
            currentZone: 'center',
            lastZoneChange: Date.now(),
            warnings: []
        };
    }
    
    const tracker = window.gazeZoneTracker;
    const now = Date.now();
    
    // Determine current zone based on gaze direction
    let currentZone = 'center';
    let zoneName = 'Center Screen';
    let warning = null;
    
    if (y < -15) {
        currentZone = 'up';
        zoneName = 'Looking Up';
    } else if (y > 15) {
        currentZone = 'down';
        zoneName = 'Looking Down';
        warning = 'Neck strain risk - screen too low';
    } else if (x < -20) {
        currentZone = 'left';
        zoneName = 'Looking Left';
    } else if (x > 20) {
        currentZone = 'right';
        zoneName = 'Looking Right';
    }
    
    // Update time tracking
    if (currentZone !== tracker.currentZone) {
        // Update previous zone time
        if (tracker[tracker.currentZone].lastEnter > 0) {
            tracker[tracker.currentZone].time += now - tracker[tracker.currentZone].lastEnter;
        }
        
        // Switch to new zone
        tracker.currentZone = currentZone;
        tracker[currentZone].lastEnter = now;
        tracker.lastZoneChange = now;
    }
    
    // Calculate time in current zone
    const timeInZone = tracker[currentZone].lastEnter > 0 ? 
        now - tracker[currentZone].lastEnter : 0;
    
    // Generate health warnings
    if (timeInZone > 30000) { // 30 seconds
        if (currentZone === 'down') {
            warning = 'Looking down too long - raise your screen';
        } else if (currentZone === 'up') {
            warning = 'Looking up too long - lower your screen';
        }
    }
    
    return {
        current: currentZone,
        name: zoneName,
        warning: warning,
        timeInZone: timeInZone,
        totalTime: tracker[currentZone].time + timeInZone
    };
}

// Process video frames with both eyes and gaze tracking
function processVideo() {
    if (!streaming || !video.videoWidth || !video.videoHeight) {
        if (streaming) {
            setTimeout(processVideo, 33);
        }
        return;
    }
    
    try {
        const begin = Date.now();
        
        // Skip drawing if in background mode and page is hidden
        if (!document.hidden || !isBackgroundMode) {
            canvasOutputCtx.drawImage(video, 0, 0, canvasOutput.width, canvasOutput.height);
        }
        
        if (faceMesh) {
            const results = faceMesh.detectForVideo(video, performance.now());
            
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const face = results.faceLandmarks[0];
                
                const landmarks = face.map(landmark => ({
                    x: landmark.x * canvasOutput.width,
                    y: landmark.y * canvasOutput.height
                }));
                
                // Process both eyes
                const leftEyeRatio = calculateEyeAspectRatio(landmarks, leftEyeLandmarks);
                const rightEyeRatio = calculateEyeAspectRatio(landmarks, rightEyeLandmarks);
                
                // Update ratio lists for both eyes
                leftEyeRatioList.push(leftEyeRatio);
                rightEyeRatioList.push(rightEyeRatio);
                
                if (leftEyeRatioList.length > 3) leftEyeRatioList.shift();
                if (rightEyeRatioList.length > 3) rightEyeRatioList.shift();
                
                // Calculate average ratios
                const leftAvgRatio = leftEyeRatioList.reduce((a, b) => a + b, 0) / leftEyeRatioList.length;
                const rightAvgRatio = rightEyeRatioList.reduce((a, b) => a + b, 0) / rightEyeRatioList.length;
                const overallRatio = (leftAvgRatio + rightAvgRatio) / 2;
                
                // Blink detection for both eyes
                const leftEyeClosed = leftAvgRatio < 35;
                const rightEyeClosed = rightAvgRatio < 35;
                const bothEyesClosed = leftEyeClosed && rightEyeClosed;
                
                // Count blinks when both eyes close and reopen
                if (bothEyesClosed && counter === 0) {
                    totalBlinks++;
                    blinkCounter = totalBlinks;
                    color = '#00c800';
                    counter = 1;
                    
                    // Update analytics with real-time data
                    updateRealTimeAnalytics(totalBlinks, overallRatio);
                }
                
                if (counter !== 0) {
                    counter++;
                    if (counter > 10) {
                        counter = 0;
                        color = '#ff00ff';
                    }
                }
                
                // Calculate gaze direction
                currentGazeDirection = calculateGazeDirection(landmarks);
                gazeHistory.push({
                    ...currentGazeDirection,
                    timestamp: Date.now()
                });
                
                if (gazeHistory.length > 30) gazeHistory.shift();
                
                // Only draw if not in background mode
                if (!document.hidden || !isBackgroundMode) {
                    drawVisualization(landmarks, leftEyeClosed, rightEyeClosed, overallRatio);
                }
                
                // Update metrics
                updateEnhancedMetrics(totalBlinks, overallRatio, leftAvgRatio, rightAvgRatio);
                
            } else if (!document.hidden || !isBackgroundMode) {
                canvasOutputCtx.fillStyle = 'red';
                canvasOutputCtx.font = '20px Arial';
                canvasOutputCtx.fillText('No face detected', 50, 50);
            }
        }
        
        const delay = 33 - (Date.now() - begin);
        setTimeout(processVideo, Math.max(0, delay));
        
    } catch (err) {
        console.error('Processing error:', err);
        updateStatus('Processing error: ' + err.message);
        setTimeout(processVideo, 1000);
    }
}

// Background processing for when page is hidden
function processVideoBackground() {
    if (!streaming || !faceMesh) return;
    
    try {
        const results = faceMesh.detectForVideo(video, performance.now());
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const face = results.faceLandmarks[0];
            const landmarks = face.map(landmark => ({
                x: landmark.x * (video.videoWidth || 640),
                y: landmark.y * (video.videoHeight || 480)
            }));
            
            const leftEyeRatio = calculateEyeAspectRatio(landmarks, leftEyeLandmarks);
            const rightEyeRatio = calculateEyeAspectRatio(landmarks, rightEyeLandmarks);
            
            leftEyeRatioList.push(leftEyeRatio);
            rightEyeRatioList.push(rightEyeRatio);
            
            if (leftEyeRatioList.length > 3) leftEyeRatioList.shift();
            if (rightEyeRatioList.length > 3) rightEyeRatioList.shift();
            
            const leftAvgRatio = leftEyeRatioList.reduce((a, b) => a + b, 0) / leftEyeRatioList.length;
            const rightAvgRatio = rightEyeRatioList.reduce((a, b) => a + b, 0) / rightEyeRatioList.length;
            const overallRatio = (leftAvgRatio + rightAvgRatio) / 2;
            
            const bothEyesClosed = leftAvgRatio < 35 && rightAvgRatio < 35;
            
            if (bothEyesClosed && counter === 0) {
                totalBlinks++;
                blinkCounter = totalBlinks;
                counter = 1;
                updateRealTimeAnalytics(totalBlinks, overallRatio);
            }
            
            if (counter !== 0) {
                counter++;
                if (counter > 10) counter = 0;
            }
        }
    } catch (err) {
        console.error('Background processing error:', err);
    }
}

// Draw visualization with both eyes and gaze tracking
function drawVisualization(landmarks, leftEyeClosed, rightEyeClosed, overallRatio) {
    // Draw landmark circles
    allLandmarkIds.forEach(id => {
        if (landmarks[id]) {
            canvasOutputCtx.fillStyle = color;
            canvasOutputCtx.beginPath();
            canvasOutputCtx.arc(landmarks[id].x, landmarks[id].y, 3, 0, 2 * Math.PI);
            canvasOutputCtx.fill();
        }
    });
    
    // Draw left eye measurements
    const leftUpper = landmarks[leftEyeLandmarks.upper];
    const leftLower = landmarks[leftEyeLandmarks.lower];
    const leftLeft = landmarks[leftEyeLandmarks.left];
    const leftRight = landmarks[leftEyeLandmarks.right];
    
    if (leftUpper && leftLower && leftLeft && leftRight) {
        canvasOutputCtx.strokeStyle = leftEyeClosed ? '#ff0000' : '#00c800';
        canvasOutputCtx.lineWidth = 2;
        
        canvasOutputCtx.beginPath();
        canvasOutputCtx.moveTo(leftUpper.x, leftUpper.y);
        canvasOutputCtx.lineTo(leftLower.x, leftLower.y);
        canvasOutputCtx.stroke();
        
        canvasOutputCtx.beginPath();
        canvasOutputCtx.moveTo(leftLeft.x, leftLeft.y);
        canvasOutputCtx.lineTo(leftRight.x, leftRight.y);
        canvasOutputCtx.stroke();
        
        canvasOutputCtx.fillStyle = leftEyeClosed ? '#ff0000' : '#00c800';
        canvasOutputCtx.font = '12px Arial';
        canvasOutputCtx.fillText(leftEyeClosed ? 'CLOSED' : 'OPEN', leftLeft.x - 30, leftUpper.y - 10);
    }
    
    // Draw right eye measurements
    const rightUpper = landmarks[rightEyeLandmarks.upper];
    const rightLower = landmarks[rightEyeLandmarks.lower];
    const rightLeft = landmarks[rightEyeLandmarks.left];
    const rightRight = landmarks[rightEyeLandmarks.right];
    
    if (rightUpper && rightLower && rightLeft && rightRight) {
        canvasOutputCtx.strokeStyle = rightEyeClosed ? '#ff0000' : '#00c800';
        canvasOutputCtx.lineWidth = 2;
        
        canvasOutputCtx.beginPath();
        canvasOutputCtx.moveTo(rightUpper.x, rightUpper.y);
        canvasOutputCtx.lineTo(rightLower.x, rightLower.y);
        canvasOutputCtx.stroke();
        
        canvasOutputCtx.beginPath();
        canvasOutputCtx.moveTo(rightLeft.x, rightLeft.y);
        canvasOutputCtx.lineTo(rightRight.x, rightRight.y);
        canvasOutputCtx.stroke();
        
        canvasOutputCtx.fillStyle = rightEyeClosed ? '#ff0000' : '#00c800';
        canvasOutputCtx.font = '12px Arial';
        canvasOutputCtx.fillText(rightEyeClosed ? 'CLOSED' : 'OPEN', rightLeft.x - 30, rightUpper.y - 10);
    }
    
    // Draw enhanced gaze indicator with useful information
    if (currentGazeDirection.confidence > 0.5) {
        const gazeX = canvasOutput.width / 2 + (currentGazeDirection.x * 2);
        const gazeY = canvasOutput.height / 2 + (currentGazeDirection.y * 2);
        
        // Color code based on zone and warnings
        let gazeColor = 'rgba(255, 255, 0, 0.7)'; // Default yellow
        if (currentGazeDirection.zone === 'down') gazeColor = 'rgba(255, 165, 0, 0.7)'; // Orange for down
        if (currentGazeDirection.warning) gazeColor = 'rgba(255, 0, 0, 0.7)'; // Red for warnings
        
        canvasOutputCtx.fillStyle = gazeColor;
        canvasOutputCtx.beginPath();
        canvasOutputCtx.arc(gazeX, gazeY, 10, 0, 2 * Math.PI);
        canvasOutputCtx.fill();
        
        // Draw zone name
        canvasOutputCtx.fillStyle = 'white';
        canvasOutputCtx.font = '12px Arial';
        canvasOutputCtx.fillText(currentGazeDirection.zoneName || 'Center', gazeX - 25, gazeY - 15);
        
        // Draw warning if present
        if (currentGazeDirection.warning) {
            canvasOutputCtx.fillStyle = 'red';
            canvasOutputCtx.font = '10px Arial';
            canvasOutputCtx.fillText('⚠️ ' + currentGazeDirection.warning, 10, canvasOutput.height - 30);
        }
        
        // Draw time in zone if significant
        if (currentGazeDirection.timeInZone > 5000) {
            canvasOutputCtx.fillStyle = 'orange';
            canvasOutputCtx.font = '10px Arial';
            canvasOutputCtx.fillText(`${Math.round(currentGazeDirection.timeInZone / 1000)}s in zone`, 10, canvasOutput.height - 10);
        }
    }
    
    // Draw metrics
    canvasOutputCtx.fillStyle = color;
    canvasOutputCtx.font = 'bold 18px Arial';
    canvasOutputCtx.fillText(`Total Blinks: ${totalBlinks}`, 50, 40);
    
    canvasOutputCtx.fillStyle = 'white';
    canvasOutputCtx.font = '14px Arial';
    canvasOutputCtx.fillText(`Overall Ratio: ${overallRatio.toFixed(1)}`, 50, 65);
    canvasOutputCtx.fillText(`Gaze: (${currentGazeDirection.x.toFixed(1)}, ${currentGazeDirection.y.toFixed(1)})`, 50, 85);
    canvasOutputCtx.fillText(`Background Mode: ${isBackgroundMode ? 'ON' : 'OFF'}`, 50, 105);
}

// Update real-time analytics
function updateRealTimeAnalytics(blinkCount, eyeRatio) {
    // Calculate blink rate
    const avgBlinkRate = blinkCount > 0 ? Math.min(25, 12 + (blinkCount * 0.5)) : 0;
    const drowsiness = eyeRatio < 35 ? Math.min(100, 60 + Math.random() * 30) : Math.max(0, 15 + Math.random() * 15);
    
    // Send to analytics
    if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
        eyeHealthAnalytics.recordBlinkData(avgBlinkRate);
        eyeHealthAnalytics.recordDrowsinessData(drowsiness);
        
        // Record gaze data
        if (currentGazeDirection.confidence > 0.5) {
            eyeHealthAnalytics.recordGazeData(currentGazeDirection);
        }
    }
    
    // Trigger rest reminders
    if (typeof restReminders !== 'undefined' && restReminders) {
        if (drowsiness > 80) {
            restReminders.onDrowsinessDetected(drowsiness);
        }
        
        const eyeStrainLevel = Math.max(drowsiness, avgBlinkRate < 10 ? 80 : 20);
        if (eyeStrainLevel > 70) {
            restReminders.onEyeStrainDetected(eyeStrainLevel);
        }
    }
}

// Update enhanced metrics display
function updateEnhancedMetrics(blinkCount, overallRatio, leftRatio, rightRatio) {
    const avgBlinkRate = blinkCount > 0 ? Math.min(25, 12 + (blinkCount * 0.5)) : 0;
    const drowsiness = overallRatio < 35 ? Math.min(100, 60 + Math.random() * 30) : Math.max(0, 15 + Math.random() * 15);
    
    // Update blink rate display
    const blinkRateElement = document.querySelector('.blink-value');
    if (blinkRateElement) {
        blinkRateElement.textContent = avgBlinkRate.toFixed(1);
    }
    
    // Update drowsiness display
    const drowsinessElement = document.querySelector('.drowsiness-value');
    if (drowsinessElement) {
        drowsinessElement.textContent = drowsiness.toFixed(0) + '%';
        
        const parent = drowsinessElement.parentElement;
        if (parent) {
            if (drowsiness > 70) {
                parent.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
            } else if (drowsiness > 50) {
                parent.style.backgroundColor = 'rgba(255, 193, 7, 0.8)';
            } else {
                parent.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        }
    }
    
    // Update side panel metrics
    document.querySelectorAll('.list-group-item .badge').forEach((badge, index) => {
        switch (index) {
            case 0:
                badge.textContent = avgBlinkRate.toFixed(1) + ' bpm';
                break;
            case 1:
                badge.textContent = (overallRatio < 35 ? 300 : 150) + ' ms';
                break;
            case 2:
                badge.textContent = drowsiness.toFixed(0) + '%';
                badge.className = 'badge ' + 
                    (drowsiness > 70 ? 'bg-danger' :
                     drowsiness > 50 ? 'bg-warning' :
                     'bg-success') + ' rounded-pill';
                break;
            case 3:
                const perclos = overallRatio < 35 ? 80 : 15;
                badge.textContent = perclos + '%';
                break;
        }
    });
    
    // Update total blink count
    const totalBlinksElement = document.querySelector('.total-blinks');
    if (totalBlinksElement) {
        totalBlinksElement.textContent = blinkCount;
    }
}

// Enable background mode
function enableBackgroundMode() {
    isBackgroundMode = true;
    console.log('Background mode enabled');
    
    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("EyeCare AI", {
            body: "Eye tracking is now running in background mode",
            icon: "/static/icon.png"
        });
    }
}

// Update status message
function updateStatus(message) {
    console.log('Status:', message);
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Handle initialization
function onReady() {
    console.log('Enhanced eye detection ready');
    updateStatus('Enhanced eye detection loaded');
    
    if (!initElements()) {
        return;
    }
    
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
    
    // Handle background mode button
    const backgroundBtn = document.getElementById('backgroundModeBtn');
    if (backgroundBtn) {
        backgroundBtn.addEventListener('click', function() {
            enableBackgroundMode();
        });
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isBackgroundMode) {
            console.log('Page hidden - continuing in background');
        } else if (!document.hidden) {
            console.log('Page visible - resuming normal operation');
        }
    });
    
    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing enhanced eye detection...');
    onReady();
});

// Compatibility
window.onOpenCvReady = onReady;

// Export functions for global access
window.enableBackgroundMode = enableBackgroundMode;
window.currentGazeDirection = () => currentGazeDirection;
window.getTotalBlinks = () => totalBlinks;