import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { logoutRecipes, type RecipeSummary } from "../api/recipes";
import { cuisinePath, FEATURED_CUISINES, themeFor } from "../api/recipeThemes";
import { useRecipeList } from "../api/useRecipeList";
import RecipeBrowser from "./RecipeBrowser";
import RecipeLogin from "./RecipeLogin";
import InviteForm from "./InviteForm";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";

export default function RecipesPage() {
    const { state, setState, reload } = useRecipeList();
    const [showInvite, setShowInvite] = useState(false);

    async function logout() {
        await logoutRecipes();
        setShowInvite(false);
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
                        <div className="Recipes__headerActions">
                            <Link to="/madkurv" className="RecipeLogin__button">
                                Madkurv
                            </Link>
                            <Link to="/opskrifter/ny" className="Recipes__logout">
                                + Ny opskrift
                            </Link>
                            <button className="Recipes__logout" onClick={() => setShowInvite(!showInvite)}>
                                Inviter
                            </button>
                            <button className="Recipes__logout" onClick={logout}>
                                Log ud
                            </button>
                        </div>
                    )}
                </header>

                {state.kind === "loading" && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter opskrifter…
                    </div>
                )}

                {state.kind === "login" && <RecipeLogin onLoggedIn={reload} />}

                {state.kind === "error" && <div className="Blogpage__error">{state.message}</div>}

                {state.kind === "ready" && (
                    <>
                        {showInvite && <InviteForm onClose={() => setShowInvite(false)} />}
                        <CuisineTiles recipes={state.recipes} />
                        {state.recipes.length === 0 ? (
                            <p className="Blogpage__subtitle">
                                Ingen opskrifter endnu. <Link to="/opskrifter/ny">Tilføj den første.</Link>
                            </p>
                        ) : (
                            <RecipeBrowser recipes={state.recipes} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function CuisineTiles({ recipes }: { recipes: RecipeSummary[] }) {
    const tiles = useMemo(() => {
        const counts = new Map<string, number>(FEATURED_CUISINES.map((c) => [c, 0]));
        for (const r of recipes) if (r.cuisine) counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
        // Most recipes first, then alphabetical; featured empty cuisines last.
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "da"));
    }, [recipes]);

    return (
        <nav className="CuisineTiles" aria-label="Køkkener">
            {tiles.map(([cuisine, count]) => {
                const theme = themeFor(cuisine);
                return (
                    <Link
                        key={cuisine}
                        to={cuisinePath(cuisine)}
                        className={`CuisineTile ${count === 0 ? "is-empty" : ""}`}
                        style={{ "--theme": theme.color } as React.CSSProperties}
                    >
                        <span className="CuisineTile__name">{theme.name}</span>
                        <span className="CuisineTile__count">
                            {count === 0 ? "Ingen endnu" : `${count} ${count === 1 ? "opskrift" : "opskrifter"}`}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
