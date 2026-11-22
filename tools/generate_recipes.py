#!/usr/bin/env -S python3 -I
"""Turn the links in "Til generering" into draft recipes on praestholm.dk.

For each waiting link the script claims it, downloads the page, asks Claude
(`claude -p`) to turn it into the site's recipe structure, saves the result as
a draft and marks the link as done (or failed, with the reason). Review and
publish the drafts on the site.

Run (installed as `praestholm-generer` in ~/.local/bin, see tools/praestholm-generer):
    praestholm-generer             # all waiting links; asks for the API key the first time
    praestholm-generer --limit 1   # just one
    praestholm-generer --dry-run   # generate and print, save nothing
    praestholm-generer --setup     # change the stored API key or site address

The key lives in ~/.config/praestholm/api_key (only readable by you); the site
address in ~/.config/praestholm/url (default https://praestholm.dk).
PRAESTHOLM_API_KEY / PRAESTHOLM_URL override them.

Standard library only; needs the `claude` command on PATH.
"""

from __future__ import annotations

import argparse
import getpass
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "praestholm"
KEY_FILE = CONFIG_DIR / "api_key"
URL_FILE = CONFIG_DIR / "url"
DEFAULT_URL = "https://praestholm.dk"

# A normal browser UA: some recipe sites refuse unknown clients.
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
MAX_PAGE_CHARS = 60_000
CLAUDE_TIMEOUT_S = 600

UNITS = ["g", "kg", "ml", "cl", "dl", "l", "stk", "fed", "tsk", "spsk", "knivspids", "nip",
         "stængler", "dåse", "dåser", "pakke", "bundt", "skiver", "håndfuld", "glas", "potte", "bakke", "kviste"]
CUISINES = ["amerikansk", "dansk", "fransk", "græsk", "indisk", "italiensk", "japansk", "kinesisk", "koreansk",
            "malaysisk", "mellemøstlig", "mexicansk", "spansk", "thai", "vietnamesisk"]
TAGS = ["hverdag", "weekend", "hurtig", "vegetar", "meal prep", "ovn", "gryde", "pasta", "suppe", "salat",
        "oksekød", "svinekød", "kylling", "fisk", "planlæg-forud", "stor-portion"]

_NULLABLE_STR = {"type": ["string", "null"]}
_NULLABLE_INT = {"type": ["integer", "null"]}
RECIPE_SCHEMA = {
    "type": "object",
    "properties": {
        "found": {"type": "boolean", "description": "false if the page holds no recipe"},
        "title": {"type": "string"},
        "cuisine": _NULLABLE_STR,
        "servings": _NULLABLE_INT,
        "totalMinutes": _NULLABLE_INT,
        "activeMinutes": _NULLABLE_INT,
        "tags": {"type": "array", "items": {"type": "string"}},
        "freezesWell": {"type": "boolean"},
        "keepsDays": _NULLABLE_INT,
        "intro": _NULLABLE_STR,
        "ingredients": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "section": _NULLABLE_STR,
                    "amount": {"type": ["number", "null"]},
                    "unit": _NULLABLE_STR,
                    "name": {"type": "string"},
                    "note": _NULLABLE_STR,
                },
                "required": ["section", "amount", "unit", "name", "note"],
            },
        },
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"section": _NULLABLE_STR, "text": {"type": "string"}},
                "required": ["section", "text"],
            },
        },
        "leftovers": _NULLABLE_STR,
        "notes": _NULLABLE_STR,
    },
    "required": ["found", "title", "cuisine", "servings", "totalMinutes", "activeMinutes", "tags", "freezesWell",
                 "keepsDays", "intro", "ingredients", "steps", "leftovers", "notes"],
}

