import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#city");
const citySection = document.querySelector("#city-section");
const labelLayer = document.querySelector("#labels");
const homeSection = document.querySelector("#home");
const anime = window.anime;
const transitionWipe = document.querySelector(".transition-wipe");
const TRANSICION_HOME_CIUDAD = {
  name: "TRANSICION_HOME_CIUDAD",
  description: "Organic curved white/yellow/black wipe used to move from the home hero into another Nike City screen."
};
const USE_BLENDER_PLAZA_CENTRAL = true;
const PLAZA_CENTRAL_GLB = "assets/zona_plaza_central_ultra_blender.glb";

const COLORS = {
  yellow: 0xf7bd00,
  black: 0x111111,
  road: 0x26282a,
  white: 0xf5f3ed,
  side: 0xdedbd3,
  grey: 0x9c9a95,
  glass: 0x1f3138
};

const renderer = canvas ? new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }) : null;
if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f6f1);

const camera = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 100);
camera.position.set(10.8, 12.8, 11.4);
camera.lookAt(0, 0, 0);

const controls = renderer ? new OrbitControls(camera, renderer.domElement) : null;
if (controls) {
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
}

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
  line: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.78 }),
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

function addLocalBox(group, w, h, d, mat, x, y, z, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.rotation.y = rot;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRing(radius, tube, mat, x, y, z, rot = 0) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 96), mat);
  ring.position.set(x, y, z);
  ring.rotation.set(Math.PI / 2, 0, rot);
  ring.castShadow = true;
  ring.receiveShadow = true;
  scene.add(ring);
  return ring;
}

function addAwning(x, z, rot = 0) {
  const top = cyl(0.23, 0.045, mats.yellow, x, 0.58, z, 18);
  top.scale.z = 0.28;
  top.rotation.y = rot;
  cyl(0.02, 0.38, mats.line, x, 0.25, z, 8);
}

function addTrafficCone(x, z, rot = 0) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 16), mats.white);
  cone.position.set(x, 0.52, z);
  cone.rotation.y = rot;
  cone.castShadow = true;
  scene.add(cone);
  box(0.18, 0.045, 0.18, mats.yellow, x, 0.27, z, rot);
}

function signPost(x, z, rot = 0, kind = "arrow") {
  cyl(0.02, 0.72, mats.line, x, 0.25, z, 8);
  const sign = box(kind === "arrow" ? 0.42 : 0.24, 0.18, 0.035, mats.yellow, x, 0.91, z, rot);
  sign.castShadow = true;
  if (kind === "arrow") {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 3), mats.yellow);
    tip.position.set(x + Math.cos(rot) * 0.28, 1.0, z - Math.sin(rot) * 0.28);
    tip.rotation.set(0, rot - Math.PI / 2, Math.PI / 2);
    tip.castShadow = true;
    scene.add(tip);
  }
}

function fountain(x, z) {
  cyl(0.34, 0.09, mats.white, x, 0.25, z, 36);
  cyl(0.22, 0.06, mats.line, x, 0.35, z, 36);
  cyl(0.08, 0.16, mats.yellow, x, 0.42, z, 24);
  addRing(0.22, 0.012, mats.yellow, x, 0.51, z);
}

function centralPlaza(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  scene.add(group);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.62, 96), mats.white);
  base.position.y = 0.31;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.26, 96, 1, true), mats.line);
  belt.position.y = 0.48;
  belt.castShadow = true;
  group.add(belt);

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.045), i % 3 === 0 ? mats.yellow : mats.glass);
    panel.position.set(Math.cos(angle) * 1.215, 0.42, Math.sin(angle) * 1.215);
    panel.rotation.y = -angle;
    panel.castShadow = true;
    group.add(panel);
  }

  const capYellow = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.09, 96), mats.yellow);
  capYellow.position.y = 0.68;
  capYellow.castShadow = true;
  group.add(capYellow);

  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.12, 96), mats.black);
  roof.position.y = 0.77;
  roof.castShadow = true;
  group.add(roof);

  addSwoosh(x, 1.08, z, 0.68);
  addRing(1.42, 0.012, mats.side, x, 0.29, z);
  addRing(1.62, 0.01, mats.side, x, 0.3, z);

  const entrance = addLocalBox(group, 0.42, 0.48, 0.16, mats.yellow, 0, 0.02, 1.17);
  entrance.castShadow = true;
  addLocalBox(group, 0.28, 0.36, 0.18, mats.glass, 0, 0.06, 1.22);

  return group;
}

