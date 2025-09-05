/**
 * Base Visualizer Class
 * Provides common functionality for all audio visualizers
 */
class BaseVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.frequencyData = null;
        this.isActive = false;
        this.animationId = null;
        this.sensitivity = 50; // Default sensitivity
        
        // Audio processing parameters
        this.fftSize = 2048;
        this.smoothingTimeConstant = 0.8;
        
        // Performance monitoring
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
    }

    /**
     * Initialize audio context and analyser
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
            
            try {
                // Try to get microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: false 
                });
                
                const source = this.audioContext.createMediaStreamSource(stream);
                source.connect(this.analyser);
                this.usingMicrophone = true;
            } catch (micError) {
                console.warn('Microphone access denied, using demo mode:', micError.message);
                // Create demo mode with oscillator
                this.createDemoAudio();
                this.usingMicrophone = false;
            }
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw new Error(`Audio initialization failed: ${error.message}`);
        }
    }

    /**
     * Create demo audio for testing without microphone
     */
    createDemoAudio() {
        // Create multiple oscillators for rich demo sound
        this.demoOscillators = [];
        this.demoGain = this.audioContext.createGain();
        this.demoGain.gain.value = 0.1;
        this.demoGain.connect(this.analyser);
        
        // Create oscillators with different frequencies
        const frequencies = [220, 330, 440, 660];
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.type = 'sine';
            gain.gain.value = 0.25;
            
            oscillator.connect(gain);
            gain.connect(this.demoGain);
            
            this.demoOscillators.push({ oscillator, gain, baseFreq: freq });
        });
        
        // Start demo animation
        this.startDemoAnimation();
    }

    /**
     * Start demo animation with varying frequencies
     */
    startDemoAnimation() {
        if (!this.demoOscillators) return;
        
        this.demoOscillators.forEach(({ oscillator }) => {
            oscillator.start();
        });
        
        // Animate frequencies
        this.demoAnimationId = setInterval(() => {
            const time = this.audioContext.currentTime;
            this.demoOscillators.forEach(({ oscillator, gain, baseFreq }, index) => {
                const variation = Math.sin(time * (0.5 + index * 0.3)) * 100;
                const newFreq = baseFreq + variation;
                oscillator.frequency.setValueAtTime(newFreq, time);
                
                const gainVariation = (Math.sin(time * (0.8 + index * 0.2)) + 1) * 0.25;
                gain.gain.setValueAtTime(gainVariation, time);
            });
        }, 100);
    }

    /**
     * Update audio data from analyser
     */
    updateAudioData() {
        if (!this.analyser) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Get time domain data for waveform
        this.analyser.getByteTimeDomainData(this.dataArray);
    }

    /**
     * Calculate average frequency (volume)
     */
    getAverageFrequency() {
        if (!this.frequencyData) return 0;
        
        const sum = this.frequencyData.reduce((a, b) => a + b, 0);
        return (sum / this.frequencyData.length) / 128.0; // Normalized 0-1
    }

    /**
     * Get dominant frequency for color mapping
     */
    getDominantFrequency() {
        if (!this.frequencyData) return 0;
        
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            if (this.frequencyData[i] > maxValue) {
                maxValue = this.frequencyData[i];
                maxIndex = i;
            }
        }
        
        return maxIndex / this.frequencyData.length; // Normalized 0-1
    }

    /**
     * Get color based on frequency data
     */
    getFrequencyColor(alpha = 1) {
        const dominantFreq = this.getDominantFrequency();
        const hue = dominantFreq * 360;
        const saturation = Math.min(100, 70 + this.getAverageFrequency() * 30);
        const lightness = Math.min(80, 40 + this.getAverageFrequency() * 40);
        
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    /**
     * Update sensitivity
     */
    setSensitivity(value) {
        this.sensitivity = Math.max(10, Math.min(200, value));
    }

    /**
     * Calculate FPS
     */
    updateFPS() {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }

    /**
     * Start the visualizer
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.container.classList.add('active');
        this.animate();
    }

    /**
     * Stop the visualizer
     */
    stop() {
        this.isActive = false;
        this.container.classList.remove('active');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resize handler
     */
    resize() {
        // Override in subclasses
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isActive) return;
        
        this.updateAudioData();
        this.updateFPS();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Render method - must be implemented by subclasses
     */
    render() {
        throw new Error('Render method must be implemented by subclasses');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        
        // Stop demo audio if running
        if (this.demoAnimationId) {
            clearInterval(this.demoAnimationId);
        }
        
        if (this.demoOscillators) {
            this.demoOscillators.forEach(({ oscillator }) => {
                try {
                    oscillator.stop();
                } catch (e) {
                    // Oscillator might already be stopped
                }
            });
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}