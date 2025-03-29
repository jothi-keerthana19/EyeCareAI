from flask import Flask, render_template, jsonify, request, send_file, Response
import random
import time
import threading
import datetime
import os
import json
import numpy as np
from collections import deque
import os

app = Flask(__name__)

# Global variables
background_thread = None
background_thread_running = False

# Mock data class for eye health metrics
class EyeHealthData:
    def __init__(self):
        self.blink_history = deque(maxlen=60)  # Store up to 60 minutes of data
        self.drowsiness_history = deque(maxlen=60)
        self.screen_time = 0
        self.last_update = datetime.datetime.now()
        
        # Pre-populate with some initial data
        self._initialize_data()
    
    def _initialize_data(self):
        # Add some initial data points (last hour)
        now = datetime.datetime.now()
        for i in range(60, 0, -1):
            time_point = now - datetime.timedelta(minutes=i)
            self.blink_history.append({
                'timestamp': time_point.strftime('%H:%M'),
                'value': random.randint(10, 25)
            })
            self.drowsiness_history.append({
                'timestamp': time_point.strftime('%H:%M'),
                'value': random.uniform(0, 0.75)
            })
    
    def generate_blink_data(self):
        """Generate realistic blink rate data"""
        # Normal blink rate is 15-20 per minute
        current_time = datetime.datetime.now().strftime('%H:%M')
        blink_rate = random.randint(10, 25)
        
        # Add new data point
        self.blink_history.append({
            'timestamp': current_time,
            'value': blink_rate
        })
        
        # Convert to list for JSON serialization
        return list(self.blink_history)
    
    def generate_drowsiness_data(self):
        """Generate realistic drowsiness detection data"""
        current_time = datetime.datetime.now().strftime('%H:%M')
        
        # Drowsiness is a value between 0 and 1
        # Higher values indicate more drowsiness
        drowsiness = random.uniform(0, 0.75)
        
        # Add new data point
        self.drowsiness_history.append({
            'timestamp': current_time,
            'value': drowsiness
        })
        
        # Convert to list for JSON serialization
        return list(self.drowsiness_history)
    
    def generate_screen_time(self):
        """Update and return cumulative screen time"""
        now = datetime.datetime.now()
        elapsed = (now - self.last_update).total_seconds() / 60  # in minutes
        self.last_update = now
        
        # Update screen time (capped by the time elapsed)
        self.screen_time += min(elapsed, 1)  # Cap at 1 minute per real minute max
        
        # Format for display
        hours = int(self.screen_time // 60)
        minutes = int(self.screen_time % 60)
        
        return {
            'hours': hours,
            'minutes': minutes,
            'total_minutes': self.screen_time
        }
    
    def get_current_metrics(self):
        """Get the current eye health metrics"""
        # Get latest data or defaults if empty
        blink_rate = self.blink_history[-1]['value'] if self.blink_history else 0
        drowsiness = self.drowsiness_history[-1]['value'] if self.drowsiness_history else 0
        
        screen_time = self.generate_screen_time()
        
        return {
            'blink_rate': blink_rate,
            'drowsiness': drowsiness, 
            'screen_time': screen_time
        }
    
    def get_health_insights(self):
        """Generate health insights based on metrics"""
        metrics = self.get_current_metrics()
        
        insights = []
        
        # Blink rate insights
        if metrics['blink_rate'] < 12:
            insights.append({
                'type': 'warning',
                'message': 'Your blink rate is below normal levels. Consider taking a break and doing eye exercises.'
            })
        elif metrics['blink_rate'] > 20:
            insights.append({
                'type': 'info',
                'message': 'Your blink rate is good, indicating your eyes are well-hydrated.'
            })
        else:
            insights.append({
                'type': 'info',
                'message': 'Your blink rate is within normal range.'
            })
            
        # Drowsiness insights
        if metrics['drowsiness'] > 0.6:
            insights.append({
                'type': 'warning',
                'message': 'High drowsiness detected. Consider taking a break or getting some rest.'
            })
        elif metrics['drowsiness'] > 0.3:
            insights.append({
                'type': 'info',
                'message': 'Moderate drowsiness detected. Consider short break to refresh your eyes.'
            })
            
        # Screen time insights
        if metrics['screen_time']['total_minutes'] > 120:
            insights.append({
                'type': 'warning',
                'message': 'You have been using the screen for over 2 hours. Consider a 20-minute break.'
            })
        elif metrics['screen_time']['total_minutes'] > 60:
            insights.append({
                'type': 'info',
                'message': 'You have been using the screen for over an hour. Consider a short break.'
            })
            
        return insights

# Create an instance of EyeHealthData
eye_health_data = EyeHealthData()

# Routes
@app.route('/')
def home():
    current_metrics = eye_health_data.get_current_metrics()
    insights = eye_health_data.get_health_insights()
    return render_template('home.html', metrics=current_metrics, insights=insights)

@app.route('/live-tracking')
def live_tracking():
    return render_template('live_tracking.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

# API Routes for frontend data
@app.route('/api/blink-data')
def api_blink_data():
    data = eye_health_data.generate_blink_data()
    return jsonify(data)

@app.route('/api/drowsiness-data')
def api_drowsiness_data():
    data = eye_health_data.generate_drowsiness_data()
    return jsonify(data)

@app.route('/api/screen-time')
def api_screen_time():
    data = eye_health_data.generate_screen_time()
    return jsonify(data)

# Routes to serve face and eye cascade files for OpenCV.js
@app.route('/models/haarcascade_frontalface_alt2.xml')
def serve_face_cascade():
    return send_file('static/models/haarcascade_frontalface_alt2.xml', mimetype='text/xml')

@app.route('/models/haarcascade_eye.xml')
def serve_eye_cascade():
    return send_file('static/models/haarcascade_eye.xml', mimetype='text/xml')

# Toggle background processing
@app.route('/api/toggle-background', methods=['POST'])
def toggle_background():
    global background_thread, background_thread_running
    
    data = request.json
    should_run = data.get('run', False)
    
    if should_run and (background_thread is None or not background_thread.is_alive()):
        # Start background thread
        background_thread_running = True
        background_thread = threading.Thread(target=background_worker)
        background_thread.daemon = True
        background_thread.start()
        return jsonify({'status': 'started'})
    
    elif not should_run and background_thread and background_thread.is_alive():
        # Stop background thread
        background_thread_running = False
        # Let the thread exit naturally
        # We don't join here to avoid blocking the response
        return jsonify({'status': 'stopping'})
    
    # Already in the requested state
    current_state = 'running' if (background_thread and background_thread.is_alive()) else 'stopped'
    return jsonify({'status': current_state})

# Notification endpoint
@app.route('/api/send-notification', methods=['POST'])
def send_notification():
    data = request.json
    print(f"Would send notification: {data}")
    return jsonify({'status': 'sent'})

# Background worker function
def background_worker():
    global background_thread_running
    print("Background eye tracking worker started")
    
    while background_thread_running:
        # In a real application, this would process eye tracking data
        # and update metrics
        
        # Check if any metrics require notification
        metrics = eye_health_data.get_current_metrics()
        
        # Example: Send notification if blink rate is too low or drowsiness is high
        if metrics['blink_rate'] < 10:
            print("Low blink rate detected! Would send notification.")
            # This would trigger a system notification in a real implementation
        
        # Sleep for a few seconds before next check
        time.sleep(10)
    
    print("Background eye tracking worker stopped")

# Implement a route for eye exercises
@app.route('/eye-exercises')
def eye_exercises():
    return render_template('eye_exercises.html')

if __name__ == '__main__':
    # Use environment variables for port if available (for hosting platforms)
    port = int(os.environ.get('PORT', 5000))
    # Set debug to False in production
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)