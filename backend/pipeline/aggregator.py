"""
Aggregation logic for StructIQ VLM analysis.

Takes the list of per-frame observation dicts (one dict per frame, from vlm_client)
and collapses them into a single per-element stage assessment.

Public API:
    aggregate_observations(all_frame_observations, work_packages) -> ElementResults
    compute_work_package_stage(wp, element_results) -> str
    ElementResults  — type alias for the returned dict
"""

from __future__ import annotations

from collections import Counter
from typing import TypedDict

try:
    from ..models.work_packages import WorkPackage
except ImportError:
    from models.work_packages import WorkPackage

# ---------------------------------------------------------------------------
# Confidence constants
# ---------------------------------------------------------------------------

CONFIDENCE_NONE = "none"    # Element never appeared in any frame
CONFIDENCE_LOW = "low"      # Element seen in exactly 1 frame
CONFIDENCE_MEDIUM = "medium" # 2+ frames but stages disagree
CONFIDENCE_HIGH = "high"    # 2+ frames and all agree on the same stage


# ---------------------------------------------------------------------------
# Type definitions (for IDE support — not enforced at runtime)
# ---------------------------------------------------------------------------

class FrameEvidence(TypedDict):
    frame_id: str
    vlm_observation: str
    vlm_stage_assessment: str
    vlm_confidence: str


class ElementResult(TypedDict):
    stage: str
    confidence: str
    conflicting: bool
    conflict_note: str | None
    frame_evidence: list[FrameEvidence]


ElementResults = dict[str, ElementResult]


# ---------------------------------------------------------------------------
# Main aggregation function
# ---------------------------------------------------------------------------

def aggregate_observations(
    all_frame_observations: list[dict],
    work_packages: list[WorkPackage],
) -> ElementResults:
    """
    Aggregate per-frame VLM observations into a single stage assessment per element.

    Args:
        all_frame_observations:
            One dict per frame (as returned by vlm_client.analyze_frame):
                {
                    "frame_id": str,
                    "observations": [
                        {
                            "element_id": str,
                            "work_package_id": str,
                            "stage": str,
                            "evidence": str,
                            "confidence": "high" | "medium" | "low"
                        },
                        ...
                    ]
                }
        work_packages:
            The work package definitions that define all expected elements.
            Elements that appear in the definitions but never in any observation
            will be marked as "not_captured".

    Returns:
        Dict mapping element_id -> ElementResult.
    """
    # Build set of all expected element ids from work package definitions
    all_element_ids: set[str] = {
        elem.id
        for wp in work_packages
        for elem in wp.elements
    }

    # Collect every observation that mentions a known element
    # keyed by element_id → list of raw observation dicts (enriched with frame_id)
    obs_by_element: dict[str, list[dict]] = {eid: [] for eid in all_element_ids}

    for frame_result in all_frame_observations:
        frame_id = frame_result.get("frame_id", "unknown")
        for obs in frame_result.get("observations", []):
            element_id = obs.get("element_id")
            if element_id in obs_by_element:
                obs_by_element[element_id].append(
                    {
                        "frame_id": frame_id,
                        "stage": obs.get("stage", "unclear"),
                        "evidence": obs.get("evidence", ""),
                        "confidence": obs.get("confidence", "medium"),
                        "work_package_id": obs.get("work_package_id", ""),
                    }
                )
            elif element_id:
                # VLM mentioned an element not in our work packages — ignore
                pass

    # Determine consensus per element
    results: ElementResults = {}

    for element_id, observations in obs_by_element.items():
        results[element_id] = _resolve_element(element_id, observations)

    return results


def compute_work_package_stage(
    wp: WorkPackage,
    element_results: ElementResults,
) -> str:
    """
    Derive the overall stage for a work package.

    Strategy (conservative — matches PRD philosophy):
      - If all elements are "not_captured" → "not_captured"
      - Otherwise → the LOWEST stage among elements that have a known stage.
        "not_captured" elements don't drag the package down but are noted in the
        element list so the PM knows which elements are unverified.

    Args:
        wp:              The work package definition (needed for stage ordering).
        element_results: Aggregated per-element results from aggregate_observations().

    Returns:
        Stage id string.
    """
    known_stages: list[str] = []

    for elem in wp.elements:
        result = element_results.get(elem.id)
        if result is None:
            continue
        stage = result["stage"]
        if stage not in ("not_captured", "unclear"):
            known_stages.append(stage)

    if not known_stages:
        return "not_captured"

    return wp.get_lowest_stage(known_stages) or "not_captured"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_element(element_id: str, observations: list[dict]) -> ElementResult:
    """
    Apply the aggregation rules for a single element.

    Rules (from architecture.md → VLM Prompt Strategy → Aggregation logic):
      - 0 observations               → not_captured, confidence none
      - 1 observation                → use it, confidence low
      - 2+ all same stage            → use it, confidence high
      - 2+ conflicting stages        → most-frequent wins, confidence medium, flag conflict
    """
    # Filter out "unclear" observations from consensus calculation,
    # but keep them in the evidence list so the PM can see them.
    valid_obs = [o for o in observations if o.get("stage") not in ("unclear", None, "")]
    all_obs = observations  # for the evidence gallery

    # --- 0 observations ---
    if not all_obs:
        return ElementResult(
            stage="not_captured",
            confidence=CONFIDENCE_NONE,
            conflicting=False,
            conflict_note=None,
            frame_evidence=[],
        )

    # --- Only unclear observations ---
    if not valid_obs:
        return ElementResult(
            stage="unclear",
            confidence=CONFIDENCE_LOW,
            conflicting=False,
            conflict_note="Element was visible in footage but stage could not be determined.",
            frame_evidence=_format_evidence(all_obs),
        )

    # --- 1 valid observation ---
    if len(valid_obs) == 1:
        obs = valid_obs[0]
        return ElementResult(
            stage=obs["stage"],
            confidence=CONFIDENCE_LOW,
            conflicting=False,
            conflict_note=None,
            frame_evidence=_format_evidence(all_obs),
        )

    # --- 2+ valid observations ---
    stage_counts: Counter = Counter(o["stage"] for o in valid_obs)
    most_common_stage, _ = stage_counts.most_common(1)[0]

    if len(stage_counts) == 1:
        # All agree
        return ElementResult(
            stage=most_common_stage,
            confidence=CONFIDENCE_HIGH,
            conflicting=False,
            conflict_note=None,
            frame_evidence=_format_evidence(all_obs),
        )
    else:
        # Conflicting — most frequent wins
        breakdown = ", ".join(f"{stage}: {count}" for stage, count in stage_counts.most_common())
        conflict_note = (
            f"Conflicting assessments across frames ({breakdown}). "
            f"Using most frequently reported stage: '{most_common_stage}'."
        )
        return ElementResult(
            stage=most_common_stage,
            confidence=CONFIDENCE_MEDIUM,
            conflicting=True,
            conflict_note=conflict_note,
            frame_evidence=_format_evidence(all_obs),
        )


def _format_evidence(observations: list[dict]) -> list[FrameEvidence]:
    """Convert raw observation dicts to the FrameEvidence shape."""
    return [
        FrameEvidence(
            frame_id=obs["frame_id"],
            vlm_observation=obs["evidence"],
            vlm_stage_assessment=obs["stage"],
            vlm_confidence=obs["confidence"],
        )
        for obs in observations
    ]
