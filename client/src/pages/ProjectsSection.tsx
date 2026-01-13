import { useEffect, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";

export default function ProjectsSection() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"));
    }, []);

    return (
        <section style={{ padding: "40px 0" }}>
            <h2 style={{ marginBottom: 16 }}>Projects</h2>

            {error && (
                <div style={{ border: "1px solid rgba(255,255,255,0.2)", padding: 12, borderRadius: 12 }}>
                    {error}
                </div>
            )}

            {!error && projects.length === 0 && <div>Loading…</div>}

            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {projects.map((p) => (
                    <a
                        key={p.htmlUrl}
                        href={p.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 16,
                            padding: 14
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ fontWeight: 600 }}>{p.title}</div>
                            {p.isFeatured && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(255,255,255,0.18)"
                                    }}
                                >
                  Featured
                </span>
                            )}
                        </div>

                        {p.description && (
                            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.4 }}>
                                {p.description}
                            </div>
                        )}

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.85, fontSize: 13 }}>
                            {p.language && <span>{p.language}</span>}
                            <span>★ {p.stars}</span>
                            <span>⑂ {p.forks}</span>
                            <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
