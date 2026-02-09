export type BlogPost = {
    id: number;
    title: string;
    slug: string;
    description: string;
    content: string;
    author: string;
    tags: string[];
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    isPublished: boolean;
};

export async function fetchBlogPosts(): Promise<BlogPost[]> {
    const res = await fetch("/api/blog");
    if (!res.ok) throw new Error("Failed to load blog posts");
    return res.json();
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
    const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Failed to load blog post");
    return res.json();
}
