import { NotLoggedInError } from "./recipes";

export type ImportStatus = "venter" | "behandles" | "faerdig" | "fejlet";

export type RecipeImport = {
    id: number;
    url: string;
    comment: string | null;
    status: ImportStatus;
    error: string | null;
    recipeSlug: string | null;
    attempts: number;
    addedBy: string | null;
    createdAt: string;
    updatedAt: string;
};

async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) throw new NotLoggedInError();
    if (res.status === 400 || res.status === 404 || res.status === 409) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Noget gik galt");
    }
    if (!res.ok) throw new Error("Noget gik galt. Prøv igen.");
    return (res.status === 204 ? undefined : await res.json()) as T;
}

export const fetchImports = () => call<RecipeImport[]>("/api/recipe-imports");
export const addImport = (url: string, comment: string | null) => call<RecipeImport>("/api/recipe-imports", "POST", { url, comment });
export const deleteImport = (id: number) => call<void>(`/api/recipe-imports/${id}`, "DELETE");
export const retryImport = (id: number) => call<RecipeImport>(`/api/recipe-imports/${id}/retry`, "POST");

export function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}
