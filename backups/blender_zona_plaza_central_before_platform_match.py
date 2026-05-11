import math
from pathlib import Path

import bpy
import mathutils


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
NIKE_SWOOSH_SVG = Path("/Users/oscar/Desktop/NIKECITY/nike-icon.svg")


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
        "porcelain": mat("warm reference white", (0.985, 0.975, 0.94, 1), 0.78),
        "side": mat("thin warm grey bevel side", (0.76, 0.745, 0.69, 1), 0.86),
        "shadow": mat("soft contact shadow grey", (0.68, 0.66, 0.61, 1), 0.9),
        "black": mat("satin nike black", (0.006, 0.006, 0.006, 1), 0.56),
            "yellow": mat("reference deeper orange amber", (1.0, 0.42, 0.0, 1), 0.5),
            "yellow_shadow": mat("deep burnt orange side shade", (0.62, 0.2, 0.0, 1), 0.62),
        "white": mat("bright clean white", (1, 1, 1, 1), 0.65),
        "glass": mat("near black warm storefront glass", (0.018, 0.018, 0.017, 1), 0.42, 0.03),
        "pole": mat("thin warm grey pole", (0.50, 0.49, 0.45, 1), 0.82),
        "line": mat("subtle warm paving line", (0.72, 0.70, 0.64, 1), 0.86),
    }


