import { writeFile } from "node:fs/promises";
import * as THREE from "/private/tmp/node_modules/three/build/three.module.js";
import { GLTFExporter } from "/private/tmp/node_modules/three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const scene = new THREE.Scene();
scene.name = "zona_plaza central";

const mats = {
  base: new THREE.MeshStandardMaterial({ name: "warm white base", color: 0xf7f5ef, roughness: 0.74 }),
  side: new THREE.MeshStandardMaterial({ name: "soft grey bevels", color: 0xdedbd3, roughness: 0.86 }),
  road: new THREE.MeshStandardMaterial({ name: "matte black road", color: 0x26282a, roughness: 0.72 }),
  black: new THREE.MeshStandardMaterial({ name: "deep black", color: 0x101010, roughness: 0.68 }),
  yellow: new THREE.MeshStandardMaterial({ name: "signature yellow", color: 0xf7bd00, roughness: 0.48 }),
  white: new THREE.MeshStandardMaterial({ name: "clean white", color: 0xffffff, roughness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ name: "dark glass", color: 0x18262b, roughness: 0.34, metalness: 0.08 }),
  grey: new THREE.MeshStandardMaterial({ name: "street grey", color: 0x9c9a95, roughness: 0.8 }),
  line: new THREE.MeshStandardMaterial({ name: "painted line", color: 0xffffff, roughness: 0.65 })
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

function mesh(geometry, material, name = "") {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function box(w, h, d, mat, x, y, z, rot = 0, name = "") {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, name);
  m.position.set(x, y + h / 2, z);
  m.rotation.y = rot;
  return m;
}

function cyl(r, h, mat, x, y, z, segments = 64, name = "") {
  const m = mesh(new THREE.CylinderGeometry(r, r, h, segments), mat, name);
  m.position.set(x, y + h / 2, z);
  return m;
}

function cone(r, h, mat, x, y, z, segments = 32, name = "") {
  const m = mesh(new THREE.ConeGeometry(r, h, segments), mat, name);
  m.position.set(x, y + h / 2, z);
  return m;
}

function torus(r, tube, mat, x, y, z, name = "") {
  const m = mesh(new THREE.TorusGeometry(r, tube, 16, 120), mat, name);
  m.position.set(x, y, z);
  m.rotation.x = Math.PI / 2;
  return m;
}

function platform(w, d) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, d, 0.55), {
    depth: 0.28,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 5
  });
  geo.rotateX(-Math.PI / 2);
  const p = mesh(geo, [mats.base, mats.side], "large rounded plaza base");
  p.position.y = 0;
  return p;
}

function swoosh(x, y, z, s = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.7 * s, -0.03 * s);
  shape.quadraticCurveTo(-0.12 * s, -0.38 * s, 0.95 * s, 0.18 * s);
  shape.quadraticCurveTo(0.08 * s, 0.04 * s, -0.62 * s, 0.22 * s);
  shape.quadraticCurveTo(-0.86 * s, 0.24 * s, -0.7 * s, -0.03 * s);
  const m = mesh(new THREE.ShapeGeometry(shape), mats.white, "white swoosh on dome");
  m.position.set(x, y, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}

function road(x, z, w, d, rot = 0) {
  box(w, 0.045, d, mats.road, x, 0.31, z, rot, "surrounding black road");
  const count = Math.floor(Math.max(w, d) / 0.55);
  for (let i = 0; i < count; i++) {
    const offset = -Math.max(w, d) / 2 + 0.4 + i * 0.7;
    const long = w > d;
    const stripe = box(long ? 0.28 : 0.045, 0.015, long ? 0.035 : 0.28, mats.line, x, 0.36, z, rot, "dashed road paint");
    const v = new THREE.Vector3(long ? offset : 0, 0, long ? 0 : offset);
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    stripe.position.x += v.x;
    stripe.position.z += v.z;
  }
}

function crosswalk(x, z, rot = 0) {
  for (let i = -3; i <= 3; i++) box(0.08, 0.02, 0.76, mats.line, x + i * 0.18, 0.38, z, rot, "zebra crosswalk");
}

function tree(x, z, yellow = true) {
  cyl(0.035, 0.42, mats.black, x, 0.32, z, 10, "tree trunk");
  cone(0.16, 0.42, yellow ? mats.yellow : mats.white, x, 0.74, z, 18, "stylized cone tree lower");
  cone(0.12, 0.34, yellow ? mats.white : mats.yellow, x, 1.02, z, 18, "stylized cone tree top");
}

function lamp(x, z) {
  cyl(0.024, 0.76, mats.grey, x, 0.32, z, 12, "thin street lamp pole");
  cyl(0.075, 0.07, mats.yellow, x, 1.09, z, 18, "yellow street lamp cap");
  cone(0.08, 0.1, mats.white, x, 1.16, z, 18, "white street lamp glow");
}

function bench(x, z, rot = 0) {
  box(0.52, 0.08, 0.14, mats.yellow, x, 0.36, z, rot, "yellow bench seat");
  box(0.58, 0.045, 0.055, mats.black, x, 0.5, z - 0.09, rot, "black bench back");
  box(0.035, 0.16, 0.035, mats.grey, x - 0.2, 0.27, z, rot, "bench leg");
  box(0.035, 0.16, 0.035, mats.grey, x + 0.2, 0.27, z, rot, "bench leg");
}

