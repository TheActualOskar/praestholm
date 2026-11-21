import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchRecipes,
    formatMinutes,
    logoutRecipes,
    NotLoggedInError,
    type RecipeSummary,
} from "../api/recipes";
import Pill from "../shared/components/Pill";
import RecipeLogin from "./RecipeLogin";
import "./BlogPage.css";
import "./RecipesPage.css";

type State =
    | { kind: "loading" }
    | { kind: "login" }
    | { kind: "error"; message: string }
    | { kind: "ready"; recipes: RecipeSummary[] };

export default function RecipesPage() {
    const [state, setState] = useState<State>({ kind: "loading" });
    const [query, setQuery] = useState("");
    const [activeTag, setActiveTag] = useState<string | null>(null);

    // setState only happens asynchronously here, so it's safe to call from an effect.
    const load = useCallback(() => {
        fetchRecipes()
            .then((recipes) => setState({ kind: "ready", recipes }))
            .catch((e) =>
                setState(
                    e instanceof NotLoggedInError
                        ? { kind: "login" }
                        : { kind: "error", message: e instanceof Error ? e.message : "Fejl" },
                ),
            );
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function onLoggedIn() {
        setState({ kind: "loading" });
        load();
    }

    const recipes = useMemo(() => (state.kind === "ready" ? state.recipes : []), [state]);

    const allTags = useMemo(
        () => [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "da")),
        [recipes],
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return recipes.filter(
            (r) =>
                (!activeTag || r.tags.includes(activeTag)) &&
                (!q || r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))),
        );
    }, [recipes, query, activeTag]);

    async function logout() {
        await logoutRecipes();
        setState({ kind: "login" });
    }

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />
            <div className="Blogpage__container">
                <header className="Blogpage__header Recipes__header">
                    <div>
                        <h1 className="Blogpage__title">Opskrifter</h1>
                        <p className="Blogpage__subtitle">Husstandens samling af retter.</p>
                    </div>
                    {state.kind === "ready" && (
                        <button className="Recipes__logout" onClick={logout}>
                            Log ud
                        </button>
                    )}
                </header>

                {state.kind === "loading" && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter opskrifter…
                    </div>
                )}

                {state.kind === "login" && <RecipeLogin onLoggedIn={onLoggedIn} />}

                {state.kind === "error" && <div className="Blogpage__error">{state.message}</div>}

                {state.kind === "ready" && (
                    <>
                        <div className="Recipes__toolbar">
                            <input
                                className="Recipes__search"
                                type="search"
                                placeholder="Søg i opskrifter…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="Recipes__tags">
                                <button
                                    className={`Recipes__tag ${activeTag === null ? "is-active" : ""}`}
                                    onClick={() => setActiveTag(null)}
                                >
                                    Alle
                                </button>
                                {allTags.map((tag) => (
                                    <button
                                        key={tag}
                                        className={`Recipes__tag ${activeTag === tag ? "is-active" : ""}`}
                                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <p className="Blogpage__subtitle">Ingen opskrifter matcher.</p>
                        ) : (
                            <div className="BlogGrid">
                                {visible.map((r) => (
                                    <RecipeCard key={r.slug} recipe={r} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
    const total = formatMinutes(recipe.totalMinutes);
    const active = formatMinutes(recipe.activeMinutes);

    return (
        <Link to={`/opskrifter/${recipe.slug}`} className="BlogCard">
            <div className="BlogCard__body">
                <h3 className="BlogCard__title">{recipe.title}</h3>
                <p className="BlogCard__desc">
                    {[
                        recipe.servings ? `${recipe.servings} pers.` : null,
                        total ? `${total} i alt` : null,
                        active && active !== total ? `${active} arbejde` : null,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>

                <div className="BlogCard__tags">
                    {recipe.freezesWell && <Pill>❄ kan fryses</Pill>}
                    {recipe.tags.slice(0, 4).map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                    ))}
                </div>

                <div className="BlogCard__spacer" />

                <div className="BlogCard__footer">
                    <span className="BlogCard__date">
                        {recipe.keepsDays ? `Holder ${recipe.keepsDays} dage` : ""}
                    </span>
                    <span className="BlogCard__readMore">Se opskrift →</span>
                </div>
            </div>
        </Link>
    );
}
