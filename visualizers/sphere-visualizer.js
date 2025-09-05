/**
 * 3D Sphere Visualizer
 * Creates a 3D wireframe sphere that responds to audio input using Three.js
 */
class SphereVisualizer extends BaseVisualizer {
    constructor() {
        super('sphereContainer');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Animation properties
        this.time = 0;
        this.baseGeometry = null;
        this.originalVertices = [];
        
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            this.fallbackMode = true;
            console.warn('Three.js not available, using fallback visualization');
        } else {
            this.fallbackMode = false;
        }
        
        this.init();
    }

    /**
     * Initialize the 3D scene or fallback
     */
    init() {
        if (this.fallbackMode) {
            this.initFallback();
        } else {
            this.initThreeJS();
        }
        
        // Add mouse move listener
        this.container.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect();
            this.mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Add resize listener
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    /**
     * Initialize Three.js scene
     */
    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        // Create sphere geometry
        this.baseGeometry = new THREE.SphereGeometry(1, 32, 32);
        this.originalVertices = [...this.baseGeometry.attributes.position.array];
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        // Create sphere mesh
        this.sphere = new THREE.Mesh(this.baseGeometry, material);
        this.scene.add(this.sphere);
        
        // Create particle system
        this.createParticles();
    }

    /**
     * Create particle system for enhanced visual effects
     */
    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;
            positions[i + 1] = (Math.random() - 0.5) * 10;
            positions[i + 2] = (Math.random() - 0.5) * 10;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x4ecdc4,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    /**
     * Fallback 2D canvas implementation
     */
    initFallback() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        // Initialize sphere properties for 2D fallback
        this.sphereRadius = 100;
        this.points = [];
        
        // Generate sphere points for 2D projection
        this.generateSpherePoints();
    }

    /**
     * Generate points for 2D sphere projection
     */
    generateSpherePoints() {
        this.points = [];
        const detail = 20;
        
        for (let i = 0; i <= detail; i++) {
            for (let j = 0; j <= detail; j++) {
                const phi = (i / detail) * Math.PI;
                const theta = (j / detail) * 2 * Math.PI;
                
                const x = Math.sin(phi) * Math.cos(theta);
                const y = Math.sin(phi) * Math.sin(theta);
                const z = Math.cos(phi);
                
                this.points.push({ x, y, z, originalZ: z });
            }
        }
    }

    /**
     * Resize handler
     */
    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        if (this.fallbackMode) {
            this.canvas.width = width;
            this.canvas.height = height;
        } else if (this.renderer) {
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * Update sphere geometry based on audio
     */
    updateSphereGeometry(volume, frequencyData) {
        if (this.fallbackMode || !this.sphere) return;
        
        const vertices = this.sphere.geometry.attributes.position.array;
        const adjustedVolume = volume * (this.sensitivity / 100);
        
        for (let i = 0; i < vertices.length; i += 3) {
            const originalX = this.originalVertices[i];
            const originalY = this.originalVertices[i + 1];
            const originalZ = this.originalVertices[i + 2];
            
            // Calculate distance from center
            const distance = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ);
            
            // Apply audio-based displacement
            const frequencyIndex = Math.floor((i / 3) % frequencyData.length);
            const frequencyValue = frequencyData[frequencyIndex] / 255;
            const displacement = 1 + (adjustedVolume * 0.5) + (frequencyValue * 0.3);
            
            vertices[i] = originalX * displacement;
            vertices[i + 1] = originalY * displacement;
            vertices[i + 2] = originalZ * displacement;
        }
        
        this.sphere.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update particle system
     */
    updateParticles(volume) {
        if (this.fallbackMode || !this.particleSystem) return;
        
        const positions = this.particleSystem.geometry.attributes.position.array;
        const adjustedVolume = volume * (this.sensitivity / 100);
        
        for (let i = 0; i < positions.length; i += 3) {
            // Add some movement based on audio
            positions[i] += Math.sin(this.time * 0.01 + i) * adjustedVolume * 0.1;
            positions[i + 1] += Math.cos(this.time * 0.01 + i) * adjustedVolume * 0.1;
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.material.opacity = 0.3 + adjustedVolume * 0.5;
    }

    /**
     * Render Three.js scene
     */
    renderThreeJS() {
        const volume = this.getAverageFrequency();
        const dominantFreq = this.getDominantFrequency();
        
        // Update sphere
        if (this.sphere) {
            // Scale based on volume
            const scale = 1 + volume * (this.sensitivity / 100);
            this.sphere.scale.setScalar(scale);
            
            // Change color based on frequency
            const hue = dominantFreq * 360;
            this.sphere.material.color.setHSL(hue / 360, 0.8, 0.6);
            
            // Rotation based on mouse and audio
            this.sphere.rotation.x += (this.mouseY * 0.1 - this.sphere.rotation.x) * 0.05;
            this.sphere.rotation.y += (this.mouseX * 0.1 - this.sphere.rotation.y) * 0.05;
            this.sphere.rotation.z += volume * 0.02;
            
            // Update geometry
            this.updateSphereGeometry(volume, this.frequencyData);
        }
        
        // Update camera FOV for chaos effect
        const fovChange = volume * 20 * (this.sensitivity / 100);
        this.camera.fov = 75 + fovChange;
        this.camera.updateProjectionMatrix();
        
        // Update particles
        this.updateParticles(volume);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Render fallback 2D visualization
     */
    renderFallback() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, width, height);
        
        const volume = this.getAverageFrequency();
        const color = this.getFrequencyColor(0.8);
        
        // Draw sphere wireframe
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        const radius = this.sphereRadius * (1 + volume * (this.sensitivity / 100));
        
        // Draw longitude lines
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * 2 * Math.PI;
            this.ctx.beginPath();
            
            for (let j = 0; j <= 20; j++) {
                const phi = (j / 20) * Math.PI;
                const x = centerX + Math.sin(phi) * Math.cos(angle) * radius;
                const y = centerY + Math.cos(phi) * radius;
                
                if (j === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Draw latitude lines
        for (let i = 1; i < 10; i++) {
            const phi = (i / 10) * Math.PI;
            const circleRadius = Math.sin(phi) * radius;
            const y = centerY + Math.cos(phi) * radius;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, y, circleRadius, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        
        // Add pulsing center
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5 + volume * 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Main render method
     */
    render() {
        this.time += 1;
        
        if (this.fallbackMode) {
            this.renderFallback();
        } else {
            this.renderThreeJS();
        }
    }

    /**
     * Stop the visualizer
     */
    stop() {
        super.stop();
        
        if (!this.fallbackMode && this.renderer) {
            this.renderer.domElement.remove();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        super.destroy();
        
        if (!this.fallbackMode) {
            if (this.renderer) {
                this.renderer.dispose();
            }
            if (this.baseGeometry) {
                this.baseGeometry.dispose();
            }
        }
    }
}