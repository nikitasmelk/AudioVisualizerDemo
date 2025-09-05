/**
 * Fractal Visualizer
 * Creates complex mathematical visualizations based on Fourier series and fractals
 * Combines audio-reactive fractals, Fourier transforms, and mathematical beauty
 */
class FractalVisualizer extends BaseVisualizer {
    constructor() {
        super('fractalCanvas');
        
        this.canvas = this.container;
        this.ctx = this.canvas.getContext('2d');
        this.centerX = 0;
        this.centerY = 0;
        
        // Fractal parameters
        this.maxIterations = 100;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        // Fourier series parameters
        this.fourierTerms = 20;
        this.fourierRadius = 100;
        this.fourierSpeed = 0.02;
        
        // Animation properties
        this.time = 0;
        this.frameCount = 0;
        this.mode = 'mandelbrot'; // 'mandelbrot', 'julia', 'fourier', 'hybrid'
        
        // Audio-reactive parameters
        this.colorShift = 0;
        this.fractalMorph = 0;
        this.complexParam = { re: -0.7, im: 0.27015 }; // Julia set parameter
        
        // Particle system for enhanced visuals
        this.particles = [];
        this.particleCount = 150;
        
        // Initialize canvas and particles
        this.resize();
        this.initParticles();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resize());
        
