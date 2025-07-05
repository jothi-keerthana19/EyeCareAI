// Emoji-Based Mood and Eye Health Correlation System
// Tracks user mood and correlates it with eye health metrics

class MoodEyeHealthCorrelation {
    constructor() {
        this.moodHistory = [];
        this.correlationData = {};
        this.currentMood = null;
        this.moodCheckInterval = 2 * 60 * 60 * 1000; // 2 hours
        this.lastMoodCheck = 0;
        
        this.moodEmojis = {
            'very_happy': { emoji: '😄', label: 'Very Happy', score: 5, color: '#4CAF50' },
            'happy': { emoji: '😊', label: 'Happy', score: 4, color: '#8BC34A' },
            'neutral': { emoji: '😐', label: 'Neutral', score: 3, color: '#FFC107' },
            'tired': { emoji: '😴', label: 'Tired', score: 2, color: '#FF9800' },
            'stressed': { emoji: '😰', label: 'Stressed', score: 1, color: '#F44336' },
            'frustrated': { emoji: '😤', label: 'Frustrated', score: 1, color: '#E91E63' },
            'focused': { emoji: '🤓', label: 'Focused', score: 4, color: '#2196F3' },
            'sleepy': { emoji: '😪', label: 'Sleepy', score: 2, color: '#9C27B0' }
        };
        
        this.init();
    }
    
    init() {
        this.loadMoodHistory();
        this.createMoodInterface();
        this.startMoodTracking();
        console.log('Mood correlation system initialized');
    }
    
    loadMoodHistory() {
        const saved = localStorage.getItem('moodHistory');
        if (saved) {
            this.moodHistory = JSON.parse(saved);
        }
        
        const correlations = localStorage.getItem('moodCorrelations');
        if (correlations) {
            this.correlationData = JSON.parse(correlations);
        }
    }
    
    saveMoodData() {
        localStorage.setItem('moodHistory', JSON.stringify(this.moodHistory));
        localStorage.setItem('moodCorrelations', JSON.stringify(this.correlationData));
    }
    
