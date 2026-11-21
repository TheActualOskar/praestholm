export type RecipeSummary = {
    id: number;
    title: string;
    slug: string;
    sourceUrl: string | null;
    servings: number | null;
    totalMinutes: number | null;
    activeMinutes: number | null;
    tags: string[];
    freezesWell: boolean;
    keepsDays: number | null;
    updatedAt: string;
};

export type Recipe = RecipeSummary & {
    content: string;
    createdAt: string;
};

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
