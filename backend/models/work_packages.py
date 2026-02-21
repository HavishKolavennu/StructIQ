"""
Work package data models and demo data for StructIQ.

Used by:
  - backend/pipeline/prompts.py  (prompt building)
  - backend/pipeline/aggregator.py  (stage ordering, element lookup)
  - backend/pipeline/analyzer.py  (results assembly)
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Core models
# ---------------------------------------------------------------------------

class StageDefinition(BaseModel):
    """A single named stage in a construction sequence."""
    id: str                 # e.g. "placed"
    label: str              # e.g. "Placed — in position, not yet connected"
    description: str        # Longer description for the VLM prompt
    order: int              # 0 = earliest. Used to find "lowest" stage for work package rollup.


class Element(BaseModel):
    """A single trackable construction element within a work package."""
    id: str                 # Matches 3D model mesh name, e.g. "beam_central_1"
    name: str               # Human label, e.g. "Central Beam"
    type: str               # Element type, e.g. "beam", "pipe", "duct"
    work_package_id: str    # Parent work package id


class WorkPackage(BaseModel):
    """
    A set of related elements that are tracked together.
    e.g. "Beam Layout" contains three beam elements.
    """
    id: str
    name: str
    zone: str               # e.g. "floor_3"
    owner: str              # Responsible subcontractor
    element_type: str       # Dominant element type: "beam", "pipe", "duct", "wall"
    stages: list[StageDefinition]
    elements: list[Element]

    def get_stage_order(self, stage_id: str) -> int:
        """Return the order index of a stage. Returns 999 for unknown stages."""
        for stage in self.stages:
            if stage.id == stage_id:
                return stage.order
        return 999

    def get_stage_ids(self) -> list[str]:
        return [s.id for s in self.stages]

    def get_lowest_stage(self, stage_ids: list[str]) -> Optional[str]:
        """Return the stage with the lowest order (earliest in the sequence)."""
        valid = [s for s in stage_ids if s not in ("not_captured", "unclear")]
        if not valid:
            return None
        return min(valid, key=self.get_stage_order)


# ---------------------------------------------------------------------------
# Stage definitions
# ---------------------------------------------------------------------------

BEAM_STAGES: list[StageDefinition] = [
    StageDefinition(
        id="not_started",
        label="Not Started",
        description="No beam material present. Column/support points exist but the beam has not arrived.",
        order=0,
    ),
    StageDefinition(
        id="delivered",
        label="Delivered",
        description="Steel beam is on-site (resting on the ground or on a material stack) but not yet lifted into position.",
        order=1,
    ),
    StageDefinition(
        id="placed",
        label="Placed",
        description="Beam has been lifted and is resting on column supports. Temporary bracing or shoring may be present. No permanent connections yet.",
        order=2,
    ),
    StageDefinition(
        id="braced",
        label="Braced",
        description="Temporary lateral bracing installed to stabilise the beam while permanent connections are made.",
        order=3,
    ),
    StageDefinition(
        id="connected",
        label="Connected",
        description="Permanent bolted or welded connections made at both ends. Bolt heads visible, no temporary bracing.",
        order=4,
    ),
    StageDefinition(
        id="inspected",
        label="Inspected",
        description="Structural inspection completed and documented. Inspection tag or chalk mark may be visible.",
        order=5,
    ),
    StageDefinition(
        id="complete",
        label="Complete",
        description="All work finished. Beam is permanently installed, connected, inspected, and signed off.",
        order=6,
    ),
]

PIPE_STAGES: list[StageDefinition] = [
    StageDefinition(
        id="not_started",
        label="Not Started",
        description="No pipe material present in the area. Only structural elements or empty space.",
        order=0,
    ),
    StageDefinition(
        id="materials_on_site",
        label="Materials On Site",
        description="Pipe sections, fittings, and hangers delivered to the floor but not yet installed.",
        order=1,
    ),
    StageDefinition(
        id="rough_in_started",
        label="Rough-In Started",
        description="Some pipe segments hung or placed. Hangers installed. Work is clearly underway but not all runs are complete.",
        order=2,
    ),
    StageDefinition(
        id="rough_in_complete",
        label="Rough-In Complete",
        description="All pipe segments placed and joined. Full routing from supply to fixture connections complete.",
        order=3,
    ),
    StageDefinition(
        id="pressure_tested",
        label="Pressure Tested",
        description="Pressure test gauges visible or test caps on pipe ends. System has been verified leak-free.",
        order=4,
    ),
    StageDefinition(
        id="inspected",
        label="Inspected",
        description="Plumbing inspection completed. Inspection tag visible or work is clearly finished.",
        order=5,
    ),
    StageDefinition(
        id="complete",
        label="Complete",
        description="All plumbing work finished and signed off.",
        order=6,
    ),
]

HVAC_STAGES: list[StageDefinition] = [
    StageDefinition(
        id="not_started",
        label="Not Started",
        description="No ductwork present.",
        order=0,
    ),
    StageDefinition(
        id="materials_on_site",
        label="Materials On Site",
        description="Duct sections and hangers delivered but not yet installed.",
        order=1,
    ),
    StageDefinition(
        id="duct_installed",
        label="Duct Installed",
        description="Main duct runs hung and connected. Branch ducts may still be missing.",
        order=2,
    ),
    StageDefinition(
        id="branches_complete",
        label="Branches Complete",
        description="All branch ducts installed and connected to main trunk.",
        order=3,
    ),
    StageDefinition(
        id="balanced",
        label="Air Balanced",
        description="Airflow tested and dampers adjusted. Diffusers installed.",
        order=4,
    ),
    StageDefinition(
        id="inspected",
        label="Inspected",
        description="HVAC inspection passed.",
        order=5,
    ),
    StageDefinition(
        id="complete",
        label="Complete",
        description="All HVAC work finished.",
        order=6,
    ),
]


# ---------------------------------------------------------------------------
# Demo work packages — Floor 3
# These are hardcoded as default data for hackathon demos.
# In production these would be imported from BIM/Revit or a project database.
# ---------------------------------------------------------------------------

DEMO_WORK_PACKAGES: list[WorkPackage] = [
    WorkPackage(
        id="wp_beam_layout",
        name="Beam Layout",
        zone="floor_3",
        owner="Joe's Structural LLC",
        element_type="beam",
        stages=BEAM_STAGES,
        elements=[
            Element(
                id="beam_central_1",
                name="Central Beam",
                type="beam",
                work_package_id="wp_beam_layout",
            ),
            Element(
                id="beam_left_1",
                name="Left Beam",
                type="beam",
                work_package_id="wp_beam_layout",
            ),
            Element(
                id="beam_right_1",
                name="Right Beam",
                type="beam",
                work_package_id="wp_beam_layout",
            ),
        ],
    ),
    WorkPackage(
        id="wp_plumbing_roughin",
        name="Plumbing Rough-In",
        zone="floor_3",
        owner="Allied Mechanical",
        element_type="pipe",
        stages=PIPE_STAGES,
        elements=[
            Element(
                id="pipe_main_supply",
                name="Main Supply Line",
                type="pipe",
                work_package_id="wp_plumbing_roughin",
            ),
            Element(
                id="pipe_branch_1",
                name="Branch Line 1",
                type="pipe",
                work_package_id="wp_plumbing_roughin",
            ),
            Element(
                id="pipe_branch_2",
                name="Branch Line 2",
                type="pipe",
                work_package_id="wp_plumbing_roughin",
            ),
            Element(
                id="pipe_drain_stack",
                name="Drain Stack",
                type="pipe",
                work_package_id="wp_plumbing_roughin",
            ),
        ],
    ),
    WorkPackage(
        id="wp_hvac_main",
        name="HVAC Ductwork",
        zone="floor_3",
        owner="CoolAir Systems",
        element_type="duct",
        stages=HVAC_STAGES,
        elements=[
            Element(
                id="duct_hvac_main",
                name="Main Trunk Duct",
                type="duct",
                work_package_id="wp_hvac_main",
            ),
            Element(
                id="duct_branch_north",
                name="North Branch",
                type="duct",
                work_package_id="wp_hvac_main",
            ),
            Element(
                id="duct_branch_south",
                name="South Branch",
                type="duct",
                work_package_id="wp_hvac_main",
            ),
        ],
    ),
]


def get_demo_work_packages(zone_id: str = "floor_3") -> list[WorkPackage]:
    """Return the demo work packages for a given zone."""
    return [wp for wp in DEMO_WORK_PACKAGES if wp.zone == zone_id]


def get_all_zones() -> list[str]:
    """Return distinct zone IDs from the demo data."""
    return list({wp.zone for wp in DEMO_WORK_PACKAGES})
