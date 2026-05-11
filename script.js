import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#city");
const labelLayer = document.querySelector("#labels");

const COLORS = {
  yellow: 0xf7bd00,
  black: 0x111111,
  road: 0x26282a,
  white: 0xf5f3ed,
  side: 0xdedbd3,
  grey: 0x9c9a95,
  glass: 0x1f3138
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f6f1);

const camera = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 100);
camera.position.set(10.8, 12.8, 11.4);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enableRotate = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.rotateSpeed = 0.55;
controls.panSpeed = 0.75;
controls.zoomSpeed = 0.8;
controls.minZoom = 0.62;
controls.maxZoom = 2.1;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.46;
controls.target.set(0, 0.25, 0);
controls.update();

const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d1c4, 2.4);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 3.1);
sun.position.set(8, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
scene.add(sun);

const mats = {
  platform: new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.72 }),
  side: new THREE.MeshStandardMaterial({ color: COLORS.side, roughness: 0.85 }),
  road: new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 0.7 }),
  black: new THREE.MeshStandardMaterial({ color: COLORS.black, roughness: 0.65 }),
  yellow: new THREE.MeshStandardMaterial({ color: COLORS.yellow, roughness: 0.45 }),
  white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
  grey: new THREE.MeshStandardMaterial({ color: COLORS.grey, roughness: 0.75 }),
  glass: new THREE.MeshStandardMaterial({ color: COLORS.glass, roughness: 0.38, metalness: 0.1 }),
  grass: new THREE.MeshStandardMaterial({ color: 0xe7e4db, roughness: 0.85 })
};

const clickables = [];
const labels = [];

function roundedShape(w, h, r) {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function platform(x, z, w, d, rot = 0) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, d, 0.35), {
    depth: 0.22,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 4
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, [mats.platform, mats.side]);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = rot;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

function box(w, h, d, mat, x, y, z, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.rotation.y = rot;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function cyl(r, h, mat, x, y, z, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addRoad(x, z, w, d, rot = 0) {
  const mesh = box(w, 0.035, d, mats.road, x, 0.23, z, rot);
  mesh.receiveShadow = true;
  addLaneLines(x, z, w, d, rot);
  return mesh;
}

function addLaneLines(x, z, w, d, rot) {
  const count = Math.max(3, Math.floor(Math.max(w, d) / 0.9));
  for (let i = 0; i < count; i++) {
    const offset = -Math.max(w, d) / 2 + 0.45 + i * 0.9;
    const long = w > d;
    const stripe = box(long ? 0.35 : 0.045, 0.012, long ? 0.035 : 0.35, mats.white, x, 0.27, z, rot);
    const local = new THREE.Vector3(long ? offset : 0, 0, long ? 0 : offset);
    local.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    stripe.position.x += local.x;
    stripe.position.z += local.z;
  }
}

function addCrosswalk(x, z, rot = 0) {
  for (let i = -2; i <= 2; i++) {
    const stripe = box(0.08, 0.018, 0.86, mats.white, x + i * 0.22, 0.29, z, rot);
    stripe.rotation.y = rot;
  }
}

function addSwoosh(x, y, z, s = 1, rot = 0) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.55 * s, 0);
  shape.quadraticCurveTo(-0.1 * s, -0.3 * s, 0.75 * s, 0.18 * s);
  shape.quadraticCurveTo(0.02 * s, 0.02 * s, -0.5 * s, 0.17 * s);
  shape.quadraticCurveTo(-0.7 * s, 0.18 * s, -0.55 * s, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geo, mats.white);
  mesh.rotation.x = -Math.PI / 2;
  group.add(mesh);
  group.position.set(x, y, z);
  group.rotation.y = rot;
  scene.add(group);
  return group;
}

