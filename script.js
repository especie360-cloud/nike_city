import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { MotionPathPlugin } from "gsap/MotionPathPlugin.js";
import { Draggable } from "gsap/Draggable.js";
import { Flip } from "gsap/Flip.js";
import { TextPlugin } from "gsap/TextPlugin.js";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin.js";

const canvas = document.querySelector("#city");
const citySection = document.querySelector("#city-section");
const labelLayer = document.querySelector("#labels");
const homeSection = document.querySelector("#home");
const anime = window.anime;
const transitionWipe = document.querySelector(".transition-wipe");
const morphTransition = document.querySelector(".morph-transition");
const morphLayers = morphTransition ? [...morphTransition.querySelectorAll(".morph-layer")] : [];
const morphLogo = morphTransition?.querySelector(".morph-logo");
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, Draggable, Flip, TextPlugin, MorphSVGPlugin);
window.NikeCityGSAP = { gsap, ScrollTrigger, MotionPathPlugin, Draggable, Flip, TextPlugin, MorphSVGPlugin };
const TRANSICION_HOME_CIUDAD = {
  name: "TRANSICION_HOME_CIUDAD",
  description: "Organic curved white/yellow/black wipe used to move from the home hero into another Nike City screen."
};
const USE_BLENDER_PLAZA_CENTRAL = true;
const PLAZA_CENTRAL_GLB = "assets/zona_plaza_central_ultra_blender.glb";
const USE_BLENDER_ESTACIONAMIENTO = true;
const ESTACIONAMIENTO_GLB = "assets/models/zones/zona_estacionamiento.glb?v=2";
const USE_BLENDER_METRO = true;
const METRO_GLB = "assets/models/zones/zona_metro.glb";
const USE_BLENDER_RUNNING = true;
const RUNNING_GLB = "assets/models/zones/zona_running.glb";
const USE_BLENDER_SOCCER = true;
const SOCCER_GLB = "assets/models/zones/zona_soccer.glb";
const USE_BLENDER_BASKETBALL = true;
const BASKETBALL_GLB = "assets/models/zones/zona_basketball.glb?v=1";
const USE_BLENDER_CASUAL = true;
const CASUAL_GLB = "assets/models/zones/zona_casual.glb?v=1";
const USE_BLENDER_JUVENIL = true;
const JUVENIL_GLB = "assets/models/zones/zona_juvenil.glb?v=1";
const USE_BLENDER_SKATE = true;
const SKATE_GLB = "assets/models/zones/zona_skate.glb?v=1";
const GENERIC_ZONE_GLB = "assets/models/zones/zona_generica.glb?v=1";
const PROP_ASSET_BASE = "assets/models/props/";
const SHOW_CITY_ROADS = false;
const SHOW_LAYOUT_ISLANDS = true;
const SHOW_CITY_ATMOSPHERE = true;
const SHOW_FLOOR_GRID = false;
const MORPH_PATHS = {
  below: "M0 126 C16 113 32 141 50 126 C68 111 84 141 100 126 L100 176 C82 164 68 182 50 168 C32 154 18 182 0 168 Z",
  blackCover: "M0 -52 C14 -32 28 -68 46 -48 C62 -30 78 -70 100 -42 L100 176 C82 164 68 182 50 168 C32 154 18 182 0 168 Z",
  yellowCover: "M0 -66 C18 -44 30 -78 49 -54 C66 -34 82 -82 100 -50 L100 176 C82 164 68 182 50 168 C32 154 18 182 0 168 Z",
  paperCover: "M0 -82 C20 -60 34 -92 52 -68 C70 -48 86 -88 100 -62 L100 176 C82 164 68 182 50 168 C32 154 18 182 0 168 Z",
  cover: "M0 -82 C20 -60 34 -92 52 -68 C70 -48 86 -88 100 -62 L100 176 C82 164 68 182 50 168 C32 154 18 182 0 168 Z",
  above: "M0 -176 C16 -189 32 -161 50 -176 C68 -191 84 -161 100 -176 L100 -126 C82 -138 68 -120 50 -134 C32 -148 18 -120 0 -134 Z"
};
const DYNAMIC_MORPH = {
  points: 10,
  below: 132,
  coverBlack: -48,
  coverYellow: -62,
  coverPaper: -82,
  above: -124,
  bottom: 176
};

function createMorphPoints(y) {
  return Array.from({ length: DYNAMIC_MORPH.points }, () => ({ y }));
}

function drawDynamicMorph(points, mode = "bottom") {
  const step = 100 / (points.length - 1);
  let path = mode === "top" ? `M 0 0 V ${points[0].y}` : `M 0 ${points[0].y}`;

  for (let i = 1; i < points.length; i += 1) {
    const x = i * step;
    const midX = x - step / 2;
    path += ` C ${midX} ${points[i - 1].y} ${midX} ${points[i].y} ${x} ${points[i].y}`;
  }

  if (mode === "top") return `${path} V 0 H 0 Z`;
  return `${path} V ${DYNAMIC_MORPH.bottom} H 0 Z`;
}

function setDynamicMorph(layer, points, mode) {
  if (!layer) return;
  layer.setAttribute("d", drawDynamicMorph(points, mode));
}

function tweenDynamicMorph(layer, points, y, mode, vars = {}) {
  const staggerFrom = vars.staggerFrom || "center";
  return gsap.to(points, {
    y,
    duration: vars.duration || 1.8,
    ease: vars.ease || "elastic.out(0.85, 0.46)",
    stagger: {
      each: vars.each || 0.075,
      from: staggerFrom
    },
    onUpdate: () => setDynamicMorph(layer, points, mode)
  });
}

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
  controls.zoomSpeed = 1.05;
  controls.minZoom = 0.45;
  controls.maxZoom = 5.8;
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
  grass: new THREE.MeshStandardMaterial({ color: 0xe7e4db, roughness: 0.85 }),
  layoutIsland: new THREE.MeshStandardMaterial({ color: 0xd8d6cf, roughness: 0.82 }),
  layoutIslandActive: new THREE.MeshStandardMaterial({ color: 0xf3c300, roughness: 0.62 }),
  zoneBaseHelper: new THREE.MeshStandardMaterial({ color: 0xe7e4dc, roughness: 0.86 }),
  roadOrange: new THREE.MeshStandardMaterial({ color: 0xf7bd00, roughness: 0.48 }),
  roadSelected: new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.62 })
};

const clickables = [];
const labels = [];
const zoneRotatables = new Map();
const zoneRotationValues = new Map();
const zonePositionValues = new Map();
const zoneLabelOffsets = new Map();
let activeZoneGroup = null;
const LAYOUT_SNAP = 0.25;
const ROAD_MAGNET_SNAP = 0.18;
const ZONE_MAGNET_SNAP = 0.32;
const TECH_GRID_SIZE = 44;
const TECH_GRID_DIVISIONS = 176;
const ISLAND_TYPES = {
  small: { label: "Isla S", w: 1.1, d: 0.82, rot: 0 },
  long: { label: "Isla larga", w: 1.85, d: 0.84, rot: 0 },
  diagonal: { label: "Diagonal", w: 1.75, d: 0.82, rot: -0.58 },
  plaza: { label: "Plaza", w: 1.45, d: 1.25, rot: 0 }
};
const ASSET_TYPES = {
  genericZone: { label: "Zona genérica", category: "Urban Props", url: GENERIC_ZONE_GLB, scale: 1, y: 0.25, placement: "ground" },
  carOrange: { label: "Auto naranja", category: "Vehicles / Ground", url: `${PROP_ASSET_BASE}car_orange.glb`, scale: 0.7, y: 0.18, placement: "road" },
  carYellow: { label: "Auto amarillo", category: "Vehicles / Ground", url: `${PROP_ASSET_BASE}car_yellow.glb`, scale: 0.7, y: 0.18, placement: "road" },
  carWhiteBlack: { label: "Auto blanco/negro", category: "Vehicles / Ground", url: `${PROP_ASSET_BASE}car_white_black.glb`, scale: 0.7, y: 0.18, placement: "road" },
  planeOrange: { label: "Avión naranja", category: "Vehicles / Air", url: `${PROP_ASSET_BASE}plane_orange.glb`, scale: 0.85, y: 3.2, placement: "air", animated: true },
  helicopterOrange: { label: "Helicóptero naranja", category: "Vehicles / Air", url: `${PROP_ASSET_BASE}helicopter_orange.glb`, scale: 0.85, y: 2.9, placement: "air", animated: true },
  cloudSmall: { label: "Nube chica", category: "Sky", kind: "cloud", scale: 0.7, y: 3.4, placement: "air" },
  cloudMedium: { label: "Nube mediana", category: "Sky", kind: "cloud", scale: 1, y: 3.8, placement: "air" },
  cloudLarge: { label: "Nube grande", category: "Sky", kind: "cloud", scale: 1.35, y: 4.2, placement: "air" },
  cloudWide: { label: "Nube amplia", category: "Sky", kind: "cloud", scale: 1.15, y: 4, placement: "air", scaleX: 1.75, scaleZ: 0.85 },
  personBlock: { label: "Persona quieta", category: "People", url: `${PROP_ASSET_BASE}person_block.glb`, scale: 0.58, y: 0.18, placement: "pedestrian" },
  personWalking: { label: "Persona caminando", category: "People", url: `${PROP_ASSET_BASE}person_walking.glb`, scale: 0.58, y: 0.18, placement: "pedestrian", animated: true },
  treeYellow: { label: "Árbol amarillo", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_tree_yellow.glb`, scale: 0.82, y: 0.16, placement: "decor" },
  treeWhite: { label: "Árbol blanco", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_tree_white.glb`, scale: 0.82, y: 0.16, placement: "decor" },
  treeCone: { label: "Árbol cónico", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_tree_cone.glb`, scale: 0.82, y: 0.16, placement: "decor" },
  umbrella: { label: "Sombrilla", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_umbrella.glb`, scale: 0.78, y: 0.16, placement: "decor" },
  lamp: { label: "Lámpara", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_lamp.glb`, scale: 0.76, y: 0.16, placement: "decor" },
  bench: { label: "Banca", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_bench.glb`, scale: 0.78, y: 0.16, placement: "decor" },
  nikeSign: { label: "Señal Nike", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_nike_sign.glb`, scale: 0.78, y: 0.16, placement: "decor" },
  nikeFlag: { label: "Bandera Nike", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_flag.glb`, scale: 0.78, y: 0.16, placement: "decor" },
  bollard: { label: "Bolardo", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_bollard.glb`, scale: 0.72, y: 0.16, placement: "decor" },
  fountain: { label: "Fuente", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_fountain.glb`, scale: 0.82, y: 0.16, placement: "decor" },
  parkingSign: { label: "Señal parking", category: "Urban Props", url: `${PROP_ASSET_BASE}prop_parking_sign.glb`, scale: 0.78, y: 0.16, placement: "decor" }
};
const ROAD_TYPES = {
  straight: { label: "Recta", w: 2.7, d: 0.86 },
  wide: { label: "Recta ancha", w: 3.2, d: 1.18 },
  curve: { label: "Curva L", w: 2.2, d: 2.2 },
  t: { label: "Calle T", w: 2.7, d: 2.2 },
  cross: { label: "Cruce +", w: 2.7, d: 2.7 },
  crosswalkWhite: { label: "Peatonal blanca", w: 1.15, d: 0.8 },
  crosswalkOrange: { label: "Peatonal naranja", w: 1.15, d: 0.8 },
  laneWhite: { label: "Linea blanca", w: 2.2, d: 0.16 },
  laneWhiteLong: { label: "Linea blanca larga", w: 6.3, d: 0.16 },
  laneOrange: { label: "Linea naranja", w: 2.2, d: 0.16 }
};
const ROAD_COLOR_OPTIONS = {
  asphalt: { label: "Gris actual", color: 0x3a3b3d },
  graphite: { label: "Gris grafito", color: 0x2f3032 },
  soft: { label: "Gris medio", color: 0x48494b },
  light: { label: "Gris claro", color: 0x5a5b5d },
  concrete: { label: "Concreto", color: 0xd9d9d9 },
  pale: { label: "Gris blanco", color: 0xefefef },
  ultraLight: { label: "Casi blanco", color: 0xf8f8f8 },
  white: { label: "Blanco", color: 0xf5f5f3 }
};
const ZONE_BASE_DEFAULTS = {
  soccer: { w: 5.05, d: 3.38 },
  running: { w: 4.45, d: 3.15 },
  basketball: { w: 3.9, d: 2.68 },
  juvenil: { w: 4.4, d: 3.22 },
  central: { w: 4.05, d: 3.25 },
  casual: { w: 3.7, d: 2.52 },
  skate: { w: 4.3, d: 2.4 },
  metro: { w: 3.1, d: 2.25 },
  parking: { w: 3.7, d: 2.6 }
};
const DEFAULT_LAYOUT_STATE = {
  zones: {
    soccer: { x: -0.75, z: -9.25, rotation: -81 },
    running: { x: -5.5, z: -4, rotation: -38 },
    basketball: { x: 4.5, z: -4.5, rotation: -38 },
    juvenil: { x: -6.5, z: 2, rotation: -38 },
    central: { x: 0.5, z: 1, rotation: -38 },
    casual: { x: 9, z: 2.5, rotation: -38 },
    skate: { x: -5.25, z: 8.25, rotation: -38 },
    metro: { x: 1.5, z: 8.75, rotation: 0 },
    parking: { x: 6.25, z: 6, rotation: -38 }
  },
  bases: {
    soccer: { w: 1.8, d: 1.4 },
    running: { w: 4.45, d: 3.15 },
    basketball: { w: 3.9, d: 2.68 },
    juvenil: { w: 4.4, d: 3.22 },
    central: { w: 4.05, d: 3.25 },
    casual: { w: 3.7, d: 2.52 },
    skate: { w: 4.3, d: 2.4 },
    metro: { w: 3.1, d: 2.25 },
    parking: { w: 3.7, d: 2.6 }
  },
  islands: [
    { id: "island_3", type: "diagonal", x: -2.5, z: -1.5, w: 4, d: 0.82, rotation: -127 },
    { id: "island_5", type: "long", x: 3.25, z: 3, w: 3.85, d: 0.84, rotation: -130 },
    { id: "island_6", type: "long", x: 2.5, z: -2, w: 4, d: 0.75, rotation: -37 },
    { id: "island_8", type: "long", x: 7.5, z: -2.25, w: 3.65, d: 0.7, rotation: 52 },
    { id: "island_9", type: "small", x: -0.25, z: -5, w: 3.1, d: 1.25, rotation: 9 }
  ],
  assets: [
    { id: "asset_1", type: "genericZone", x: -2, z: 5.5, rotation: 52, scale: 1.05 },
    { id: "asset_5", type: "genericZone", x: 10.75, z: -0.75, rotation: -39, scale: 1 }
  ]
};
const layoutIslands = [];
const layoutAssets = [];
const layoutRoads = [];
let layoutIslandGroup = null;
let layoutAssetGroup = null;
let layoutRoadGroup = null;
const layoutAssetMixers = new Map();
const editorHistory = [];
let hoveredAssetId = null;
let hoverAssetHelper = null;
let lastAnimationTime = 0;
let selectedIslandType = null;
let selectedIslandId = null;
let selectedAssetType = null;
let selectedAssetId = null;
let selectedRoadType = null;
let selectedRoadId = null;
let islandIdCounter = 0;
let assetIdCounter = 0;
let roadIdCounter = 0;
let draggedIslandId = null;
let draggedAssetId = null;
let draggedRoadId = null;
let isApplyingStoredEditorState = false;
const zoneBaseHelpers = new Map();
const zoneBaseValues = new Map();
const LAYOUT_STORAGE_KEY = "nike-city-layout-editor-v2";
const LAYOUT_BACKUP_STORAGE_KEY = "nike-city-layout-editor-v2-backup";
const ROAD_STORAGE_KEY = "nike-city-road-editor-v2";
const ROAD_BACKUP_STORAGE_KEY = "nike-city-road-editor-v2-backup";
const SOUND_STORAGE_KEY = "nike-city-sound-enabled";
const savedLayoutState = loadLayoutState() || DEFAULT_LAYOUT_STATE;
const savedRoadState = loadRoadState();
const atmosphereObjects = [];
let atmosphereGroup = null;
let audioContext = null;
let musicTimer = null;
let masterGain = null;
let musicStep = 0;
let musicEnabled = window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
let cinematicFocusGlow = null;
let cinematicFocusHud = null;
let cinematicFocusTl = null;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function loadLayoutState() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const backup = window.localStorage.getItem(LAYOUT_BACKUP_STORAGE_KEY);
    return backup ? JSON.parse(backup) : null;
  } catch {
    try {
      const backup = window.localStorage.getItem(LAYOUT_BACKUP_STORAGE_KEY);
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }
}

