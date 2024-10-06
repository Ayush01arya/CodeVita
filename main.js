let scene, camera, renderer, controls, tooltip, loadingDiv, selectedObject;
const clock = new THREE.Clock(); // Clock to track time

// Define planets data (name, distance from the sun, color, and orbital speed)
const planetsData = [
    { name: "Mercury", distance: 30, speed: 0.04, image: 'mercury.png', color: 0xaaaaaa },
    { name: "Venus", distance: 50, speed: 0.03, image: 'venus.png', color: 0xffcc00 },
    { name: "Earth", distance: 70, speed: 0.02, image: 'earth.png', color: 0x0000ff },
    { name: "Mars", distance: 90, speed: 0.017, image: 'mars.png', color: 0xff4500 },
    { name: "Jupiter", distance: 120, speed: 0.013, image: 'jupiter.png', color: 0xff9900 },
    { name: "Saturn", distance: 150, speed: 0.01, image: 'saturn.png', color: 0xe0cda7 },
    { name: "Uranus", distance: 180, speed: 0.008, image: 'uranus.png', color: 0x00ffff },
    { name: "Neptune", distance: 210, speed: 0.006, image: 'neptune.png', color: 0x0000ff },
];

const moonData = {
    name: "Moon",
    distance: 5, // Relative to Earth's position
    speed: 0.05,
    image: 'moon.png', // Moon texture
};
const planetMeshes = []; // Store planet meshes for animation

function init() {
  // Create the scene
  scene = new THREE.Scene();

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 100, 300);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('orrery-container').appendChild(renderer.domElement);

  // Add stars to the background
  addStars();

  // Add the Sun
  const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
  const sunTexture = new THREE.TextureLoader().load('sun.png'); // Yellow sun
  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Add planets to the scene
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
        const planetGeometry = new THREE.SphereGeometry(2, 16, 16);
        const planetTexture = new THREE.TextureLoader().load(planet.image); // Load the planet texture
        const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture }); // Use the texture for the material
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

        // Set position based on distance from the sun
        planetMesh.position.x = planet.distance;
        planetMesh.name = planet.name; // Store planet name

        scene.add(planetMesh);

        // Initialize each planet's angle (starting at 0)
        planetMeshes.push({
            mesh: planetMesh,
            speed: planet.speed,
            distance: planet.distance,
            angle: Math.random() * Math.PI * 2 // Random start angle for variety
        });

        // Add orbit path (circular orbit)
        const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.5, planet.distance + 0.5, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2; // Rotate the ring to be horizontal
        scene.add(orbit);
    });
}

// Function to add the Moon relative to Earth
function addMoon() {
    const earthMesh = planetMeshes.find(planet => planet.mesh.name === "Earth").mesh; // Get Earth mesh
    const moonGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const moonTexture = new THREE.TextureLoader().load(moonData.image); // Load Moon texture
    const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

    // Initial position of the Moon relative to Earth
    moonMesh.position.x = earthMesh.position.x + moonData.distance;
    moonMesh.name = moonData.name; // Store moon name

    scene.add(moonMesh);

    // Initialize moon's angle (starting at 0)
    planetMeshes.push({
        mesh: moonMesh,
        speed: moonData.speed,
        distance: moonData.distance,
        angle: Math.random() * Math.PI * 2 // Random start angle for variety
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
    if (object.name) {
      selectedObject = object; // Store the selected object
      displayObjectInfo(object); // Call to display object info
    }
  }
}

// Use Alertify.js to display information of the selected object
// Use Alertify.js to display information of the selected object
function displayObjectInfo(neo) {
  const impactProbability = neo.impactProbability !== undefined
    ? (neo.impactProbability * 100).toFixed(2) + '%'
    : '0%'; // If no data, show 0%

  alertify.alert(
    ' Code Vita',
    `You clicked on: ${neo.name}<br>Impact Probability: ${impactProbability}<br>Distance from Earth: ${neo.distance || 'N/A'} km`
  );
}
function filterObjects() {
  const filterValue = document.getElementById('filter').value;

  // Loop through all children in the scene
  scene.children.forEach((object) => {
    // Check if the object is a Mesh and has a name property
    if (object instanceof THREE.Mesh && object.name) {
      // Determine visibility based on the filter
      if (filterValue === "all") {
        object.visible = true; // Show all objects
      } else if (filterValue === "planets") {
        object.visible = planetsData.some(planet => planet.name === object.name); // Check if the object is a planet
      } else if (filterValue === "neos") {
        object.visible = object.name.startsWith("NEO"); // Assuming NEOs start with "NEO"
      } else if (filterValue === "comets") {
        object.visible = object.name.startsWith("Comet"); // Assuming comets start with "Comet"
      } else if (filterValue === "hazardous") {
        object.visible = object.impactProbability > 0.1; // Show hazardous objects based on a property
      } else {
        object.visible = false; // Hide objects for unrecognized filter values
      }
    }
  });
}


// Fetch and display NEOs with classification and impact probability
// Load the comet texture
const cometTextureLoader = new THREE.TextureLoader();
const cometTexture = cometTextureLoader.load('commet.png'); // Adjust the path to your comet image

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

        // Add NEO to the scene with comet texture
        const asteroidGeometry = new THREE.SphereGeometry(1, 16, 16);
        const asteroidMaterial = new THREE.MeshBasicMaterial({ map: cometTexture }); // Use comet texture
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

        asteroid.position.set(
          (Math.random() - 0.5) * 500,
          (Math.random() - 0.5) * 500,
          (Math.random() - 0.5) * 500
        );

        asteroid.name = neo.name;

        // Add impact probability to the NEO object
        asteroid.impactProbability = neo.impact_probability; // Assuming the API returns this data
        asteroid.distance = neo.close_approach_data[0]?.miss_distance.kilometers; // Get distance from the first close approach
        scene.add(asteroid);
      });
    }// Create NEO
const neoGeometry = new THREE.SphereGeometry(1, 16, 16);
const neoMaterial = new THREE.MeshBasicMaterial({ map: cometTexture }); // Example using the comet texture
const neo = new THREE.Mesh(neoGeometry, neoMaterial);
neo.name = `NEO-${neo.name}`; // Naming convention for NEOs
scene.add(neo);


    // Hide loading effect after data is fetched
    loadingDiv.style.display = 'none';
  } catch (error) {
    console.error('Error fetching asteroids:', error);
    loadingDiv.style.display = 'none';
  }
}

// Animate function to render the scene and update planet positions
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Seconds since the last call
  planetMeshes.forEach(({ mesh, speed, angle }) => {
    angle += speed * delta; // Update angle based on speed and time
    mesh.position.x = Math.cos(angle) * mesh.distance; // Update x position
    mesh.position.z = Math.sin(angle) * mesh.distance; // Update z position
    mesh.rotation.y += 0.01; // Rotate the planet for better visualization
  });

  // Update moon's position if added
  if (planetMeshes.some(p => p.mesh.name === "Moon")) {
    const earthMesh = planetMeshes.find(planet => planet.mesh.name === "Earth").mesh;
    const moon = planetMeshes.find(p => p.mesh.name === "Moon");
    moon.angle += moon.speed * delta;
    moon.mesh.position.x = earthMesh.position.x + Math.cos(moon.angle) * moon.distance;
    moon.mesh.position.z = earthMesh.position.z + Math.sin(moon.angle) * moon.distance;
  }

  controls.update(); // Update controls
  renderer.render(scene, camera);
}
init();
