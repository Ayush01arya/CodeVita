let scene, camera, renderer, controls, tooltip, loadingDiv, selectedObject;

// Define planets data (name, distance from the sun, color)
const planetsData = [
  { name: "Mercury", distance: 30, color: 0xaaaaaa },
  { name: "Venus", distance: 50, color: 0xffcc00 },
  { name: "Earth", distance: 70, color: 0x0000ff },
  { name: "Mars", distance: 90, color: 0xff0000 },
  { name: "Jupiter", distance: 110, color: 0xff8800 },
  { name: "Saturn", distance: 130, color: 0xffff00 },
  { name: "Uranus", distance: 150, color: 0x00ffff },
  { name: "Neptune", distance: 170, color: 0x0000cc },
];

function init() {
  // Create the scene
  scene = new THREE.Scene();

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 300);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('orrery-container').appendChild(renderer.domElement);

  // Add stars to the background
  addStars();

  // Sun with basic color
  const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow sun
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Add planets to the scene with orbits
  addPlanets();

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Tooltip setup
  tooltip = document.getElementById('tooltip');
  loadingDiv = document.getElementById('loading');

  // Handle window resizing
  window.addEventListener('resize', onWindowResize);

  // Listen for mouse move events for tooltips
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick); // Add click event listener

  // Fetch and display NEOs
  fetchAsteroids();

  // Start the animation loop
  animate();
}

// Function to add stars in the background
function addStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];

  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// Function to add planets and their orbits to the scene
function addPlanets() {
  planetsData.forEach(planet => {
    // Create planet mesh with color
    const planetGeometry = new THREE.SphereGeometry(3, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    // Set planet position based on distance from the sun
    planetMesh.position.set(planet.distance, 0, 0);
    planetMesh.name = planet.name;

    // Create the orbit path using dashed lines
    const orbitPoints = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const x = planet.distance * Math.cos(theta);
      const z = planet.distance * Math.sin(theta);
      orbitPoints.push(new THREE.Vector3(x, 0, z));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 3, gapSize: 2 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.computeLineDistances();

    scene.add(planetMesh);
    scene.add(orbit);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Mouse movement for tooltips
function onMouseMove(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (tooltip) {
      tooltip.style.display = 'block';
      tooltip.style.left = event.clientX + 'px';
      tooltip.style.top = event.clientY + 'px';
      tooltip.innerHTML = object.name ? `Object: ${object.name}` : 'Unknown Object';
    }
  } else if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Mouse click event for selecting NEOs and planets
function onMouseClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.name) {
      selectedObject = object; // Store the selected object
      displayObjectInfo(object.name); // Call to display object info
    }
  }
}

// Function to display information of the selected planet or NEO
function displayObjectInfo(objectName) {
  const planet = planetsData.find(p => p.name === objectName);
  if (planet) {
    alert(`You clicked on: ${planet.name}\nDistance from Sun: ${planet.distance} million km`);
  } else {
    alert(`You clicked on: ${objectName}`);
  }
}

// Fetch and display NEOs with ML classification
async function fetchAsteroids() {
  try {
    // Show loading effect
    loadingDiv.style.display = 'block';

    const response = await fetch('https://tensorflow.astroverse.in/api/neo/2024-09-01/2024-09-07'); // Sample date range

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const neoList = document.getElementById('neo-list');

    // Check if neoList exists in the DOM
    if (!neoList) {
      console.error("Element with id 'neo-list' not found in the DOM.");
      return;
    }

    // Loop through NEOs and display in the control panel
    for (const date in data.near_earth_objects) {
      data.near_earth_objects[date].forEach(neo => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerHTML = `${neo.name} - ${neo.classification}`;
        neoList.appendChild(li);

        // Add NEO to the scene
        const asteroidGeometry = new THREE.SphereGeometry(1, 16, 16);
        const asteroidMaterial = new THREE.MeshBasicMaterial({ color: neo.classification === 'Potentially Hazardous' ? 0xff0000 : 0x00ff00 });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

        // Randomize position
        asteroid.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
        asteroid.name = neo.name;

        scene.add(asteroid);
      });
    }

    // Hide loading effect after fetching
    loadingDiv.style.display = 'none';

  } catch (error) {
    console.error("Error fetching NEO data:", error);
    loadingDiv.style.display = 'none'; // Hide loading effect on error
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Initialize the scene
init();
