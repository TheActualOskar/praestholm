import { useCallback, useEffect, useState } from "react";
import { addRecipeToBasket, fetchBasket, type Basket } from "./madkurv";

/** The current madkurv for list pages: which recipes are in it, and adding with one click. */
export function useBasket(enabled: boolean) {
    const [basket, setBasket] = useState<Basket | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch once the page is logged in; setState only happens asynchronously.
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        fetchBasket()
            .then((b) => !cancelled && setBasket(b))
            .catch(() => !cancelled && setBasket(null));
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    const add = useCallback(async (recipeId: number, servings: number) => {
        setBusyId(recipeId);
        setError(null);
        try {
            setBasket(await addRecipeToBasket(recipeId, servings));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Kunne ikke lægge i madkurven");
        } finally {
            setBusyId(null);
        }
    }, []);

    return { basket, busyId, error, add };
}

export type BasketControls = ReturnType<typeof useBasket>;