function nikeStore(x, z, w, d, h, rot = 0, roof = "flat") {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  group.rotation.y = rot;
  scene.add(group);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.white);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const front = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, h * 0.55, 0.08), mats.black);
  front.position.set(0, h * 0.43, d / 2 + 0.045);
  group.add(front);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.12, 0.1), mats.yellow);
  stripe.position.set(0, h * 0.18, d / 2 + 0.09);
  group.add(stripe);

  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, h * 0.5, 0.11), mats.glass);
  door.position.set(-w * 0.25, h * 0.33, d / 2 + 0.12);
  group.add(door);

  if (roof === "black") {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.08, d * 0.72), mats.black);
    cap.position.y = h + 0.06;
    group.add(cap);
    addSwoosh(x, 0.25 + h + 0.12, z, 0.42, rot);
  }

  return group;
}

function court(x, z, w, d, type = "soccer", rot = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.27, z);
  group.rotation.y = rot;
  scene.add(group);
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mats.black);
  base.position.y = 0.03;
  base.receiveShadow = true;
  group.add(base);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lines = [
    [w * 0.86, 0.02, 0.035, 0, d * 0.38],
    [w * 0.86, 0.02, 0.035, 0, -d * 0.38],
    [0.035, 0.02, d * 0.76, w * 0.43, 0],
    [0.035, 0.02, d * 0.76, -w * 0.43, 0],
    [0.035, 0.02, d * 0.76, 0, 0]
  ];
  lines.forEach(([lw, lh, ld, lx, lz]) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, ld), lineMat);
    l.position.set(lx, 0.065, lz);
    group.add(l);
  });
  if (type === "soccer") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 8, 36), lineMat);
    ring.position.y = 0.08;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  } else {
    const hoop = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.05), mats.yellow);
    hoop.position.set(0, 0.11, -d * 0.25);
    group.add(hoop);
  }
}

function runningTrack(x, z) {
  const base = box(2.65, 0.045, 1.65, mats.yellow, x, 0.28, z);
  const inner = box(2.08, 0.055, 1.08, mats.black, x, 0.31, z);
  base.userData.zone = "running";
  inner.userData.zone = "running";
  clickables.push(base, inner);
}

function tree(x, z, yellow = true) {
  cyl(0.045, 0.35, mats.black, x, 0.26, z, 10);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 16), yellow ? mats.yellow : mats.white);
  cone.position.set(x, 0.82, z);
  cone.castShadow = true;
  scene.add(cone);
}

function lamp(x, z) {
  cyl(0.025, 0.48, mats.grey, x, 0.26, z, 10);
  cyl(0.07, 0.08, mats.yellow, x, 0.76, z, 14);
}

function bench(x, z, rot = 0) {
  const seat = box(0.46, 0.08, 0.13, mats.yellow, x, 0.34, z, rot);
  box(0.52, 0.04, 0.05, mats.black, x, 0.46, z - 0.08, rot);
  return seat;
}

function car(x, z, rot = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.34, z);
  group.rotation.y = rot;
  scene.add(group);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.22), mats.yellow);
  body.castShadow = true;
  group.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.2), mats.white);
  top.position.y = 0.13;
  group.add(top);
  return group;
}

function pinLabel(zone) {
  const el = document.createElement("button");
  el.className = "zone-label";
  el.style.setProperty("--stem", `${zone.stem || 82}px`);
  el.innerHTML = `<span class="icon">${zone.icon}</span><span class="copy"><strong>${zone.name}</strong><span>${zone.coords}</span></span>`;
  labelLayer.appendChild(el);
  el.addEventListener("click", () => setActive(zone.id));
  labels.push({ ...zone, element: el, world: new THREE.Vector3(zone.x, zone.y || 1.5, zone.z) });
}

function projectLabels() {
  labels.forEach((label) => {
    const p = label.world.clone().project(camera);
    const rawX = (p.x * 0.5 + 0.5) * window.innerWidth;
    const rawY = (-p.y * 0.5 + 0.5) * window.innerHeight;
    const x = THREE.MathUtils.clamp(rawX, 78, window.innerWidth - 230);
    const y = THREE.MathUtils.clamp(rawY, 108, window.innerHeight - 185);
    label.element.style.left = `${x}px`;
    label.element.style.top = `${y}px`;
  });
}

