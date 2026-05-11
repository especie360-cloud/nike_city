import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/oscar/Documents/New project 2/outputs/nike-city-plan";
const workbook = Workbook.create();

function ws(name) {
  return workbook.worksheets.add(name);
}

function setValues(sheet, start, values) {
  const rows = values.length;
  const cols = Math.max(...values.map((row) => row.length));
  const range = sheet.getRange(start).resize(rows, cols);
  range.values = values.map((row) => [...row, ...Array(cols - row.length).fill(null)]);
  return range;
}

function styleHeader(range) {
  range.format.fill.color = "#111111";
  range.format.font.color = "#FFFFFF";
  range.format.font.bold = true;
}

function styleTitle(range) {
  range.format.font.bold = true;
  range.format.font.size = 18;
  range.format.font.color = "#111111";
}

function styleSection(range) {
  range.format.fill.color = "#FFC700";
  range.format.font.color = "#111111";
  range.format.font.bold = true;
}

function applyTableStyle(sheet, rangeAddress) {
  const range = sheet.getRange(rangeAddress);
  range.format.borders.color = "#D8D5CF";
  range.format.borders.style = "Continuous";
  range.format.font.name = "Inter";
  range.format.font.size = 10;
  return range;
}

const resumen = ws("Resumen");
setValues(resumen, "A1", [["Nike City - Workflow de Produccion Modular"]]);
styleTitle(resumen.getRange("A1:H1"));
setValues(resumen, "A3", [
  ["Objetivo", "Construir Nike City como sistema modular: zonas y calles modeladas en Blender, integradas en Three.js con GLB reutilizables."],
  ["Estado actual", "Plaza Central en progreso, integrada como GLB modular en el sitio."],
  ["Regla clave", "No recrear zonas principales con CSS ni geometria procedural; cargar assets GLB por nombre estable."],
  ["Pipeline", "Blender (.blend) -> export GLB -> Three.js GLTFLoader -> posicion/escala/labels en sitio."],
]);
applyTableStyle(resumen, "A3:B6");
resumen.getRange("A3:A6").format.font.bold = true;

setValues(resumen, "A8", [["Prioridad", "Bloque", "Meta", "Estado"]]);
styleHeader(resumen.getRange("A8:D8"));
setValues(resumen, "A9", [
  [1, "Cerrar Plaza Central", "Aprobar base, swoosh, arboles, sombrillas, fachada y escala final.", "En progreso"],
  [2, "Props reutilizables", "Arbol, sombrilla, farola, banca, cono, fuente, senal.", "En progreso"],
  [3, "Calles modulares", "Recta, cruce, esquina, T, crosswalk, carriles.", "Pendiente"],
  [4, "Zonas faciles", "Estacionamiento y Metro.", "Pendiente"],
  [5, "Zonas medias", "Running, Casual, Juvenil.", "Pendiente"],
  [6, "Zonas complejas", "Basketball, Skate Park, Soccer.", "Pendiente"],
  [7, "Integracion final", "Carga modular, labels, performance, responsive.", "Pendiente"],
]);
applyTableStyle(resumen, "A8:D15");

