import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.78)",
            }}
        >
      {children}
    </span>
    );
}

export default function FeaturedProjectsSection() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"));
    }, []);

    const featured = useMemo(() => {
        return projects
            .filter((p) => p.isFeatured)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 3);
    }, [projects]);

    return (
        <section style={{ padding: "0 0 80px" }}>
            <div className="container">
                <h2 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2, color: "rgba(255,255,255,0.92)" }}>
                    Featured work
                </h2>

                <p style={{ marginTop: 10, maxWidth: 740, color: "rgba(255,255,255,0.68)" }}>
                    A few selected projects pulled from GitHub (topic: <b>featured</b>).
                </p>

                {error && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.2)", padding: 12, borderRadius: 12, marginTop: 16 }}>
                        {error}
                    </div>
                )}

                {!error && featured.length === 0 && <div style={{ marginTop: 16 }}>No featured projects yet.</div>}

                <div
                    className="featured-grid-fix"
                    style={{
                        marginTop: 18,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 14,
                    }}
                >
                    {featured.map((p) => (
                        <a
                            key={p.htmlUrl}
                            href={p.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                textDecoration: "none",
                                color: "inherit",
                                display: "block",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 18,
                                padding: 18,
                                background: "rgba(255,255,255,0.06)",
                                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: 16, letterSpacing: 0.2, color: "rgba(255,255,255,0.92)" }}>
                                {p.title}
                            </h3>

                            {p.description ? (
                                <p style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>
                                    {p.description}
                                </p>
                            ) : (
                                <p style={{ marginTop: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                                    Add a GitHub description to make this look better.
                                </p>
                            )}

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                {p.language && <Pill>{p.language}</Pill>}
                                <Pill>★ {p.stars}</Pill>
                                <Pill>⑂ {p.forks}</Pill>
                            </div>
                        </a>
                    ))}
                </div>

                <style>
                    {`
            @media (max-width: 980px) {
              .featured-grid-fix {
                grid-template-columns: 1fr !important;
              }
            }
          `}
                </style>
            </div>
        </section>
    );
}
