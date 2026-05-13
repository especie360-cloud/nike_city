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
        "track": mat("running orange track", (1.0, 0.42, 0.0, 1), 0.52),
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "yellow_shadow": mat("burnt amber shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("track lane white", (0.96, 0.96, 0.93, 1), 0.76),
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


def cyl(name, loc, radius, depth, material, vertices=64, bevel_amount=0, rot=(0, 0, 0)):
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
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=18, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
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
            angle = start + (end - start) * (i / segments)
            points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    return points


def rounded_rect_ring_mesh(name, outer_w, outer_d, inner_w, inner_d, outer_r, inner_r, z, material):
    outer = rounded_rect_points(outer_w, outer_d, outer_r)
    inner = rounded_rect_points(inner_w, inner_d, inner_r)
    verts = [(x, y, z) for x, y in outer] + [(x, y, z) for x, y in inner]
    n = len(outer)
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, j + n, i + n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    solid = obj.modifiers.new("thin raised tartan surface", "SOLIDIFY")
    solid.thickness = 0.012
    bevel(obj, 0.003, 1)
    return obj


def base():
    rounded_box_mesh("rounded running modular platform top", 4.42, 3.72, 0.12, 0.52, M["porcelain"], 0.03)
    rounded_box_mesh("soft grey running platform side", 4.46, 3.76, 0.12, 0.54, M["side"], -0.055)
    rounded_box_mesh("thin warm white running lower lip", 4.28, 3.58, 0.03, 0.48, M["porcelain"], -0.13)
    rounded_box_mesh("subtle raised inner sport slab", 3.35, 2.45, 0.08, 0.42, M["porcelain"], 0.12)


def swoosh(loc, scale=1.0, rot=0):
    points = [
        (-0.54, -0.09, 0), (-0.49, -0.16, 0), (-0.39, -0.205, 0),
        (-0.27, -0.19, 0), (-0.10, -0.125, 0), (0.13, -0.025, 0),
        (0.43, 0.11, 0), (0.62, 0.20, 0), (0.66, 0.185, 0),
        (0.38, 0.055, 0), (0.13, -0.035, 0), (-0.10, -0.085, 0),
        (-0.29, -0.08, 0), (-0.43, -0.015, 0), (-0.53, 0.085, 0),
        (-0.58, 0.055, 0), (-0.58, -0.015, 0),
    ]
    mesh = bpy.data.meshes.new("running swoosh mesh")
    mesh.from_pydata(points, [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new("clean raised running nike swoosh", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.scale = (0.46 * scale, 0.58 * scale, 1)
    obj.rotation_euler = (0, 0, rot)
    assign(obj, M["white"])
    solid = obj.modifiers.new("swoosh thickness", "SOLIDIFY")
    solid.thickness = 0.018 * scale
    bevel(obj, 0.003 * scale, 1)
    return obj


def running_track():
    rounded_box_mesh("slightly raised running track foundation", 3.22, 2.38, 0.04, 0.54, M["porcelain"], 0.165)
    rounded_rect_ring_mesh("solid orange tartan running track", 3.04, 2.2, 2.3, 1.46, 0.5, 0.32, 0.205, M["track"])
    rounded_rect_ring_mesh("outer white tartan border", 3.08, 2.24, 3.0, 2.16, 0.52, 0.48, 0.226, M["line"])
    rounded_rect_ring_mesh("inner white tartan border", 2.38, 1.54, 2.3, 1.46, 0.36, 0.32, 0.229, M["line"])
    for outer_w, outer_d, inner_w, inner_d, outer_r, inner_r in [
        (2.86, 2.02, 2.80, 1.96, 0.45, 0.43),
        (2.68, 1.84, 2.62, 1.78, 0.41, 0.39),
        (2.50, 1.66, 2.44, 1.60, 0.36, 0.34),
    ]:
        rounded_rect_ring_mesh("thin white tartan lane separator", outer_w, outer_d, inner_w, inner_d, outer_r, inner_r, 0.236, M["line"])
    rounded_box_mesh("white track infield slab", 2.16, 1.32, 0.035, 0.26, M["porcelain"], 0.218)
    rounded_box_mesh("dark inner training court", 1.22, 0.58, 0.035, 0.12, M["black"], 0.25).location.x = 0.52
    for offset in (-0.28, -0.1, 0.08, 0.26):
        cube("white tartan start finish stripe", (-1.08 + offset, -0.95, 0.255), (0.025, 0.56, 0.014), M["line"], math.radians(-7), 0.002)
    for x in (0.2, 0.55, 0.9):
        cube("subtle amber court marking", (x, -0.35, 0.26), (0.23, 0.012, 0.01), M["yellow_shadow"], math.radians(8), 0.002)
        cube("subtle amber court marking", (x, -0.05, 0.26), (0.23, 0.012, 0.01), M["yellow_shadow"], math.radians(-8), 0.002)


def building():
    rounded_box_mesh("rounded white running building body", 1.18, 0.92, 0.62, 0.16, M["porcelain"], 0.48)
    rounded_box_mesh("thin yellow base trim running shop", 1.22, 0.96, 0.055, 0.17, M["yellow_shadow"], 0.22)
    rounded_box_mesh("black rounded roof panel", 0.92, 0.62, 0.07, 0.12, M["black"], 0.83)
    rounded_box_mesh("thin yellow roof underglow", 1.0, 0.7, 0.04, 0.14, M["yellow"], 0.78)
    swoosh((0.0, 0.02, 0.89), 0.72, math.radians(45))

    cube("front black glass double doors", (0.0, -0.48, 0.38), (0.42, 0.045, 0.36), M["black"], 0, 0.012)
    cube("yellow running door frame left", (-0.25, -0.5, 0.38), (0.06, 0.04, 0.4), M["yellow"], 0, 0.006)
    cube("yellow running door frame right", (0.25, -0.5, 0.38), (0.06, 0.04, 0.4), M["yellow"], 0, 0.006)
    cube("side black running window", (-0.61, -0.08, 0.38), (0.04, 0.38, 0.28), M["black"], 0, 0.01)
    cube("side yellow running window trim", (-0.63, -0.08, 0.38), (0.035, 0.46, 0.34), M["yellow"], 0, 0.006)
    cube("tiny wall swoosh bar", (-0.43, -0.42, 0.45), (0.21, 0.018, 0.018), M["yellow"], math.radians(-18), 0.004)


def tree(x, y, scale=1.0, white=False):
    cyl("small running tree base", (x, y, 0.1 * scale), 0.045 * scale, 0.03 * scale, M["yellow"], 18, 0.004)
    cyl("slim running tree trunk", (x, y, 0.28 * scale), 0.02 * scale, 0.32 * scale, M["yellow_shadow"], 12)
    material = M["white"] if white else M["yellow"]
    cone("running cone tree lower crown", (x, y, 0.45 * scale), 0.13 * scale, 0.22 * scale, material, 32)
    cone("running cone tree upper crown", (x, y, 0.61 * scale), 0.095 * scale, 0.18 * scale, material, 32)
    if not white:
        cone("running white tree cap", (x, y, 0.69 * scale), 0.052 * scale, 0.085 * scale, M["white"], 24)


def lamp(x, y, scale=1.0):
    cyl("thin running lamp pole", (x, y, 0.34 * scale), 0.012 * scale, 0.43 * scale, M["pole"], 12)
    sphere("small white running lamp bulb", (x, y, 0.58 * scale), 0.04 * scale, M["white"], (1, 1, 0.8))
    cyl("tiny yellow running lamp cap", (x, y, 0.61 * scale), 0.045 * scale, 0.025 * scale, M["yellow"], 20)


def bench(x, y, rot=0):
    cube("yellow running bench seat", (x, y, 0.18), (0.34, 0.075, 0.045), M["yellow"], rot, 0.01)
    cube("black running bench back", (x, y + 0.055, 0.25), (0.36, 0.035, 0.035), M["black"], rot, 0.008)
    for dx in (-0.13, 0.13):
        cyl("tiny bench leg", (x + math.cos(rot) * dx, y + math.sin(rot) * dx, 0.12), 0.009, 0.12, M["pole"], 8)


def sign(x, y, rot=0):
    cyl("thin running sign pole left", (x - 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cyl("thin running sign pole right", (x + 0.12, y, 0.32), 0.01, 0.42, M["pole"], 10)
    cube("yellow running sign board", (x, y, 0.52), (0.32, 0.04, 0.16), M["yellow"], rot, 0.012)
    cube("black sign swoosh slash", (x, y, 0.53), (0.2, 0.018, 0.02), M["black"], rot + math.radians(-18), 0.004)


def props():
    for x, y, s, white in [
        (-1.65, 1.12, 0.78, False), (1.72, 0.92, 0.70, True),
        (-1.72, -1.0, 0.68, False), (1.64, -1.16, 0.66, False),
        (-0.92, -1.35, 0.56, True), (0.98, 1.28, 0.58, False),
    ]:
        tree(x, y, s, white)
    for x, y in [(-1.86, 0.05), (1.86, 0.04), (-0.95, 1.38), (0.95, -1.38), (-1.1, -1.26), (1.1, 1.22)]:
        lamp(x, y, 0.72)
    bench(-1.45, -0.62, math.radians(4))
    bench(1.52, -0.56, math.radians(-6))
    bench(-0.55, 1.42, math.radians(0))
    sign(1.74, 0.48, math.radians(7))
    sign(-1.74, -0.42, math.radians(-7))
    for x in (-1.38, 1.38):
        cube("low grey running guard rail", (x, 0.92, 0.28), (0.45, 0.035, 0.04), M["line"], 0, 0.006)
        for dx in (-0.17, 0.17):
            cyl("small guard rail post", (x + dx, 0.92, 0.2), 0.01, 0.22, M["pole"], 10)


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
running_track()
building()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_running.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_running.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