const zonas = ws("Zonas");
setValues(zonas, "A1", [["Roadmap de Zonas"]]);
styleTitle(zonas.getRange("A1:H1"));
setValues(zonas, "A3", [[
  "Orden", "Zona", "Complejidad", "GLB objetivo", "Elementos principales", "Estado", "Responsable", "Notas"
]]);
styleHeader(zonas.getRange("A3:H3"));
setValues(zonas, "A4", [
  [1, "Plaza Central", "Alta - en curso", "assets/zona_plaza_central_ultra_blender.glb", "Edificio circular, domo, swoosh, fuente, sombrillas, arboles, farolas.", "En progreso", "Blender/Codex", "Terminar detalles antes de bloquear version estable."],
  [2, "Estacionamiento", "Facil", "assets/models/zones/zona_estacionamiento.glb", "Base, parking, autos, edificio bajo, senal P.", "Pendiente", "Blender/Codex", "Buena primera zona nueva."],
  [3, "Estacion Metro", "Facil-media", "assets/models/zones/zona_metro.glb", "Arco, entrada, M, andenes, farolas.", "Pendiente", "Blender/Codex", "Forma reconocible y compacta."],
  [4, "Zona Running", "Media", "assets/models/zones/zona_running.glb", "Pista, tienda pequena, roof icon, bancos.", "Pendiente", "Blender/Codex", "Reutiliza base y props."],
  [5, "Zona Casual", "Media", "assets/models/zones/zona_casual.glb", "Tienda, zapato/display, sombrillas, arboles.", "Pendiente", "Blender/Codex", "Cuidar silueta del producto."],
  [6, "Zona Juvenil", "Media-alta", "assets/models/zones/zona_juvenil.glb", "Varios mini edificios, smiley, cafeteria, props densos.", "Pendiente", "Blender/Codex", "Composicion mas cargada."],
  [7, "Zona Basketball", "Alta", "assets/models/zones/zona_basketball.glb", "Cancha, aros, lineas, edificio perimetral.", "Pendiente", "Blender/Codex", "Líneas deportivas deben leerse bien."],
  [8, "Skate Park", "Alta", "assets/models/zones/zona_skate.glb", "Rampas, bowl, rails, senal, props.", "Pendiente", "Blender/Codex", "Geometria curva especial."],
  [9, "Zona Soccer", "Mas compleja", "assets/models/zones/zona_soccer.glb", "Cancha integrada, porterias, edificio grande, graderia/props.", "Pendiente", "Blender/Codex", "Dejar para cuando sistema este cerrado."],
]);
applyTableStyle(zonas, "A3:H12");

const props = ws("Props");
setValues(props, "A1", [["Libreria de Props Reutilizables"]]);
styleTitle(props.getRange("A1:G1"));
setValues(props, "A3", [["Prop", "Archivo objetivo", "Estado", "Criterio de aprobacion", "Usado en", "Prioridad", "Notas"]]);
styleHeader(props.getRange("A3:G3"));
setValues(props, "A4", [
  ["Sombrilla", "assets/models/props/umbrella.glb", "Casi aprobado", "Gajos amarillo/blanco, borde negro fino, volumen abierto, base toy.", "Plaza, Casual, Basketball", "Alta", "Ya mejorada dentro de Plaza Central."],
  ["Arbol principal", "assets/models/props/tree.glb", "En revision", "Silueta vertical tipo icono, copa amarilla con cortes blancos, tronco/pie.", "Todas", "Alta", "Pendiente mejorar lectura a escala pequena."],
  ["Arbol redondo", "assets/models/props/round_tree.glb", "En revision", "Copa redonda amarilla, pie simple, escala consistente.", "Todas", "Media", ""],
  ["Farola", "assets/models/props/lamp.glb", "Pendiente", "Poste fino, cap amarillo/blanco, escala baja.", "Todas", "Alta", ""],
  ["Banca", "assets/models/props/bench.glb", "Pendiente", "Asiento amarillo, respaldo negro, patas simples.", "Todas", "Media", ""],
  ["Cono", "assets/models/props/cone.glb", "Pendiente", "Base amarilla, cuerpo blanco/amarillo segun referencia.", "Calles/Zonas", "Media", ""],
  ["Fuente", "assets/models/props/fountain.glb", "Pendiente", "Anillos blanco/negro/amarillo, pieza compacta.", "Plaza", "Alta", ""],
  ["Senaletica", "assets/models/props/sign.glb", "Pendiente", "Poste + icono amarillo/negro.", "Todas", "Media", ""],
  ["Mini auto", "assets/models/props/car.glb", "Pendiente", "Forma simple amarilla/blanca, toy scale.", "Calles/Parking", "Media", ""],
]);
applyTableStyle(props, "A3:G12");

const calles = ws("Calles");
setValues(calles, "A1", [["Sistema Modular de Calles"]]);
styleTitle(calles.getRange("A1:H1"));
setValues(calles, "A3", [["Modulo", "Archivo objetivo", "Uso", "Elementos", "Estado", "Notas"]]);
styleHeader(calles.getRange("A3:F3"));
setValues(calles, "A4", [
  ["Road Straight", "assets/models/roads/road_straight.glb", "Tramos largos", "Asfalto negro, lineas punteadas, borde suave.", "Pendiente", "Debe encajar en grid."],
  ["Road Cross", "assets/models/roads/road_cross.glb", "Intersecciones principales", "Cruce central, carriles, crosswalks.", "Pendiente", "Clave para estructura ciudad."],
  ["Road T", "assets/models/roads/road_t.glb", "Conexiones secundarias", "T con lineas/crosswalk.", "Pendiente", ""],
  ["Road Corner", "assets/models/roads/road_corner.glb", "Esquinas", "Curva/angulo con borde redondeado.", "Pendiente", ""],
  ["Crosswalk", "assets/models/roads/crosswalk.glb", "Pasos peatonales", "Franjas blancas modulares.", "Pendiente", "Puede ser prop instanciable."],
  ["Island/Sidewalk", "assets/models/roads/sidewalk_island.glb", "Islas y banquetas", "Base blanca redondeada.", "Pendiente", ""],
]);
applyTableStyle(calles, "A3:F9");

