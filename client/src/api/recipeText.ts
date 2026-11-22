/**
 * Parses pasted recipe text into ingredient and step rows.
 * Mirrors tools/import_obsidian_recipes.py so both give the same result.
 */
import type { Ingredient, Step } from "./recipes";

export const UNITS = [
    "g", "kg", "mg", "l", "dl", "cl", "ml",
    "stk", "fed", "tsk", "spsk", "knivspids", "nip",
    "stængel", "stængler", "dåse", "dåser", "pakke", "pakker", "bundt",
    "skive", "skiver", "håndfuld", "glas", "potte", "bakke", "kvist", "kviste",
];

const UNIT_SET = new Set(UNITS);
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
const NUM = String.raw`(?:\d+(?:[.,]\d+)?\s*[½¼¾]?|[½¼¾]|\d+\/\d+)`;
const AMOUNT = new RegExp(String.raw`^(${NUM})(?:\s*[-–]\s*(${NUM}))?\s+(.+)$`);

/** "2" -> 2, "2,3" -> 2.3, "1½" -> 1.5, "1/2" -> 0.5; null if not a number. */
export function parseAmount(text: string): number | null {
    let t = text.replace(/\s/g, "");
    if (t === "") return null;
    if (/^\d+\/\d+$/.test(t)) {
        const [n, d] = t.split("/").map(Number);
        return d ? n / d : null;
    }
    let frac = 0;
    const last = t.slice(-1);
    if (last in FRACTIONS) {
        frac = FRACTIONS[last];
        t = t.slice(0, -1);
    }
    if (t === "") return frac || null;
    if (!/^\d+(?:[.,]\d+)?$/.test(t)) return null;
    return Number(t.replace(",", ".")) + frac;
}

export function parseIngredientLine(line: string, section: string | null): Ingredient {
    let rest = line.trim();
    let amount: number | null = null;
    let unit: string | null = null;
    const notes: string[] = [];

    const m = AMOUNT.exec(rest);
    if (m) {
        amount = parseAmount(m[1]);
        rest = m[3].trim();
        if (m[2]) {
            amount = parseAmount(m[2]);
            notes.push(`${m[1]}–${m[2]}`);
        }
        const space = rest.indexOf(" ");
        const word = space > 0 ? rest.slice(0, space).toLowerCase() : "";
        if (UNIT_SET.has(word)) {
            unit = word;
            rest = rest.slice(space + 1).trim();
        }
    }

    const paren = /\s*\(([^()]*)\)\s*$/.exec(rest);
    if (paren) {
        notes.push(paren[1].trim());
        rest = rest.slice(0, paren.index).trim();
    }

    const comma = rest.indexOf(",");
    if (comma > 0 && rest.slice(comma + 1).trim()) {
        notes.unshift(rest.slice(comma + 1).trim());
        rest = rest.slice(0, comma).trim();
    }

    return { section, amount, unit, name: rest, note: notes.join("; ") || null };
}

/** A heading is "### X", "**X**" or a short line ending in ":". */
function asHeading(line: string): string | null {
    const md = /^#{1,6}\s+(.+)$/.exec(line);
    if (md) return md[1].trim();
    const bold = /^\*\*([^*]+)\*\*:?$/.exec(line);
    if (bold) return bold[1].trim();
    if (line.endsWith(":") && line.length <= 60 && !/^\d/.test(line)) return line.slice(0, -1).trim();
    return null;
}

export function parseIngredientsText(text: string): Ingredient[] {
    const out: Ingredient[] = [];
    let section: string | null = null;
    for (const raw of text.split("\n")) {
        const line = raw.trim().replace(/^[-*•]\s*/, "");
        if (!line) continue;
        const heading = asHeading(raw.trim());
        if (heading) section = heading;
        else out.push(parseIngredientLine(line, section));
    }
    return out;
}

/** Numbered lines start new steps; other lines continue the previous step or start one if none. */
export function parseStepsText(text: string): Step[] {
    const out: Step[] = [];
    let section: string | null = null;
    let fresh = true; // next plain line starts a new step (after blank line or heading)
    for (const raw of text.split("\n")) {
        const line = raw.trim();
        if (!line) {
            fresh = true;
            continue;
        }
        const heading = asHeading(line);
        if (heading) {
            section = heading;
            fresh = true;
            continue;
        }
        const numbered = /^(?:\d+[.)]|[-*•])\s+(.+)$/.exec(line);
        if (numbered) out.push({ section, text: numbered[1].trim() });
        else if (fresh || out.length === 0) out.push({ section, text: line });
        else out[out.length - 1].text += "\n" + line;
        fresh = false;
    }
    return out;
}
