import { writeFile } from "node:fs/promises";
import * as THREE from "/private/tmp/node_modules/three/build/three.module.js";
import { GLTFExporter } from "/private/tmp/node_modules/three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const COLORS = {
  yellow: 0xf7bd00,
  black: 0x111111,
  road: 0x26282a,
  white: 0xf7f6f1,
  side: 0xdedbd3,
  grey: 0x9c9a95,
  glass: 0x1f3138
};

const scene = new THREE.Scene();
scene.name = "Nike City Isometric Web Model";

const mats = {
  platform: new THREE.MeshStandardMaterial({ name: "warm white platform", color: COLORS.white, roughness: 0.72 }),
  side: new THREE.MeshStandardMaterial({ name: "soft bevel side", color: COLORS.side, roughness: 0.85 }),
  road: new THREE.MeshStandardMaterial({ name: "matte black roads", color: COLORS.road, roughness: 0.7 }),
  black: new THREE.MeshStandardMaterial({ name: "nike black", color: COLORS.black, roughness: 0.65 }),
  yellow: new THREE.MeshStandardMaterial({ name: "nike yellow", color: COLORS.yellow, roughness: 0.45 }),
  white: new THREE.MeshStandardMaterial({ name: "pure white", color: 0xffffff, roughness: 0.7 }),
  grey: new THREE.MeshStandardMaterial({ name: "urban grey", color: COLORS.grey, roughness: 0.75 }),
  glass: new THREE.MeshStandardMaterial({ name: "dark storefront glass", color: COLORS.glass, roughness: 0.38, metalness: 0.1 }),
  line: new THREE.MeshStandardMaterial({ name: "ink outlines", color: 0x1a1a1a, roughness: 0.78 })
};

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

function add(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function box(w, h, d, mat, x, y, z, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.rotation.y = rot;
  return add(mesh);
}

function cyl(r, h, mat, x, y, z, segments = 48) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y + h / 2, z);
  return add(mesh);
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
  return add(mesh);
}

function road(x, z, w, d, rot = 0) {
  box(w, 0.035, d, mats.road, x, 0.23, z, rot);
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

function crosswalk(x, z, rot = 0) {
  for (let i = -2; i <= 2; i++) box(0.08, 0.018, 0.86, mats.white, x + i * 0.22, 0.29, z, rot);
}

function swoosh(x, y, z, s = 1, rot = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.55 * s, 0);
  shape.quadraticCurveTo(-0.1 * s, -0.3 * s, 0.75 * s, 0.18 * s);
  shape.quadraticCurveTo(0.02 * s, 0.02 * s, -0.5 * s, 0.17 * s);
  shape.quadraticCurveTo(-0.7 * s, 0.18 * s, -0.55 * s, 0);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.white);
  mesh.position.set(x, y, z);
  mesh.rotation.set(-Math.PI / 2, 0, rot);
  return add(mesh);
}

function store(x, z, w, d, h, rot = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  group.rotation.y = rot;
  scene.add(group);
  const parts = [
    [w, h, d, mats.white, 0, 0, 0],
    [w * 0.92, h * 0.55, 0.08, mats.black, 0, h * 0.17, d / 2 + 0.045],
    [w * 0.96, h * 0.12, 0.1, mats.yellow, 0, h * 0.12, d / 2 + 0.09],
    [w * 0.22, h * 0.5, 0.11, mats.glass, -w * 0.25, h * 0.08, d / 2 + 0.12]
  ];
  parts.forEach(([pw, ph, pd, mat, px, py, pz]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), mat);
    mesh.position.set(px, py + ph / 2, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}

function tree(x, z, yellow = true) {
  cyl(0.045, 0.35, mats.black, x, 0.26, z, 10);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 16), yellow ? mats.yellow : mats.white);
  cone.position.set(x, 0.82, z);
  add(cone);
}

function lamp(x, z) {
  cyl(0.025, 0.48, mats.grey, x, 0.26, z, 10);
  cyl(0.07, 0.08, mats.yellow, x, 0.76, z, 14);
}

function bench(x, z, rot = 0) {
  box(0.46, 0.08, 0.13, mats.yellow, x, 0.34, z, rot);
  box(0.52, 0.04, 0.05, mats.black, x, 0.46, z - 0.08, rot);
}

function awning(x, z, rot = 0) {
  const top = cyl(0.23, 0.045, mats.yellow, x, 0.58, z, 18);
  top.scale.z = 0.28;
  top.rotation.y = rot;
  cyl(0.02, 0.38, mats.line, x, 0.25, z, 8);
}

function cone(x, z, rot = 0) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 16), mats.white);
  c.position.set(x, 0.52, z);
  c.rotation.y = rot;
  add(c);
  box(0.18, 0.045, 0.18, mats.yellow, x, 0.27, z, rot);
}

