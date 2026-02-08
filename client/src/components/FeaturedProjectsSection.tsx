import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects, type Project } from "../api/projects";
import ProjectCard from "../shared/components/ProjectCard";
import "./FeaturedProjectsSection.css";

export default function FeaturedProjectsSection() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"))
            .finally(() => setLoading(false));
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

                {!error && loading && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Loading projects…
                    </div>
                )}

                {!error && !loading && featured.length === 0 && (
                    <div className="Featured__empty">No featured projects yet.</div>
                )}

                <div className="Featured__grid">
                    {featured.map((p) => (
                        <ProjectCard key={p.htmlUrl} project={p} />
                    ))}
                </div>

                <div className="Featured__cta">
                    <Link to="/projects" className="Featured__button">
                        View All Projects
                        <span className="Featured__buttonIcon" aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