function loadRoadState() {
  try {
    const raw = window.localStorage.getItem(ROAD_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const backup = window.localStorage.getItem(ROAD_BACKUP_STORAGE_KEY);
    return backup ? JSON.parse(backup) : null;
  } catch {
    try {
      const backup = window.localStorage.getItem(ROAD_BACKUP_STORAGE_KEY);
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }
}

function getRoadState() {
  return {
    roads: layoutRoads.map((road) => ({
      ...road,
      opacity: isFiniteNumber(road.opacity) ? road.opacity : 1
    }))
  };
}

function saveRoadState() {
  try {
    const state = JSON.stringify(getRoadState());
    window.localStorage.setItem(ROAD_STORAGE_KEY, state);
    window.localStorage.setItem(ROAD_BACKUP_STORAGE_KEY, state);
  } catch {
    // Copying values still works if local storage is unavailable.
  }
}

function getLayoutState() {
  const zoneIds = Object.keys(ZONE_BASE_DEFAULTS);
  return {
    zones: Object.fromEntries(zoneIds.map((id) => {
      const position = zonePositionValues.get(id) || { x: 0, z: 0 };
      return [id, {
        x: position.x,
        z: position.z,
        rotation: zoneRotationValues.get(id) ?? 0
      }];
    })),
    bases: Object.fromEntries(zoneIds.map((id) => [id, zoneBaseValues.get(id) || ZONE_BASE_DEFAULTS[id]])),
    islands: layoutIslands,
    assets: layoutAssets
  };
}

function getEditorSnapshot() {
  return {
    layout: getLayoutState(),
    roads: getRoadState()
  };
}

function captureEditorHistory() {
  editorHistory.push(JSON.stringify(getEditorSnapshot()));
  if (editorHistory.length > 60) editorHistory.shift();
}

function restoreEditorSnapshot(snapshotText) {
  if (!snapshotText) return;
  try {
    const snapshot = JSON.parse(snapshotText);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(snapshot.layout));
    window.localStorage.setItem(ROAD_STORAGE_KEY, JSON.stringify(snapshot.roads));
    isApplyingStoredEditorState = true;
    window.location.href = `${window.location.pathname}?v=road-editor-26`;
  } catch {
    // If a snapshot is corrupted, keep the current editor state.
  }
}

function undoEditorChange() {
  const snapshot = editorHistory.pop();
  restoreEditorSnapshot(snapshot);
}

function saveLayoutState() {
  try {
    const state = JSON.stringify(getLayoutState());
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, state);
    window.localStorage.setItem(LAYOUT_BACKUP_STORAGE_KEY, state);
  } catch {
    // Local storage can be unavailable in strict browser modes; the copy button still works.
  }
}

function saveAllEditorState(button = null) {
  selectLayoutIsland(null);
  saveLayoutState();
  saveRoadState();
  if (!button) return;
  const originalText = button.textContent;
  button.textContent = "Guardado";
  button.classList.add("is-saved");
  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("is-saved");
  }, 1100);
}

function persistEditorStateNow() {
  if (!canvas || !citySection || !layoutRoadGroup) return;
  if (isApplyingStoredEditorState) return;
  saveLayoutState();
  saveRoadState();
}

function importEditorStateFromText(text) {
  if (!text) return false;
  try {
    const snapshot = JSON.parse(text);
    const layout = snapshot.layout || snapshot;
    const roads = snapshot.roads || null;
    if (!layout?.zones || !layout?.bases) throw new Error("Layout incompleto");
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    window.localStorage.setItem(LAYOUT_BACKUP_STORAGE_KEY, JSON.stringify(layout));
    if (roads?.roads) {
      window.localStorage.setItem(ROAD_STORAGE_KEY, JSON.stringify(roads));
      window.localStorage.setItem(ROAD_BACKUP_STORAGE_KEY, JSON.stringify(roads));
    }
    isApplyingStoredEditorState = true;
    window.location.href = `${window.location.pathname}?v=road-editor-26`;
    return true;
  } catch (error) {
    window.alert("El JSON no se pudo importar. Revisa que tenga layout y roads completos.");
    return false;
  }
}

function closeEditorImportModal() {
  document.querySelector(".editor-import-modal")?.remove();
  if (controls) controls.enabled = true;
}

function getImportSummary(text) {
  const snapshot = JSON.parse(text);
  const layout = snapshot.layout || snapshot;
  const roads = snapshot.roads || null;
  if (!layout?.zones || !layout?.bases) throw new Error("Layout incompleto");
  return {
    zones: Object.keys(layout.zones || {}).length,
    islands: layout.islands?.length || 0,
    assets: layout.assets?.length || 0,
    roads: roads?.roads?.length || 0
  };
}

