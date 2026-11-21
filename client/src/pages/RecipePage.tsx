import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { fetchRecipe, formatMinutes, NotLoggedInError, type Recipe } from "../api/recipes";
import Pill from "../shared/components/Pill";
import RecipeLogin from "./RecipeLogin";
import "./BlogPage.css";
import "./RecipesPage.css";

type State =
    | { kind: "loading" }
    | { kind: "login" }
    | { kind: "error"; message: string }
    | { kind: "ready"; recipe: Recipe };

export default function RecipePage() {
    const { slug } = useParams<{ slug: string }>();
    const [state, setState] = useState<State>({ kind: "loading" });

    // setState only happens asynchronously here, so it's safe to call from an effect.
    const load = useCallback(() => {
        if (!slug) return;
        fetchRecipe(slug)
            .then((recipe) => setState({ kind: "ready", recipe }))
            .catch((e) =>
                setState(
                    e instanceof NotLoggedInError
                        ? { kind: "login" }
                        : { kind: "error", message: e instanceof Error ? e.message : "Fejl" },
                ),
            );
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    function onLoggedIn() {
        setState({ kind: "loading" });
        load();
    }

    return (
        <div className="BlogPost">
            <div className="BlogPost__overlay" />
            <div className="BlogPost__container">
                <Link to="/opskrifter" className="BlogPost__back">
                    ← Alle opskrifter
                </Link>

                {state.kind === "loading" && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter opskrift…
                    </div>
                )}

                {state.kind === "login" && <RecipeLogin onLoggedIn={onLoggedIn} />}

                {state.kind === "error" && <div className="Blogpage__error">{state.message}</div>}

                {state.kind === "ready" && <RecipeView recipe={state.recipe} />}
            </div>
        </div>
    );
}

function RecipeView({ recipe }: { recipe: Recipe }) {
    const total = formatMinutes(recipe.totalMinutes);
    const active = formatMinutes(recipe.activeMinutes);
    const meta = [
        recipe.servings ? `${recipe.servings} pers.` : null,
        total ? `${total} i alt` : null,
        active && active !== total ? `${active} arbejde` : null,
        recipe.keepsDays ? `holder ${recipe.keepsDays} dage` : null,
    ].filter(Boolean) as string[];

    let sourceHost: string | null = null;
    if (recipe.sourceUrl) {
        try {
            sourceHost = new URL(recipe.sourceUrl).hostname.replace(/^www\./, "");
        } catch {
            sourceHost = null;
        }
    }

    return (
        <>
            <h1 className="BlogPost__articleTitle">{recipe.title}</h1>

            {meta.length > 0 && (
                <div className="BlogPost__meta">
                    {meta.map((m, i) => (
                        <span key={m}>
                            {i > 0 && <span className="BlogPost__metaDot">· </span>}
                            {m}
                        </span>
                    ))}
                </div>
            )}

            <div className="BlogPost__tags">
                {recipe.freezesWell && <Pill>❄ kan fryses</Pill>}
                {recipe.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                ))}
            </div>

            {recipe.sourceUrl && sourceHost && (
                <a className="Recipe__source" href={recipe.sourceUrl} target="_blank" rel="noreferrer noopener">
                    Original opskrift på {sourceHost} ↗
                </a>
            )}

            <div className="BlogPost__content">
                <Markdown>{recipe.content}</Markdown>
            </div>
        </>
    );
}
