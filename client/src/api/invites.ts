export type InviteResult = {
    email: string;
    emailed: boolean;
    inviteUrl: string;
    expiresAt: string;
};

export type InviteInfo = {
    email: string;
    invitedBy: string;
    expiresAt: string;
};

async function post(url: string, body: unknown): Promise<Response> {
    return fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
    if (res.status === 429) return "For mange forsøg. Vent et minut.";
    try {
        const data = await res.json();
        if (typeof data?.error === "string") return data.error;
    } catch {
        // No JSON body.
    }
    return fallback;
}

export async function createInvite(email: string): Promise<InviteResult> {
    const res = await post("/api/invites", { email });
    if (res.status === 401) throw new Error("Du er ikke logget ind længere.");
    if (!res.ok) throw new Error(await errorMessage(res, "Kunne ikke oprette invitationen"));
    return res.json();
}

/** Null when the link is invalid, used or expired. */
export async function lookupInvite(token: string): Promise<InviteInfo | null> {
    const res = await post("/api/invites/lookup", { token });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await errorMessage(res, "Kunne ikke tjekke invitationen"));
    return res.json();
}

/** Creates the user and logs them in (sets the cookie). */
export async function signup(token: string, username: string, password: string): Promise<void> {
    const res = await post("/api/signup", { token, username, password });
    if (!res.ok) throw new Error(await errorMessage(res, "Kunne ikke oprette brugeren"));
}
