import { useCallback, useEffect, useState } from "react";
import { fetchRecipes, NotLoggedInError, type RecipeSummary } from "./recipes";

export type RecipeListState =
    | { kind: "loading" }
    | { kind: "login" }
    | { kind: "error"; message: string }
    | { kind: "ready"; recipes: RecipeSummary[] };

/** Loads all recipes; `reload` after logging in. */
export function useRecipeList() {
    const [state, setState] = useState<RecipeListState>({ kind: "loading" });

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

    const reload = useCallback(() => {
        setState({ kind: "loading" });
        load();
    }, [load]);

    return { state, setState, reload };
}
