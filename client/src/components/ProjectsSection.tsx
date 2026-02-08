import { useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../api/projects";
import ProjectCard from "../shared/components/ProjectCard";
import "./ProjectsSection.css";

export default function ProjectsSection() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"))
            .finally(() => setLoading(false));
    }, []);

    const sorted = useMemo(() => {
        return [...projects].sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, [projects]);

    return (
        <section className="ProjectsSection">
            {error && <div className="ProjectsSection__error">{error}</div>}

            {!error && loading && (
                <div className="spinner">
                    <div className="spinner__circle" />
                    Loading projects…
                </div>
            )}

            <div className="ProjectsGrid">
                {sorted.map((p) => (
                    <ProjectCard key={p.htmlUrl} project={p} />
                ))}
            </div>
        </section>
    );
}
