// Advanced Gaze Tracking for UI Navigation
// Provides hands-free navigation through intelligent gaze detection

class AdvancedGazeUINavigation {
    constructor() {
        this.isActive = false;
        this.calibrated = false;
        this.gazeHistory = [];
        this.smoothingFactor = 0.3;
        this.dwellTime = 1500; // milliseconds
        this.scrollSensitivity = 2;
        this.currentTarget = null;
        this.dwellTimer = null;
        
        // UI Navigation zones
        this.navigationZones = {
            'scroll_up': { 
                area: { x: 0, y: 0, width: 1, height: 0.15 },
                action: 'scrollUp',
                icon: '⬆️',
                description: 'Scroll Up'
            },
            'scroll_down': { 
                area: { x: 0, y: 0.85, width: 1, height: 0.15 },
                action: 'scrollDown',
                icon: '⬇️',
                description: 'Scroll Down'
            },
            'back_navigation': { 
                area: { x: 0, y: 0.4, width: 0.1, height: 0.2 },
                action: 'goBack',
                icon: '⬅️',
                description: 'Go Back'
            },
            'menu_area': { 
                area: { x: 0.9, y: 0, width: 0.1, height: 0.3 },
                action: 'openMenu',
                icon: '📋',
                description: 'Open Menu'
            },
            'center_click': { 
                area: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
                action: 'centerClick',
                icon: '🎯',
                description: 'Center Click'
            }
        };
        
        this.shortcuts = {
            'homepage': { pattern: 'look_left_right_left', action: () => window.location.href = '/' },
            'settings': { pattern: 'look_up_down_up', action: () => window.location.href = '/settings' },
            'analytics': { pattern: 'circle_gaze', action: () => window.location.href = '/analytics' },
            'help': { pattern: 'double_blink', action: () => this.showHelp() }
        };
        
        this.init();
    }
    
    init() {
        this.createGazeUIInterface();
        this.setupGazeTracking();
        this.startGazeAnalysis();
        console.log('Advanced gaze UI navigation initialized');
    }
    
    createGazeUIInterface() {
        // Create gaze UI overlay
        const overlay = document.createElement('div');
        overlay.className = 'gaze-ui-overlay';
        overlay.innerHTML = `
            <div class="gaze-zones-container">
                ${Object.entries(this.navigationZones).map(([key, zone]) => `
                    <div class="gaze-zone" data-zone="${key}" data-action="${zone.action}">
                        <span class="zone-icon">${zone.icon}</span>
                        <span class="zone-label">${zone.description}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="gaze-cursor-enhanced">
                <div class="cursor-dot"></div>
                <div class="cursor-trail"></div>
                <div class="cursor-target-indicator"></div>
            </div>
            
            <div class="gaze-heatmap">
                <canvas id="gazeHeatmapCanvas"></canvas>
            </div>
            
            <div class="gaze-controls">
                <button id="toggleGazeUI" class="gaze-control-btn">
                    <span class="btn-icon">👁️</span>
                    <span class="btn-text">Enable Gaze Control</span>
                </button>
                <button id="calibrateGaze" class="gaze-control-btn">
                    <span class="btn-icon">🎯</span>
                    <span class="btn-text">Calibrate</span>
                </button>
                <button id="gazeSettings" class="gaze-control-btn">
                    <span class="btn-icon">⚙️</span>
                    <span class="btn-text">Settings</span>
                </button>
            </div>
            
            <div class="gaze-feedback-panel">
                <div class="feedback-title">Gaze Status</div>
                <div class="feedback-content">
                    <div class="status-item">
                        <span class="status-label">Tracking:</span>
                        <span class="status-value" id="trackingStatus">Inactive</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Accuracy:</span>
                        <span class="status-value" id="accuracyStatus">--</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Current Zone:</span>
                        <span class="status-value" id="currentZone">None</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.addGazeUIStyles();
        this.setupGazeUIEvents();
        this.positionNavigationZones();
    }
    
    addGazeUIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .gaze-ui-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9000;
                display: none;
            }
            
            .gaze-ui-overlay.active {
                display: block;
            }
            
            .gaze-zones-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            .gaze-zone {
                position: absolute;
                border: 2px dashed rgba(0, 255, 0, 0.3);
                background: rgba(0, 255, 0, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                color: white;
                font-size: 12px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
                transition: all 0.3s ease;
                opacity: 0.6;
            }
            
            .gaze-zone.active {
                border-color: rgba(255, 215, 0, 0.8);
                background: rgba(255, 215, 0, 0.2);
                opacity: 1;
                animation: zoneActivate 0.5s ease;
            }
            
            .gaze-zone.dwelling {
                border-color: rgba(255, 0, 0, 0.8);
                background: rgba(255, 0, 0, 0.2);
                animation: zoneDwell 1.5s ease;
            }
            
            .zone-icon {
                font-size: 18px;
                margin-bottom: 5px;
            }
            
            .zone-label {
                font-size: 10px;
                font-weight: bold;
            }
            
            .gaze-cursor-enhanced {
                position: absolute;
                width: 20px;
                height: 20px;
                pointer-events: none;
                z-index: 9001;
                transition: all 0.1s ease;
            }
            
            .cursor-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #00ff00, #008000);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
            }
            
            .cursor-trail {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 16px;
                height: 16px;
                border: 1px solid rgba(0, 255, 0, 0.5);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: trailPulse 2s infinite;
            }
            
            .cursor-target-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 24px;
                height: 24px;
                border: 2px solid rgba(255, 0, 0, 0.8);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .cursor-target-indicator.active {
                opacity: 1;
                animation: targetActivate 1.5s ease;
            }
            
            .gaze-heatmap {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.3;
            }
            
            .gaze-controls {
                position: fixed;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                pointer-events: auto;
                z-index: 9002;
            }
            
            .gaze-control-btn {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s ease;
                min-width: 120px;
            }
            
            .gaze-control-btn:hover {
                background: rgba(0, 0, 0, 0.9);
                transform: scale(1.05);
            }
            
            .gaze-control-btn.active {
                background: rgba(0, 255, 0, 0.8);
                color: black;
            }
            
            .gaze-feedback-panel {
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 8px;
                padding: 10px;
                font-size: 12px;
                pointer-events: auto;
                z-index: 9002;
                min-width: 150px;
            }
            
            .feedback-title {
                font-weight: bold;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                padding-bottom: 4px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            
            .status-value {
                font-weight: bold;
                color: #00ff00;
            }
            
            @keyframes zoneActivate {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            @keyframes zoneDwell {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            @keyframes trailPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
                50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
            }
            
            @keyframes targetActivate {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupGazeUIEvents() {
        document.getElementById('toggleGazeUI').addEventListener('click', () => {
            this.toggleGazeUI();
        });
        
        document.getElementById('calibrateGaze').addEventListener('click', () => {
            this.startCalibration();
        });
        
        document.getElementById('gazeSettings').addEventListener('click', () => {
            this.showGazeSettings();
        });
    }
    
    positionNavigationZones() {
        const zones = document.querySelectorAll('.gaze-zone');
        zones.forEach(zone => {
            const zoneName = zone.dataset.zone;
            const zoneConfig = this.navigationZones[zoneName];
            
            if (zoneConfig) {
                const area = zoneConfig.area;
                zone.style.left = (area.x * 100) + '%';
                zone.style.top = (area.y * 100) + '%';
                zone.style.width = (area.width * 100) + '%';
                zone.style.height = (area.height * 100) + '%';
            }
        });
    }
    
    toggleGazeUI() {
        this.isActive = !this.isActive;
        const overlay = document.querySelector('.gaze-ui-overlay');
        const btn = document.getElementById('toggleGazeUI');
        
        if (this.isActive) {
            overlay.classList.add('active');
            btn.classList.add('active');
            btn.querySelector('.btn-text').textContent = 'Disable Gaze Control';
            
            this.updateStatus('trackingStatus', 'Active');
            this.startGazeTracking();
        } else {
            overlay.classList.remove('active');
            btn.classList.remove('active');
            btn.querySelector('.btn-text').textContent = 'Enable Gaze Control';
            
            this.updateStatus('trackingStatus', 'Inactive');
            this.stopGazeTracking();
        }
    }
    
    setupGazeTracking() {
        // Initialize smoothing for gaze coordinates
        this.smoothedGaze = { x: 0, y: 0 };
        
        // Setup heatmap canvas
        this.setupHeatmap();
    }
    
    setupHeatmap() {
        const canvas = document.getElementById('gazeHeatmapCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.heatmapCtx = canvas.getContext('2d');
            this.heatmapData = [];
        }
    }
    
    startGazeTracking() {
        if (!this.isActive) return;
        
        this.gazeTrackingInterval = setInterval(() => {
            this.updateGazeTracking();
        }, 50); // 20 FPS
    }
    
    stopGazeTracking() {
        if (this.gazeTrackingInterval) {
            clearInterval(this.gazeTrackingInterval);
        }
        this.clearDwellTimer();
    }
    
    updateGazeTracking() {
        if (!this.isActive) return;
        
        // Get current gaze data from the eye tracking system
        const gazeData = this.getCurrentGazeData();
        if (!gazeData) return;
        
        // Apply smoothing
        this.applyGazeSmoothing(gazeData);
        
        // Update cursor position
        this.updateGazeCursor();
        
        // Check navigation zones
        this.checkNavigationZones();
        
        // Update heatmap
        this.updateHeatmap();
        
        // Store gaze history
        this.storeGazeHistory();
        
        // Check for gesture patterns
        this.checkGesturePatterns();
    }
    
    getCurrentGazeData() {
        // Interface with existing eye tracking system
        if (typeof currentGazeDirection !== 'undefined' && currentGazeDirection) {
            return {
                x: window.innerWidth / 2 + (currentGazeDirection.x * 10),
                y: window.innerHeight / 2 + (currentGazeDirection.y * 10),
                confidence: currentGazeDirection.confidence || 0.7
            };
        }
        return null;
    }
    
    applyGazeSmoothing(gazeData) {
        // Exponential moving average for smooth tracking
        this.smoothedGaze.x = this.smoothedGaze.x * (1 - this.smoothingFactor) + 
                             gazeData.x * this.smoothingFactor;
        this.smoothedGaze.y = this.smoothedGaze.y * (1 - this.smoothingFactor) + 
                             gazeData.y * this.smoothingFactor;
        
        this.smoothedGaze.confidence = gazeData.confidence;
    }
    
    updateGazeCursor() {
        const cursor = document.querySelector('.gaze-cursor-enhanced');
        if (cursor) {
            cursor.style.left = this.smoothedGaze.x + 'px';
            cursor.style.top = this.smoothedGaze.y + 'px';
            
            // Update accuracy display
            const accuracy = Math.round(this.smoothedGaze.confidence * 100);
            this.updateStatus('accuracyStatus', accuracy + '%');
        }
    }
    
    checkNavigationZones() {
        const currentZone = this.getCurrentZone();
        
        // Clear previous zone states
        document.querySelectorAll('.gaze-zone').forEach(zone => {
            zone.classList.remove('active', 'dwelling');
        });
        
        if (currentZone) {
            const zoneElement = document.querySelector(`[data-zone="${currentZone}"]`);
            zoneElement.classList.add('active');
            
            this.updateStatus('currentZone', this.navigationZones[currentZone].description);
            
            // Start dwell timer if not already started
            if (this.currentTarget !== currentZone) {
                this.clearDwellTimer();
                this.currentTarget = currentZone;
                this.startDwellTimer(currentZone);
            }
        } else {
            this.updateStatus('currentZone', 'None');
            this.clearDwellTimer();
        }
    }
    
    getCurrentZone() {
        const x = this.smoothedGaze.x / window.innerWidth;
        const y = this.smoothedGaze.y / window.innerHeight;
        
        for (const [zoneName, zone] of Object.entries(this.navigationZones)) {
            const area = zone.area;
            if (x >= area.x && x <= area.x + area.width &&
                y >= area.y && y <= area.y + area.height) {
                return zoneName;
            }
        }
        return null;
    }
    
    startDwellTimer(zoneName) {
        const zoneElement = document.querySelector(`[data-zone="${zoneName}"]`);
        const targetIndicator = document.querySelector('.cursor-target-indicator');
        
        zoneElement.classList.add('dwelling');
        targetIndicator.classList.add('active');
        
        this.dwellTimer = setTimeout(() => {
            this.executeZoneAction(zoneName);
        }, this.dwellTime);
    }
    
    clearDwellTimer() {
        if (this.dwellTimer) {
            clearTimeout(this.dwellTimer);
            this.dwellTimer = null;
        }
        
        const targetIndicator = document.querySelector('.cursor-target-indicator');
        targetIndicator.classList.remove('active');
        
        this.currentTarget = null;
    }
    
    executeZoneAction(zoneName) {
        const zone = this.navigationZones[zoneName];
        if (!zone) return;
        
        // Visual feedback
        this.showActionFeedback(zone.description);
        
        // Execute action
        switch (zone.action) {
            case 'scrollUp':
                window.scrollBy(0, -100 * this.scrollSensitivity);
                break;
            case 'scrollDown':
                window.scrollBy(0, 100 * this.scrollSensitivity);
                break;
            case 'goBack':
                if (window.history.length > 1) {
                    window.history.back();
                }
                break;
            case 'openMenu':
                this.toggleNavigation();
                break;
            case 'centerClick':
                this.simulateCenterClick();
                break;
        }
        
        this.clearDwellTimer();
    }
    
    showActionFeedback(actionName) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.9);
            color: black;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 1s ease;
        `;
        feedback.textContent = actionName;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }
    
    toggleNavigation() {
        const nav = document.querySelector('.navbar-collapse');
        if (nav) {
            nav.classList.toggle('show');
        }
    }
    
    simulateCenterClick() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const element = document.elementFromPoint(centerX, centerY);
        
        if (element && (element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick)) {
            element.click();
        }
    }
    
    updateHeatmap() {
        if (!this.heatmapCtx) return;
        
        const x = this.smoothedGaze.x;
        const y = this.smoothedGaze.y;
        
        // Add current gaze point to heatmap data
        this.heatmapData.push({ x, y, timestamp: Date.now() });
        
        // Remove old data (older than 30 seconds)
        const thirtySecondsAgo = Date.now() - 30000;
        this.heatmapData = this.heatmapData.filter(point => point.timestamp > thirtySecondsAgo);
        
        // Redraw heatmap
        this.drawHeatmap();
    }
    
    drawHeatmap() {
        if (!this.heatmapCtx || this.heatmapData.length === 0) return;
        
        // Clear canvas
        this.heatmapCtx.clearRect(0, 0, this.heatmapCtx.canvas.width, this.heatmapCtx.canvas.height);
        
        // Draw heat points
        this.heatmapData.forEach(point => {
            const age = Date.now() - point.timestamp;
            const opacity = Math.max(0, 1 - (age / 30000)); // Fade over 30 seconds
            
            const gradient = this.heatmapCtx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, 20
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity * 0.3})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
            
            this.heatmapCtx.fillStyle = gradient;
            this.heatmapCtx.fillRect(point.x - 20, point.y - 20, 40, 40);
        });
    }
    
    storeGazeHistory() {
        this.gazeHistory.push({
            x: this.smoothedGaze.x,
            y: this.smoothedGaze.y,
            timestamp: Date.now()
        });
        
        // Keep only last 100 points
        if (this.gazeHistory.length > 100) {
            this.gazeHistory.shift();
        }
    }
    
    checkGesturePatterns() {
        // Implement gesture recognition for shortcuts
        if (this.gazeHistory.length < 10) return;
        
        // Check for various patterns
        const patterns = this.analyzeGazePattern();
        
        Object.entries(this.shortcuts).forEach(([name, shortcut]) => {
            if (patterns.includes(shortcut.pattern)) {
                shortcut.action();
                this.showActionFeedback(`Shortcut: ${name}`);
            }
        });
    }
    
    analyzeGazePattern() {
        const patterns = [];
        const recent = this.gazeHistory.slice(-10);
        
        // Analyze for left-right-left pattern
        const xMovements = recent.map(point => point.x);
        if (this.detectLeftRightLeft(xMovements)) {
            patterns.push('look_left_right_left');
        }
        
        // Analyze for up-down-up pattern
        const yMovements = recent.map(point => point.y);
        if (this.detectUpDownUp(yMovements)) {
            patterns.push('look_up_down_up');
        }
        
        // Analyze for circular motion
        if (this.detectCircularMotion(recent)) {
            patterns.push('circle_gaze');
        }
        
        return patterns;
    }
    
    detectLeftRightLeft(xMovements) {
        if (xMovements.length < 6) return false;
        
        const start = xMovements[0];
        const middle = Math.max(...xMovements.slice(2, 4));
        const end = xMovements[xMovements.length - 1];
        
        return start < middle - 100 && end < middle - 100 && Math.abs(start - end) < 50;
    }
    
    detectUpDownUp(yMovements) {
        if (yMovements.length < 6) return false;
        
        const start = yMovements[0];
        const middle = Math.max(...yMovements.slice(2, 4));
        const end = yMovements[yMovements.length - 1];
        
        return start < middle - 100 && end < middle - 100 && Math.abs(start - end) < 50;
    }
    
    detectCircularMotion(points) {
        if (points.length < 8) return false;
        
        // Calculate if points form roughly circular path
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        const distances = points.map(p => 
            Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
        );
        
        const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
        
        return variance < 1000 && avgDistance > 50; // Roughly circular with reasonable radius
    }
    
    startCalibration() {
        // Implement calibration process similar to eye interaction system
        this.showActionFeedback('Calibration started - follow the dots!');
        // Additional calibration logic here
    }
    
    showGazeSettings() {
        const settings = document.createElement('div');
        settings.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            color: black;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 10005;
            min-width: 300px;
        `;
        settings.innerHTML = `
            <h3>Gaze UI Settings</h3>
            <div class="setting-item">
                <label>Dwell Time: <span id="dwellTimeValue">${this.dwellTime}ms</span></label>
                <input type="range" id="dwellTimeSlider" min="500" max="3000" step="100" value="${this.dwellTime}">
            </div>
            <div class="setting-item">
                <label>Scroll Sensitivity: <span id="scrollSensValue">${this.scrollSensitivity}</span></label>
                <input type="range" id="scrollSensSlider" min="1" max="5" step="0.5" value="${this.scrollSensitivity}">
            </div>
            <div class="setting-item">
                <label>Smoothing: <span id="smoothingValue">${this.smoothingFactor}</span></label>
                <input type="range" id="smoothingSlider" min="0.1" max="0.9" step="0.1" value="${this.smoothingFactor}">
            </div>
            <button onclick="this.parentElement.remove()">Close</button>
        `;
        document.body.appendChild(settings);
        
        // Setup slider events
        settings.querySelector('#dwellTimeSlider').addEventListener('input', (e) => {
            this.dwellTime = parseInt(e.target.value);
            settings.querySelector('#dwellTimeValue').textContent = this.dwellTime + 'ms';
        });
        
        settings.querySelector('#scrollSensSlider').addEventListener('input', (e) => {
            this.scrollSensitivity = parseFloat(e.target.value);
            settings.querySelector('#scrollSensValue').textContent = this.scrollSensitivity;
        });
        
        settings.querySelector('#smoothingSlider').addEventListener('input', (e) => {
            this.smoothingFactor = parseFloat(e.target.value);
            settings.querySelector('#smoothingValue').textContent = this.smoothingFactor;
        });
    }
    
    updateStatus(statusId, value) {
        const element = document.getElementById(statusId);
        if (element) {
            element.textContent = value;
        }
    }
}

// Add animation styles
const gazeAnimationStyle = document.createElement('style');
gazeAnimationStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(gazeAnimationStyle);

// Initialize advanced gaze UI navigation
let advancedGazeUI;
document.addEventListener('DOMContentLoaded', function() {
    advancedGazeUI = new AdvancedGazeUINavigation();
});