function loadBlenderCentralPlaza(x, z) {
  const loader = new GLTFLoader();
  loader.load(
    PLAZA_CENTRAL_GLB,
    (gltf) => {
      const plaza = gltf.scene;
      plaza.name = "zona_plaza_central";
      plaza.position.set(x, 0.25, z);
      plaza.rotation.y = 0;
      plaza.scale.setScalar(1);
      plaza.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });
      scene.add(plaza);
    },
    undefined,
    () => {
      buildProceduralCentralPlaza(x, z);
    }
  );
}

function buildProceduralCentralPlaza(x, z) {
  platform(x, z, 3.9, 3.1);
  centralPlaza(x, z);
  fountain(x, z + 1.58);
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const angle = (i / 6) * Math.PI * 2 + 0.35;
    addAwning(x + Math.cos(angle) * 1.82, z + Math.sin(angle) * 1.28, angle);
  });
  [[-1.68, -1.1, 0.2], [1.66, -1.0, -0.2], [-1.78, 0.88, 0], [1.78, 0.88, 0]].forEach(([dx, dz, r]) => {
    addTrafficCone(x + dx, z + dz, r);
  });
  signPost(x - 2.05, z + 0.58, 0, "arrow");
  signPost(x + 2.04, z - 0.3, Math.PI, "arrow");
  decoratePlatform(x, z, 3.65, 2.8);
}

