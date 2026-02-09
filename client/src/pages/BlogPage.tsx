import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchBlogPosts, type BlogPost } from "../api/blog";
import Pill from "../shared/components/Pill";
import "./BlogPage.css";

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBlogPosts()
            .then(setPosts)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load posts"))
            .finally(() => setLoading(false));
    }, []);

    const sorted = useMemo(
        () => [...posts].sort((a, b) => {
            const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return db - da;
        }),
        [posts],
    );

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />

            <div className="Blogpage__container">
                <header className="Blogpage__header">
                    <h1 className="Blogpage__title">Blog</h1>
                    <p className="Blogpage__subtitle">
                        Articles about software development, architecture, and things I've learned along the way.
                    </p>
                </header>

                {error && <div className="Blogpage__error">{error}</div>}

                {!error && loading && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Loading posts…
                    </div>
                )}

                {!error && !loading && (
                    <div className="BlogGrid">
                        {sorted.map((post) => (
                            <BlogCard key={post.slug} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BlogCard({ post }: { post: BlogPost }) {
    const dateLabel = useMemo(() => {
        if (!post.publishedAt) return null;
        const d = new Date(post.publishedAt);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }, [post.publishedAt]);

    return (
        <Link to={`/blog/${post.slug}`} className="BlogCard">
            <div className="BlogCard__body">
                <h3 className="BlogCard__title">{post.title}</h3>
                <p className="BlogCard__desc">{post.description}</p>

                <div className="BlogCard__tags">
                    {post.tags.slice(0, 4).map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                    ))}
                </div>

                <div className="BlogCard__spacer" />

                <div className="BlogCard__footer">
                    {dateLabel && <span className="BlogCard__date">{dateLabel}</span>}
                    <span className="BlogCard__readMore">Read more →</span>
                </div>
            </div>
        </Link>
    );
}