function showEditorImportModal() {
  closeEditorImportModal();
  if (controls) controls.enabled = false;
  const modal = document.createElement("div");
  modal.className = "editor-import-modal";
  modal.innerHTML = `
    <div class="editor-import-card" role="dialog" aria-modal="true" aria-labelledby="editor-import-title">
      <div class="editor-import-head">
        <strong id="editor-import-title">Importar JSON</strong>
        <button type="button" class="editor-import-close" aria-label="Cerrar">×</button>
      </div>
      <p>Pega aqui el JSON completo. Antes de aplicarlo revisare que entren zonas, islas, assets y calles.</p>
      <textarea spellcheck="false" aria-label="JSON completo de Nike City"></textarea>
      <div class="editor-import-status">Esperando JSON completo.</div>
      <div class="editor-import-actions">
        <button type="button" class="editor-import-cancel">Cancelar</button>
        <button type="button" class="editor-import-check">Revisar JSON</button>
        <button type="button" class="editor-import-submit">Importar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const textarea = modal.querySelector("textarea");
  const status = modal.querySelector(".editor-import-status");
  const showSummary = () => {
    try {
      const summary = getImportSummary(textarea.value.trim());
      status.textContent = `${summary.zones} zonas · ${summary.islands} islas · ${summary.assets} assets · ${summary.roads} calles detectadas`;
      status.classList.remove("is-error");
      return true;
    } catch {
      status.textContent = "No pude leer el JSON completo. Revisa que no se haya cortado al copiarlo.";
      status.classList.add("is-error");
      return false;
    }
  };
  textarea.focus();
  modal.querySelector(".editor-import-cancel").addEventListener("click", closeEditorImportModal);
  modal.querySelector(".editor-import-close").addEventListener("click", closeEditorImportModal);
  modal.querySelector(".editor-import-check").addEventListener("click", showSummary);
  modal.querySelector(".editor-import-submit").addEventListener("click", () => {
    if (!showSummary()) return;
    importEditorStateFromText(textarea.value);
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeEditorImportModal();
  });
  modal.addEventListener("pointerdown", (event) => {
    if (event.target === modal) closeEditorImportModal();
    event.stopPropagation();
  });
}

function groupedAssetButtons() {
  const groups = {};
  Object.entries(ASSET_TYPES).forEach(([id, item]) => {
    const category = item.category || "Assets";
    groups[category] = groups[category] || [];
    groups[category].push([id, item]);
  });
  return Object.entries(groups).map(([category, items]) => `
    <div class="asset-category">
      <span>${category}</span>
      <div class="asset-type-list">
        ${items.map(([id, item]) => `<button type="button" draggable="true" data-asset-type="${id}">${item.label}</button>`).join("")}
      </div>
    </div>
  `).join("");
}

function refreshLayoutState() {
  try {
    isApplyingStoredEditorState = true;
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    window.localStorage.removeItem(LAYOUT_BACKUP_STORAGE_KEY);
    window.localStorage.removeItem(ROAD_STORAGE_KEY);
    window.localStorage.removeItem(ROAD_BACKUP_STORAGE_KEY);
  } catch {
    // Nothing else to do; reload still restores the code defaults.
  }
  window.location.href = `${window.location.pathname}?v=road-editor-26`;
}

function addSceneObject(object) {
  (activeZoneGroup || scene).add(object);
  return object;
}

function registerZoneRoot(id, root) {
  zoneRotatables.set(id, root);
  root.userData.zoneRootId = id;
  root.traverse?.((child) => {
    child.userData.zoneRootId = id;
  });
  if (zonePositionValues.has(id)) {
    const position = zonePositionValues.get(id);
    root.position.x = position.x;
    root.position.z = position.z;
  }
  if (zoneRotationValues.has(id)) {
    root.rotation.y = THREE.MathUtils.degToRad(zoneRotationValues.get(id));
  }
  return root;
}

function setZoneRotation(id, degrees) {
  zoneRotationValues.set(id, degrees);
  const root = zoneRotatables.get(id);
  if (root) {
    root.rotation.y = THREE.MathUtils.degToRad(degrees);
  }
  const helper = zoneBaseHelpers.get(id);
  if (helper) {
    helper.rotation.y = THREE.MathUtils.degToRad(degrees);
  }
  updateZoneLayoutPanel(id);
  updateZoneBasePanel(id);
  projectLabels();
  saveLayoutState();
}

function setZonePosition(id, x, z) {
  const position = {
    x: Number(x.toFixed(2)),
    z: Number(z.toFixed(2))
  };
  zonePositionValues.set(id, position);
  const root = zoneRotatables.get(id);
  if (root) {
    root.position.x = position.x;
    root.position.z = position.z;
  }
  const helper = zoneBaseHelpers.get(id);
  if (helper) {
    helper.position.x = position.x;
    helper.position.z = position.z;
  }
  const labelOffset = zoneLabelOffsets.get(id);
  if (labelOffset) {
    const label = labels.find((item) => item.id === id);
    if (label) {
      label.world.set(position.x + labelOffset.x, labelOffset.y, position.z + labelOffset.z);
    }
  }
  updateZoneLayoutPanel(id);
  updateZoneBasePanel(id);
  projectLabels();
  saveLayoutState();
}

function snapToLayoutGrid(value) {
  return Math.round(value / LAYOUT_SNAP) * LAYOUT_SNAP;
}

function snapAxisByFootprint(value, size) {
  const half = size / 2;
  const candidates = [
    snapToLayoutGrid(value),
    value + (snapToLayoutGrid(value - half) - (value - half)),
    value + (snapToLayoutGrid(value + half) - (value + half))
  ];
  return candidates.reduce((best, candidate) => {
    return Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best;
  }, candidates[0]);
}

function getRotatedFootprint(w, d, rotation = 0) {
  const radians = THREE.MathUtils.degToRad(rotation);
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    w: (w * cos) + (d * sin),
    d: (w * sin) + (d * cos)
  };
}

function snapPositionByFootprint(x, z, footprint) {
  return {
    x: Number(snapAxisByFootprint(x, footprint.w).toFixed(2)),
    z: Number(snapAxisByFootprint(z, footprint.d).toFixed(2))
  };
}

function getRotatedRectAnchors(w, d, rotation = 0) {
  const radians = THREE.MathUtils.degToRad(rotation);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const points = [
    [0, 0],
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
    [0, -d / 2],
    [w / 2, 0],
    [0, d / 2],
    [-w / 2, 0]
  ];
  return points.map(([px, pz]) => ({
    x: (px * cos) - (pz * sin),
    z: (px * sin) + (pz * cos)
  }));
}

function snapAxisByAnchors(value, anchors, axis) {
  const deltas = anchors.map((anchor) => {
    const anchorValue = value + anchor[axis];
    return snapToLayoutGrid(anchorValue) - anchorValue;
  });
  const bestDelta = deltas.reduce((best, delta) => {
    return Math.abs(delta) < Math.abs(best) ? delta : best;
  }, deltas[0] ?? 0);
  return Number((value + bestDelta).toFixed(2));
}

function snapPositionByRotatedRect(x, z, w, d, rotation = 0) {
  const anchors = getRotatedRectAnchors(w, d, rotation);
  return {
    x: snapAxisByAnchors(x, anchors, "x"),
    z: snapAxisByAnchors(z, anchors, "z")
  };
}

function getRoadFootprint(road) {
  const type = ROAD_TYPES[road?.type];
  if (!type) return { w: 1, d: 1 };
  const w = type.w * (road.scaleX ?? 1);
  const d = type.d * (road.scaleZ ?? 1);
  return getRotatedFootprint(w, d, road.rotation ?? 0);
}

function snapRoadAxis(value, axis, currentRoad) {
  const currentSize = getRoadFootprint(currentRoad)[axis === "x" ? "w" : "d"];
  let best = snapAxisByFootprint(value, currentSize);
  let bestDistance = ROAD_MAGNET_SNAP;
  layoutRoads.forEach((road) => {
    if (!road || road.id === currentRoad.id) return;
    const otherSize = getRoadFootprint(road)[axis === "x" ? "w" : "d"];
    const otherCenter = axis === "x" ? road.x : road.z;
    const min = otherCenter - otherSize / 2;
    const max = otherCenter + otherSize / 2;
    const candidates = [
      otherCenter,
      min + currentSize / 2,
      max - currentSize / 2,
      min - currentSize / 2,
      max + currentSize / 2
    ];
    candidates.forEach((candidate) => {
      const distance = Math.abs(value - candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    });
  });
  return Number(best.toFixed(2));
}

function snapRoadPosition(x, z, roadId = null, typeId = null) {
  const road = getRoadData(roadId) || { id: roadId, type: typeId, rotation: 0, scaleX: 1, scaleZ: 1 };
  return {
    x: snapRoadAxis(x, "x", road),
    z: snapRoadAxis(z, "z", road)
  };
}

function getZoneFootprint(id) {
  const values = zoneBaseValues.get(id) || ZONE_BASE_DEFAULTS[id] || { w: 1, d: 1 };
  const rotation = zoneRotationValues.get(id) ?? 0;
  return getRotatedFootprint(values.w, values.d, rotation);
}

function snapZoneToGridByAnchors(x, z, zoneId) {
  const values = zoneBaseValues.get(zoneId) || ZONE_BASE_DEFAULTS[zoneId] || { w: 1, d: 1 };
  return snapPositionByRotatedRect(x, z, values.w, values.d, zoneRotationValues.get(zoneId) ?? 0);
}

function snapZoneAxis(value, axis, currentZoneId) {
  const currentSize = getZoneFootprint(currentZoneId)[axis === "x" ? "w" : "d"];
  let best = value;
  let bestDistance = ZONE_MAGNET_SNAP;
  zonePositionValues.forEach((position, id) => {
    if (id === currentZoneId) return;
    const otherSize = getZoneFootprint(id)[axis === "x" ? "w" : "d"];
    const otherCenter = axis === "x" ? position.x : position.z;
    const min = otherCenter - otherSize / 2;
    const max = otherCenter + otherSize / 2;
    const candidates = [
      otherCenter,
      min + currentSize / 2,
      max - currentSize / 2,
      min - currentSize / 2,
      max + currentSize / 2
    ];
    candidates.forEach((candidate) => {
      const distance = Math.abs(value - candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    });
  });
  return Number(best.toFixed(2));
}

function snapZonePosition(x, z, zoneId) {
  return snapZoneToGridByAnchors(x, z, zoneId);
}

function getIslandFootprint(island) {
  return getRotatedFootprint(island.w ?? 1, island.d ?? 1, island.rotation ?? 0);
}

function snapIslandPosition(x, z, island) {
  return snapPositionByFootprint(x, z, getIslandFootprint(island));
}

function getAssetBaseFootprint(typeId) {
  const type = ASSET_TYPES[typeId];
  if (!type) return { w: 1, d: 1 };
  if (typeId === "genericZone") return { w: 2.8, d: 2 };
  if (type.kind === "cloud") return { w: 1.45, d: 0.72 };
  if (type.placement === "road") return { w: 1.05, d: 0.58 };
  if (type.placement === "air") return { w: 1.3, d: 0.9 };
  if (type.placement === "pedestrian") return { w: 0.42, d: 0.42 };
  return { w: 0.72, d: 0.72 };
}

function getAssetFootprint(asset) {
  const base = getAssetBaseFootprint(asset.type);
  return getRotatedFootprint(
    base.w * (asset.scaleX ?? asset.scale ?? 1),
    base.d * (asset.scaleZ ?? asset.scale ?? 1),
    asset.rotation ?? 0
  );
}

function snapAssetPosition(x, z, asset) {
  return snapPositionByFootprint(x, z, getAssetFootprint(asset));
}

function buildRotatableZone(id, x, z, buildFn) {
  const group = new THREE.Group();
  group.name = id;
  activeZoneGroup = group;
  buildFn();
  activeZoneGroup = null;
  group.children.forEach((child) => {
    child.position.x -= x;
    child.position.z -= z;
  });
  group.position.set(x, 0, z);
  registerZoneRoot(id, group);
  scene.add(group);
  return group;
}

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
  addSceneObject(mesh);
  return mesh;
}

function platformHelper(w, d, h = 0.22) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, d, 0.35), {
    depth: h,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 4
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, [mats.platform, mats.side]);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function box(w, h, d, mat, x, y, z, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.rotation.y = rot;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addSceneObject(mesh);
  return mesh;
}

function roundedSlab(w, d, h, mat, r = 0.24) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, d, Math.min(r, w / 2 - 0.02, d / 2 - 0.02)), {
    depth: h,
    bevelEnabled: false
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(r, h, mat, x, y, z, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addSceneObject(mesh);
  return mesh;
}

function addRoad(parent, x, z, w, d, rot = 0, options = {}) {
  const segment = new THREE.Group();
  segment.position.set(x, 0.045, z);
  segment.rotation.y = rot;
  parent.add(segment);

  const road = roundedSlab(w, d, 0.035, mats.road, options.radius ?? 0.2);
  road.name = options.name || "road_straight";
  segment.add(road);

  if (options.lanes !== false) {
    addLaneLines(segment, w, d, options);
  }

  return segment;
}

function addLaneLines(parent, w, d, options = {}) {
  const count = Math.max(3, Math.floor(Math.max(w, d) / 0.9));
  const long = w > d;
  const dashLength = options.dashLength ?? 0.34;
  const dashWidth = options.dashWidth ?? 0.045;
  const y = 0.042;
  for (let i = 0; i < count; i++) {
    const offset = -Math.max(w, d) / 2 + 0.45 + i * 0.9;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(long ? dashLength : dashWidth, 0.012, long ? dashWidth : dashLength),
      mats.white
    );
    stripe.position.set(long ? offset : 0, y, long ? 0 : offset);
    stripe.name = "dashed_lane_line";
    parent.add(stripe);
  }
}

function addCrosswalk(parent, x, z, rot = 0, width = 1.05) {
  const group = new THREE.Group();
  group.position.set(x, 0.095, z);
  group.rotation.y = rot;
  group.name = "crosswalk";
  parent.add(group);
  for (let i = -2; i <= 2; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, width), mats.white);
    stripe.position.x = i * 0.22;
    stripe.receiveShadow = true;
    group.add(stripe);
  }
  return group;
}

function addCloud(parent, x, y, z, scale = 1, speed = 0.003) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.name = "atmosphere_cloud";
  parent.add(group);

  const parts = [
    [-0.38, 0, 0, 0.28],
    [-0.08, 0.08, 0.02, 0.36],
    [0.26, 0.02, -0.02, 0.3],
    [0.48, -0.03, 0.02, 0.22]
  ];
  parts.forEach(([px, py, pz, radius]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), mats.white);
    puff.position.set(px, py, pz);
    puff.scale.y = 0.62;
    puff.castShadow = false;
    puff.receiveShadow = false;
    group.add(puff);
  });

  atmosphereObjects.push({
    object: group,
    type: "cloud",
    speed,
    startX: x,
    laneZ: z,
    bob: Math.random() * Math.PI * 2
  });
  return group;
}

function buildCloudAsset() {
  const group = new THREE.Group();
  group.name = "asset_cloud";
  const parts = [
    [-0.42, -0.02, 0, 0.3],
    [-0.12, 0.08, 0.02, 0.4],
    [0.28, 0.04, -0.02, 0.34],
    [0.54, -0.04, 0.02, 0.24]
  ];
  parts.forEach(([px, py, pz, radius]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 12), mats.white);
    puff.position.set(px, py, pz);
    puff.scale.y = 0.62;
    puff.castShadow = false;
    puff.receiveShadow = false;
    group.add(puff);
  });
  return group;
}

function addBird(parent, x, y, z, scale = 1, speed = 0.006) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.name = "atmosphere_bird";
  parent.add(group);

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 8), mats.black);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const wingGeo = new THREE.BoxGeometry(0.18, 0.018, 0.035);
  const leftWing = new THREE.Mesh(wingGeo, mats.black);
  leftWing.position.set(-0.04, 0.04, 0);
  leftWing.rotation.z = 0.55;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, mats.black);
  rightWing.position.set(-0.04, -0.04, 0);
  rightWing.rotation.z = -0.55;
  group.add(rightWing);

  atmosphereObjects.push({
    object: group,
    type: "bird",
    speed,
    startX: x,
    laneZ: z,
    bob: Math.random() * Math.PI * 2,
    wings: [leftWing, rightWing]
  });
  return group;
}

function buildCityAtmosphere() {
  if (!SHOW_CITY_ATMOSPHERE) return;
  atmosphereGroup = new THREE.Group();
  atmosphereGroup.name = "nikeCityAtmosphere";
  scene.add(atmosphereGroup);

  addCloud(atmosphereGroup, -11.6, 3.4, -6.6, 1.75, 0.0032);
  addCloud(atmosphereGroup, 1.8, 4.15, -7.4, 1.42, 0.0025);
  addCloud(atmosphereGroup, 9.2, 3.7, -1.4, 1.58, 0.0028);
  addCloud(atmosphereGroup, -7.8, 3.2, 5.7, 1.36, 0.0035);
  addCloud(atmosphereGroup, 5.6, 4.0, 7.2, 1.48, 0.0026);
  addCloud(atmosphereGroup, -4.8, 4.45, -8.8, 1.28, 0.003);
  addCloud(atmosphereGroup, 11.4, 3.5, 3.4, 1.64, 0.0024);
  addCloud(atmosphereGroup, -12.2, 4.05, 1.1, 1.5, 0.0031);
  addCloud(atmosphereGroup, 0.2, 3.35, 8.9, 1.22, 0.0034);

  addBird(atmosphereGroup, -9.4, 4.35, -3.1, 0.82, 0.007);
  addBird(atmosphereGroup, -5.3, 4.7, -4.2, 0.62, 0.008);
  addBird(atmosphereGroup, 2.5, 4.42, 2.8, 0.72, 0.0065);
  addBird(atmosphereGroup, 7.2, 4.65, -5.2, 0.66, 0.0075);
}

function updateCityAtmosphere(time) {
  const t = time * 0.001;
  atmosphereObjects.forEach((item) => {
    item.object.position.x += item.speed * (item.type === "cloud" ? 1 : 1.55);
    item.object.position.y += Math.sin(t * (item.type === "cloud" ? 0.8 : 2.2) + item.bob) * 0.003;
    if (item.object.position.x > 12.4) {
      item.object.position.x = -12.4;
      item.object.position.z = item.laneZ + (Math.random() - 0.5) * 0.9;
    }
    if (item.type === "bird") {
      item.object.rotation.y = Math.sin(t * 0.7 + item.bob) * 0.12;
      item.wings.forEach((wing, index) => {
        const flap = Math.sin(t * 12 + item.bob) * 0.35;
        wing.rotation.z = (index === 0 ? 0.55 : -0.55) + (index === 0 ? flap : -flap);
      });
    }
  });
}

function updateAnimatedLayoutAssets(time) {
  if (!layoutAssetGroup) return;
  const t = time * 0.001;
  layoutAssetGroup.children.forEach((object) => {
    if (!object.userData.animatedAirAsset || object.userData.layoutAssetId === draggedAssetId) return;
    const asset = getAssetData(object.userData.layoutAssetId);
    const type = ASSET_TYPES[asset?.type];
    if (!asset || !type) return;
    const phase = object.userData.animationPhase ?? 0;
    const baseX = asset.x;
    const baseY = asset.y ?? type.y ?? 0.18;
    const baseZ = asset.z;
    const rotation = THREE.MathUtils.degToRad(asset.rotation);
    if (type.kind === "cloud") {
      object.position.x = baseX + Math.sin(t * 0.28 + phase) * 0.32;
      object.position.y = baseY + Math.sin(t * 0.85 + phase) * 0.08;
      object.position.z = baseZ + Math.cos(t * 0.22 + phase) * 0.12;
      object.rotation.y = rotation + Math.sin(t * 0.18 + phase) * 0.035;
      return;
    }
    if (asset.type === "helicopterOrange") {
      object.position.x = baseX + Math.sin(t * 0.7 + phase) * 0.42;
      object.position.y = baseY + Math.sin(t * 1.8 + phase) * 0.12;
      object.position.z = baseZ + Math.cos(t * 0.65 + phase) * 0.22;
      object.rotation.y = rotation + Math.sin(t * 0.9 + phase) * 0.12;
      return;
    }
    if (asset.type === "planeOrange") {
      object.position.x = baseX + Math.sin(t * 0.45 + phase) * 0.68;
      object.position.y = baseY + Math.sin(t * 1.05 + phase) * 0.1;
      object.position.z = baseZ + Math.cos(t * 0.42 + phase) * 0.28;
      object.rotation.y = rotation + Math.sin(t * 0.7 + phase) * 0.08;
    }
  });
}

function addSmallIsland(parent, x, z, w, d, rot = 0, radius = 0.28) {
  const island = roundedSlab(w, d, 0.075, mats.layoutIsland, radius);
  island.position.set(x, 0.13, z);
  island.rotation.y = rot;
  island.name = "small_white_island";
  parent.add(island);
  return island;
}

function createLayoutIsland(typeId, x, z, options = {}) {
  const type = ISLAND_TYPES[typeId];
  if (!type || !layoutIslandGroup) return null;
  if (options.persist !== false) captureEditorHistory();
  const island = addSmallIsland(layoutIslandGroup, x, z, type.w, type.d, type.rot, 0.24);
  const id = options.id || `island_${++islandIdCounter}`;
  const numericId = Number(String(id).replace(/\D/g, ""));
  if (Number.isFinite(numericId)) islandIdCounter = Math.max(islandIdCounter, numericId);
  island.name = `layout_island_${typeId}`;
  island.userData.layoutIslandId = id;
  island.userData.baseW = type.w;
  island.userData.baseD = type.d;
  const islandData = {
    id,
    type: typeId,
    x: Number(x.toFixed(2)),
    z: Number(z.toFixed(2)),
    w: options.w ?? type.w,
    d: options.d ?? type.d,
    rotation: options.rotation ?? Number(THREE.MathUtils.radToDeg(type.rot).toFixed(1))
  };
  layoutIslands.push(islandData);
  updateLayoutIsland(id, islandData, false);
  if (options.select !== false) selectLayoutIsland(id);
  if (options.persist !== false) saveLayoutState();
  updateIslandLayoutPanel();
  return island;
}

function getIslandData(id) {
  return layoutIslands.find((island) => island.id === id);
}

function getIslandMesh(id) {
  return layoutIslandGroup?.children.find((child) => child.userData.layoutIslandId === id) || null;
}

function selectLayoutIsland(id) {
  selectedIslandId = id;
  layoutIslandGroup?.children.forEach((mesh) => {
    if (!mesh.userData.layoutIslandId) return;
    mesh.material = mesh.userData.layoutIslandId === id ? mats.layoutIslandActive : mats.layoutIsland;
  });
  updateIslandEditorPanel();
}

function updateLayoutIsland(id, updates, persist = true) {
  const island = getIslandData(id);
  const mesh = getIslandMesh(id);
  if (!island || !mesh) return;
  Object.assign(island, updates);
  if ("rotation" in updates || "w" in updates || "d" in updates) {
    const snapped = snapIslandPosition(island.x, island.z, island);
    island.x = snapped.x;
    island.z = snapped.z;
  }
  mesh.position.x = island.x;
  mesh.position.z = island.z;
  mesh.rotation.y = THREE.MathUtils.degToRad(island.rotation);
  mesh.scale.x = island.w / mesh.userData.baseW;
  mesh.scale.z = island.d / mesh.userData.baseD;
  updateIslandEditorPanel();
  updateIslandLayoutPanel();
  if (persist) saveLayoutState();
}

function deleteSelectedIsland() {
  if (!selectedIslandId) return;
  captureEditorHistory();
  const mesh = getIslandMesh(selectedIslandId);
  if (mesh) {
    layoutIslandGroup.remove(mesh);
    mesh.geometry?.dispose();
  }
  const index = layoutIslands.findIndex((island) => island.id === selectedIslandId);
  if (index >= 0) layoutIslands.splice(index, 1);
  selectedIslandId = null;
  updateIslandEditorPanel();
  updateIslandLayoutPanel();
  saveLayoutState();
}

function createLayoutAsset(typeId, x, z, options = {}) {
  const type = ASSET_TYPES[typeId];
  if (!type || !layoutAssetGroup) return null;
  if (options.persist !== false) captureEditorHistory();
  const id = options.id || `asset_${++assetIdCounter}`;
  const numericId = Number(String(id).replace(/\D/g, ""));
  if (Number.isFinite(numericId)) assetIdCounter = Math.max(assetIdCounter, numericId);
  const assetData = {
    id,
    type: typeId,
    x: Number(x.toFixed(2)),
    z: Number(z.toFixed(2)),
    rotation: options.rotation ?? 0,
    scale: options.scale ?? type.scale,
    scaleX: options.scaleX ?? type.scaleX ?? options.scale ?? type.scale,
    scaleZ: options.scaleZ ?? type.scaleZ ?? options.scale ?? type.scale,
    y: options.y ?? type.y ?? 0.18,
    flip: options.flip ?? 1
  };
  const snappedAssetPosition = snapAssetPosition(assetData.x, assetData.z, assetData);
  assetData.x = snappedAssetPosition.x;
  assetData.z = snappedAssetPosition.z;
  layoutAssets.push(assetData);

  if (type.kind === "cloud") {
    const asset = buildCloudAsset();
    asset.userData.layoutAssetId = id;
    asset.traverse((child) => {
      child.userData.layoutAssetId = id;
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
    });
    layoutAssetGroup.add(asset);
    applyLayoutAssetTransform(assetData, asset);
    if (options.select !== false) selectLayoutAsset(id);
    if (options.select !== false) selectedAssetId = id;
    if (options.persist !== false) saveLayoutState();
    updateAssetLayoutPanel();
    updateAssetEditorPanel();
    return assetData;
  }

  const loader = new GLTFLoader();
  loader.load(type.url, (gltf) => {
    const asset = gltf.scene;
    asset.name = `asset_${typeId}`;
    asset.userData.layoutAssetId = id;
    asset.traverse((child) => {
      child.userData.layoutAssetId = id;
      if (!child.isMesh) return;
      child.castShadow = type.placement !== "air";
      child.receiveShadow = true;
    });
    if (gltf.animations?.length) {
      const mixer = new THREE.AnimationMixer(asset);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      layoutAssetMixers.set(id, mixer);
    }
    layoutAssetGroup.add(asset);
    applyLayoutAssetTransform(assetData, asset);
    if (options.select !== false) selectLayoutAsset(id);
  }, undefined, () => {
    setAssetStatus(`${type.label}: no pudo cargar el GLB.`);
  });

  if (options.select !== false) selectedAssetId = id;
  if (options.persist !== false) saveLayoutState();
  updateAssetLayoutPanel();
  updateAssetEditorPanel();
  return assetData;
}

function applyLayoutAssetTransform(asset, object = getAssetObject(asset.id)) {
  if (!asset || !object) return;
  const type = ASSET_TYPES[asset.type] || {};
  object.position.set(asset.x, asset.y ?? type.y ?? 0.18, asset.z);
  object.rotation.y = THREE.MathUtils.degToRad(asset.rotation);
  object.scale.set((asset.scaleX ?? asset.scale) * (asset.flip ?? 1), asset.scale, asset.scaleZ ?? asset.scale);
  object.userData.assetType = asset.type;
  object.userData.baseX = asset.x;
  object.userData.baseY = asset.y ?? type.y ?? 0.18;
  object.userData.baseZ = asset.z;
  object.userData.baseRotation = asset.rotation;
  object.userData.animationPhase = object.userData.animationPhase ?? Math.random() * Math.PI * 2;
  object.userData.animatedAirAsset = type.placement === "air" || type.kind === "cloud";
}

function getAssetData(id) {
  return layoutAssets.find((asset) => asset.id === id);
}

function getAssetObject(id) {
  return layoutAssetGroup?.children.find((child) => child.userData.layoutAssetId === id) || null;
}

function selectLayoutAsset(id) {
  selectedAssetId = id;
  selectedIslandId = null;
  selectedRoadId = null;
  selectLayoutIsland(null);
  setHoverAsset(id);
  updateAssetEditorPanel();
}

function updateLayoutAsset(id, updates, persist = true) {
  const asset = getAssetData(id);
  const object = getAssetObject(id);
  if (!asset) return;
  Object.assign(asset, updates);
  if ("rotation" in updates || "scale" in updates || "scaleX" in updates || "scaleZ" in updates) {
    const snapped = snapAssetPosition(asset.x, asset.z, asset);
    asset.x = snapped.x;
    asset.z = snapped.z;
  }
  if (object) {
    applyLayoutAssetTransform(asset, object);
  }
  updateAssetEditorPanel();
  updateAssetLayoutPanel();
  if (persist) saveLayoutState();
}

function deleteSelectedAsset() {
  if (!selectedAssetId) return;
  captureEditorHistory();
  const object = getAssetObject(selectedAssetId);
  if (object) {
    layoutAssetGroup.remove(object);
  }
  layoutAssetMixers.delete(selectedAssetId);
  const index = layoutAssets.findIndex((asset) => asset.id === selectedAssetId);
  if (index >= 0) layoutAssets.splice(index, 1);
  selectedAssetId = null;
  updateAssetEditorPanel();
  updateAssetLayoutPanel();
  saveLayoutState();
}

function duplicateSelectedAsset() {
  if (!selectedAssetId) return;
  const asset = getAssetData(selectedAssetId);
  if (!asset) return;
  captureEditorHistory();
  createLayoutAsset(asset.type, snapToLayoutGrid(asset.x + 0.5), snapToLayoutGrid(asset.z + 0.5), {
    rotation: asset.rotation,
    scale: asset.scale,
    scaleX: asset.scaleX,
    scaleZ: asset.scaleZ,
    y: asset.y,
    flip: asset.flip,
    select: true
  });
}

function setAssetStatus(message) {
  const status = document.querySelector(".asset-builder-status");
  if (status) status.textContent = message;
}

function setAssetCreationType(typeId) {
  selectedAssetType = typeId;
  selectedIslandType = null;
  selectedRoadType = null;
  document.querySelectorAll("[data-island-type]").forEach((item) => item.classList.remove("is-active"));
  document.querySelectorAll("[data-road-type]").forEach((item) => item.classList.remove("is-active"));
  document.querySelectorAll("[data-asset-type]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.assetType === selectedAssetType);
  });
  setAssetStatus(selectedAssetType
    ? `${ASSET_TYPES[selectedAssetType].label}: click en el mapa para colocar.`
    : "Selecciona un asset y haz click en el mapa.");
}

function canPlaceAssetType(typeId, event) {
  const type = ASSET_TYPES[typeId];
  if (!type) return false;
  if (type.placement === "road" && !getRoadHit(event)) {
    setAssetStatus(`${type.label}: idealmente colócalo sobre una calle.`);
  }
  return true;
}

function createAssetFromEvent(typeId, event) {
  if (!canPlaceAssetType(typeId, event)) return null;
  const point = getLayoutPlanePoint(event);
  if (!point) return null;
  const asset = createLayoutAsset(
    typeId,
    snapToLayoutGrid(point.x),
    snapToLayoutGrid(point.z)
  );
  if (asset) setAssetCreationType(null);
  return asset;
}

function setHoverAsset(id) {
  if (!scene) return;
  const object = id ? getAssetObject(id) : null;
  hoveredAssetId = object ? id : null;
  if (!object) {
    if (hoverAssetHelper) hoverAssetHelper.visible = false;
    return;
  }
  if (!hoverAssetHelper) {
    hoverAssetHelper = new THREE.BoxHelper(object, 0xf7bd00);
    hoverAssetHelper.name = "asset_hover_outline";
    scene.add(hoverAssetHelper);
  }
  hoverAssetHelper.setFromObject(object);
  hoverAssetHelper.visible = true;
}

function updateAssetHover(event) {
  if (draggedAssetId || draggedIslandId || draggedRoadId || draggedZoneId || selectedAssetType || isScenePanning) return;
  const hit = getAssetHit(event);
  const nextId = hit?.id || null;
  if (nextId !== hoveredAssetId) setHoverAsset(nextId);
  if (hoverAssetHelper?.visible && nextId) {
    const object = getAssetObject(nextId);
    if (object) hoverAssetHelper.setFromObject(object);
  }
}

function isRoadMarkingType(typeId) {
  return ["crosswalkWhite", "crosswalkOrange", "laneWhite", "laneWhiteLong", "laneOrange"].includes(typeId);
}

function addRoadBox(group, w, d, mat = mats.road, x = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), mat);
  mesh.userData.isRoadSurface = mat === mats.road;
  mesh.userData.canRoadTint = true;
  mesh.position.set(x, 0.055, z);
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function applyRoadStyle(object, colorKey = "asphalt", opacity = 1) {
  const colorOption = ROAD_COLOR_OPTIONS[colorKey] || ROAD_COLOR_OPTIONS.asphalt;
  const alpha = THREE.MathUtils.clamp(isFiniteNumber(opacity) ? opacity : 1, 0.08, 1);
  object?.traverse((child) => {
    if (!child.isMesh || !child.userData.canRoadTint) return;
    child.material = new THREE.MeshStandardMaterial({
      color: colorOption.color,
      roughness: 0.72,
      transparent: alpha < 0.99,
      opacity: alpha,
      depthWrite: alpha >= 0.99
    });
  });
}

function buildRoadPiece(typeId) {
  const type = ROAD_TYPES[typeId];
  const group = new THREE.Group();
  group.name = `road_piece_${typeId}`;
  if (typeId === "curve") {
    addRoadBox(group, type.w, 0.82, mats.road, 0.44, 0);
    addRoadBox(group, 0.82, type.d, mats.road, -0.24, 0.44);
  } else if (typeId === "t") {
    addRoadBox(group, type.w, 0.86, mats.road, 0, 0);
    addRoadBox(group, 0.86, type.d, mats.road, 0, 0.58);
  } else if (typeId === "cross") {
    addRoadBox(group, type.w, 0.86, mats.road, 0, 0);
    addRoadBox(group, 0.86, type.d, mats.road, 0, 0);
  } else if (typeId === "crosswalkWhite" || typeId === "crosswalkOrange") {
    const mat = typeId === "crosswalkOrange" ? mats.roadOrange : mats.white;
    [-0.42, -0.21, 0, 0.21, 0.42].forEach((x) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, type.d), mat);
      stripe.position.set(x, 0.16, 0);
      stripe.userData.canRoadTint = true;
      group.add(stripe);
    });
  } else if (typeId === "laneWhite" || typeId === "laneWhiteLong" || typeId === "laneOrange") {
    const mat = typeId === "laneOrange" ? mats.roadOrange : mats.white;
    const dashCount = Math.max(4, Math.round(type.w / 0.55));
    const start = -type.w / 2 + 0.34;
    const step = (type.w - 0.68) / Math.max(1, dashCount - 1);
    Array.from({ length: dashCount }).forEach((_, index) => {
      const x = start + step * index;
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.016, type.d), mat);
      dash.position.set(x, 0.16, 0);
      dash.userData.canRoadTint = true;
      group.add(dash);
    });
  } else {
    addRoadBox(group, type.w, type.d, mats.road, 0, 0);
  }
  return group;
}

function createLayoutRoad(typeId, x, z, options = {}) {
  const type = ROAD_TYPES[typeId];
  if (!type || !layoutRoadGroup) return null;
  if (options.persist !== false) captureEditorHistory();
  const id = options.id || `road_${++roadIdCounter}`;
  const numericId = Number(String(id).replace(/\D/g, ""));
  if (Number.isFinite(numericId)) roadIdCounter = Math.max(roadIdCounter, numericId);
  const roadData = {
    id,
    type: typeId,
    x: Number(x.toFixed(2)),
    z: Number(z.toFixed(2)),
    rotation: options.rotation ?? 0,
    scaleX: options.scaleX ?? 1,
    scaleZ: options.scaleZ ?? 1,
    color: options.color || "asphalt",
    opacity: options.opacity ?? 1
  };
  layoutRoads.push(roadData);
  const road = buildRoadPiece(typeId);
  road.userData.layoutRoadId = id;
  road.traverse((child) => {
    child.userData.layoutRoadId = id;
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
  layoutRoadGroup.add(road);
  updateLayoutRoad(id, roadData, false);
  if (options.select !== false) selectLayoutRoad(id);
  if (options.persist !== false) saveRoadState();
  updateRoadLayoutPanel();
  return roadData;
}

function getRoadData(id) {
  return layoutRoads.find((road) => road.id === id);
}

function getRoadObject(id) {
  return layoutRoadGroup?.children.find((child) => child.userData.layoutRoadId === id) || null;
}

function setRoadSelectionMaterial(object, selected) {
  const road = getRoadData(object?.userData.layoutRoadId);
  applyRoadStyle(object, road?.color, road?.opacity);
}

function selectLayoutRoad(id) {
  selectedRoadId = id;
  selectedIslandId = null;
  selectedAssetId = null;
  layoutRoadGroup?.children.forEach((object) => {
    setRoadSelectionMaterial(object, object.userData.layoutRoadId === id);
  });
  updateRoadEditorPanel();
}

function updateLayoutRoad(id, updates, persist = true) {
  const road = getRoadData(id);
  const object = getRoadObject(id);
  if (!road) return;
  Object.assign(road, updates);
  if ("rotation" in updates || "scaleX" in updates || "scaleZ" in updates) {
    const snapped = snapRoadPosition(road.x, road.z, id);
    road.x = snapped.x;
    road.z = snapped.z;
  }
  if (object) {
    object.position.set(road.x, 0, road.z);
    object.rotation.y = THREE.MathUtils.degToRad(road.rotation);
    object.scale.set(road.scaleX, 1, road.scaleZ);
    applyRoadStyle(object, road.color, road.opacity);
  }
  updateRoadEditorPanel();
  updateRoadLayoutPanel();
  if (persist) saveRoadState();
}

function deleteSelectedRoad() {
  if (!selectedRoadId) return;
  captureEditorHistory();
  const object = getRoadObject(selectedRoadId);
  if (object) layoutRoadGroup.remove(object);
  const index = layoutRoads.findIndex((road) => road.id === selectedRoadId);
  if (index >= 0) layoutRoads.splice(index, 1);
  selectedRoadId = null;
  updateRoadEditorPanel();
  updateRoadLayoutPanel();
  saveRoadState();
}

function createZoneBaseHelper(id, x, z) {
  const defaults = ZONE_BASE_DEFAULTS[id];
  if (!defaults || !layoutIslandGroup) return null;
  const helper = platformHelper(defaults.w, defaults.d, 0.22);
  helper.position.set(x, 0.09, z);
  helper.name = `zone_base_helper_${id}`;
  helper.userData.baseW = defaults.w;
  helper.userData.baseD = defaults.d;
  helper.rotation.y = THREE.MathUtils.degToRad(zoneRotationValues.get(id) ?? 0);
  layoutIslandGroup.add(helper);
  zoneBaseHelpers.set(id, helper);
  zoneBaseValues.set(id, { w: defaults.w, d: defaults.d });
  return helper;
}

function setZoneBaseSize(id, w, d, persist = true) {
  const helper = zoneBaseHelpers.get(id);
  if (!helper) return;
  const values = {
    w: Number(w.toFixed(2)),
    d: Number(d.toFixed(2))
  };
  zoneBaseValues.set(id, values);
  helper.scale.x = values.w / helper.userData.baseW;
  helper.scale.z = values.d / helper.userData.baseD;
  const position = zonePositionValues.get(id);
  if (position) {
    const snapped = snapZonePosition(position.x, position.z, id);
    setZonePosition(id, snapped.x, snapped.z);
  }
  updateZoneBasePanel(id);
  if (persist) saveLayoutState();
}

function addRoadBetween(parent, x1, z1, x2, z2, width = 1.02, name = "road_straight") {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const rot = Math.atan2(dz, dx);
  return addRoad(parent, cx, cz, length + width * 0.12, width, rot, {
    lanes: false,
    radius: 0.16,
    name
  });
}

function addRoadNode(parent, x, z, radius = 0.56) {
  const node = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.035, 40), mats.road);
  node.position.set(x, 0.065, z);
  node.name = "road_turn";
  node.receiveShadow = true;
  parent.add(node);
  return node;
}

function buildNikeCityRoads(zone) {
  const roads = new THREE.Group();
  roads.name = "nikeCityRoads";
  scene.add(roads);

  const width = 0.82;
  const segments = [
    [-4.45, -8.75, -2.7, -6.35, "road_soccer_left_top"],
    [-2.7, -6.35, -2.85, -4.35, "road_soccer_left_drop"],
    [1.45, -8.65, -0.25, -6.2, "road_soccer_right_top"],
    [-0.25, -6.2, -0.25, -4.25, "road_soccer_right_drop"],

    [-9.2, -4.35, -6.35, -2.15, "road_running_outer_top"],
    [-6.35, -2.15, -3.55, 0.3, "road_running_outer_mid"],
    [-3.55, 0.3, -1.65, 1.9, "road_left_to_plaza"],
    [-2.85, -4.35, -1.3, -2.6, "road_soccer_to_plaza_left"],
    [-0.25, -4.25, 1.35, -2.55, "road_soccer_to_plaza_right"],

    [-1.65, 1.9, 0.35, -0.45, "road_plaza_diamond_left_top"],
    [0.35, -0.45, 2.35, 1.55, "road_plaza_diamond_right_top"],
    [2.35, 1.55, 0.85, 3.92, "road_plaza_diamond_right_bottom"],
    [0.85, 3.92, -1.65, 1.9, "road_plaza_diamond_left_bottom"],

    [-9.1, 1.8, -6.55, 3.05, "road_juvenil_entry"],
    [-6.55, 3.05, -4.15, 4.65, "road_juvenil_skate"],
    [-4.15, 4.65, -1.25, 6.75, "road_lower_left_main"],
    [-1.25, 6.75, 0.05, 8.95, "road_metro_left_main"],
    [-3.85, 8.8, -1.25, 6.75, "road_skate_to_metro"],

    [2.35, 1.55, 4.9, -0.1, "road_right_upper_main"],
    [4.9, -0.1, 7.0, -2.45, "road_basketball_outer"],
    [4.9, -0.1, 7.25, 2.05, "road_casual_upper_entry"],
    [7.25, 2.05, 10.25, 0.15, "road_casual_far"],
    [2.35, 1.55, 4.55, 3.65, "road_right_lower_main"],
    [4.55, 3.65, 6.55, 5.75, "road_parking_upper_entry"],
    [6.55, 5.75, 8.95, 8.1, "road_parking_exit"],
    [6.55, 5.75, 4.0, 8.55, "road_metro_right_entry"],
    [4.0, 8.55, 3.2, 10.8, "road_metro_right_exit"]
  ];

  segments.forEach(([x1, z1, x2, z2, name]) => addRoadBetween(roads, x1, z1, x2, z2, width, name));

  return roads;
}

function setupZoneRotationPanel() {
  if (!citySection || document.querySelector(".zone-rotation-panel")) return;

  const zones = [
    ["soccer", "Soccer"],
    ["running", "Running"],
    ["basketball", "Basketball"],
    ["juvenil", "Juvenil"],
    ["central", "Plaza Central"],
    ["casual", "Casual"],
    ["skate", "Skate Park"],
    ["metro", "Metro"],
    ["parking", "Estacionamiento"]
  ];

  const editorStack = document.createElement("div");
  editorStack.className = "editor-panel-stack";
  let assetPanel = null;
  let roadPanel = null;
  let savePanel = null;

  const panel = document.createElement("aside");
  panel.className = "zone-rotation-panel is-collapsed";
  panel.innerHTML = `
    <div class="rotation-panel-head">
      <strong>Layout de zonas</strong>
      <span>Snap ${LAYOUT_SNAP}</span>
      <button class="layout-panel-toggle" type="button" aria-label="Mostrar panel">+</button>
    </div>
    <p class="rotation-panel-note">Arrastra cada zona en el mapa y ajusta su giro con la barra.</p>
    <div class="rotation-controls"></div>
    <div class="island-builder">
      <strong>Islas</strong>
      <div class="island-type-list">
        ${Object.entries(ISLAND_TYPES).map(([id, item]) => `<button type="button" data-island-type="${id}">${item.label}</button>`).join("")}
      </div>
      <small class="island-builder-status">Selecciona una isla y haz click en el mapa.</small>
      <small class="island-count">0 islas colocadas</small>
      <div class="island-editor is-empty">
        <span class="tool-subtitle">Isla seleccionada</span>
        <small class="island-editor-empty">Haz click en una isla para editarla.</small>
        <label>Largo <input type="range" min="0.5" max="4" step="0.05" data-island-edit="w"><output data-island-output="w">0</output></label>
        <label>Ancho <input type="range" min="0.5" max="4" step="0.05" data-island-edit="d"><output data-island-output="d">0</output></label>
        <label>Giro <input type="range" min="-180" max="180" step="1" data-island-edit="rotation"><output data-island-output="rotation">0°</output></label>
        <button class="delete-island" type="button">Borrar isla</button>
      </div>
    </div>
    <div class="asset-builder">
      <strong>Assets</strong>
      <div class="asset-categories">${groupedAssetButtons()}</div>
      <small class="asset-builder-status">Selecciona un asset y haz click en el mapa.</small>
      <small class="asset-count">0 assets colocados</small>
      <div class="asset-editor is-empty">
        <span class="tool-subtitle">Asset seleccionado</span>
        <small class="asset-editor-empty">Haz click en un asset para editarlo.</small>
        <label>Escala <input type="range" min="0.35" max="2.8" step="0.05" data-asset-edit="scale"><output data-asset-output="scale">0</output></label>
        <label>Largo <input type="range" min="0.2" max="4.5" step="0.05" data-asset-edit="scaleX"><output data-asset-output="scaleX">0</output></label>
        <label>Ancho <input type="range" min="0.2" max="4.5" step="0.05" data-asset-edit="scaleZ"><output data-asset-output="scaleZ">0</output></label>
        <label>Altura <input type="range" min="0.1" max="10" step="0.05" data-asset-edit="y"><output data-asset-output="y">0</output></label>
        <label>Giro <input type="range" min="-180" max="180" step="1" data-asset-edit="rotation"><output data-asset-output="rotation">0°</output></label>
        <label>Flip <input type="range" min="-1" max="1" step="2" data-asset-edit="flip"><output data-asset-output="flip">Normal</output></label>
        <button class="duplicate-asset" type="button">Duplicar asset</button>
        <button class="delete-asset" type="button">Borrar asset</button>
      </div>
    </div>
    <div class="road-builder">
      <strong>Calles</strong>
      <div class="road-type-list">
        ${Object.entries(ROAD_TYPES).map(([id, item]) => `<button type="button" data-road-type="${id}">${item.label}</button>`).join("")}
      </div>
      <small class="road-builder-status">Selecciona una calle y haz click en el mapa.</small>
      <small class="road-count">0 calles colocadas</small>
      <div class="road-editor is-empty">
        <span class="tool-subtitle">Calle seleccionada</span>
        <small class="road-editor-empty">Haz click en una calle para editarla.</small>
        <label>Largo <input type="range" min="0.25" max="5" step="0.05" data-road-edit="scaleX"><output data-road-output="scaleX">0</output></label>
        <label>Ancho <input type="range" min="0.25" max="4" step="0.05" data-road-edit="scaleZ"><output data-road-output="scaleZ">0</output></label>
        <label>Giro <input type="range" min="-180" max="180" step="1" data-road-edit="rotation"><output data-road-output="rotation">0°</output></label>
        <label>Opacidad <input type="range" min="0.08" max="1" step="0.02" data-road-edit="opacity"><output data-road-output="opacity">1</output></label>
        <div class="road-color-picker" aria-label="Color de calle">
          ${Object.entries(ROAD_COLOR_OPTIONS).map(([id, item]) => `<button type="button" data-road-color="${id}" style="--swatch:${item.color.toString(16).padStart(6, "0")}">${item.label}</button>`).join("")}
        </div>
        <button class="delete-road" type="button">Borrar calle</button>
      </div>
      <div class="road-actions">
        <button class="copy-road-values" type="button">Copiar calles</button>
        <button class="clear-road-values" type="button">Limpiar calles</button>
      </div>
    </div>
    <div class="zone-base-builder">
      <strong>Bases de zonas</strong>
      <select class="zone-base-select" aria-label="Seleccionar zona base">
        ${zones.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}
      </select>
      <label>Largo <input type="range" min="1.8" max="7" step="0.05" data-zone-base-edit="w"><output data-zone-base-output="w">0</output></label>
      <label>Ancho <input type="range" min="1.4" max="5.2" step="0.05" data-zone-base-edit="d"><output data-zone-base-output="d">0</output></label>
    </div>
    <div class="layout-actions">
      <button class="copy-rotation-values" type="button">Copiar valores</button>
      <button class="refresh-layout-values" type="button">Refresh all</button>
    </div>
  `;

  const setEditorPanelCollapsed = (targetPanel, collapsed) => {
    if (!targetPanel) return;
    targetPanel.classList.toggle("is-collapsed", collapsed);
    const toggle = targetPanel.querySelector(".layout-panel-toggle, .road-panel-toggle, .asset-panel-toggle, .save-panel-toggle");
    if (toggle) toggle.textContent = collapsed ? "+" : "−";
  };

  const openEditorPanel = (targetPanel) => {
    [panel, roadPanel, assetPanel, savePanel].forEach((item) => {
      setEditorPanelCollapsed(item, item !== targetPanel);
    });
  };

  const controlsList = panel.querySelector(".rotation-controls");
  zones.forEach(([id, label]) => {
    zoneRotationValues.set(id, zoneRotationValues.get(id) ?? 0);
    const row = document.createElement("label");
    row.className = "rotation-control";
    row.dataset.zoneLayoutRow = id;
    const position = zonePositionValues.get(id) || { x: 0, z: 0 };
    row.innerHTML = `
      <span>${label}</span>
      <input type="range" min="-180" max="180" step="1" value="${zoneRotationValues.get(id)}" data-zone-rotation="${id}">
      <output>${zoneRotationValues.get(id)}°</output>
      <small data-zone-position="${id}">x ${position.x.toFixed(2)} / z ${position.z.toFixed(2)}</small>
    `;
    controlsList.appendChild(row);
  });

  panel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    if (controls) controls.enabled = false;
  });
  panel.addEventListener("pointerup", () => {
    if (controls) controls.enabled = true;
  });
  panel.addEventListener("pointerleave", () => {
    if (controls) controls.enabled = true;
  });

  panel.querySelectorAll("[data-zone-rotation]").forEach((input) => {
    input.addEventListener("input", () => {
      const degrees = Number(input.value);
      input.nextElementSibling.textContent = `${degrees}°`;
      setZoneRotation(input.dataset.zoneRotation, degrees);
    });
  });

  panel.querySelector(".layout-panel-toggle").addEventListener("click", () => {
    if (panel.classList.contains("is-collapsed")) {
      openEditorPanel(panel);
    } else {
      setEditorPanelCollapsed(panel, true);
    }
  });

  panel.querySelectorAll("[data-island-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = selectedIslandType === button.dataset.islandType;
      selectedIslandType = isActive ? null : button.dataset.islandType;
      selectedAssetType = null;
      selectedRoadType = null;
      panel.querySelectorAll("[data-asset-type]").forEach((item) => item.classList.remove("is-active"));
      panel.querySelectorAll("[data-road-type]").forEach((item) => item.classList.remove("is-active"));
      panel.querySelectorAll("[data-island-type]").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.islandType === selectedIslandType);
      });
      const status = panel.querySelector(".island-builder-status");
      if (status) {
        status.textContent = selectedIslandType
          ? `${ISLAND_TYPES[selectedIslandType].label}: click en el mapa para colocar.`
          : "Selecciona una isla y haz click en el mapa.";
      }
    });
  });

  panel.querySelectorAll("[data-asset-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = selectedAssetType === button.dataset.assetType;
      setAssetCreationType(isActive ? null : button.dataset.assetType);
    });
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", button.dataset.assetType);
      event.dataTransfer?.setData("application/x-nike-city-asset", button.dataset.assetType);
      event.dataTransfer.effectAllowed = "copy";
    });
  });

  const setRoadCreationType = (typeId) => {
    selectedRoadType = typeId;
    selectedIslandType = null;
    selectedAssetType = null;
    panel.querySelectorAll("[data-island-type]").forEach((item) => item.classList.remove("is-active"));
    panel.querySelectorAll("[data-asset-type]").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll("[data-road-type]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.roadType === selectedRoadType);
    });
    const status = document.querySelector(".road-builder-status");
    if (status) {
      status.textContent = selectedRoadType
        ? `${ROAD_TYPES[selectedRoadType].label}: click en el mapa para colocar.`
        : "Selecciona una calle y haz click en el mapa.";
    }
  };

  panel.querySelectorAll("[data-road-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = selectedRoadType === button.dataset.roadType;
      setRoadCreationType(isActive ? null : button.dataset.roadType);
    });
  });

  panel.querySelectorAll("[data-island-edit]").forEach((input) => {
    input.addEventListener("pointerdown", captureEditorHistory);
    input.addEventListener("input", () => {
      if (!selectedIslandId) return;
      const island = getIslandData(selectedIslandId);
      if (!island) return;
      const key = input.dataset.islandEdit;
      updateLayoutIsland(selectedIslandId, { [key]: Number(input.value) });
    });
  });

  panel.querySelector(".delete-island").addEventListener("click", deleteSelectedIsland);

  panel.querySelectorAll("[data-asset-edit]").forEach((input) => {
    input.addEventListener("pointerdown", captureEditorHistory);
    input.addEventListener("input", () => {
      if (!selectedAssetId) return;
      const key = input.dataset.assetEdit;
      updateLayoutAsset(selectedAssetId, { [key]: Number(input.value) });
    });
  });

  panel.querySelector(".delete-asset").addEventListener("click", deleteSelectedAsset);
  panel.querySelector(".duplicate-asset").addEventListener("click", duplicateSelectedAsset);

  panel.querySelectorAll("[data-road-edit]").forEach((input) => {
    input.addEventListener("pointerdown", captureEditorHistory);
    input.addEventListener("input", () => {
      if (!selectedRoadId) return;
      const key = input.dataset.roadEdit;
      updateLayoutRoad(selectedRoadId, { [key]: Number(input.value) });
    });
  });

  panel.querySelectorAll("[data-road-color]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!selectedRoadId) return;
      captureEditorHistory();
      updateLayoutRoad(selectedRoadId, { color: button.dataset.roadColor });
    });
  });

  panel.querySelector(".delete-road").addEventListener("click", deleteSelectedRoad);

  panel.querySelector(".copy-road-values").addEventListener("click", async () => {
    const text = JSON.stringify(getRoadState(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      panel.classList.add("is-copied");
      setTimeout(() => panel.classList.remove("is-copied"), 900);
    } catch {
      console.table(getRoadState());
    }
  });

  panel.querySelector(".clear-road-values").addEventListener("click", () => {
    captureEditorHistory();
    layoutRoadGroup?.clear();
    layoutRoads.splice(0, layoutRoads.length);
    selectedRoadId = null;
    roadIdCounter = 0;
    saveRoadState();
    updateRoadLayoutPanel();
    updateRoadEditorPanel();
  });


  const zoneBaseSelect = panel.querySelector(".zone-base-select");
  zoneBaseSelect.addEventListener("change", () => updateZoneBasePanel(zoneBaseSelect.value));
  panel.querySelectorAll("[data-zone-base-edit]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = zoneBaseSelect.value;
      const values = zoneBaseValues.get(id) || ZONE_BASE_DEFAULTS[id];
      const next = { ...values, [input.dataset.zoneBaseEdit]: Number(input.value) };
      setZoneBaseSize(id, next.w, next.d);
    });
  });

  panel.querySelector(".copy-rotation-values").addEventListener("click", async () => {
    const text = JSON.stringify(getLayoutState(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      panel.classList.add("is-copied");
      setTimeout(() => panel.classList.remove("is-copied"), 900);
    } catch {
      console.table(getLayoutState());
    }
  });

  panel.querySelector(".refresh-layout-values").addEventListener("click", refreshLayoutState);

  citySection.appendChild(editorStack);
  editorStack.appendChild(panel);
  const roadBuilder = panel.querySelector(".road-builder");
  if (roadBuilder) {
    roadPanel = document.createElement("aside");
    roadPanel.className = "road-tools-panel is-collapsed";
    roadPanel.innerHTML = `
      <div class="rotation-panel-head">
        <strong>Calles</strong>
        <span>Editor vial</span>
        <button class="road-panel-toggle" type="button" aria-label="Mostrar calles">+</button>
      </div>
      <div class="road-panel-body"></div>
    `;
    roadPanel.querySelector(".road-panel-body").appendChild(roadBuilder);
    roadPanel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      if (controls) controls.enabled = false;
    });
    roadPanel.addEventListener("pointerup", () => {
      if (controls) controls.enabled = true;
    });
    roadPanel.addEventListener("pointerleave", () => {
      if (controls) controls.enabled = true;
    });
    roadPanel.querySelector(".road-panel-toggle").addEventListener("click", () => {
      if (roadPanel.classList.contains("is-collapsed")) {
        openEditorPanel(roadPanel);
      } else {
        setEditorPanelCollapsed(roadPanel, true);
      }
    });
    editorStack.appendChild(roadPanel);
  }
  const assetBuilder = panel.querySelector(".asset-builder");
  if (assetBuilder) {
    assetPanel = document.createElement("aside");
    assetPanel.className = "asset-tools-panel is-collapsed";
    assetPanel.innerHTML = `
      <div class="rotation-panel-head">
        <strong>Assets</strong>
        <span>Props GLB</span>
        <button class="asset-panel-toggle" type="button" aria-label="Mostrar assets">+</button>
      </div>
      <div class="asset-panel-body"></div>
    `;
    assetPanel.querySelector(".asset-panel-body").appendChild(assetBuilder);
    assetPanel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      if (controls) controls.enabled = false;
    });
    assetPanel.addEventListener("pointerup", () => {
      if (controls) controls.enabled = true;
    });
    assetPanel.addEventListener("pointerleave", () => {
      if (controls) controls.enabled = true;
    });
    assetPanel.querySelector(".asset-panel-toggle").addEventListener("click", () => {
      if (assetPanel.classList.contains("is-collapsed")) {
        openEditorPanel(assetPanel);
      } else {
        setEditorPanelCollapsed(assetPanel, true);
      }
    });
    editorStack.appendChild(assetPanel);
  }
  savePanel = document.createElement("aside");
  savePanel.className = "editor-save-panel is-collapsed";
  savePanel.innerHTML = `
    <div class="rotation-panel-head">
      <strong>Guardado</strong>
      <span>Estado total</span>
      <button class="save-panel-toggle" type="button" aria-label="Mostrar guardado">+</button>
    </div>
    <div class="save-panel-body">
      <button class="save-all-editor-values" type="button">Guardar todo</button>
      <button class="copy-all-editor-values" type="button">Copiar todo JSON</button>
      <button class="import-all-editor-values" type="button">Importar JSON</button>
      <small class="editor-save-summary">Zonas, islas, assets y calles</small>
    </div>
  `;
  savePanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    if (controls) controls.enabled = false;
  });
  savePanel.addEventListener("pointerup", () => {
    if (controls) controls.enabled = true;
  });
  savePanel.addEventListener("pointerleave", () => {
    if (controls) controls.enabled = true;
  });
  savePanel.querySelector(".save-panel-toggle").addEventListener("click", () => {
    if (savePanel.classList.contains("is-collapsed")) {
      openEditorPanel(savePanel);
    } else {
      setEditorPanelCollapsed(savePanel, true);
    }
  });
  savePanel.querySelector(".save-all-editor-values").addEventListener("click", (event) => {
    saveAllEditorState(event.currentTarget);
  });
  savePanel.querySelector(".copy-all-editor-values").addEventListener("click", async (event) => {
    persistEditorStateNow();
    const text = JSON.stringify(getEditorSnapshot(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      const button = event.currentTarget;
      const originalText = button.textContent;
      button.textContent = "Copiado";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    } catch {
      console.table(getEditorSnapshot());
    }
  });
  savePanel.querySelector(".import-all-editor-values").addEventListener("click", showEditorImportModal);
  editorStack.appendChild(savePanel);
  updateZoneBasePanel(zones[0][0]);
  updateAssetLayoutPanel();
  updateAssetEditorPanel();
  updateRoadLayoutPanel();
  updateRoadEditorPanel();
}

function updateZoneLayoutPanel(id) {
  const position = zonePositionValues.get(id);
  if (!position) return;
  const output = document.querySelector(`[data-zone-position="${id}"]`);
  if (output) {
    output.textContent = `x ${position.x.toFixed(2)} / z ${position.z.toFixed(2)}`;
  }
}

function updateIslandLayoutPanel() {
  const output = document.querySelector(".island-count");
  if (output) {
    output.textContent = `${layoutIslands.length} ${layoutIslands.length === 1 ? "isla colocada" : "islas colocadas"}`;
  }
  updateEditorSaveSummary();
}

function updateIslandEditorPanel() {
  const editor = document.querySelector(".island-editor");
  if (!editor) return;
  const island = selectedIslandId ? getIslandData(selectedIslandId) : null;
  editor.classList.toggle("is-empty", !island);
  editor.querySelectorAll("[data-island-edit]").forEach((input) => {
    const key = input.dataset.islandEdit;
    input.disabled = !island;
    if (island) input.value = island[key];
  });
  editor.querySelectorAll("[data-island-output]").forEach((output) => {
    const key = output.dataset.islandOutput;
    if (!island) {
      output.textContent = key === "rotation" ? "0°" : "0";
    } else {
      output.textContent = key === "rotation" ? `${island[key]}°` : island[key].toFixed(2);
    }
  });
}

function updateAssetLayoutPanel() {
  const output = document.querySelector(".asset-count");
  if (output) {
    output.textContent = `${layoutAssets.length} ${layoutAssets.length === 1 ? "asset colocado" : "assets colocados"}`;
  }
  updateEditorSaveSummary();
}

function updateAssetEditorPanel() {
  const editor = document.querySelector(".asset-editor");
  if (!editor) return;
  const asset = selectedAssetId ? getAssetData(selectedAssetId) : null;
  editor.classList.toggle("is-empty", !asset);
  editor.querySelectorAll("[data-asset-edit]").forEach((input) => {
    const key = input.dataset.assetEdit;
    input.disabled = !asset;
    if (asset) input.value = asset[key];
  });
  editor.querySelectorAll("[data-asset-output]").forEach((output) => {
    const key = output.dataset.assetOutput;
    if (!asset) {
      output.textContent = key === "rotation" ? "0°" : key === "flip" ? "Normal" : "0";
    } else {
      output.textContent = key === "rotation"
        ? `${asset[key]}°`
        : key === "flip"
          ? (asset[key] < 0 ? "Invertido" : "Normal")
          : (asset[key] ?? asset.scale).toFixed(2);
    }
  });
}

function updateRoadLayoutPanel() {
  const output = document.querySelector(".road-count");
  if (output) {
    output.textContent = `${layoutRoads.length} ${layoutRoads.length === 1 ? "calle colocada" : "calles colocadas"}`;
  }
  updateEditorSaveSummary();
}

function updateEditorSaveSummary() {
  const output = document.querySelector(".editor-save-summary");
  if (!output) return;
  output.textContent = `${layoutIslands.length} islas · ${layoutAssets.length} assets · ${layoutRoads.length} calles`;
}

function updateRoadEditorPanel() {
  const editor = document.querySelector(".road-editor");
  if (!editor) return;
  const road = selectedRoadId ? getRoadData(selectedRoadId) : null;
  editor.classList.toggle("is-empty", !road);
  editor.querySelectorAll("[data-road-edit]").forEach((input) => {
    const key = input.dataset.roadEdit;
    input.disabled = !road;
    if (road) input.value = road[key];
  });
  editor.querySelectorAll("[data-road-output]").forEach((output) => {
    const key = output.dataset.roadOutput;
    if (!road) {
      output.textContent = key === "rotation" ? "0°" : "0";
    } else {
      output.textContent = key === "rotation" ? `${road[key]}°` : road[key].toFixed(2);
    }
  });
  editor.querySelectorAll("[data-road-color]").forEach((button) => {
    const active = !!road && (road.color || "asphalt") === button.dataset.roadColor;
    button.classList.toggle("is-active", active);
    button.disabled = !road;
  });
}

function updateZoneBasePanel(id) {
  const values = zoneBaseValues.get(id) || ZONE_BASE_DEFAULTS[id];
  if (!values) return;
  document.querySelectorAll("[data-zone-base-edit]").forEach((input) => {
    const key = input.dataset.zoneBaseEdit;
    input.value = values[key];
  });
  document.querySelectorAll("[data-zone-base-output]").forEach((output) => {
    const key = output.dataset.zoneBaseOutput;
    output.textContent = values[key].toFixed(2);
  });
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
  addSceneObject(group);
  return group;
}

function nikeStore(x, z, w, d, h, rot = 0, roof = "flat") {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  group.rotation.y = rot;
  addSceneObject(group);

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
  addSceneObject(group);
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
  addSceneObject(cone);
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
  addSceneObject(group);
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
  addSceneObject(ring);
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
  addSceneObject(cone);
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
    addSceneObject(tip);
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
  addSceneObject(group);

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
      registerZoneRoot("central", plaza);
      scene.add(plaza);
    },
    undefined,
    () => {
      buildRotatableZone("central", x, z, () => buildProceduralCentralPlaza(x, z));
    }
  );
}

function loadZoneModel({ url, id, name, x, z, y = 0.25, scale = 1, rotationY = 0, fallback }) {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      const zoneModel = gltf.scene;
      zoneModel.name = name;
      zoneModel.position.set(x, y, z);
      zoneModel.rotation.y = rotationY;
      zoneModel.scale.setScalar(scale);
      zoneModel.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });
      registerZoneRoot(id, zoneModel);
      scene.add(zoneModel);
    },
    undefined,
    () => {
      fallback?.();
    }
  );
}

function loadBlenderEstacionamiento(x, z) {
  loadZoneModel({
    url: ESTACIONAMIENTO_GLB,
    id: "parking",
    name: "zona_estacionamiento",
    x,
    z,
    fallback: () => buildRotatableZone("parking", x, z, () => buildProceduralEstacionamiento(x, z))
  });
}

function loadBlenderMetro(x, z) {
  loadZoneModel({
    url: METRO_GLB,
    id: "metro",
    name: "zona_metro",
    x,
    z,
    fallback: () => buildRotatableZone("metro", x, z, () => buildProceduralMetro(x, z))
  });
}

function loadBlenderRunning(x, z) {
  loadZoneModel({
    url: RUNNING_GLB,
    id: "running",
    name: "zona_running",
    x,
    z,
    fallback: () => buildRotatableZone("running", x, z, () => buildProceduralRunning(x, z))
  });
}

function loadBlenderSoccer(x, z) {
  loadZoneModel({
    url: SOCCER_GLB,
    id: "soccer",
    name: "zona_soccer",
    x,
    z,
    fallback: () => buildRotatableZone("soccer", x, z, () => buildProceduralSoccer(x, z))
  });
}

function loadBlenderBasketball(x, z) {
  loadZoneModel({
    url: BASKETBALL_GLB,
    id: "basketball",
    name: "zona_basketball",
    x,
    z,
    fallback: () => buildRotatableZone("basketball", x, z, () => buildProceduralBasketball(x, z))
  });
}

function loadBlenderCasual(x, z) {
  loadZoneModel({
    url: CASUAL_GLB,
    id: "casual",
    name: "zona_casual",
    x,
    z,
    fallback: () => buildRotatableZone("casual", x, z, () => buildProceduralCasual(x, z))
  });
}

function loadBlenderJuvenil(x, z) {
  loadZoneModel({
    url: JUVENIL_GLB,
    id: "juvenil",
    name: "zona_juvenil",
    x,
    z,
    fallback: () => buildRotatableZone("juvenil", x, z, () => buildProceduralJuvenil(x, z))
  });
}

function loadBlenderSkate(x, z) {
  loadZoneModel({
    url: SKATE_GLB,
    id: "skate",
    name: "zona_skate",
    x,
    z,
    fallback: () => buildRotatableZone("skate", x, z, () => buildProceduralSkate(x, z))
  });
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

function buildProceduralEstacionamiento(x, z) {
  platform(x, z, 3.55, 2.45);
  nikeStore(x, z, 2.35, 1.25, 0.74, 0, "black");
  box(1.4, 0.08, 0.58, mats.yellow, x, 1.02, z);
  decoratePlatform(x, z, 3.55, 2.45);
}

function buildProceduralRunning(x, z) {
  platform(x, z, 4.3, 3.05);
  runningTrack(x, z);
  nikeStore(x, z + 0.08, 1.45, 0.95, 0.75, 0.05, "black");
  decoratePlatform(x, z, 4.3, 3.05);
}

function buildProceduralSoccer(x, z) {
  platform(x, z, 4.9, 3.25);
  nikeStore(x, z, 3.15, 2.02, 0.92, 0, "flat");
  court(x, z + 0.03, 2.42, 1.44, "soccer");
  decoratePlatform(x, z, 4.9, 3.25);
}

function buildProceduralBasketball(x, z) {
  platform(x, z, 3.75, 2.55);
  nikeStore(x, z, 2.35, 1.45, 0.72);
  court(x, z, 2.0, 1.16, "basketball");
  decoratePlatform(x, z, 3.75, 2.55);
}

function buildProceduralCasual(x, z) {
  platform(x, z, 3.55, 2.38);
  nikeStore(x, z, 2.35, 1.3, 0.72, 0.03, "black");
  box(0.78, 0.12, 0.35, mats.black, x, 1.02, z);
  decoratePlatform(x, z, 3.55, 2.38);
}

function buildProceduralJuvenil(x, z) {
  platform(x, z, 4.25, 3.08);
  nikeStore(x - 1.15, z - 0.3, 1.15, 0.9, 0.72, 0.05, "black");
  nikeStore(x + 0.2, z + 0.25, 1.0, 0.85, 0.72, 0.05, "black");
  nikeStore(x + 1.25, z - 0.22, 0.9, 0.8, 0.58, 0.05, "black");
  cyl(0.62, 0.64, mats.white, x + 0.25, 0.25, z - 1.05);
  cyl(0.46, 0.08, mats.yellow, x + 0.25, 0.94, z - 1.05);
  decoratePlatform(x, z, 4.25, 3.08);
}

function buildProceduralSkate(x, z) {
  platform(x, z, 4.15, 2.25);
  box(1.8, 0.2, 1.15, mats.white, x, 0.27, z);
  box(1.35, 0.08, 0.72, mats.yellow, x, 0.5, z);
  box(1.0, 0.06, 0.48, mats.road, x, 0.61, z);
  decoratePlatform(x, z, 4.15, 2.25);
}

function buildProceduralMetro(x, z) {
  platform(x, z, 2.95, 2.12);
  metroStation(x, z - 0.12);
  tree(x - 0.9, z + 0.54, true);
  tree(x + 0.82, z + 0.48, true);
  lamp(x - 0.72, z - 0.68);
  lamp(x + 0.7, z - 0.66);
  bench(x + 0.56, z + 0.68, -0.25);
}

function metroStation(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.25, z);
  group.scale.setScalar(1.18);
  addSceneObject(group);

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
  el.className = `zone-label zone-${zone.id}`;
  el.dataset.zone = zone.id;
  el.style.setProperty("--stem", `${zone.stem || 82}px`);
  el.innerHTML = `<span class="icon">${zone.icon}</span><span class="copy"><strong>${zone.name}</strong><span>${zone.coords}</span></span>`;
  labelLayer.appendChild(el);
  el.addEventListener("click", () => {
    setActive(zone.id);
    focusCameraOnZone(zone.id);
  });
  labels.push({ ...zone, element: el, world: new THREE.Vector3(zone.x, zone.y || 1.5, zone.z) });
  const position = zonePositionValues.get(zone.id);
  if (position) {
    zoneLabelOffsets.set(zone.id, {
      x: zone.x - position.x,
      y: zone.y || 1.5,
      z: zone.z - position.z
    });
  }
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

function createCinematicFocusHud() {
  if (cinematicFocusHud || !citySection) return cinematicFocusHud;
  cinematicFocusHud = document.createElement("aside");
  cinematicFocusHud.className = "cinematic-zone-hud";
  cinematicFocusHud.innerHTML = `
    <span>Distrito activo</span>
    <strong>Plaza Central</strong>
    <p>Centro de experiencias, rutas y recompensas de Nike City.</p>
    <button type="button">Explorar plaza</button>
  `;
  citySection.appendChild(cinematicFocusHud);
  return cinematicFocusHud;
}

function createCinematicFocusGlow() {
  if (cinematicFocusGlow) return cinematicFocusGlow;
  const glow = new THREE.Group();
  glow.name = "plaza_central_cinematic_glow";
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(3.35, 96),
    new THREE.MeshBasicMaterial({
      color: 0xf7bd00,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  disk.rotation.x = -Math.PI / 2;
  disk.position.y = 0.042;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.45, 3.18, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.048;
  glow.add(disk, ring);
  glow.userData.disk = disk;
  glow.userData.ring = ring;
  glow.visible = false;
  scene.add(glow);
  cinematicFocusGlow = glow;
  return glow;
}

function setCameraPose(pose) {
  camera.position.set(pose.x, pose.y, pose.z);
  controls.target.set(pose.tx, pose.ty, pose.tz);
  camera.zoom = pose.zoom;
  camera.updateProjectionMatrix();
  controls.update();
  projectLabels();
}

function resetCinematicFocus() {
  citySection?.classList.remove("is-cinematic-focus");
  if (cinematicFocusHud) gsap.to(cinematicFocusHud, { autoAlpha: 0, y: 18, duration: 0.28, ease: "power3.out" });
  if (cinematicFocusGlow) {
    gsap.killTweensOf([cinematicFocusGlow.scale, cinematicFocusGlow.userData.disk?.material, cinematicFocusGlow.userData.ring?.material]);
    cinematicFocusGlow.visible = false;
  }
}

function focusCameraOnZone(id) {
  if (id !== "central" || !camera || !controls) {
    resetCinematicFocus();
    return;
  }
  const position = zonePositionValues.get(id);
  if (!position) return;
  const hud = createCinematicFocusHud();
  const glow = createCinematicFocusGlow();
  const disk = glow.userData.disk;
  const ring = glow.userData.ring;
  const focus = { x: position.x, y: 0.72, z: position.z };
  const pose = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    tx: controls.target.x,
    ty: controls.target.y,
    tz: controls.target.z,
    zoom: camera.zoom
  };
  const updatePose = () => setCameraPose(pose);

  cinematicFocusTl?.kill();
  gsap.killTweensOf([pose, glow.scale, disk.material, ring.material, hud]);
  citySection?.classList.add("is-cinematic-focus");
  glow.position.set(focus.x, 0.05, focus.z);
  glow.scale.setScalar(0.78);
  glow.visible = true;
  disk.material.opacity = 0;
  ring.material.opacity = 0;
  gsap.set(hud, { autoAlpha: 0, y: 18 });

  cinematicFocusTl = gsap.timeline({
    defaults: { overwrite: true },
    onUpdate: updatePose,
    onComplete: () => {
      setCameraPose(pose);
    }
  });

  cinematicFocusTl
    .to(disk.material, { opacity: 0.13, duration: 0.42, ease: "power3.out" }, 0)
    .to(ring.material, { opacity: 0.58, duration: 0.42, ease: "power3.out" }, 0.04)
    .to(glow.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 1.18, ease: "power3.out" }, 0)
    .to(pose, {
      x: focus.x + 11.2,
      y: focus.y + 12.6,
      z: focus.z + 10.4,
      tx: focus.x + 2.35,
      ty: focus.y + 0.05,
      tz: focus.z - 0.35,
      zoom: 0.88,
      duration: 1.55,
      ease: "power3.inOut"
    }, 0.08)
    .to(pose, {
      x: focus.x + 7.35,
      y: focus.y + 8.15,
      z: focus.z + 6.95,
      tx: focus.x,
      ty: focus.y,
      tz: focus.z,
      zoom: 2.58,
      duration: 0.88,
      ease: "power4.out"
    }, ">-0.05")
    .to(pose, {
      x: focus.x + 7.75,
      y: focus.y + 8.55,
      z: focus.z + 7.25,
      zoom: 2.35,
      duration: 0.58,
      ease: "power3.inOut"
    }, ">-0.04")
    .to(ring.material, { opacity: 0.78, duration: 0.28, yoyo: true, repeat: 1, ease: "power3.out" }, ">-0.32")
    .to(hud, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power4.out" }, ">-0.12");
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

  if (SHOW_FLOOR_GRID) {
    const grid = new THREE.GridHelper(44, 44, 0xebd88c, 0xebd88c);
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    grid.position.y = 0.01;
    scene.add(grid);

    const technicalGrid = new THREE.GridHelper(TECH_GRID_SIZE, TECH_GRID_DIVISIONS, 0xf1c84a, 0xf1c84a);
    technicalGrid.name = "technical_snap_grid";
    technicalGrid.material.opacity = 0.22;
    technicalGrid.material.transparent = true;
    technicalGrid.position.y = 0.018;
    scene.add(technicalGrid);
  }

  layoutIslandGroup = new THREE.Group();
  layoutIslandGroup.name = "layout_islands";
  scene.add(layoutIslandGroup);
  layoutAssetGroup = new THREE.Group();
  layoutAssetGroup.name = "layout_assets";
  scene.add(layoutAssetGroup);
  layoutRoadGroup = new THREE.Group();
  layoutRoadGroup.name = "layout_roads";
  scene.add(layoutRoadGroup);

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

  Object.entries(zone).forEach(([id, position]) => {
    const savedZone = savedLayoutState?.zones?.[id];
    const savedBase = savedLayoutState?.bases?.[id];
    const nextPosition = {
      x: isFiniteNumber(savedZone?.x) ? savedZone.x : position.x,
      z: isFiniteNumber(savedZone?.z) ? savedZone.z : position.z
    };
    zone[id] = nextPosition;
    zonePositionValues.set(id, nextPosition);
    if (isFiniteNumber(savedZone?.rotation)) {
      zoneRotationValues.set(id, savedZone.rotation);
    }
    createZoneBaseHelper(id, nextPosition.x, nextPosition.z);
    if (isFiniteNumber(savedBase?.w) && isFiniteNumber(savedBase?.d)) {
      setZoneBaseSize(id, savedBase.w, savedBase.d, false);
    }
  });

  if (SHOW_LAYOUT_ISLANDS) {
    savedLayoutState?.islands?.forEach((island) => {
      if (!ISLAND_TYPES[island.type] || !isFiniteNumber(island.x) || !isFiniteNumber(island.z)) return;
      createLayoutIsland(island.type, island.x, island.z, {
        id: island.id,
        w: isFiniteNumber(island.w) ? island.w : undefined,
        d: isFiniteNumber(island.d) ? island.d : undefined,
        rotation: isFiniteNumber(island.rotation) ? island.rotation : undefined,
        select: false,
        persist: false
      });
    });
  }
  selectedIslandId = null;

  savedLayoutState?.assets?.forEach((asset) => {
    if (!ASSET_TYPES[asset.type] || !isFiniteNumber(asset.x) || !isFiniteNumber(asset.z)) return;
    createLayoutAsset(asset.type, asset.x, asset.z, {
      id: asset.id,
      scale: isFiniteNumber(asset.scale) ? asset.scale : undefined,
      scaleX: isFiniteNumber(asset.scaleX) ? asset.scaleX : undefined,
      scaleZ: isFiniteNumber(asset.scaleZ) ? asset.scaleZ : undefined,
      y: isFiniteNumber(asset.y) ? asset.y : undefined,
      flip: isFiniteNumber(asset.flip) ? asset.flip : undefined,
      rotation: isFiniteNumber(asset.rotation) ? asset.rotation : undefined,
      select: false,
      persist: false
    });
  });
  selectedAssetId = null;

  savedRoadState?.roads?.forEach((road) => {
    if (!ROAD_TYPES[road.type] || !isFiniteNumber(road.x) || !isFiniteNumber(road.z)) return;
    createLayoutRoad(road.type, road.x, road.z, {
      id: road.id,
      scaleX: isFiniteNumber(road.scaleX) ? road.scaleX : undefined,
      scaleZ: isFiniteNumber(road.scaleZ) ? road.scaleZ : undefined,
      rotation: isFiniteNumber(road.rotation) ? road.rotation : undefined,
      color: ROAD_COLOR_OPTIONS[road.color] ? road.color : undefined,
      opacity: isFiniteNumber(road.opacity) ? road.opacity : undefined,
      select: false,
      persist: false
    });
  });
  selectedRoadId = null;

  buildCityAtmosphere();

  if (SHOW_CITY_ROADS) {
    buildNikeCityRoads(zone);
  }

  if (USE_BLENDER_RUNNING) {
    loadBlenderRunning(zone.running.x, zone.running.z);
  } else {
    buildRotatableZone("running", zone.running.x, zone.running.z, () => buildProceduralRunning(zone.running.x, zone.running.z));
  }

  if (USE_BLENDER_SOCCER) {
    loadBlenderSoccer(zone.soccer.x, zone.soccer.z);
  } else {
    buildRotatableZone("soccer", zone.soccer.x, zone.soccer.z, () => buildProceduralSoccer(zone.soccer.x, zone.soccer.z));
  }

  if (USE_BLENDER_BASKETBALL) {
    loadBlenderBasketball(zone.basketball.x, zone.basketball.z);
  } else {
    buildRotatableZone("basketball", zone.basketball.x, zone.basketball.z, () => buildProceduralBasketball(zone.basketball.x, zone.basketball.z));
  }

  if (USE_BLENDER_JUVENIL) {
    loadBlenderJuvenil(zone.juvenil.x, zone.juvenil.z);
  } else {
    buildRotatableZone("juvenil", zone.juvenil.x, zone.juvenil.z, () => buildProceduralJuvenil(zone.juvenil.x, zone.juvenil.z));
  }

  if (USE_BLENDER_PLAZA_CENTRAL) {
    loadBlenderCentralPlaza(zone.central.x, zone.central.z);
  } else {
    buildRotatableZone("central", zone.central.x, zone.central.z, () => buildProceduralCentralPlaza(zone.central.x, zone.central.z));
  }

  if (USE_BLENDER_CASUAL) {
    loadBlenderCasual(zone.casual.x, zone.casual.z);
  } else {
    buildRotatableZone("casual", zone.casual.x, zone.casual.z, () => buildProceduralCasual(zone.casual.x, zone.casual.z));
  }

  if (USE_BLENDER_SKATE) {
    loadBlenderSkate(zone.skate.x, zone.skate.z);
  } else {
    buildRotatableZone("skate", zone.skate.x, zone.skate.z, () => buildProceduralSkate(zone.skate.x, zone.skate.z));
  }

  if (USE_BLENDER_METRO) {
    loadBlenderMetro(zone.metro.x, zone.metro.z);
  } else {
    buildRotatableZone("metro", zone.metro.x, zone.metro.z, () => buildProceduralMetro(zone.metro.x, zone.metro.z));
  }

  if (USE_BLENDER_ESTACIONAMIENTO) {
    loadBlenderEstacionamiento(zone.parking.x, zone.parking.z);
  } else {
    buildRotatableZone("parking", zone.parking.x, zone.parking.z, () => buildProceduralEstacionamiento(zone.parking.x, zone.parking.z));
  }

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
  setupZoneRotationPanel();
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
const layoutPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPoint = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
const panStartPointer = new THREE.Vector2();
const panStartCamera = new THREE.Vector3();
const panStartTarget = new THREE.Vector3();
let draggedZoneId = null;
let didDragZone = false;
let isSpaceDown = false;
let isScenePanning = false;

function updatePointerFromEvent(event) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return rect;
}

function findZoneIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.zoneRootId) return current.userData.zoneRootId;
    current = current.parent;
  }
  return null;
}

function getZoneHit(event) {
  updatePointerFromEvent(event);
  const roots = [
    ...Array.from(zoneRotatables.values()),
    ...Array.from(zoneBaseHelpers.entries()).map(([id, helper]) => {
      helper.userData.zoneRootId = id;
      return helper;
    })
  ];
  if (!roots.length) return null;
  const hits = raycaster.intersectObjects(roots, true);
  const hit = hits.find((item) => findZoneIdFromObject(item.object));
  if (!hit) return null;
  const id = findZoneIdFromObject(hit.object);
  return { id, root: zoneRotatables.get(id), point: hit.point };
}

function findIslandIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.layoutIslandId) return current.userData.layoutIslandId;
    current = current.parent;
  }
  return null;
}

function getIslandHit(event) {
  updatePointerFromEvent(event);
  if (!layoutIslandGroup?.children.length) return null;
  const hits = raycaster.intersectObjects(layoutIslandGroup.children, true);
  const hit = hits.find((item) => findIslandIdFromObject(item.object));
  if (!hit) return null;
  const id = findIslandIdFromObject(hit.object);
  return { id, mesh: getIslandMesh(id), point: hit.point };
}

function findAssetIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.layoutAssetId) return current.userData.layoutAssetId;
    current = current.parent;
  }
  return null;
}

function getAssetHit(event) {
  updatePointerFromEvent(event);
  if (!layoutAssetGroup?.children.length) return null;
  const hits = raycaster.intersectObjects(layoutAssetGroup.children, true);
  const hit = hits.find((item) => findAssetIdFromObject(item.object));
  if (!hit) return null;
  const id = findAssetIdFromObject(hit.object);
  return { id, object: getAssetObject(id), point: hit.point };
}

function findRoadIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.layoutRoadId) return current.userData.layoutRoadId;
    current = current.parent;
  }
  return null;
}

function getRoadHit(event) {
  updatePointerFromEvent(event);
  if (!layoutRoadGroup?.children.length) return null;
  const hits = raycaster.intersectObjects(layoutRoadGroup.children, true);
  const markingHit = hits.find((item) => {
    const id = findRoadIdFromObject(item.object);
    return id && isRoadMarkingType(getRoadData(id)?.type);
  });
  const hit = markingHit || hits.find((item) => findRoadIdFromObject(item.object));
  if (!hit) return null;
  const id = findRoadIdFromObject(hit.object);
  return { id, object: getRoadObject(id), point: hit.point };
}

function getLayoutPlanePoint(event) {
  updatePointerFromEvent(event);
  return raycaster.ray.intersectPlane(layoutPlane, dragPoint);
}

function startScenePan(event) {
  isScenePanning = true;
  didDragZone = true;
  panStartPointer.set(event.clientX, event.clientY);
  panStartCamera.copy(camera.position);
  panStartTarget.copy(controls.target);
  if (controls) controls.enabled = false;
  document.body.classList.add("is-layout-panning");
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function moveScenePan(event) {
  if (!isScenePanning || !controls) return;
  const rect = canvas.getBoundingClientRect();
  const worldPerPixel = (camera.top - camera.bottom) / (rect.height * camera.zoom);
  const dx = event.clientX - panStartPointer.x;
  const dy = event.clientY - panStartPointer.y;
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const movement = right.multiplyScalar(-dx * worldPerPixel).add(up.multiplyScalar(dy * worldPerPixel));
  camera.position.copy(panStartCamera).add(movement);
  controls.target.copy(panStartTarget).add(movement);
  controls.update();
  projectLabels();
  event.preventDefault();
  event.stopPropagation();
}

function endScenePan(event) {
  if (!isScenePanning) return;
  isScenePanning = false;
  if (controls) controls.enabled = true;
  document.body.classList.remove("is-layout-panning");
  canvas.releasePointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function startZoneDrag(event) {
  if (!canvas || event.button !== 0) return;
  if (isSpaceDown) {
    startScenePan(event);
    return;
  }
  if (selectedAssetType) {
    const created = createAssetFromEvent(selectedAssetType, event);
    if (created) {
      event.preventDefault();
      event.stopPropagation();
    }
    return;
  }
  const assetHit = getAssetHit(event);
  if (assetHit?.object) {
    captureEditorHistory();
    draggedAssetId = assetHit.id;
    didDragZone = false;
    selectLayoutAsset(assetHit.id);
    event.preventDefault();
    event.stopPropagation();
    const point = getLayoutPlanePoint(event) || assetHit.point;
    dragOffset.set(assetHit.object.position.x - point.x, 0, assetHit.object.position.z - point.z);
    if (controls) controls.enabled = false;
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  const islandHit = getIslandHit(event);
  if (islandHit?.mesh) {
    captureEditorHistory();
    draggedIslandId = islandHit.id;
    didDragZone = false;
    selectLayoutIsland(islandHit.id);
    event.preventDefault();
    event.stopPropagation();
    const point = getLayoutPlanePoint(event) || islandHit.point;
    dragOffset.set(islandHit.mesh.position.x - point.x, 0, islandHit.mesh.position.z - point.z);
    if (controls) controls.enabled = false;
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  const hit = getZoneHit(event);
  if (hit?.root) {
    captureEditorHistory();
    draggedZoneId = hit.id;
    didDragZone = false;
    setActive(hit.id);
    event.preventDefault();
    event.stopPropagation();
    const point = getLayoutPlanePoint(event) || hit.point;
    dragOffset.set(hit.root.position.x - point.x, 0, hit.root.position.z - point.z);
    if (controls) controls.enabled = false;
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  const roadHit = getRoadHit(event);
  if (roadHit?.object) {
    captureEditorHistory();
    draggedRoadId = roadHit.id;
    didDragZone = false;
    selectLayoutRoad(roadHit.id);
    event.preventDefault();
    event.stopPropagation();
    const point = getLayoutPlanePoint(event) || roadHit.point;
    dragOffset.set(roadHit.object.position.x - point.x, 0, roadHit.object.position.z - point.z);
    if (controls) controls.enabled = false;
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  if (selectedRoadType) {
    const point = getLayoutPlanePoint(event);
    if (point) {
      const snapped = snapRoadPosition(point.x, point.z, null, selectedRoadType);
      createLayoutRoad(
        selectedRoadType,
        snapped.x,
        snapped.z
      );
      event.preventDefault();
      event.stopPropagation();
    }
    return;
  }
  if (selectedIslandType) {
    const point = getLayoutPlanePoint(event);
    if (point) {
      createLayoutIsland(
        selectedIslandType,
        snapToLayoutGrid(point.x),
        snapToLayoutGrid(point.z)
      );
      event.preventDefault();
      event.stopPropagation();
    }
    return;
  }
}

function moveZoneDrag(event) {
  if (isScenePanning) {
    moveScenePan(event);
    return;
  }
  if (draggedIslandId) {
    const point = getLayoutPlanePoint(event);
    if (!point) return;
    const island = getIslandData(draggedIslandId);
    if (island) {
      updateLayoutIsland(draggedIslandId, {
        ...snapIslandPosition(point.x + dragOffset.x, point.z + dragOffset.z, island)
      });
    }
    didDragZone = true;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (draggedAssetId) {
    const point = getLayoutPlanePoint(event);
    if (!point) return;
    const asset = getAssetData(draggedAssetId);
    if (asset) {
      updateLayoutAsset(draggedAssetId, {
        ...snapAssetPosition(point.x + dragOffset.x, point.z + dragOffset.z, asset)
      });
    }
    didDragZone = true;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (draggedRoadId) {
    const point = getLayoutPlanePoint(event);
    if (!point) return;
    const road = getRoadData(draggedRoadId);
    if (road) {
      const snapped = snapRoadPosition(point.x + dragOffset.x, point.z + dragOffset.z, draggedRoadId);
      updateLayoutRoad(draggedRoadId, {
        x: snapped.x,
        z: snapped.z
      });
    }
    didDragZone = true;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (!draggedZoneId) return;
  const point = getLayoutPlanePoint(event);
  if (!point) return;
  const snapped = snapZonePosition(point.x + dragOffset.x, point.z + dragOffset.z, draggedZoneId);
  setZonePosition(draggedZoneId, snapped.x, snapped.z);
  didDragZone = true;
  event.preventDefault();
  event.stopPropagation();
}

function deleteSelectedEditorItem() {
  if (selectedAssetId) {
    deleteSelectedAsset();
    return;
  }
  if (selectedRoadId) {
    deleteSelectedRoad();
    return;
  }
  if (selectedIslandId) {
    deleteSelectedIsland();
  }
}

function endZoneDrag(event) {
  if (isScenePanning) {
    endScenePan(event);
    return;
  }
  if (!draggedZoneId && !draggedIslandId && !draggedAssetId && !draggedRoadId) return;
  canvas.releasePointerCapture?.(event.pointerId);
  draggedZoneId = null;
  draggedIslandId = null;
  draggedAssetId = null;
  draggedRoadId = null;
  if (controls) controls.enabled = true;
  event.preventDefault();
  event.stopPropagation();
}

function pick(event) {
  if (didDragZone) {
    didDragZone = false;
    return;
  }
  if (!canvas) return;
  updatePointerFromEvent(event);
  const hits = raycaster.intersectObjects(clickables, true);
  if (hits[0]?.object?.userData?.zone) setActive(hits[0].object.userData.zone);
}

if (canvas) {
  buildCity();
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoEditorChange();
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea") {
        event.preventDefault();
        deleteSelectedEditorItem();
      }
      return;
    }
    if (event.code !== "Space") return;
    isSpaceDown = true;
    document.body.classList.add("is-layout-pan-ready");
    event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    if (event.code !== "Space") return;
    isSpaceDown = false;
    document.body.classList.remove("is-layout-pan-ready");
    if (isScenePanning) {
      isScenePanning = false;
      if (controls) controls.enabled = true;
      document.body.classList.remove("is-layout-panning");
    }
  });
  canvas.addEventListener("pointerdown", startZoneDrag, { capture: true });
  canvas.addEventListener("pointermove", moveZoneDrag, { capture: true });
  canvas.addEventListener("pointermove", updateAssetHover);
  canvas.addEventListener("pointerup", endZoneDrag, { capture: true });
  canvas.addEventListener("pointercancel", endZoneDrag, { capture: true });
  canvas.addEventListener("click", pick);
  canvas.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  });
  canvas.addEventListener("drop", (event) => {
    const typeId = event.dataTransfer?.getData("application/x-nike-city-asset") || event.dataTransfer?.getData("text/plain");
    if (!ASSET_TYPES[typeId]) return;
    createAssetFromEvent(typeId, event);
    event.preventDefault();
  });
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

function bootHowPageAnimations() {
  const page = document.querySelector(".how-page");
  if (!page) return;

  gsap.set([
    ".how-hero-copy .section-kicker",
    ".how-hero h1",
    ".how-hero-copy p",
    ".how-hero .cta",
    ".how-hero-visual"
  ], { autoAlpha: 0, y: 34 });

  gsap.timeline({ defaults: { ease: "power3.out" } })
    .to(".top-nav > *", { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.08 }, 0)
    .to(".how-hero-copy .section-kicker", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.1)
    .to(".how-hero h1", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.22)
    .to(".how-hero-copy p", { autoAlpha: 1, y: 0, duration: 0.72 }, 0.38)
    .to(".how-hero .cta", { autoAlpha: 1, y: 0, duration: 0.68, stagger: 0.08 }, 0.5)
    .to(".how-hero-visual", { autoAlpha: 1, y: 0, duration: 1.05 }, 0.34)
    .to([".bottom-menu", ".movement-card"], { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.08 }, 0.62);

  gsap.to(".floating-badge", {
    y: -18,
    rotation: 2,
    duration: 2.4,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: 0.28
  });

  gsap.to(".device-pin", {
    y: -10,
    duration: 1.6,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: 0.18
  });

  const hero = document.querySelector(".how-hero");
  const visual = document.querySelector(".how-hero-visual");
  const device = document.querySelector(".how-device");
  const orbit = document.querySelector(".how-orbit");
  const routePath = document.querySelector(".device-route path");
  const enterCta = document.querySelector(".how-hero .cta.primary");

  if (routePath) {
    const routeLength = routePath.getTotalLength();
    gsap.set(routePath, { strokeDasharray: routeLength, strokeDashoffset: routeLength });
    gsap.to(routePath, {
      strokeDashoffset: 0,
      duration: 2.8,
      ease: "power2.inOut",
      repeat: -1,
      repeatDelay: 0.45
    });
  }

  if (hero && visual && device && orbit) {
    const tiltDevice = gsap.quickTo(device, "rotationZ", { duration: 0.7, ease: "power3.out" });
    const moveVisualX = gsap.quickTo(visual, "x", { duration: 0.75, ease: "power3.out" });
    const moveVisualY = gsap.quickTo(visual, "y", { duration: 0.75, ease: "power3.out" });
    const rotateOrbit = gsap.quickTo(orbit, "rotation", { duration: 0.9, ease: "power3.out" });

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      moveVisualX(x * 22);
      moveVisualY(y * 18);
      tiltDevice(-45 + x * 3);
      rotateOrbit(-38 + x * 7);
    });

    hero.addEventListener("pointerleave", () => {
      moveVisualX(0);
      moveVisualY(0);
      tiltDevice(-45);
      rotateOrbit(-38);
    });
  }

  if (enterCta && routePath) {
    enterCta.addEventListener("pointerenter", () => {
      gsap.fromTo(routePath, { strokeWidth: 4 }, { strokeWidth: 7, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
      gsap.to(".device-card", { y: -14, duration: 0.32, yoyo: true, repeat: 1, ease: "back.out(1.8)" });
    });
  }

  document.querySelectorAll("[data-parallax]").forEach((element) => {
    const speed = Number(element.dataset.speed || 0);
    gsap.to(element, {
      y: speed,
      ease: "none",
      scrollTrigger: {
        trigger: element.closest("section") || element,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2
      }
    });
  });

  gsap.from("[data-reveal-line]", {
    y: 90,
    autoAlpha: 0,
    duration: 1.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".how-statement",
      start: "top 72%"
    }
  });

  gsap.from("[data-step-card]", {
    y: 80,
    autoAlpha: 0,
    rotate: -2,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.14,
    scrollTrigger: {
      trigger: ".journey-rail",
      start: "top 76%"
    }
  });

  gsap.from(".capability-card", {
    y: 80,
    autoAlpha: 0,
    scale: 0.96,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    scrollTrigger: {
      trigger: ".capability-grid",
      start: "top 76%"
    }
  });

  gsap.from(".parallax-panel", {
    x: 80,
    autoAlpha: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".how-parallax",
      start: "top 62%"
    }
  });

  gsap.from(".how-final > *", {
    y: 44,
    autoAlpha: 0,
    duration: 0.82,
    ease: "power3.out",
    stagger: 0.09,
    scrollTrigger: {
      trigger: ".how-final",
      start: "top 72%"
    }
  });

  ScrollTrigger.refresh();
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
  if (!morphTransition || !morphLayers.length) return;

  const shouldReveal = sessionStorage.getItem("nikeCityMorphTransition") === "in";
  sessionStorage.removeItem("nikeCityMorphTransition");
  const revealBlack = createMorphPoints(DYNAMIC_MORPH.below);
  const revealYellow = createMorphPoints(DYNAMIC_MORPH.below);
  const revealPaper = createMorphPoints(DYNAMIC_MORPH.below);
  setDynamicMorph(morphLayers[0], revealBlack, "top");
  setDynamicMorph(morphLayers[1], revealYellow, "top");
  setDynamicMorph(morphLayers[2], revealPaper, "top");
  if (morphLogo) gsap.set(morphLogo, { autoAlpha: 0, scale: 0.92 });

  if (!shouldReveal) {
    gsap.set(morphTransition, { autoAlpha: 0 });
    return;
  }

  if (morphLogo) gsap.set(morphLogo, { autoAlpha: 1, scale: 1 });
  gsap.set(morphTransition, { autoAlpha: 1 });
  gsap.fromTo(document.body, { yPercent: 1.4, opacity: 0.96 }, { yPercent: 0, opacity: 1, duration: 1.55, ease: "power3.out" });
  gsap.timeline({
    onComplete: () => {
      gsap.set(morphTransition, { autoAlpha: 0 });
      if (morphLogo) gsap.set(morphLogo, { autoAlpha: 0, scale: 0.92 });
    }
  })
    .to(morphLogo, { autoAlpha: 0, scale: 0.94, duration: 0.54, ease: "power2.out" }, 0.12)
    .add(tweenDynamicMorph(morphLayers[2], revealPaper, DYNAMIC_MORPH.above, "top", {
      duration: 2.05,
      each: 0.09,
      ease: "elastic.inOut(0.78, 0.56)"
    }), 0.18)
    .add(tweenDynamicMorph(morphLayers[1], revealYellow, DYNAMIC_MORPH.above, "top", {
      duration: 2.1,
      each: 0.095,
      ease: "elastic.inOut(0.82, 0.58)"
    }), 0.34)
    .add(tweenDynamicMorph(morphLayers[0], revealBlack, DYNAMIC_MORPH.above, "top", {
      duration: 2.12,
      each: 0.1,
      ease: "elastic.inOut(0.86, 0.6)"
    }), 0.5);
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

  if (!morphTransition || !morphLayers.length) {
    document.body.style.opacity = 0;
    window.setTimeout(() => {
      window.location.href = url;
    }, 260);
    return;
  }

  gsap.killTweensOf([document.body, morphTransition, morphLogo, ...morphLayers]);
  gsap.set(morphTransition, { autoAlpha: 1 });
  const coverBlack = createMorphPoints(DYNAMIC_MORPH.below);
  const coverYellow = createMorphPoints(DYNAMIC_MORPH.below);
  const coverPaper = createMorphPoints(DYNAMIC_MORPH.below);
  setDynamicMorph(morphLayers[0], coverBlack, "bottom");
  setDynamicMorph(morphLayers[1], coverYellow, "bottom");
  setDynamicMorph(morphLayers[2], coverPaper, "bottom");
  if (morphLogo) gsap.set(morphLogo, { autoAlpha: 0, scale: 0.92 });

  gsap.timeline({
    onComplete: () => {
      sessionStorage.setItem("nikeCityMorphTransition", "in");
      window.location.href = url;
    }
  })
    .to(document.body, { yPercent: -1.2, opacity: 0.9, duration: 1.55, ease: "power2.inOut" }, 0)
    .add(tweenDynamicMorph(morphLayers[0], coverBlack, DYNAMIC_MORPH.coverBlack, "bottom", {
      duration: 2.02,
      each: 0.09,
      ease: "elastic.out(0.78, 0.5)"
    }), 0)
    .add(tweenDynamicMorph(morphLayers[1], coverYellow, DYNAMIC_MORPH.coverYellow, "bottom", {
      duration: 2.14,
      each: 0.095,
      ease: "elastic.out(0.82, 0.52)"
    }), 0.16)
    .add(tweenDynamicMorph(morphLayers[2], coverPaper, DYNAMIC_MORPH.coverPaper, "bottom", {
      duration: 2.26,
      each: 0.1,
      ease: "elastic.out(0.86, 0.54)"
    }), 0.32)
    .to(morphLogo, { autoAlpha: 1, scale: 1, duration: 0.62, ease: "back.out(1.7)" }, 1.9)
    .to(morphLayers, { duration: 0.82 }, ">-0.02");
}

function playTone(frequency, start, duration, type = "triangle", gain = 0.045) {
  if (!audioContext || !masterGain) return;
  const oscillator = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  toneGain.gain.setValueAtTime(0.0001, start);
  toneGain.gain.exponentialRampToValueAtTime(gain, start + 0.025);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(toneGain);
  toneGain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function startNikeCityMusic() {
  if (!musicEnabled || musicTimer || !window.AudioContext && !window.webkitAudioContext) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  if (!masterGain) {
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioContext.destination);
  }

  const melody = [392, 494, 587, 659, 587, 494, 440, 523];
  const bass = [98, 123.47, 146.83, 123.47];
  const schedule = () => {
    if (!musicEnabled || !audioContext) return;
    const now = audioContext.currentTime + 0.04;
    const note = melody[musicStep % melody.length];
    playTone(note, now, 0.16, "triangle", 0.04);
    if (musicStep % 2 === 0) playTone(note * 2, now + 0.08, 0.12, "sine", 0.018);
    if (musicStep % 4 === 0) playTone(bass[(musicStep / 4) % bass.length], now, 0.28, "square", 0.018);
    musicStep += 1;
  };
  schedule();
  musicTimer = window.setInterval(schedule, 230);
}

function stopNikeCityMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.03);
    window.setTimeout(() => {
      if (masterGain && audioContext) masterGain.gain.value = 0.18;
    }, 220);
  }
}

function updateSoundButtons() {
  document.querySelectorAll(".sound-toggle").forEach((button) => {
    button.classList.toggle("is-muted", !musicEnabled);
    button.innerHTML = `${musicEnabled ? "Sound on" : "Muted"} <span>${musicEnabled ? "◕" : "○"}</span>`;
  });
}

function initSoundControls() {
  updateSoundButtons();
  document.querySelectorAll(".sound-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      musicEnabled = !musicEnabled;
      window.localStorage.setItem(SOUND_STORAGE_KEY, musicEnabled ? "on" : "off");
      if (musicEnabled) startNikeCityMusic();
      else stopNikeCityMusic();
      updateSoundButtons();
    });
  });

  const startOnFirstGesture = () => {
    if (musicEnabled) startNikeCityMusic();
    window.removeEventListener("pointerdown", startOnFirstGesture);
    window.removeEventListener("keydown", startOnFirstGesture);
  };
  window.addEventListener("pointerdown", startOnFirstGesture, { once: true });
  window.addEventListener("keydown", startOnFirstGesture, { once: true });
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
bootHowPageAnimations();
bootIntroCards();
playPageEnter();
initSoundControls();
window.addEventListener("beforeunload", persistEditorStateNow);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") persistEditorStateNow();
});

function animate(t) {
  if (!renderer || !controls) return;
  const delta = lastAnimationTime ? (t - lastAnimationTime) / 1000 : 0;
  lastAnimationTime = t;
  controls.update();
  updateCityAtmosphere(t);
  layoutAssetMixers.forEach((mixer) => mixer.update(delta));
  updateAnimatedLayoutAssets(t);
  scene.traverse((obj) => {
    if (obj.userData.float) obj.position.y += Math.sin(t * 0.002 + obj.userData.float) * 0.001;
  });
  projectLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
