import sys

import bpy


path = sys.argv[-1]
bpy.ops.wm.open_mainfile(filepath=path)

print("FILE", path)
print("OBJECTS")
for obj in bpy.context.scene.objects:
    mats = [slot.material.name if slot.material else "" for slot in obj.material_slots]
    print(obj.name, obj.type, tuple(round(v, 4) for v in obj.dimensions), mats)
print("MATERIALS")
for mat in bpy.data.materials:
    print(mat.name)
