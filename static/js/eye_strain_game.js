// Interactive Eye Strain Risk Game
// Gamifies eye health monitoring with challenges and rewards

class EyeStrainRiskGame {
    constructor() {
        this.gameActive = false;
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.challenges = [];
        this.currentChallenge = null;
        this.achievements = [];
        this.gameStats = {
            gamesPlayed: 0,
            totalScore: 0,
            challengesCompleted: 0,
            perfectGames: 0
        };
        
        this.challengeTypes = {
            'blink_challenge': {
                name: 'Blink Master',
                description: 'Maintain healthy blink rate for 60 seconds',
                icon: '👁️',
                targetMetric: 'blinkRate',
                targetValue: { min: 15, max: 25 },
                duration: 60000,
                points: 100
            },
            'focus_challenge': {
                name: 'Focus Fighter',
                description: 'Keep eyes focused without strain for 2 minutes',
                icon: '🎯',
                targetMetric: 'eyeStrain',
                targetValue: { max: 0.3 },
                duration: 120000,
                points: 150
            },
            'break_challenge': {
                name: 'Break Boss',
                description: 'Take micro-breaks every 20 seconds',
                icon: '⏰',
                targetMetric: 'breakCompliance',
                targetValue: { min: 80 },
                duration: 180000,
                points: 200
            },
            'distance_challenge': {
                name: 'Distance Detective',
                description: 'Look at distant objects for 20 seconds',
                icon: '🔭',
                targetMetric: 'gazeDistance',
                targetValue: { min: 20 },
                duration: 20000,
                points: 80
            },
            'posture_challenge': {
                name: 'Posture Pro',
                description: 'Maintain good screen position',
                icon: '🪑',
                targetMetric: 'gazeAngle',
                targetValue: { optimal: 'center' },
                duration: 90000,
                points: 120
            }
        };
        
        this.powerUps = {
            'shield': { name: 'Eye Shield', icon: '🛡️', effect: 'protection', duration: 30000 },
            'boost': { name: 'Health Boost', icon: '⚡', effect: 'scoreMultiplier', multiplier: 2 },
            'time': { name: 'Time Extension', icon: '⏱️', effect: 'timeBonus', bonus: 15000 }
        };
        
        this.init();
    }
    
    init() {
        this.loadGameData();
        this.createGameInterface();
        this.setupGameEventListeners();
        console.log('Eye strain risk game initialized');
    }
    