function umbrella(x, z, rot = 0) {
  cyl(0.018, 0.48, mats.grey, x, 0.32, z, 10, "umbrella pole");
  const top = cone(0.24, 0.18, mats.yellow, x, 0.82, z, 32, "yellow plaza umbrella");
  top.rotation.y = rot;
  for (let i = 0; i < 4; i++) {
    const angle = rot + i * Math.PI / 2;
    const rib = box(0.2, 0.015, 0.018, mats.white, x + Math.cos(angle) * 0.08, 0.91, z + Math.sin(angle) * 0.08, -angle, "umbrella white rib");
    rib.rotation.z = 0.12;
  }
}

function trafficCone(x, z) {
  box(0.18, 0.04, 0.18, mats.yellow, x, 0.32, z, 0, "traffic cone base");
  cone(0.08, 0.26, mats.white, x, 0.36, z, 16, "white traffic cone");
  torus(0.055, 0.008, mats.yellow, x, 0.52, z, "yellow cone stripe");
}

function pinLabel() {
  cyl(0.018, 0.95, mats.black, -1.72, 0.34, 0.35, 10, "label pole");
  cyl(0.24, 0.09, mats.yellow, -1.72, 1.29, 0.35, 32, "label yellow marker");
  box(1.54, 0.34, 0.08, mats.black, -0.9, 1.2, 0.35, 0, "zona_plaza central label plaque");
  box(0.16, 0.2, 0.04, mats.yellow, -1.72, 1.25, 0.28, 0, "label icon");
}

function plazaBuilding() {
  cyl(1.22, 0.62, mats.white, 0, 0.34, 0, 96, "round white plaza body");
  cyl(1.25, 0.22, mats.black, 0, 0.58, 0, 96, "continuous black storefront band");
  cyl(1.27, 0.07, mats.yellow, 0, 0.83, 0, 96, "lower yellow roof ring");

  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const mat = i % 4 === 0 ? mats.yellow : mats.glass;
    const panel = box(0.1, 0.32, 0.045, mat, Math.cos(angle) * 1.29, 0.56, Math.sin(angle) * 1.29, -angle, "segmented plaza facade");
    panel.rotation.y = -angle;
  }

  box(0.46, 0.5, 0.16, mats.yellow, 0, 0.33, 1.22, 0, "yellow front portal");
  box(0.28, 0.38, 0.18, mats.glass, 0, 0.37, 1.27, 0, "dark glass entrance");

  cyl(0.98, 0.12, mats.black, 0, 0.91, 0, 96, "black circular roof lip");
  cyl(0.86, 0.08, mats.yellow, 0, 1.03, 0, 96, "yellow dome under-ring");
  const dome = mesh(new THREE.SphereGeometry(0.78, 96, 24, 0, Math.PI * 2, 0, Math.PI / 2), mats.black, "smooth black roof dome");
  dome.position.set(0, 1.07, 0);
  dome.scale.y = 0.32;
  torus(0.78, 0.018, mats.yellow, 0, 1.08, 0, "thin yellow dome rim");
  swoosh(0, 1.36, 0, 0.55);

  torus(1.52, 0.012, mats.side, 0, 0.34, 0, "outer plaza paving circle");
  torus(1.82, 0.01, mats.side, 0, 0.345, 0, "second plaza paving circle");
}

function build() {
  platform(7.4, 5.6);
  road(0, -2.92, 8.7, 0.72, 0);
  road(0, 2.92, 8.7, 0.72, 0);
  road(-3.92, 0, 0.72, 6.5, 0);
  road(3.92, 0, 0.72, 6.5, 0);
  crosswalk(-2.65, -2.92, Math.PI / 2);
  crosswalk(2.65, 2.92, Math.PI / 2);
  crosswalk(-3.92, 1.6, 0);
  crosswalk(3.92, -1.6, 0);

  plazaBuilding();
  pinLabel();

  [
    [-2.65, -1.65, true], [2.55, -1.55, false], [-2.85, 1.45, false], [2.75, 1.55, true],
    [-1.9, -2.05, true], [1.85, 2.05, true]
  ].forEach(([x, z, yellow]) => tree(x, z, yellow));

  [
    [-2.25, 0.1], [2.25, -0.15], [-0.95, -2.05], [0.95, 2.05], [-3.15, -0.92], [3.15, 0.94]
  ].forEach(([x, z]) => lamp(x, z));

  [
    [-1.75, -1.55, 0.25], [1.75, -1.45, -0.25], [-1.65, 1.45, -0.2], [1.65, 1.48, 0.2]
  ].forEach(([x, z, r]) => bench(x, z, r));

  [
    [-2.05, 1.05, 0.1], [2.05, 1.05, -0.15], [-2.0, -1.05, 0.3], [2.0, -1.05, -0.25]
  ].forEach(([x, z, r]) => umbrella(x, z, r));

  [
    [-1.25, 1.82], [-1.05, 1.74], [1.16, -1.82], [1.36, -1.74], [-2.95, 0.42], [2.96, -0.42]
  ].forEach(([x, z]) => trafficCone(x, z));

  box(0.5, 0.16, 0.25, mats.yellow, -2.45, 0.95, 0.18, -0.35, "tiny yellow car");
  box(0.24, 0.12, 0.22, mats.white, -2.45, 1.09, 0.18, -0.35, "tiny white car roof");
}

build();

const exporter = new GLTFExporter();
const output = await exporter.parseAsync(scene, { binary: true, trs: false, onlyVisible: true });
await writeFile(new URL("../assets/zona_plaza_central.glb", import.meta.url), Buffer.from(output));
