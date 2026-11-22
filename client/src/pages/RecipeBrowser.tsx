import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { RecipeSummary } from "../api/recipes";
import type { BasketControls } from "../api/useBasket";
import RecipeCard from "./RecipeCard";

type TimeFilter = "30" | "60" | "lang";
type Sort = "navn" | "nyeste" | "hurtigst";

const TIME_OPTIONS: { value: TimeFilter | null; label: string }[] = [
    { value: null, label: "Alle" },
    { value: "30", label: "Under 30 min" },
    { value: "60", label: "Under 1 time" },
    { value: "lang", label: "Over 1 time" },
];

function matchesTime(minutes: number | null, filter: TimeFilter | null): boolean {
    if (!filter) return true;
    if (minutes == null) return false;
    if (filter === "30") return minutes <= 30;
    if (filter === "60") return minutes <= 60;
    return minutes > 60;
}

/** Every word must appear in the title, cuisine, a tag or an ingredient. */
function matchesQuery(r: RecipeSummary, words: string[]): boolean {
    if (words.length === 0) return true;
    const haystack = [r.title, r.cuisine ?? "", ...r.tags, ...r.ingredients].join(" ").toLowerCase();
    return words.every((w) => haystack.includes(w));
}

const byTitle = (a: RecipeSummary, b: RecipeSummary) => a.title.localeCompare(b.title, "da");

const SORTS: Record<Sort, (a: RecipeSummary, b: RecipeSummary) => number> = {
    navn: byTitle,
    nyeste: (a, b) => b.createdAt.localeCompare(a.createdAt) || byTitle(a, b),
    hurtigst: (a, b) => (a.totalMinutes ?? Infinity) - (b.totalMinutes ?? Infinity) || byTitle(a, b),
};

/**
 * Search, filters and the recipe grid. Filter state lives in the URL (?q=&tid=&frys=&tag=&sort=)
 * so links and the back button keep it.
 */
export default function RecipeBrowser({
    recipes,
    fixedCuisine,
    basket,
}: {
    recipes: RecipeSummary[];
    fixedCuisine?: string;
    basket?: BasketControls;
}) {
    const [params, setParams] = useSearchParams();
    const query = params.get("q") ?? "";
    const time = (params.get("tid") as TimeFilter | null) ?? null;
    const freezes = params.get("frys") === "1";
    const tag = params.get("tag");
    const sort: Sort = (["navn", "nyeste", "hurtigst"] as const).find((s) => s === params.get("sort")) ?? "navn";

    function setParam(key: string, value: string | null, replace = false) {
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (value) next.set(key, value);
                else next.delete(key);
                return next;
            },
            { replace },
        );
    }

    const pool = useMemo(
        () => (fixedCuisine ? recipes.filter((r) => r.cuisine === fixedCuisine) : recipes),
        [recipes, fixedCuisine],
    );

    const allTags = useMemo(
        () => [...new Set(pool.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "da")),
        [pool],
    );

    const visible = useMemo(() => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        return pool
            .filter(
                (r) =>
                    matchesQuery(r, words) &&
                    matchesTime(r.totalMinutes, time) &&
                    (!freezes || r.freezesWell) &&
                    (!tag || r.tags.includes(tag)),
            )
            .sort((a, b) => Number(b.isDraft) - Number(a.isDraft) || SORTS[sort](a, b));
    }, [pool, query, time, freezes, tag, sort]);

    const filtered = Boolean(query || time || freezes || tag);

    if (pool.length === 0) return null;

    return (
        <section className="RecipeBrowser">
            <div className="Recipes__toolbar">
                <div className="RecipeBrowser__searchRow">
                    <input
                        className="Recipes__search"
                        type="search"
                        placeholder="Søg i retter og ingredienser…"
                        aria-label="Søg"
                        value={query}
                        onChange={(e) => setParam("q", e.target.value || null, true)}
                    />
                    <label className="RecipeBrowser__sort">
                        <span>Sortér</span>
                        <select
                            className="RecipeBrowser__select"
                            value={sort}
                            onChange={(e) => setParam("sort", e.target.value === "navn" ? null : e.target.value, true)}
                        >
                            <option value="navn">Navn</option>
                            <option value="nyeste">Nyeste</option>
                            <option value="hurtigst">Hurtigst</option>
                        </select>
                    </label>
                </div>

                <div className="Recipes__tags" role="group" aria-label="Tid">
                    {TIME_OPTIONS.map((o) => (
                        <button
                            key={o.label}
                            type="button"
                            className={`Recipes__tag ${time === o.value ? "is-active" : ""}`}
                            aria-pressed={time === o.value}
                            onClick={() => setParam("tid", o.value)}
                        >
                            {o.label}
                        </button>
                    ))}
                    <span className="RecipeBrowser__divider" />
                    <button
                        type="button"
                        className={`Recipes__tag ${freezes ? "is-active" : ""}`}
                        aria-pressed={freezes}
                        onClick={() => setParam("frys", freezes ? null : "1")}
                    >
                        ❄ Kan fryses
                    </button>
                </div>

                {allTags.length > 0 && (
                    <div className="Recipes__tags" role="group" aria-label="Tags">
                        {allTags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                className={`Recipes__tag ${tag === t ? "is-active" : ""}`}
                                aria-pressed={tag === t}
                                onClick={() => setParam("tag", tag === t ? null : t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                <div className="RecipeBrowser__count">
                    {visible.length === pool.length
                        ? `${pool.length} ${pool.length === 1 ? "opskrift" : "opskrifter"}`
                        : `${visible.length} af ${pool.length} opskrifter`}
                    {filtered && (
                        <button
                            type="button"
                            className="Editor__link"
                            onClick={() => setParams(sort === "navn" ? {} : { sort }, { replace: true })}
                        >
                            Nulstil filtre
                        </button>
                    )}
                </div>
            </div>

            {basket?.error && (
                <div className="Editor__error Recipes__basketError" role="alert">
                    {basket.error}
                </div>
            )}

            {visible.length === 0 ? (
                <p className="Blogpage__subtitle">Ingen opskrifter matcher.</p>
            ) : (
                <div className="BlogGrid">
                    {visible.map((r) => (
                        <RecipeCard key={r.slug} recipe={r} showCuisine={!fixedCuisine} basket={basket} />
                    ))}
                </div>
            )}
        </section>
    );
}