function setActive(id) {
  labels.forEach((label) => label.element.classList.toggle("is-active", label.id === id));
  clickables.forEach((obj) => {
    obj.material = obj.userData.zone === id ? mats.yellow : obj.userData.originalMaterial || obj.material;
  });
}

function decoratePlatform(x, z, w, d) {
  const points = [
    [-w * 0.36, -d * 0.36], [w * 0.34, -d * 0.34], [-w * 0.38, d * 0.34],
    [w * 0.36, d * 0.36], [0, -d * 0.44], [w * 0.45, 0.02]
  ];
  points.forEach(([px, pz], i) => (i % 2 ? tree(x + px, z + pz, i % 3 !== 0) : lamp(x + px, z + pz)));
  bench(x - w * 0.22, z + d * 0.36, 0.2);
  bench(x + w * 0.25, z - d * 0.36, -0.2);
}

function buildCity() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 42), new THREE.MeshStandardMaterial({
    color: 0xf7f6f1,
    roughness: 0.9
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(44, 44, 0xebd88c, 0xebd88c);
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  grid.position.y = 0.01;
  scene.add(grid);

  addRoad(0, 0, 2.05, 15.8, 0);
  addRoad(0, 0, 16.3, 2.05, 0);
  addRoad(-3.1, 4.4, 2.0, 7.3, Math.PI / 2);
  addRoad(4.6, 4.2, 2.0, 7.8, Math.PI / 2);
  addRoad(-4.2, -4.7, 2.0, 8.3, Math.PI / 2);
  addRoad(4.4, -4.9, 2.0, 8.8, Math.PI / 2);
  addRoad(-2.15, -2.8, 6.2, 1.65, -0.52);
  addRoad(2.3, -2.7, 6.2, 1.65, 0.52);

  [[0, 1.15, 0], [0, -1.15, 0], [-1.15, 0, Math.PI / 2], [1.15, 0, Math.PI / 2],
    [-4.2, 0, Math.PI / 2], [4.2, 0, Math.PI / 2], [0, 4.2, 0], [0, -4.2, 0]]
    .forEach(([x, z, r]) => addCrosswalk(x, z, r));

  platform(-5.8, 3.6, 4.2, 3.0);
  runningTrack(-5.8, 3.6);
  nikeStore(-5.8, 3.6, 1.45, 0.95, 0.75, 0.05, "black");
  decoratePlatform(-5.8, 3.6, 4.2, 3);

  platform(2.6, 5.0, 4.7, 3.2);
  nikeStore(2.6, 5.0, 3.0, 2.05, 0.9, 0, "flat");
  court(2.6, 5.05, 2.3, 1.45, "soccer");
  decoratePlatform(2.6, 5.0, 4.7, 3.2);

  platform(7.0, 2.9, 3.6, 2.55);
  nikeStore(7.0, 2.9, 2.35, 1.45, 0.72);
  court(7.0, 2.9, 2.0, 1.16, "basketball");
  decoratePlatform(7.0, 2.9, 3.6, 2.55);

  platform(-6.0, -1.8, 4.2, 3.0);
  nikeStore(-7.15, -2.1, 1.15, 0.9, 0.72, 0.05, "black");
  nikeStore(-5.8, -1.55, 1.0, 0.85, 0.72, 0.05, "black");
  nikeStore(-4.75, -2.0, 0.9, 0.8, 0.58, 0.05, "black");
  cyl(0.62, 0.64, mats.white, -5.75, 0.25, -2.85);
  cyl(0.46, 0.08, mats.yellow, -5.75, 0.94, -2.85);
  decoratePlatform(-6.0, -1.8, 4.2, 3.0);

  platform(0.5, -1.3, 3.6, 2.75);
  cyl(1.1, 0.62, mats.white, 0.5, 0.25, -1.3);
  cyl(0.92, 0.15, mats.black, 0.5, 0.9, -1.3);
  addSwoosh(0.5, 1.0, -1.3, 0.65);
  decoratePlatform(0.5, -1.3, 3.6, 2.75);

  platform(6.3, -1.9, 3.5, 2.4);
  nikeStore(6.3, -1.9, 2.35, 1.3, 0.72, 0.03, "black");
  box(0.78, 0.12, 0.35, mats.black, 6.3, 1.02, -1.9);
  decoratePlatform(6.3, -1.9, 3.5, 2.4);

  platform(-5.8, -5.7, 4.15, 2.25);
  box(1.8, 0.2, 1.15, mats.white, -5.8, 0.27, -5.7);
  box(1.35, 0.08, 0.72, mats.yellow, -5.8, 0.5, -5.7);
  box(1.0, 0.06, 0.48, mats.road, -5.8, 0.61, -5.7);
  decoratePlatform(-5.8, -5.7, 4.15, 2.25);

  platform(0.1, -6.2, 2.6, 1.8);
  nikeStore(0.1, -6.2, 0.92, 0.78, 1.02);
  box(0.55, 0.82, 0.35, mats.white, 0.1, 1.25, -6.2);
  decoratePlatform(0.1, -6.2, 2.6, 1.8);

  platform(5.8, -5.65, 3.55, 2.45);
  nikeStore(5.8, -5.65, 2.35, 1.25, 0.74, 0, "black");
  box(1.4, 0.08, 0.58, mats.yellow, 5.8, 1.02, -5.65);
  decoratePlatform(5.8, -5.65, 3.55, 2.45);

  [[-1.8, -3.8, 0.3], [2.8, 1.2, -0.15], [5.1, -3.4, 0.2]].forEach(([x, z, r]) => car(x, z, r));

  const zones = [
    { id: "running", name: "Zona Running", coords: "[B2 - E5]", icon: "⌁", x: -6.9, y: 2.0, z: 4.1, stem: 86 },
    { id: "soccer", name: "Zona Soccer", coords: "[I2 - L4]", icon: "●", x: 2.35, y: 2.05, z: 6.15, stem: 96 },
    { id: "basketball", name: "Zona Basketball", coords: "[L3 - O6]", icon: "◉", x: 8.2, y: 1.75, z: 3.75, stem: 74 },
    { id: "juvenil", name: "Zona Juvenil", coords: "[B7 - E10]", icon: "☺", x: -7.25, y: 1.75, z: -1.0, stem: 72 },
    { id: "central", name: "Plaza Central", coords: "[F7 - J10]", icon: "▣", x: 0.48, y: 1.7, z: -1.05, stem: 72 },
    { id: "casual", name: "Zona Casual", coords: "[L8 - O11]", icon: "◒", x: 7.35, y: 1.65, z: -1.05, stem: 72 },
    { id: "skate", name: "Skate Park", coords: "[B12 - E14]", icon: "◆", x: -7.15, y: 1.5, z: -5.1, stem: 66 },
    { id: "metro", name: "Estación Metro", coords: "[H12 - J14]", icon: "M", x: 0.0, y: 1.78, z: -5.88, stem: 54 },
    { id: "parking", name: "Estacionamiento", coords: "[L12 - O14]", icon: "P", x: 6.9, y: 1.5, z: -4.95, stem: 62 }
  ];
  zones.forEach(pinLabel);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  const frustum = w < 1050 ? 12 : 7.15;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  projectLabels();
}

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function pick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, true);
  if (hits[0]?.object?.userData?.zone) setActive(hits[0].object.userData.zone);
}

buildCity();
resize();
window.addEventListener("resize", resize);
window.addEventListener("click", pick);

function animate(t) {
  controls.update();
  scene.traverse((obj) => {
    if (obj.userData.float) obj.position.y += Math.sin(t * 0.002 + obj.userData.float) * 0.001;
  });
  projectLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
