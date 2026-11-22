import { NotLoggedInError } from "./recipes";

export type BasketStatus = "kladde" | "klar" | "fyldt" | "bestilt";

export type BasketRecipe = {
    id: number;
    recipeId: number | null;
    /** Null if the recipe has been deleted. */
    slug: string | null;
    title: string;
    servings: number;
    recipeServings: number | null;
    /** 0 = mandag … 6 = søndag. */
    day: number | null;
    note: string | null;
    addedBy: string | null;
};

export type BasketExtra = { id: number; name: string; amount: number | null; unit: string | null; note: string | null; addedBy: string | null };

export type ShoppingItem = {
    key: string;
    name: string;
    amount: number | null;
    unit: string | null;
    sources: string[];
    note: string | null;
    have: boolean;
    fromPantry: boolean;
};

export type HouseholdItem = {
    id: number;
    name: string;
    amount: number | null;
    unit: string | null;
    note: string | null;
    active: boolean;
    addedBy: string | null;
    updatedAt: string;
};

export type Basket = {
    id: number;
    status: BasketStatus;
    createdAt: string;
    lockedAt: string | null;
    orderedAt: string | null;
    deliveryDate: string | null;
    recipes: BasketRecipe[];
    extras: BasketExtra[];
    wishes: HouseholdItem[];
    items: ShoppingItem[];
};

export type BasketSummary = {
    id: number;
    status: BasketStatus;
    createdAt: string;
    orderedAt: string | null;
    deliveryDate: string | null;
    recipes: string[];
    itemCount: number;
};

export type ListKind = "faste-varer" | "oensker" | "beholdning";

export type ItemInput = { name: string; amount: number | null; unit: string | null; note: string | null; active?: boolean };

export const DAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

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

export const fetchBasket = () => call<Basket>("/api/madkurv");
export const addRecipeToBasket = (recipeId: number, servings: number) =>
    call<Basket>("/api/madkurv/retter", "POST", { recipeId, servings });
export const updateBasketRecipe = (id: number, servings: number, day: number | null, note: string | null) =>
    call<Basket>(`/api/madkurv/retter/${id}`, "PUT", { servings, day, note });
export const removeBasketRecipe = (id: number) => call<Basket>(`/api/madkurv/retter/${id}`, "DELETE");
export const removeBasketExtra = (id: number) => call<Basket>(`/api/madkurv/ekstra/${id}`, "DELETE");
export const setHave = (key: string, have: boolean) => call<Basket>("/api/madkurv/har", "PUT", { key, have });
export const lockBasket = () => call<Basket>("/api/madkurv/klar", "POST");
export const reopenBasket = () => call<Basket>("/api/madkurv/ret-igen", "POST");
export const markOrdered = (deliveryDate: string | null) => call<Basket>("/api/madkurv/bestilt", "POST", { deliveryDate });
export const fetchHistory = () => call<BasketSummary[]>("/api/madkurv/historik");
export const fetchBasketById = (id: number) => call<Basket>(`/api/madkurv/${id}`);
export const repeatBasket = (id: number) => call<Basket>(`/api/madkurv/${id}/gentag`, "POST");

export const fetchList = (kind: ListKind) => call<HouseholdItem[]>(`/api/lister/${kind}`);
export const addListItem = (kind: ListKind, item: ItemInput) => call<HouseholdItem>(`/api/lister/${kind}`, "POST", item);
export const updateListItem = (kind: ListKind, id: number, item: ItemInput) =>
    call<HouseholdItem>(`/api/lister/${kind}/${id}`, "PUT", item);
export const deleteListItem = (kind: ListKind, id: number) => call<void>(`/api/lister/${kind}/${id}`, "DELETE");

/** ISO 8601 week number ("uge 48"). */
export function isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" });
}
