import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addRecipeToBasket, fetchBasket, type Basket } from "../api/madkurv";

/** "Læg i madkurv" with a servings stepper; shows when the recipe is already in the basket. */
export default function AddToBasket({ recipeId, defaultServings }: { recipeId: number; defaultServings: number | null }) {
    const [basket, setBasket] = useState<Basket | null>(null);
    const [servings, setServings] = useState(defaultServings ?? 4);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBasket()
            .then(setBasket)
            .catch(() => setBasket(null));
    }, []);

    if (!basket) return null;

    const line = basket.recipes.find((r) => r.recipeId === recipeId);
    if (line)
        return (
            <span className="AddToBasket">
                <span className="AddToBasket__done">✓ I madkurven · {line.servings} pers.</span>
                <Link to="/madkurv" className="Recipes__logout">
                    Gå til madkurv
                </Link>
            </span>
        );

    if (basket.status !== "kladde")
        return (
            <span className="AddToBasket">
                <span className="Madkurv__muted">Madkurven er låst til bestilling.</span>
                <Link to="/madkurv" className="Recipes__logout">
                    Se madkurv
                </Link>
            </span>
        );

    async function add() {
        setBusy(true);
        setError(null);
        try {
            setBasket(await addRecipeToBasket(recipeId, servings));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Kunne ikke lægge i madkurven");
        } finally {
            setBusy(false);
        }
    }

    return (
        <span className="AddToBasket">
            <span className="Madkurv__stepper" aria-label="Portioner">
                <button type="button" className="Editor__iconButton" disabled={servings <= 1} onClick={() => setServings(servings - 1)} aria-label="Færre portioner">
                    −
                </button>
                <span>{servings} pers.</span>
                <button type="button" className="Editor__iconButton" disabled={servings >= 100} onClick={() => setServings(servings + 1)} aria-label="Flere portioner">
                    +
                </button>
            </span>
            <button type="button" className="RecipeLogin__button" disabled={busy} onClick={add}>
                Læg i madkurv
            </button>
            {error && <span className="Editor__error">{error}</span>}
        </span>
    );
}
