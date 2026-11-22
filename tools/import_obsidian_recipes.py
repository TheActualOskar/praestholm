#!/usr/bin/env python3
"""One-time import of Obsidian recipe notes into the praestholm recipes API.

The database is the source of truth. This script exists to move the existing
Markdown notes into the structured format (ingredients, steps, sections) and
upserts each note via PUT /api/recipes/{slug}. Re-running it OVERWRITES
recipes with the same slug, including edits made on the website.

Notes whose name starts with "_" (templates) are skipped.

Usage:
    PRAESTHOLM_URL=https://example.dk PRAESTHOLM_API_KEY=... \
        python3 -I tools/import_obsidian_recipes.py [--dry-run] [--folder PATH] [--only SLUG]

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

# Level-2 headings that map to fields; anything else is appended to notes.
SECTION_FIELDS = {
    "ingredienser": "ingredients",
    "fremgangsmåde": "steps",
    "rester og restebrug": "leftovers",
    "noter": "notes",
}

UNITS = {
    "g", "kg", "mg", "l", "dl", "cl", "ml",
    "stk", "fed", "tsk", "spsk", "knivspids", "nip",
    "stængel", "stængler", "dåse", "dåser", "pakke", "pakker", "bundt",
    "skive", "skiver", "håndfuld", "glas", "potte", "bakke", "kvist", "kviste",
}

FRACTIONS = {"½": 0.5, "¼": 0.25, "¾": 0.75}

WIKILINK = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]")

_NUM = r"(?:\d+(?:[.,]\d+)?\s*[½¼¾]?|[½¼¾]|\d+/\d+)"
AMOUNT = re.compile(rf"^(?P<a>{_NUM})(?:\s*[-–]\s*(?P<b>{_NUM}))?\s+(?P<rest>.+)$")
STEP = re.compile(r"^\d+[.)]\s+(?P<text>.+)$")
BOLD_HEADING = re.compile(r"^\*\*(?P<text>[^*]+)\*\*:?$")


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


def parse_number(text: str) -> float:
    """'2' -> 2, '2,3' -> 2.3, '1½' -> 1.5, '½' -> 0.5, '1/2' -> 0.5."""
    text = text.replace(" ", "")
    if "/" in text:
        num, den = text.split("/")
        return int(num) / int(den)
    frac = 0.0
    if text and text[-1] in FRACTIONS:
        frac = FRACTIONS[text[-1]]
        text = text[:-1]
    return (float(text.replace(",", ".")) if text else 0.0) + frac


def parse_ingredient(line: str, section: str | None) -> dict:
    """'800 g hakkede tomater (2 dåser)' -> amount 800, unit g, name 'hakkede tomater', note '2 dåser'."""
    amount = unit = None
    notes: list[str] = []
    rest = line.strip()

    m = AMOUNT.match(rest)
    if m:
        low = parse_number(m.group("a"))
        amount = low
        rest = m.group("rest").strip()
        if m.group("b"):
            # Ranges: shop for the upper bound, keep the range visible.
            amount = parse_number(m.group("b"))
            notes.append(f"{m.group('a')}–{m.group('b')}")
        word, _, after = rest.partition(" ")
        if word.lower() in UNITS and after:
            unit, rest = word.lower(), after.strip()

    paren = re.search(r"\s*\(([^()]*)\)\s*$", rest)
    if paren:
        notes.append(paren.group(1).strip())
        rest = rest[: paren.start()].strip()

    name, comma, after = rest.partition(",")
    if comma and after.strip():
        notes.insert(0, after.strip())

    return {
        "section": section,
        "amount": round(amount, 3) if amount is not None else None,
        "unit": unit,
        "name": name.strip(),
        "note": "; ".join(notes) or None,
    }


def clean_markdown(lines: list[str]) -> str | None:
    """Strips empty bullets ('- ') and surrounding blank lines; None if nothing is left."""
    kept = [ln for ln in lines if ln.strip() not in ("-", "*")]
    text = "\n".join(kept).strip()
    return text or None


def parse_body(body: str) -> dict:
    """Splits a recipe note body (without title) into the API's structured fields."""
    intro: list[str] = []
    sections: dict[str, list[str]] = {}
    extra: list[str] = []
    current: list[str] = intro

    for line in body.splitlines():
        if line.startswith("## "):
            heading = line[3:].strip()
            field = SECTION_FIELDS.get(heading.lower())
            if field:
                current = sections.setdefault(field, [])
            else:
                extra.append(f"### {heading}")
                current = extra
            continue
        current.append(line)

    ingredients: list[dict] = []
    section: str | None = None
    for line in sections.get("ingredients", []):
        s = line.strip()
        if s.startswith("### "):
            section = s[4:].strip()
        elif s.startswith(("- ", "* ")) and s[2:].strip():
            ingredients.append(parse_ingredient(s[2:], section))

    steps: list[dict] = []
    section = None
    for line in sections.get("steps", []):
        s = line.strip()
        bold = BOLD_HEADING.match(s)
        if s.startswith("### "):
            section = s[4:].strip()
        elif bold:
            section = bold.group("text").strip()
        elif m := STEP.match(s):
            steps.append({"section": section, "text": m.group("text").strip()})
        elif s and steps:
            # Continuation line belonging to the previous step.
            steps[-1]["text"] += "\n" + s

    notes = clean_markdown(sections.get("notes", []))
    extra_text = clean_markdown(extra)
    if extra_text:
        notes = f"{notes}\n\n{extra_text}" if notes else extra_text

    return {
        "intro": clean_markdown(intro),
        "ingredients": ingredients,
        "steps": steps,
        "leftovers": clean_markdown(sections.get("leftovers", [])),
        "notes": notes,
    }


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
        "cuisine": (meta.get("køkken") or "").lower() or None,
        "tags": parse_tags(meta.get("tags")),
        "freezesWell": meta.get("fryses_godt", "").lower() == "true",
        **parse_body(body),
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
    parser.add_argument("--only", metavar="SLUG", help="Import a single recipe")
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
        if args.only and slug != args.only:
            continue
        if args.dry_run:
            print(f"{slug}: {json.dumps(payload, ensure_ascii=False, indent=2)}")
            continue
        status, error = put(base_url, api_key, slug, payload)
        ok = status in (200, 201)
        failures += not ok
        print(f"{'OK ' if ok else 'ERR'} {status} {slug}{'  ' + error if error else ''}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
