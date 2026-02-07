import { useMemo } from "react";
import type { Project } from "../../api/projects";
import { githubOgImageUrl } from "../utils/github";
import Pill from "./Pill";

type ProjectCardProps = {
    project: Project;
};

export default function ProjectCard({ project: p }: ProjectCardProps) {
    const imgSrc = p.imageUrl || githubOgImageUrl(p.htmlUrl);

    const tags = useMemo(() => {
        if (p.topLanguages?.length) return p.topLanguages.slice(0, 4);
        if (p.language) return [p.language];
        return [];
    }, [p.topLanguages, p.language]);

    const liveDemo: string | null =
        typeof p.homepageUrl === "string" && p.homepageUrl.length > 0
            ? p.homepageUrl
            : null;

    const updatedLabel = useMemo(() => {
        const d = new Date(p.updatedAt);
        if (Number.isNaN(d.getTime())) return "Updated —";
        return `Updated ${d.toLocaleDateString()}`;
    }, [p.updatedAt]);

    return (
        <article className="ProjectCard">
            <div className="ProjectCard__media">
                {imgSrc ? (
                    <img
                        className="ProjectCard__img"
                        src={imgSrc}
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
                        No description yet — add one in the GitHub repo "About" box.
                    </p>
                )}

                <div className="ProjectCard__tags">
                    {tags.map((t) => (
                        <Pill key={t}>{t}</Pill>
                    ))}
                    {p.topLanguages && p.topLanguages.length > 4 && (
                        <Pill className="Pill--more">+{p.topLanguages.length - 4} more</Pill>
                    )}
                </div>

                <div className="ProjectCard__spacer" />

                <div className="ProjectCard__footer">
                    <div className="ProjectCard__stats" aria-label="Repository stats">
                        <span className="Stat">
                            <span className="Stat__icon" aria-hidden="true">★</span>
                            <span className="Stat__value">{p.stars ?? 0}</span>
                        </span>
                        <span className="Stat">
                            <span className="Stat__icon" aria-hidden="true">⑂</span>
                            <span className="Stat__value">{p.forks ?? 0}</span>
                        </span>
                    </div>

                    <div className="ProjectCard__updated">{updatedLabel}</div>
                </div>

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
