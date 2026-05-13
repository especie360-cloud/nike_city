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


def mat(name, color, roughness=0.72, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return material


def make_materials():
    return {
        "porcelain": mat("warm toy-city white", (0.985, 0.975, 0.94, 1), 0.78),
        "side": mat("soft warm grey platform side", (0.76, 0.745, 0.69, 1), 0.86),
        "black": mat("satin nike black", (0.006, 0.006, 0.006, 1), 0.56),
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "yellow_shadow": mat("burnt amber side shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("road marking white", (0.96, 0.96, 0.93, 1), 0.76),
        "paving": mat("subtle warm paving line", (0.72, 0.70, 0.64, 1), 0.86),
        "glass": mat("near black parking glass", (0.018, 0.018, 0.017, 1), 0.45),
    }


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.04, segments=3):
    mod = obj.modifiers.new("soft toy bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted clean normals", "WEIGHTED_NORMAL")
    return obj


def smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.update()
    return obj


def cube(name, loc, scale, material, rot=0, bevel_amount=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, material)
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cyl(name, loc, radius, depth, material, vertices=96, bevel_amount=0.0, rot=(0, 0, 0)):
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
    rounded_box_mesh("rounded estacionamiento modular platform top", 4.3, 4.3, 0.12, 0.62, M["porcelain"], 0.03)
    rounded_box_mesh("soft grey estacionamiento platform side", 4.34, 4.34, 0.12, 0.64, M["side"], -0.055)
    rounded_box_mesh("thin warm white estacionamiento lower lip", 4.18, 4.18, 0.03, 0.58, M["porcelain"], -0.13)
    for radius in (1.38, 1.74):
        ring = torus("subtle circular parking paving guide", (0, 0, 0.112), radius, 0.006, M["paving"])
        ring.scale.y = 0.88


def circular_road():
    cyl("black circular turntable roadway", (0, 0, 0.145), 1.38, 0.035, M["black"], 160, 0.006)
    cyl("white inner island mask", (0, 0, 0.168), 0.94, 0.038, M["porcelain"], 160, 0.006)
    torus("thin outer white road edge", (0, 0, 0.19), 1.38, 0.01, M["line"])
    torus("thin inner white road edge", (0, 0, 0.19), 0.94, 0.01, M["line"])
    for i in range(18):
        angle = i / 18 * math.tau
        if math.sin(angle) < -0.72:
            continue
        cube(
            "short dashed lane mark around turntable",
            (math.cos(angle) * 1.16, math.sin(angle) * 1.16, 0.205),
            (0.16, 0.018, 0.01),
            M["line"],
            angle + math.pi / 2,
            0.003,
        )


def parking_core():
    cyl("low circular white parking building body", (0, 0, 0.42), 0.94, 0.48, M["porcelain"], 160, 0.016)
    cyl("black parking facade band", (0, 0, 0.39), 0.97, 0.22, M["black"], 160, 0.006)
    cyl("yellow amber lower building ring", (0, 0, 0.3), 0.985, 0.055, M["yellow_shadow"], 160, 0.006)
    cyl("white upper parking cap", (0, 0, 0.66), 0.98, 0.13, M["porcelain"], 160, 0.012)
    cyl("flat black turntable roof disk", (0, 0, 0.78), 0.66, 0.06, M["black"], 160, 0.01)
    torus("thin yellow roof parking accent", (0, 0, 0.825), 0.66, 0.018, M["yellow"])
    for i in range(20):
        angle = i / 20 * math.tau
        if i % 2:
            continue
        cube(
            "yellow black facade chevron block",
            (math.cos(angle) * 0.985, math.sin(angle) * 0.985, 0.36),
            (0.16, 0.045, 0.18),
            M["yellow"],
            angle + math.radians(18),
            0.006,
        )


def arch_gateway():
    y = -1.0
    cube("tall white front parking gateway left leg", (-0.32, y, 0.58), (0.22, 0.22, 0.92), M["porcelain"], 0, 0.03)
    cube("tall white front parking gateway right leg", (0.32, y, 0.58), (0.22, 0.22, 0.92), M["porcelain"], 0, 0.03)
    cyl("rounded top white parking gateway", (0, y, 1.04), 0.43, 0.22, M["porcelain"], 72, 0.02, (math.pi / 2, 0, 0))
    cube("black deep gateway tunnel", (0, y - 0.015, 0.54), (0.42, 0.245, 0.72), M["black"], 0, 0.035)
    cyl("rounded black tunnel top", (0, y - 0.02, 0.91), 0.215, 0.25, M["black"], 64, 0.01, (math.pi / 2, 0, 0))
    cube("yellow inner gateway left trim", (-0.43, y - 0.02, 0.55), (0.08, 0.245, 0.72), M["yellow"], 0, 0.012)
    cube("yellow inner gateway right trim", (0.43, y - 0.02, 0.55), (0.08, 0.245, 0.72), M["yellow"], 0, 0.012)
    cyl("yellow rounded gateway crown", (0, y - 0.025, 0.92), 0.30, 0.25, M["yellow"], 64, 0.012, (math.pi / 2, 0, 0))
    cube("black gateway opening cover", (0, y - 0.05, 0.58), (0.38, 0.27, 0.62), M["black"], 0, 0.025)
    cube("white small top icon panel", (0, y - 0.13, 1.22), (0.38, 0.03, 0.22), M["white"], 0, 0.016)
    parking_p_icon((0, y - 0.155, 1.225), 0.17, face_y=True)


def ramp_and_car():
    cube("black entrance ramp to turntable", (0, -1.36, 0.19), (0.48, 1.22, 0.045), M["black"], 0, 0.012)
    cube("yellow ramp border left", (-0.29, -1.36, 0.23), (0.045, 1.18, 0.045), M["yellow"], 0, 0.006)
    cube("yellow ramp border right", (0.29, -1.36, 0.23), (0.045, 1.18, 0.045), M["yellow"], 0, 0.006)
    for i in range(5):
        cube("yellow chevron ramp stripe left", (-0.08, -1.78 + i * 0.18, 0.25), (0.23, 0.045, 0.012), M["yellow"], math.radians(34), 0.003)
        cube("yellow chevron ramp stripe right", (0.08, -1.78 + i * 0.18, 0.25), (0.23, 0.045, 0.012), M["yellow"], math.radians(-34), 0.003)

    cube("compact yellow parking car body", (0, -1.05, 0.32), (0.28, 0.46, 0.13), M["yellow"], 0, 0.04)
    cube("black car windshield", (0, -1.0, 0.405), (0.2, 0.16, 0.045), M["black"], 0, 0.018)
    cube("white car roof highlight", (0, -1.08, 0.43), (0.18, 0.18, 0.035), M["white"], 0, 0.018)
    for x in (-0.16, 0.16):
        cyl("tiny black car wheel", (x, -0.86, 0.28), 0.04, 0.035, M["black"], 20, 0.002, (0, math.pi / 2, 0))
        cyl("tiny black car wheel", (x, -1.22, 0.28), 0.04, 0.035, M["black"], 20, 0.002, (0, math.pi / 2, 0))


def railings():
    for side_x in (-0.48, 0.48):
        cube("yellow ramp rail top", (side_x, -1.48, 0.45), (0.035, 1.15, 0.035), M["yellow"], 0, 0.006)
        for i in range(5):
            y = -1.92 + i * 0.25
            cyl("thin grey ramp rail post", (side_x, y, 0.32), 0.012, 0.28, M["pole"], 10)
    for side in (-1, 1):
        for i in range(5):
            x = side * (0.75 + i * 0.16)
            cube("side yellow barrier segment", (x, -0.95, 0.32), (0.12, 0.035, 0.04), M["yellow"], 0, 0.006)
            cyl("side grey barrier post", (x, -0.95, 0.25), 0.01, 0.25, M["pole"], 10)


def parking_p_icon(loc, scale=0.18, face_y=False):
    x, y, z = loc
    rot = (math.pi / 2, 0, 0) if face_y else (0, 0, 0)
    cyl("yellow parking icon disk", (x, y, z), scale, 0.025, M["yellow"], 40, 0.004, rot)
    cyl("black parking icon disk outline", (x, y - 0.002 if face_y else y, z), scale * 1.08, 0.012, M["black"], 40, 0.002, rot)
    if face_y:
        cube("black parking P vertical stem", (x - scale * 0.18, y - 0.018, z), (scale * 0.12, 0.018, scale * 0.92), M["black"], 0, 0.004)
        cube("black parking P top bowl", (x + scale * 0.06, y - 0.02, z + scale * 0.22), (scale * 0.42, 0.018, scale * 0.18), M["black"], 0, 0.004)
        cube("black parking P side bowl", (x + scale * 0.24, y - 0.02, z + scale * 0.06), (scale * 0.12, 0.018, scale * 0.34), M["black"], 0, 0.004)
    else:
        cube("black parking P vertical stem", (x - scale * 0.18, y, z + 0.01), (scale * 0.12, scale * 0.92, 0.018), M["black"], 0, 0.004)
        cube("black parking P top bowl", (x + scale * 0.06, y + scale * 0.22, z + 0.012), (scale * 0.42, scale * 0.18, 0.018), M["black"], 0, 0.004)
        cube("black parking P side bowl", (x + scale * 0.24, y + scale * 0.06, z + 0.012), (scale * 0.12, scale * 0.34, 0.018), M["black"], 0, 0.004)


def tree(x, y, scale=1.0):
    cyl("small parking tree base", (x, y, 0.105 * scale), 0.05 * scale, 0.03 * scale, M["yellow"], 18, 0.004)
    cyl("slim amber tree trunk", (x, y, 0.3 * scale), 0.022 * scale, 0.35 * scale, M["yellow_shadow"], 12)
    cone("stacked cone tree lower crown", (x, y, 0.47 * scale), 0.13 * scale, 0.23 * scale, M["yellow"], 32)
    cone("stacked cone tree upper crown", (x, y, 0.63 * scale), 0.10 * scale, 0.2 * scale, M["yellow"], 32)
    cone("white tree cap highlight", (x, y, 0.71 * scale), 0.055 * scale, 0.09 * scale, M["white"], 24)


def lamp(x, y, scale=1.0):
    cyl("thin estacionamiento lamp pole", (x, y, 0.36 * scale), 0.012 * scale, 0.46 * scale, M["pole"], 12)
    sphere("small white lamp bulb", (x, y, 0.61 * scale), 0.04 * scale, M["white"], (1, 1, 0.8))
    cyl("tiny yellow lamp cap", (x, y, 0.635 * scale), 0.045 * scale, 0.025 * scale, M["yellow"], 20)


def sign_flag(x, y, rot=0):
    cyl("thin parking flag pole", (x, y, 0.43), 0.012, 0.62, M["pole"], 12)
    cube("yellow parking nike flag", (x, y, 0.68), (0.28, 0.035, 0.16), M["yellow"], rot, 0.012)
    cube("black mini flag slash", (x + math.cos(rot) * 0.02, y + math.sin(rot) * 0.02, 0.69), (0.16, 0.018, 0.02), M["black"], rot + math.radians(-18), 0.004)


def props():
    for x, y, s in [(-1.72, 1.22, 0.78), (1.72, 1.12, 0.74), (-1.7, -0.45, 0.66), (1.72, -0.52, 0.66)]:
        tree(x, y, s)
    for x, y, s in [(-1.12, 1.52, 0.7), (1.15, 1.5, 0.7), (-1.38, -1.55, 0.66), (1.38, -1.55, 0.66)]:
        lamp(x, y, s)
    sign_flag(1.82, -1.12, math.radians(8))
    sign_flag(-1.86, 0.52, math.radians(-8))
    parking_p_icon((-1.28, -1.12, 0.17), 0.16, False)
    cyl("small circular service pad", (-1.1, -1.62, 0.15), 0.18, 0.045, M["porcelain"], 48, 0.008)
    cyl("black service pad center", (-1.1, -1.62, 0.19), 0.11, 0.025, M["black"], 48, 0.004)
    cyl("yellow service pad button", (-1.1, -1.62, 0.24), 0.045, 0.08, M["yellow"], 28, 0.004)


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
circular_road()
parking_core()
arch_gateway()
ramp_and_car()
railings()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_estacionamiento.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_estacionamiento.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
