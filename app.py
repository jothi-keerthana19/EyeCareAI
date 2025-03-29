from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import random
import threading
import time
from datetime import datetime, timedelta

app = Flask(__name__)

# Background processing flag
background_processing = False

# Simulated data for eye health metrics
class EyeHealthData:
    def __init__(self):
        self.blink_data = self.generate_blink_data()
        self.drowsiness_data = self.generate_drowsiness_data()
        self.screen_time = self.generate_screen_time()
    
    def generate_blink_data(self):
        # Generate simulated blink data for the last 24 hours
        data = []
        now = datetime.now()
        
        for i in range(24):
            time = now - timedelta(hours=24-i)
            # Generate blink rate between 10-25 blinks per minute
            blink_rate = round(random.uniform(10, 25), 1)
            # Lower blink rates in the evening to simulate fatigue
            if time.hour >= 18:
                blink_rate = round(random.uniform(8, 15), 1)
            
            data.append({
                'timestamp': time.strftime('%H:%M'),
                'blink_rate': blink_rate,
                'is_healthy': blink_rate >= 15
            })
        
        return data
    
    def generate_drowsiness_data(self):
        # Generate simulated drowsiness data for the last 24 hours
        data = []
        now = datetime.now()
        
        for i in range(24):
            time = now - timedelta(hours=24-i)
            # Generate drowsiness level between 0-100%
            # Higher in the evening and early morning
            base_level = 20
            if time.hour >= 22 or time.hour <= 5:
                base_level = 60
            elif time.hour >= 14 and time.hour <= 16:  # After lunch dip
                base_level = 50
            
            drowsiness = round(random.uniform(base_level - 15, base_level + 15), 1)
            drowsiness = max(0, min(100, drowsiness))  # Clamp between 0-100
            
            data.append({
                'timestamp': time.strftime('%H:%M'),
                'drowsiness_level': drowsiness,
                'is_drowsy': drowsiness >= 60
            })
        
        return data
    
    def generate_screen_time(self):
        # Generate simulated screen time for the last 7 days
        data = []
        now = datetime.now()
        
        for i in range(7):
            day = now - timedelta(days=6-i)
            # Generate screen time between 2-8 hours
            screen_hours = round(random.uniform(2, 8), 1)
            
            # Weekend screen time tends to be different
            if day.weekday() >= 5:  # Weekend
                screen_hours = round(random.uniform(3, 10), 1)
            
            data.append({
                'day': day.strftime('%a'),
                'screen_time_hours': screen_hours,
                'is_excessive': screen_hours > 6
            })
        
        return data
    
    def get_current_metrics(self):
        # Get the most recent metrics
        latest_blink = self.blink_data[-1]
        latest_drowsiness = self.drowsiness_data[-1]
        total_screen_time = sum(day['screen_time_hours'] for day in self.screen_time)
        
        return {
            'current_blink_rate': latest_blink['blink_rate'],
            'is_healthy_blink': latest_blink['is_healthy'],
            'current_drowsiness': latest_drowsiness['drowsiness_level'],
            'is_drowsy': latest_drowsiness['is_drowsy'],
            'avg_daily_screen_time': round(total_screen_time / 7, 1),
            'total_weekly_screen_time': round(total_screen_time, 1)
        }
    
    def get_health_insights(self):
        latest = self.get_current_metrics()
        
        insights = []
        
        # Blink rate insights
        if latest['current_blink_rate'] < 12:
            insights.append({
                'type': 'warning',
                'message': 'Your blink rate is very low. This may cause dry eyes and discomfort.'
            })
        elif latest['current_blink_rate'] < 15:
            insights.append({
                'type': 'info',
                'message': 'Your blink rate is slightly below the healthy range. Try to blink more often.'
            })
        elif latest['current_blink_rate'] > 25:
            insights.append({
                'type': 'info',
                'message': 'Your blink rate is unusually high. This may indicate eye irritation.'
            })
        else:
            insights.append({
                'type': 'success',
                'message': 'Your blink rate is within the healthy range. Keep it up!'
            })
        
        # Drowsiness insights
        if latest['current_drowsiness'] >= 70:
            insights.append({
                'type': 'danger',
                'message': 'High drowsiness detected! Take a break immediately.'
            })
        elif latest['current_drowsiness'] >= 50:
            insights.append({
                'type': 'warning',
                'message': 'Moderate drowsiness detected. Consider taking a short break.'
            })
        
        # Screen time insights
        if latest['avg_daily_screen_time'] > 6:
            insights.append({
                'type': 'warning',
                'message': f'Your daily screen time ({latest["avg_daily_screen_time"]} hours) is higher than recommended.'
            })
        
        return insights

# Initialize simulated data
eye_health_data = EyeHealthData()

@app.route('/')
def home():
    metrics = eye_health_data.get_current_metrics()
    insights = eye_health_data.get_health_insights()
    return render_template('home.html', metrics=metrics, insights=insights)

@app.route('/live-tracking')
def live_tracking():
    return render_template('live_tracking.html')

@app.route('/reports')
def reports():
    return render_template('reports.html', 
                          blink_data=eye_health_data.blink_data,
                          drowsiness_data=eye_health_data.drowsiness_data,
                          screen_time=eye_health_data.screen_time)

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/api/blink-data')
def api_blink_data():
    return jsonify(eye_health_data.blink_data)

@app.route('/api/drowsiness-data')
def api_drowsiness_data():
    return jsonify(eye_health_data.drowsiness_data)

@app.route('/api/screen-time')
def api_screen_time():
    return jsonify(eye_health_data.screen_time)

# Serve OpenCV Haar cascade files
@app.route('/haarcascade_frontalface_alt2.xml')
def serve_face_cascade():
    return send_from_directory('static/models', 'haarcascade_frontalface_alt2.xml')

@app.route('/haarcascade_eye.xml')
def serve_eye_cascade():
    return send_from_directory('static/models', 'haarcascade_eye.xml')

# API routes for eye tracking
@app.route('/api/toggle-background', methods=['POST'])
def toggle_background():
    global background_processing
    data = request.json
    if 'enabled' in data:
        background_processing = data['enabled']
        
        if background_processing:
            # Start background worker in a new thread
            thread = threading.Thread(target=background_worker)
            thread.daemon = True  # Thread will exit when main program exits
            thread.start()
            
        return jsonify({
            'status': 'success',
            'background_processing': background_processing,
            'message': 'Background processing ' + ('enabled' if background_processing else 'disabled')
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Missing "enabled" parameter'
    }), 400

@app.route('/api/notification', methods=['POST'])
def send_notification():
    data = request.json
    if 'title' in data and 'message' in data:
        # In a real implementation, this would send a notification to the user's OS
        # For this demo, we'll just log it
        print(f"NOTIFICATION: {data['title']} - {data['message']}")
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Missing title or message'}), 400

# Background worker function
def background_worker():
    print("Background eye tracking worker started")
    
    while background_processing:
        # In a real implementation, this would:
        # 1. Access the webcam
        # 2. Process frames to detect eyes
        # 3. Analyze blink rate and drowsiness
        # 4. Send notifications when needed
        
        # For demo purposes, just simulate periodic checking
        print("Background worker: checking eye health...")
        
        # Simulate drowsiness detection at random intervals
        if random.random() < 0.3:  # 30% chance each check
            print("Background worker: drowsiness detected! Sending notification.")
            # This would trigger a system notification in a real implementation
        
        # Sleep for a few seconds before next check
        time.sleep(10)
    
    print("Background eye tracking worker stopped")

# Implement a route for eye exercises
@app.route('/eye-exercises')
def eye_exercises():
    return render_template('eye_exercises.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)