PROMPT = """Du laver en opskrift om til en husstands opskriftsdatabase. Opskriftssiden står på stdin \
(struktureret data fra siden først, derefter sidens tekst). Kilde: {url}

Regler:
- Alt på dansk. Oversæt, hvis siden er på et andet sprog; brug danske varenavne, som man ville købe dem i et dansk supermarked.
- Ingredienser: én vare pr. linje. amount er et tal (1,5 -> 1.5; ½ -> 0.5) eller null ("salt og peber"). \
unit er en af: {units} — eller null for stk-løse ting. Omregn cups/oz/lb/°F til metriske enheder.
- name er kun varen ("hakket oksekød"); tilberedning og alternativer i note ("finthakket", "eller svinebov").
- section bruges, når opskriften har dele ("Sauce", "Til servering"); ellers null. Samme for trin ("Dag 1").
- steps: ét trin pr. handling, uden nummerering i teksten.
- servings: antal personer. totalMinutes/activeMinutes i minutter, hvis de står der eller kan udledes sikkert, ellers null.
- cuisine: én af {cuisines} (små bogstaver), eller null hvis ingen passer.
- tags: 2-5 fra {tags}, gerne flere relevante fra samme stil.
- freezesWell og keepsDays: ud fra opskriften og almindelig køkkenviden.
- intro: kun hvis retten kræver planlægning eller særligt udstyr (fx "start dagen før"), ellers null.
- leftovers: 2-4 punkter i markdown ("- ...") om hvad der typisk bliver tilovers (fx resten af et bundt eller en pakke) og hvad det kan bruges til.
- notes: null, medmindre husstandens kommentar giver anledning til en note.
- Opfind ikke ingredienser eller mængder. Står der ingen opskrift på siden, sæt found=false og lad resten være tomt.
{comment}"""


# ---------- Config ----------

def load_config() -> tuple[str, str]:
    url = os.environ.get("PRAESTHOLM_URL") or (URL_FILE.read_text().strip() if URL_FILE.exists() else DEFAULT_URL)
    key = os.environ.get("PRAESTHOLM_API_KEY") or (KEY_FILE.read_text().strip() if KEY_FILE.exists() else "")
    return url.rstrip("/"), key


def setup() -> int:
    current_url, _ = load_config()
    print("Opsætning af generatoren. Nøglen gemmes i", KEY_FILE)
    if sys.stdin.isatty():
        url = input(f"Sidens adresse [{current_url}]: ").strip() or current_url
        key = os.environ.get("PRAESTHOLM_API_KEY") or getpass.getpass("API-nøgle (vises ikke): ").strip()
    else:
        url = current_url
        key = os.environ.get("PRAESTHOLM_API_KEY") or sys.stdin.readline().strip()
    if not key:
        print("Ingen nøgle. Kør kommandoen i en almindelig terminal, så du kan skrive den.", file=sys.stderr)
        return 2

    status, _ = api(url.rstrip("/"), key, "GET", "/api/recipe-imports")
    if status == 401:
        print("Siden afviste nøglen (401). Intet er gemt.", file=sys.stderr)
        return 1
    if status != 200:
        print(f"Kunne ikke nå {url} (status {status}). Intet er gemt.", file=sys.stderr)
        return 1

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_DIR.chmod(0o700)
    for path, value in ((KEY_FILE, key), (URL_FILE, url.rstrip("/"))):
        path.write_text(value + "\n")
        path.chmod(0o600)
    print("Gemt. Nøglen bliver husket.")
    return 0


# ---------- Site API ----------

def api(base: str, key: str, method: str, path: str, body: dict | None = None) -> tuple[int, object]:
    req = urllib.request.Request(
        base + path,
        method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"X-Api-Key": key, "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw.decode("utf-8", "replace")[:300]
    except urllib.error.URLError as e:
        return 0, str(e.reason)


def error_text(data: object) -> str:
    if isinstance(data, dict) and "error" in data:
        return str(data["error"])
    return str(data)[:300]


# ---------- Page download ----------

class _TextExtractor(HTMLParser):
    """Visible text plus JSON-LD blocks (where recipe sites put structured recipes)."""

    SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "header", "form", "iframe"}
    BLOCK = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section", "article"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []
        self.jsonld: list[str] = []
        self._skip = 0
        self._in_jsonld = False

    def handle_starttag(self, tag, attrs):
        if tag == "script" and ("type", "application/ld+json") in attrs:
            self._in_jsonld = True
        elif tag in self.SKIP:
            self._skip += 1
        elif tag in self.BLOCK:
            self.text.append("\n")

    def handle_endtag(self, tag):
        if tag == "script" and self._in_jsonld:
            self._in_jsonld = False
        elif tag in self.SKIP and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._in_jsonld:
            self.jsonld.append(data)
        elif not self._skip:
            self.text.append(data)