function metroStation(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  group.scale.setScalar(1.18);
  scene.add(group);

  addLocalBox(group, 1.08, 0.18, 0.95, mats.white, 0, 0, 0.08);
  addLocalBox(group, 0.92, 0.08, 0.8, mats.yellow, 0, 0.18, 0.08);
  addLocalBox(group, 0.72, 0.07, 0.52, mats.road, 0, 0.27, 0.1);

  addLocalBox(group, 0.3, 1.1, 0.18, mats.white, -0.36, 0.08, -0.12);
  addLocalBox(group, 0.3, 1.1, 0.18, mats.white, 0.36, 0.08, -0.12);
  addLocalBox(group, 1.02, 0.34, 0.18, mats.white, 0, 0.95, -0.12);
  addLocalBox(group, 0.72, 0.18, 0.2, mats.yellow, 0, 0.87, -0.1);
  addLocalBox(group, 0.52, 0.64, 0.22, mats.black, 0, 0.2, -0.08);
  addLocalBox(group, 0.34, 0.52, 0.24, mats.yellow, 0, 0.24, -0.05);
  addLocalBox(group, 0.22, 0.42, 0.26, mats.glass, 0, 0.3, -0.03);

  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.08, 12, 32, Math.PI), mats.white);
  arch.position.set(0, 1.08, -0.19);
  arch.rotation.set(0, 0, Math.PI);
  arch.castShadow = true;
  group.add(arch);

  const yellowArch = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.055, 12, 32, Math.PI), mats.yellow);
  yellowArch.position.set(0, 0.92, -0.205);
  yellowArch.rotation.set(0, 0, Math.PI);
  yellowArch.castShadow = true;
  group.add(yellowArch);

  const sign = addLocalBox(group, 0.5, 0.3, 0.04, mats.white, 0, 1.38, -0.2);
  sign.castShadow = true;

  const mMark = document.createElement("canvas");
  mMark.width = 128;
  mMark.height = 128;
  const ctx = mMark.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#111111";
  ctx.font = "900 74px Inter, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", 64, 66);
  const texture = new THREE.CanvasTexture(mMark);
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.3),
    new THREE.MeshBasicMaterial({ map: texture, transparent: false })
  );
  mark.position.set(0, 1.56, -0.226);
  group.add(mark);

  addLocalBox(group, 0.18, 0.06, 0.42, mats.yellow, -0.56, 0.06, 0.25);
  addLocalBox(group, 0.18, 0.06, 0.42, mats.yellow, 0.56, 0.06, 0.25);
  addLocalBox(group, 0.06, 0.2, 0.06, mats.grey, -0.72, 0.16, 0.48);
  addLocalBox(group, 0.06, 0.2, 0.06, mats.grey, 0.72, 0.16, 0.48);

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
  if (!citySection) return;
  const rect = citySection.getBoundingClientRect();
  labels.forEach((label) => {
    const p = label.world.clone().project(camera);
    const rawX = (p.x * 0.5 + 0.5) * rect.width;
    const rawY = (-p.y * 0.5 + 0.5) * rect.height;
    const x = THREE.MathUtils.clamp(rawX, 78, rect.width - 230);
    const y = THREE.MathUtils.clamp(rawY, 108, rect.height - 185);
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

  const zone = {
    soccer: { x: -2.8, z: -5.1 },
    basketball: { x: 5.8, z: -3.0 },
    running: { x: -7.1, z: -1.15 },
    central: { x: 0.25, z: 0.85 },
    juvenil: { x: -7.0, z: 4.05 },
    casual: { x: 6.35, z: 3.8 },
    skate: { x: -6.25, z: 7.55 },
    metro: { x: 0.95, z: 7.95 },
    parking: { x: 5.65, z: 7.65 }
  };

  addRoad(0.6, -2.4, 12.4, 1.62, -0.32);
  addRoad(0.25, 1.25, 13.2, 1.9, 0);
  addRoad(0.05, 5.4, 14.1, 1.72, 0);
  addRoad(-2.15, 2.8, 11.6, 1.68, 0.78);
  addRoad(2.35, 2.75, 11.3, 1.68, -0.78);
  addRoad(-0.5, 1.1, 1.78, 13.2, 0);
  addRoad(5.05, 2.55, 1.55, 8.6, 0);
  addRoad(-4.05, 2.15, 1.55, 8.0, 0);

  [[-0.5, -0.65, 0], [-0.5, 2.95, 0], [-0.5, 6.25, 0],
    [-2.05, 1.25, Math.PI / 2], [2.0, 1.25, Math.PI / 2],
    [5.05, 4.0, 0], [-4.05, 4.0, 0], [3.35, -2.95, Math.PI / 2]]
    .forEach(([x, z, r]) => addCrosswalk(x, z, r));

  platform(zone.running.x, zone.running.z, 4.3, 3.05);
  runningTrack(zone.running.x, zone.running.z);
  nikeStore(zone.running.x, zone.running.z + 0.08, 1.45, 0.95, 0.75, 0.05, "black");
  decoratePlatform(zone.running.x, zone.running.z, 4.3, 3.05);

  platform(zone.soccer.x, zone.soccer.z, 4.9, 3.25);
  nikeStore(zone.soccer.x, zone.soccer.z, 3.15, 2.02, 0.92, 0, "flat");
  court(zone.soccer.x, zone.soccer.z + 0.03, 2.42, 1.44, "soccer");
  decoratePlatform(zone.soccer.x, zone.soccer.z, 4.9, 3.25);

  platform(zone.basketball.x, zone.basketball.z, 3.75, 2.55);
  nikeStore(zone.basketball.x, zone.basketball.z, 2.35, 1.45, 0.72);
  court(zone.basketball.x, zone.basketball.z, 2.0, 1.16, "basketball");
  decoratePlatform(zone.basketball.x, zone.basketball.z, 3.75, 2.55);

  platform(zone.juvenil.x, zone.juvenil.z, 4.25, 3.08);
  nikeStore(zone.juvenil.x - 1.15, zone.juvenil.z - 0.3, 1.15, 0.9, 0.72, 0.05, "black");
  nikeStore(zone.juvenil.x + 0.2, zone.juvenil.z + 0.25, 1.0, 0.85, 0.72, 0.05, "black");
  nikeStore(zone.juvenil.x + 1.25, zone.juvenil.z - 0.22, 0.9, 0.8, 0.58, 0.05, "black");
  cyl(0.62, 0.64, mats.white, zone.juvenil.x + 0.25, 0.25, zone.juvenil.z - 1.05);
  cyl(0.46, 0.08, mats.yellow, zone.juvenil.x + 0.25, 0.94, zone.juvenil.z - 1.05);
  decoratePlatform(zone.juvenil.x, zone.juvenil.z, 4.25, 3.08);

  if (USE_BLENDER_PLAZA_CENTRAL) {
    loadBlenderCentralPlaza(zone.central.x, zone.central.z);
  } else {
    buildProceduralCentralPlaza(zone.central.x, zone.central.z);
  }

  platform(zone.casual.x, zone.casual.z, 3.55, 2.38);
  nikeStore(zone.casual.x, zone.casual.z, 2.35, 1.3, 0.72, 0.03, "black");
  box(0.78, 0.12, 0.35, mats.black, zone.casual.x, 1.02, zone.casual.z);
  decoratePlatform(zone.casual.x, zone.casual.z, 3.55, 2.38);

  platform(zone.skate.x, zone.skate.z, 4.15, 2.25);
  box(1.8, 0.2, 1.15, mats.white, zone.skate.x, 0.27, zone.skate.z);
  box(1.35, 0.08, 0.72, mats.yellow, zone.skate.x, 0.5, zone.skate.z);
  box(1.0, 0.06, 0.48, mats.road, zone.skate.x, 0.61, zone.skate.z);
  decoratePlatform(zone.skate.x, zone.skate.z, 4.15, 2.25);

  platform(zone.metro.x, zone.metro.z, 2.95, 2.12);
  metroStation(zone.metro.x, zone.metro.z - 0.12);
  tree(zone.metro.x - 0.9, zone.metro.z + 0.54, true);
  tree(zone.metro.x + 0.82, zone.metro.z + 0.48, true);
  lamp(zone.metro.x - 0.72, zone.metro.z - 0.68);
  lamp(zone.metro.x + 0.7, zone.metro.z - 0.66);
  bench(zone.metro.x + 0.56, zone.metro.z + 0.68, -0.25);

  platform(zone.parking.x, zone.parking.z, 3.55, 2.45);
  nikeStore(zone.parking.x, zone.parking.z, 2.35, 1.25, 0.74, 0, "black");
  box(1.4, 0.08, 0.58, mats.yellow, zone.parking.x, 1.02, zone.parking.z);
  decoratePlatform(zone.parking.x, zone.parking.z, 3.55, 2.45);

  [[-1.8, 3.8, -0.3], [2.8, -1.2, 0.15], [5.1, 4.4, -0.2], [-3.2, -1.0, -0.4]].forEach(([x, z, r]) => car(x, z, r));

  const zones = [
    { id: "soccer", name: "Zona Soccer", coords: "[I2 - L4]", icon: "●", x: zone.soccer.x - 0.35, y: 2.08, z: zone.soccer.z + 1.52, stem: 96 },
    { id: "basketball", name: "Zona Basketball", coords: "[L3 - O6]", icon: "◉", x: zone.basketball.x + 1.3, y: 1.78, z: zone.basketball.z + 0.72, stem: 76 },
    { id: "running", name: "Zona Running", coords: "[B2 - E5]", icon: "⌁", x: zone.running.x - 1.25, y: 1.95, z: zone.running.z + 1.1, stem: 86 },
    { id: "casual", name: "Zona Casual", coords: "[L8 - O11]", icon: "◒", x: zone.casual.x + 1.25, y: 1.65, z: zone.casual.z + 0.78, stem: 70 },
    { id: "central", name: "Plaza Central", coords: "[F7 - J10]", icon: "▣", x: zone.central.x - 0.55, y: 1.72, z: zone.central.z + 0.25, stem: 72 },
    { id: "juvenil", name: "Zona Juvenil", coords: "[B7 - E10]", icon: "☺", x: zone.juvenil.x - 1.65, y: 1.75, z: zone.juvenil.z + 1.05, stem: 72 },
    { id: "skate", name: "Skate Park", coords: "[B12 - E14]", icon: "◆", x: zone.skate.x - 1.2, y: 1.52, z: zone.skate.z + 0.78, stem: 66 },
    { id: "metro", name: "Estación Metro", coords: "[H12 - J14]", icon: "M", x: zone.metro.x - 0.48, y: 1.78, z: zone.metro.z + 0.42, stem: 52 },
    { id: "parking", name: "Estacionamiento", coords: "[L12 - O14]", icon: "P", x: zone.parking.x + 1.2, y: 1.5, z: zone.parking.z + 0.82, stem: 62 }
  ];
  zones.forEach(pinLabel);
}

function resize() {
  if (!renderer || !citySection) return;
  const rect = citySection.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  const frustum = w < 1050 ? 12 : 8.0;
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
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, true);
  if (hits[0]?.object?.userData?.zone) setActive(hits[0].object.userData.zone);
}

