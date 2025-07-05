# EyeCare AI - Eye Health Monitoring Application

## Overview

EyeCare AI is a web-based application that monitors eye health in real-time using computer vision technology. The application tracks blink rates, detects drowsiness, provides guided eye exercises, and generates health reports to help users maintain healthy screen habits and prevent digital eye strain.

## System Architecture

### Frontend Architecture
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.0 for responsive design
- **Visualization**: Chart.js for data visualization and health metrics
- **Computer Vision**: OpenCV.js for real-time eye detection and tracking
- **Template Engine**: Jinja2 templates (Flask-based)

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Language**: Python 3.8+
- **Architecture Pattern**: Model-View-Controller (MVC)
- **Data Processing**: In-memory data structures with background processing
- **Session Management**: Server-side session handling

## Key Components

### 1. Eye Tracking Module (`static/js/eye_detection.js`)
- **Purpose**: Real-time eye detection and blink monitoring
- **Technology**: OpenCV.js with Haar cascades for face/eye detection
- **Features**: 
  - Blink rate calculation using eye aspect ratio
  - Drowsiness detection based on eye closure duration
  - Real-time video processing with canvas rendering
- **Detection Method**: Uses face mesh landmarks similar to cvzone approach for accurate blink detection

### 2. Health Analytics (`static/js/analytics.js`)
- **Purpose**: Comprehensive analysis of eye health metrics with real-time insights
- **Features**:
  - Overall health score calculation (0-100 scale)
  - Real-time metrics tracking (blink rate, drowsiness, eye strain)
  - Personalized health insights and recommendations
  - Achievement system for healthy habits
  - Data visualization with interactive charts
  - Export functionality (JSON, CSV, PDF formats)
  - Session data tracking with localStorage persistence
  - Health threshold monitoring and alert generation

### 3. Flask Application (`app.py`)
- **Purpose**: Backend API and web server
- **Features**:
  - Route handling for all pages
  - Mock data generation for health metrics
  - Background processing for continuous monitoring
  - JSON API endpoints for real-time data

### 4. Template System
- **Base Template**: `layout.html` with consistent navigation and styling
- **Pages**:
  - `home.html`: Dashboard with key metrics
  - `live_tracking.html`: Real-time eye monitoring
  - `eye_exercises.html`: Guided exercises with timers
  - `reports.html`: Historical data and trends
  - `settings.html`: User preferences and configuration

## Data Flow

1. **Camera Input**: Video stream captured via WebRTC
2. **Processing**: OpenCV.js processes frames for eye detection
3. **Analysis**: Eye aspect ratios calculated for blink detection
4. **Data Storage**: Metrics stored in browser localStorage and server memory
5. **Visualization**: Real-time updates to dashboard and charts
6. **Alerts**: Notifications triggered based on health thresholds

## External Dependencies

### Frontend Libraries
- **Bootstrap 5.3.0**: UI framework and responsive design
- **Chart.js**: Data visualization and metrics display
- **OpenCV.js**: Computer vision processing
- **Browser APIs**: WebRTC for camera access, localStorage for data persistence

### Backend Dependencies
- **Flask 2.3.3**: Web framework
- **NumPy 1.25.2**: Numerical computations
- **OpenCV-Python 4.8.0**: Computer vision library
- **Pillow 10.0.0**: Image processing

## Deployment Strategy

### Development Environment
- **Server**: Flask development server
- **Port**: 5000 (default)
- **Hot Reload**: Enabled for template and static file changes

### Production Considerations
- **WSGI Server**: Gunicorn or uWSGI recommended
- **Static Files**: Serve via CDN or reverse proxy
- **Camera Permissions**: HTTPS required for WebRTC in production
- **Data Persistence**: Consider database integration for user data

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebRTC Support**: Required for camera access
- **Canvas API**: Required for video processing
- **localStorage**: Required for data persistence

## Recent Changes

### July 05, 2025
- **Initial Setup**: Created Flask web application with eye tracking functionality
- **Eye Detection**: Implemented OpenCV.js-based eye tracking with blink detection
- **Comprehensive Analytics**: Added health analytics system with:
  - Overall health score calculation
  - Real-time metrics tracking
  - Export functionality (JSON, CSV, PDF)
  - Achievement system
- **Fixed Eye Detection Issues**: Resolved matrix operation errors and improved face/eye visibility
- **Export Function Fixes**: Fixed missing exportData function and added proper CSV/PDF export
- **Gentle Micro-Animations for Rest Reminders**: Added comprehensive rest reminder system with:
  - Subtle pulse indicators for gentle notifications
  - Full-screen breathing animation overlays
  - 20-20-20 rule implementation with guided breaks
  - Customizable reminder intervals (10-60 minutes)
  - Eye strain relief overlay during breaks
  - Integration with eye tracking for smart reminders
  - Audio notifications with different sound types (gentle, reminder, urgent)
- **Enhanced Eye Detection System**: Upgraded to comprehensive both-eye tracking with:
  - Individual left and right eye aspect ratio calculation
  - Both-eye blink detection and counting
  - Gaze direction tracking and visualization
  - Background processing support with web workers
  - Real-time data updates to reports and analytics
  - Enhanced MediaPipe Face Mesh integration
  - Visual indicators for both eyes (OPEN/CLOSED labels)
- **Advanced Accessibility Features**: Comprehensive eye-based interaction system with:
  - Hands-free navigation using eye tracking and dwell-time controls
  - Calibration system for accurate gaze detection
  - Customizable sensitivity and dwell time settings
  - Visual feedback with gaze cursor and progress indicators
  - Support for all interactive elements (buttons, links, forms)
- **Interactive Eye Strain Risk Game**: Gamified health monitoring with:
  - Multiple challenge types (blink rate, focus, breaks, posture)
  - Scoring system with points, levels, and achievements
  - Real-time feedback on eye health performance
  - Progress tracking and statistics
  - Power-ups and rewards for healthy behaviors
- **Emoji-Based Mood Correlation**: Smart mood tracking with:
  - 8 different mood options with emoji selection
  - Automatic correlation analysis between mood and eye health
  - Personalized insights and recommendations
  - Visual charts showing mood-health patterns
  - Proactive health suggestions based on emotional state
- **Advanced Gaze UI Navigation**: Intelligent interface control with:
  - Screen zone navigation (scroll, back, menu, center click)
  - Gesture pattern recognition for shortcuts
  - Real-time gaze heatmap visualization
  - Customizable navigation zones and sensitivity
  - Smart smoothing algorithms for accurate tracking
- **Comprehensive Alert System**: Fully customizable notifications with:
  - Multiple sensitivity profiles (Conservative, Balanced, Strict, Custom)
  - Individual alert type configuration (threshold, frequency, style)
  - Alert history tracking and analytics
  - Testing functionality for all alert types
  - Visual, audio, and priority-based notification system

## User Preferences

Preferred communication style: Simple, everyday language.