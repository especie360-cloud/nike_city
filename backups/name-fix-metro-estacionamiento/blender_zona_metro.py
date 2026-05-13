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


def mat(name, color, roughness=0.72):
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
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "yellow_shadow": mat("burnt amber shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("subtle paving line", (0.72, 0.70, 0.64, 1), 0.86),
    }


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.04, segments=3):
    mod = obj.modifiers.new("rounded toy bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.update()
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


def cyl(name, loc, radius, depth, material, vertices=96, bevel_amount=0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cone(name, loc, radius, depth, material, vertices=36):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=0, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    bevel(obj, 0.012, 2)
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=24, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def torus(name, loc, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=160, minor_segments=12, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def rounded_box_mesh(name, width, depth, height, radius, material, z_center):
    segments = 18
    points = []
    centers = [
        (width / 2 - radius, depth / 2 - radius, 0, math.pi / 2),
        (-width / 2 + radius, depth / 2 - radius, math.pi / 2, math.pi),
        (-width / 2 + radius, -depth / 2 + radius, math.pi, math.pi * 1.5),
        (width / 2 - radius, -depth / 2 + radius, math.pi * 1.5, math.tau),
    ]
    for cx, cy, start, end in centers:
        for i in range(segments + 1):
            angle = start + (end - start) * (i / segments)
            points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
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
    obj.location.z = z_center
    assign(obj, material)
    smooth(obj)
    bevel(obj, 0.014, 3)
    return obj


def base():
    rounded_box_mesh("rounded metro modular platform top", 3.45, 3.45, 0.12, 0.5, M["porcelain"], 0.03)
    rounded_box_mesh("soft grey metro platform side", 3.49, 3.49, 0.12, 0.52, M["side"], -0.055)
    rounded_box_mesh("thin warm white metro lower lip", 3.35, 3.35, 0.03, 0.47, M["porcelain"], -0.13)
    for radius in (1.0, 1.32):
        ring = torus("subtle metro paving guide", (0, 0, 0.112), radius, 0.006, M["line"])
        ring.scale.y = 0.78


def metro_arch():
    y = 0.22
    cube("white metro arch left pillar", (-0.34, y, 0.58), (0.25, 0.26, 0.96), M["porcelain"], 0, 0.035)
    cube("white metro arch right pillar", (0.34, y, 0.58), (0.25, 0.26, 0.96), M["porcelain"], 0, 0.035)
    cyl("large rounded white metro arch crown", (0, y, 1.05), 0.47, 0.27, M["porcelain"], 72, 0.025, (math.pi / 2, 0, 0))
    cube("black metro tunnel opening", (0, y - 0.02, 0.58), (0.43, 0.29, 0.72), M["black"], 0, 0.035)
    cyl("rounded black metro tunnel crown", (0, y - 0.035, 0.92), 0.215, 0.3, M["black"], 64, 0.01, (math.pi / 2, 0, 0))
    cube("yellow metro arch left trim", (-0.47, y - 0.03, 0.57), (0.075, 0.3, 0.73), M["yellow"], 0, 0.012)
    cube("yellow metro arch right trim", (0.47, y - 0.03, 0.57), (0.075, 0.3, 0.73), M["yellow"], 0, 0.012)
    cyl("yellow rounded metro inner crown", (0, y - 0.04, 0.92), 0.32, 0.3, M["yellow"], 64, 0.012, (math.pi / 2, 0, 0))
    cube("black tunnel cutback", (0, y - 0.07, 0.58), (0.38, 0.32, 0.62), M["black"], 0, 0.025)
    cube("white face panel for M", (0, y - 0.16, 1.25), (0.48, 0.035, 0.25), M["white"], 0, 0.014)
    metro_m_icon(0, y - 0.185, 1.25, 0.18)


def metro_m_icon(x, y, z, scale):
    cube("black metro M left stem", (x - scale * 0.34, y, z), (scale * 0.12, 0.02, scale * 0.95), M["black"], 0, 0.003)
    cube("black metro M right stem", (x + scale * 0.34, y, z), (scale * 0.12, 0.02, scale * 0.95), M["black"], 0, 0.003)
    cube("black metro M left diagonal", (x - scale * 0.12, y, z + scale * 0.16), (scale * 0.12, 0.02, scale * 0.62), M["black"], math.radians(-18), 0.003)
    cube("black metro M right diagonal", (x + scale * 0.12, y, z + scale * 0.16), (scale * 0.12, 0.02, scale * 0.62), M["black"], math.radians(18), 0.003)


def platform_and_train():
    cube("raised white metro platform deck", (0, -0.68, 0.19), (1.62, 0.34, 0.12), M["porcelain"], 0, 0.025)
    cube("black metro track center", (0, -1.0, 0.15), (0.44, 1.18, 0.045), M["black"], 0, 0.012)
    cube("yellow track left rail", (-0.28, -1.0, 0.205), (0.04, 1.12, 0.035), M["yellow"], 0, 0.005)
    cube("yellow track right rail", (0.28, -1.0, 0.205), (0.04, 1.12, 0.035), M["yellow"], 0, 0.005)
    for i in range(4):
        cube("yellow metro track chevron left", (-0.08, -1.38 + i * 0.2, 0.23), (0.22, 0.04, 0.012), M["yellow"], math.radians(34), 0.003)
        cube("yellow metro track chevron right", (0.08, -1.38 + i * 0.2, 0.23), (0.22, 0.04, 0.012), M["yellow"], math.radians(-34), 0.003)

    cube("small yellow metro train body", (0, -0.38, 0.36), (0.32, 0.46, 0.24), M["yellow"], 0, 0.045)
    cube("black metro train windshield", (0, -0.57, 0.41), (0.22, 0.055, 0.13), M["black"], 0, 0.012)
    cube("white metro train roof", (0, -0.38, 0.51), (0.23, 0.36, 0.045), M["white"], 0, 0.018)
    for x in (-0.11, 0.11):
        cyl("tiny black metro train wheel", (x, -0.22, 0.25), 0.035, 0.03, M["black"], 18, 0.002, (0, math.pi / 2, 0))


def railings():
    for x in (-0.72, 0.72):
        cube("yellow metro railing top", (x, -0.76, 0.44), (0.035, 0.96, 0.035), M["yellow"], 0, 0.006)
        for i in range(5):
            cyl("thin grey metro rail post", (x, -1.16 + i * 0.22, 0.31), 0.011, 0.26, M["pole"], 10)
    for x in (-1.0, -0.82, 0.82, 1.0):
        cube("small yellow side barrier", (x, -0.52, 0.33), (0.16, 0.035, 0.045), M["yellow"], 0, 0.006)
        cyl("small barrier post", (x, -0.52, 0.24), 0.01, 0.22, M["pole"], 10)


def lamp(x, y, scale=1.0):
    cyl("thin metro lamp pole", (x, y, 0.34 * scale), 0.012 * scale, 0.43 * scale, M["pole"], 12)
    sphere("small white metro lamp bulb", (x, y, 0.58 * scale), 0.04 * scale, M["white"], (1, 1, 0.8))
    cyl("tiny yellow metro lamp cap", (x, y, 0.61 * scale), 0.045 * scale, 0.025 * scale, M["yellow"], 20)


def tree(x, y, scale=1.0):
    cyl("small metro tree base", (x, y, 0.1 * scale), 0.045 * scale, 0.03 * scale, M["yellow"], 18, 0.004)
    cyl("slim metro tree trunk", (x, y, 0.28 * scale), 0.02 * scale, 0.32 * scale, M["yellow_shadow"], 12)
    cone("metro cone tree lower crown", (x, y, 0.45 * scale), 0.13 * scale, 0.22 * scale, M["yellow"], 32)
    cone("metro cone tree upper crown", (x, y, 0.61 * scale), 0.095 * scale, 0.18 * scale, M["yellow"], 32)
    cone("metro white tree cap", (x, y, 0.69 * scale), 0.052 * scale, 0.085 * scale, M["white"], 24)


def flag(x, y, rot=0):
    cyl("thin metro flag pole", (x, y, 0.42), 0.012, 0.6, M["pole"], 12)
    cube("yellow metro nike flag", (x, y, 0.66), (0.26, 0.035, 0.15), M["yellow"], rot, 0.012)
    cube("black flag slash", (x, y, 0.67), (0.15, 0.018, 0.02), M["black"], rot + math.radians(-18), 0.004)


def props():
    tree(-1.28, -1.18, 0.72)
    tree(1.28, -1.13, 0.72)
    tree(-1.22, 0.82, 0.62)
    tree(1.2, 0.82, 0.62)
    for x, y in [(-1.3, 0.08), (1.3, 0.06), (-0.72, -1.42), (0.72, -1.42)]:
        lamp(x, y, 0.72)
    flag(0.9, -1.45, math.radians(8))
    cyl("small metro service pad", (-1.0, -1.48, 0.15), 0.16, 0.045, M["porcelain"], 48, 0.008)
    cyl("black metro service pad center", (-1.0, -1.48, 0.19), 0.095, 0.025, M["black"], 48, 0.004)
    cyl("yellow metro service button", (-1.0, -1.48, 0.24), 0.04, 0.075, M["yellow"], 28, 0.004)


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
base()
metro_arch()
platform_and_train()
railings()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_metro.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_metro.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
