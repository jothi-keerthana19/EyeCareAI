// Eye-Based Interaction System for Accessibility
// Provides hands-free navigation and control using eye tracking

class EyeInteractionSystem {
    constructor() {
        this.isActive = false;
        this.dwellTime = 2000; // 2 seconds dwell time
        this.gazeCursor = null;
        this.dwellTarget = null;
        this.dwellTimer = null;
        this.interactionZones = [];
        this.clickSensitivity = 0.5;
        this.isCalibrated = false;
        this.calibrationPoints = [];
        this.currentCalibrationPoint = 0;
        
        this.init();
    }
    
    init() {
        this.createGazeCursor();
        this.createInteractionZones();
        this.setupAccessibilityControls();
        console.log('Eye interaction system initialized');
    }
    
    createGazeCursor() {
        this.gazeCursor = document.createElement('div');
        this.gazeCursor.className = 'gaze-cursor';
        this.gazeCursor.innerHTML = `
            <div class="gaze-dot"></div>
            <div class="gaze-ring"></div>
            <div class="dwell-progress"></div>
        `;
        document.body.appendChild(this.gazeCursor);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .gaze-cursor {
                position: fixed;
                width: 40px;
                height: 40px;
                pointer-events: none;
                z-index: 10000;
                transition: all 0.1s ease;
                display: none;
            }
            
            .gaze-cursor.active {
                display: block;
            }
            
            .gaze-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 6px;
                height: 6px;
                background: #00ff00;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }
            
            .gaze-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 30px;
                height: 30px;
                border: 2px solid rgba(0, 255, 0, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
            }
            
            .dwell-progress {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 34px;
                height: 34px;
                border: 2px solid transparent;
                border-top: 2px solid #ff6b00;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .dwell-progress.active {
                opacity: 1;
                animation: dwell-spin 2s linear;
            }
            
            @keyframes dwell-spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            .interaction-zone {
                position: relative;
                transition: all 0.3s ease;
            }
            
            .interaction-zone:hover,
            .interaction-zone.gaze-hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
                border: 2px solid rgba(0, 255, 0, 0.5);
            }
            
