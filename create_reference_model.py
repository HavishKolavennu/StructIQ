"""
create_reference_model.py — Blender Python script for StructIQ

Realistic construction interior — Floor 3 structural / MEP rough-in.

Usage:
    blender --background --python create_reference_model.py -- --output frontend/public/models/reference.glb

Scene layout (all units in metres, 1 Blender unit = 1 m):
    Bay footprint : 12 m wide (X) × 10 m deep (Y)
    Floor-to-slab : 4.0 m  (Z = 0 at finish floor)
    Column grid   : 6 columns at X = ±5, Y = –4 / 0 / +4
    Primary beams : east–west, spanning X = –5 → +5 at Y = –4 / 0 / +4
    Pipe spine    : north–south along east wall (X ≈ 5.3), branches run west
    HVAC trunk    : east–west near centre (Y ≈ 0.6), branches run north / south

Element IDs exactly match backend/models/work_packages.py:
    Beams : beam_central_1, beam_left_1, beam_right_1
    Pipes : pipe_main_supply, pipe_branch_1, pipe_branch_2, pipe_drain_stack
    Ducts : duct_hvac_main, duct_branch_north, duct_branch_south
    Walls : wall_north, wall_south, wall_east, wall_west
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy

# ── Parse arguments ────────────────────────────────────────────────────────────
argv = sys.argv
argv = argv[argv.index("--") + 1:] if "--" in argv else []

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

# ── Clear the default scene ────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for mesh in list(bpy.data.meshes):    bpy.data.meshes.remove(mesh)
for mat  in list(bpy.data.materials): bpy.data.materials.remove(mat)

# ── Material helper ────────────────────────────────────────────────────────────
def make_mat(name: str, rgb: tuple, metallic: float = 0.0, roughness: float = 0.7, alpha: float = 1.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Metallic"].default_value   = metallic
    b.inputs["Roughness"].default_value  = roughness
    if alpha < 1.0:
        mat.blend_method = "BLEND"
        b.inputs["Alpha"].default_value = alpha
    mat.use_backface_culling = False   # exports as doubleSided:true in GLTF
    return mat

# Palette — chosen for visual clarity & realistic materials
mat_beam    = make_mat("mat_beam",    (0.30, 0.34, 0.40), metallic=0.88, roughness=0.22)  # structural steel
mat_pipe    = make_mat("mat_pipe",    (0.70, 0.42, 0.18), metallic=0.65, roughness=0.38)  # copper supply
mat_duct    = make_mat("mat_duct",    (0.70, 0.72, 0.74), metallic=0.55, roughness=0.44)  # galvanised steel
mat_column  = make_mat("mat_column",  (0.22, 0.25, 0.30), metallic=0.82, roughness=0.28)  # dark structural steel
mat_wall    = make_mat("mat_wall",    (0.76, 0.74, 0.70), metallic=0.00, roughness=0.92)  # concrete / CMU
mat_floor   = make_mat("mat_floor",   (0.46, 0.46, 0.44), metallic=0.00, roughness=0.96)  # concrete slab
mat_hanger  = make_mat("mat_hanger",  (0.28, 0.28, 0.30), metallic=0.72, roughness=0.42)  # threaded rod / strut

# ── Geometry helpers ───────────────────────────────────────────────────────────
def _assign(obj, mat):
    if obj.data.materials: obj.data.materials[0] = mat
    else:                  obj.data.materials.append(mat)


def add_box(name: str, loc: tuple, scale: tuple, mat) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.scale = scale
    _assign(obj, mat)
    return obj


ROT_X = (0.0,          math.pi / 2, 0.0)  # cylinder long axis → X (east–west)
ROT_Y = (math.pi / 2,  0.0,         0.0)  # cylinder long axis → Y (north–south)
ROT_Z = (0.0,          0.0,         0.0)  # cylinder long axis → Z (vertical, default)


def add_cyl(name: str, loc: tuple, radius: float, depth: float, rot: tuple, mat) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=20, radius=radius, depth=depth, location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    _assign(obj, mat)
    return obj


# ── Scene constants (metres) ───────────────────────────────────────────────────
BAY_X   = 12.0   # floor width  (X: –6 to +6)
BAY_Y   = 10.0   # floor depth  (Y: –5 to +5)
FLOOR_H =  4.0   # floor-to-underside-of-deck

# Structural
COL_SIDE  = 0.30   # square HSS column section
BEAM_Z    = 3.62   # beam bottom face Z
BEAM_H    = 0.36   # beam depth  (approx W14 profile)
BEAM_W    = 0.22   # beam flange width

# Plumbing
PIPE_SPINE_X  = 5.35   # main supply pipe X (hugging east wall)
PIPE_MAIN_Z   = 3.08   # main supply centreline Z  (just below beam bottom)
PIPE_BRANCH_Z = 2.78   # branch centreline Z       (one layer lower)
PIPE_MAIN_R   = 0.065  # ~4" pipe outer radius
PIPE_BRANCH_R = 0.045  # ~3" branch outer radius
PIPE_STACK_R  = 0.080  # ~4" PVC drain stack

# HVAC
DUCT_TRUNK_Y  =  0.60  # trunk centreline Y (slightly north of centre)
DUCT_Z        =  3.40  # duct centreline Z  (below beams, above pipe branches)
DUCT_H        =  0.28  # duct section height
DUCT_MAIN_W   =  0.52  # main trunk width (N–S)
DUCT_BRN_W    =  0.38  # branch width (E–W)

DUCT_CZ = DUCT_Z + DUCT_H / 2   # box centre for duct slabs

# ── Floor slab ─────────────────────────────────────────────────────────────────
add_box("floor_slab", loc=(0, 0, -0.15), scale=(BAY_X + 0.44, BAY_Y + 0.44, 0.30), mat=mat_floor)

# ── Six structural columns (2 × 3 grid, X = ±5 / Y = –4, 0, +4) ──────────────
_col_positions = [(-5,-4), (5,-4), (-5,0), (5,0), (-5,4), (5,4)]
for i, (cx, cy) in enumerate(_col_positions):
    add_box(
        f"column_{i+1}",
        loc=(cx, cy, FLOOR_H / 2),
        scale=(COL_SIDE, COL_SIDE, FLOOR_H),
        mat=mat_column,
    )

# Column base plates (10 mm thick steel pads at floor level)
for i, (cx, cy) in enumerate(_col_positions):
    add_box(
        f"baseplate_{i+1}",
        loc=(cx, cy, 0.005),
        scale=(0.50, 0.50, 0.010),
        mat=mat_column,
    )

# ── Background secondary beams (north–south, connecting column lines) ──────────
#   Three N–S beams at X = –5, 0, +5 spanning the 8 m between column rows Y=–4 → +4
for i, bx in enumerate([-5.0, 0.0, 5.0]):
    add_box(
        f"sec_beam_{i+1}",
        loc=(bx, 0.0, BEAM_Z + BEAM_H / 2),
        scale=(BEAM_W, 8.0, BEAM_H),
        mat=mat_beam,
    )

# ── TRACKED: Primary beams (east–west) — wp_beam_layout ───────────────────────
#   Three E–W primary beams span X = –5 to +5, aligned with column rows.
#   beam_left_1  = south row (Y = –4)
#   beam_central_1 = middle row (Y = 0)
#   beam_right_1 = north row (Y = +4)

BEAM_CZ = BEAM_Z + BEAM_H / 2

add_box("beam_central_1", loc=(0.0,  0.0, BEAM_CZ), scale=(10.0, BEAM_W, BEAM_H), mat=mat_beam)
add_box("beam_left_1",    loc=(0.0, -4.0, BEAM_CZ), scale=(10.0, BEAM_W, BEAM_H), mat=mat_beam)
add_box("beam_right_1",   loc=(0.0,  4.0, BEAM_CZ), scale=(10.0, BEAM_W, BEAM_H), mat=mat_beam)

# Beam connection plates at column intersections (background detail)
for bx in [-5.0, 5.0]:
    for by in [-4.0, 0.0, 4.0]:
        add_box(
            f"conn_plate_{int(abs(bx))}_{int(abs(by))}",
            loc=(bx, by, BEAM_CZ),
            scale=(0.30, 0.30, BEAM_H + 0.02),
            mat=mat_column,
        )

# ── TRACKED: Plumbing — wp_plumbing_roughin ───────────────────────────────────
#
#  Realistic MEP layout for a typical floor:
#    • Main 4" supply runs NORTH–SOUTH along the east wall (X = 5.35) near ceiling
#    • Branch 1 TEES WEST from the spine at Y = +1.8, serving north zone fixtures
#    • Branch 2 TEES WEST from the spine at Y = –1.8, serving south zone fixtures
#    • Drain stack is VERTICAL in the south-east corner (wet core location)
#
#  Branches terminate at X = –4.2 (leaving ~1.8 m to west wall for future roughin)

# Main supply spine (N–S, X = 5.35, Z ≈ 3.08)
add_cyl(
    "pipe_main_supply",
    loc=(PIPE_SPINE_X, 0.0, PIPE_MAIN_Z),
    radius=PIPE_MAIN_R,
    depth=9.4,          # Y: –4.7 to +4.7
    rot=ROT_Y,
    mat=mat_pipe,
)

# Pipe hangers — threaded rods every 1.5 m along main spine
for i, hy in enumerate([-3.5, -2.0, -0.5, 1.0, 2.5, 4.0]):
    rod_h = FLOOR_H - PIPE_MAIN_Z - 0.06
    add_box(
        f"hgr_pm_{i}",
        loc=(PIPE_SPINE_X, hy, PIPE_MAIN_Z + rod_h / 2 + 0.03),
        scale=(0.022, 0.022, rod_h),
        mat=mat_hanger,
    )

# Branch 1 — tees west from spine at Y = +1.8 (north branch)
BR_X_END  = -4.2
BR_LENGTH = PIPE_SPINE_X - BR_X_END    # 9.55 m
BR_CTR_X  = (PIPE_SPINE_X + BR_X_END) / 2

add_cyl(
    "pipe_branch_1",
    loc=(BR_CTR_X, 1.8, PIPE_BRANCH_Z),
    radius=PIPE_BRANCH_R,
    depth=BR_LENGTH,
    rot=ROT_X,
    mat=mat_pipe,
)

# Branch 2 — tees west from spine at Y = –1.8 (south branch)
add_cyl(
    "pipe_branch_2",
    loc=(BR_CTR_X, -1.8, PIPE_BRANCH_Z),
    radius=PIPE_BRANCH_R,
    depth=BR_LENGTH,
    rot=ROT_X,
    mat=mat_pipe,
)

# T-junction fittings at branch tee points (wider collar where branch meets spine)
for ty in [1.8, -1.8]:
    add_cyl(
        f"tee_fitting_{int(ty*10)}",
        loc=(PIPE_SPINE_X, ty, PIPE_BRANCH_Z),
        radius=PIPE_MAIN_R * 1.28,
        depth=0.20,
        rot=ROT_Y,
        mat=mat_pipe,
    )

# Branch pipe hangers every ~2.5 m
for hy_br, y_pos in [(BR_CTR_X - 2.0, 1.8), (BR_CTR_X, 1.8), (BR_CTR_X + 2.0, 1.8),
                      (BR_CTR_X - 2.0, -1.8), (BR_CTR_X, -1.8), (BR_CTR_X + 2.0, -1.8)]:
    rod_h = FLOOR_H - PIPE_BRANCH_Z - 0.06
    add_box(
        f"hgr_br_{int(hy_br*10)}_{int(y_pos*10)}",
        loc=(hy_br, y_pos, PIPE_BRANCH_Z + rod_h / 2 + 0.03),
        scale=(0.022, 0.022, rod_h),
        mat=mat_hanger,
    )

# Drain stack — vertical 4" PVC in south-east corner (wet core)
add_cyl(
    "pipe_drain_stack",
    loc=(5.10, -4.40, 1.75),
    radius=PIPE_STACK_R,
    depth=3.50,
    rot=ROT_Z,
    mat=mat_pipe,
)

# ── TRACKED: HVAC ductwork — wp_hvac_main ─────────────────────────────────────
#
#  Realistic ductwork layout:
#    • Main trunk runs EAST–WEST just below the deck at Y = 0.6 (offset from pipe spine)
#    • North branch TEES off trunk at X = +2.5, runs to north diffusers
#    • South branch TEES off trunk at X = –2.5, runs to south diffusers
#
#  Trunk offset (Y = 0.6) keeps it clear of the pipe spine (at X = 5.35)
#  and the structural centreline. Both branches emerge from the trunk face.

add_box(
    "duct_hvac_main",
    loc=(0.0, DUCT_TRUNK_Y, DUCT_CZ),
    scale=(11.2, DUCT_MAIN_W, DUCT_H),
    mat=mat_duct,
)

# North branch (X = +2.5, from trunk north face → Y = +4.8)
NB_Y_START = DUCT_TRUNK_Y + DUCT_MAIN_W / 2   # = 0.86
NB_Y_END   = 4.8
NB_LEN     = NB_Y_END - NB_Y_START             # = 3.94
add_box(
    "duct_branch_north",
    loc=(2.5, (NB_Y_START + NB_Y_END) / 2, DUCT_CZ),
    scale=(DUCT_BRN_W, NB_LEN, DUCT_H),
    mat=mat_duct,
)

# South branch (X = –2.5, from trunk south face → Y = –4.8)
SB_Y_END   = -4.8
SB_LEN     = NB_Y_START - SB_Y_END             # = 5.66
add_box(
    "duct_branch_south",
    loc=(-2.5, (NB_Y_START + SB_Y_END) / 2, DUCT_CZ),
    scale=(DUCT_BRN_W, SB_LEN, DUCT_H),
    mat=mat_duct,
)

# Duct hangers (trapeze style — two rods + cross bar at each location)
for hx in [-4.0, -2.0, 0.0, 2.0, 4.0]:
    rod_top = FLOOR_H - 0.05
    rod_bot = DUCT_Z + DUCT_H + 0.02
    rod_h   = rod_top - rod_bot
    mid_z   = rod_bot + rod_h / 2
    # Left rod
    add_box(f"dhgr_L_{int(hx*10)}", loc=(hx - 0.32, DUCT_TRUNK_Y, mid_z),
            scale=(0.022, 0.022, rod_h), mat=mat_hanger)
    # Right rod
    add_box(f"dhgr_R_{int(hx*10)}", loc=(hx + 0.32, DUCT_TRUNK_Y, mid_z),
            scale=(0.022, 0.022, rod_h), mat=mat_hanger)
    # Cross bar (strut under duct)
    add_box(f"dhgr_X_{int(hx*10)}", loc=(hx, DUCT_TRUNK_Y, rod_bot - 0.012),
            scale=(0.75, 0.040, 0.022), mat=mat_hanger)

# ── TRACKED: Perimeter walls — wp_wall_finishes ────────────────────────────────
#   Full-height exterior / party walls.  Stage colouring is applied dynamically
#   by the Three.js viewer based on mockData / API results.
WALL_T = 0.22

add_box("wall_north", loc=(0,     5.10, FLOOR_H / 2), scale=(BAY_X + WALL_T * 2, WALL_T, FLOOR_H), mat=mat_wall)
add_box("wall_south", loc=(0,    -5.10, FLOOR_H / 2), scale=(BAY_X + WALL_T * 2, WALL_T, FLOOR_H), mat=mat_wall)
add_box("wall_east",  loc=( 6.10, 0,    FLOOR_H / 2), scale=(WALL_T, BAY_Y,       FLOOR_H),         mat=mat_wall)
add_box("wall_west",  loc=(-6.10, 0,    FLOOR_H / 2), scale=(WALL_T, BAY_Y,       FLOOR_H),         mat=mat_wall)

# ── Windows + construction site details ───────────────────────────────────────

mat_glass    = make_mat("mat_glass",    (0.58, 0.78, 0.88), metallic=0.10, roughness=0.06, alpha=0.20)
mat_winframe = make_mat("mat_winframe", (0.16, 0.18, 0.20), metallic=0.88, roughness=0.24)
mat_scaffold = make_mat("mat_scaffold", (0.40, 0.38, 0.36), metallic=0.30, roughness=0.70)
mat_plywood  = make_mat("mat_plywood",  (0.65, 0.52, 0.32), metallic=0.00, roughness=0.88)
mat_cmu      = make_mat("mat_cmu",      (0.54, 0.54, 0.52), metallic=0.00, roughness=0.92)

WIN_W  = 1.60   # window width
WIN_H  = 1.50   # window height
WIN_Z  = 1.75   # window centre height (sill ≈ 1.0 m)
FD     = 0.10   # frame depth (how far it protrudes from wall face)

N_IY =  4.99   # north wall inner face Y
N_OY =  5.21   # north wall outer face Y
S_IY = -4.99   # south wall inner face Y

# ── North wall — 3 rough openings (steel frame, construction-grade) ────────────
#   X = –3.5 : glass installed      X = 0 : frame only (not yet glazed)     X = +3.5 : glass installed
for i, (wx, glazed) in enumerate([(-3.5, True), (0.0, False), (3.5, True)]):
    # Outer frame box (slightly larger than opening)
    add_box(f"wfr_N_{i}", loc=(wx, N_IY - FD/2, WIN_Z),
            scale=(WIN_W + 0.18, FD, WIN_H + 0.18), mat=mat_winframe)
    # Horizontal mullion rail
    add_box(f"wmul_N_{i}", loc=(wx, N_IY - FD/2 - 0.01, WIN_Z + 0.10),
            scale=(WIN_W, FD + 0.02, 0.07), mat=mat_winframe)
    if glazed:
        add_box(f"wgl_N_{i}", loc=(wx, N_IY - FD - 0.01, WIN_Z),
                scale=(WIN_W - 0.08, 0.02, WIN_H - 0.08), mat=mat_glass)

# ── South wall — 2 windows + 1 loading bay ────────────────────────────────────
for i, wx in enumerate([-3.5, 3.5]):
    add_box(f"wfr_S_{i}", loc=(wx, S_IY + FD/2, WIN_Z),
            scale=(WIN_W + 0.18, FD, WIN_H + 0.18), mat=mat_winframe)
    add_box(f"wmul_S_{i}", loc=(wx, S_IY + FD/2 + 0.01, WIN_Z + 0.10),
            scale=(WIN_W, FD + 0.02, 0.07), mat=mat_winframe)
    add_box(f"wgl_S_{i}", loc=(wx, S_IY + FD + 0.01, WIN_Z),
            scale=(WIN_W - 0.08, 0.02, WIN_H - 0.08), mat=mat_glass)

# Loading bay door (X=0, south wall) — steel frame, no door leaf installed yet
BAY_W, BAY_H = 2.80, 3.20
add_box("bay_frame",   loc=(0.0, S_IY + FD/2, BAY_H/2),
        scale=(BAY_W + 0.22, FD, BAY_H + 0.10), mat=mat_winframe)
# Heavy steel header above opening
add_box("bay_lintel",  loc=(0.0, S_IY + 0.08, BAY_H + 0.15),
        scale=(BAY_W + 0.50, 0.22, 0.28), mat=mat_column)

# ── Exterior scaffolding — north face ─────────────────────────────────────────
SCAF_Y = N_OY + 0.75   # scaffold stands 75 cm from outer wall face

# Vertical standards at X = –4, –1.5, +1.5, +4
for i, sx in enumerate([-4.0, -1.5, 1.5, 4.0]):
    add_cyl(f"scaf_std_{i}",  loc=(sx, SCAF_Y, 2.50),
            radius=0.026, depth=5.10, rot=ROT_Z, mat=mat_scaffold)
    # Wall tie (horizontal brace back to wall)
    tie_len = SCAF_Y - N_IY + 0.10
    add_cyl(f"scaf_tie_{i}",  loc=(sx, (SCAF_Y + N_IY)/2, 2.60),
            radius=0.018, depth=tie_len, rot=ROT_Y, mat=mat_scaffold)

# Horizontal ledgers at Z = 1.5 and Z = 3.5
for j, sz in enumerate([1.5, 3.5]):
    add_cyl(f"scaf_ledger_{j}", loc=(0.0, SCAF_Y, sz),
            radius=0.020, depth=9.20, rot=ROT_X, mat=mat_scaffold)

# Working platform boards at Z = 3.55
add_box("scaf_boards", loc=(0.0, SCAF_Y, 3.58),
        scale=(9.0, 0.50, 0.05), mat=mat_plywood)

# ── Material staging area (south-west corner) ─────────────────────────────────
# Plywood sheets leaning against west wall
add_box("ply_stack",  loc=(-5.35, -3.20, 0.65), scale=(0.06, 1.80, 1.30), mat=mat_plywood)

# Stacked CMU blocks (3 courses)
for k in range(3):
    add_box(f"cmu_{k}", loc=(1.20, -4.30, 0.10 + k * 0.22),
            scale=(1.60, 0.80, 0.20), mat=mat_cmu)

# Pallet of bagged material (corner near loading bay)
add_box("pallet_base", loc=(-1.20, -4.60, 0.08), scale=(1.20, 0.80, 0.14), mat=mat_plywood)
add_box("bags_stack",  loc=(-1.20, -4.60, 0.40), scale=(1.10, 0.70, 0.55), mat=mat_cmu)

# ── Apply transforms before export ────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.select_all(action="DESELECT")

# ── Export as GLB ──────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    export_apply=True,
    export_materials="EXPORT",
    use_selection=False,
    export_yup=True,   # Three.js expects Y-up
)

print("\n[StructIQ] Export complete.")
print(f"  Output : {output_path}")
print("\n  Tracked elements exported:")
for eid in [
    "beam_central_1", "beam_left_1", "beam_right_1",
    "pipe_main_supply", "pipe_branch_1", "pipe_branch_2", "pipe_drain_stack",
    "duct_hvac_main", "duct_branch_north", "duct_branch_south",
    "wall_north", "wall_south", "wall_east", "wall_west",
]:
    print(f"    ✓  {eid}")
