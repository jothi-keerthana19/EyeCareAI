// Gentle Micro-Animation Rest Reminders
// Provides subtle visual cues for break reminders without being disruptive

// Prevent multiple declarations
if (typeof window.RestReminderSystem !== 'undefined') {
    console.log('RestReminderSystem already exists, skipping redeclaration');
} else {

class RestReminderSystem {
    constructor() {
        this.reminderInterval = 20 * 60 * 1000; // 20 minutes (20-20-20 rule)
        this.lastReminderTime = Date.now();
        this.isActive = false;
        this.animationId = null;
        this.reminderElement = null;
        this.breathingElement = null;
        this.pulseElement = null;
        this.audioContext = null;
        this.audioEnabled = false; // Disable audio for now due to browser issues
        this.reminderTimer = null; // Store the interval timer
        
        this.init();
        // this.initAudio(); // Disabled for now
    }
    
    init() {
        this.createReminderElements();
        this.startReminderTimer();
        console.log('Rest reminder system initialized');
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (error) {
            console.warn('Audio not available:', error);
            this.audioEnabled = false;
        }
    }
    
    playNotificationSound(type = 'gentle') {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different sounds for different notification types
            switch (type) {
                case 'gentle':
                    // Soft bell sound
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    oscillator.type = 'sine';
                    break;
                    
                case 'reminder':
                    // Two-tone chime
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.2); // E5
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.type = 'triangle';
                    break;
                    
                case 'urgent':
                    // Alert tone
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.type = 'square';
                    break;
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
        } catch (error) {
            console.warn('Error playing notification sound:', error);
        }
    }
    
    createReminderElements() {
        // Create gentle reminder overlay
        this.reminderElement = document.createElement('div');
        this.reminderElement.id = 'restReminderOverlay';
        this.reminderElement.className = 'rest-reminder-overlay';
        this.reminderElement.innerHTML = `
            <div class="reminder-content">
                <div class="breathing-circle" id="breathingCircle">
                    <div class="breathing-inner"></div>
                </div>
                <div class="reminder-text">
                    <h3>Time for a break</h3>
                    <p>Look at something 20 feet away for 20 seconds</p>
                    <div class="reminder-timer" id="reminderTimer">20</div>
                </div>
                <div class="reminder-actions">
                    <button class="btn btn-primary btn-sm" onclick="restReminders.startBreakTimer()">
                        Start Break
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="restReminders.snoozeReminder()">
                        Snooze 5min
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="restReminders.dismissReminder()">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        // Create subtle pulse indicator
        this.pulseElement = document.createElement('div');
        this.pulseElement.id = 'restPulseIndicator';
        this.pulseElement.className = 'rest-pulse-indicator';
        this.pulseElement.innerHTML = `
            <div class="pulse-ring"></div>
            <div class="pulse-dot">
                <i class="bi bi-eye"></i>
            </div>
        `;
        
        // Add CSS styles
        this.addStyles();
        
        // Append to body (hidden initially)
        document.body.appendChild(this.reminderElement);
        document.body.appendChild(this.pulseElement);
        
        this.breathingElement = document.getElementById('breathingCircle');
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rest-reminder-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
            }
            
            .rest-reminder-overlay.show {
                display: flex;
                opacity: 1;
            }
            
            .reminder-content {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideInUp 0.5s ease-out;
            }
            
            .breathing-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: linear-gradient(45deg, #007bff, #28a745);
                margin: 0 auto 1.5rem;
                position: relative;
                animation: breathe 4s ease-in-out infinite;
            }
            
            .breathing-inner {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: breatheInner 4s ease-in-out infinite;
            }
            
            .reminder-text h3 {
                color: #333;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            
            .reminder-text p {
                color: #666;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            }
            
            .reminder-timer {
                font-size: 2rem;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 1.5rem;
                font-family: 'Monaco', 'Menlo', monospace;
            }
            
            .reminder-actions {
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .rest-pulse-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                display: none;
                z-index: 1000;
                cursor: pointer;
            }
            
            .rest-pulse-indicator.show {
                display: block;
                animation: fadeIn 0.5s ease-in;
            }
            
            .pulse-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid rgba(0, 123, 255, 0.3);
                border-radius: 50%;
                animation: pulse 2s ease-in-out infinite;
            }
            
            .pulse-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background: #007bff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
            }
            
            @keyframes breathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes breatheInner {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(0.8); }
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Gentle screen tint for eye strain relief */
            .eye-strain-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 193, 7, 0.05);
                pointer-events: none;
                z-index: 999;
                opacity: 0;
                transition: opacity 1s ease-in-out;
            }
            
            .eye-strain-overlay.active {
                opacity: 1;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .reminder-content {
                    margin: 1rem;
                    padding: 1.5rem;
                }
                
                .reminder-actions {
                    flex-direction: column;
                }
                
                .rest-pulse-indicator {
                    top: 10px;
                    right: 10px;
                    width: 40px;
                    height: 40px;
                }
                
                .pulse-dot {
                    width: 25px;
                    height: 25px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    startReminderTimer() {
        // Clear any existing timer to prevent duplicates
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
        }
        
        // Get user's reminder setting from localStorage or use default
        const userReminderSetting = localStorage.getItem('reminderInterval');
        if (userReminderSetting) {
            this.reminderInterval = parseInt(userReminderSetting) * 60000; // Convert minutes to milliseconds
            console.log(`Using custom reminder interval: ${userReminderSetting} minutes`);
        }
        
        // Set initial time
        this.lastReminderTime = Date.now();
        
        // Check every minute if it's time for a reminder
        this.reminderTimer = setInterval(() => {
            const now = Date.now();
            const timeSinceLastReminder = now - this.lastReminderTime;
            
            if (timeSinceLastReminder >= this.reminderInterval && !this.isActive) {
                this.showGentleReminder();
                this.lastReminderTime = now;
            }
        }, 60000); // Check every minute
        
        console.log(`Rest reminder timer started - ${this.reminderInterval / 60000} minutes interval`);
    }
    
    showGentleReminder() {
        // Show subtle pulse indicator first
        this.showPulseIndicator();
        
        // After 30 seconds, show full reminder if not acknowledged
        setTimeout(() => {
            if (this.pulseElement.classList.contains('show')) {
                this.showFullReminder();
            }
        }, 30000);
    }
    
    showPulseIndicator() {
        this.pulseElement.classList.add('show');
        
        // Play gentle notification sound
        this.playNotificationSound('gentle');
        
        // Add click handler to show full reminder
        this.pulseElement.onclick = () => {
            this.showFullReminder();
        };
        
        // Auto-hide after 60 seconds if not clicked
        setTimeout(() => {
            this.hidePulseIndicator();
        }, 60000);
    }
    
    hidePulseIndicator() {
        this.pulseElement.classList.remove('show');
        this.pulseElement.onclick = null;
    }
    
    showFullReminder() {
        this.hidePulseIndicator();
        this.reminderElement.classList.add('show');
        this.isActive = true;
        
        // Play reminder sound
        this.playNotificationSound('reminder');
        
        // Record reminder in analytics
        if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
            eyeHealthAnalytics.recordAlert('rest_reminder', 'Time for a break - 20-20-20 rule');
        }
        
        // Show breathing animation
        this.startBreathingAnimation();
    }
    
    startBreathingAnimation() {
        if (this.breathingElement) {
            this.breathingElement.style.animationDuration = '4s';
        }
    }
    
    startBreakTimer() {
        this.hideFullReminder();
        this.startTwentySecondBreak();
    }
    
    startTwentySecondBreak() {
        // Create break timer overlay
        const breakOverlay = document.createElement('div');
        breakOverlay.className = 'rest-reminder-overlay show';
        breakOverlay.innerHTML = `
            <div class="reminder-content">
                <div class="breathing-circle">
                    <div class="breathing-inner"></div>
                </div>
                <div class="reminder-text">
                    <h3>Look away from your screen</h3>
                    <p>Focus on something at least 20 feet away</p>
                    <div class="reminder-timer" id="breakTimer">20</div>
                    <p><small>Relax your eyes and blink naturally</small></p>
                </div>
                <button class="btn btn-outline-secondary btn-sm" onclick="this.parentElement.parentElement.parentElement.remove()">
                    End Break Early
                </button>
            </div>
        `;
        
        document.body.appendChild(breakOverlay);
        
        // Add gentle eye strain relief overlay
        this.addEyeStrainRelief();
        
        // Start countdown
        let timeLeft = 20;
        const timerElement = breakOverlay.querySelector('#breakTimer');
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                this.completeBreak(breakOverlay);
            }
        }, 1000);
    }
    
    addEyeStrainRelief() {
        const strainOverlay = document.createElement('div');
        strainOverlay.className = 'eye-strain-overlay';
        document.body.appendChild(strainOverlay);
        
        // Gradually apply tint
        setTimeout(() => {
            strainOverlay.classList.add('active');
        }, 100);
        
        // Remove after break
        setTimeout(() => {
            strainOverlay.classList.remove('active');
            setTimeout(() => {
                strainOverlay.remove();
            }, 1000);
        }, 20000);
    }
    
    completeBreak(breakOverlay) {
        breakOverlay.innerHTML = `
            <div class="reminder-content">
                <div style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;">✓</div>
                <h3>Great job!</h3>
                <p>Your eyes are refreshed. Keep up the healthy habits!</p>
                <button class="btn btn-success" onclick="this.parentElement.parentElement.parentElement.remove()">
                    Continue Working
                </button>
            </div>
        `;
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            breakOverlay.remove();
        }, 3000);
        
        // Record break completion
        if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
            eyeHealthAnalytics.healthMetrics.breaksTaken++;
        }
    }
    
    snoozeReminder() {
        this.hideFullReminder();
        this.lastReminderTime = Date.now() + (5 * 60 * 1000); // Add 5 minutes
        
        // Show snooze confirmation
        this.showSnoozeConfirmation();
    }
    
    showSnoozeConfirmation() {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            animation: slideInDown 0.3s ease-out;
        `;
        notification.innerHTML = `
            <i class="bi bi-clock"></i> Reminder snoozed for 5 minutes
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    dismissReminder() {
        this.hideFullReminder();
        this.lastReminderTime = Date.now();
    }
    
    hideFullReminder() {
        this.reminderElement.classList.remove('show');
        this.isActive = false;
    }
    
    // Method to manually trigger reminder (for testing)
    triggerReminder() {
        this.showGentleReminder();
    }
    
    // Method to adjust reminder interval
    setReminderInterval(minutes) {
        this.reminderInterval = minutes * 60 * 1000;
        localStorage.setItem('reminderInterval', minutes);
        
        // Reset the timer with new interval
        this.lastReminderTime = Date.now();
        this.startReminderTimer();
        
        console.log(`Reminder interval set to ${minutes} minutes`);
    }
    
    // Cleanup method
    destroy() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
        
        if (this.reminderElement && this.reminderElement.parentNode) {
            this.reminderElement.parentNode.removeChild(this.reminderElement);
        }
        
        if (this.pulseElement && this.pulseElement.parentNode) {
            this.pulseElement.parentNode.removeChild(this.pulseElement);
        }
    }
    
    // Integration with eye tracking for smart reminders
    onEyeStrainDetected(level) {
        if (level > 70 && !this.isActive) {
            // Immediate gentle reminder for high eye strain
            this.showPulseIndicator();
        }
    }
    
    onDrowsinessDetected(level) {
        if (level > 80 && !this.isActive) {
            // Urgent break suggestion for high drowsiness
            this.showFullReminder();
        }
    }
}

} // End of class declaration check

// Singleton pattern - only create one instance
window.RestReminderSystem = RestReminderSystem;

// Initialize rest reminder system with singleton pattern
if (!window.restReminders) {
    document.addEventListener('DOMContentLoaded', function() {
        // Ensure only one instance exists
        if (!window.restReminders) {
            window.restReminders = new RestReminderSystem();
            console.log('Rest reminder system singleton created');
        }
    });
} else {
    console.log('Rest reminder system already exists, reusing instance');
}

// Export for integration with other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestReminderSystem;
}