const estilo = ws("Sistema Visual");
setValues(estilo, "A1", [["Reglas Visuales Nike City"]]);
styleTitle(estilo.getRange("A1:H1"));
setValues(estilo, "A3", [["Categoria", "Regla"]]);
styleHeader(estilo.getRange("A3:B3"));
setValues(estilo, "A4", [
  ["Paleta", "Blanco calido, negro #111111, amarillo/naranja Nike. Mantener consistencia por zona."],
  ["Base", "Plataforma redondeada tipo toy-city, grosor medio, lateral gris suave."],
  ["Modelado", "Geometria limpia, modular, sin texturas realistas, bordes suaves."],
  ["Escala", "Edificios dominan zona; props pequenos pero legibles en vista general."],
  ["Textos", "No incluir textos dentro de GLB. Labels/pins los pone el sitio."],
  ["Pivote", "Centro de la base, y=0 listo para posicionar en Three.js."],
  ["Export", "Mantener nombres GLB estables para que el sitio actualice al recargar."],
  ["Integracion", "El sitio carga GLB con GLTFLoader y ajusta posicion/escala/rotacion."],
]);
applyTableStyle(estilo, "A3:B11");

const integracion = ws("Integracion");
setValues(integracion, "A1", [["Checklist de Integracion Three.js"]]);
styleTitle(integracion.getRange("A1:H1"));
setValues(integracion, "A3", [["Paso", "Descripcion", "Responsable", "Estado"]]);
styleHeader(integracion.getRange("A3:D3"));
setValues(integracion, "A4", [
  [1, "Cargar GLB con GLTFLoader desde ruta estable.", "Sitio", "En curso"],
  [2, "Asignar plaza.name = zona_plaza_central.", "Sitio", "En curso"],
  [3, "Ajustar position/scale/rotation root, no editar GLB.", "Sitio", "En curso"],
  [4, "Mantener labels HTML/pins por fuera del modelo.", "Sitio", "En curso"],
  [5, "Al reemplazar GLB, recargar sitio y validar visual.", "Ambos", "En curso"],
  [6, "Crear cache-busting si el browser no refresca asset.", "Sitio", "Pendiente"],
  [7, "Optimizar peso final por zona antes de produccion.", "Ambos", "Pendiente"],
]);
applyTableStyle(integracion, "A3:D10");

const sheets = [resumen, zonas, props, calles, estilo, integracion];
for (const sheet of sheets) {
  sheet.freezePanes.freezeRows(3);
  const used = sheet.getUsedRange();
  used.format.font.name = "Inter";
  used.format.wrapText = true;
  for (let i = 0; i < 10; i++) {
    try { sheet.getRangeByIndexes(0, i, 1, 1).format.columnWidth = 130; } catch {}
  }
}

// Column sizing tuned for readability.
resumen.getRange("A:A").format.columnWidth = 130;
resumen.getRange("B:B").format.columnWidth = 620;
zonas.getRange("A:A").format.columnWidth = 60;
zonas.getRange("B:B").format.columnWidth = 150;
zonas.getRange("D:D").format.columnWidth = 250;
zonas.getRange("E:E").format.columnWidth = 360;
zonas.getRange("H:H").format.columnWidth = 300;
props.getRange("A:A").format.columnWidth = 150;
props.getRange("B:B").format.columnWidth = 260;
props.getRange("D:D").format.columnWidth = 360;
calles.getRange("B:B").format.columnWidth = 260;
calles.getRange("D:D").format.columnWidth = 340;
estilo.getRange("A:A").format.columnWidth = 140;
estilo.getRange("B:B").format.columnWidth = 620;
integracion.getRange("B:B").format.columnWidth = 420;

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/nike_city_workflow_modular.xlsx`);
