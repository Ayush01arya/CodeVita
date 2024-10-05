let scene, camera, renderer, controls;

function init() {
  // Create scene
  scene = new THREE.Scene();

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 150);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('orrery-container').appendChild(renderer.domElement);

  // Add Sun
  const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Add planets (for now, we'll add just one)
  const planetGeometry = new THREE.SphereGeometry(2, 32, 32);
  const planetMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.position.set(50, 0, 0);
  scene.add(planet);

  // Set up controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Start animation
  animate();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Fetch and display asteroids
async function fetchAsteroids() {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/neo/2024-09-01/2024-09-07');  // Sample date range

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Log the data to inspect its structure
    console.log("Fetched NEO data:", data);

    // Verify if the near_earth_objects structure exists
    if (!data.near_earth_objects) {
      console.error("No near_earth_objects in the response!");
      return;
    }

    // Loop through the NEOs and add them to the scene
    for (const date in data.near_earth_objects) {
      data.near_earth_objects[date].forEach(asteroid => {
        const asteroidGeometry = new THREE.SphereGeometry(1, 16, 16);
        const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

        // Set random position for now
        asteroidMesh.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
        scene.add(asteroidMesh);
      });
    }
  } catch (error) {
    console.error("Error fetching asteroid data:", error);
  }
}

// Initialize scene and fetch asteroids
init();
fetchAsteroids();