if (canvas) {
  buildCity();
  resize();
  window.addEventListener("resize", resize);
  canvas.addEventListener("click", pick);
}

function bootHomeAnimations() {
  if (!anime) return;

  anime.timeline({ easing: "easeOutExpo" })
    .add({
      targets: ".top-nav > *",
      translateY: [-28, 0],
      opacity: [0, 1],
      delay: anime.stagger(90),
      duration: 900
    })
    .add({
      targets: ".hero-copy h1 span",
      translateY: [80, 0],
      opacity: [0, 1],
      delay: anime.stagger(110),
      duration: 900
    }, "-=520")
    .add({
      targets: [".hero-dots span", ".hero-copy p", ".hero-ctas .cta"],
      translateY: [24, 0],
      opacity: [0, 1],
      delay: anime.stagger(80),
      duration: 720
    }, "-=480")
    .add({
      targets: ".hero-visual",
      translateX: [80, 0],
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 1000
    }, "-=760")
    .add({
      targets: [".bottom-menu", ".movement-card"],
      translateY: [28, 0],
      opacity: [0, 1],
      delay: anime.stagger(90),
      duration: 800
    }, "-=620");

  anime({
    targets: ".floating-shoe",
    translateY: [-10, 14],
    rotate: ["-23deg", "-19deg"],
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
    duration: 2200
  });

  anime({
    targets: ".cloud-a",
    translateX: [-18, 22],
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
    duration: 5200
  });

  anime({
    targets: ".cloud-b",
    translateX: [18, -22],
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
    duration: 5900
  });

  anime({
    targets: ".person",
    translateY: [0, -9],
    delay: anime.stagger(260),
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
    duration: 900
  });

  anime({
    targets: ".spark",
    scale: [0.6, 1.25],
    opacity: [0.4, 1],
    rotate: [0, 90],
    delay: anime.stagger(320),
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
    duration: 1100
  });

  anime({
    targets: ".plane-a",
    translateX: ["0vw", "105vw"],
    translateY: [0, 46],
    loop: true,
    easing: "linear",
    duration: 12000
  });

}

