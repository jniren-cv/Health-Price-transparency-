#!/usr/bin/env python3
"""
Aetna NY MRF Rate Extractor
============================
Fetches and parses in-network rate files from Aetna's Machine-Readable Files (MRF)
and outputs a structured JSON file suitable for use in the dashboard.

CMS Transparency-in-Coverage schema reference:
  https://github.com/CMSgov/price-transparency-guide

Usage
-----
  # Extract rates for common CPT codes from the first 3 MRF files
  python scripts/extract_rates.py \\
    --index src/data/aetna_index.json \\
    --codes 99213,99214,27447,70553,93000,43239,36415 \\
    --max-files 3 \\
    --output src/data/real_rates.json

  # Filter to a specific plan
  python scripts/extract_rates.py \\
    --index src/data/aetna_index.json \\
    --plan-id 17210NY009 \\
    --codes 99213,99214 \\
    --output src/data/plan3140_rates.json

Notes
-----
  - Each MRF .json.gz file can be 100 MB–several GB uncompressed; start with --max-files 1
  - After generating real_rates.json, update src/data/sampleData.js to import and use it
  - Requires Python 3.8+ (no third-party dependencies)
"""

import argparse
import gzip
import json
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path


# ── Networking ────────────────────────────────────────────────────────────────

def fetch_gz(url: str, timeout: int = 180) -> dict:
    """Fetch a gzip-compressed JSON MRF file and return parsed dict."""
    print(f"  Fetching {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "health-price-transparency/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return json.loads(gzip.decompress(raw))


# ── Parsing ───────────────────────────────────────────────────────────────────

def build_npi_map(data: dict) -> dict[int, list[str]]:
    """
    Build a mapping from provider_group_id → list[NPI string].

    The CMS MRF spec allows provider references to be defined once at the
    top of the file and referenced by ID in each rate entry.
    """
    npi_map: dict[int, list[str]] = {}
    for ref in data.get("provider_references", []):
        gid = ref.get("provider_group_id")
        npis: list[str] = []
        for group in ref.get("provider_groups", []):
            npis.extend(str(n) for n in group.get("npi", []))
        if gid is not None:
            npi_map[gid] = npis
    return npi_map


def extract_rates(data: dict, target_codes: set[str]) -> list[dict]:
    """
    Extract negotiated rate rows for target CPT/billing codes.

    Returns a list of dicts:
      {
        billing_code, billing_code_type, description,
        negotiated_rate, negotiated_type,
        service_codes, npis
      }
    """
    npi_map = build_npi_map(data)
    results = []

    for item in data.get("in_network", []):
        code = item.get("billing_code", "")
        if code not in target_codes:
            continue

        description   = item.get("description", "")
        code_type     = item.get("billing_code_type", "CPT")

        for rate_entry in item.get("negotiated_rates", []):
            # Resolve NPIs for this rate entry
            npis: list[str] = []
            for ref_id in rate_entry.get("provider_references", []):
                npis.extend(npi_map.get(ref_id, []))

            for price in rate_entry.get("negotiated_prices", []):
                neg_type = price.get("negotiated_type", "")
                if neg_type not in ("negotiated", "fee schedule", "derived"):
                    continue

                results.append({
                    "billing_code":      code,
                    "billing_code_type": code_type,
                    "description":       description,
                    "negotiated_rate":   price.get("negotiated_rate"),
                    "negotiated_type":   neg_type,
                    "service_codes":     price.get("service_code", []),
                    "npis":              npis[:20],  # cap per row to keep output manageable
                })

    return results


# ── Region helpers ────────────────────────────────────────────────────────────

# Rough NPI prefix → NY region mapping (extend as needed)
# Real-world approach: look up NPIs via NPPES API or a local NPI database
NPI_REGION_HINTS: dict[str, str] = {
    # Manhattan / NYC (NPI area codes vary; this is illustrative)
    "1003": "Manhattan",
    "1477": "Brooklyn/Queens",
    "1568": "Bronx/Staten Island",
    "1740": "Long Island",
    "1548": "Westchester",
    "1831": "Capital Region",
    "1588": "Central NY",
    "1609": "Finger Lakes",
    "1699": "Western NY",
    "1720": "North Country",
}


def guess_region(npi: str) -> str:
    prefix = npi[:4]
    return NPI_REGION_HINTS.get(prefix, "Unknown")


def build_regional_summary(rates: list[dict]) -> dict:
    """
    Summarise avg/min/max rates per region per billing code.

    For production use, replace guess_region() with an NPPES lookup or
    a pre-built NPI→address database.
    """
    by_region: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

    for row in rates:
        val = row.get("negotiated_rate")
        if val is None:
            continue
        for npi in row.get("npis", []):
            region = guess_region(npi)
            by_region[region][row["billing_code"]].append(float(val))

    summary = {}
    for region, codes in by_region.items():
        summary[region] = {}
        for code, vals in codes.items():
            summary[region][code] = {
                "avg":   round(sum(vals) / len(vals), 2),
                "min":   round(min(vals), 2),
                "max":   round(max(vals), 2),
                "count": len(vals),
            }
    return summary


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract negotiated rates from Aetna NY MRF files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--index",     required=True, help="Path to aetna_index.json")
    parser.add_argument("--codes",     default="99213,99214,27447,70553,93000,43239,36415",
                        help="Comma-separated CPT codes to extract")
    parser.add_argument("--output",    default="src/data/real_rates.json",
                        help="Output JSON file path")
    parser.add_argument("--max-files", type=int, default=3,
                        help="Max MRF files to process (files are large; start small)")
    parser.add_argument("--plan-id",   default=None,
                        help="Filter to a specific plan ID, e.g. 17210NY009")
    parser.add_argument("--timeout",   type=int, default=180,
                        help="HTTP timeout in seconds per file")
    args = parser.parse_args()

    target_codes = set(args.codes.split(","))
    print(f"Target CPT codes : {sorted(target_codes)}")
    print(f"Plan filter      : {args.plan_id or 'all'}")
    print(f"Max files        : {args.max_files}")
    print()

    with open(args.index) as fh:
        index = json.load(fh)

    entity = index.get("reporting_entity_name", "")
    print(f"Index loaded     : {entity}")
    print(f"Structures       : {len(index.get('reporting_structure', []))}")
    print()

    all_rates: list[dict] = []
    files_done = 0

    for entry in index.get("reporting_structure", []):
        if files_done >= args.max_files:
            print(f"Reached --max-files {args.max_files}; stopping.")
            break

        # Optional plan filter
        if args.plan_id:
            plan_ids = {p["plan_id"] for p in entry.get("reporting_plans", [])}
            if args.plan_id not in plan_ids:
                continue

        for finfo in entry.get("in_network_files", []):
            if files_done >= args.max_files:
                break

            url = finfo.get("location", "")
            if not url:
                continue

            try:
                data  = fetch_gz(url, timeout=args.timeout)
                rates = extract_rates(data, target_codes)
                all_rates.extend(rates)
                files_done += 1
                print(f"  → {len(rates):,} rate rows  (running total: {len(all_rates):,})")
            except Exception as exc:
                print(f"  ERROR: {exc}", file=sys.stderr)

            # Brief pause to be polite to the server
            time.sleep(0.5)

    regional = build_regional_summary(all_rates)

    output = {
        "reporting_entity": entity,
        "last_updated":     index.get("last_updated_on"),
        "billing_codes":    sorted(target_codes),
        "plan_filter":      args.plan_id,
        "files_processed":  files_done,
        "total_rate_rows":  len(all_rates),
        "regional_summary": regional,
        "rates":            all_rates,
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2))

    print()
    print(f"Saved {len(all_rates):,} rate rows to {out_path}")
    print(f"Regions found    : {', '.join(sorted(regional)) or 'none (NPI prefix not mapped)'}")
    print()
    print("Next steps:")
    print("  1. Import real_rates.json in src/data/sampleData.js")
    print("  2. Replace the PROVIDERS array with real provider + rate data")
    print("  3. For accurate geography, use the NPPES API to geocode NPIs:")
    print("     https://npiregistry.cms.hhs.gov/api/")


if __name__ == "__main__":
    main()