def recipe_jsonld(blocks: list[str]) -> list[dict]:
    """Recipe objects from JSON-LD (also inside @graph or lists)."""
    found: list[dict] = []

    def walk(node):
        if isinstance(node, list):
            for n in node:
                walk(n)
        elif isinstance(node, dict):
            kind = node.get("@type")
            if kind == "Recipe" or (isinstance(kind, list) and "Recipe" in kind):
                found.append(node)
            for value in node.values():
                if isinstance(value, (list, dict)):
                    walk(value)

    for block in blocks:
        try:
            walk(json.loads(block))
        except ValueError:
            continue
    return found


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA, "Accept-Language": "da,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=30) as res:
        charset = res.headers.get_content_charset() or "utf-8"
        raw = res.read(5_000_000).decode(charset, "replace")

    parser = _TextExtractor()
    parser.feed(raw)
    text = html.unescape(re.sub(r"\n\s*\n+", "\n\n", "".join(parser.text))).strip()
    recipes = recipe_jsonld(parser.jsonld)

    parts = []
    if recipes:
        parts.append("STRUKTUREREDE DATA (schema.org Recipe):\n" + json.dumps(recipes, ensure_ascii=False)[:20_000])
    parts.append("SIDENS TEKST:\n" + text)
    return "\n\n".join(parts)[:MAX_PAGE_CHARS]


# ---------- Claude ----------

