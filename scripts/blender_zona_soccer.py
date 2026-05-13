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
        "field": mat("black indoor soccer pitch", (0.028, 0.031, 0.031, 1), 0.62),
        "yellow": mat("reference orange nike yellow", (1.0, 0.42, 0.0, 1), 0.5),
        "yellow_shadow": mat("burnt amber shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("clean white", (1, 1, 1, 1), 0.65),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("field white line", (0.96, 0.96, 0.93, 1), 0.76),
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
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=18, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def torus(name, loc, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=96, minor_segments=8, location=loc)
    obj = bpy.context.object
    obj.name = name
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


def rounded_box_mesh(name, width, depth, height, radius, material, z_center):
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
    obj.location.z = z_center
    assign(obj, material)
    smooth(obj)
    bevel(obj, 0.014, 3)
    return obj


def rounded_rect_ring_mesh(name, outer_w, outer_d, inner_w, inner_d, outer_r, inner_r, z, material, thickness=0.035):
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
    solid = obj.modifiers.new("ring thickness", "SOLIDIFY")
    solid.thickness = thickness
    bevel(obj, 0.008, 2)
    return obj


def base():
    rounded_box_mesh("rounded soccer modular platform top", 4.62, 3.78, 0.12, 0.52, M["porcelain"], 0.03)
    rounded_box_mesh("soft grey soccer platform side", 4.67, 3.83, 0.12, 0.54, M["side"], -0.055)
    rounded_box_mesh("thin warm white soccer lower lip", 4.47, 3.63, 0.03, 0.48, M["porcelain"], -0.13)


def swoosh(loc, scale=1.0, rot=0, material=None):
    material = material or M["yellow"]
    points = [
        (-0.54, -0.09, 0), (-0.49, -0.16, 0), (-0.39, -0.205, 0),
        (-0.27, -0.19, 0), (-0.10, -0.125, 0), (0.13, -0.025, 0),
        (0.43, 0.11, 0), (0.62, 0.20, 0), (0.66, 0.185, 0),
        (0.38, 0.055, 0), (0.13, -0.035, 0), (-0.10, -0.085, 0),
        (-0.29, -0.08, 0), (-0.43, -0.015, 0), (-0.53, 0.085, 0),
        (-0.58, 0.055, 0), (-0.58, -0.015, 0),
    ]
    mesh = bpy.data.meshes.new("soccer swoosh mesh")
    mesh.from_pydata(points, [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new("soccer nike swoosh", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.scale = (0.44 * scale, 0.56 * scale, 1)
    obj.rotation_euler = (0, 0, rot)
    assign(obj, material)
    solid = obj.modifiers.new("swoosh thickness", "SOLIDIFY")
    solid.thickness = 0.016 * scale
    bevel(obj, 0.003 * scale, 1)
    return obj


def stadium():
    # Stable stadium shell: four continuous walls plus rounded corner posts.
    cube("front continuous yellow stadium wall", (0, -1.06, 0.42), (2.38, 0.22, 0.58), M["yellow"], 0, 0.04)
    cube("rear continuous yellow stadium wall", (0, 1.06, 0.42), (2.38, 0.22, 0.58), M["yellow"], 0, 0.04)
    cube("left continuous yellow stadium wall", (-1.28, 0, 0.42), (0.22, 1.68, 0.58), M["yellow"], 0, 0.04)
    cube("right continuous yellow stadium wall", (1.28, 0, 0.42), (0.22, 1.68, 0.58), M["yellow"], 0, 0.04)
    for x in (-1.18, 1.18):
        for y in (-0.96, 0.96):
            cyl("rounded yellow stadium corner", (x, y, 0.42), 0.18, 0.58, M["yellow"], 40, 0.012)

    # Black horizontal facade band, kept flush and simple like the turnaround.
    cube("front black stadium facade band", (-0.18, -1.19, 0.47), (1.5, 0.035, 0.25), M["black"], 0, 0.006)
    cube("rear black stadium facade band", (0, 1.19, 0.47), (1.4, 0.035, 0.23), M["black"], 0, 0.006)
    cube("left black stadium facade band", (-1.41, -0.1, 0.47), (0.035, 0.78, 0.23), M["black"], 0, 0.006)
    cube("right black stadium facade band", (1.41, -0.1, 0.47), (0.035, 0.78, 0.23), M["black"], 0, 0.006)
    cube("front central black door", (0.62, -1.215, 0.34), (0.25, 0.018, 0.25), M["black"], 0, 0.004)
    cube("front yellow door frame flush", (0.62, -1.228, 0.44), (0.35, 0.012, 0.28), M["yellow"], 0, 0.002)
    swoosh((-0.5, -1.218, 0.48), 0.36, math.radians(16), M["yellow"])
    cube("front yellow service awning left", (-1.02, -1.215, 0.56), (0.32, 0.02, 0.045), M["yellow"], 0, 0.003)
    cube("front black service door left", (-1.02, -1.226, 0.36), (0.22, 0.012, 0.22), M["black"], 0, 0.003)
    cube("front thin lower black plinth", (0, -1.205, 0.16), (2.15, 0.035, 0.06), M["black"], 0, 0.004)

    # Roof frame as explicit bars instead of a fragile solidified ring.
    cube("front slim white roof bar", (0, -1.03, 0.82), (2.62, 0.17, 0.13), M["porcelain"], 0, 0.035)
    cube("rear slim white roof bar", (0, 1.03, 0.82), (2.62, 0.17, 0.13), M["porcelain"], 0, 0.035)
    cube("left slim white roof bar", (-1.28, 0, 0.82), (0.17, 1.78, 0.13), M["porcelain"], 0, 0.035)
    cube("right slim white roof bar", (1.28, 0, 0.82), (0.17, 1.78, 0.13), M["porcelain"], 0, 0.035)
    cube("front thin black roof shadow seam", (0, -0.905, 0.745), (2.18, 0.035, 0.035), M["black"], 0, 0.004)
    cube("rear thin black roof shadow seam", (0, 0.905, 0.745), (2.18, 0.035, 0.035), M["black"], 0, 0.004)
    cube("left thin black roof shadow seam", (-1.145, 0, 0.745), (0.035, 1.38, 0.035), M["black"], 0, 0.004)
    cube("right thin black roof shadow seam", (1.145, 0, 0.745), (0.035, 1.38, 0.035), M["black"], 0, 0.004)
    for x in (-1.18, 1.18):
        for y in (-0.93, 0.93):
            cyl("rounded white roof corner", (x, y, 0.82), 0.16, 0.13, M["porcelain"], 40, 0.008)

    # Hard vertical bowl walls: these make the field read as sunken from isometric view.
    cube("front black vertical pit wall", (0, -0.54, 0.35), (1.72, 0.07, 0.48), M["black"], 0, 0.01)
    cube("rear black vertical pit wall", (0, 0.54, 0.35), (1.72, 0.07, 0.48), M["black"], 0, 0.01)
    cube("left black vertical pit wall", (-0.86, 0, 0.35), (0.07, 1.0, 0.48), M["black"], 0, 0.01)
    cube("right black vertical pit wall", (0.86, 0, 0.35), (0.07, 1.0, 0.48), M["black"], 0, 0.01)

    # Visible stepped seating inside the sunken bowl.
    for y, z, w in [(0.53, 0.24, 1.6), (0.62, 0.38, 1.76), (0.72, 0.54, 1.92), (-0.53, 0.24, 1.6), (-0.62, 0.38, 1.76), (-0.72, 0.54, 1.92)]:
        cube("yellow internal soccer grandstand tier", (0, y, z), (w, 0.065, 0.06), M["yellow"], 0, 0.006)
        cube("black grandstand shadow tier", (0, y * 0.985, z - 0.045), (w, 0.04, 0.04), M["black"], 0, 0.004)
    for x, z, d in [(-0.78, 0.24, 0.82), (-0.88, 0.38, 0.98), (-0.98, 0.54, 1.14), (0.78, 0.24, 0.82), (0.88, 0.38, 0.98), (0.98, 0.54, 1.14)]:
        cube("side yellow internal soccer grandstand tier", (x, 0, z), (0.065, d, 0.06), M["yellow"], 0, 0.006)
        cube("side black grandstand shadow tier", (x * 0.985, 0, z - 0.045), (0.04, d, 0.04), M["black"], 0, 0.004)

    # Interior goal boards seen in the reference.
    cube("rear interior yellow goal board frame", (0, 0.64, 0.32), (0.62, 0.035, 0.22), M["yellow"], 0, 0.004)
    cube("rear interior black goal board face", (0, 0.666, 0.32), (0.5, 0.012, 0.14), M["black"], 0, 0.002)
    cube("front interior yellow goal board frame", (0, -0.64, 0.32), (0.56, 0.035, 0.18), M["yellow"], 0, 0.004)
    cube("front interior black goal board face", (0, -0.666, 0.32), (0.44, 0.012, 0.11), M["black"], 0, 0.002)



def pitch():
    rounded_box_mesh("deep sunken black indoor soccer pitch", 1.62, 0.88, 0.05, 0.05, M["field"], 0.075)
    cube("soccer outer top touchline", (0, 0.39, 0.112), (1.38, 0.016, 0.011), M["line"], 0, 0.002)
    cube("soccer outer bottom touchline", (0, -0.39, 0.112), (1.38, 0.016, 0.011), M["line"], 0, 0.002)
    cube("soccer outer left sideline", (-0.69, 0, 0.113), (0.016, 0.78, 0.011), M["line"], 0, 0.002)
    cube("soccer outer right sideline", (0.69, 0, 0.113), (0.016, 0.78, 0.011), M["line"], 0, 0.002)
    cube("soccer halfway line", (0, 0, 0.116), (0.022, 0.78, 0.011), M["line"], 0, 0.002)
    cube("soccer center horizontal hint", (0, 0, 0.117), (1.38, 0.016, 0.011), M["line"], 0, 0.002)
    torus("soccer center circle", (0, 0, 0.121), 0.18, 0.005, M["line"])
    cyl("soccer center spot", (0, 0, 0.129), 0.02, 0.01, M["yellow"], 24)

    for y, sign in [(-0.39, -1), (0.39, 1)]:
        cube("soccer penalty box back line", (0, y, 0.123), (0.54, 0.016, 0.011), M["line"], 0, 0.002)
        cube("soccer penalty left side", (-0.27, y + sign * 0.09, 0.123), (0.016, 0.18, 0.011), M["line"], 0, 0.002)
        cube("soccer penalty right side", (0.27, y + sign * 0.09, 0.123), (0.016, 0.18, 0.011), M["line"], 0, 0.002)
        cube("soccer small goal box", (0, y + sign * 0.055, 0.125), (0.3, 0.014, 0.011), M["line"], 0, 0.002)
    goal(0, 0.455, math.pi)
    goal(0, -0.455, 0)


def goal(x, y, rot=0):
    cube("white soccer goal crossbar", (x, y, 0.23), (0.42, 0.026, 0.026), M["white"], rot, 0.004)
    cube("white soccer goal left post", (x - 0.2, y, 0.18), (0.026, 0.026, 0.13), M["white"], rot, 0.004)
    cube("white soccer goal right post", (x + 0.2, y, 0.18), (0.026, 0.026, 0.13), M["white"], rot, 0.004)
    cube("yellow goal net back", (x, y + (0.04 if y < 0 else -0.04), 0.185), (0.4, 0.012, 0.1), M["yellow"], rot, 0.002)
    for i in range(4):
        cube("thin goal net stripe", (x - 0.15 + i * 0.1, y + (0.042 if y < 0 else -0.042), 0.185), (0.006, 0.01, 0.095), M["line"], rot, 0.001)


def soccer_ball_icon(x, y, z, scale=1.0):
    cyl("yellow soccer icon disk", (x, y, z), 0.16 * scale, 0.025 * scale, M["yellow"], 40, 0.004, (math.pi / 2, 0, 0))
    cyl("black soccer icon outline", (x, y - 0.003, z), 0.18 * scale, 0.012 * scale, M["black"], 40, 0.002, (math.pi / 2, 0, 0))
    cyl("black soccer icon center", (x, y - 0.017, z), 0.045 * scale, 0.012 * scale, M["black"], 6, 0.002, (math.pi / 2, 0, 0))
    for a in range(5):
        angle = a * math.tau / 5
        cube("soccer icon spoke", (x + math.cos(angle) * 0.07 * scale, y - 0.018, z + math.sin(angle) * 0.07 * scale), (0.055 * scale, 0.012, 0.025 * scale), M["black"], angle, 0.002)


def flag(x, y, rot=0):
    cyl("thin soccer flag pole", (x, y, 0.62), 0.014, 0.95, M["pole"], 12)
    cube("black raised soccer nike flag", (x, y, 1.02), (0.48, 0.045, 0.28), M["black"], rot, 0.012)
    swoosh((x, y - 0.03, 1.03), 0.55, rot + math.radians(16), M["yellow"])


def lamp(x, y, scale=1.0):
    cyl("thin soccer lamp pole", (x, y, 0.36 * scale), 0.012 * scale, 0.45 * scale, M["pole"], 12)
    sphere("small soccer lamp bulb", (x, y, 0.61 * scale), 0.04 * scale, M["white"], (1, 1, 0.8))
    cyl("tiny yellow soccer lamp cap", (x, y, 0.635 * scale), 0.045 * scale, 0.025 * scale, M["yellow"], 20)


def tree(x, y, scale=1.0, white=False):
    cyl("small soccer tree base", (x, y, 0.1 * scale), 0.045 * scale, 0.03 * scale, M["yellow"], 18, 0.004)
    cyl("slim soccer tree trunk", (x, y, 0.28 * scale), 0.02 * scale, 0.32 * scale, M["yellow_shadow"], 12)
    material = M["white"] if white else M["yellow"]
    cone("soccer tree lower crown", (x, y, 0.45 * scale), 0.13 * scale, 0.22 * scale, material, 32)
    cone("soccer tree upper crown", (x, y, 0.61 * scale), 0.095 * scale, 0.18 * scale, material, 32)
    if not white:
        cone("soccer white tree cap", (x, y, 0.69 * scale), 0.052 * scale, 0.085 * scale, M["white"], 24)


def bench(x, y, rot=0):
    cube("yellow soccer bench seat", (x, y, 0.18), (0.34, 0.075, 0.045), M["yellow"], rot, 0.01)
    cube("black soccer bench back", (x, y + 0.055, 0.25), (0.36, 0.035, 0.035), M["black"], rot, 0.008)


def umbrella(x, y, scale=1.0):
    cyl("thin umbrella pole soccer", (x, y, 0.28 * scale), 0.01 * scale, 0.38 * scale, M["pole"], 12)
    cyl("umbrella base soccer", (x, y, 0.09 * scale), 0.055 * scale, 0.025 * scale, M["yellow"], 24, 0.004)
    cyl("flat yellow umbrella canopy", (x, y, 0.52 * scale), 0.18 * scale, 0.035 * scale, M["yellow"], 32, 0.006)
    for a in range(4):
        cube("white umbrella segment", (x, y, 0.545 * scale), (0.17 * scale, 0.028 * scale, 0.012 * scale), M["white"], a * math.pi / 2, 0.002)


def props():
    flag(-1.48, 0.96, math.radians(4))
    soccer_ball_icon(-0.25, -1.38, 0.72, 1.0)
    tree(-1.85, 0.72, 0.74, True)
    tree(1.86, 0.7, 0.74, False)
    tree(-1.66, -1.18, 0.62, False)
    tree(1.66, -1.22, 0.62, True)
    umbrella(1.52, 1.2, 0.8)
    umbrella(-1.72, -0.52, 0.66)
    for x, y in [(-1.9, 0.1), (-1.04, 1.35), (1.06, 1.34), (1.9, 0.05), (-1.12, -1.34), (1.12, -1.34)]:
        lamp(x, y, 0.72)
    bench(-1.58, 1.18, math.radians(2))
    bench(1.58, -0.82, math.radians(-8))
    bench(1.75, 0.34, math.radians(88))
    cube("front entry stairs", (0.75, -1.42, 0.13), (0.48, 0.24, 0.035), M["porcelain"], 0, 0.006)
    for i in range(4):
        cube("thin stair line", (0.75, -1.51 + i * 0.045, 0.16), (0.44, 0.01, 0.012), M["line"], 0, 0.001)


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
stadium()
pitch()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_soccer.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_soccer.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
