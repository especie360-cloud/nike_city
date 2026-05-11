import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)


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


MATS = {}


def init_materials():
    MATS.update(
        {
            "base": mat("warm white ceramic base", (0.965, 0.945, 0.895, 1)),
            "side": mat("soft bevel grey", (0.78, 0.76, 0.70, 1)),
            "road": mat("matte black asphalt", (0.018, 0.019, 0.021, 1), 0.82),
            "black": mat("nike black satin", (0.006, 0.006, 0.006, 1), 0.58),
            "yellow": mat("nike plaza yellow", (1.0, 0.68, 0.0, 1), 0.46),
            "white": mat("clean white", (1, 1, 1, 1), 0.68),
            "glass": mat("deep blue black glass", (0.02, 0.09, 0.105, 1), 0.28, 0.05),
            "grey": mat("street pole grey", (0.58, 0.57, 0.53, 1), 0.8),
            "line": mat("painted road white", (1, 1, 1, 1), 0.64),
        }
    )


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.04, segments=3):
    mod = obj.modifiers.new("soft rounded bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted normal", "WEIGHTED_NORMAL")
    return obj


def cube(name, loc, scale, material, bevel_amount=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, material)
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cyl(name, loc, radius, depth, material, vertices=64, bevel_amount=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cone(name, loc, radius1, depth, material, vertices=40):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=0, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    bevel(obj, 0.012, 2)
    return obj


def torus(name, loc, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=128, minor_segments=12, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def text_obj(name, body, loc, size, material, rot=(math.radians(70), 0, math.radians(0))):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.008
    assign(obj, material)
    return obj


def swoosh():
    points = [
        (-0.58, -0.05, 0),
        (-0.30, -0.18, 0),
        (0.78, 0.15, 0),
        (0.05, 0.04, 0),
        (-0.48, 0.17, 0),
        (-0.76, 0.18, 0),
    ]
    mesh = bpy.data.meshes.new("swoosh mesh")
    mesh.from_pydata(points, [], [(0, 1, 2, 3, 4, 5)])
    mesh.update()
    obj = bpy.data.objects.new("raised white swoosh", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0, 0, 1.505)
    obj.scale = (0.92, 0.92, 0.92)
    obj.rotation_euler = (0, 0, math.radians(-12))
    assign(obj, MATS["white"])
    solid = obj.modifiers.new("thin raised logo", "SOLIDIFY")
    solid.thickness = 0.018
    bevel(obj, 0.005, 1)
    return obj


def road(x, y, w, d, rot=0):
    cube("surrounding black road slab", (x, y, 0.13), (w, d, 0.06), MATS["road"], 0.015, (0, 0, rot))
    long = w > d
    count = int(max(w, d) / 0.62)
    for i in range(count):
        offset = -max(w, d) / 2 + 0.42 + i * 0.72
        lx = offset if long else 0
        ly = 0 if long else offset
        px = x + math.cos(rot) * lx - math.sin(rot) * ly
        py = y + math.sin(rot) * lx + math.cos(rot) * ly
        cube("short dashed road stripe", (px, py, 0.17), (0.28 if long else 0.04, 0.04 if long else 0.28, 0.018), MATS["line"], 0.004, (0, 0, rot))


def crosswalk(x, y, rot=0):
    for i in range(-3, 4):
        lx = i * 0.18
        px = x + math.cos(rot) * lx
        py = y + math.sin(rot) * lx
        cube("zebra crossing stripe", (px, py, 0.19), (0.075, 0.72, 0.018), MATS["line"], 0.003, (0, 0, rot))


def tree(x, y, flip=False):
    cyl("thin black tree trunk", (x, y, 0.48), 0.04, 0.45, MATS["black"], 12)
    cone("stacked stylized tree cone", (x, y, 0.84), 0.18, 0.42, MATS["white" if flip else "yellow"], 28)
    cone("stacked stylized tree top", (x, y, 1.12), 0.13, 0.34, MATS["yellow" if flip else "white"], 28)


def lamp(x, y):
    cyl("slender street light pole", (x, y, 0.65), 0.025, 0.82, MATS["grey"], 14)
    cyl("round yellow lamp cap", (x, y, 1.08), 0.075, 0.08, MATS["yellow"], 24)
    cone("small white lamp glow", (x, y, 1.16), 0.078, 0.11, MATS["white"], 24)


def bench(x, y, rot=0):
    cube("yellow plaza bench seat", (x, y, 0.34), (0.56, 0.14, 0.08), MATS["yellow"], 0.018, (0, 0, rot))
    cube("black plaza bench back", (x, y + 0.1, 0.48), (0.62, 0.055, 0.05), MATS["black"], 0.012, (0, 0, rot))
    cube("bench metal leg", (x - 0.2, y, 0.25), (0.035, 0.035, 0.16), MATS["grey"], 0.006, (0, 0, rot))
    cube("bench metal leg", (x + 0.2, y, 0.25), (0.035, 0.035, 0.16), MATS["grey"], 0.006, (0, 0, rot))


def umbrella(x, y, rot=0):
    cyl("umbrella slim pole", (x, y, 0.58), 0.018, 0.62, MATS["grey"], 12)
    top = cone("yellow cafe umbrella canopy", (x, y, 0.91), 0.27, 0.2, MATS["yellow"], 48)
    top.rotation_euler[2] = rot
    for i in range(4):
        r = rot + i * math.pi / 2
        cube("white umbrella rib", (x + math.cos(r) * 0.08, y + math.sin(r) * 0.08, 0.93), (0.22, 0.018, 0.012), MATS["white"], 0.004, (0, 0, r))


def traffic_cone(x, y):
    cube("yellow traffic cone base", (x, y, 0.24), (0.18, 0.18, 0.045), MATS["yellow"], 0.01)
    cone("white traffic cone body", (x, y, 0.42), 0.085, 0.28, MATS["white"], 18)
    torus("thin yellow cone ring", (x, y, 0.47), 0.055, 0.007, MATS["yellow"])


def facade_panels():
    for i in range(32):
        angle = i / 32 * math.tau
        x = math.cos(angle) * 1.245
        y = math.sin(angle) * 1.245
        material = MATS["yellow"] if i % 4 == 0 else MATS["glass"]
        obj = cube("individual dark/yellow facade panel", (x, y, 0.66), (0.09, 0.04, 0.38), material, 0.005)
        obj.rotation_euler[2] = angle


def plaza():
    cube("large visible rounded square base", (0, 0, 0.0), (7.6, 5.6, 0.28), MATS["base"], 0.28)
    road(0, -2.95, 8.8, 0.74, 0)
    road(0, 2.95, 8.8, 0.74, 0)
    road(-3.98, 0, 0.74, 6.4, 0)
    road(3.98, 0, 0.74, 6.4, 0)
    crosswalk(-2.6, -2.95, math.radians(90))
    crosswalk(2.6, 2.95, math.radians(90))
    crosswalk(-3.98, 1.55, 0)
    crosswalk(3.98, -1.55, 0)

    cyl("round white plaza central body", (0, 0, 0.56), 1.22, 0.72, MATS["white"], 128, 0.015)
    cyl("continuous black facade band", (0, 0, 0.66), 1.245, 0.28, MATS["black"], 128, 0.008)
    facade_panels()
    cube("yellow entrance portal frame", (0, -1.19, 0.52), (0.48, 0.18, 0.52), MATS["yellow"], 0.018)
    cube("dark glass entrance door", (0, -1.26, 0.53), (0.3, 0.08, 0.38), MATS["glass"], 0.012)

    cyl("thin yellow roof skirt", (0, 0, 0.97), 1.12, 0.09, MATS["yellow"], 128, 0.01)
    cyl("black circular roof lip", (0, 0, 1.07), 1.0, 0.14, MATS["black"], 128, 0.012)
    cyl("yellow raised dome ring", (0, 0, 1.18), 0.87, 0.08, MATS["yellow"], 128, 0.01)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=32, radius=0.78, location=(0, 0, 1.25))
    dome = bpy.context.object
    dome.name = "smooth black flattened plaza dome"
    dome.scale.z = 0.28
    assign(dome, MATS["black"])
    bpy.ops.object.shade_smooth()
    bevel(dome, 0.002, 1)
    torus("yellow outline on dome edge", (0, 0, 1.22), 0.78, 0.018, MATS["yellow"])
    torus("subtle circular paving line one", (0, 0, 0.18), 1.55, 0.01, MATS["side"])
    torus("subtle circular paving line two", (0, 0, 0.185), 1.9, 0.008, MATS["side"])
    swoosh()

    for x, y, flip in [(-2.7, -1.65, False), (2.7, -1.55, True), (-2.75, 1.5, True), (2.65, 1.5, False), (-1.75, -2.05, False), (1.75, 2.05, False)]:
        tree(x, y, flip)
    for x, y in [(-2.2, 0.1), (2.2, -0.1), (-0.95, -2.04), (0.95, 2.05), (-3.15, -0.9), (3.15, 0.9)]:
        lamp(x, y)
    for x, y, r in [(-1.75, -1.45, 0.25), (1.75, -1.42, -0.25), (-1.65, 1.42, -0.2), (1.65, 1.45, 0.2)]:
        bench(x, y, r)
    for x, y, r in [(-2.02, 1.05, 0.1), (2.02, 1.05, -0.15), (-2.0, -1.05, 0.3), (2.0, -1.05, -0.25)]:
        umbrella(x, y, r)
    for x, y in [(-1.25, 1.82), (-1.05, 1.72), (1.16, -1.82), (1.36, -1.72), (-2.95, 0.42), (2.96, -0.42)]:
        traffic_cone(x, y)

    cyl("label black pole", (-1.68, -0.05, 0.8), 0.02, 1.1, MATS["black"], 12)
    cyl("label yellow circular pin", (-1.68, -0.05, 1.38), 0.22, 0.08, MATS["yellow"], 36)
    cube("black label plaque", (-0.85, -0.05, 1.34), (1.56, 0.08, 0.36), MATS["black"], 0.08)
    text_obj("3d text zona_plaza central", "zona_plaza central", (-0.84, -0.1, 1.36), 0.16, MATS["white"], (math.radians(82), 0, 0))


def setup_camera_lights():
    bpy.ops.object.light_add(type="AREA", location=(-3.5, -4.5, 7.0))
    light = bpy.context.object
    light.name = "large softbox key light"
    light.data.energy = 520
    light.data.size = 5.0
    bpy.ops.object.camera_add(location=(5.4, -6.1, 5.2), rotation=(math.radians(60), 0, math.radians(42)))
    bpy.context.scene.camera = bpy.context.object


clear_scene()
init_materials()
plaza()
setup_camera_lights()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_plaza_central.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ASSETS / "zona_plaza_central_blender.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