function bootIntroCards() {
  const gate = document.querySelector(".cards-gate");
  if (!gate || !anime) return;

  const cards = [...gate.querySelectorAll(".intro-card")];
  const nextButton = gate.querySelector(".intro-next");
  const skipButton = gate.querySelector(".skip-cards");
  let front = 0;
  let busy = false;

  const setStack = () => {
    cards.forEach((card, index) => {
      card.classList.remove("is-front", "is-middle", "is-back");
      const offset = (index - front + cards.length) % cards.length;
      if (offset === 0) card.classList.add("is-front");
      if (offset === 1) card.classList.add("is-middle");
      if (offset === 2) card.classList.add("is-back");
      card.style.zIndex = offset === 0 ? 4 : offset === 1 ? 3 : 2;
    });
  };

  const showGate = () => {
    document.body.classList.add("cards-locked");
    gate.classList.add("is-visible");
    setStack();
    anime({
      targets: gate,
      opacity: [0, 1],
      duration: 520,
      easing: "easeOutQuad"
    });
    anime({
      targets: ".intro-card-stack",
      translateY: [38, 0],
      scale: [0.96, 1],
      opacity: [0, 1],
      duration: 760,
      easing: "easeOutExpo"
    });
  };

  const closeGate = () => {
    anime({
      targets: gate,
      opacity: [1, 0],
      duration: 420,
      easing: "easeInOutQuad",
      complete: () => {
        gate.classList.remove("is-visible");
        document.body.classList.remove("cards-locked");
      }
    });
  };

  const nextCard = () => {
    if (busy) return;
    busy = true;

    const next = cards[(front + 1) % cards.length];
    const current = cards[front];
    next.style.zIndex = 3;
    const liftDistance = -(next.getBoundingClientRect().height + 42);

    anime.remove([next, current]);
    anime.set(next, {
      translateY: -24,
      translateZ: -48,
      rotate: 0,
      scale: 0.965,
      opacity: 1
    });
    anime.set(current, {
      translateY: 0,
      translateZ: 0,
      rotate: 0,
      scale: 1,
      opacity: 1
    });

    anime.timeline({
      complete: () => {
        front = (front + 1) % cards.length;
        cards.forEach((card) => {
          card.style.transform = "";
          card.style.opacity = "";
        });
        setStack();
        busy = false;
      }
    })
      .add({
        targets: next,
        translateY: liftDistance,
        duration: 520,
        easing: "easeInOutCubic"
      })
      .add({
        targets: next,
        duration: 110,
        begin: () => {
          next.style.zIndex = 5;
        }
      })
      .add({
        targets: next,
        translateY: 0,
        translateZ: 0,
        scale: 1,
        duration: 560,
        easing: "easeOutExpo"
      });
  };

  nextButton?.addEventListener("click", nextCard);
  skipButton?.addEventListener("click", closeGate);
  window.setTimeout(showGate, 1850);
}

