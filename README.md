
# EyeCare AI - Advanced Eye Health Monitoring System

![EyeCare AI](https://img.shields.io/badge/EyeCare-AI-blue) ![Python](https://img.shields.io/badge/Python-3.8+-green) ![Flask](https://img.shields.io/badge/Flask-2.0+-orange) ![MediaPipe](https://img.shields.io/badge/MediaPipe-Computer%20Vision-red)

A comprehensive web and mobile application for real-time eye health monitoring, drowsiness detection, and personalized eye exercise guidance using advanced computer vision technologies.

## 🌟 Features

### 🔍 **Real-Time Eye Tracking**
- **MediaPipe Face Mesh Integration** - High-precision 468-point facial landmark detection
- **Advanced Blink Detection** - Sophisticated EAR (Eye Aspect Ratio) algorithms
- **Gaze Direction Tracking** - Real-time pupil and gaze direction analysis
- **Drowsiness Detection** - AI-powered alertness monitoring with customizable thresholds
- **Background Mode Support** - Continuous monitoring even when browser tab is inactive

### 📊 **Comprehensive Analytics**
- **Session Tracking** - Detailed monitoring of eye health metrics over time
- **Daily/Weekly/Monthly Reports** - Trend analysis and progress tracking
- **Blink Rate Analysis** - Healthy vs. unhealthy blinking pattern detection
- **Eye Strain Assessment** - Risk level evaluation and recommendations
- **Data Export** - CSV and PDF report generation for medical consultations

### ⏰ **Smart Reminder System**
- **Customizable Break Intervals** - 20-20-20 rule and custom timing options
- **Intelligent Notifications** - Context-aware break reminders
- **Visual and Audio Alerts** - Multiple notification types
- **Productivity Integration** - Non-intrusive reminder timing

### 🎯 **Eye Exercise Programs**
- **Interactive Eye Exercises** - Guided focusing, tracking, and relaxation exercises
- **Gamified Training** - Eye strain risk assessment game
- **Progress Tracking** - Exercise completion and improvement metrics
- **Personalized Recommendations** - AI-driven exercise suggestions

### 🔧 **Advanced Settings**
- **Sensitivity Controls** - Adjustable detection thresholds
- **Alert Customization** - Personalized notification preferences
- **Privacy Controls** - Local data storage with export options
- **Accessibility Features** - Support for various user needs

### 📱 **Cross-Platform Support**
- **Web Application** - Modern responsive design with Bootstrap 5
- **Android App** - Native Kotlin implementation with CameraX
- **Real-time Synchronization** - Seamless data sharing between platforms

## 🛠️ Technology Stack

### **Backend**
- **Flask** - Lightweight Python web framework
- **Python 3.8+** - Core application logic

### **Frontend**
- **HTML5/CSS3/JavaScript** - Modern web standards
- **Bootstrap 5** - Responsive UI framework
- **MediaPipe** - Google's computer vision library
- **WebRTC** - Real-time camera access

### **Mobile**
- **Kotlin** - Android native development
- **CameraX** - Modern camera API
- **TensorFlow Lite** - On-device machine learning
- **Jetpack Compose** - Modern Android UI toolkit

### **Computer Vision**
- **MediaPipe Face Mesh** - 468-point facial landmark detection
- **Eye Aspect Ratio (EAR)** - Blink detection algorithms
- **TensorFlow Lite** - Mobile-optimized ML models

## 🚀 Quick Start

### **Web Application**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eyecare-ai.git
cd eyecare-ai
```

2. **Install dependencies**
```bash
pip install flask
```

3. **Run the application**
```bash
python app.py
```

4. **Access the application**
Open `http://localhost:5000` in your browser

### **Android Application**

1. **Open in Android Studio**
Import the `app/` directory as an Android project

2. **Build and Run**
Connect an Android device or start an emulator, then build and run the project

## 📋 System Requirements

### **Web Application**
- **Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Camera**: Webcam with minimum 640x480 resolution
- **Internet**: Required for MediaPipe library loading
- **RAM**: Minimum 4GB recommended

### **Android Application**
- **Android**: Version 7.0 (API level 24) or higher
- **Camera**: Front-facing camera required
- **RAM**: Minimum 3GB recommended
- **Storage**: 50MB free space

## 🔒 Privacy & Security

- **Local Data Storage** - All personal data stored locally on device
- **No Cloud Dependencies** - Core functionality works offline
- **Secure Camera Access** - Permissions requested transparently
- **Data Export Control** - Users control their data export and sharing
- **GDPR Compliant** - Privacy-by-design architecture

## 📈 Usage Examples

### **Live Eye Tracking**
- Start camera and view real-time eye metrics
- Monitor blink rate, gaze direction, and drowsiness levels
- Receive alerts for unhealthy patterns

### **Analytics Dashboard**
- View comprehensive eye health trends
- Export reports for medical consultations
- Track improvement over time

### **Eye Exercise Training**
- Follow guided eye exercises
- Complete gamified training sessions
- Monitor exercise effectiveness

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### **Upcoming Features**
- [ ] Machine Learning model improvements
- [ ] Advanced sleep pattern analysis
- [ ] Integration with health tracking platforms
- [ ] Multi-language support
- [ ] Cloud synchronization options
- [ ] Advanced biometric analysis

### **Long-term Goals**
- [ ] Clinical trial validation
- [ ] Medical device certification
- [ ] AI-powered health predictions
- [ ] Integration with smart glasses
- [ ] Workplace wellness platforms

## 🙏 Acknowledgments

- **MediaPipe Team** - For the excellent computer vision library
- **TensorFlow Team** - For machine learning framework
- **Flask Community** - For the web framework
- **Bootstrap Team** - For the UI framework

## 📞 Support

For support, please open an issue on GitHub or contact us at support@eyecareai.com

## 🏆 Awards & Recognition

*This space will be updated as the project receives recognition*

---

**Made with ❤️ for better eye health worldwide**

![GitHub stars](https://img.shields.io/github/stars/yourusername/eyecare-ai)
![GitHub forks](https://img.shields.io/github/forks/yourusername/eyecare-ai)
![GitHub issues](https://img.shields.io/github/issues/yourusername/eyecare-ai)