function fountain(x, z) {
  cyl(0.34, 0.09, mats.white, x, 0.25, z, 36);
  cyl(0.22, 0.06, mats.line, x, 0.35, z, 36);
  cyl(0.08, 0.16, mats.yellow, x, 0.42, z, 24);
}

function centralPlaza(x, z) {
  const base = cyl(1.18, 0.62, mats.white, x, 0.25, z, 96);
  base.name = "Plaza Central circular building";
  cyl(1.21, 0.26, mats.line, x, 0.61, z, 96);
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const panel = box(0.12, 0.34, 0.045, i % 3 === 0 ? mats.yellow : mats.glass, x + Math.cos(angle) * 1.215, 0.58, z + Math.sin(angle) * 1.215);
    panel.rotation.y = -angle;
  }
  cyl(1.0, 0.09, mats.yellow, x, 0.93, z, 96);
  cyl(0.92, 0.12, mats.black, x, 1.02, z, 96);
  swoosh(x, 1.33, z, 0.68);
  box(0.42, 0.48, 0.16, mats.yellow, x, 0.27, z + 1.17);
  box(0.28, 0.36, 0.18, mats.glass, x, 0.31, z + 1.22);
}

function pin(x, z, labelWidth = 0.78) {
  cyl(0.018, 0.82, mats.line, x, 0.25, z, 8);
  cyl(0.18, 0.08, mats.yellow, x, 1.02, z, 24);
  box(labelWidth, 0.24, 0.05, mats.black, x + labelWidth * 0.38, 0.98, z, 0);
}

function decorate(x, z, w, d) {
  [[-0.36, -0.36], [0.34, -0.34], [-0.38, 0.34], [0.36, 0.36], [0, -0.44], [0.45, 0.02]]
    .forEach(([px, pz], i) => (i % 2 ? tree(x + px * w, z + pz * d, i % 3 !== 0) : lamp(x + px * w, z + pz * d)));
  bench(x - w * 0.22, z + d * 0.36, 0.2);
  bench(x + w * 0.25, z - d * 0.36, -0.2);
}

function build() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), mats.platform);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  road(0.6, -2.4, 12.4, 1.62, -0.32);
  road(0.25, 1.25, 13.2, 1.9, 0);
  road(0.05, 5.4, 14.1, 1.72, 0);
  road(-2.15, 2.8, 11.6, 1.68, 0.78);
  road(2.35, 2.75, 11.3, 1.68, -0.78);
  road(-0.5, 1.1, 1.78, 13.2, 0);
  [[-0.5, -0.65, 0], [-0.5, 2.95, 0], [-2.05, 1.25, Math.PI / 2], [2.0, 1.25, Math.PI / 2]].forEach(([x, z, r]) => crosswalk(x, z, r));

  const zones = [
    [-7.1, -1.15, 4.3, 3.05],
    [-2.8, -5.1, 4.9, 3.25],
    [5.8, -3.0, 3.75, 2.55],
    [-7.0, 4.05, 4.25, 3.08],
    [6.35, 3.8, 3.55, 2.38],
    [-6.25, 7.55, 4.15, 2.25],
    [0.95, 7.95, 2.95, 2.12],
    [5.65, 7.65, 3.55, 2.45]
  ];
  zones.forEach(([x, z, w, d], i) => {
    platform(x, z, w, d);
    store(x, z, Math.min(2.35, w * 0.68), Math.min(1.45, d * 0.58), 0.72 + (i % 2) * 0.18);
    decorate(x, z, w, d);
  });

  platform(0.25, 0.85, 3.9, 3.1);
  centralPlaza(0.25, 0.85);
  fountain(0.25, 2.43);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.35;
    awning(0.25 + Math.cos(angle) * 1.82, 0.85 + Math.sin(angle) * 1.28, angle);
  }
  [[-1.68, -1.1, 0.2], [1.66, -1.0, -0.2], [-1.78, 0.88, 0], [1.78, 0.88, 0]].forEach(([dx, dz, r]) => cone(0.25 + dx, 0.85 + dz, r));
  decorate(0.25, 0.85, 3.65, 2.8);

  [[-1.8, 3.8, -0.3], [2.8, -1.2, 0.15], [5.1, 4.4, -0.2], [-3.2, -1.0, -0.4]].forEach(([x, z, r]) => {
    box(0.42, 0.16, 0.22, mats.yellow, x, 0.34, z, r);
    box(0.22, 0.12, 0.2, mats.white, x, 0.47, z, r);
  });

  pin(-0.3, 1.35, 1.08);
  pin(-2.95, -3.58, 0.86);
  pin(6.95, -2.28, 1.0);
}

build();

const exporter = new GLTFExporter();
const output = await exporter.parseAsync(scene, { binary: true, trs: false, onlyVisible: true });
await writeFile(new URL("../assets/nike-city-isometric.glb", import.meta.url), Buffer.from(output));
