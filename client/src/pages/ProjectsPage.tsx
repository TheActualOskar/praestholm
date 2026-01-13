import ProjectsSection from "../components/ProjectsSection";

export default function ProjectsPage() {
    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 18px" }}>
            <h1 style={{ margin: 0, fontSize: 34 }}>Projects</h1>
            <ProjectsSection/>
            
            <p style={{ marginTop: 14, opacity: 0.85 }}>
                This will become a projects grid with cards and case-study pages.
            </p>
        </div>
    );
}
