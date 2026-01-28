import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";
import "./FeaturedProjectsSection.css";
import { Link } from "react-router-dom";

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="Pill">{children}</span>;
}

function getRepoSlug(htmlUrl: string): string | null {
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

function githubOgImageUrl(htmlUrl: string): string | null {
    const slug = getRepoSlug(htmlUrl);
    if (!slug) return null;
    return `https://opengraph.githubassets.com/1/${slug}`;
}

function FeaturedProjectCard({ p }: { p: Project }) {
    const og = githubOgImageUrl(p.htmlUrl);

    const pills = useMemo(() => {
        const list: string[] = [];

        if (p.topLanguages?.length) list.push(...p.topLanguages.slice(0, 3));
        else if (p.language) list.push(p.language);

        list.push(`★ ${p.stars}`);
        list.push(`⑂ ${p.forks}`);

        return list;
    }, [p]);

    // Optional “Live Demo” if your Project object has it
    const anyP = p as any;
    const liveDemo: string | null =
        typeof anyP.homepageUrl === "string" && anyP.homepageUrl.length > 0
            ? anyP.homepageUrl
            : typeof anyP.homepage === "string" && anyP.homepage.length > 0
                ? anyP.homepage
                : null;

    return (
        <article className="ProjectCard">
            <div className="ProjectCard__media">
                {og ? (
                    <img
                        className="ProjectCard__img"
                        src={og}
                        alt={`${p.title} preview`}
                        loading="lazy"
                    />
                ) : (
                    <div className="ProjectCard__img ProjectCard__img--fallback" aria-hidden="true">
                        <div className="ProjectCard__fallbackMark">
                            {p.title?.slice(0, 1)?.toUpperCase()}
                        </div>
                    </div>
                )}
            </div>

            <div className="ProjectCard__body">
                <div className="ProjectCard__topRow">
                    <h3 className="ProjectCard__title">{p.title}</h3>
                    <span className="ProjectCard__linkIcon" aria-hidden="true">↗</span>
                </div>

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

                <div className="ProjectCard__meta">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                </div>

                <div className="ProjectCard__spacer" />

                <div className="ProjectCard__actions">
                    {liveDemo && (
                        <a
                            className="ProjectCard__actionLink"
                            href={liveDemo}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Live Demo <span className="ProjectCard__btnIcon">↗</span>
                        </a>
                    )}

                    <a
                        className="ProjectCard__actionLink"
                        href={p.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Source Code <span className="ProjectCard__btnIcon">↗</span>
                    </a>
                </div>
            </div>
        </article>
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

                    <p>
                        Here is a selection of my full-stack development and some of the work that I&apos;m extra proud of.
                    </p>
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