M = {}


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.04, segments=3):
    mod = obj.modifiers.new("rounded reference bevel", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted reference normals", "WEIGHTED_NORMAL")
    return obj


def clean_smooth(obj):
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


def cyl(name, loc, radius, depth, material, vertices=96, bevel_amount=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    if bevel_amount:
        bevel(obj, bevel_amount)
    return obj


def cone(name, loc, radius, depth, material, vertices=40):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=0.0, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    bevel(obj, 0.012, 2)
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=32, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def torus(name, loc, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=160, minor_segments=14, location=loc)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    return obj


def rounded_square_base():
    cube("single thin rounded-square plaza tile", (0, 0, 0), (4.08, 4.08, 0.12), M["porcelain"], 0, 0.72)
    cube("extra thin visible grey underside bevel", (0, 0, -0.052), (4.16, 4.16, 0.04), M["side"], 0, 0.72)
    for radius in (1.28, 1.58):
        ring = torus("thin engraved circular plaza paving guide", (0, 0, 0.095), radius, 0.006, M["line"])
        ring.scale.y = 0.78
    for angle in [math.radians(24), math.radians(156), math.radians(204), math.radians(336)]:
        cube("very subtle curved walkway tick", (math.cos(angle) * 1.74, math.sin(angle) * 1.3, 0.105), (0.28, 0.014, 0.01), M["line"], angle, 0.004)


def swoosh():
    before = set(bpy.data.objects)
    if NIKE_SWOOSH_SVG.exists():
        bpy.ops.import_curve.svg(filepath=str(NIKE_SWOOSH_SVG))
        imported = [obj for obj in bpy.data.objects if obj not in before]
        for obj in imported:
            obj.name = "real SVG Nike swoosh on roof"
            obj.data.materials.clear()
            assign(obj, M["white"])
            if hasattr(obj.data, "dimensions"):
                obj.data.dimensions = "2D"
            if hasattr(obj.data, "fill_mode"):
                obj.data.fill_mode = "BOTH"
            if hasattr(obj.data, "extrude"):
                obj.data.extrude = 0.0006
            obj.rotation_euler = (0, 0, 0)
            obj.location = (0, 0, 0)

        bpy.context.view_layer.update()
        world_corners = []
        for obj in imported:
            world_corners.extend([obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box])
        min_x = min(corner.x for corner in world_corners)
        max_x = max(corner.x for corner in world_corners)
        min_y = min(corner.y for corner in world_corners)
        max_y = max(corner.y for corner in world_corners)
        width = max_x - min_x or 1
        height = max_y - min_y or 1
        target_width = 0.72
        scale_factor = target_width / width
        cx = (min_x + max_x) * 0.5
        cy = (min_y + max_y) * 0.5

        empty = bpy.data.objects.new("roof swoosh svg group", None)
        bpy.context.collection.objects.link(empty)
        empty.location = (-0.02, -0.02, 1.158)
        empty.rotation_euler = (0, 0, math.radians(-18))

        for obj in imported:
            obj.location.x -= cx
            obj.location.y -= cy
            obj.location.z = 0
            obj.scale = (scale_factor, scale_factor, scale_factor)
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            obj.select_set(False)
            obj.rotation_euler = (0, 0, 0)
            obj.parent = empty
            obj.location = (0, -height * scale_factor * 0.08, 0)
            obj.scale.x *= 1.18
            obj.scale.y *= 0.72
        return empty

    points = [(-0.68, -0.06, 0), (-0.44, -0.2, 0), (-0.16, -0.12, 0), (0.78, 0.14, 0), (0.04, 0.03, 0), (-0.43, 0.16, 0), (-0.70, 0.12, 0)]
    mesh = bpy.data.meshes.new("fallback swoosh mesh")
    mesh.from_pydata(points, [], [(0, 1, 2, 3, 4, 5, 6)])
    mesh.update()
    obj = bpy.data.objects.new("fallback white nike swoosh on roof", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0, -0.02, 1.18)
    obj.scale = (0.72, 0.48, 0.72)
    obj.rotation_euler = (0, 0, math.radians(-8))
    assign(obj, M["white"])
    solid = obj.modifiers.new("raised roof logo thickness", "SOLIDIFY")
    solid.thickness = 0.018
    bevel(obj, 0.004, 1)
    return obj


def building():
    cyl("low wide white cylindrical plaza body", (0, 0, 0.39), 1.08, 0.54, M["porcelain"], 160, 0.018)
    cyl("thin warm yellow lower facade ring", (0, 0, 0.39), 1.1, 0.07, M["yellow_shadow"], 160, 0.008)
    cyl("continuous black storefront ribbon", (0, 0, 0.51), 1.11, 0.31, M["black"], 160, 0.006)

    for i in range(24):
        angle = i / 24 * math.tau
        x = math.cos(angle) * 1.126
        y = math.sin(angle) * 1.126
        if i % 3 != 0:
            continue
        panel = cube("solid yellow facade column", (x, y, 0.49), (0.12, 0.055, 0.38), M["yellow"], angle, 0.008)
        panel.rotation_euler[2] = angle
    for level_z in (0.43, 0.57):
        cyl("thin yellow horizontal facade grid line", (0, 0, level_z), 1.118, 0.008, M["yellow"], 160, 0)

    for angle in [math.radians(270), math.radians(250), math.radians(290)]:
        x = math.cos(angle) * 1.08
        y = math.sin(angle) * 1.08
        cube("chunky yellow entrance fins", (x, y, 0.32), (0.12, 0.12, 0.38), M["yellow"], angle, 0.008)

    cyl("wide clean white roof collar", (0, 0, 0.73), 1.16, 0.16, M["porcelain"], 160, 0.014)
    cyl("thin amber roof accent under disk", (0, 0, 0.83), 0.98, 0.065, M["yellow_shadow"], 160, 0.01)
    cyl("flat black circular roof disk", (0, 0, 0.91), 0.9, 0.1, M["black"], 160, 0.012)
    torus("thin bright yellow outline around black roof disk", (0, 0, 0.98), 0.9, 0.018, M["yellow"])
    sphere("barely convex satin black top surface", (0, 0, 1.0), 0.78, M["black"], (1, 1, 0.045))
    swoosh()


def tree(x, y, flip=False, scale=1.0):
    cyl("small yellow tree foot", (x, y, 0.095 * scale), 0.046 * scale, 0.026 * scale, M["yellow"], 18, 0.004)
    cyl("thin black tree foot outline", (x, y, 0.108 * scale), 0.052 * scale, 0.012 * scale, M["black"], 18, 0.002)
    cyl("slim amber tree trunk fill", (x, y, 0.285 * scale), 0.022 * scale, 0.36 * scale, M["yellow_shadow"], 12, 0.002)

    crown_z = 0.58 * scale
    sphere("vertical black tree crown outline", (x, y, crown_z), 0.18 * scale, M["black"], (0.86, 0.86, 1.22))
    sphere("main vertical yellow tree crown", (x, y, crown_z + 0.006 * scale), 0.155 * scale, M["yellow"], (0.82, 0.82, 1.18))
    sphere("left yellow tree lobe", (x - 0.07 * scale, y - 0.015 * scale, crown_z - 0.02 * scale), 0.105 * scale, M["yellow"], (0.85, 0.85, 0.95))
    sphere("right yellow tree lobe", (x + 0.07 * scale, y - 0.015 * scale, crown_z - 0.02 * scale), 0.105 * scale, M["yellow"], (0.85, 0.85, 0.95))
    sphere("top yellow tree lobe", (x, y + 0.035 * scale, crown_z + 0.12 * scale), 0.105 * scale, M["yellow"], (0.78, 0.78, 0.92))

    cube("white vertical tree center cut", (x, y + 0.055 * scale, crown_z + 0.02 * scale), (0.028 * scale, 0.012 * scale, 0.24 * scale), M["white"], 0, 0.004)
    cube("white diagonal tree cut left", (x - 0.04 * scale, y + 0.04 * scale, crown_z), (0.022 * scale, 0.012 * scale, 0.16 * scale), M["white"], math.radians(-32), 0.004)
    cube("white diagonal tree cut right", (x + 0.04 * scale, y + 0.04 * scale, crown_z), (0.022 * scale, 0.012 * scale, 0.16 * scale), M["white"], math.radians(32), 0.004)


def round_tree(x, y, scale=1.0):
    cyl("small round-tree yellow foot", (x, y, 0.095 * scale), 0.042 * scale, 0.025 * scale, M["yellow"], 18, 0.004)
    cyl("thin trunk for round yellow tree", (x, y, 0.27 * scale), 0.02 * scale, 0.3 * scale, M["yellow_shadow"], 12)
    sphere("round stylized yellow tree crown", (x, y, 0.54 * scale), 0.145 * scale, M["yellow"], (1, 1, 0.86))
    for angle in (0, math.tau / 3, math.tau * 2 / 3):
        sphere("small lobed round tree crown detail", (x + math.cos(angle) * 0.075 * scale, y + math.sin(angle) * 0.075 * scale, 0.56 * scale), 0.08 * scale, M["yellow"], (1, 1, 0.8))
    torus("thin black outline around round tree", (x, y, 0.52 * scale), 0.135 * scale, 0.005 * scale, M["black"])


def lamp(x, y, scale=1.0):
    cyl("thin grey plaza lamp pole", (x, y, 0.4 * scale), 0.014 * scale, 0.5 * scale, M["pole"], 12)
    cyl("tiny yellow lamp band", (x, y, 0.66 * scale), 0.045 * scale, 0.045 * scale, M["yellow"], 24)
    sphere("small white lamp bulb", (x, y, 0.71 * scale), 0.045 * scale, M["white"], (1, 1, 0.8))


def umbrella_panel(name, x, y, z, radius, lift, start, end, material):
    steps = 5
    verts = [(x, y, z + lift)]
    for i in range(steps + 1):
        angle = start + (end - start) * (i / steps)
        edge_lift = math.sin(i / steps * math.pi) * lift * 0.16
        verts.append((x + math.cos(angle) * radius, y + math.sin(angle) * radius, z + edge_lift))
    faces = []
    for i in range(1, len(verts) - 1):
        faces.append((0, i, i + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    solid = obj.modifiers.new("thin umbrella panel thickness", "SOLIDIFY")
    solid.thickness = 0.014
    bevel(obj, 0.004, 1)
    clean_smooth(obj)
    return obj


def umbrella(x, y, rot=0, scale=1.0):
    radius = 0.2 * scale
    canopy_z = 0.49 * scale
    lift = 0.12 * scale
    cyl("slender black umbrella pole", (x, y, 0.295 * scale), 0.01 * scale, 0.43 * scale, M["black"], 12)
    cyl("round white toy umbrella pedestal base", (x, y, 0.075 * scale), 0.06 * scale, 0.028 * scale, M["white"], 28, 0.005)
    cyl("small yellow umbrella pedestal button", (x, y, 0.105 * scale), 0.038 * scale, 0.022 * scale, M["yellow"], 24, 0.004)
    cyl("tiny black umbrella foot stem", (x, y, 0.14 * scale), 0.018 * scale, 0.03 * scale, M["black"], 16, 0.003)

    for i in range(8):
        start = rot + i * math.tau / 8
        end = rot + (i + 1) * math.tau / 8
        material = M["yellow"] if i % 2 == 0 else M["white"]
        umbrella_panel("alternating yellow white umbrella canopy panel", x, y, canopy_z, radius, lift, start, end, material)

    torus("thin black circular umbrella outline", (x, y, canopy_z + 0.01 * scale), radius, 0.004 * scale, M["black"])
    cyl("black umbrella center cap", (x, y, canopy_z + lift - 0.006 * scale), 0.023 * scale, 0.016 * scale, M["black"], 24, 0.003)
    cyl("yellow umbrella center button", (x, y, canopy_z + lift + 0.009 * scale), 0.012 * scale, 0.014 * scale, M["yellow"], 18, 0.002)

    for i in range(8):
        angle = rot + i * math.tau / 8
        cube(
            "thin black radial umbrella divider",
            (x + math.cos(angle) * radius * 0.5, y + math.sin(angle) * radius * 0.5, canopy_z + lift * 0.42),
            (radius * 0.9, 0.006 * scale, 0.01 * scale),
            M["black"],
            angle,
            0.002,
        )


def bench(x, y, rot=0):
    cube("tiny yellow bench seat", (x, y, 0.17), (0.34, 0.085, 0.045), M["yellow"], rot, 0.012)
    cube("tiny black bench back", (x, y + 0.06, 0.25), (0.38, 0.035, 0.035), M["black"], rot, 0.008)


def cone_marker(x, y):
    cube("small yellow cone base", (x, y, 0.14), (0.095, 0.095, 0.03), M["yellow"], 0, 0.006)
    cone("small white cone marker", (x, y, 0.25), 0.043, 0.16, M["white"], 18)


def sign(x, y, rot=0):
    cyl("small wayfinding sign pole", (x, y, 0.31), 0.013, 0.4, M["pole"], 12)
    cube("tiny yellow icon sign", (x, y, 0.54), (0.19, 0.035, 0.145), M["yellow"], rot, 0.012)


def fountain():
    cyl("round miniature fountain base", (0, -1.52, 0.16), 0.19, 0.065, M["porcelain"], 64, 0.01)
    cyl("black fountain inner pool", (0, -1.52, 0.22), 0.125, 0.035, M["black"], 64, 0.006)
    cyl("yellow fountain center button", (0, -1.52, 0.27), 0.045, 0.095, M["yellow"], 32, 0.006)
    torus("yellow fountain ripple ring", (0, -1.52, 0.3), 0.115, 0.005, M["yellow"])


def micro_details():
    for args in [
        (-1.75, -0.75, False, 0.68),
        (1.75, -0.72, True, 0.66),
        (-1.75, 0.82, True, 0.64),
        (1.75, 0.78, False, 0.66),
        (-1.2, -1.28, False, 0.56),
        (1.2, 1.24, True, 0.56),
        (-0.72, 1.42, False, 0.5),
        (0.72, -1.38, True, 0.5),
    ]:
        tree(*args)

    for x, y, s in [(-1.74, 1.06, 0.66), (1.76, 1.02, 0.66), (-1.52, -1.08, 0.62), (1.52, -1.06, 0.62)]:
        round_tree(x, y, s)

    for x, y in [(-2.02, -0.04), (2.02, 0.06), (-0.92, 1.2), (0.9, -1.18), (-0.48, -1.48), (0.48, 1.44)]:
        lamp(x, y, 0.72)

    for x, y, r in [(-1.42, 0.64, 0.1), (1.42, 0.6, -0.2), (-1.38, -0.64, 0.35), (1.38, -0.6, -0.28), (0.72, -1.1, 0.2)]:
        umbrella(x, y, r, 0.68)

    for x, y, r in [(-1.24, 1.02, 0.25), (1.24, 0.96, -0.25), (-1.18, -0.96, -0.15), (1.18, -0.94, 0.15)]:
        bench(x, y, r)

    for x, y in [(-2.02, 1.06), (2.02, -1.06), (-2.0, -1.08), (2.0, 1.08), (-0.92, -1.4), (0.9, 1.4)]:
        cone_marker(x, y)

    sign(2.08, 0.92, math.radians(12))
    sign(-2.08, -0.9, math.radians(-10))
    fountain()

    cube("tiny yellow cart on tile edge", (0.44, 1.7, 0.16), (0.27, 0.14, 0.065), M["yellow"], math.radians(-14), 0.016)
    sphere("tiny cart white roof", (0.44, 1.7, 0.23), 0.08, M["white"], (1.2, 0.8, 0.45))


def setup_scene():
    bpy.ops.object.light_add(type="AREA", location=(-3.8, -4.5, 6.5))
    light = bpy.context.object
    light.name = "large soft isometric studio light"
    light.data.energy = 520
    light.data.size = 5.2
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
rounded_square_base()
building()
micro_details()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_plaza_central_ultra.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ASSETS / "zona_plaza_central_ultra_blender.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
