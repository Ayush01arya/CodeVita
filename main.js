let scene, camera, renderer, controls, tooltip, loadingDiv, selectedNeo;

function init() {
  // Create the scene
  scene = new THREE.Scene();

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 150);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('orrery-container').appendChild(renderer.domElement);

  // Add stars to the background
  addStars();

  // Sun with texture
  const sunTexture = new THREE.TextureLoader().load('/sun.png'); // Adjusted path
  const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Earth
  const earthTexture = new THREE.TextureLoader().load('earth.png'); // Adjusted path
  const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
  const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(50, 0, 0);
  earth.name = "Earth";
  scene.add(earth);

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

// Mouse click event for selecting NEOs
function onMouseClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.name !== "Earth") { // Check if it's not Earth
      selectedNeo = object; // Store the selected NEO
      displayNeoInfo(object.name); // Call to display NEO info
    }
  }
}

// Function to display information of the selected NEO on canvas
function displayNeoInfo(neoName) {
  // You can implement a more complex logic to display details
  alert(`You clicked on: ${neoName}`);
}

// Fetch and display NEOs with ML classification
async function fetchAsteroids() {
  try {
    // Show loading effect
    loadingDiv.style.display = 'block';

    const response = await fetch('http://127.0.0.1:5000/api/neo/2024-09-01/2024-09-07'); // Sample date range

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
