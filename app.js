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
        
        // DOM elements
        this.startButton = document.getElementById('startButton');
        this.toolButtons = document.querySelectorAll('.tool-btn');
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
            
            // Set initial visualizer
            this.currentVisualizer = this.visualizers.rose;
            
            this.updateStatus('Visualizers loaded - ready to start');
        } catch (error) {
            console.error('Error initializing visualizers:', error);
            this.updateStatus('Error loading visualizers', 'error');
        }
    }

    /**
     * Start audio and begin visualization
     */
    async startAudio() {
        if (this.audioInitialized) return;
        
        try {
            this.updateStatus('Requesting microphone access...', 'loading');
            this.startButton.disabled = true;
            
            // Initialize audio for the current visualizer
            await this.currentVisualizer.initAudio();
            
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
            
            this.updateStatus('Audio visualization active - use number keys 1-2 to switch visualizers');
            
        } catch (error) {
            console.error('Error starting audio:', error);
            this.updateStatus(`Failed to access microphone: ${error.message}`, 'error');
            this.startButton.disabled = false;
        }
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
            sphere: '3D Sphere Visualizer'
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
        
        if (this.sharedAudioContext && this.sharedAudioContext.state !== 'closed') {
            this.sharedAudioContext.close();
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AudioVisualizerApp();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
    
    // Make app globally available for debugging
    window.audioVisualizerApp = app;
});

// Service Worker registration for offline support (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('./sw.js');
    });
}