    loadGameData() {
        const saved = localStorage.getItem('eyeStrainGameData');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentLevel = data.currentLevel || 1;
            this.gameStats = { ...this.gameStats, ...data.gameStats };
            this.achievements = data.achievements || [];
        }
    }
    
    saveGameData() {
        const data = {
            currentLevel: this.currentLevel,
            gameStats: this.gameStats,
            achievements: this.achievements
        };
        localStorage.setItem('eyeStrainGameData', JSON.stringify(data));
    }
    
    createGameInterface() {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'eye-strain-game';
        gameContainer.innerHTML = `
            <div class="game-header">
                <h3>🎮 Eye Health Challenge</h3>
                <div class="game-controls">
                    <button id="startGameBtn" class="btn btn-success">Start Game</button>
                    <button id="pauseGameBtn" class="btn btn-warning" disabled>Pause</button>
                    <button id="stopGameBtn" class="btn btn-danger" disabled>Stop</button>
                </div>
            </div>
            
            <div class="game-stats">
                <div class="stat-item">
                    <span class="stat-label">Level:</span>
                    <span class="stat-value" id="levelDisplay">1</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Score:</span>
                    <span class="stat-value" id="scoreDisplay">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Lives:</span>
                    <span class="stat-value" id="livesDisplay">❤️❤️❤️</span>
                </div>
            </div>
            
            <div class="challenge-area">
                <div class="challenge-display" id="challengeDisplay">
                    <div class="challenge-waiting">
                        🎯 Ready to play? Start the game to begin your eye health challenges!
                    </div>
                </div>
                
                <div class="progress-area">
                    <div class="challenge-progress">
                        <div class="progress-bar" id="challengeProgress"></div>
                    </div>
                    <div class="time-remaining" id="timeRemaining"></div>
                </div>
            </div>
            
            <div class="power-ups-area">
                <h4>⚡ Power-ups</h4>
                <div class="power-ups-list" id="powerUpsList">
                    <!-- Power-ups will be added here -->
                </div>
            </div>
            
            <div class="achievements-area">
                <h4>🏆 Achievements</h4>
                <div class="achievements-list" id="achievementsList">
                    <!-- Achievements will be displayed here -->
                </div>
            </div>
            
            <div class="game-feedback" id="gameFeedback">
                <!-- Real-time feedback will appear here -->
            </div>
        `;
        
        // Find a good place to insert the game interface
        const settingsPage = document.querySelector('.settings-section') || document.body;
        settingsPage.appendChild(gameContainer);
        
        this.addGameStyles();
        this.updateGameDisplay();
    }
    
    addGameStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .eye-strain-game {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .game-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 15px;
            }
            
            .game-header h3 {
                margin: 0;
                font-size: 24px;
            }
            
            .game-controls button {
                margin-left: 5px;
                font-size: 12px;
                padding: 5px 10px;
            }
            
            .game-stats {
                display: flex;
                justify-content: space-around;
                margin-bottom: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-label {
                display: block;
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 5px;
            }
            
            .stat-value {
                display: block;
                font-size: 20px;
                font-weight: bold;
            }
            
            .challenge-area {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .challenge-display {
                text-align: center;
                margin-bottom: 15px;
            }
            
            .challenge-waiting {
                font-size: 16px;
                opacity: 0.8;
            }
            
            .challenge-active {
                animation: pulse 2s infinite;
            }
            
            .challenge-title {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .challenge-description {
                font-size: 16px;
                margin-bottom: 15px;
            }
            
            .challenge-target {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 10px;
                font-size: 14px;
            }
            
            .progress-area {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .challenge-progress {
                flex: 1;
                height: 8px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                overflow: hidden;
                margin-right: 15px;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                width: 0%;
                transition: width 0.5s ease;
            }
            
            .time-remaining {
                font-weight: bold;
                min-width: 60px;
            }
            
            .power-ups-area, .achievements-area {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .power-ups-area h4, .achievements-area h4 {
                margin: 0 0 10px 0;
                font-size: 16px;
            }
            
            .power-ups-list, .achievements-list {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .power-up-item, .achievement-item {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .power-up-item.available {
                background: rgba(76, 175, 80, 0.3);
                cursor: pointer;
                animation: glow 2s infinite;
            }
            
            .achievement-item.unlocked {
                background: rgba(255, 215, 0, 0.3);
                border: 1px solid gold;
            }
            
            .game-feedback {
                text-align: center;
                padding: 10px;
                border-radius: 8px;
                margin-top: 15px;
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .feedback-success {
                background: rgba(76, 175, 80, 0.3);
                border: 1px solid #4CAF50;
            }
            
            .feedback-warning {
                background: rgba(255, 152, 0, 0.3);
                border: 1px solid #FF9800;
            }
            
            .feedback-danger {
                background: rgba(244, 67, 54, 0.3);
                border: 1px solid #F44336;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupGameEventListeners() {
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('pauseGameBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('stopGameBtn').addEventListener('click', () => {
            this.stopGame();
        });
    }
    
    startGame() {
        this.gameActive = true;
        this.score = 0;
        this.lives = 3;
        
        // Update UI
        document.getElementById('startGameBtn').disabled = true;
        document.getElementById('pauseGameBtn').disabled = false;
        document.getElementById('stopGameBtn').disabled = false;
        
        this.updateGameDisplay();
        this.startNextChallenge();
        
        this.showFeedback('🎮 Game Started! Good luck!', 'success');
    }
    
    pauseGame() {
        this.gameActive = false;
        document.getElementById('startGameBtn').disabled = false;
        document.getElementById('pauseGameBtn').disabled = true;
        
        this.showFeedback('⏸️ Game Paused', 'warning');
    }
    
    stopGame() {
        this.gameActive = false;
        this.currentChallenge = null;
        
        // Reset UI
        document.getElementById('startGameBtn').disabled = false;
        document.getElementById('pauseGameBtn').disabled = true;
        document.getElementById('stopGameBtn').disabled = true;
        
        // Update stats
        this.gameStats.gamesPlayed++;
        this.gameStats.totalScore += this.score;
        
        this.saveGameData();
        this.updateGameDisplay();
        
        this.showFeedback(`🎯 Game Over! Final Score: ${this.score}`, 'danger');
    }
    
    startNextChallenge() {
        if (!this.gameActive) return;
        
        // Select random challenge type
        const challengeKeys = Object.keys(this.challengeTypes);
        const randomChallenge = challengeKeys[Math.floor(Math.random() * challengeKeys.length)];
        
        this.currentChallenge = {
            ...this.challengeTypes[randomChallenge],
            startTime: Date.now(),
            progress: 0,
            completed: false
        };
        
        this.displayChallenge();
        this.runChallenge();
    }
    
    displayChallenge() {
        const display = document.getElementById('challengeDisplay');
        display.innerHTML = `
            <div class="challenge-active">
                <div class="challenge-title">
                    ${this.currentChallenge.icon} ${this.currentChallenge.name}
                </div>
                <div class="challenge-description">
                    ${this.currentChallenge.description}
                </div>
                <div class="challenge-target">
                    Target: ${this.formatTarget(this.currentChallenge)}
                </div>
            </div>
        `;
    }
    
    formatTarget(challenge) {
        const target = challenge.targetValue;
        switch (challenge.targetMetric) {
            case 'blinkRate':
                return `${target.min}-${target.max} blinks per minute`;
            case 'eyeStrain':
                return `Keep eye strain below ${target.max * 100}%`;
            case 'breakCompliance':
                return `${target.min}% break compliance`;
            case 'gazeDistance':
                return `Look at distant objects for ${target.min} seconds`;
            case 'gazeAngle':
                return `Maintain center screen position`;
            default:
                return 'Complete the challenge!';
        }
    }
    
    runChallenge() {
        if (!this.gameActive || !this.currentChallenge) return;
        
        const updateInterval = setInterval(() => {
            if (!this.gameActive || !this.currentChallenge) {
                clearInterval(updateInterval);
                return;
            }
            
            const elapsed = Date.now() - this.currentChallenge.startTime;
            const progress = Math.min(elapsed / this.currentChallenge.duration, 1);
            
            // Update progress bar
            document.getElementById('challengeProgress').style.width = (progress * 100) + '%';
            
            // Update time remaining
            const remaining = Math.max(0, this.currentChallenge.duration - elapsed);
            document.getElementById('timeRemaining').textContent = 
                Math.ceil(remaining / 1000) + 's';
            
            // Check challenge completion
            const success = this.checkChallengeSuccess();
            
            if (progress >= 1) {
                clearInterval(updateInterval);
                this.completeChallenge(success);
            } else {
                this.updateChallengeProgress(success);
            }
        }, 100);
    }
    
    checkChallengeSuccess() {
        if (!this.currentChallenge) return false;
        
        // Get current eye metrics
        const metrics = this.getCurrentEyeMetrics();
        const target = this.currentChallenge.targetValue;
        
        switch (this.currentChallenge.targetMetric) {
            case 'blinkRate':
                return metrics.blinkRate >= target.min && metrics.blinkRate <= target.max;
            case 'eyeStrain':
                return metrics.eyeStrain <= target.max;
            case 'breakCompliance':
                return metrics.breakCompliance >= target.min;
            case 'gazeDistance':
                return metrics.gazeDistance >= target.min;
            case 'gazeAngle':
                return metrics.gazeAngle === target.optimal;
            default:
                return true;
        }
    }
    
    getCurrentEyeMetrics() {
        // Get metrics from existing eye tracking systems
        if (typeof eyeHealthAnalytics !== 'undefined' && eyeHealthAnalytics) {
            const analytics = eyeHealthAnalytics.getCurrentMetrics();
            return {
                blinkRate: analytics.blinkRate || 15,
                eyeStrain: analytics.eyeStrain || 0.3,
                breakCompliance: 75, // Mock value
                gazeDistance: 15, // Mock value
                gazeAngle: 'center' // Mock value
            };
        }
        
        // Mock values for demonstration
        return {
            blinkRate: 15 + Math.random() * 10,
            eyeStrain: Math.random() * 0.5,
            breakCompliance: 70 + Math.random() * 20,
            gazeDistance: 10 + Math.random() * 15,
            gazeAngle: Math.random() > 0.5 ? 'center' : 'off'
        };
    }
    
    updateChallengeProgress(success) {
        if (success) {
            this.showFeedback('✅ Great! Keep it up!', 'success');
        } else {
            this.showFeedback('⚠️ Adjust your behavior to meet the target', 'warning');
        }
    }
    
    completeChallenge(success) {
        if (success) {
            this.score += this.currentChallenge.points;
            this.gameStats.challengesCompleted++;
            this.showFeedback(
                `🎉 Challenge Complete! +${this.currentChallenge.points} points`, 
                'success'
            );
            
            // Check for level up
            if (this.score >= this.currentLevel * 500) {
                this.levelUp();
            }
            
            // Start next challenge after delay
            setTimeout(() => {
                this.startNextChallenge();
            }, 2000);
            
        } else {
            this.lives--;
            this.showFeedback('💔 Challenge failed! Try again!', 'danger');
            
            if (this.lives <= 0) {
                this.stopGame();
            } else {
                // Start next challenge after delay
                setTimeout(() => {
                    this.startNextChallenge();
                }, 2000);
            }
        }
        
        this.updateGameDisplay();
        this.checkAchievements();
    }
    
    levelUp() {
        this.currentLevel++;
        this.showFeedback(`🆙 Level Up! Welcome to Level ${this.currentLevel}!`, 'success');
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        // Score-based achievements
        if (this.score >= 1000 && !this.achievements.includes('high_scorer')) {
            newAchievements.push('high_scorer');
        }
        
        // Game count achievements
        if (this.gameStats.gamesPlayed >= 10 && !this.achievements.includes('dedicated_player')) {
            newAchievements.push('dedicated_player');
        }
        
        // Challenge completion achievements
        if (this.gameStats.challengesCompleted >= 50 && !this.achievements.includes('challenge_master')) {
            newAchievements.push('challenge_master');
        }
        
        // Add new achievements
        newAchievements.forEach(achievement => {
            this.achievements.push(achievement);
            this.showAchievementNotification(achievement);
        });
        
        if (newAchievements.length > 0) {
            this.updateAchievementsDisplay();
            this.saveGameData();
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: black;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
            z-index: 10004;
            text-align: center;
            animation: achievementPop 3s ease;
        `;
        notification.innerHTML = `
            <h3>🏆 Achievement Unlocked!</h3>
            <p>${this.getAchievementName(achievement)}</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    getAchievementName(achievement) {
        const names = {
            'high_scorer': 'High Scorer - Score 1000+ points',
            'dedicated_player': 'Dedicated Player - Play 10+ games',
            'challenge_master': 'Challenge Master - Complete 50+ challenges'
        };
        return names[achievement] || 'Mystery Achievement';
    }
    
    updateGameDisplay() {
        document.getElementById('levelDisplay').textContent = this.currentLevel;
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('livesDisplay').textContent = '❤️'.repeat(this.lives);
        
        this.updateAchievementsDisplay();
    }
    
    updateAchievementsDisplay() {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '';
        
        const allAchievements = ['high_scorer', 'dedicated_player', 'challenge_master'];
        
        allAchievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${this.achievements.includes(achievement) ? 'unlocked' : ''}`;
            item.innerHTML = `
                <span>${this.achievements.includes(achievement) ? '🏆' : '🔒'}</span>
                <span>${this.getAchievementName(achievement)}</span>
            `;
            list.appendChild(item);
        });
    }
    
    showFeedback(message, type) {
        const feedback = document.getElementById('gameFeedback');
        feedback.className = `game-feedback feedback-${type}`;
        feedback.textContent = message;
        
        // Auto-clear feedback after 3 seconds
        setTimeout(() => {
            feedback.className = 'game-feedback';
            feedback.textContent = '';
        }, 3000);
    }
    
    getGameReport() {
        return {
            currentLevel: this.currentLevel,
            totalScore: this.score,
            gameStats: this.gameStats,
            achievements: this.achievements,
            isActive: this.gameActive
        };
    }
}

// Add CSS for achievement animation
const achievementStyle = document.createElement('style');
achievementStyle.textContent = `
    @keyframes achievementPop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(1); }
        80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    }
`;
document.head.appendChild(achievementStyle);

// Initialize the game system
let eyeStrainGame;
document.addEventListener('DOMContentLoaded', function() {
    eyeStrainGame = new EyeStrainRiskGame();
});