def generate(url: str, comment: str | None, page: str, model: str | None) -> dict:
    prompt = PROMPT.format(
        url=url,
        units=", ".join(UNITS),
        cuisines=", ".join(CUISINES),
        tags=", ".join(TAGS),
        comment=f"\nHusstandens kommentar (følg den, fx skalér ved \"dobbelt portion\"): {comment}" if comment else "",
    )
    cmd = ["claude", "-p", prompt, "--output-format", "json", "--tools", "", "--json-schema", json.dumps(RECIPE_SCHEMA)]
    if model:
        cmd += ["--model", model]

    try:
        proc = subprocess.run(cmd, input=page, capture_output=True, text=True, timeout=CLAUDE_TIMEOUT_S)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Claude svarede ikke inden for {CLAUDE_TIMEOUT_S // 60} minutter.")

    try:
        out = json.loads(proc.stdout)
    except ValueError:
        raise RuntimeError(f"Claude fejlede: {(proc.stderr or proc.stdout).strip()[:300]}")
    if out.get("is_error") or not isinstance(out.get("structured_output"), dict):
        raise RuntimeError(f"Claude fejlede: {str(out.get('result') or out.get('subtype'))[:300]}")
    return out["structured_output"]


def to_request(recipe: dict, url: str) -> dict:
    """Claude's answer -> body for POST /api/recipes (as a draft)."""
    if not recipe.get("found", True):
        raise RuntimeError("Fandt ingen opskrift på siden.")
    ingredients = [i for i in recipe.get("ingredients") or [] if str(i.get("name") or "").strip()]
    steps = [s for s in recipe.get("steps") or [] if str(s.get("text") or "").strip()]
    if not str(recipe.get("title") or "").strip() or not ingredients or not steps:
        raise RuntimeError("Fandt ingen komplet opskrift på siden (mangler navn, ingredienser eller fremgangsmåde).")

    def positive(value):
        return value if isinstance(value, int) and value > 0 else None

    return {
        "title": recipe["title"].strip()[:200],
        "sourceUrl": url,
        "cuisine": (recipe.get("cuisine") or None),
        "servings": positive(recipe.get("servings")),
        "totalMinutes": positive(recipe.get("totalMinutes")),
        "activeMinutes": positive(recipe.get("activeMinutes")),
        "tags": [t.strip().replace(",", "")[:50] for t in recipe.get("tags") or [] if t.strip()][:8],
        "freezesWell": bool(recipe.get("freezesWell")),
        "keepsDays": positive(recipe.get("keepsDays")),
        "intro": recipe.get("intro") or None,
        "ingredients": [
            {
                "section": i.get("section") or None,
                "amount": i["amount"] if isinstance(i.get("amount"), (int, float)) and i["amount"] >= 0 else None,
                "unit": (i.get("unit") or None),
                "name": i["name"].strip()[:200],
                "note": (i.get("note") or None),
            }
            for i in ingredients
        ][:100],
        "steps": [{"section": s.get("section") or None, "text": s["text"].strip()[:2000]} for s in steps][:100],
        "leftovers": recipe.get("leftovers") or None,
        "notes": recipe.get("notes") or None,
        "isDraft": True,
    }


# ---------- Main ----------

def process(base: str, key: str, item: dict, model: str | None, dry_run: bool) -> bool:
    link, comment = item["url"], item.get("comment")
    print(f"• {link}" + (f"  ({comment})" if comment else ""))

    if not dry_run:
        status, data = api(base, key, "POST", f"/api/recipe-imports/{item['id']}/claim")
        if status != 200:
            print(f"  springes over: {error_text(data)}")
            return True

    def fail(reason: str) -> bool:
        print(f"  ✗ {reason}")
        if not dry_run:
            api(base, key, "POST", f"/api/recipe-imports/{item['id']}/failed", {"error": reason})
        return False

    try:
        page = fetch_page(link)
    except urllib.error.HTTPError as e:
        return fail(f"Siden kunne ikke hentes ({e.code}).")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return fail(f"Siden kunne ikke hentes: {getattr(e, 'reason', e)}")

    print("  genererer med Claude…", flush=True)
    try:
        body = to_request(generate(link, comment, page, model), link)
    except RuntimeError as e:
        return fail(str(e))

    if dry_run:
        print(json.dumps(body, ensure_ascii=False, indent=2))
        return True

    status, data = api(base, key, "POST", "/api/recipes", body)
    if status != 201 or not isinstance(data, dict):
        return fail(f"Siden afviste opskriften: {error_text(data)}")

    slug = data["slug"]
    api(base, key, "POST", f"/api/recipe-imports/{item['id']}/done", {"recipeSlug": slug})
    print(f"  ✓ kladde: {data['title']} ({len(body['ingredients'])} ingredienser) → {base}/opskrifter/{slug}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--setup", action="store_true", help="gem API-nøgle og adresse (én gang)")
    parser.add_argument("--limit", type=int, default=0, help="højst så mange links (0 = alle)")
    parser.add_argument("--dry-run", action="store_true", help="generér og vis, men gem intet og markér intet")
    parser.add_argument("--model", help="Claude-model, fx sonnet (standard: din normale model)")
    args = parser.parse_args()

    if args.setup:
        return setup()

    base, key = load_config()
    if not key and sys.stdin.isatty():
        # First run in a terminal: ask for the key once, then carry on.
        if (rc := setup()) != 0:
            return rc
        base, key = load_config()
    if not key:
        print("Ingen API-nøgle. Kør først: praestholm-generer --setup (i en terminal)", file=sys.stderr)
        return 2
    if not shutil.which("claude"):
        print("Kommandoen `claude` blev ikke fundet på PATH.", file=sys.stderr)
        return 2

    status, items = api(base, key, "GET", "/api/recipe-imports?status=venter")
    if status == 401:
        print("Siden afviste API-nøglen. Kør --setup igen.", file=sys.stderr)
        return 2
    if status != 200 or not isinstance(items, list):
        print(f"Kunne ikke hente køen ({status}): {error_text(items)}", file=sys.stderr)
        return 1
    if not items:
        print("Ingen links venter.")
        return 0

    items = sorted(items, key=lambda i: i["createdAt"])
    if args.limit > 0:
        items = items[: args.limit]
    print(f"{len(items)} link(s) venter.\n")

    ok = sum(process(base, key, item, args.model, args.dry_run) for item in items)
    print(f"\nFærdig: {ok} af {len(items)} lykkedes." + ("" if args.dry_run else f" Gennemse kladderne på {base}/opskrifter/generering"))
    return 0 if ok == len(items) else 1


if __name__ == "__main__":
    sys.exit(main())
