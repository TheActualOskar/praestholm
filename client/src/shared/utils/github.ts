export function getRepoSlug(htmlUrl: string): string | null {
    try {
        const u = new URL(htmlUrl);
        const parts = u.pathname.split("/").filter(Boolean);
        if (u.hostname !== "github.com") return null;
        if (parts.length < 2) return null;
        return `${parts[0]}/${parts[1]}`;
    } catch {
        return null;
    }
}

export function githubOgImageUrl(htmlUrl: string): string | null {
    const slug = getRepoSlug(htmlUrl);
    if (!slug) return null;
    return `https://opengraph.githubassets.com/1/${slug}`;
}
