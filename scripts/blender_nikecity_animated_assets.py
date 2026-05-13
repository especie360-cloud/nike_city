import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from nikecity_blender_common import (
    ASSETS,
    assign,
    bevel,
    clear_scene,
    cube,
    cyl,
    make_materials,
    setup_scene,
    smooth,
    sphere,
)


PROPS_DIR = ASSETS / "models" / "props"
PROPS_DIR.mkdir(parents=True, exist_ok=True)
FRAME_END = 72
M = {}


def set_timeline():
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.render.fps = 24


def add_empty(name, loc=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.12
    obj.location = loc
    return obj


def parent_to(obj, parent):
    obj.parent = parent
    return obj


def animate_bob(root, height=0.035):
    for frame, z in [(1, 0), (18, height), (36, 0), (54, -height * 0.45), (72, 0)]:
        bpy.context.scene.frame_set(frame)
        root.location.z = z
        root.keyframe_insert(data_path="location", frame=frame)
    if root.animation_data and root.animation_data.action and hasattr(root.animation_data.action, "fcurves"):
        for fc in root.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def animate_spin(obj, axis="Y", turns=2.0):
    index = {"X": 0, "Y": 1, "Z": 2}[axis]
    base = list(obj.rotation_euler)
    for frame, add in [(1, 0), (FRAME_END, math.tau * turns)]:
        bpy.context.scene.frame_set(frame)
        rot = base[:]
        rot[index] += add
        obj.rotation_euler = rot
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if obj.animation_data and obj.animation_data.action and hasattr(obj.animation_data.action, "fcurves"):
        for fc in obj.animation_data.action.fcurves:
            fc.modifiers.new(type="CYCLES")
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def animate_swing(obj, axis="X", degrees=18):
    index = {"X": 0, "Y": 1, "Z": 2}[axis]
    base = list(obj.rotation_euler)
    poses = [
        (1, -degrees),
        (18, degrees),
        (36, -degrees),
        (54, degrees),
        (72, -degrees),
    ]
    for frame, deg in poses:
        bpy.context.scene.frame_set(frame)
        rot = base[:]
        rot[index] += math.radians(deg)
        obj.rotation_euler = rot
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if obj.animation_data and obj.animation_data.action and hasattr(obj.animation_data.action, "fcurves"):
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "SINE"


def animate_step(obj, axis="Y", amount=0.055, invert=False):
    idx = {"X": 0, "Y": 1, "Z": 2}[axis]
    base = list(obj.location)
    direction = -1 if invert else 1
    poses = [
        (1, -amount * direction),
        (18, amount * direction),
        (36, -amount * direction),
        (54, amount * direction),
        (72, -amount * direction),
    ]
    for frame, offset in poses:
        bpy.context.scene.frame_set(frame)
        loc = base[:]
        loc[idx] += offset
        obj.location = loc
        obj.keyframe_insert(data_path="location", frame=frame)
    if obj.animation_data and obj.animation_data.action and hasattr(obj.animation_data.action, "fcurves"):
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def export_asset(filename):
    setup_scene()
    set_timeline()
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / f"{Path(filename).stem}.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(PROPS_DIR / filename),
        export_format="GLB",
        export_yup=True,
        export_animations=True,
        export_frame_range=True,
        use_selection=False,
    )


