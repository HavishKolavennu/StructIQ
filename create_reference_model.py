"""
create_reference_model.py — Blender Python script for StructIQ

Generates the 3D reference model (reference.glb) used by the Three.js viewer.

Usage:
    blender --background --python create_reference_model.py -- --output frontend/public/models/reference.glb

Element IDs exactly match backend/models/work_packages.py:
    Beams : beam_central_1, beam_left_1, beam_right_1
    Pipes : pipe_main_supply, pipe_branch_1, pipe_branch_2, pipe_drain_stack
    Ducts : duct_hvac_main, duct_branch_north, duct_branch_south

Scene layout (all units in metres, 1 Blender unit = 1 m):
    Bay footprint : 10 m wide (X) × 8 m deep (Y)
    Floor-to-ceiling: 3.5 m (Z)
    Origin        : floor centre
    Beams run along the X axis at ceiling level  (Z ≈ 3.2 m)
    Pipes run below the beams                    (Z ≈ 2.5 m)
    Ducts run just below the beams               (Z ≈ 2.8 m)
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy

# ---------------------------------------------------------------------------
# Parse arguments passed after the "--" separator
# ---------------------------------------------------------------------------
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

parser = argparse.ArgumentParser(description="Generate StructIQ reference GLB model.")
parser.add_argument(
    "--output",
    default="frontend/public/models/reference.glb",
    help="Output path for the GLB file.",
)
args = parser.parse_args(argv)

output_path = Path(args.output).resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

print(f"\n[StructIQ] Generating model → {output_path}\n")

# ---------------------------------------------------------------------------
# Clear the default scene
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

for mesh in list(bpy.data.meshes):
    bpy.data.meshes.remove(mesh)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)

# ---------------------------------------------------------------------------
# Material helper
# ---------------------------------------------------------------------------

def make_material(name: str, base_color: tuple, metallic: float = 0.3, roughness: float = 0.5):
    """Create a simple Principled BSDF material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


# Colour palette chosen for visual clarity in the viewer
mat_beam   = make_material("mat_beam",   (0.40, 0.50, 0.62), metallic=0.8, roughness=0.3)  # steel
mat_pipe   = make_material("mat_pipe",   (0.72, 0.45, 0.20), metallic=0.6, roughness=0.4)  # copper
mat_duct   = make_material("mat_duct",   (0.75, 0.75, 0.75), metallic=0.5, roughness=0.5)  # galvanised
mat_column = make_material("mat_column", (0.30, 0.30, 0.35), metallic=0.7, roughness=0.4)  # dark steel
mat_wall   = make_material("mat_wall",   (0.80, 0.78, 0.74), metallic=0.0, roughness=0.9)  # concrete
mat_floor  = make_material("mat_floor",  (0.55, 0.55, 0.52), metallic=0.0, roughness=0.95) # concrete slab

# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def assign_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_box(name: str, location: tuple, scale: tuple, mat) -> bpy.types.Object:
    """Add a cube, scale it, name it, and assign a material."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.scale = scale
    assign_material(obj, mat)
    return obj


def add_cylinder(
    name: str,
    location: tuple,
    radius: float,
    depth: float,
    rotation: tuple,
    mat,
) -> bpy.types.Object:
    """Add a cylinder (used for pipes), name it, assign material."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    assign_material(obj, mat)
    return obj


# ---------------------------------------------------------------------------
# Scene constants (metres)
# ---------------------------------------------------------------------------
BAY_X   = 10.0   # floor width  (east–west)
BAY_Y   = 8.0    # floor depth  (north–south)

BEAM_Z  = 3.2    # bottom face of beams from floor
BEAM_H  = 0.40   # I-beam approximated as a flat box
BEAM_W  = 0.18   # beam flange width

PIPE_Z  = 2.50   # pipe centreline height
PIPE_R  = 0.06   # main pipe radius

DUCT_Z  = 2.80   # duct centreline height
DUCT_W  = 0.40   # duct cross-section width
DUCT_H  = 0.25   # duct cross-section height

# ---------------------------------------------------------------------------
# Background / structural context  (unnamed in work packages — kept gray by viewer)
# ---------------------------------------------------------------------------

# Floor slab
add_box("floor_slab", location=(0, 0, -0.15), scale=(BAY_X, BAY_Y, 0.30), mat=mat_floor)

