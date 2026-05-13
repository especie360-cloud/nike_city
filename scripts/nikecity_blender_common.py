import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ZONE_DIR = ASSETS / "models" / "zones"
ZONE_DIR.mkdir(parents=True, exist_ok=True)


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
        "field": mat("deep sport black", (0.028, 0.031, 0.031, 1), 0.62),
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "amber": mat("burnt amber shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("soft white line", (0.96, 0.96, 0.93, 1), 0.76),
        "paving": mat("subtle paving line", (0.72, 0.70, 0.64, 1), 0.86),
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
    bpy.ops.mesh.primitive_uv_sphere_add(segments=42, ring_count=16, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def rounded_rect_points(width, depth, radius, segments=18):
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


def rounded_box(name, width, depth, height, radius, material, loc=(0, 0, 0)):
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
    smooth(obj)
    bevel(obj, 0.014, 3)
    return obj


def base_platform(prefix, width, depth, radius, M):
    rounded_box(f"{prefix} platform top", width, depth, 0.12, radius, M["porcelain"], (0, 0, 0.03))
    rounded_box(f"{prefix} platform side", width + 0.05, depth + 0.05, 0.12, radius + 0.02, M["side"], (0, 0, -0.055))
    rounded_box(f"{prefix} platform lower lip", width - 0.18, depth - 0.18, 0.03, max(radius - 0.04, 0.08), M["porcelain"], (0, 0, -0.13))


def swoosh(loc, scale, rot, material, name="nike swoosh"):
    points = [
        (-0.54, -0.09, 0), (-0.49, -0.16, 0), (-0.39, -0.205, 0),
        (-0.27, -0.19, 0), (-0.10, -0.125, 0), (0.13, -0.025, 0),
        (0.43, 0.11, 0), (0.62, 0.20, 0), (0.66, 0.185, 0),
        (0.38, 0.055, 0), (0.13, -0.035, 0), (-0.10, -0.085, 0),
        (-0.29, -0.08, 0), (-0.43, -0.015, 0), (-0.53, 0.085, 0),
        (-0.58, 0.055, 0), (-0.58, -0.015, 0),
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.scale = (0.46 * scale, 0.58 * scale, 1)
    obj.rotation_euler = (0, 0, rot)
    assign(obj, material)
    solid = obj.modifiers.new("swoosh thickness", "SOLIDIFY")
    solid.thickness = 0.014 * scale
    bevel(obj, 0.003 * scale, 1)
    return obj


def lamp(x, y, M, scale=1.0):
    cyl("thin lamp pole", (x, y, 0.36 * scale), 0.012 * scale, 0.45 * scale, M["pole"], 12)
    sphere("small lamp bulb", (x, y, 0.61 * scale), 0.04 * scale, M["white"], (1, 1, 0.8))
    cyl("yellow lamp cap", (x, y, 0.635 * scale), 0.045 * scale, 0.025 * scale, M["yellow"], 20)


def tree(x, y, M, scale=1.0, white=False):
    cyl("tree base", (x, y, 0.1 * scale), 0.045 * scale, 0.03 * scale, M["yellow"], 18, 0.004)
    cyl("tree trunk", (x, y, 0.28 * scale), 0.02 * scale, 0.32 * scale, M["amber"], 12)
    material = M["white"] if white else M["yellow"]
    cone("tree lower crown", (x, y, 0.45 * scale), 0.13 * scale, 0.22 * scale, material, 32)
    cone("tree upper crown", (x, y, 0.61 * scale), 0.095 * scale, 0.18 * scale, material, 32)
    if not white:
        cone("tree white cap", (x, y, 0.69 * scale), 0.052 * scale, 0.085 * scale, M["white"], 24)


def bench(x, y, M, rot=0):
    cube("yellow bench seat", (x, y, 0.18), (0.34, 0.075, 0.045), M["yellow"], rot, 0.01)
    cube("black bench back", (x, y + 0.055, 0.25), (0.36, 0.035, 0.035), M["black"], rot, 0.008)


def nike_sign(x, y, M, rot=0):
    cyl("nike sign pole left", (x - 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cyl("nike sign pole right", (x + 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cube("yellow nike sign board", (x, y, 0.52), (0.33, 0.04, 0.16), M["yellow"], rot, 0.012)
    cube("black nike sign slash", (x, y, 0.53), (0.2, 0.018, 0.02), M["black"], rot + math.radians(-18), 0.004)


def setup_scene():
    bpy.ops.object.light_add(type="SUN", location=(-3.8, -4.5, 6.5), rotation=(math.radians(45), 0, math.radians(-35)))
    light = bpy.context.object
    light.name = "soft nike city sun"
    light.data.energy = 1.25
    bpy.ops.object.camera_add(location=(4.8, -5.6, 4.4), rotation=(math.radians(60), 0, math.radians(41)))
    bpy.context.scene.camera = bpy.context.object
    engines = {item.identifier for item in bpy.context.scene.render.bl_rna.properties["engine"].enum_items}
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH", "CYCLES"):
        if engine in engines:
            bpy.context.scene.render.engine = engine
            break
    bpy.context.scene.world.color = (0.965, 0.955, 0.93)
