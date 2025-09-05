/**
 * Audio Visualizer Demo - Main Application
 * Manages the overall application state and visualizer switching
 */
class AudioVisualizerApp {
    constructor() {
        this.visualizers = {};
        this.currentVisualizer = null;
        this.audioInitialized = false;
        this.sharedAudioContext = null;
        this.sharedAnalyser = null;
        this.audioSource = 'microphone'; // 'microphone' or 'file'
        this.audioElement = null;
        this.currentAudioFile = null;
        
        // DOM elements
        this.startButton = document.getElementById('startButton');
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.sourceButtons = document.querySelectorAll('.source-btn');
        this.fileInput = document.getElementById('fileInput');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.statusDisplay = document.getElementById('statusDisplay');
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.initializeVisualizers();
        this.updateStatus('Ready to start - click "Start Audio" button');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start button
        this.startButton.addEventListener('click', () => this.startAudio());
        
        // Tool selection buttons
        this.toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                this.switchVisualizer(tool);
            });
        });
        
        // Audio source selection buttons
        this.sourceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const source = e.target.dataset.source;
                this.switchAudioSource(source);
            });
        });
        
        // File input handling
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        
        // Drag and drop for file upload
        this.fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.add('dragover');
        });
        
        this.fileUploadArea.addEventListener('dragleave', () => {
            this.fileUploadArea.classList.remove('dragover');
        });
        
        this.fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.fileInput.files = files;
                this.handleFileSelect({ target: { files } });
            }
        });
        
        // Sensitivity slider
        this.sensitivitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.sensitivityValue.textContent = value;
            this.updateSensitivity(value);
        });
        
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Application error:', e);
            this.updateStatus('An error occurred', 'error');
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.audioInitialized) {
                e.preventDefault();
                this.startAudio();
            } else if (e.code === 'Digit1' && this.audioInitialized) {
                this.switchVisualizer('rose');
            } else if (e.code === 'Digit2' && this.audioInitialized) {
                this.switchVisualizer('sphere');
            } else if (e.code === 'Digit3' && this.audioInitialized) {
                this.switchVisualizer('fractal');
            }
        });
    }

    /**
     * Initialize visualizers
     */
    initializeVisualizers() {
        try {
            this.visualizers.rose = new RoseVisualizer();
            this.visualizers.sphere = new SphereVisualizer();
            this.visualizers.fractal = new FractalVisualizer();
            
            // Set initial visualizer
            this.currentVisualizer = this.visualizers.rose;
            
            this.updateStatus('Visualizers loaded - select audio source and start');
        } catch (error) {
            console.error('Error initializing visualizers:', error);
            this.updateStatus('Error loading visualizers', 'error');
        }
    }

    /**
     * Switch audio source between microphone and file
     */
    switchAudioSource(source) {
        if (this.audioInitialized) {
            this.updateStatus('Stop audio first to change source', 'error');
            return;
        }
        
        this.audioSource = source;
        
        // Update UI
        this.sourceButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.source === source);
        });
        
        // Show/hide file upload area
        if (source === 'file') {
            this.fileUploadArea.style.display = 'block';
            this.updateStatus('Select an audio file to visualize');
        } else {
            this.fileUploadArea.style.display = 'none';
            this.updateStatus('Ready to start with microphone input');
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
        if (!validTypes.includes(file.type)) {
            this.updateStatus('Unsupported file format. Please use MP3, WAV, OGG, or M4A.', 'error');
            return;
        }
        
        this.currentAudioFile = file;
        this.updateStatus(`File selected: ${file.name} - click "Start Audio" to begin`);
        
        // Update file upload area text
        this.fileUploadArea.innerHTML = `
            <p>✓ ${file.name}</p>
            <p style="font-size: 0.8em; opacity: 0.7;">Click "Start Audio" to visualize</p>
        `;
    }

    /**
     * Start audio and begin visualization
     */
    async startAudio() {
        if (this.audioInitialized) return;
        
        try {
            this.updateStatus('Initializing audio...', 'loading');
            this.startButton.disabled = true;
            
            if (this.audioSource === 'file') {
                await this.initFileAudio();
            } else {
                await this.initMicrophoneAudio();
            }
            
            // Share audio context and analyser with other visualizers
            this.sharedAudioContext = this.currentVisualizer.audioContext;
            this.sharedAnalyser = this.currentVisualizer.analyser;
            
            // Initialize audio for other visualizers
            for (const [key, visualizer] of Object.entries(this.visualizers)) {
                if (visualizer !== this.currentVisualizer) {
                    visualizer.audioContext = this.sharedAudioContext;
                    visualizer.analyser = this.sharedAnalyser;
                    visualizer.dataArray = this.currentVisualizer.dataArray;
                    visualizer.frequencyData = this.currentVisualizer.frequencyData;
                }
            }
            
            this.audioInitialized = true;
            this.startButton.textContent = '🎵 Audio Active';
            this.startButton.classList.add('active');
            
            // Start the current visualizer
            this.currentVisualizer.start();
            
            const sourceText = this.audioSource === 'file' ? 
                `File: ${this.currentAudioFile.name}` : 
                (this.currentVisualizer.usingMicrophone ? 'Microphone' : 'Demo mode');
            
            this.updateStatus(`Audio visualization active (${sourceText}) - use number keys 1-3 to switch visualizers`);
            
        } catch (error) {
            console.error('Error starting audio:', error);
            this.updateStatus(`Failed to start audio: ${error.message}`, 'error');
            this.startButton.disabled = false;
        }
    }

    /**
     * Initialize microphone audio
     */
    async initMicrophoneAudio() {
        await this.currentVisualizer.initAudio();
    }

    /**
     * Initialize file audio
     */
    async initFileAudio() {
        if (!this.currentAudioFile) {
            throw new Error('No audio file selected');
        }
        
        // Create audio context
        this.currentVisualizer.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.currentVisualizer.analyser = this.currentVisualizer.audioContext.createAnalyser();
        this.currentVisualizer.analyser.fftSize = this.currentVisualizer.fftSize;
        this.currentVisualizer.analyser.smoothingTimeConstant = this.currentVisualizer.smoothingTimeConstant;
        
        // Create audio element
        this.audioElement = new Audio();
        this.audioElement.controls = false;
        this.audioElement.loop = true;
        
        // Load file
        const fileURL = URL.createObjectURL(this.currentAudioFile);
        this.audioElement.src = fileURL;
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
            this.audioElement.addEventListener('canplaythrough', resolve);
            this.audioElement.addEventListener('error', reject);
            this.audioElement.load();
        });
        
        // Connect audio to analyser
        const source = this.currentVisualizer.audioContext.createMediaElementSource(this.audioElement);
        source.connect(this.currentVisualizer.analyser);
        source.connect(this.currentVisualizer.audioContext.destination);
        
        // Start playback
        await this.audioElement.play();
        
        // Set up data arrays
        this.currentVisualizer.dataArray = new Uint8Array(this.currentVisualizer.analyser.frequencyBinCount);
        this.currentVisualizer.frequencyData = new Uint8Array(this.currentVisualizer.analyser.frequencyBinCount);
        this.currentVisualizer.usingMicrophone = false;
    }

    /**
     * Switch between visualizers
     */
    switchVisualizer(visualizerKey) {
        if (!this.audioInitialized) {
            this.updateStatus('Please start audio first', 'error');
            return;
        }
        
        if (!this.visualizers[visualizerKey]) {
            this.updateStatus('Visualizer not found', 'error');
            return;
        }
        
        if (this.currentVisualizer === this.visualizers[visualizerKey]) {
            return; // Already active
        }
        
        try {
            // Stop current visualizer
            if (this.currentVisualizer) {
                this.currentVisualizer.stop();
            }
            
            // Switch to new visualizer
            this.currentVisualizer = this.visualizers[visualizerKey];
            this.currentVisualizer.start();
            
            // Update UI
            this.updateToolButtons(visualizerKey);
            this.updateStatus(`Switched to ${this.getVisualizerName(visualizerKey)}`);
            
        } catch (error) {
            console.error('Error switching visualizer:', error);
            this.updateStatus('Error switching visualizer', 'error');
        }
    }

    /**
     * Update sensitivity for current visualizer
     */
    updateSensitivity(value) {
        if (this.currentVisualizer) {
            this.currentVisualizer.setSensitivity(value);
        }
    }

    /**
     * Update tool button states
     */
    updateToolButtons(activeKey) {
        this.toolButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tool === activeKey);
        });
    }

    /**
     * Get human-readable visualizer name
     */
    getVisualizerName(key) {
        const names = {
            rose: 'Rose Visualizer',
            sphere: '3D Sphere Visualizer',
            fractal: 'Fractal Visualizer'
        };
        return names[key] || key;
    }

    /**
     * Update status display
     */
    updateStatus(message, type = 'info') {
        this.statusDisplay.textContent = message;
        this.statusDisplay.className = `status ${type}`;
        
        // Auto-clear error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                if (this.statusDisplay.classList.contains('error')) {
                    this.updateStatus('Audio visualization active');
                }
            }, 5000);
        }
    }

    /**
     * Handle window beforeunload
     */
    cleanup() {
        Object.values(this.visualizers).forEach(visualizer => {
            visualizer.destroy();
        });
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        if (this.sharedAudioContext && this.sharedAudioContext.state !== 'closed') {
            this.sharedAudioContext.close();
        }
    }
}

// Initialize application when DOM is loaded or immediately if already loaded
function initApp() {
    const app = new AudioVisualizerApp();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
    
    // Make app globally available for debugging
    window.audioVisualizerApp = app;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already loaded
    initApp();
}

// Service Worker registration for offline support (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('./sw.js');
    });
}