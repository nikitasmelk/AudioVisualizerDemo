/**
 * Rose Visualizer
 * Creates an animated rose pattern that responds to audio input
 */
class RoseVisualizer extends BaseVisualizer {
    constructor() {
        super('roseCanvas');
        
        this.canvas = this.container;
        this.ctx = this.canvas.getContext('2d');
        this.centerX = 0;
        this.centerY = 0;
        this.numPetals = 12;
        this.baseRadius = 100;
        this.maxRadius = 300;
        
        // Animation properties
        this.time = 0;
        this.rotationSpeed = 0.01;
        this.pulseSpeed = 0.05;
        
        // Initialize canvas size
        this.resize();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resize());
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
        this.baseRadius = minDimension * 0.1;
        this.maxRadius = minDimension * 0.35;
    }

    /**
     * Draw a single petal
     */
    drawPetal(x, y, angle, petalLength, petalWidth, color, opacity = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // Create gradient for petal
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, petalLength);
        
        // Parse HSLA color and create variations
        const colorMatch = color.match(/hsla?\(([^)]+)\)/);
        if (colorMatch) {
            const [h, s, l, a = 1] = colorMatch[1].split(',').map(v => parseFloat(v.trim().replace('%', '')));
            gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${opacity * a})`);
            gradient.addColorStop(0.7, `hsla(${h}, ${s}%, ${l}%, ${opacity * 0.6 * a})`);
            gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
        } else {
            // Fallback to solid color
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
        }
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, petalWidth, petalLength, 0, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add stroke for definition
        const strokeColorMatch = color.match(/hsla?\(([^)]+)\)/);
        if (strokeColorMatch) {
            const [h, s, l, a = 1] = strokeColorMatch[1].split(',').map(v => parseFloat(v.trim().replace('%', '')));
            this.ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${opacity * 0.8 * a})`;
        } else {
            this.ctx.strokeStyle = color;
        }
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * Draw the center object
     */
    drawCenterObject(color, volume) {
        const radius = 8 + volume * 20 * (this.sensitivity / 100);
        
        // Create pulsing gradient
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, radius * 2
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(/,\s*[\d.]+\)$/, ', 0.8)'));
        gradient.addColorStop(1, color.replace(/,\s*[\d.]+\)$/, ', 0)'));
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add inner glow
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius * 0.5, 0, 2 * Math.PI);
        this.ctx.fillStyle = color.replace(/,\s*[\d.]+\)$/, ', 0.9)');
        this.ctx.fill();
    }

    /**
     * Draw the complete rose
     */
    drawRose(color, volume) {
        const adjustedVolume = volume * (this.sensitivity / 100);
        
        // Create multiple layers for depth
        for (let layer = 0; layer < 3; layer++) {
            const layerOpacity = 1 - (layer * 0.3);
            const layerScale = 1 + (layer * 0.2);
            
            for (let i = 0; i < this.numPetals; i++) {
                // Calculate petal properties
                const angle = (i / this.numPetals) * 2 * Math.PI + this.time * this.rotationSpeed;
                const radiusVariation = Math.sin(this.time * this.pulseSpeed + i) * 0.3 + 1;
                const radius = (this.baseRadius + adjustedVolume * this.maxRadius) * radiusVariation * layerScale;
                
                const petalLength = (30 + adjustedVolume * 150) * layerScale;
                const petalWidth = (15 + adjustedVolume * 75) * layerScale;
                
                // Add some randomness for organic feel
                const randomOffset = Math.sin(this.time * 0.03 + i * 0.5) * 20 * adjustedVolume;
                const x = this.centerX + Math.cos(angle) * (radius + randomOffset);
                const y = this.centerY + Math.sin(angle) * (radius + randomOffset);
                
                // Calculate petal angle with slight randomness
                const petalAngle = angle + Math.sin(this.time * 0.02 + i) * 0.3;
                
                this.drawPetal(x, y, petalAngle, petalLength, petalWidth, color, layerOpacity);
            }
        }
    }

    /**
     * Main render method
     */
    render() {
        // Clear canvas with fade effect for trails
        this.ctx.fillStyle = 'rgba(1, 4, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.analyser) return;
        
        // Get audio data
        const volume = this.getAverageFrequency();
        const color = this.getFrequencyColor(0.9);
        
        // Update time and adaptive parameters
        this.time += 1;
        this.updatePetalCount();
        
        // Draw components
        this.drawFrequencySpectrum();
        this.drawRose(color, volume);
        this.drawCenterObject(color, volume);
    }

    /**
     * Draw frequency spectrum as background elements
     */
    drawFrequencySpectrum() {
        if (!this.frequencyData) return;
        
        const barCount = Math.min(64, this.frequencyData.length);
        const angleStep = (2 * Math.PI) / barCount;
        const spectrumRadius = this.baseRadius * 2;
        
        for (let i = 0; i < barCount; i++) {
            const value = this.frequencyData[i] / 255;
            if (value < 0.1) continue;
            
            const angle = i * angleStep + this.time * 0.005;
            const barLength = value * 100 * (this.sensitivity / 100);
            const barWidth = 2;
            
            const startX = this.centerX + Math.cos(angle) * spectrumRadius;
            const startY = this.centerY + Math.sin(angle) * spectrumRadius;
            const endX = startX + Math.cos(angle) * barLength;
            const endY = startY + Math.sin(angle) * barLength;
            
            const hue = (i / barCount) * 360;
            const color = `hsla(${hue}, 70%, 60%, ${value * 0.6})`;
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = barWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    /**
     * Update number of petals based on audio intensity
     */
    updatePetalCount() {
        const volume = this.getAverageFrequency();
        this.numPetals = Math.floor(8 + volume * 12); // 8-20 petals based on volume
    }
}