def make_car(filename, body_material, accent_material, trim_material=None):
    clear_scene()
    global M
    M = make_materials()
    trim_material = trim_material or M["black"]
    root = add_empty("animated car suspension root")
    body = add_empty("car body root")
    parent_to(body, root)

    parts = [
        cube("car lower body", (0, 0, 0.28), (1.38, 0.64, 0.28), body_material, 0, 0.045),
        cube("car hood", (-0.44, 0, 0.43), (0.55, 0.62, 0.12), body_material, 0, 0.025),
        cube("car trunk", (0.48, 0, 0.42), (0.4, 0.62, 0.12), body_material, 0, 0.025),
        cube("car cabin block", (0.1, 0, 0.62), (0.58, 0.54, 0.32), body_material, 0, 0.04),
        cube("front bumper white", (-0.75, 0, 0.22), (0.08, 0.54, 0.07), M["white"], 0, 0.012),
        cube("rear bumper black", (0.75, 0, 0.23), (0.07, 0.52, 0.06), trim_material, 0, 0.012),
        cube("front windshield", (-0.18, -0.285, 0.67), (0.34, 0.025, 0.22), M["line"], 0, 0.006),
        cube("side window left", (0.18, -0.33, 0.59), (0.48, 0.025, 0.16), M["line"], 0, 0.006),
        cube("side window right", (0.18, 0.33, 0.59), (0.48, 0.025, 0.16), M["line"], 0, 0.006),
        cube("hood inset line", (-0.48, -0.01, 0.51), (0.39, 0.48, 0.012), trim_material, 0, 0.004),
        cube("door cut left", (0.18, -0.355, 0.42), (0.34, 0.016, 0.2), trim_material, 0, 0.003),
        cube("door cut right", (0.18, 0.355, 0.42), (0.34, 0.016, 0.2), trim_material, 0, 0.003),
    ]
    for part in parts:
        parent_to(part, body)

    for x in (-0.48, 0.48):
        for y in (-0.37, 0.37):
            wheel_root = add_empty("animated spinning wheel", (x, y, 0.17))
            parent_to(wheel_root, root)
            tire = cyl("black car tire", (0, 0, 0), 0.145, 0.07, M["black"], 32, 0.004, (math.pi / 2, 0, 0))
            hub = cyl("white wheel hub", (0, -0.001 if y < 0 else 0.001, 0), 0.078, 0.074, M["white"], 24, 0.003, (math.pi / 2, 0, 0))
            marker = cube("yellow wheel rotation mark", (0.055, -0.043 if y < 0 else 0.043, 0.03), (0.065, 0.012, 0.018), accent_material, 0, 0.002)
            for obj in (tire, hub, marker):
                parent_to(obj, wheel_root)
            animate_spin(wheel_root, "Y", 3.0)

    mirror_left = cube("left side mirror", (-0.34, -0.42, 0.52), (0.12, 0.055, 0.045), trim_material, 0, 0.01)
    mirror_right = cube("right side mirror", (-0.34, 0.42, 0.52), (0.12, 0.055, 0.045), trim_material, 0, 0.01)
    for obj in (mirror_left, mirror_right):
        parent_to(obj, body)
    animate_bob(body, 0.032)
    export_asset(filename)


