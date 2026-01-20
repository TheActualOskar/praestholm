import "./ProjectsPage.css";
import ProjectsSection from "../components/ProjectsSection";

export default function ProjectsPage() {
    return (
        <div className="Projectspage">
            <div className="Projectspage__overlay" />

            <div className="Projectspage__container">
                <header className="Projectspage__header">
                    <h1 className="Projectspage__title">Projects</h1>
                    <p className="Projectspage__subtitle">
                        Selected work from GitHub. Some projects (coursework, client work, or exam-related)
                        are private, but I’m happy to discuss them on request.
                    </p>
                </header>

                <ProjectsSection />
            </div>
        </div>
    );
}
