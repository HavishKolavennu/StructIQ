"""
VLM prompt builders for StructIQ construction frame analysis.

All prompts are fully parameterised — no hardcoded stage names, element lists,
or zone labels. Call build_system_prompt() once per job and build_frame_prompt()
once per frame.
"""

from __future__ import annotations

try:
    from ..models.work_packages import WorkPackage
except ImportError:
    from models.work_packages import WorkPackage


def build_system_prompt(zone_label: str, work_packages: list[WorkPackage]) -> str:
    """
    Build the system prompt sent once at the start of an analysis job.

    Args:
        zone_label:     Human-readable zone name, e.g. "Floor 3".
        work_packages:  All work packages in scope for this zone.

    Returns:
        System prompt string ready to pass to the VLM API.
    """
    wp_block = _format_work_packages_block(work_packages)

    return f"""You are a construction progress analyst reviewing walkthrough video footage of an active job site.

ZONE CONTEXT: {zone_label}

WORK PACKAGES IN THIS ZONE:
{wp_block}
YOUR TASK:
For each frame you receive, identify which elements from the work packages above are visible. For each visible element, assess its current construction stage based on what you can see in the image.

RULES:
1. Only report elements from the work package list above. Never invent elements that are not listed.
2. If you are not confident you can identify a specific element, skip it entirely — do not guess.
3. If an element is visible but you cannot determine its stage with confidence, set stage to "unclear" and explain what you see.
4. Always describe the specific visual evidence that led to your stage assessment (bolt heads, temporary bracing, pipe connections, etc.).
5. Be conservative — when in doubt, report the LOWER (earlier) stage.
6. Different frames may show the same element from different angles. Report each observation independently; the system will aggregate across all frames.
7. A frame may contain no relevant elements — that is fine. Respond with an empty observations list.

OUTPUT FORMAT — respond in this EXACT JSON structure and nothing else. No markdown, no code fences, no explanation outside the JSON:
{{
  "frame_id": "<frame_filename>",
  "observations": [
    {{
      "element_id": "<element_id from work package list>",
      "work_package_id": "<work_package_id>",
      "stage": "<one of the valid stage ids for this element type>",
      "evidence": "<specific visual evidence description — 1-3 sentences>",
      "confidence": "<high | medium | low>"
    }}
  ]
}}

If no relevant elements are visible, respond with:
{{
  "frame_id": "<frame_filename>",
  "observations": []
}}"""


def build_frame_prompt(frame_filename: str, zone_label: str) -> str:
    """
    Build the per-frame user prompt (minimal — the system prompt carries the context).

    Args:
        frame_filename: Filename of the frame image, e.g. "frame_004.jpg".
        zone_label:     Human-readable zone name for reference.

    Returns:
        User prompt string to send alongside the image.
    """
    return (
        f"Analyze this construction site frame from {zone_label}. "
        f"Identify any elements from the provided work packages and assess their construction stage.\n\n"
        f"Frame: {frame_filename}"
    )


def build_retry_suffix() -> str:
    """
    Appended to the user prompt on a retry attempt when the first response
    was not valid JSON. Makes the output constraint explicit.
    """
    return (
        "\n\nIMPORTANT: Your previous response was not valid JSON. "
        "Respond ONLY with the JSON object. "
        "Do not include markdown code fences (```), do not include any text before or after the JSON. "
        "Start your response with { and end with }."
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _format_work_packages_block(work_packages: list[WorkPackage]) -> str:
    """
    Render work package definitions as a human-readable block for the system prompt.
    """
    sections: list[str] = []

    for wp in work_packages:
        element_lines = "\n".join(
            f"      - {elem.id}: {elem.name}"
            for elem in wp.elements
        )
        stage_lines = "\n".join(
            f"      {s.order}. {s.id} — {s.label}: {s.description}"
            for s in wp.stages
        )
        sections.append(
            f"  Work Package: {wp.name}  (id: {wp.id})\n"
            f"    Owner: {wp.owner}\n"
            f"    Element type: {wp.element_type}\n"
            f"    Elements:\n{element_lines}\n"
            f"    Valid stages (in order — earliest to latest):\n{stage_lines}"
        )

    return "\n\n".join(sections) + "\n"