# Four corner columns  (200 × 200 mm, full storey height)
for (cx, cy) in [(-4.5, -3.5), (4.5, -3.5), (-4.5, 3.5), (4.5, 3.5)]:
    col_name = f"column_{abs(int(cx))}_{abs(int(cy))}"
    add_box(col_name, location=(cx, cy, 1.75), scale=(0.20, 0.20, 3.50), mat=mat_column)

# North and south partial walls
add_box("wall_north", location=(0,  4.1, 1.75), scale=(BAY_X, 0.20, 3.50), mat=mat_wall)
add_box("wall_south", location=(0, -4.1, 1.75), scale=(BAY_X, 0.20, 3.50), mat=mat_wall)

# ---------------------------------------------------------------------------
# Tracked elements — names MUST match work_packages.py exactly
# ---------------------------------------------------------------------------

# ── Beams (wp_beam_layout) ──────────────────────────────────────────────────
#   Three parallel beams running east–west across the bay

add_box(
    "beam_central_1",
    location=(0.0, 0.0, BEAM_Z + BEAM_H / 2),
    scale=(BAY_X, BEAM_W, BEAM_H),
    mat=mat_beam,
)

add_box(
    "beam_left_1",
    location=(0.0, -2.6, BEAM_Z + BEAM_H / 2),
    scale=(BAY_X, BEAM_W, BEAM_H),
    mat=mat_beam,
)

add_box(
    "beam_right_1",
    location=(0.0, 2.6, BEAM_Z + BEAM_H / 2),
    scale=(BAY_X, BEAM_W, BEAM_H),
    mat=mat_beam,
)

# ── Pipes (wp_plumbing_roughin) ─────────────────────────────────────────────
#   Main supply runs north–south; branches run east–west; drain stack is vertical.

ROT_Y = (math.pi / 2, 0.0, 0.0)   # cylinder axis → Y (north–south)
ROT_X = (0.0, math.pi / 2, 0.0)   # cylinder axis → X (east–west)
ROT_Z = (0.0, 0.0, 0.0)            # cylinder axis → Z (vertical)

add_cylinder(
    "pipe_main_supply",
    location=(0.0, 0.0, PIPE_Z),
    radius=PIPE_R,
    depth=BAY_Y - 0.6,
    rotation=ROT_Y,
    mat=mat_pipe,
)

add_cylinder(
    "pipe_branch_1",
    location=(-2.5, 1.8, PIPE_Z),
    radius=PIPE_R * 0.75,
    depth=4.2,
    rotation=ROT_X,
    mat=mat_pipe,
)

add_cylinder(
    "pipe_branch_2",
    location=(2.5, -1.8, PIPE_Z),
    radius=PIPE_R * 0.75,
    depth=4.2,
    rotation=ROT_X,
    mat=mat_pipe,
)

add_cylinder(
    "pipe_drain_stack",
    location=(4.0, 3.2, 1.25),
    radius=PIPE_R * 1.3,
    depth=2.50,
    rotation=ROT_Z,
    mat=mat_pipe,
)

# ── HVAC Ducts (wp_hvac_main) ───────────────────────────────────────────────
#   Main trunk runs east–west; two branches run north and south.

add_box(
    "duct_hvac_main",
    location=(0.0, 0.0, DUCT_Z + DUCT_H / 2),
    scale=(BAY_X - 1.0, DUCT_W, DUCT_H),
    mat=mat_duct,
)

add_box(
    "duct_branch_north",
    location=(2.5, 2.2, DUCT_Z + DUCT_H / 2),
    scale=(DUCT_W, 3.8, DUCT_H),
    mat=mat_duct,
)

add_box(
    "duct_branch_south",
    location=(-2.5, -2.2, DUCT_Z + DUCT_H / 2),
    scale=(DUCT_W, 3.8, DUCT_H),
    mat=mat_duct,
)

# ---------------------------------------------------------------------------
# Apply transforms before export (required for correct GLB scale/rotation)
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.select_all(action="DESELECT")

# ---------------------------------------------------------------------------
# Export as GLB
# ---------------------------------------------------------------------------
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    export_apply=True,
    export_materials="EXPORT",
    use_selection=False,
    export_yup=True,          # Three.js expects Y-up
)

print("\n[StructIQ] Export complete.")
print(f"  Output : {output_path}")
print("  Tracked elements exported:")
print("    beam_central_1, beam_left_1, beam_right_1")
print("    pipe_main_supply, pipe_branch_1, pipe_branch_2, pipe_drain_stack")
print("    duct_hvac_main, duct_branch_north, duct_branch_south")
