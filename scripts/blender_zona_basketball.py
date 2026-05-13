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


def umbrella(x, y, scale=1.0):
    cyl("basket umbrella pole", (x, y, 0.28 * scale), 0.012 * scale, 0.38 * scale, M["pole"], 12)
    cyl("basket umbrella base", (x, y, 0.095 * scale), 0.06 * scale, 0.025 * scale, M["yellow"], 24, 0.004)
    cyl("basket umbrella canopy", (x, y, 0.52 * scale), 0.18 * scale, 0.035 * scale, M["yellow"], 36, 0.006)
    for a in range(4):
        cube("basket white canopy segment", (x, y, 0.545 * scale), (0.17 * scale, 0.03 * scale, 0.012 * scale), M["white"], a * math.pi / 2, 0.002)


def arena_shell():
    # Open stadium shell: four separate walls so the court is truly visible and sunken.
    cube("basket front continuous yellow wall", (0, -1.04, 0.42), (2.42, 0.22, 0.58), M["yellow"], 0, 0.04)
    cube("basket rear continuous yellow wall", (0, 1.04, 0.42), (2.42, 0.22, 0.58), M["yellow"], 0, 0.04)
    cube("basket left continuous yellow wall", (-1.28, 0, 0.42), (0.22, 1.54, 0.58), M["yellow"], 0, 0.04)
    cube("basket right continuous yellow wall", (1.28, 0, 0.42), (0.22, 1.54, 0.58), M["yellow"], 0, 0.04)
    for x in (-1.18, 1.18):
        for y in (-0.94, 0.94):
            cyl("basket rounded yellow exterior corner", (x, y, 0.42), 0.18, 0.58, M["yellow"], 40, 0.012)

    cube("basket front lower black plinth", (0, -1.18, 0.17), (2.12, 0.035, 0.06), M["black"], 0, 0.004)
    cube("basket rear lower black plinth", (0, 1.18, 0.17), (2.04, 0.035, 0.06), M["black"], 0, 0.004)
    cube("basket left lower black plinth", (-1.41, 0, 0.17), (0.035, 1.18, 0.06), M["black"], 0, 0.004)
    cube("basket right lower black plinth", (1.41, 0, 0.17), (0.035, 1.18, 0.06), M["black"], 0, 0.004)
    cube("basket front black glass band", (-0.28, -1.04, 0.46), (1.22, 0.035, 0.26), M["black"], 0, 0.006)
    cube("basket front main door black", (0.72, -1.065, 0.36), (0.28, 0.018, 0.3), M["black"], 0, 0.004)
    cube("basket front yellow door frame", (0.72, -1.078, 0.45), (0.38, 0.012, 0.32), M["yellow"], 0, 0.002)
    cube("basket left facade window", (-1.22, -0.18, 0.46), (0.035, 0.6, 0.25), M["black"], 0, 0.006)
    cube("basket right facade window", (1.22, -0.18, 0.46), (0.035, 0.6, 0.25), M["black"], 0, 0.006)
    swoosh((-0.42, -1.065, 0.48), 0.36, math.radians(16), M["yellow"], "basket front swoosh")

    cube("basket front white roof bar", (0, -0.92, 0.78), (2.58, 0.18, 0.13), M["porcelain"], 0, 0.035)
    cube("basket rear white roof bar", (0, 0.92, 0.78), (2.58, 0.18, 0.13), M["porcelain"], 0, 0.035)
    cube("basket left white roof bar", (-1.25, 0, 0.78), (0.18, 1.62, 0.13), M["porcelain"], 0, 0.035)
    cube("basket right white roof bar", (1.25, 0, 0.78), (0.18, 1.62, 0.13), M["porcelain"], 0, 0.035)
    for x in (-1.14, 1.14):
        for y in (-0.82, 0.82):
            cyl("basket rounded white roof corner", (x, y, 0.78), 0.16, 0.13, M["porcelain"], 40, 0.008)
    cube("basket front black roof seam", (0, -0.78, 0.71), (2.05, 0.035, 0.035), M["black"], 0, 0.004)
    cube("basket rear black roof seam", (0, 0.78, 0.71), (2.05, 0.035, 0.035), M["black"], 0, 0.004)

    # Sunken bowl walls and stepped seating, matching the Soccer depth language.
    cube("basket front vertical pit wall", (0, -0.58, 0.36), (1.9, 0.07, 0.5), M["black"], 0, 0.01)
    cube("basket rear vertical pit wall", (0, 0.58, 0.36), (1.9, 0.07, 0.5), M["black"], 0, 0.01)
    cube("basket left vertical pit wall", (-0.95, 0, 0.36), (0.07, 1.08, 0.5), M["black"], 0, 0.01)
    cube("basket right vertical pit wall", (0.95, 0, 0.36), (0.07, 1.08, 0.5), M["black"], 0, 0.01)
    for y, z, w in [(0.56, 0.25, 1.62), (0.66, 0.4, 1.8), (0.76, 0.55, 1.96), (-0.56, 0.25, 1.62), (-0.66, 0.4, 1.8), (-0.76, 0.55, 1.96)]:
        cube("basket yellow grandstand tier", (0, y, z), (w, 0.065, 0.06), M["yellow"], 0, 0.006)
        cube("basket black grandstand shadow", (0, y * 0.985, z - 0.045), (w, 0.04, 0.04), M["black"], 0, 0.004)
    for x, z, d in [(-0.8, 0.25, 0.86), (-0.9, 0.4, 1.02), (-1.0, 0.55, 1.18), (0.8, 0.25, 0.86), (0.9, 0.4, 1.02), (1.0, 0.55, 1.18)]:
        cube("basket side grandstand tier", (x, 0, z), (0.065, d, 0.06), M["yellow"], 0, 0.006)
        cube("basket side grandstand shadow", (x * 0.985, 0, z - 0.045), (0.04, d, 0.04), M["black"], 0, 0.004)


