import ProjectsSection from "../components/ProjectsSection";

export default function ProjectsPage() {
    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 18px" }}>
            <h1 style={{ margin: 0, fontSize: 34 }}>Projects</h1>
            <p>Here is all my projects that I have public on github. There are a few interesting projects that will sadly not be avaliable as they will have to remain private.</p>
            <ProjectsSection/>
            
         
        </div>
    );
}
