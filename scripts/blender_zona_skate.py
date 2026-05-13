import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from nikecity_blender_common import (
    ASSETS,
    ZONE_DIR,
    base_platform,
    bench,
    clear_scene,
    cube,
    cyl,
    lamp,
    make_materials,
    nike_sign,
    rounded_box,
    setup_scene,
    swoosh,
    tree,
)


M = {}


def wedge(name, loc, width, depth, height, material, rot=0, bevel_amount=0.01):
    w = width / 2
    d = depth / 2
    verts = [(-w, -d, 0), (w, -d, 0), (w, d, 0), (-w, d, 0), (-w, d, height), (w, d, height)]
    faces = [(0, 1, 2, 3), (3, 2, 5, 4), (0, 3, 4), (1, 5, 2), (0, 4, 5, 1)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (0, 0, rot)
    obj.data.materials.append(material)
    if bevel_amount:
        from nikecity_blender_common import bevel
        bevel(obj, bevel_amount, 2)
    return obj


def rail(x1, y1, x2, y2, z=0.38):
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    angle = math.atan2(dy, dx)
    cube("skate rail bar", ((x1 + x2) / 2, (y1 + y2) / 2, z), (length, 0.025, 0.035), M["pole"], angle, 0.004)
    for x, y in [(x1, y1), (x2, y2)]:
        cyl("skate rail post", (x, y, z - 0.13), 0.012, 0.26, M["pole"], 10)


def bowl():
    rounded_box("large skate bowl white outer", 1.72, 1.28, 0.5, 0.22, M["porcelain"], (0.78, 0.62, 0.38))
    rounded_box("large skate bowl black cavity", 1.36, 0.92, 0.34, 0.18, M["black"], (0.78, 0.62, 0.48))
    rounded_box("large bowl yellow lower transition", 1.12, 0.72, 0.12, 0.14, M["yellow"], (0.58, 0.36, 0.28))
    wedge("large white quarter transition", (0.72, 0.18, 0.3), 0.42, 0.6, 0.42, M["porcelain"], math.radians(0), 0.018)
    wedge("large yellow quarter transition face", (0.4, 0.18, 0.27), 0.34, 0.54, 0.32, M["yellow"], math.radians(0), 0.014)
    cube("bowl thin yellow coping front", (0.78, -0.02, 0.62), (1.2, 0.045, 0.045), M["yellow"], 0, 0.008)
    cube("bowl thin yellow coping rear", (0.78, 1.19, 0.63), (1.2, 0.045, 0.045), M["yellow"], 0, 0.008)


def left_funbox():
    rounded_box("left skate platform white", 1.22, 0.78, 0.16, 0.14, M["porcelain"], (-0.92, 0.25, 0.18))
    rounded_box("left skate black ride surface", 1.08, 0.62, 0.05, 0.1, M["black"], (-0.92, 0.25, 0.3))
    wedge("left yellow bank ramp", (-1.32, -0.08, 0.21), 0.38, 0.58, 0.24, M["yellow"], math.radians(90), 0.014)
    wedge("left white bank ramp", (-0.54, 0.58, 0.21), 0.38, 0.58, 0.24, M["porcelain"], math.radians(-90), 0.014)
    cube("left black back wall", (-1.0, 0.7, 0.47), (0.92, 0.08, 0.35), M["black"], 0, 0.014)
    swoosh((-1.0, 0.745, 0.48), 0.34, math.radians(16), M["yellow"], "skate wall swoosh")


def center_ramp():
    rounded_box("center mini ramp base", 0.78, 0.58, 0.08, 0.08, M["porcelain"], (-0.1, -0.7, 0.17))
    wedge("center yellow kicker ramp", (-0.1, -0.72, 0.2), 0.54, 0.42, 0.35, M["yellow"], 0, 0.018)
    cube("center black deck lip", (-0.1, -0.48, 0.43), (0.42, 0.035, 0.035), M["black"], 0, 0.004)
    cube("tiny skate bolt", (-0.18, -0.7, 0.39), (0.03, 0.03, 0.012), M["black"], 0, 0.002)
    cube("tiny skate bolt", (-0.02, -0.7, 0.39), (0.03, 0.03, 0.012), M["black"], 0, 0.002)


def fences_and_props():
    for i in range(5):
        rail(-1.95 + i * 0.34, 1.18, -1.78 + i * 0.34, 1.18, 0.34)
        rail(-1.95 + i * 0.34, -0.18, -1.78 + i * 0.34, -0.18, 0.34)
    rail(-1.82, 0.9, -1.82, 0.0, 0.35)
    nike_sign(1.75, 0.82, M, math.radians(4))
    tree(-1.88, 1.2, M, 0.72, False)
    tree(1.86, -1.18, M, 0.68, True)
    tree(0.2, -1.38, M, 0.6, False)
    for x, y in [(-1.65, 0.45), (-0.6, 1.35), (1.65, 0.1), (-1.0, -1.25), (0.92, -1.3)]:
        lamp(x, y, M, 0.72)
    bench(1.5, -0.75, M, math.radians(-8))
    bench(-1.3, 1.38, M, math.radians(3))
    cyl("small skate ball", (0.9, -0.55, 0.17), 0.09, 0.06, M["yellow"], 24, 0.004)
    cube("black skate ball stripe", (0.9, -0.55, 0.22), (0.17, 0.018, 0.018), M["black"], math.radians(25), 0.002)


def build():
    base_platform("skate", 4.55, 3.28, 0.46, M)
    rounded_box("subtle skate park floor guide", 3.8, 2.6, 0.025, 0.34, M["porcelain"], (0.02, 0.02, 0.125))
    bowl()
    left_funbox()
    center_ramp()
    fences_and_props()


clear_scene()
M = make_materials()
build()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_skate.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_skate.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
