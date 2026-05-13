import math
from pathlib import Path

import bpy
import mathutils


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PROPS_DIR = ASSETS / "models" / "props"
PROPS_DIR.mkdir(parents=True, exist_ok=True)

SOURCE_CANDIDATES = [
    ASSETS / "blenderkit_car_test.blend",
    Path("/Users/oscar/blenderkit_data/models/cartoon-wagon-ca_89442db2-0201-4830-bda7-2f0d275e6abe/cartoon-wagon-car_25803bef-6b38-446b-bace-005e731f0bc8.blend"),
]


def mat(name, color, roughness=0.68):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def assign_single(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def animate_loop_rotation(obj, axis="Y", turns=3):
    idx = {"X": 0, "Y": 1, "Z": 2}[axis]
    base = list(obj.rotation_euler)
    for frame, add in [(1, 0), (72, math.tau * turns)]:
        bpy.context.scene.frame_set(frame)
        rot = base[:]
        rot[idx] += add
        obj.rotation_euler = rot
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if obj.animation_data and obj.animation_data.action and hasattr(obj.animation_data.action, "fcurves"):
        for fc in obj.animation_data.action.fcurves:
            fc.modifiers.new(type="CYCLES")
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def animate_bob(obj):
    for frame, z in [(1, 0), (18, 0.03), (36, 0), (54, -0.014), (72, 0)]:
        bpy.context.scene.frame_set(frame)
        obj.location.z = z
        obj.keyframe_insert(data_path="location", frame=frame)


def cube(name, loc, scale, material, bevel=0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_single(obj, material)
    if bevel:
        mod = obj.modifiers.new("soft toy bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def find_source():
    for source in SOURCE_CANDIDATES:
        if source.exists():
            return source
    raise FileNotFoundError("No encontre el .blend del carro de BlenderKit.")


def scene_bounds(objects):
    min_v = [float("inf")] * 3
    max_v = [float("-inf")] * 3
    for obj in objects:
        for corner in obj.bound_box:
            world = obj.matrix_world @ mathutils.Vector(corner)
            for i in range(3):
                min_v[i] = min(min_v[i], world[i])
                max_v[i] = max(max_v[i], world[i])
    return min_v, max_v


source = find_source()
bpy.ops.wm.open_mainfile(filepath=str(source))

orange = mat("nike city orange", (1.0, 0.42, 0.0, 1), 0.5)
black = mat("nike city black", (0.006, 0.006, 0.006, 1), 0.56)
white = mat("nike city white", (0.985, 0.975, 0.94, 1), 0.78)
headlight = mat("warm white headlight", (1.0, 0.96, 0.82, 1), 0.5)

for obj in list(bpy.context.scene.objects):
    if obj.type in {"CAMERA", "LIGHT"} or obj.name.lower().startswith("cube"):
        bpy.data.objects.remove(obj, do_unlink=True)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
root = bpy.data.objects.new("blenderkit car nike city root", None)
bpy.context.collection.objects.link(root)
root.empty_display_size = 0.15

wheel_objects = []
for obj in meshes:
    name = obj.name.lower()
    if "wheel" in name or "tire" in name or "rim" in name:
        assign_single(obj, black)
        wheel_objects.append(obj)
    elif "glass" in name or "window" in name:
        assign_single(obj, black)
    elif "steer" in name or "mirror" in name:
        assign_single(obj, black)
    else:
        assign_single(obj, orange)
    obj.parent = root
    try:
        for poly in obj.data.polygons:
            poly.use_smooth = True
        obj.data.update()
    except Exception:
        pass

# Add only small overlays. Large panels made the borrowed mesh read as cut open.
accent_parts = [
    cube("black front windshield fill", (-0.32, -0.34, 0.73), (0.46, 0.018, 0.28), black, 0.004, (math.radians(-12), 0, 0)),
    cube("black visible side window front", (0.05, -0.445, 0.67), (0.26, 0.018, 0.22), black, 0.004),
    cube("black visible side window rear", (0.39, -0.445, 0.66), (0.23, 0.018, 0.2), black, 0.004),
    cube("black far side window front", (0.05, 0.445, 0.67), (0.26, 0.018, 0.22), black, 0.004),
    cube("black far side window rear", (0.39, 0.445, 0.66), (0.23, 0.018, 0.2), black, 0.004),
    cube("black door handle visible", (0.18, -0.468, 0.45), (0.11, 0.014, 0.025), black, 0.002),
    cube("black door handle far", (0.18, 0.468, 0.45), (0.11, 0.014, 0.025), black, 0.002),
    cube("black side mirror visible", (-0.44, -0.52, 0.55), (0.12, 0.055, 0.05), black, 0.006),
    cube("black side mirror far", (-0.44, 0.52, 0.55), (0.12, 0.055, 0.05), black, 0.006),
    cube("nike city white front bumper", (-0.78, 0, 0.2), (0.08, 0.5, 0.055), white, 0.008),
    cube("front left headlight", (-0.82, -0.16, 0.3), (0.03, 0.09, 0.055), headlight, 0.006),
    cube("front right headlight", (-0.82, 0.16, 0.3), (0.03, 0.09, 0.055), headlight, 0.006),
    cube("black lower grille", (-0.835, 0, 0.25), (0.024, 0.22, 0.055), black, 0.003),
]
for obj in accent_parts:
    obj.parent = root

root.rotation_euler = (0, 0, math.radians(-25))
root.scale = (0.72, 0.72, 0.72)

for wheel in wheel_objects:
    animate_loop_rotation(wheel, "X", 4)
animate_bob(root)

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 72
bpy.context.scene.render.fps = 24

bpy.ops.object.light_add(type="SUN", location=(-3.8, -4.5, 6.5), rotation=(math.radians(45), 0, math.radians(-35)))
bpy.context.object.data.energy = 1.25
bpy.context.scene.world.color = (0.965, 0.955, 0.93)

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "blenderkit_car_nike_test.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(PROPS_DIR / "blenderkit_car_nike_test.glb"),
    export_format="GLB",
    export_yup=True,
    export_animations=True,
    export_frame_range=True,
    use_selection=False,
)