        // Mode cycling every 15 seconds
        this.modeTimer = setInterval(() => {
            if (this.isActive) {
                this.cycleModes();
            }
        }, 15000);
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        const rect = this.container.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Adjust scaling based on canvas size
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
        this.fourierRadius = minDimension * 0.15;
        this.zoom = minDimension / 800; // Base zoom level
    }

    /**
     * Initialize particle system
     */
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: Math.random(),
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }

    /**
     * Cycle through different visualization modes
     */
    cycleModes() {
        const modes = ['mandelbrot', 'julia', 'fourier', 'hybrid'];
        const currentIndex = modes.indexOf(this.mode);
        this.mode = modes[(currentIndex + 1) % modes.length];
        console.log(`Switched to mode: ${this.mode}`);
    }

    /**
     * Calculate Mandelbrot set value
     */
    mandelbrot(x, y) {
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        const zoomFactor = this.zoom * (1 + audioInfluence * 0.5);
        
        let zx = (x - this.centerX) / (this.canvas.width * zoomFactor) + this.panX;
        let zy = (y - this.centerY) / (this.canvas.height * zoomFactor) + this.panY;
        
        let cx = zx;
        let cy = zy;
        
        let iterations = 0;
        while (zx * zx + zy * zy < 4 && iterations < this.maxIterations) {
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            iterations++;
        }
        
        return iterations;
    }

    /**
     * Calculate Julia set value
     */
    julia(x, y) {
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        const dominantFreq = this.getDominantFrequency();
        
        // Audio-reactive Julia parameter
        const c_re = this.complexParam.re + Math.sin(this.time * 0.01) * 0.1 * audioInfluence;
        const c_im = this.complexParam.im + Math.cos(this.time * 0.01) * 0.1 * audioInfluence;
        
        const zoomFactor = this.zoom * (1 + audioInfluence * 0.3);
        let zx = (x - this.centerX) / (this.canvas.width * zoomFactor);
        let zy = (y - this.centerY) / (this.canvas.height * zoomFactor);
        
        let iterations = 0;
        while (zx * zx + zy * zy < 4 && iterations < this.maxIterations) {
            let tmp = zx * zx - zy * zy + c_re;
            zy = 2 * zx * zy + c_im;
            zx = tmp;
            iterations++;
        }
        
        return iterations;
    }

    /**
     * Calculate Fourier series point
     */
    fourierPoint(t, harmonics) {
        let x = 0;
        let y = 0;
        
        for (let i = 1; i <= harmonics; i++) {
            const freq = this.frequencyData[Math.floor(i * this.frequencyData.length / harmonics)] / 255;
            const amplitude = this.fourierRadius * freq * (1 / i);
            const angle = i * t + this.time * this.fourierSpeed * i;
            
            x += amplitude * Math.cos(angle);
            y += amplitude * Math.sin(angle);
        }
        
        return { x: x + this.centerX, y: y + this.centerY };
    }

    /**
     * Draw Fourier series visualization
     */
    drawFourier() {
        if (!this.frequencyData) return;
        
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        
        // Draw multiple overlapping Fourier series
        for (let layer = 0; layer < 3; layer++) {
            this.ctx.strokeStyle = this.getFrequencyColor(0.6 - layer * 0.2);
            this.ctx.lineWidth = 2 + layer;
            this.ctx.beginPath();
            
            let firstPoint = true;
            for (let t = 0; t < Math.PI * 2; t += 0.02) {
                const harmonics = this.fourierTerms - layer * 5;
                const point = this.fourierPoint(t, harmonics);
                
                // Add audio-reactive distortion
                const distortion = audioInfluence * 20;
                point.x += Math.sin(t * 5 + this.time * 0.01) * distortion;
                point.y += Math.cos(t * 3 + this.time * 0.01) * distortion;
                
                if (firstPoint) {
                    this.ctx.moveTo(point.x, point.y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            
            this.ctx.closePath();
            this.ctx.stroke();
        }
        
        // Draw frequency spectrum as radial lines
        this.drawRadialSpectrum();
    }

    /**
     * Draw radial frequency spectrum
     */
    drawRadialSpectrum() {
        if (!this.frequencyData) return;
        
        const barCount = 64;
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        
        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const freqIndex = Math.floor(i * this.frequencyData.length / barCount);
            const amplitude = this.frequencyData[freqIndex] / 255;
            const length = amplitude * this.fourierRadius * 2 * audioInfluence;
            
            const startX = this.centerX + Math.cos(angle) * this.fourierRadius * 0.5;
            const startY = this.centerY + Math.sin(angle) * this.fourierRadius * 0.5;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            
            this.ctx.strokeStyle = this.getFrequencyColor(amplitude);
            this.ctx.lineWidth = 1 + amplitude * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw fractal visualization
     */
    drawFractal() {
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        const dominantFreq = this.getDominantFrequency();
        
        // Sample every nth pixel for performance
        const step = Math.max(1, Math.floor(4 - audioInfluence * 3));
        
        for (let x = 0; x < this.canvas.width; x += step) {
            for (let y = 0; y < this.canvas.height; y += step) {
                let iterations;
                
                if (this.mode === 'mandelbrot' || this.mode === 'hybrid') {
                    iterations = this.mandelbrot(x, y);
                } else {
                    iterations = this.julia(x, y);
                }
                
                // Color calculation with audio influence
                const hue = (iterations / this.maxIterations * 360 + dominantFreq * 360 + this.time * 0.5) % 360;
                const saturation = Math.min(100, 70 + audioInfluence * 30);
                const lightness = iterations < this.maxIterations ? 
                    Math.min(80, 20 + (iterations / this.maxIterations) * 60 + audioInfluence * 20) : 0;
                
                const color = this.hslToRgb(hue, saturation, lightness);
                
                // Fill pixels in step x step blocks
                for (let dx = 0; dx < step && x + dx < this.canvas.width; dx++) {
                    for (let dy = 0; dy < step && y + dy < this.canvas.height; dy++) {
                        const index = ((y + dy) * this.canvas.width + (x + dx)) * 4;
                        data[index] = color.r;
                        data[index + 1] = color.g;
                        data[index + 2] = color.b;
                        data[index + 3] = 255;
                    }
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Convert HSL to RGB
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Update and draw particles
     */
    updateParticles() {
        if (!this.frequencyData) return;
        
        const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
        
        this.particles.forEach((particle, index) => {
            // Update particle position
            particle.x += particle.vx * particle.speed * (1 + audioInfluence);
            particle.y += particle.vy * particle.speed * (1 + audioInfluence);
            
            // Audio-reactive velocity changes
            const freqIndex = Math.floor(index * this.frequencyData.length / this.particles.length);
            const freq = this.frequencyData[freqIndex] / 255;
            particle.vx += (Math.random() - 0.5) * freq * 0.1;
            particle.vy += (Math.random() - 0.5) * freq * 0.1;
            
            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Boundary wrapping
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Update life
            particle.life = (particle.life + 0.01) % 1;
            
            // Draw particle
            const alpha = Math.sin(particle.life * Math.PI) * freq;
            this.ctx.fillStyle = this.getFrequencyColor(alpha);
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * (1 + freq), 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Main render method
     */
    render() {
        if (!this.ctx) return;
        
        // Clear with fade effect for trails
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update time and parameters
        this.time++;
        this.frameCount++;
        
        if (this.frequencyData) {
            const audioInfluence = this.getAverageFrequency() * this.sensitivity / 100;
            
            // Update fractal parameters based on audio
            this.panX += Math.sin(this.time * 0.001) * audioInfluence * 0.001;
            this.panY += Math.cos(this.time * 0.001) * audioInfluence * 0.001;
            this.maxIterations = Math.floor(50 + audioInfluence * 50);
            
            // Render based on current mode
            switch (this.mode) {
                case 'fourier':
                    this.drawFourier();
                    break;
                case 'mandelbrot':
                case 'julia':
                    if (this.frameCount % 2 === 0) { // Render every other frame for performance
                        this.drawFractal();
                    }
                    break;
                case 'hybrid':
                    if (this.frameCount % 3 === 0) {
                        this.drawFractal();
                    }
                    this.drawFourier();
                    break;
            }
            
            // Always draw particles for added visual appeal
            this.updateParticles();
            
            // Draw mode indicator
            this.ctx.fillStyle = '#00ff41';
            this.ctx.font = '12px Source Code Pro, monospace';
            this.ctx.fillText(`MODE: ${this.mode.toUpperCase()}`, 10, 25);
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        super.destroy();
        if (this.modeTimer) {
            clearInterval(this.modeTimer);
        }
    }
}