#!/usr/bin/env python3
"""Push recipe notes from the Obsidian vault to the praestholm recipes API.

Obsidian is the source of truth; this script upserts every note in the recipe
folder via PUT /api/recipes/{slug}. Notes whose name starts with "_" (templates)
are skipped.

Usage:
    PRAESTHOLM_URL=https://example.dk PRAESTHOLM_API_KEY=... \
        python3 -I tools/sync_recipes.py [--dry-run] [--folder PATH]

Standard library only.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_FOLDER = Path.home() / "Documents/Obsidian_notes/Personal/Mad/Opskrifter"

# Obsidian frontmatter key -> API field
INT_FIELDS = {
    "portioner": "servings",
    "tid_min": "totalMinutes",
    "arbejdstid_min": "activeMinutes",
    "rester_holder_dage": "keepsDays",
}

WIKILINK = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]")


def slugify(text: str) -> str:
    text = text.lower()
    for src, dst in (("æ", "ae"), ("ø", "oe"), ("å", "aa")):
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:200]


def parse_frontmatter(raw: str) -> tuple[dict[str, str], str]:
    """Minimal parser for the flat `key: value` frontmatter our notes use."""
    if not raw.startswith("---\n"):
        return {}, raw
    end = raw.find("\n---", 4)
    if end == -1:
        return {}, raw
    meta: dict[str, str] = {}
    for line in raw[4:end].splitlines():
        key, sep, value = line.partition(":")
        if sep and key.strip():
            meta[key.strip()] = value.strip()
    body = raw[end + 4 :].lstrip("\n")
    return meta, body


def parse_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def parse_tags(value: str | None) -> list[str]:
    if not value:
        return []
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1]
    return [t.strip().strip("'\"") for t in value.split(",") if t.strip()]


def build_payload(path: Path, known_titles: dict[str, str]) -> tuple[str, dict]:
    meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))

    title = path.stem
    lines = body.splitlines()
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip() or title
        body = "\n".join(lines[1:]).lstrip("\n")

    # [[Other recipe]] -> link to that recipe on the site; other wikilinks -> plain text.
    def replace_link(m: re.Match) -> str:
        target, alias = m.group(1).strip(), (m.group(2) or "").strip()
        label = alias or target
        slug = known_titles.get(target.lower())
        return f"[{label}](/opskrifter/{slug})" if slug else label

    body = WIKILINK.sub(replace_link, body)

    payload: dict = {
        "title": title,
        "sourceUrl": meta.get("kilde") or None,
        "tags": parse_tags(meta.get("tags")),
        "freezesWell": meta.get("fryses_godt", "").lower() == "true",
        "content": body.rstrip() + "\n",
    }
    for key, field in INT_FIELDS.items():
        payload[field] = parse_int(meta.get(key))

    return slugify(title), payload


def put(base_url: str, api_key: str, slug: str, payload: dict) -> tuple[int, str]:
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/recipes/{urllib.parse.quote(slug)}",
        data=json.dumps(payload).encode("utf-8"),
        method="PUT",
        headers={"Content-Type": "application/json", "X-Api-Key": api_key},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, ""
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:300]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--folder", type=Path, default=DEFAULT_FOLDER, help="Obsidian recipe folder")
    parser.add_argument("--dry-run", action="store_true", help="Print payloads instead of sending them")
    args = parser.parse_args()

    notes = sorted(p for p in args.folder.glob("*.md") if not p.name.startswith("_"))
    if not notes:
        print(f"No recipe notes found in {args.folder}", file=sys.stderr)
        return 1

    # Titles are the note names (Obsidian links by file name).
    known_titles = {p.stem.lower(): slugify(p.stem) for p in notes}

    base_url = os.environ.get("PRAESTHOLM_URL", "")
    api_key = os.environ.get("PRAESTHOLM_API_KEY", "")
    if not args.dry_run and (not base_url or not api_key):
        print("Set PRAESTHOLM_URL and PRAESTHOLM_API_KEY (or use --dry-run).", file=sys.stderr)
        return 2

    failures = 0
    for path in notes:
        slug, payload = build_payload(path, known_titles)
        if args.dry_run:
            preview = {**payload, "content": payload["content"][:80] + "…"}
            print(f"{slug}: {json.dumps(preview, ensure_ascii=False)}")
            continue
        status, error = put(base_url, api_key, slug, payload)
        ok = status in (200, 201)
        failures += not ok
        print(f"{'OK ' if ok else 'ERR'} {status} {slug}{'  ' + error if error else ''}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
