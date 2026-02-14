export type Project = {
    title: string;
    repo: string;
    htmlUrl: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    topLanguages: string[];
    updatedAt: string;
    isFeatured: boolean;
    imageUrl?: string | null;
    homepageUrl?: string | null;
    blogSlug?: string | null;
};

export async function fetchProjects(): Promise<Project[]> {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json();
}
