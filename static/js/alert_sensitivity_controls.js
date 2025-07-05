// Customizable Alert Settings and Sensitivity Controls
// Provides granular control over all eye health monitoring alerts

class AlertSensitivityController {
    constructor() {
        this.alertProfiles = {
            'conservative': {
                name: 'Conservative',
                description: 'Fewer alerts, less sensitive',
                icon: '🟢',
                settings: {
                    blinkRateThreshold: { min: 10, max: 30 },
                    eyeStrainThreshold: 0.7,
                    drowsinessThreshold: 0.8,
                    screenTimeAlerts: 180, // minutes
                    breakReminders: 45, // minutes
                    postureWarnings: 0.3,
                    gazeTrackingAlerts: false
                }
            },
            'balanced': {
                name: 'Balanced',
                description: 'Standard sensitivity levels',
                icon: '🟡',
                settings: {
                    blinkRateThreshold: { min: 12, max: 25 },
                    eyeStrainThreshold: 0.5,
                    drowsinessThreshold: 0.6,
                    screenTimeAlerts: 120, // minutes
                    breakReminders: 30, // minutes
                    postureWarnings: 0.5,
                    gazeTrackingAlerts: true
                }
            },
            'strict': {
                name: 'Strict',
                description: 'Highly sensitive, frequent alerts',
                icon: '🔴',
                settings: {
                    blinkRateThreshold: { min: 15, max: 22 },
                    eyeStrainThreshold: 0.3,
                    drowsinessThreshold: 0.4,
                    screenTimeAlerts: 60, // minutes
                    breakReminders: 20, // minutes
                    postureWarnings: 0.7,
                    gazeTrackingAlerts: true
                }
            },
            'custom': {
                name: 'Custom',
                description: 'User-defined settings',
                icon: '⚙️',
                settings: {} // Will be populated by user
            }
        };
        
        this.currentProfile = 'balanced';
        this.customSettings = {};
        this.alertHistory = [];
        this.isInitialized = false;
        
        // Alert types configuration
        this.alertTypes = {
            'blink_rate': {
                name: 'Blink Rate',
                description: 'Alerts when blink rate is too high or low',
                category: 'Eye Health',
                priority: 'medium',
                enabled: true,
                customizable: ['threshold', 'frequency', 'sound', 'visual']
            },
            'eye_strain': {
                name: 'Eye Strain',
                description: 'Detects and alerts about eye fatigue',
                category: 'Eye Health',
                priority: 'high',
                enabled: true,
                customizable: ['threshold', 'frequency', 'sound', 'visual', 'vibration']
            },
            'drowsiness': {
                name: 'Drowsiness',
                description: 'Alerts when signs of tiredness are detected',
                category: 'Safety',
                priority: 'critical',
                enabled: true,
                customizable: ['threshold', 'escalation', 'sound', 'visual']
            },
            'screen_time': {
                name: 'Screen Time',
                description: 'Monitors cumulative screen exposure',
                category: 'Usage',
                priority: 'low',
                enabled: true,
                customizable: ['duration', 'frequency', 'sound']
            },
            'break_reminders': {
                name: 'Break Reminders',
                description: '20-20-20 rule and micro-break prompts',
                category: 'Wellness',
                priority: 'medium',
                enabled: true,
                customizable: ['interval', 'type', 'sound', 'visual']
            },
            'posture_warnings': {
                name: 'Posture Warnings',
                description: 'Alerts about poor screen positioning',
                category: 'Ergonomics',
                priority: 'medium',
                enabled: true,
                customizable: ['sensitivity', 'frequency', 'visual']
            },
            'gaze_tracking': {
                name: 'Gaze Tracking',
                description: 'Notifications about gaze patterns',
                category: 'Analytics',
                priority: 'low',
                enabled: false,
                customizable: ['zones', 'patterns', 'feedback']
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadSavedSettings();
        this.createAlertControlInterface();
        this.applyCurrentProfile();
        this.startAlertMonitoring();
        console.log('Alert sensitivity controller initialized');
        this.isInitialized = true;
    }
    
    loadSavedSettings() {
        const savedProfile = localStorage.getItem('alertProfile');
        if (savedProfile) {
            this.currentProfile = savedProfile;
        }
        
        const savedCustom = localStorage.getItem('customAlertSettings');
        if (savedCustom) {
            this.customSettings = JSON.parse(savedCustom);
            if (Object.keys(this.customSettings).length > 0) {
                this.alertProfiles.custom.settings = this.customSettings;
            }
        }
        
        const savedHistory = localStorage.getItem('alertHistory');
        if (savedHistory) {
            this.alertHistory = JSON.parse(savedHistory);
            // Keep only last 7 days
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > weekAgo);
        }
    }
    
    saveSettings() {
        localStorage.setItem('alertProfile', this.currentProfile);
        localStorage.setItem('customAlertSettings', JSON.stringify(this.customSettings));
        localStorage.setItem('alertHistory', JSON.stringify(this.alertHistory));
    }
    
    createAlertControlInterface() {
        const container = document.createElement('div');
        container.className = 'alert-control-panel';
        container.innerHTML = `
            <div class="alert-panel-header">
                <h3>🚨 Alert & Sensitivity Control</h3>
                <div class="panel-controls">
                    <button id="toggleAlertPanel" class="control-btn">
                        <span class="btn-icon">👁️</span>
                        <span class="btn-text">Hide Panel</span>
                    </button>
                    <button id="alertProfileBtn" class="control-btn active">
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Profiles</span>
                    </button>
                    <button id="customAlertsBtn" class="control-btn">
                        <span class="btn-icon">⚙️</span>
                        <span class="btn-text">Custom</span>
                    </button>
                    <button id="alertHistoryBtn" class="control-btn">
                        <span class="btn-icon">📊</span>
                        <span class="btn-text">History</span>
                    </button>
                </div>
            </div>
            
            <div class="alert-panel-content">
                <!-- Profile Selection Tab -->
                <div id="profileTab" class="alert-tab active">
                    <div class="profile-selector">
                        <h4>Choose Alert Profile</h4>
                        <div class="profile-grid">
                            ${Object.entries(this.alertProfiles).map(([key, profile]) => `
                                <div class="profile-card" data-profile="${key}">
                                    <div class="profile-icon">${profile.icon}</div>
                                    <div class="profile-name">${profile.name}</div>
                                    <div class="profile-description">${profile.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="current-profile-info">
                        <h4>Current Profile: <span id="currentProfileName">${this.alertProfiles[this.currentProfile].name}</span></h4>
                        <div class="profile-settings-summary" id="profileSummary"></div>
                    </div>
                </div>
                
                <!-- Custom Settings Tab -->
                <div id="customTab" class="alert-tab">
                    <div class="custom-alerts-header">
                        <h4>Customize Individual Alerts</h4>
                        <p>Fine-tune each alert type to your preferences</p>
                    </div>
                    
                    <div class="alert-types-list">
                        ${Object.entries(this.alertTypes).map(([key, alert]) => `
                            <div class="alert-type-card" data-alert="${key}">
                                <div class="alert-type-header">
                                    <div class="alert-type-info">
                                        <div class="alert-type-name">${alert.name}</div>
                                        <div class="alert-type-description">${alert.description}</div>
                                        <div class="alert-type-category">${alert.category} • ${alert.priority} priority</div>
                                    </div>
                                    <div class="alert-type-toggle">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="toggle_${key}" ${alert.enabled ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="alert-type-controls" id="controls_${key}">
                                    <!-- Dynamic controls will be inserted here -->
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Alert History Tab -->
                <div id="historyTab" class="alert-tab">
                    <div class="history-header">
                        <h4>Alert History & Analytics</h4>
                        <div class="history-filters">
                            <select id="historyTimeFilter">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            <select id="historyTypeFilter">
                                <option value="all">All Types</option>
                                ${Object.entries(this.alertTypes).map(([key, alert]) => 
                                    `<option value="${key}">${alert.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="history-stats">
                        <div class="stat-card">
                            <div class="stat-number" id="totalAlerts">0</div>
                            <div class="stat-label">Total Alerts</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="mostFrequent">-</div>
                            <div class="stat-label">Most Frequent</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="averagePerDay">0</div>
                            <div class="stat-label">Avg Per Day</div>
                        </div>
                    </div>
                    
                    <div class="history-timeline" id="alertTimeline">
                        <!-- Timeline will be populated here -->
                    </div>
                </div>
            </div>
            
            <div class="alert-testing-area">
                <h4>🧪 Test Alerts</h4>
                <div class="test-buttons">
                    <button class="test-btn" data-test="blink_rate">Test Blink Alert</button>
                    <button class="test-btn" data-test="eye_strain">Test Strain Alert</button>
                    <button class="test-btn" data-test="drowsiness">Test Drowsiness Alert</button>
                    <button class="test-btn" data-test="break_reminder">Test Break Reminder</button>
                </div>
            </div>
        `;
        
        // Find a suitable location to insert the panel
        const existingPanel = document.querySelector('.settings-section') || 
                             document.querySelector('.container') || 
                             document.body;
        existingPanel.appendChild(container);
        
        this.addAlertControlStyles();
        this.setupAlertControlEvents();
        this.updateProfileSummary();
        this.createCustomControls();
    }
    
    addAlertControlStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .alert-control-panel {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 800px;
            }
            
            .alert-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 15px;
            }
            
            .alert-panel-header h3 {
                margin: 0;
                font-size: 24px;
            }
            
            .panel-controls {
                display: flex;
                gap: 5px;
            }
            
            .control-btn {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s ease;
            }
            
            .control-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .control-btn.active {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            .alert-tab {
                display: none;
            }
            
            .alert-tab.active {
                display: block;
            }
            
            .profile-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .profile-card {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .profile-card:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }
            
            .profile-card.selected {
                border-color: #FFD700;
                background: rgba(255, 215, 0, 0.2);
            }
            
            .profile-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .profile-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .profile-description {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .current-profile-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
            }
            
            .profile-settings-summary {
                margin-top: 10px;
                font-size: 14px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .alert-types-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .alert-type-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .alert-type-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            
            .alert-type-name {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 5px;
            }
            
            .alert-type-description {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            
            .alert-type-category {
                font-size: 12px;
                opacity: 0.7;
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 8px;
                border-radius: 4px;
                display: inline-block;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 25px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.3);
                transition: 0.3s;
                border-radius: 25px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 19px;
                width: 19px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #4CAF50;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(25px);
            }
            
            .alert-type-controls {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .control-group {
                margin-bottom: 15px;
            }
            
            .control-label {
                display: block;
                font-size: 14px;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .control-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 8px;
                color: white;
                font-size: 14px;
            }
            
            .control-input:focus {
                outline: none;
                border-color: #FFD700;
                background: rgba(255, 255, 255, 0.2);
            }
            
            .range-input {
                margin-bottom: 5px;
            }
            
            .range-value {
                font-size: 12px;
                opacity: 0.8;
                text-align: center;
            }
            
            .history-filters {
                display: flex;
                gap: 10px;
            }
            
            .history-filters select {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 5px 10px;
                color: white;
                font-size: 12px;
            }
            
            .history-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .history-timeline {
                max-height: 300px;
                overflow-y: auto;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 15px;
            }
            
            .timeline-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .timeline-item:last-child {
                border-bottom: none;
            }
            
            .timeline-alert {
                font-weight: 500;
            }
            
            .timeline-time {
                font-size: 12px;
                opacity: 0.7;
            }
            
            .alert-testing-area {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                margin-top: 20px;
            }
            
            .alert-testing-area h4 {
                margin: 0 0 15px 0;
            }
            
            .test-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .test-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .test-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAlertControlEvents() {
        // Tab switching
        document.getElementById('alertProfileBtn').addEventListener('click', () => {
            this.switchTab('profile');
        });
        
        document.getElementById('customAlertsBtn').addEventListener('click', () => {
            this.switchTab('custom');
        });
        
        document.getElementById('alertHistoryBtn').addEventListener('click', () => {
            this.switchTab('history');
            this.updateHistoryDisplay();
        });
        
        // Profile selection
        document.querySelectorAll('.profile-card').forEach(card => {
            card.addEventListener('click', () => {
                const profile = card.dataset.profile;
                this.selectProfile(profile);
            });
        });
        
        // Alert type toggles
        Object.keys(this.alertTypes).forEach(alertType => {
            const toggle = document.getElementById(`toggle_${alertType}`);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.toggleAlertType(alertType, e.target.checked);
                });
            }
        });
        
        // Test buttons
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const testType = btn.dataset.test;
                this.testAlert(testType);
            });
        });
        
        // History filters
        document.getElementById('historyTimeFilter').addEventListener('change', () => {
            this.updateHistoryDisplay();
        });
        
        document.getElementById('historyTypeFilter').addEventListener('change', () => {
            this.updateHistoryDisplay();
        });
    }
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.alert-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            if (btn.id !== 'toggleAlertPanel') {
                btn.classList.remove('active');
            }
        });
        
        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Activate corresponding button
        const buttonId = tabName === 'profile' ? 'alertProfileBtn' : 
                        tabName === 'custom' ? 'customAlertsBtn' : 'alertHistoryBtn';
        document.getElementById(buttonId).classList.add('active');
    }
    
    selectProfile(profileKey) {
        this.currentProfile = profileKey;
        
        // Update visual selection
        document.querySelectorAll('.profile-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-profile="${profileKey}"]`).classList.add('selected');
        
        // Apply profile settings
        this.applyCurrentProfile();
        this.updateProfileSummary();
        this.saveSettings();
        
        // Show feedback
        this.showAlert(`Profile changed to ${this.alertProfiles[profileKey].name}`, 'info');
    }
    
    applyCurrentProfile() {
        const profile = this.alertProfiles[this.currentProfile];
        const settings = profile.settings;
        
        // Apply settings to monitoring systems
        if (typeof restReminderSystem !== 'undefined') {
            restReminderSystem.reminderInterval = (settings.breakReminders || 30) * 60 * 1000;
        }
        
        // Update analytics thresholds
        if (typeof eyeHealthAnalytics !== 'undefined') {
            eyeHealthAnalytics.updateThresholds({
                eyeStrainThreshold: settings.eyeStrainThreshold,
                drowsinessThreshold: settings.drowsinessThreshold,
                blinkRateThreshold: settings.blinkRateThreshold
            });
        }
        
        // Update reminder interval in localStorage
        if (settings.breakReminders) {
            localStorage.setItem('reminderInterval', settings.breakReminders.toString());
        }
    }
    
    updateProfileSummary() {
        const profile = this.alertProfiles[this.currentProfile];
        const summary = document.getElementById('profileSummary');
        
        document.getElementById('currentProfileName').textContent = profile.name;
        
        if (Object.keys(profile.settings).length === 0) {
            summary.innerHTML = '<div class="summary-item">No settings configured yet</div>';
            return;
        }
        
        const summaryItems = [
            { label: 'Break Reminders', value: `${profile.settings.breakReminders || 30} min` },
            { label: 'Eye Strain Threshold', value: `${Math.round((profile.settings.eyeStrainThreshold || 0.5) * 100)}%` },
            { label: 'Drowsiness Threshold', value: `${Math.round((profile.settings.drowsinessThreshold || 0.6) * 100)}%` },
            { label: 'Screen Time Alerts', value: `${profile.settings.screenTimeAlerts || 120} min` }
        ];
        
        summary.innerHTML = summaryItems.map(item => `
            <div class="summary-item">
                <span>${item.label}:</span>
                <span>${item.value}</span>
            </div>
        `).join('');
    }
    
    createCustomControls() {
        Object.entries(this.alertTypes).forEach(([alertKey, alertConfig]) => {
            const container = document.getElementById(`controls_${alertKey}`);
            if (!container) return;
            
            const controls = this.generateControlsForAlert(alertKey, alertConfig);
            container.innerHTML = controls;
            
            this.setupCustomControlEvents(alertKey);
        });
    }
    
    generateControlsForAlert(alertKey, alertConfig) {
        const customizable = alertConfig.customizable || [];
        let controls = '';
        
        if (customizable.includes('threshold')) {
            controls += `
                <div class="control-group">
                    <label class="control-label">Sensitivity Threshold</label>
                    <input type="range" class="control-input range-input" 
                           id="threshold_${alertKey}" min="0.1" max="1" step="0.1" value="0.5">
                    <div class="range-value" id="threshold_value_${alertKey}">50%</div>
                </div>
            `;
        }
        
        if (customizable.includes('frequency')) {
            controls += `
                <div class="control-group">
                    <label class="control-label">Alert Frequency (minutes)</label>
                    <input type="range" class="control-input range-input" 
                           id="frequency_${alertKey}" min="5" max="120" step="5" value="30">
                    <div class="range-value" id="frequency_value_${alertKey}">30 min</div>
                </div>
            `;
        }
        
        if (customizable.includes('sound')) {
            controls += `
                <div class="control-group">
                    <label class="control-label">Sound Type</label>
                    <select class="control-input" id="sound_${alertKey}">
                        <option value="gentle">Gentle Chime</option>
                        <option value="standard">Standard Beep</option>
                        <option value="urgent">Urgent Alert</option>
                        <option value="none">No Sound</option>
                    </select>
                </div>
            `;
        }
        
        if (customizable.includes('visual')) {
            controls += `
                <div class="control-group">
                    <label class="control-label">Visual Style</label>
                    <select class="control-input" id="visual_${alertKey}">
                        <option value="notification">Notification Pop-up</option>
                        <option value="overlay">Full Screen Overlay</option>
                        <option value="indicator">Status Indicator</option>
                        <option value="none">No Visual</option>
                    </select>
                </div>
            `;
        }
        
        return controls;
    }
    
    setupCustomControlEvents(alertKey) {
        // Threshold slider
        const thresholdSlider = document.getElementById(`threshold_${alertKey}`);
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`threshold_value_${alertKey}`).textContent = 
                    Math.round(value * 100) + '%';
                this.updateCustomSetting(alertKey, 'threshold', value);
            });
        }
        
        // Frequency slider
        const frequencySlider = document.getElementById(`frequency_${alertKey}`);
        if (frequencySlider) {
            frequencySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById(`frequency_value_${alertKey}`).textContent = 
                    value + ' min';
                this.updateCustomSetting(alertKey, 'frequency', value);
            });
        }
        
        // Sound select
        const soundSelect = document.getElementById(`sound_${alertKey}`);
        if (soundSelect) {
            soundSelect.addEventListener('change', (e) => {
                this.updateCustomSetting(alertKey, 'sound', e.target.value);
            });
        }
        
        // Visual select
        const visualSelect = document.getElementById(`visual_${alertKey}`);
        if (visualSelect) {
            visualSelect.addEventListener('change', (e) => {
                this.updateCustomSetting(alertKey, 'visual', e.target.value);
            });
        }
    }
    
    updateCustomSetting(alertKey, setting, value) {
        if (!this.customSettings[alertKey]) {
            this.customSettings[alertKey] = {};
        }
        this.customSettings[alertKey][setting] = value;
        
        // Switch to custom profile if not already
        if (this.currentProfile !== 'custom') {
            this.selectProfile('custom');
        }
        
        this.saveSettings();
    }
    
    toggleAlertType(alertType, enabled) {
        this.alertTypes[alertType].enabled = enabled;
        
        const controls = document.getElementById(`controls_${alertType}`);
        if (controls) {
            controls.style.opacity = enabled ? '1' : '0.5';
            controls.style.pointerEvents = enabled ? 'auto' : 'none';
        }
        
        this.saveSettings();
    }
    
    testAlert(alertType) {
        const alertConfig = this.alertTypes[alertType];
        if (!alertConfig) return;
        
        // Show test alert
        this.showAlert(`Test: ${alertConfig.name} Alert`, alertConfig.priority, true);
        
        // Log test alert
        this.logAlert(alertType, `Test alert for ${alertConfig.name}`, true);
    }
    
    showAlert(message, priority = 'info', isTest = false) {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-notification alert-${priority}`;
        alertElement.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">${this.getAlertIcon(priority)}</div>
                <div class="alert-message">${message}</div>
                ${isTest ? '<div class="alert-test-badge">TEST</div>' : ''}
            </div>
            <button class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add styles if not already added
        if (!document.querySelector('#alert-notification-styles')) {
            const alertStyles = document.createElement('style');
            alertStyles.id = 'alert-notification-styles';
            alertStyles.textContent = `
                .alert-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    color: black;
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10010;
                    min-width: 300px;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                
                .alert-info { border-left: 4px solid #2196F3; }
                .alert-medium { border-left: 4px solid #FF9800; }
                .alert-high { border-left: 4px solid #F44336; }
                .alert-critical { border-left: 4px solid #9C27B0; }
                
                .alert-content {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    gap: 10px;
                }
                
                .alert-icon {
                    font-size: 20px;
                }
                
                .alert-message {
                    flex: 1;
                    font-size: 14px;
                }
                
                .alert-test-badge {
                    background: #4CAF50;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                }
                
                .alert-close {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 5px;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(alertStyles);
        }
        
        document.body.appendChild(alertElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertElement.parentElement) {
                alertElement.remove();
            }
        }, 5000);
    }
    
    getAlertIcon(priority) {
        const icons = {
            'info': 'ℹ️',
            'low': '💡',
            'medium': '⚠️',
            'high': '🚨',
            'critical': '🔴'
        };
        return icons[priority] || 'ℹ️';
    }
    
    logAlert(alertType, message, isTest = false) {
        const alertEntry = {
            type: alertType,
            message: message,
            priority: this.alertTypes[alertType]?.priority || 'info',
            timestamp: Date.now(),
            isTest: isTest
        };
        
        this.alertHistory.push(alertEntry);
        
        // Keep only last 500 alerts
        if (this.alertHistory.length > 500) {
            this.alertHistory.shift();
        }
        
        this.saveSettings();
    }
    
    updateHistoryDisplay() {
        const timeFilter = document.getElementById('historyTimeFilter').value;
        const typeFilter = document.getElementById('historyTypeFilter').value;
        
        let filteredHistory = this.alertHistory.filter(alert => !alert.isTest);
        
        // Apply time filter
        const now = Date.now();
        const timeFilters = {
            'today': 24 * 60 * 60 * 1000,
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000
        };
        
        if (timeFilters[timeFilter]) {
            const cutoff = now - timeFilters[timeFilter];
            filteredHistory = filteredHistory.filter(alert => alert.timestamp > cutoff);
        }
        
        // Apply type filter
        if (typeFilter !== 'all') {
            filteredHistory = filteredHistory.filter(alert => alert.type === typeFilter);
        }
        
        // Update stats
        this.updateHistoryStats(filteredHistory, timeFilter);
        
        // Update timeline
        this.updateHistoryTimeline(filteredHistory);
    }
    
    updateHistoryStats(filteredHistory, timeFilter) {
        document.getElementById('totalAlerts').textContent = filteredHistory.length;
        
        // Most frequent alert type
        const typeCounts = {};
        filteredHistory.forEach(alert => {
            typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
        });
        
        const mostFrequent = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b, '-'
        );
        
        document.getElementById('mostFrequent').textContent = 
            mostFrequent !== '-' ? this.alertTypes[mostFrequent]?.name || mostFrequent : '-';
        
        // Average per day
        const days = timeFilter === 'today' ? 1 : 
                    timeFilter === 'week' ? 7 : 30;
        const avgPerDay = Math.round(filteredHistory.length / days * 10) / 10;
        document.getElementById('averagePerDay').textContent = avgPerDay;
    }
    
    updateHistoryTimeline(filteredHistory) {
        const timeline = document.getElementById('alertTimeline');
        
        if (filteredHistory.length === 0) {
            timeline.innerHTML = '<div style="text-align: center; opacity: 0.7;">No alerts found for the selected criteria</div>';
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedHistory = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);
        
        timeline.innerHTML = sortedHistory.slice(0, 50).map(alert => `
            <div class="timeline-item">
                <div class="timeline-alert">
                    ${this.getAlertIcon(alert.priority)} ${this.alertTypes[alert.type]?.name || alert.type}
                </div>
                <div class="timeline-time">
                    ${new Date(alert.timestamp).toLocaleString()}
                </div>
            </div>
        `).join('');
    }
    
    startAlertMonitoring() {
        // Start monitoring eye health metrics and trigger alerts
        setInterval(() => {
            if (this.isInitialized) {
                this.checkForAlerts();
            }
        }, 10000); // Check every 10 seconds
    }
    
    checkForAlerts() {
        // Get current eye health metrics
        const metrics = this.getCurrentMetrics();
        const currentSettings = this.alertProfiles[this.currentProfile].settings;
        
        // Check each alert type
        Object.entries(this.alertTypes).forEach(([alertType, config]) => {
            if (!config.enabled) return;
            
            const shouldAlert = this.evaluateAlertCondition(alertType, metrics, currentSettings);
            if (shouldAlert) {
                this.triggerAlert(alertType, shouldAlert.message);
            }
        });
    }
    
    getCurrentMetrics() {
        // Interface with existing analytics system
        if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
            return eyeHealthAnalytics.getCurrentMetrics();
        }
        
        // Fallback mock data
        return {
            blinkRate: 15 + Math.random() * 10,
            eyeStrain: Math.random() * 0.8,
            drowsinessLevel: Math.random() * 0.6,
            screenTime: 120,
            gazeDirection: { zone: 'center' }
        };
    }
    
    evaluateAlertCondition(alertType, metrics, settings) {
        switch (alertType) {
            case 'blink_rate':
                const blinkThreshold = settings.blinkRateThreshold || { min: 12, max: 25 };
                if (metrics.blinkRate < blinkThreshold.min) {
                    return { message: `Low blink rate detected: ${Math.round(metrics.blinkRate)} blinks/min` };
                } else if (metrics.blinkRate > blinkThreshold.max) {
                    return { message: `High blink rate detected: ${Math.round(metrics.blinkRate)} blinks/min` };
                }
                break;
                
            case 'eye_strain':
                const strainThreshold = settings.eyeStrainThreshold || 0.5;
                if (metrics.eyeStrain > strainThreshold) {
                    return { message: `Eye strain level high: ${Math.round(metrics.eyeStrain * 100)}%` };
                }
                break;
                
            case 'drowsiness':
                const drowsinessThreshold = settings.drowsinessThreshold || 0.6;
                if (metrics.drowsinessLevel > drowsinessThreshold) {
                    return { message: `Drowsiness detected: ${Math.round(metrics.drowsinessLevel * 100)}%` };
                }
                break;
        }
        
        return false;
    }
    
    triggerAlert(alertType, message) {
        const config = this.alertTypes[alertType];
        
        // Check if enough time has passed since last alert of this type
        const lastAlert = this.alertHistory
            .filter(alert => alert.type === alertType && !alert.isTest)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
            
        const customSettings = this.customSettings[alertType] || {};
        const frequency = (customSettings.frequency || 30) * 60 * 1000; // Convert to milliseconds
        
        if (lastAlert && (Date.now() - lastAlert.timestamp) < frequency) {
            return; // Too soon for another alert
        }
        
        // Show the alert
        this.showAlert(message, config.priority);
        
        // Log the alert
        this.logAlert(alertType, message);
        
        // Play sound if enabled
        if (customSettings.sound && customSettings.sound !== 'none') {
            this.playAlertSound(customSettings.sound);
        }
    }
    
    playAlertSound(soundType) {
        // Simple sound generation (can be enhanced with actual audio files)
        if (typeof AudioContext !== 'undefined') {
            try {
                const audioCtx = new AudioContext();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                const frequencies = {
                    'gentle': 440,
                    'standard': 800,
                    'urgent': 1200
                };
                
                oscillator.frequency.setValueAtTime(frequencies[soundType] || 440, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
            } catch (error) {
                console.warn('Could not play alert sound:', error);
            }
        }
    }
    
    getControllerReport() {
        return {
            currentProfile: this.currentProfile,
            alertTypes: this.alertTypes,
            customSettings: this.customSettings,
            alertHistory: this.alertHistory.slice(-10), // Last 10 alerts
            isInitialized: this.isInitialized
        };
    }
}

// Initialize the alert sensitivity controller
let alertController;
document.addEventListener('DOMContentLoaded', function() {
    alertController = new AlertSensitivityController();
});