document.querySelectorAll(".cta, .bottom-menu a, .menu-toggle, .sound-toggle").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    if (!anime) return;
    anime.remove(el);
    anime({ targets: el, scale: 1.06, duration: 220, easing: "easeOutQuad" });
  });
  el.addEventListener("mouseleave", () => {
    if (!anime) return;
    anime.remove(el);
    anime({ targets: el, scale: 1, duration: 260, easing: "easeOutQuad" });
  });
});

function resetTransition() {
  transitionWipe.style.opacity = 0;
  anime.set(".wipe-panel", { translateX: "-190%", translateY: "-50%", scale: 1, rotate: 0 });
  anime.set(".wipe-final", { translateX: "-215%", translateY: "-50%", scale: 1.04, rotate: 0 });
  anime.set(".wipe-cover", { opacity: 0 });
}

function playPageEnter() {
  sessionStorage.removeItem("nikeCityPageTransition");
  if (anime && transitionWipe) resetTransition();
}

function organicPageTransition(url) {
  if (!url) return;

  if (!anime) {
    window.location.href = url;
    return;
  }

  anime.remove(".transition-wipe, .transition-wipe span, .transition-wipe i");
  transitionWipe.style.opacity = 1;
  anime.set(".wipe-panel", { translateX: "-190%", translateY: "-50%", scale: 1, rotate: 0 });
  anime.set(".wipe-final", { translateX: "-215%", translateY: "-50%", scale: 1.04, rotate: 0 });
  anime.set(".wipe-cover", { opacity: 0 });

  anime.timeline({
    easing: "easeInOutSine",
    complete: () => {
      window.location.href = url;
    }
  })
    .add({
      targets: ".wipe-white",
      translateX: ["-190%", "-26%"],
      scale: [1.08, 1.02],
      rotate: [-5, 2],
      duration: 900
    })
    .add({
      targets: ".wipe-yellow",
      translateX: ["-190%", "-7%"],
      scale: [1.11, 1.02],
      rotate: [6, -2],
      duration: 980
    }, "-=760")
    .add({
      targets: ".wipe-black",
      translateX: ["-190%", "14%"],
      scale: [1.12, 1.03],
      rotate: [-7, 3],
      duration: 1060
    }, "-=800")
    .add({
      targets: ".wipe-final",
      translateX: ["-215%", "-4%"],
      scale: [1.08, 1.04],
      rotate: [4, 0],
      duration: 1080,
      easing: "easeInOutSine"
    }, "-=560")
    .add({
      targets: ".wipe-cover",
      opacity: [0, 1],
      duration: 180,
      easing: "linear"
    }, "-=120")
    .add({
      targets: ".wipe-final",
      translateX: ["-4%", "-4%"],
      duration: 180
    });
}

function pageTransition(url) {
  if (!url) return;

  if (!anime) {
    document.body.style.opacity = 0;
    window.setTimeout(() => {
      window.location.href = url;
    }, 260);
    return;
  }

  anime.remove(document.body);
  anime({
    targets: document.body,
    opacity: [1, 0],
    duration: 360,
    easing: "easeInOutQuad",
    complete: () => {
      window.location.href = url;
    }
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-page-transition]");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  const targetUrl = new URL(href, window.location.href);
  if (targetUrl.href === window.location.href) return;

  event.preventDefault();
  pageTransition(targetUrl.href);
}, true);

homeSection?.addEventListener("wheel", (event) => {
  if (!location.hash || location.hash === "#home") event.preventDefault();
}, { passive: false });

bootHomeAnimations();
bootIntroCards();
playPageEnter();

function animate(t) {
  if (!renderer || !controls) return;
  controls.update();
  scene.traverse((obj) => {
    if (obj.userData.float) obj.position.y += Math.sin(t * 0.002 + obj.userData.float) * 0.001;
  });
  projectLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
