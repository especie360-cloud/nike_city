import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ZONE_DIR = ASSETS / "models" / "zones"
ZONE_DIR.mkdir(parents=True, exist_ok=True)
M = {}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, color, roughness=0.7):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def make_materials():
    return {
        "porcelain": mat("warm modular white", (0.985, 0.975, 0.94, 1), 0.78),
        "side": mat("soft warm grey side", (0.76, 0.745, 0.69, 1), 0.86),
        "black": mat("satin nike black", (0.006, 0.006, 0.006, 1), 0.56),
        "asphalt": mat("deep black parking asphalt", (0.018, 0.02, 0.02, 1), 0.62),
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "amber": mat("burnt amber shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("parking line white", (0.95, 0.95, 0.91, 1), 0.76),
    }


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.035, segments=3):
    mod = obj.modifiers.new("soft toy bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def cube(name, loc, scale, material, rot=0, bevel_amount=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, material)
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cyl(name, loc, radius, depth, material, vertices=48, bevel_amount=0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cone(name, loc, radius, depth, material, vertices=32):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=0, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    bevel(obj, 0.012, 2)
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=16, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def rounded_rect_points(width, depth, radius, segments=14):
    points = []
    centers = [
        (width / 2 - radius, depth / 2 - radius, 0, math.pi / 2),
        (-width / 2 + radius, depth / 2 - radius, math.pi / 2, math.pi),
        (-width / 2 + radius, -depth / 2 + radius, math.pi, math.pi * 1.5),
        (width / 2 - radius, -depth / 2 + radius, math.pi * 1.5, math.tau),
    ]
    for cx, cy, start, end in centers:
        for i in range(segments + 1):
            a = start + (end - start) * (i / segments)
            points.append((cx + math.cos(a) * radius, cy + math.sin(a) * radius))
    return points


def rounded_box(name, width, depth, height, radius, material, loc):
    points = rounded_rect_points(width, depth, radius)
    top_z = height / 2
    bottom_z = -height / 2
    verts = [(x, y, top_z) for x, y in points] + [(x, y, bottom_z) for x, y in points]
    n = len(points)
    faces = [tuple(range(n)), tuple(range(n * 2 - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, j + n, i + n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    assign(obj, material)
    bevel(obj, 0.01, 2)
    return obj


def base_piece(name, loc, width, depth, radius):
    rounded_box(f"{name} grey side", width + 0.05, depth + 0.05, 0.11, radius + 0.02, M["side"], (loc[0], loc[1], -0.055))
    rounded_box(f"{name} white top", width, depth, 0.11, radius, M["porcelain"], (loc[0], loc[1], 0.025))
    rounded_box(f"{name} lower white lip", width - 0.18, depth - 0.18, 0.03, max(radius - 0.04, 0.04), M["porcelain"], (loc[0], loc[1], -0.128))


def build_base():
    base_piece("upper parking pad", (-0.7, 0.72), 3.55, 2.05, 0.26)
    base_piece("lower building pad", (0.45, -1.1), 3.45, 1.38, 0.34)
    base_piece("J neck connector", (-1.04, -0.32), 1.15, 0.78, 0.16)


def parking_lot():
    rounded_box("black parking lot slab", 2.72, 1.58, 0.07, 0.08, M["asphalt"], (-0.72, 0.72, 0.17))
    cube("parking horizontal divider", (-0.72, 0.72, 0.215), (2.48, 0.024, 0.014), M["line"], 0, 0.001)
    cube("parking vertical divider", (-0.72, 0.72, 0.216), (0.024, 1.28, 0.014), M["line"], 0, 0.001)
    for x in (-1.64, -1.18, -0.26, 0.2):
        cube("upper parking bay line", (x, 1.12, 0.22), (0.025, 0.38, 0.014), M["line"], 0, 0.001)
        cube("lower parking bay line", (x, 0.34, 0.22), (0.025, 0.38, 0.014), M["line"], 0, 0.001)
    for x, y in [(-1.42, 1.38), (0.36, 1.38), (-1.42, 0.06), (0.36, 0.06)]:
        cube("yellow wheel stop", (x, y, 0.23), (0.34, 0.035, 0.025), M["yellow"], 0, 0.004)
    for x, y in [(-1.24, 0.88), (-0.16, 0.46), (0.26, 0.98)]:
        cube("small amber parking mark", (x, y, 0.235), (0.18, 0.018, 0.014), M["amber"], math.radians(24), 0.001)


def p_icon_flat(x, y, z, scale=1.0):
    cyl("yellow P disk", (x, y, z), 0.14 * scale, 0.018 * scale, M["yellow"], 36, 0.003, (math.pi / 2, 0, 0))
    cyl("black P disk border", (x, y - 0.006, z), 0.16 * scale, 0.01 * scale, M["black"], 36, 0.002, (math.pi / 2, 0, 0))
    cube("black P stem", (x - 0.035 * scale, y - 0.016, z), (0.03 * scale, 0.012, 0.14 * scale), M["black"], 0, 0.002)
    cube("black P bowl top", (x + 0.018 * scale, y - 0.017, z + 0.038 * scale), (0.09 * scale, 0.012, 0.03 * scale), M["black"], 0, 0.002)
    cube("black P bowl side", (x + 0.055 * scale, y - 0.017, z + 0.004 * scale), (0.024 * scale, 0.012, 0.07 * scale), M["black"], 0, 0.002)


def parking_sign(x, y, scale=1.0):
    cyl("P sign pole", (x, y, 0.42 * scale), 0.012 * scale, 0.52 * scale, M["pole"], 12)
    cube("yellow P sign board", (x, y, 0.71 * scale), (0.25 * scale, 0.045 * scale, 0.34 * scale), M["yellow"], 0, 0.018)
    cube("black P sign inset", (x, y - 0.024 * scale, 0.71 * scale), (0.18 * scale, 0.012 * scale, 0.25 * scale), M["black"], 0, 0.006)
    p_icon_flat(x, y - 0.034 * scale, 0.71 * scale, 0.54 * scale)


def car(x, y, rot=0):
    cube("tiny yellow parking car", (x, y, 0.29), (0.42, 0.24, 0.13), M["yellow"], rot, 0.04)
    cube("black car glass", (x, y + 0.02, 0.38), (0.2, 0.13, 0.045), M["black"], rot, 0.015)
    cube("white car roof glint", (x, y, 0.415), (0.16, 0.1, 0.03), M["white"], rot, 0.012)
    for dx in (-0.16, 0.16):
        for dy in (-0.1, 0.1):
            cyl(
                "tiny car wheel",
                (x + math.cos(rot) * dx - math.sin(rot) * dy, y + math.sin(rot) * dx + math.cos(rot) * dy, 0.24),
                0.034,
                0.025,
                M["black"],
                16,
                0.002,
                (0, math.pi / 2, rot),
            )


def checker_building():
    bx, by = 0.48, -1.1
    rounded_box("parking checker building body", 1.74, 0.72, 0.58, 0.18, M["porcelain"], (bx, by, 0.43))
    rounded_box("black offset parking roof", 0.76, 0.58, 0.08, 0.08, M["black"], (bx + 0.08, by + 0.02, 0.78))
    cube("yellow front garage frame", (bx - 0.5, -1.48, 0.39), (0.56, 0.035, 0.42), M["yellow"], 0, 0.01)
    cube("black front garage", (bx - 0.5, -1.505, 0.39), (0.43, 0.04, 0.33), M["black"], 0, 0.012)
    cube("black entry glass", (bx + 0.55, -1.505, 0.36), (0.3, 0.04, 0.29), M["black"], 0, 0.012)
    cube("yellow entry awning", (bx + 0.55, -1.55, 0.6), (0.4, 0.1, 0.055), M["yellow"], 0, 0.01)
    for side_y in (-1.49, -0.71):
        for i in range(9):
            x = bx - 0.8 + i * 0.2
            lower = [M["yellow"], M["black"], M["white"]][i % 3]
            upper = [M["black"], M["yellow"], M["white"]][i % 3]
            cube("checker facade tile lower", (x, side_y, 0.31), (0.16, 0.026, 0.18), lower, 0, 0.004)
            cube("checker facade tile upper", (x, side_y, 0.51), (0.16, 0.026, 0.18), upper, 0, 0.004)
    for side_x in (bx - 0.9, bx + 0.9):
        for i in range(3):
            y = by - 0.22 + i * 0.22
            cube("side checker tile", (side_x, y, 0.4), (0.026, 0.16, 0.2), [M["yellow"], M["black"], M["white"]][i % 3], 0, 0.004)


def lamp(x, y, scale=1.0):
    cyl("thin parking lamp pole", (x, y, 0.35 * scale), 0.012 * scale, 0.44 * scale, M["pole"], 12)
    sphere("small parking lamp bulb", (x, y, 0.6 * scale), 0.04 * scale, M["white"], (1, 1, 0.85))
    cyl("yellow parking lamp cap", (x, y, 0.625 * scale), 0.044 * scale, 0.024 * scale, M["yellow"], 20)


def tree(x, y, scale=1.0, white=False):
    cyl("parking tree base", (x, y, 0.11 * scale), 0.045 * scale, 0.035 * scale, M["yellow"], 18, 0.004)
    cyl("parking tree trunk", (x, y, 0.3 * scale), 0.02 * scale, 0.32 * scale, M["amber"], 12)
    material = M["white"] if white else M["yellow"]
    cone("parking tree crown lower", (x, y, 0.46 * scale), 0.13 * scale, 0.22 * scale, material, 32)
    cone("parking tree crown upper", (x, y, 0.62 * scale), 0.095 * scale, 0.18 * scale, material, 32)
    if not white:
        cone("parking tree white cap", (x, y, 0.7 * scale), 0.052 * scale, 0.085 * scale, M["white"], 24)


def bench(x, y, rot=0):
    cube("yellow parking bench seat", (x, y, 0.18), (0.34, 0.075, 0.045), M["yellow"], rot, 0.01)
    cube("black parking bench back", (x, y + 0.055, 0.25), (0.36, 0.035, 0.035), M["black"], rot, 0.008)


def nike_sign(x, y, rot=0):
    cyl("nike sign pole left", (x - 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cyl("nike sign pole right", (x + 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cube("yellow nike sign board", (x, y, 0.52), (0.33, 0.04, 0.16), M["yellow"], rot, 0.012)
    cube("black nike sign slash", (x, y, 0.53), (0.2, 0.018, 0.02), M["black"], rot + math.radians(-18), 0.004)


def props():
    parking_sign(-1.28, 0.75, 1.0)
    parking_sign(0.18, 0.8, 0.95)
    car(0.48, 1.08, math.radians(0))
    tree(-2.05, 1.32, 0.72, True)
    tree(1.86, -0.6, 0.7, False)
    tree(-1.62, -1.38, 0.58, True)
    for x, y in [(-2.1, 0.1), (1.12, 1.42), (-0.85, 1.52), (1.8, -0.12), (-1.05, -1.42)]:
        lamp(x, y, 0.72)
    bench(-1.72, 1.34, math.radians(2))
    bench(0.15, -1.58, math.radians(-4))
    nike_sign(1.05, 1.42, math.radians(5))
    nike_sign(-1.7, -0.86, math.radians(-6))


def setup_scene():
    bpy.ops.object.light_add(type="SUN", location=(-3.8, -4.5, 6.5), rotation=(math.radians(45), 0, math.radians(-35)))
    light = bpy.context.object
    light.name = "soft nike city sun"
    light.data.energy = 1.25
    bpy.ops.object.camera_add(location=(4.8, -5.6, 4.4), rotation=(math.radians(60), 0, math.radians(41)))
    bpy.context.scene.camera = bpy.context.object
    available_engines = {item.identifier for item in bpy.context.scene.render.bl_rna.properties["engine"].enum_items}
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH", "CYCLES"):
        if engine in available_engines:
            bpy.context.scene.render.engine = engine
            break
    bpy.context.scene.world.color = (0.965, 0.955, 0.93)


clear_scene()
M = make_materials()
build_base()
parking_lot()
checker_building()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_estacionamiento.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_estacionamiento.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
