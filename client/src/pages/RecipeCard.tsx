import { Link } from "react-router-dom";
import { formatMinutes, type RecipeSummary } from "../api/recipes";
import { themeFor } from "../api/recipeThemes";
import type { BasketControls } from "../api/useBasket";
import Pill from "../shared/components/Pill";

/**
 * Recipe card. The title link is stretched over the whole card (so the card stays clickable),
 * and the madkurv button sits above it.
 */
export default function RecipeCard({
    recipe,
    showCuisine = true,
    basket,
}: {
    recipe: RecipeSummary;
    showCuisine?: boolean;
    basket?: BasketControls;
}) {
    const total = formatMinutes(recipe.totalMinutes);
    const active = formatMinutes(recipe.activeMinutes);
    const color = recipe.cuisine ? themeFor(recipe.cuisine).color : undefined;

    return (
        <article
            className={`BlogCard RecipeCard ${color ? "has-theme" : ""}`}
            style={color ? ({ "--theme": color } as React.CSSProperties) : undefined}
        >
            <div className="BlogCard__body">
                <h3 className="BlogCard__title">
                    <Link to={`/opskrifter/${recipe.slug}`} className="RecipeCard__link">
                        {recipe.title}
                    </Link>
                </h3>
                <p className="BlogCard__desc">
                    {[
                        recipe.servings ? `${recipe.servings} pers.` : null,
                        total ? `${total} i alt` : null,
                        active && active !== total ? `${active} arbejde` : null,
                        recipe.keepsDays ? `holder ${recipe.keepsDays} dage` : null,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>

                <div className="BlogCard__tags">
                    {recipe.isDraft && <Pill className="is-draft">kladde</Pill>}
                    {showCuisine && recipe.cuisine && <Pill className="is-cuisine">{recipe.cuisine}</Pill>}
                    {recipe.freezesWell && <Pill>❄ kan fryses</Pill>}
                    {recipe.tags.slice(0, 4).map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                    ))}
                </div>

                <div className="BlogCard__spacer" />

                <div className="BlogCard__footer">
                    <BasketAction recipe={recipe} basket={basket} />
                    <span className="BlogCard__readMore">Se opskrift →</span>
                </div>
            </div>
        </article>
    );
}

function BasketAction({ recipe, basket }: { recipe: RecipeSummary; basket?: BasketControls }) {
    if (!basket?.basket || recipe.isDraft) return <span />;

    const line = basket.basket.recipes.find((r) => r.recipeId === recipe.id);
    if (line)
        return (
            <Link to="/madkurv" className="RecipeCard__action RecipeCard__inBasket" title="Gå til madkurven">
                ✓ I madkurven · {line.servings} pers.
            </Link>
        );

    const locked = basket.basket.status !== "kladde";
    return (
        <button
            type="button"
            className="RecipeCard__action Recipes__tag"
            disabled={locked || basket.busyId !== null}
            title={locked ? "Madkurven er låst til bestilling" : `Læg i madkurven til ${recipe.servings ?? 4} personer`}
            onClick={() => basket.add(recipe.id, recipe.servings ?? 4)}
        >
            {basket.busyId === recipe.id ? "Lægger i…" : "+ Madkurv"}
        </button>
    );
}
