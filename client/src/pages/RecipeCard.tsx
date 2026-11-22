import { Link } from "react-router-dom";
import { formatMinutes, type RecipeSummary } from "../api/recipes";
import { themeFor } from "../api/recipeThemes";
import Pill from "../shared/components/Pill";

export default function RecipeCard({ recipe, showCuisine = true }: { recipe: RecipeSummary; showCuisine?: boolean }) {
    const total = formatMinutes(recipe.totalMinutes);
    const active = formatMinutes(recipe.activeMinutes);
    const color = recipe.cuisine ? themeFor(recipe.cuisine).color : undefined;

    return (
        <Link
            to={`/opskrifter/${recipe.slug}`}
            className={`BlogCard RecipeCard ${color ? "has-theme" : ""}`}
            style={color ? ({ "--theme": color } as React.CSSProperties) : undefined}
        >
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
                    {recipe.isDraft && <Pill className="is-draft">kladde</Pill>}
                    {showCuisine && recipe.cuisine && <Pill className="is-cuisine">{recipe.cuisine}</Pill>}
                    {recipe.freezesWell && <Pill>❄ kan fryses</Pill>}
                    {recipe.tags.slice(0, 4).map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                    ))}
                </div>

                <div className="BlogCard__spacer" />

                <div className="BlogCard__footer">
                    <span className="BlogCard__date">{recipe.keepsDays ? `Holder ${recipe.keepsDays} dage` : ""}</span>
                    <span className="BlogCard__readMore">Se opskrift →</span>
                </div>
            </div>
        </Link>
    );
}