def triangular_prism(name, verts, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    smooth(obj)
    bevel(obj, 0.01, 2)
    return obj


def make_plane():
    clear_scene()
    global M
    M = make_materials()
    root = add_empty("animated plane root")
    parts = [
        cube("plane fuselage orange", (0, 0, 0.42), (1.5, 0.28, 0.25), M["yellow"], 0, 0.035),
        triangular_prism("plane nose", [(-0.9, -0.14, 0.295), (-0.9, 0.14, 0.295), (-1.22, 0, 0.42), (-0.9, -0.14, 0.545), (-0.9, 0.14, 0.545), (-1.22, 0, 0.42)], M["black"]),
        cube("plane main wing left", (-0.05, -0.58, 0.48), (1.45, 0.18, 0.055), M["white"], 0, 0.012),
        cube("plane main wing right", (-0.05, 0.58, 0.48), (1.45, 0.18, 0.055), M["white"], 0, 0.012),
        cube("plane wing orange stripe left", (-0.05, -0.7, 0.515), (1.35, 0.035, 0.025), M["yellow"], 0, 0.004),
        cube("plane wing orange stripe right", (-0.05, 0.7, 0.515), (1.35, 0.035, 0.025), M["yellow"], 0, 0.004),
        cube("plane tail wing", (0.67, 0, 0.55), (0.42, 0.82, 0.055), M["black"], 0, 0.012),
        cube("plane vertical tail", (0.73, 0, 0.82), (0.25, 0.06, 0.5), M["yellow"], 0, 0.012),
        cube("plane cockpit glass", (-0.54, 0, 0.61), (0.32, 0.3, 0.08), M["line"], 0, 0.01),
        cyl("plane prop spinner", (-1.26, 0, 0.42), 0.05, 0.06, M["black"], 20, 0.004, (0, math.pi / 2, 0)),
    ]
    for obj in parts:
        parent_to(obj, root)

    prop_root = add_empty("animated plane propeller", (-1.31, 0, 0.42))
    parent_to(prop_root, root)
    for rot in (0, math.pi / 2):
        blade = cube("plane spinning prop blade", (0, 0, 0), (0.025, 0.52, 0.035), M["yellow"], rot, 0.005)
        parent_to(blade, prop_root)
    animate_spin(prop_root, "X", 8.0)
    animate_bob(root, 0.025)
    export_asset("plane_orange.glb")


def make_helicopter():
    clear_scene()
    global M
    M = make_materials()
    root = add_empty("animated helicopter root")
    parts = [
        cube("helicopter cabin orange", (-0.25, 0, 0.42), (0.72, 0.42, 0.36), M["yellow"], 0, 0.05),
        cube("helicopter cabin black nose", (-0.68, 0, 0.43), (0.25, 0.38, 0.26), M["black"], 0, 0.035),
        cube("helicopter windshield", (-0.5, -0.225, 0.54), (0.32, 0.022, 0.18), M["line"], 0, 0.006),
        cube("helicopter side window", (-0.1, -0.225, 0.5), (0.26, 0.022, 0.16), M["line"], 0, 0.006),
        cube("helicopter tail boom", (0.55, 0, 0.47), (0.95, 0.13, 0.13), M["black"], 0, 0.018),
        cube("helicopter vertical tail", (1.08, 0, 0.68), (0.18, 0.05, 0.38), M["yellow"], 0, 0.01),
        cube("helicopter tail fin", (1.06, 0, 0.4), (0.28, 0.42, 0.045), M["yellow"], 0, 0.01),
        cube("helicopter skid left", (-0.12, -0.34, 0.16), (0.85, 0.045, 0.045), M["white"], 0, 0.008),
        cube("helicopter skid right", (-0.12, 0.34, 0.16), (0.85, 0.045, 0.045), M["white"], 0, 0.008),
        cube("helicopter skid strut left", (-0.28, -0.22, 0.25), (0.035, 0.22, 0.16), M["pole"], 0, 0.004),
        cube("helicopter skid strut right", (0.12, 0.22, 0.25), (0.035, 0.22, 0.16), M["pole"], 0, 0.004),
        cyl("helicopter rotor mast", (-0.16, 0, 0.7), 0.035, 0.25, M["black"], 16, 0.003),
    ]
    for obj in parts:
        parent_to(obj, root)

    rotor_root = add_empty("animated helicopter main rotor", (-0.16, 0, 0.86))
    parent_to(rotor_root, root)
    for rot in (0, math.pi / 2):
        blade = cube("helicopter long rotor blade", (0, 0, 0), (0.08, 1.55, 0.035), M["yellow"], rot, 0.006)
        parent_to(blade, rotor_root)
    tail_rotor = add_empty("animated helicopter tail rotor", (1.22, 0, 0.56))
    parent_to(tail_rotor, root)
    for rot in (0, math.pi / 2):
        blade = cube("helicopter tail rotor blade", (0, 0, 0), (0.04, 0.34, 0.025), M["yellow"], rot, 0.004)
        parent_to(blade, tail_rotor)
    animate_spin(rotor_root, "Z", 10.0)
    animate_spin(tail_rotor, "X", 10.0)
    animate_bob(root, 0.035)
    export_asset("helicopter_orange.glb")


def make_person():
    clear_scene()
    global M
    M = make_materials()
    root = add_empty("animated block person root")
    parts = [
        cube("person shoes left", (-0.08, -0.05, 0.04), (0.11, 0.16, 0.08), M["black"], 0, 0.01),
        cube("person shoes right", (0.08, -0.05, 0.04), (0.11, 0.16, 0.08), M["black"], 0, 0.01),
        cube("person left leg", (-0.075, 0, 0.26), (0.105, 0.12, 0.4), M["field"], 0, 0.006),
        cube("person right leg", (0.075, 0, 0.26), (0.105, 0.12, 0.4), M["field"], 0, 0.006),
        cube("person torso white hoodie", (0, 0, 0.68), (0.36, 0.22, 0.46), M["porcelain"], 0, 0.02),
        cube("person left arm", (-0.27, 0, 0.63), (0.1, 0.15, 0.42), M["porcelain"], 0, 0.01),
        cube("person right arm", (0.27, 0, 0.63), (0.1, 0.15, 0.42), M["porcelain"], 0, 0.01),
        cube("person left hand", (-0.27, 0, 0.36), (0.11, 0.14, 0.1), M["yellow"], 0, 0.012),
        cube("person right hand", (0.27, 0, 0.36), (0.11, 0.14, 0.1), M["yellow"], 0, 0.012),
        cube("person head", (0, 0, 1.0), (0.34, 0.3, 0.32), M["yellow"], 0, 0.025),
        cube("person hair block", (0, -0.03, 1.2), (0.38, 0.32, 0.13), M["black"], 0, 0.012),
        cube("person hair fringe 1", (-0.12, -0.18, 1.14), (0.09, 0.08, 0.15), M["black"], 0, 0.006),
        cube("person hair fringe 2", (0.02, -0.18, 1.15), (0.09, 0.08, 0.17), M["black"], 0, 0.006),
        cube("person eye left", (-0.07, -0.155, 1.02), (0.035, 0.014, 0.035), M["black"], 0, 0.001),
        cube("person eye right", (0.07, -0.155, 1.02), (0.035, 0.014, 0.035), M["black"], 0, 0.001),
        cube("person smile", (0, -0.16, 0.94), (0.12, 0.012, 0.018), M["black"], 0, 0.002),
    ]
    for obj in parts:
        parent_to(obj, root)
    animate_bob(root, 0.018)
    export_asset("person_block.glb")


def make_person_walking():
    clear_scene()
    global M
    M = make_materials()
    root = add_empty("walking block person root")
    body = add_empty("walking person body bounce root", (0, 0, 0))
    parent_to(body, root)

    torso = cube("walking torso white hoodie", (0, 0, 0.68), (0.36, 0.22, 0.46), M["porcelain"], 0, 0.02)
    head = cube("walking person head", (0, 0, 1.0), (0.34, 0.3, 0.32), M["yellow"], 0, 0.025)
    hair = cube("walking hair block", (0, -0.03, 1.2), (0.38, 0.32, 0.13), M["black"], 0, 0.012)
    fringe_a = cube("walking hair fringe 1", (-0.12, -0.18, 1.14), (0.09, 0.08, 0.15), M["black"], 0, 0.006)
    fringe_b = cube("walking hair fringe 2", (0.02, -0.18, 1.15), (0.09, 0.08, 0.17), M["black"], 0, 0.006)
    eye_l = cube("walking eye left", (-0.07, -0.155, 1.02), (0.035, 0.014, 0.035), M["black"], 0, 0.001)
    eye_r = cube("walking eye right", (0.07, -0.155, 1.02), (0.035, 0.014, 0.035), M["black"], 0, 0.001)
    smile = cube("walking smile", (0, -0.16, 0.94), (0.12, 0.012, 0.018), M["black"], 0, 0.002)
    for obj in (torso, head, hair, fringe_a, fringe_b, eye_l, eye_r, smile):
        parent_to(obj, body)

    left_leg = add_empty("walking left leg step group", (-0.075, 0, 0))
    right_leg = add_empty("walking right leg step group", (0.075, 0, 0))
    left_arm = add_empty("walking left arm step group", (-0.27, 0, 0))
    right_arm = add_empty("walking right arm step group", (0.27, 0, 0))
    for group in (left_leg, right_leg, left_arm, right_arm):
        parent_to(group, body)

    limb_parts = [
        (left_leg, cube("walking left leg", (0, 0, 0.26), (0.105, 0.12, 0.4), M["field"], 0, 0.006)),
        (left_leg, cube("walking left shoe", (0, -0.045, 0.04), (0.12, 0.16, 0.08), M["black"], 0, 0.01)),
        (right_leg, cube("walking right leg", (0, 0, 0.26), (0.105, 0.12, 0.4), M["field"], 0, 0.006)),
        (right_leg, cube("walking right shoe", (0, -0.045, 0.04), (0.12, 0.16, 0.08), M["black"], 0, 0.01)),
        (left_arm, cube("walking left arm", (0, 0, 0.63), (0.1, 0.14, 0.4), M["porcelain"], 0, 0.01)),
        (left_arm, cube("walking left hand", (0, 0, 0.36), (0.11, 0.14, 0.1), M["yellow"], 0, 0.012)),
        (right_arm, cube("walking right arm", (0, 0, 0.63), (0.1, 0.14, 0.4), M["porcelain"], 0, 0.01)),
        (right_arm, cube("walking right hand", (0, 0, 0.36), (0.11, 0.14, 0.1), M["yellow"], 0, 0.012)),
    ]
    for group, obj in limb_parts:
        parent_to(obj, group)

    animate_step(left_leg, "Y", 0.055, False)
    animate_step(right_leg, "Y", 0.055, True)
    animate_step(left_arm, "Y", 0.045, True)
    animate_step(right_arm, "Y", 0.045, False)

    animate_bob(body, 0.02)
    for frame, y in [(1, -0.01), (18, 0.01), (36, -0.01), (54, 0.01), (72, -0.01)]:
        bpy.context.scene.frame_set(frame)
        body.location.y = y
        body.keyframe_insert(data_path="location", frame=frame)
    export_asset("person_walking.glb")


def build_all():
    global M
    M = make_materials()
    make_car("car_orange.glb", M["yellow"], M["black"], M["black"])
    M = make_materials()
    make_car("car_yellow.glb", M["yellow"], M["white"], M["black"])
    M = make_materials()
    make_car("car_white_black.glb", M["porcelain"], M["yellow"], M["black"])
    make_plane()
    make_helicopter()
    make_person()
    make_person_walking()


build_all()
