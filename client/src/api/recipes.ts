/** Fields shared by list and detail responses. */
type RecipeBase = {
    id: number;
    title: string;
    slug: string;
    sourceUrl: string | null;
    cuisine: string | null;
    servings: number | null;
    totalMinutes: number | null;
    activeMinutes: number | null;
    tags: string[];
    freezesWell: boolean;
    keepsDays: number | null;
    isDraft: boolean;
    createdAt: string;
    updatedAt: string;
};

export type RecipeSummary = RecipeBase & {
    /** Distinct ingredient names, for search. */
    ingredients: string[];
};

export type Ingredient = {
    section: string | null;
    amount: number | null;
    unit: string | null;
    name: string;
    note: string | null;
};

export type Step = {
    section: string | null;
    text: string;
};

export type Recipe = RecipeBase & {
    intro: string | null;
    ingredients: Ingredient[];
    steps: Step[];
    leftovers: string | null;
    notes: string | null;
    createdBy: string | null;
    updatedBy: string | null;
};

/** Body for create/update. */
export type RecipeInput = {
    title: string;
    sourceUrl: string | null;
    cuisine: string | null;
    servings: number | null;
    totalMinutes: number | null;
    activeMinutes: number | null;
    tags: string[];
    freezesWell: boolean;
    keepsDays: number | null;
    intro: string | null;
    ingredients: Ingredient[];
    steps: Step[];
    leftovers: string | null;
    notes: string | null;
    isDraft: boolean;
};

/** Groups consecutive items by their `section` (null = no heading), keeping order. */
export function groupBySection<T extends { section: string | null }>(items: T[]): { section: string | null; items: T[] }[] {
    const groups: { section: string | null; items: T[] }[] = [];
    for (const item of items) {
        const last = groups[groups.length - 1];
        if (last && last.section === item.section) last.items.push(item);
        else groups.push({ section: item.section, items: [item] });
    }
    return groups;
}

const FRACTIONS: [number, string][] = [
    [0.25, "¼"],
    [0.5, "½"],
    [0.75, "¾"],
];

/** Danish amount: 1.5 -> "1½", 2.3 -> "2,3", 0.333 -> "0,33". */
export function formatAmount(amount: number): string {
    const whole = Math.floor(amount);
    const frac = amount - whole;
    for (const [value, glyph] of FRACTIONS) {
        if (Math.abs(frac - value) < 0.001) return whole > 0 ? `${whole}${glyph}` : glyph;
    }
    return amount.toLocaleString("da-DK", { maximumFractionDigits: 2 });
}

export function formatIngredient(i: Ingredient): string {
    return [i.amount != null ? formatAmount(i.amount) : null, i.unit, i.name].filter(Boolean).join(" ");
}

/** Thrown when the login cookie is missing or expired. */
export class NotLoggedInError extends Error {
    constructor() {
        super("Not logged in");
    }
}

async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: "same-origin" });
    if (res.status === 401) throw new NotLoggedInError();
    if (res.status === 404) throw new Error("Opskriften findes ikke");
    if (!res.ok) throw new Error("Kunne ikke hente opskrifter");
    return res.json();
}

export function fetchRecipes(): Promise<RecipeSummary[]> {
    return getJson("/api/recipes");
}

export function fetchRecipe(slug: string): Promise<Recipe> {
    return getJson(`/api/recipes/${encodeURIComponent(slug)}`);
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) throw new NotLoggedInError();
    if (res.status === 400) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Ugyldige data");
    }
    if (res.status === 404) throw new Error("Opskriften findes ikke");
    if (!res.ok) throw new Error("Kunne ikke gemme opskriften");
    return (res.status === 204 ? undefined : await res.json()) as T;
}

export function createRecipe(input: RecipeInput): Promise<Recipe> {
    return sendJson("/api/recipes", "POST", input);
}

export function updateRecipe(slug: string, input: RecipeInput): Promise<Recipe> {
    return sendJson(`/api/recipes/${encodeURIComponent(slug)}`, "PUT", input);
}

export function deleteRecipe(slug: string): Promise<void> {
    return sendJson(`/api/recipes/${encodeURIComponent(slug)}`, "DELETE");
}

/** `login` is the username or the email. */
export async function loginRecipes(login: string, password: string): Promise<void> {
    const res = await fetch("/api/recipes/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
    });
    if (res.status === 401) throw new Error("Forkert brugernavn eller kodeord");
    if (res.status === 429) throw new Error("For mange forsøg. Vent et minut.");
    if (!res.ok) throw new Error("Login fejlede");
}

export async function logoutRecipes(): Promise<void> {
    await fetch("/api/recipes/logout", { method: "POST", credentials: "same-origin" });
}

export function formatMinutes(min: number | null): string | null {
    if (min == null) return null;
    if (min < 60) return `${min} min`;
    const days = Math.floor(min / 1440);
    const hours = Math.floor((min % 1440) / 60);
    const rest = min % 60;
    if (days > 0) return hours > 0 ? `${days} d ${hours} t` : `${days} d`;
    return rest > 0 ? `${hours} t ${rest} min` : `${hours} t`;
}
