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

function ProjectCard({ p }: { p: Project }) {
    const pills = useMemo(() => {
        const list: string[] = [];
        if (p.isFeatured) list.push("Featured");
        
        if (p.topLanguages?.length) {
            list.push(...p.topLanguages.slice(0, 3));
        } else if (p.language) {
            list.push(p.language);
        }
        
        list.push(`★ ${p.stars}`);
        list.push(`⑂ ${p.forks}`);
        return list;
    }, [p]);

    return (
        <a
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
            <h3
                style={{
                    margin: 0,
                    fontSize: 16,
                    letterSpacing: 0.2,
                    color: "rgba(255,255,255,0.92)",
                }}
            >
                {p.title}
            </h3>

            {p.description ? (
                <p style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>
                    {p.description}
                </p>
            ) : (
                <p style={{ marginTop: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                    No description yet — add one in the GitHub repo “About” box.
                </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {pills.map((t) => (
                    <Pill key={t}>{t}</Pill>
                ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                Updated {new Date(p.updatedAt).toLocaleDateString()}
            </div>
        </a>
    );
}

export default function ProjectsSection() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"));
    }, []);

    const sorted = useMemo(() => {
        return [...projects].sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, [projects]);

    return (
        <section style={{ padding: "0 0 80px" }}>
            <div className="container">
                <h2
                    style={{
                        margin: 0,
                        fontSize: 22,
                        letterSpacing: 0.2,
                        color: "rgba(255,255,255,0.92)",
                    }}
                >
                    
                </h2>



                {error && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.2)", padding: 12, borderRadius: 12, marginTop: 16 }}>
                        {error}
                    </div>
                )}

                {!error && sorted.length === 0 && <div style={{ marginTop: 16 }}>Loading…</div>}

                <div
                    className="projects-grid-fix"
                    style={{
                        marginTop: 18,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 14,
                    }}
                >
                    {sorted.map((p) => (
                        <ProjectCard key={p.htmlUrl} p={p} />
                    ))}
                </div>

                <style>
                    {`
            @media (max-width: 980px) {
              .projects-grid-fix {
                grid-template-columns: 1fr !important;
              }
            }
          `}
                </style>
            </div>
        </section>
    );
}
