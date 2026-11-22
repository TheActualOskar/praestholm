import { Link, useParams } from "react-router-dom";
import { themeFor } from "../api/recipeThemes";
import { useRecipeList } from "../api/useRecipeList";
import { useBasket } from "../api/useBasket";
import Pill from "../shared/components/Pill";
import RecipeBrowser from "./RecipeBrowser";
import RecipeLogin from "./RecipeLogin";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";

export default function RecipeThemePage() {
    const { cuisine = "" } = useParams<{ cuisine: string }>();
    const theme = themeFor(cuisine);
    const { state, reload } = useRecipeList();
    const basket = useBasket(state.kind === "ready");

    const count = state.kind === "ready" ? state.recipes.filter((r) => r.cuisine === theme.key).length : 0;
    const newLink = `/opskrifter/ny?koekken=${encodeURIComponent(theme.key)}`;

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />
            <div className="Blogpage__container" style={{ "--theme": theme.color } as React.CSSProperties}>
                <Link to="/opskrifter" className="BlogPost__back">
                    ← Alle opskrifter
                </Link>

                <header className="ThemeHero">
                    <div className="ThemeHero__text">
                        <p className="ThemeHero__eyebrow">Køkken</p>
                        <h1 className="Blogpage__title ThemeHero__title">{theme.name}</h1>
                        {theme.intro && <p className="Blogpage__subtitle">{theme.intro}</p>}
                        {theme.flavours.length > 0 && (
                            <div className="ThemeHero__flavours" aria-label="Typiske smage">
                                <span className="ThemeHero__flavoursLabel">Typiske smage</span>
                                {theme.flavours.map((f) => (
                                    <Pill key={f}>{f}</Pill>
                                ))}
                            </div>
                        )}
                    </div>
                    {state.kind === "ready" && (
                        <Link to={newLink} className="RecipeLogin__button ThemeHero__button">
                            + Ny {theme.name.toLowerCase()} opskrift
                        </Link>
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

                {state.kind === "ready" &&
                    (count === 0 ? (
                        <div className="ThemeEmpty">
                            <p>Ingen {theme.name.toLowerCase()} opskrifter endnu.</p>
                            <Link to={newLink} className="Editor__link">
                                Tilføj den første
                            </Link>
                        </div>
                    ) : (
                        <RecipeBrowser recipes={state.recipes} fixedCuisine={theme.key} basket={basket} />
                    ))}
            </div>
        </div>
    );
}