    createMoodInterface() {
        // Create floating mood check widget
        const widget = document.createElement('div');
        widget.className = 'mood-widget';
        widget.innerHTML = `
            <div class="mood-widget-header">
                <span>😊 How are you feeling?</span>
                <button class="mood-close-btn">&times;</button>
            </div>
            <div class="mood-options">
                ${Object.entries(this.moodEmojis).map(([key, mood]) => `
                    <button class="mood-option" data-mood="${key}" title="${mood.label}">
                        <span class="mood-emoji">${mood.emoji}</span>
                        <span class="mood-label">${mood.label}</span>
                    </button>
                `).join('')}
            </div>
            <div class="mood-widget-footer">
                <small>Your mood helps us understand your eye health patterns</small>
            </div>
        `;
        
        // Create mood dashboard
        const dashboard = document.createElement('div');
        dashboard.className = 'mood-dashboard';
        dashboard.innerHTML = `
            <div class="mood-dashboard-header">
                <h4>📊 Mood & Eye Health</h4>
                <button class="mood-toggle-btn">Hide</button>
            </div>
            <div class="mood-dashboard-content">
                <div class="current-mood">
                    <span>Current mood: </span>
                    <span class="current-mood-display">Not set</span>
                </div>
                <div class="mood-correlation-chart">
                    <canvas id="moodCorrelationChart" width="300" height="200"></canvas>
                </div>
                <div class="mood-insights">
                    <h5>💡 Insights</h5>
                    <div class="insights-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        document.body.appendChild(dashboard);
        
        this.addMoodStyles();
        this.setupMoodEventListeners();
    }
    
    addMoodStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mood-widget {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 9998;
                min-width: 280px;
                display: none;
                animation: slideInLeft 0.5s ease;
            }
            
            .mood-widget.show {
                display: block;
            }
            
            .mood-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                font-weight: bold;
            }
            
            .mood-close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
            }
            
            .mood-options {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .mood-option {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 10px;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                color: white;
            }
            
            .mood-option:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .mood-option.selected {
                border-color: #FFD700;
                background: rgba(255, 215, 0, 0.2);
            }
            
            .mood-emoji {
                font-size: 20px;
            }
            
            .mood-label {
                font-size: 12px;
                font-weight: 500;
            }
            
            .mood-widget-footer {
                text-align: center;
                font-size: 10px;
                opacity: 0.8;
                margin-top: 5px;
            }
            
            .mood-dashboard {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                z-index: 9997;
                min-width: 350px;
                max-height: 400px;
                overflow-y: auto;
                display: none;
            }
            
            .mood-dashboard.show {
                display: block;
                animation: slideInDown 0.5s ease;
            }
            
            .mood-dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 10px;
            }
            
            .mood-toggle-btn {
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 5px 10px;
                font-size: 12px;
                cursor: pointer;
            }
            
            .current-mood {
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .current-mood-display {
                font-weight: bold;
                color: #667eea;
            }
            
            .mood-correlation-chart {
                margin-bottom: 15px;
                text-align: center;
            }
            
            .mood-insights {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
            }
            
            .mood-insights h5 {
                margin: 0 0 10px 0;
                color: #495057;
            }
            
            .insight-item {
                background: white;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 4px solid #667eea;
                font-size: 14px;
            }
            
            .insight-positive {
                border-left-color: #28a745;
                background: rgba(40, 167, 69, 0.1);
            }
            
            .insight-negative {
                border-left-color: #dc3545;
                background: rgba(220, 53, 69, 0.1);
            }
            
            @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            
            @keyframes slideInDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupMoodEventListeners() {
        // Mood option selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const moodKey = e.currentTarget.dataset.mood;
                this.selectMood(moodKey);
            });
        });
        
        // Close mood widget
        document.querySelector('.mood-close-btn').addEventListener('click', () => {
            this.hideMoodWidget();
        });
        
        // Toggle mood dashboard
        document.querySelector('.mood-toggle-btn').addEventListener('click', (e) => {
            const dashboard = document.querySelector('.mood-dashboard');
            const btn = e.target;
            
            if (dashboard.classList.contains('show')) {
                dashboard.classList.remove('show');
                btn.textContent = 'Show';
            } else {
                dashboard.classList.add('show');
                btn.textContent = 'Hide';
                this.updateMoodDashboard();
            }
        });
    }
    
    startMoodTracking() {
        // Check if it's time for a mood check
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastMoodCheck >= this.moodCheckInterval) {
                this.showMoodWidget();
            }
        }, 60000); // Check every minute
        
        // Show initial mood check after 5 minutes
        setTimeout(() => {
            this.showMoodWidget();
        }, 5 * 60 * 1000);
    }
    
    showMoodWidget() {
        document.querySelector('.mood-widget').classList.add('show');
        this.lastMoodCheck = Date.now();
    }
    
    hideMoodWidget() {
        document.querySelector('.mood-widget').classList.remove('show');
    }
    
    selectMood(moodKey) {
        // Clear previous selection
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select current mood
        document.querySelector(`[data-mood="${moodKey}"]`).classList.add('selected');
        
        this.currentMood = moodKey;
        this.recordMood(moodKey);
        
        // Auto-hide after selection
        setTimeout(() => {
            this.hideMoodWidget();
        }, 1500);
    }
    
    recordMood(moodKey) {
        const now = new Date();
        const moodEntry = {
            mood: moodKey,
            timestamp: now.toISOString(),
            eyeMetrics: this.getCurrentEyeMetrics()
        };
        
        this.moodHistory.push(moodEntry);
        
        // Keep only last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.moodHistory = this.moodHistory.filter(entry => 
            new Date(entry.timestamp) > thirtyDaysAgo
        );
        
        this.updateCorrelations();
        this.saveMoodData();
        this.updateCurrentMoodDisplay();
    }
    
    getCurrentEyeMetrics() {
        // Get current eye health metrics from the analytics system
        if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
            const metrics = eyeHealthAnalytics.getCurrentMetrics();
            return {
                blinkRate: metrics.blinkRate,
                eyeRatio: metrics.eyeRatio,
                drowsinessLevel: metrics.drowsinessLevel,
                screenTime: metrics.screenTime,
                eyeStrain: metrics.eyeStrain
            };
        }
        
        return {
            blinkRate: 15,
            eyeRatio: 0.3,
            drowsinessLevel: 0.2,
            screenTime: 60,
            eyeStrain: 0.3
        };
    }
    
    updateCorrelations() {
        // Calculate correlations between mood and eye metrics
        const moodGroups = {};
        
        this.moodHistory.forEach(entry => {
            if (!moodGroups[entry.mood]) {
                moodGroups[entry.mood] = [];
            }
            moodGroups[entry.mood].push(entry.eyeMetrics);
        });
        
        // Calculate averages for each mood
        Object.keys(moodGroups).forEach(mood => {
            const metrics = moodGroups[mood];
            const averages = {
                blinkRate: metrics.reduce((sum, m) => sum + m.blinkRate, 0) / metrics.length,
                eyeRatio: metrics.reduce((sum, m) => sum + m.eyeRatio, 0) / metrics.length,
                drowsinessLevel: metrics.reduce((sum, m) => sum + m.drowsinessLevel, 0) / metrics.length,
                screenTime: metrics.reduce((sum, m) => sum + m.screenTime, 0) / metrics.length,
                eyeStrain: metrics.reduce((sum, m) => sum + m.eyeStrain, 0) / metrics.length
            };
            
            this.correlationData[mood] = averages;
        });
    }
    
    updateCurrentMoodDisplay() {
        if (this.currentMood) {
            const moodData = this.moodEmojis[this.currentMood];
            document.querySelector('.current-mood-display').innerHTML = 
                `${moodData.emoji} ${moodData.label}`;
        }
    }
    
    updateMoodDashboard() {
        this.updateCurrentMoodDisplay();
        this.drawCorrelationChart();
        this.generateInsights();
    }
    
    drawCorrelationChart() {
        const canvas = document.getElementById('moodCorrelationChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple bar chart showing mood distribution
        const moodCounts = {};
        this.moodHistory.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(moodCounts));
        const barWidth = canvas.width / Object.keys(moodCounts).length;
        
        Object.entries(moodCounts).forEach(([mood, count], index) => {
            const barHeight = (count / maxCount) * (canvas.height - 40);
            const x = index * barWidth;
            const y = canvas.height - barHeight - 20;
            
            const moodData = this.moodEmojis[mood];
            ctx.fillStyle = moodData.color;
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
            
            // Draw emoji
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(moodData.emoji, x + barWidth / 2, canvas.height - 5);
        });
    }
    
    generateInsights() {
        const insightsList = document.querySelector('.insights-list');
        insightsList.innerHTML = '';
        
        const insights = this.analyzeCorrelations();
        
        insights.forEach(insight => {
            const item = document.createElement('div');
            item.className = `insight-item ${insight.type}`;
            item.textContent = insight.message;
            insightsList.appendChild(item);
        });
    }
    
    analyzeCorrelations() {
        const insights = [];
        
        if (Object.keys(this.correlationData).length < 2) {
            insights.push({
                type: 'neutral',
                message: 'Keep tracking your mood to see patterns with your eye health!'
            });
            return insights;
        }
        
        // Find mood with best eye health
        let bestMood = null;
        let bestScore = -1;
        
        Object.entries(this.correlationData).forEach(([mood, metrics]) => {
            const score = metrics.blinkRate * 0.3 + 
                         (1 - metrics.drowsinessLevel) * 0.3 + 
                         (1 - metrics.eyeStrain) * 0.4;
            
            if (score > bestScore) {
                bestScore = score;
                bestMood = mood;
            }
        });
        
        if (bestMood) {
            const moodData = this.moodEmojis[bestMood];
            insights.push({
                type: 'insight-positive',
                message: `Your eyes are healthiest when you feel ${moodData.label} ${moodData.emoji}`
            });
        }
        
        // Check for stress patterns
        if (this.correlationData.stressed) {
            const stressMetrics = this.correlationData.stressed;
            if (stressMetrics.eyeStrain > 0.6) {
                insights.push({
                    type: 'insight-negative',
                    message: 'Stress seems to increase your eye strain. Try relaxation techniques!'
                });
            }
        }
        
        // Check for tired patterns
        if (this.correlationData.tired || this.correlationData.sleepy) {
            insights.push({
                type: 'insight-negative',
                message: 'Tiredness affects your blink rate. Consider taking more breaks!'
            });
        }
        
        return insights;
    }
    
    getMoodReport() {
        return {
            currentMood: this.currentMood,
            moodHistory: this.moodHistory,
            correlations: this.correlationData,
            insights: this.analyzeCorrelations()
        };
    }
}

// Initialize mood correlation system
let moodEyeHealth;
document.addEventListener('DOMContentLoaded', function() {
    moodEyeHealth = new MoodEyeHealthCorrelation();
});