// js/ambient.js - Three.js Ambient Background
// Gradient mesh + particle field for immersive atmosphere

class AmbientBackground {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });

    this.mouse = { x: 0, y: 0 };
    this.scrollY = 0;
    this.time = 0;

    this.colors = {
      royalBlue: new THREE.Color(0x1a2a4a),
      deepNavy: new THREE.Color(0x0d1929),
      blush: new THREE.Color(0xe8c4b8),
      cream: new THREE.Color(0xf0ebe3)
    };

    this.init();
  }

  init() {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Camera position
    this.camera.position.z = 30;

    // Create elements
    this.createGradientMesh();
    this.createParticles();

    // Events
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Start animation
    this.animate();
  }

  createGradientMesh() {
    // Create multiple gradient spheres for the mesh effect
    this.gradientMeshes = [];

    const meshConfigs = [
      { x: -15, y: 10, z: -20, scale: 25, color: this.colors.royalBlue, speed: 0.0003 },
      { x: 20, y: -5, z: -25, scale: 20, color: this.colors.blush, speed: 0.0004 },
      { x: 0, y: -15, z: -15, scale: 18, color: this.colors.deepNavy, speed: 0.0002 },
      { x: -10, y: 5, z: -30, scale: 30, color: this.colors.royalBlue, speed: 0.00025 }
    ];

    meshConfigs.forEach(config => {
      const geometry = new THREE.SphereGeometry(config.scale, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(config.x, config.y, config.z);
      mesh.userData = {
        originalX: config.x,
        originalY: config.y,
        speed: config.speed
      };

      this.scene.add(mesh);
      this.gradientMeshes.push(mesh);
    });
  }

  createParticles() {
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xfaf8f5,
      size: 0.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  updateScroll(scrollY) {
    this.scrollY = scrollY;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Animate gradient meshes
    this.gradientMeshes.forEach((mesh, i) => {
      const userData = mesh.userData;
      mesh.position.x = userData.originalX + Math.sin(this.time * userData.speed * 1000 + i) * 5;
      mesh.position.y = userData.originalY + Math.cos(this.time * userData.speed * 800 + i) * 3;

      // Mouse parallax
      mesh.position.x += this.mouse.x * 2;
      mesh.position.y += this.mouse.y * 2;

      // Scroll influence on opacity
      const scrollInfluence = Math.min(this.scrollY / 1000, 1);
      mesh.material.opacity = 0.3 - scrollInfluence * 0.1;
    });

    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        // Float upward
        positions[i + 1] += 0.02;

        // Reset when too high
        if (positions[i + 1] > 50) {
          positions[i + 1] = -50;
        }

        // Subtle horizontal drift
        positions[i] += Math.sin(this.time + i) * 0.005;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;

      // Mouse parallax on particles
      this.particles.rotation.x = this.mouse.y * 0.1;
      this.particles.rotation.y = this.mouse.x * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.ambientBg = new AmbientBackground();
});
