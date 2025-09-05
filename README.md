# Audio Visualizer Demo

> Experience audio through visual art - A unified interface combining multiple real-time audio visualization tools

![Audio Visualizer Demo](https://github.com/user-attachments/assets/a614c8b1-8117-4e3c-be17-46cad28dbf5c)

## 🎯 Overview

This project combines two distinct audio visualization tools into a single, minimalistic web application that transforms audio input into stunning visual displays. The application uses the Web Audio API to capture microphone input and renders real-time visualizations using Canvas 2D and WebGL technologies.

## ✨ Features

### 🌹 Rose Visualizer
- **Organic Patterns**: Creates beautiful rose-like patterns with animated petals
- **Color Mapping**: Petals change color based on dominant audio frequencies
- **Layered Depth**: Multiple layers of petals for rich visual depth
- **Frequency Spectrum**: Background frequency bars enhance the visualization
- **Adaptive Petals**: Number of petals adjusts based on audio intensity

### 🌐 3D Sphere Visualizer
- **3D Wireframe**: Interactive 3D sphere with WebGL rendering
- **Audio Deformation**: Sphere geometry morphs based on frequency data
- **Mouse Interaction**: Sphere rotates based on mouse movement
- **Particle Effects**: Dynamic particle system synchronized with audio
- **Fallback Mode**: 2D canvas fallback when WebGL is unavailable

### 🎛️ Unified Interface
- **Seamless Switching**: Switch between visualizers with one click
- **Sensitivity Control**: Real-time audio sensitivity adjustment
- **Demo Mode**: Works without microphone access for testing
- **Responsive Design**: Optimized for desktop and mobile devices
- **Keyboard Shortcuts**: Quick access with number keys (1-2)

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- Local web server (for development)
- Microphone access (optional - demo mode available)

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AudioVisualizerDemo
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Click "🎵 Start Audio" to begin
   - Allow microphone access when prompted
   - Use the visualizer buttons to switch between tools

## 📁 Project Structure

```
AudioVisualizerDemo/
├── index.html              # Main application page
├── styles.css              # Minimalistic UI styling
├── app.js                  # Application controller
├── visualizers/            # Modular visualizer components
│   ├── base-visualizer.js  # Base class with shared functionality
│   ├── rose-visualizer.js  # 2D rose pattern visualizer
│   └── sphere-visualizer.js # 3D sphere visualizer
├── tool1.html              # Original rose tool (legacy)
├── tool1.js                # Original rose implementation
├── tool2.html              # Original sphere tool (legacy)
├── tool2.js                # Original sphere implementation
└── README.md               # This file
```

## 🏗️ Architecture

### Modular Design
The application follows a modular architecture with clear separation of concerns:

- **BaseVisualizer**: Abstract base class providing common functionality
- **Individual Visualizers**: Extend the base class with specific implementations
- **Application Controller**: Manages state, switching, and user interactions

### Key Components

#### BaseVisualizer Class
```javascript
class BaseVisualizer {
    // Shared audio processing
    // Common animation loop
    // Sensitivity controls
    // Performance monitoring
}
```

#### Audio Processing Pipeline
1. **Microphone Capture**: Web Audio API getUserMedia
2. **Analysis**: FFT analysis for frequency and time domain data
3. **Processing**: Calculate volume, dominant frequencies, and color mapping
4. **Rendering**: Update visualizations at 60fps

#### Fallback Systems
- **Three.js Fallback**: 2D canvas rendering when WebGL unavailable
- **Demo Mode**: Synthetic audio when microphone access denied
- **Progressive Enhancement**: Core functionality works without advanced features

## 🎨 Visualizer Details

### Rose Visualizer Technical Features
- **Multi-layer Rendering**: 3 layers with varying opacity for depth
- **Gradient Petals**: Radial gradients from center to edge
- **Frequency Spectrum**: 64-bar spectrum visualization
- **Adaptive Parameters**: Dynamic petal count (8-20) based on volume
- **Organic Movement**: Sinusoidal variations for natural feel

### 3D Sphere Visualizer Technical Features
- **Vertex Displacement**: Real-time geometry modification
- **Color Mapping**: HSL color space for frequency-to-color mapping
- **Camera Effects**: Dynamic FOV changes for immersive experience
- **Particle System**: 100 animated particles synchronized with audio
- **Fallback Rendering**: Wireframe sphere projection for 2D mode

## ⚙️ Configuration & Customization

### Audio Settings
```javascript
// Configurable parameters
fftSize: 2048,              // Frequency analysis resolution
smoothingTimeConstant: 0.8,  // Audio smoothing factor
sensitivity: 50,             // Default sensitivity (10-200)
```

### Visual Customization
```javascript
// Rose Visualizer
numPetals: 8-20,            // Dynamic based on audio
maxRadius: 300,             // Maximum petal radius
rotationSpeed: 0.01,        // Base rotation speed

// Sphere Visualizer  
particleCount: 100,         // Number of particles
sphereDetail: 32,           // Sphere geometry resolution
```

## 🎯 User Controls

### Interface Controls
- **🎵 Start Audio**: Initialize audio processing and visualization
- **🌹 Rose Visualizer**: Switch to 2D rose pattern visualization
- **🌐 3D Sphere**: Switch to 3D sphere visualization
- **Sensitivity Slider**: Adjust audio response sensitivity (10-200%)

### Keyboard Shortcuts
- **Space**: Start audio (when inactive)
- **1**: Switch to Rose Visualizer
- **2**: Switch to 3D Sphere Visualizer

### Mouse Interaction
- **3D Sphere Mode**: Mouse movement controls sphere rotation
- **Hover Effects**: Interactive UI elements with visual feedback

## 🛠️ Technical Implementation

### Web Audio API Integration
```javascript
// Audio context setup
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

// Microphone stream processing
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
    });
```

### Canvas 2D Optimizations
- **Efficient Clearing**: Fade effects instead of full clears
- **Gradient Caching**: Reusable gradient objects
- **Animation Timing**: RequestAnimationFrame for smooth 60fps

### WebGL/Three.js Features
- **Geometry Manipulation**: Real-time vertex displacement
- **Shader Integration**: Custom materials for audio responsiveness
- **Performance Monitoring**: FPS tracking and optimization

## 🎭 Demo Mode Features

When microphone access is unavailable, the application automatically switches to demo mode:

- **Synthetic Audio**: Multiple oscillators create rich demo sounds
- **Frequency Animation**: Simulated frequency variations
- **Visual Feedback**: All visualizations work with generated audio
- **User Notification**: Clear indication of demo mode status

## 🔧 Browser Compatibility

### Supported Browsers
- **Chrome 66+**: Full WebGL and Web Audio API support
- **Firefox 60+**: Complete feature compatibility
- **Safari 11.1+**: WebKit Web Audio API support
- **Edge 79+**: Chromium-based full support

### Fallback Support
- **WebGL Unavailable**: Automatic 2D canvas fallback
- **Web Audio API Limited**: Graceful degradation
- **Mobile Devices**: Responsive design with touch support

## 🚨 Troubleshooting

### Common Issues

#### Microphone Not Working
- Ensure HTTPS or localhost (required for getUserMedia)
- Check browser permissions for microphone access
- Demo mode will activate automatically if access denied

#### No Visualization Showing
- Verify JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

#### Performance Issues
- Reduce sensitivity if experiencing lag
- Close other browser tabs consuming resources
- Check if hardware acceleration is enabled

## 🔮 Future Enhancements

### Planned Features
- **Additional Visualizers**: Waveform, spectrum analyzer, particle systems
- **Audio File Support**: Upload and visualize audio files
- **Recording Capability**: Save visualization sessions
- **Fullscreen Mode**: Immersive visualization experience
- **WebGL Shaders**: Advanced shader-based visualizations

### Customization Options
- **Color Themes**: Predefined and custom color schemes
- **Animation Presets**: Different animation styles and speeds
- **Audio Filters**: EQ and audio processing effects
- **Export Options**: Save visualizations as images or videos

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Experience the beauty of sound through visual art! 🎵✨**