def court():
    rounded_box("deep sunken black basketball court", 1.68, 0.94, 0.05, 0.05, M["field"], (0, 0, 0.075))
    cube("basket outer top baseline", (0, 0.42, 0.112), (1.44, 0.016, 0.011), M["line"], 0, 0.001)
    cube("basket outer bottom baseline", (0, -0.42, 0.112), (1.44, 0.016, 0.011), M["line"], 0, 0.001)
    cube("basket outer left sideline", (-0.72, 0, 0.113), (0.016, 0.84, 0.011), M["line"], 0, 0.001)
    cube("basket outer right sideline", (0.72, 0, 0.113), (0.016, 0.84, 0.011), M["line"], 0, 0.001)
    cube("basket court center line", (0, 0, 0.116), (0.022, 0.84, 0.011), M["line"], 0, 0.001)
    cube("basket court horizontal line", (0, 0, 0.118), (1.44, 0.018, 0.011), M["line"], 0, 0.001)
    cyl("basket center circle outer", (0, 0, 0.124), 0.19, 0.008, M["line"], 48, 0.001)
    cyl("basket center circle cover", (0, 0, 0.13), 0.16, 0.009, M["field"], 48, 0.001)
    cyl("basket center spot", (0, 0, 0.137), 0.022, 0.008, M["yellow"], 24)
    for y, sign in [(-0.38, -1), (0.38, 1)]:
        cube("basket free throw line", (0, y, 0.127), (0.42, 0.014, 0.011), M["line"], 0, 0.001)
        cube("basket paint left side", (-0.21, y + sign * 0.09, 0.127), (0.014, 0.18, 0.011), M["line"], 0, 0.001)
        cube("basket paint right side", (0.21, y + sign * 0.09, 0.127), (0.014, 0.18, 0.011), M["line"], 0, 0.001)
        cube("basket baseline detail", (0, y + sign * 0.14, 0.129), (0.56, 0.014, 0.011), M["line"], 0, 0.001)
        cube("basket three point arc hint", (0, y + sign * 0.03, 0.132), (0.72, 0.014, 0.011), M["line"], math.radians(8 * sign), 0.001)


def hoop(x, y, rot=0):
    cyl("basket hoop pole", (x, y, 0.37), 0.018, 0.56, M["yellow"], 16, 0.004)
    cube("basket backboard", (x, y, 0.68), (0.46, 0.035, 0.32), M["porcelain"], rot, 0.006)
    cube("basket backboard yellow outline", (x, y - 0.022 if y > 0 else y + 0.022, 0.68), (0.36, 0.012, 0.23), M["yellow"], rot, 0.002)
    cube("basket backboard inner square", (x, y - 0.024 if y > 0 else y + 0.024, 0.66), (0.18, 0.012, 0.11), M["line"], rot, 0.001)
    cyl("basket rim", (x, y + (-0.055 if y > 0 else 0.055), 0.58), 0.085, 0.012, M["yellow"], 28, 0.002, (math.pi / 2, 0, 0))
    cube("basket support arm", (x, y + (-0.04 if y > 0 else 0.04), 0.56), (0.035, 0.15, 0.035), M["yellow"], rot, 0.003)
    cube("basket tiny net", (x, y + (-0.06 if y > 0 else 0.06), 0.52), (0.13, 0.012, 0.1), M["line"], rot, 0.001)


def props():
    hoop(0, 0.56, math.pi)
    hoop(0, -0.56, 0)
    for x, y, white in [(-1.78, 1.02, True), (1.78, 0.9, False), (1.58, -0.95, False), (-1.78, -0.86, True)]:
        tree(x, y, M, 0.72, white)
    for x, y in [(-1.72, 0.1), (-0.95, 1.25), (1.08, 1.22), (1.72, -0.05), (-1.05, -1.22), (0.98, -1.2)]:
        lamp(x, y, M, 0.72)
    bench(-1.58, 0.62, M, math.radians(2))
    bench(1.55, -0.58, M, math.radians(-8))
    umbrella(-1.05, -0.78, 0.72)
    umbrella(-0.45, -1.0, 0.68)
    nike_sign(1.72, 0.55, M, math.radians(4))
    rounded_box("front basketball stairs", 0.56, 0.28, 0.04, 0.04, M["porcelain"], (0.7, -1.42, 0.14))
    cube("front basketball black entrance", (0.7, -1.17, 0.36), (0.32, 0.035, 0.32), M["black"], 0, 0.006)
    cube("front basketball yellow entrance frame", (0.7, -1.195, 0.44), (0.44, 0.018, 0.36), M["yellow"], 0, 0.004)
    cube("front basketball yellow awning", (0.7, -1.23, 0.62), (0.5, 0.07, 0.055), M["yellow"], 0, 0.006)
    for i in range(4):
        cube("thin basketball stair line", (0.7, -1.54 + i * 0.045, 0.165), (0.5, 0.01, 0.012), M["line"], 0, 0.001)


def build():
    base_platform("basketball", 4.36, 3.36, 0.46, M)
    rounded_box("basketball subtle plaza guide", 3.78, 2.72, 0.025, 0.36, M["porcelain"], (0, 0, 0.13))
    arena_shell()
    court()
    props()


clear_scene()
M = make_materials()
build()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_basketball.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_basketball.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
