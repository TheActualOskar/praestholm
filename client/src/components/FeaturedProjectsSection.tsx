import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";
import "./FeaturedProjectsSection.css";

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="Pill">{children}</span>;
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
        <section className="Featured">
            <div className="container">
                {/* Header (matching About/Contact style) */}
                <header className="Featured__header">
                    <h2 className="Featured__title">
                        Featured <span className="Featured__titleAccent">Work</span>
                    </h2>

                  

                    
                </header>

                {error && <div className="Featured__error">{error}</div>}

                {!error && featured.length === 0 && (
                    <div className="Featured__empty">No featured projects yet.</div>
                )}

                <div className="Featured__grid">
                    {featured.map((p) => (
                        <a
                            key={p.htmlUrl}
                            href={p.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="Featured__card"
                        >
                            <h3 className="Featured__cardTitle">{p.title}</h3>

                            {p.description ? (
                                <p className="Featured__cardText">{p.description}</p>
                            ) : (
                                <p className="Featured__cardText is-muted">
                                    Add a GitHub description to make this look better.
                                </p>
                            )}

                            <div className="Featured__meta">
                                {p.topLanguages?.length
                                    ? p.topLanguages.slice(0, 3).map((lang) => <Pill key={lang}>{lang}</Pill>)
                                    : p.language
                                        ? <Pill>{p.language}</Pill>
                                        : null}

                                <Pill>★ {p.stars}</Pill>
                                <Pill>⑂ {p.forks}</Pill>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
