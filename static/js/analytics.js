// Eye Health Analytics Module
// Provides comprehensive analysis of eye health metrics

class EyeHealthAnalytics {
    constructor() {
        this.sessionData = {
            sessionStart: new Date(),
            blinkData: [],
            drowsinessData: [],
            screenTimeData: [],
            eyeStrainEvents: [],
            alertsTriggered: [],
            exerciseCompletion: []
        };
        
        this.healthMetrics = {
            avgBlinkRate: 0,
            blinkRateVariability: 0,
            drowsinessScore: 0,
            eyeStrainLevel: 0,
            screenTimeToday: 0,
            breaksTaken: 0,
            exercisesCompleted: 0
        };
        
        this.healthThresholds = {
            normalBlinkRate: { min: 12, max: 20 },
            lowBlinkRate: { min: 8, max: 12 },
            highDrowsiness: 70,
            moderateDrowsiness: 50,
            maxScreenTime: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
            breakInterval: 20 * 60 * 1000 // 20 minutes in milliseconds
        };
        
        this.loadStoredData();
        this.startAnalytics();
    }
    
    // Load stored data from localStorage
    loadStoredData() {
        const stored = localStorage.getItem('eyeHealthHistory');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.healthMetrics = { ...this.healthMetrics, ...data.metrics };
                this.sessionData = { ...this.sessionData, ...data.session };
            } catch (e) {
                console.warn('Error loading stored analytics data:', e);
            }
        }
    }
    
    // Save data to localStorage
    saveData() {
        const dataToSave = {
            metrics: this.healthMetrics,
            session: this.sessionData,
            lastUpdated: new Date()
        };
        localStorage.setItem('eyeHealthHistory', JSON.stringify(dataToSave));
    }
    
    // Start analytics collection
    startAnalytics() {
        // Update analytics every 5 seconds
        setInterval(() => {
            this.updateAnalytics();
        }, 5000);
        
        // Save data every minute
        setInterval(() => {
            this.saveData();
        }, 60000);
    }
    
    // Record blink data
    recordBlinkData(blinkRate, timestamp = new Date()) {
        this.sessionData.blinkData.push({
            rate: blinkRate,
            timestamp: timestamp
        });
        
        // Keep only last 100 blink measurements
        if (this.sessionData.blinkData.length > 100) {
            this.sessionData.blinkData.shift();
        }
        
        this.calculateBlinkMetrics();
    }
    
    // Record drowsiness data
    recordDrowsinessData(drowsinessLevel, timestamp = new Date()) {
        this.sessionData.drowsinessData.push({
            level: drowsinessLevel,
            timestamp: timestamp
        });
        
        // Keep only last 100 drowsiness measurements
        if (this.sessionData.drowsinessData.length > 100) {
            this.sessionData.drowsinessData.shift();
        }
        
        this.calculateDrowsinessMetrics();
    }
    
    // Record screen time
    recordScreenTime(duration, timestamp = new Date()) {
        this.sessionData.screenTimeData.push({
            duration: duration,
            timestamp: timestamp
        });
        
        this.healthMetrics.screenTimeToday += duration;
    }
    
    // Record eye strain event
    recordEyeStrain(severity, cause, timestamp = new Date()) {
        this.sessionData.eyeStrainEvents.push({
            severity: severity,
            cause: cause,
            timestamp: timestamp
        });
        
        this.calculateEyeStrainLevel();
    }
    
    // Record alert triggered
    recordAlert(type, message, timestamp = new Date()) {
        this.sessionData.alertsTriggered.push({
            type: type,
            message: message,
            timestamp: timestamp
        });
    }
    
    // Calculate blink rate metrics
    calculateBlinkMetrics() {
        if (this.sessionData.blinkData.length === 0) return;
        
        const rates = this.sessionData.blinkData.map(d => d.rate);
        this.healthMetrics.avgBlinkRate = rates.reduce((a, b) => a + b, 0) / rates.length;
        
        // Calculate variability (standard deviation)
        const mean = this.healthMetrics.avgBlinkRate;
        const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
        this.healthMetrics.blinkRateVariability = Math.sqrt(variance);
    }
    
    // Calculate drowsiness metrics
    calculateDrowsinessMetrics() {
        if (this.sessionData.drowsinessData.length === 0) return;
        
        const levels = this.sessionData.drowsinessData.map(d => d.level);
        this.healthMetrics.drowsinessScore = levels.reduce((a, b) => a + b, 0) / levels.length;
    }
    
    // Calculate eye strain level
    calculateEyeStrainLevel() {
        const recentEvents = this.sessionData.eyeStrainEvents.filter(
            event => new Date() - event.timestamp < 60 * 60 * 1000 // Last hour
        );
        
        this.healthMetrics.eyeStrainLevel = Math.min(100, recentEvents.length * 10);
    }
    
    // Update overall analytics
    updateAnalytics() {
        this.calculateBlinkMetrics();
        this.calculateDrowsinessMetrics();
        this.calculateEyeStrainLevel();
    }
    
    // Generate health insights
    generateHealthInsights() {
        const insights = {
            overall: this.getOverallHealthScore(),
            recommendations: [],
            warnings: [],
            trends: this.getHealthTrends(),
            achievements: this.getAchievements()
        };
        
        // Blink rate insights
        if (this.healthMetrics.avgBlinkRate < this.healthThresholds.normalBlinkRate.min) {
            insights.warnings.push({
                type: 'low_blink_rate',
                message: `Your blink rate (${this.healthMetrics.avgBlinkRate.toFixed(1)} bpm) is below normal. This may indicate dry eyes or eye strain.`,
                severity: 'medium'
            });
            insights.recommendations.push({
                type: 'blink_exercise',
                message: 'Practice conscious blinking exercises to improve tear distribution.',
                action: 'Start Eye Exercises'
            });
        }
        
        // Drowsiness insights
        if (this.healthMetrics.drowsinessScore > this.healthThresholds.highDrowsiness) {
            insights.warnings.push({
                type: 'high_drowsiness',
                message: `High drowsiness level detected (${this.healthMetrics.drowsinessScore.toFixed(0)}%). Consider taking a break.`,
                severity: 'high'
            });
            insights.recommendations.push({
                type: 'break_time',
                message: 'Take a 10-15 minute break away from screens.',
                action: 'Schedule Break'
            });
        }
        
        // Screen time insights
        if (this.healthMetrics.screenTimeToday > this.healthThresholds.maxScreenTime) {
            insights.warnings.push({
                type: 'excessive_screen_time',
                message: `Screen time today exceeds recommended limits (${(this.healthMetrics.screenTimeToday / (60 * 60 * 1000)).toFixed(1)} hours).`,
                severity: 'medium'
            });
            insights.recommendations.push({
                type: 'reduce_screen_time',
                message: 'Consider reducing screen time or taking more frequent breaks.',
                action: 'Set Screen Time Limits'
            });
        }
        
        // Eye strain insights
        if (this.healthMetrics.eyeStrainLevel > 50) {
            insights.warnings.push({
                type: 'eye_strain',
                message: `Elevated eye strain detected (${this.healthMetrics.eyeStrainLevel}%). Your eyes may need rest.`,
                severity: 'medium'
            });
            insights.recommendations.push({
                type: 'eye_rest',
                message: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.',
                action: 'Start 20-20-20 Exercise'
            });
        }
        
        return insights;
    }
    
    // Calculate overall health score (0-100)
    getOverallHealthScore() {
        let score = 100;
        
        // Deduct points for poor blink rate
        if (this.healthMetrics.avgBlinkRate < this.healthThresholds.normalBlinkRate.min) {
            score -= 20;
        }
        
        // Deduct points for high drowsiness
        if (this.healthMetrics.drowsinessScore > this.healthThresholds.moderateDrowsiness) {
            score -= (this.healthMetrics.drowsinessScore - this.healthThresholds.moderateDrowsiness) * 0.5;
        }
        
        // Deduct points for eye strain
        score -= this.healthMetrics.eyeStrainLevel * 0.3;
        
        // Deduct points for excessive screen time
        if (this.healthMetrics.screenTimeToday > this.healthThresholds.maxScreenTime) {
            score -= 15;
        }
        
        return Math.max(0, Math.round(score));
    }
    
    // Get health trends
    getHealthTrends() {
        const trends = {
            blinkRate: this.getTrend(this.sessionData.blinkData, 'rate'),
            drowsiness: this.getTrend(this.sessionData.drowsinessData, 'level'),
            eyeStrain: this.getEyeStrainTrend()
        };
        
        return trends;
    }
    
    // Calculate trend for a specific metric
    getTrend(data, field) {
        if (data.length < 2) return 'stable';
        
        const recent = data.slice(-10); // Last 10 measurements
        const older = data.slice(-20, -10); // Previous 10 measurements
        
        if (older.length === 0) return 'stable';
        
        const recentAvg = recent.reduce((sum, item) => sum + item[field], 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item[field], 0) / older.length;
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }
    
    // Get eye strain trend
    getEyeStrainTrend() {
        const recentEvents = this.sessionData.eyeStrainEvents.filter(
            event => new Date() - event.timestamp < 60 * 60 * 1000 // Last hour
        );
        
        const olderEvents = this.sessionData.eyeStrainEvents.filter(
            event => {
                const hoursDiff = (new Date() - event.timestamp) / (60 * 60 * 1000);
                return hoursDiff >= 1 && hoursDiff < 2; // 1-2 hours ago
            }
        );
        
        if (recentEvents.length > olderEvents.length) return 'increasing';
        if (recentEvents.length < olderEvents.length) return 'decreasing';
        return 'stable';
    }
    
    // Get achievements
    getAchievements() {
        const achievements = [];
        
        // Blink rate achievement
        if (this.healthMetrics.avgBlinkRate >= this.healthThresholds.normalBlinkRate.min && 
            this.healthMetrics.avgBlinkRate <= this.healthThresholds.normalBlinkRate.max) {
            achievements.push({
                type: 'healthy_blink_rate',
                title: 'Healthy Blink Rate',
                description: 'Maintaining a healthy blink rate helps prevent dry eyes.',
                icon: '👁️'
            });
        }
        
        // Low drowsiness achievement
        if (this.healthMetrics.drowsinessScore < this.healthThresholds.moderateDrowsiness) {
            achievements.push({
                type: 'alert_and_focused',
                title: 'Alert & Focused',
                description: 'Staying alert helps maintain productivity and safety.',
                icon: '⚡'
            });
        }
        
        // Exercise completion achievement
        if (this.healthMetrics.exercisesCompleted >= 3) {
            achievements.push({
                type: 'exercise_enthusiast',
                title: 'Exercise Enthusiast',
                description: 'Regular eye exercises help maintain eye health.',
                icon: '🏃‍♂️'
            });
        }
        
        return achievements;
    }
    
    // Get daily summary
    getDailySummary() {
        return {
            date: new Date().toLocaleDateString(),
            sessionDuration: new Date() - this.sessionData.sessionStart,
            avgBlinkRate: this.healthMetrics.avgBlinkRate,
            drowsinessScore: this.healthMetrics.drowsinessScore,
            eyeStrainLevel: this.healthMetrics.eyeStrainLevel,
            screenTime: this.healthMetrics.screenTimeToday,
            breaksTaken: this.healthMetrics.breaksTaken,
            exercisesCompleted: this.healthMetrics.exercisesCompleted,
            alertsTriggered: this.sessionData.alertsTriggered.length,
            overallScore: this.getOverallHealthScore()
        };
    }
    
    // Export analytics data
    exportData() {
        const exportData = {
            metrics: this.healthMetrics,
            sessionData: this.sessionData,
            insights: this.generateHealthInsights(),
            summary: this.getDailySummary(),
            exportDate: new Date()
        };
        
        return exportData;
    }
}

// Initialize analytics when the page loads
let eyeHealthAnalytics = null;

document.addEventListener('DOMContentLoaded', function() {
    eyeHealthAnalytics = new EyeHealthAnalytics();
    console.log('Eye Health Analytics initialized');
});