            .accessibility-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 10px;
                z-index: 9999;
                font-family: Arial, sans-serif;
                font-size: 14px;
                min-width: 200px;
            }
            
            .accessibility-panel h4 {
                margin: 0 0 10px 0;
                color: #00ff00;
            }
            
            .accessibility-control {
                margin: 8px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .calibration-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10001;
                display: none;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                color: white;
                font-family: Arial, sans-serif;
            }
            
            .calibration-point {
                position: absolute;
                width: 20px;
                height: 20px;
                background: #ff6b00;
                border-radius: 50%;
                box-shadow: 0 0 20px rgba(255, 107, 0, 0.5);
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
        `;
        document.head.appendChild(style);
    }
    
    createInteractionZones() {
        // Make all buttons, links, and interactive elements into interaction zones
        const interactiveElements = document.querySelectorAll('button, a, input, select, .card, .nav-link');
        
        interactiveElements.forEach(element => {
            if (!element.classList.contains('interaction-zone')) {
                element.classList.add('interaction-zone');
                this.interactionZones.push(element);
            }
        });
    }
    
    setupAccessibilityControls() {
        const panel = document.createElement('div');
        panel.className = 'accessibility-panel';
        panel.innerHTML = `
            <h4>👁️ Eye Control</h4>
            <div class="accessibility-control">
                <span>Eye Tracking:</span>
                <button id="toggleEyeTracking" class="btn btn-sm btn-outline-success">OFF</button>
            </div>
            <div class="accessibility-control">
                <span>Dwell Time:</span>
                <select id="dwellTimeSelect" class="form-select form-select-sm">
                    <option value="1000">1s</option>
                    <option value="2000" selected>2s</option>
                    <option value="3000">3s</option>
                    <option value="4000">4s</option>
                </select>
            </div>
            <div class="accessibility-control">
                <span>Sensitivity:</span>
                <input type="range" id="sensitivitySlider" min="0.1" max="1" step="0.1" value="0.5" class="form-range">
            </div>
            <div class="accessibility-control">
                <button id="calibrateEyes" class="btn btn-sm btn-outline-primary">Calibrate</button>
                <button id="helpButton" class="btn btn-sm btn-outline-info">Help</button>
            </div>
        `;
        document.body.appendChild(panel);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('toggleEyeTracking').addEventListener('click', () => {
            this.toggleEyeTracking();
        });
        
        document.getElementById('dwellTimeSelect').addEventListener('change', (e) => {
            this.dwellTime = parseInt(e.target.value);
        });
        
        document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
            this.clickSensitivity = parseFloat(e.target.value);
        });
        
        document.getElementById('calibrateEyes').addEventListener('click', () => {
            this.startCalibration();
        });
        
        document.getElementById('helpButton').addEventListener('click', () => {
            this.showHelp();
        });
    }
    
    toggleEyeTracking() {
        this.isActive = !this.isActive;
        const button = document.getElementById('toggleEyeTracking');
        
        if (this.isActive) {
            button.textContent = 'ON';
            button.classList.remove('btn-outline-success');
            button.classList.add('btn-success');
            this.gazeCursor.classList.add('active');
            this.startEyeTracking();
        } else {
            button.textContent = 'OFF';
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-success');
            this.gazeCursor.classList.remove('active');
            this.stopEyeTracking();
        }
    }
    
    startEyeTracking() {
        if (!this.isCalibrated) {
            this.showCalibrationPrompt();
            return;
        }
        
        // Connect to existing eye tracking system
        if (typeof currentGazeDirection !== 'undefined') {
            this.eyeTrackingInterval = setInterval(() => {
                this.updateGazeCursor();
            }, 50);
        }
    }
    
    stopEyeTracking() {
        if (this.eyeTrackingInterval) {
            clearInterval(this.eyeTrackingInterval);
        }
        this.clearDwellTimer();
    }
    
    updateGazeCursor() {
        if (!this.isActive || typeof currentGazeDirection === 'undefined') return;
        
        // Convert gaze direction to screen coordinates
        const screenX = window.innerWidth / 2 + (currentGazeDirection.x * 5);
        const screenY = window.innerHeight / 2 + (currentGazeDirection.y * 5);
        
        // Update cursor position
        this.gazeCursor.style.left = screenX + 'px';
        this.gazeCursor.style.top = screenY + 'px';
        
        // Check for interactive elements under gaze
        const elementUnderGaze = document.elementFromPoint(screenX, screenY);
        this.handleGazeInteraction(elementUnderGaze, screenX, screenY);
    }
    
    handleGazeInteraction(element, x, y) {
        // Remove previous hover states
        document.querySelectorAll('.gaze-hover').forEach(el => {
            el.classList.remove('gaze-hover');
        });
        
        if (!element || !element.classList.contains('interaction-zone')) {
            this.clearDwellTimer();
            return;
        }
        
        // Add hover state
        element.classList.add('gaze-hover');
        
        // Start dwell timer if not already started
        if (this.dwellTarget !== element) {
            this.clearDwellTimer();
            this.dwellTarget = element;
            this.startDwellTimer();
        }
    }
    
    startDwellTimer() {
        if (!this.dwellTarget) return;
        
        const progressElement = this.gazeCursor.querySelector('.dwell-progress');
        progressElement.classList.add('active');
        
        this.dwellTimer = setTimeout(() => {
            this.executeGazeClick();
        }, this.dwellTime);
    }
    
    clearDwellTimer() {
        if (this.dwellTimer) {
            clearTimeout(this.dwellTimer);
            this.dwellTimer = null;
        }
        
        const progressElement = this.gazeCursor.querySelector('.dwell-progress');
        progressElement.classList.remove('active');
        
        this.dwellTarget = null;
    }
    
    executeGazeClick() {
        if (!this.dwellTarget) return;
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        this.dwellTarget.dispatchEvent(clickEvent);
        
        // Visual feedback
        this.showClickFeedback();
        
        // Clear dwell state
        this.clearDwellTimer();
    }
    
    showClickFeedback() {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10002;
            font-size: 14px;
            font-weight: bold;
        `;
        feedback.textContent = 'Eye Click!';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }
    
    startCalibration() {
        const overlay = document.createElement('div');
        overlay.className = 'calibration-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <h2>Eye Tracking Calibration</h2>
            <p>Look at each point and blink twice when the dot turns green</p>
            <p>Point <span id="calibrationCounter">1</span> of 9</p>
        `;
        document.body.appendChild(overlay);
        
        this.calibrationPoints = [
            { x: 10, y: 10 },    // Top left
            { x: 50, y: 10 },    // Top center
            { x: 90, y: 10 },    // Top right
            { x: 10, y: 50 },    // Middle left
            { x: 50, y: 50 },    // Center
            { x: 90, y: 50 },    // Middle right
            { x: 10, y: 90 },    // Bottom left
            { x: 50, y: 90 },    // Bottom center
            { x: 90, y: 90 }     // Bottom right
        ];
        
        this.currentCalibrationPoint = 0;
        this.showCalibrationPoint(overlay);
    }
    
    showCalibrationPoint(overlay) {
        const existingPoint = overlay.querySelector('.calibration-point');
        if (existingPoint) existingPoint.remove();
        
        if (this.currentCalibrationPoint >= this.calibrationPoints.length) {
            this.completeCalibration(overlay);
            return;
        }
        
        const point = this.calibrationPoints[this.currentCalibrationPoint];
        const pointElement = document.createElement('div');
        pointElement.className = 'calibration-point';
        pointElement.style.left = point.x + '%';
        pointElement.style.top = point.y + '%';
        
        overlay.appendChild(pointElement);
        
        // Update counter
        document.getElementById('calibrationCounter').textContent = this.currentCalibrationPoint + 1;
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            this.currentCalibrationPoint++;
            this.showCalibrationPoint(overlay);
        }, 3000);
    }
    
    completeCalibration(overlay) {
        this.isCalibrated = true;
        overlay.innerHTML = `
            <h2>Calibration Complete!</h2>
            <p>Your eye tracking is now calibrated.</p>
            <button class="btn btn-success" onclick="this.parentElement.remove()">Start Eye Tracking</button>
        `;
        
        setTimeout(() => {
            overlay.remove();
            this.toggleEyeTracking();
        }, 2000);
    }
    
    showCalibrationPrompt() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 10003;
            text-align: center;
        `;
        modal.innerHTML = `
            <h3>Calibration Required</h3>
            <p>Please calibrate your eye tracking first for accurate control.</p>
            <button class="btn btn-primary" onclick="this.parentElement.remove(); eyeInteraction.startCalibration();">Calibrate Now</button>
            <button class="btn btn-secondary" onclick="this.parentElement.remove();">Cancel</button>
        `;
        document.body.appendChild(modal);
    }
    
    showHelp() {
        const help = document.createElement('div');
        help.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 10003;
            max-width: 500px;
            color: black;
        `;
        help.innerHTML = `
            <h3>Eye Control Help</h3>
            <h4>How to Use:</h4>
            <ol>
                <li>Click "Calibrate" to set up eye tracking</li>
                <li>Turn on "Eye Tracking" to enable gaze control</li>
                <li>Look at buttons and links to select them</li>
                <li>Hold your gaze for the dwell time to click</li>
            </ol>
            <h4>Settings:</h4>
            <ul>
                <li><strong>Dwell Time:</strong> How long to look at something to click it</li>
                <li><strong>Sensitivity:</strong> How precise your gaze needs to be</li>
            </ul>
            <button class="btn btn-primary" onclick="this.parentElement.remove();">Got it!</button>
        `;
        document.body.appendChild(help);
    }
    
    // Method to be called from the main eye tracking system
    updateGazeData(gazeData) {
        if (this.isActive && gazeData) {
            currentGazeDirection = gazeData;
        }
    }
}

// Initialize the eye interaction system
let eyeInteraction;
document.addEventListener('DOMContentLoaded', function() {
    eyeInteraction = new EyeInteractionSystem();
});