import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Markdown from "react-markdown";
import { fetchBlogPost, type BlogPost } from "../api/blog";
import Pill from "../shared/components/Pill";
import "./BlogPage.css";

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        fetchBlogPost(slug)
            .then(setPost)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load post"))
            .finally(() => setLoading(false));
    }, [slug]);

    const dateLabel = useMemo(() => {
        if (!post?.publishedAt) return null;
        const d = new Date(post.publishedAt);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }, [post?.publishedAt]);

    if (loading) {
        return (
            <div className="BlogPost">
                <div className="BlogPost__overlay" />
                <div className="BlogPost__container">
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Loading article…
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="BlogPost">
                <div className="BlogPost__overlay" />
                <div className="BlogPost__container">
                    <Link to="/blog" className="BlogPost__back">
                        ← Back to Blog
                    </Link>
                    <div className="Blogpage__error">{error ?? "Post not found"}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="BlogPost">
            <div className="BlogPost__overlay" />
            <div className="BlogPost__container">
                <Link to="/blog" className="BlogPost__back">
                    ← Back to Blog
                </Link>

                <h1 className="BlogPost__articleTitle">{post.title}</h1>

                <div className="BlogPost__meta">
                    <span>{post.author}</span>
                    {dateLabel && (
                        <>
                            <span className="BlogPost__metaDot">·</span>
                            <span>{dateLabel}</span>
                        </>
                    )}
                </div>

                {post.tags.length > 0 && (
                    <div className="BlogPost__tags">
                        {post.tags.map((tag) => (
                            <Pill key={tag}>{tag}</Pill>
                        ))}
                    </div>
                )}

                <div className="BlogPost__content">
                    <Markdown>{post.content}</Markdown>
                </div>
            </div>
        </div>
    );
}
