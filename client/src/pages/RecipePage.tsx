import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import {
    fetchRecipe,
    formatAmount,
    formatMinutes,
    groupBySection,
    NotLoggedInError,
    type Ingredient,
    type Recipe,
} from "../api/recipes";
import { cuisinePath } from "../api/recipeThemes";
import Pill from "../shared/components/Pill";
import RecipeLogin from "./RecipeLogin";
import AddToBasket from "./AddToBasket";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";
import "./Madkurv.css";

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

            {recipe.isDraft && (
                <div className="Recipe__draftBanner">
                    Kladde: opskriften er ikke færdig endnu. <Link to={`/opskrifter/${recipe.slug}/rediger`}>Gennemse og udgiv</Link>
                </div>
            )}

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
                {recipe.cuisine && (
                    <Link to={cuisinePath(recipe.cuisine)} className="Recipe__cuisineLink">
                        <Pill className="is-cuisine">{recipe.cuisine}</Pill>
                    </Link>
                )}
                {recipe.freezesWell && <Pill>❄ kan fryses</Pill>}
                {recipe.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                ))}
            </div>

            <div className="Recipe__actions">
                {!recipe.isDraft && <AddToBasket recipeId={recipe.id} defaultServings={recipe.servings} />}
                <Link to={`/opskrifter/${recipe.slug}/rediger`} className="Recipes__logout">
                    Rediger
                </Link>
            </div>

            {recipe.sourceUrl && sourceHost && (
                <a className="Recipe__source" href={recipe.sourceUrl} target="_blank" rel="noreferrer noopener">
                    Original opskrift på {sourceHost} ↗
                </a>
            )}

            <div className="BlogPost__content">
                {recipe.intro && <Markdown>{recipe.intro}</Markdown>}

                {recipe.ingredients.length > 0 && (
                    <>
                        <h2>Ingredienser</h2>
                        {groupBySection(recipe.ingredients).map((group, gi) => (
                            <section key={gi}>
                                {group.section && <h3>{group.section}</h3>}
                                <ul className="Recipe__ingredients">
                                    {group.items.map((ing, i) => (
                                        <IngredientLine key={i} ingredient={ing} />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </>
                )}

                {recipe.steps.length > 0 && (
                    <>
                        <h2>Fremgangsmåde</h2>
                        <StepList recipe={recipe} />
                    </>
                )}

                {recipe.leftovers && (
                    <>
                        <h2>Rester og restebrug</h2>
                        <Markdown>{recipe.leftovers}</Markdown>
                    </>
                )}

                {recipe.notes && (
                    <>
                        <h2>Noter</h2>
                        <Markdown>{recipe.notes}</Markdown>
                    </>
                )}
            </div>
        </>
    );
}

function IngredientLine({ ingredient: i }: { ingredient: Ingredient }) {
    const quantity = [i.amount != null ? formatAmount(i.amount) : null, i.unit].filter(Boolean).join(" ");
    return (
        <li>
            {quantity && <span className="Recipe__quantity">{quantity}</span>} {i.name}
            {i.note && <span className="Recipe__note">, {i.note}</span>}
        </li>
    );
}

/** Steps are numbered continuously across sections. */
function StepList({ recipe }: { recipe: Recipe }) {
    const groups = groupBySection(recipe.steps);
    const starts = groups.map((_, gi) => 1 + groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0));
    return (
        <>
            {groups.map((group, gi) => {
                const start = starts[gi];
                return (
                    <section key={gi}>
                        {group.section && <h3>{group.section}</h3>}
                        <ol start={start}>
                            {group.items.map((step, i) => (
                                <li key={i}>
                                    <Markdown>{step.text}</Markdown>
                                </li>
                            ))}
                        </ol>
                    </section>
                );
            })}
        </>
    );
}
