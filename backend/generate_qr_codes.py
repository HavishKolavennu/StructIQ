"""
Generate printable zone QR codes for the StructIQ demo (Chunk 4.2).

Input JSON format:

Option A:
{
  "zones": [
    {
      "zone_id": "floor_3_bay_a",
      "zone_label": "Floor 3 - Bay A",
      "project_id": "site_001",
      "work_packages": ["beam_layout", "plumbing_rough_in"],
      "elevation_ft": 36,
      "placed_at": "entry_door_east"
    }
  ]
}

Option B:
[
  { ...zone payload... },
  { ...zone payload... }
]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_QR_FIELDS = {"zone_id", "zone_label", "project_id", "work_packages"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate printable zone QR code PNGs.")
    parser.add_argument("--spec", required=True, help="Path to zone spec JSON file.")
    parser.add_argument("--out-dir", default="qr_codes", help="Output directory for PNG files.")
    parser.add_argument("--box-size", type=int, default=10, help="QR module pixel size.")
    parser.add_argument("--border", type=int, default=4, help="QR border size in modules.")
    args = parser.parse_args()

    try:
        import qrcode
    except ImportError as exc:
        raise RuntimeError(
            "qrcode is required. Install with: pip install qrcode[pil]"
        ) from exc

    spec_path = Path(args.spec).resolve()
    if not spec_path.exists():
        raise RuntimeError(f"Spec file not found: {spec_path}")

    raw_data = json.loads(spec_path.read_text())
    zones = _normalize_zone_list(raw_data)
    if not zones:
        raise RuntimeError("No zone entries found in spec JSON.")

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[dict] = []

    for zone in zones:
        payload = _normalize_zone_payload(zone)
        payload_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=True)

        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=args.box_size,
            border=args.border,
        )
        qr.add_data(payload_json)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        file_name = f"zone_{_safe_name(payload['zone_id'])}.png"
        output_path = out_dir / file_name
        img.save(output_path)

        manifest.append(
            {
                "zone_id": payload["zone_id"],
                "zone_label": payload["zone_label"],
                "file": str(output_path),
                "payload_json": payload_json,
            }
        )

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))

    print(f"Generated {len(manifest)} QR code(s) in {out_dir}")
    print(f"Manifest: {manifest_path}")
    for item in manifest:
        print(f" - {item['zone_id']}: {item['file']}")


def _normalize_zone_list(raw_data) -> list[dict]:
    if isinstance(raw_data, list):
        return raw_data
    if isinstance(raw_data, dict) and isinstance(raw_data.get("zones"), list):
        return raw_data["zones"]
    raise RuntimeError("Spec JSON must be a list or an object with a 'zones' list.")


def _normalize_zone_payload(zone: dict) -> dict:
    if not isinstance(zone, dict):
        raise RuntimeError("Each zone entry must be a JSON object.")

    missing = REQUIRED_QR_FIELDS - set(zone.keys())
    if missing:
        raise RuntimeError(
            f"Zone payload missing required field(s): {', '.join(sorted(missing))}"
        )

    zone_id = str(zone["zone_id"]).strip()
    zone_label = str(zone["zone_label"]).strip()
    project_id = str(zone["project_id"]).strip()

    if not zone_id:
        raise RuntimeError("zone_id cannot be empty.")
    if not zone_label:
        raise RuntimeError("zone_label cannot be empty.")
    if not project_id:
        raise RuntimeError("project_id cannot be empty.")

    work_packages_raw = zone["work_packages"]
    if not isinstance(work_packages_raw, list) or not work_packages_raw:
        raise RuntimeError("work_packages must be a non-empty list.")
    work_packages = [str(item).strip() for item in work_packages_raw if str(item).strip()]
    if not work_packages:
        raise RuntimeError("work_packages contains no valid IDs.")

    normalized = dict(zone)
    normalized["zone_id"] = zone_id
    normalized["zone_label"] = zone_label
    normalized["project_id"] = project_id
    normalized["work_packages"] = work_packages
    return normalized


def _safe_name(value: str) -> str:
    safe = "".join(ch if (ch.isalnum() or ch in ("-", "_")) else "_" for ch in value)
    return safe or "zone"


if __name__ == "__main__":
    main()
