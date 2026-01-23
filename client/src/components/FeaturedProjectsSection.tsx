import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";
import "./FeaturedProjectsSection.css";
import { Link } from "react-router-dom";

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="Pill">{children}</span>;
}

function FeaturedProjectCard({ p }: { p: Project }) {
    const pills = useMemo(() => {
        const list: string[] = [];

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
        <div className="ProjectCard">
            <h3 className="ProjectCard__title">{p.title}</h3>

            {p.description ? (
                <p className="ProjectCard__desc">{p.description}</p>
            ) : (
                <p className="ProjectCard__desc ProjectCard__desc--muted">
                    No description yet — add one in the GitHub repo “About” box.
                </p>
            )}

            <div className="ProjectCard__pills">
                {pills.map((t) => (
                    <Pill key={t}>{t}</Pill>
                ))}
            </div>

            <div className="ProjectCard__updated">
                Updated {new Date(p.updatedAt).toLocaleDateString()}
            </div>

            <div className="ProjectCard__spacer" />

            <a className="ProjectCard__btn" href={p.htmlUrl} target="_blank" rel="noreferrer">
                Source code <span className="ProjectCard__btnIcon">↗</span>
            </a>
        </div>
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
        <section className="Featured">
            <div className="container">
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
                        <FeaturedProjectCard key={p.htmlUrl} p={p} />
                    ))}
                </div>

                <div className="Featured__cta">
                    <Link to="/projects" className="Featured__button">
                        View All Projects
                        <span className="Featured__buttonIcon" aria-hidden>
              →
            </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
