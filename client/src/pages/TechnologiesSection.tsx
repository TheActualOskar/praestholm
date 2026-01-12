type TechItem = { name: string; iconSrc: string };

function TechCard({ name, iconSrc }: TechItem) {
    return (
        <div className="techItem">
            <div className="techIconBox" aria-hidden>
                <img className="techIconImg" src={iconSrc} alt="" loading="lazy" />
            </div>
            <div className="techLabel">{name}</div>
        </div>
    );
}

export default function TechnologiesSection() {
    const columns: { title: string; items: TechItem[] }[] = [
        {
            title: "Languages",
            items: [
                { name: "C#", iconSrc: "/tech/csharp.svg" },
                { name: "TypeScript", iconSrc: "/tech/typescript.png" },
                { name: "SQL", iconSrc: "/tech/sql.png" },
            ],
        },
        {
            title: "Frontend",
            items: [
                { name: "React", iconSrc: "/tech/react.png" },
                { name: "Vite", iconSrc: "/tech/vite.png" },
                { name: "CSS", iconSrc: "/tech/css.png" },
            ],
        },
        {
            title: "Backend",
            items: [
                { name: ".NET", iconSrc: "/tech/dotnet.png" },
                { name: "REST APIs", iconSrc: "/tech/rest.png" },
                { name: "WebSockets", iconSrc: "/tech/websocket.png" },
            ],
        },
        {
            title: "Database",
            items: [
                { name: "PostgreSQL", iconSrc: "/tech/postgresql.png" },
                { name: "Neo4j", iconSrc: "/tech/neo4j.png" },
            ],
        },
        {
            title: "DevOps",
            items: [
                { name: "Docker", iconSrc: "/tech/docker.png" },
                { name: "Kubernetes", iconSrc: "/tech/kubernetes.png" },
                { name: "CI/CD", iconSrc: "/tech/cicd.png" },
                { name: "Linux", iconSrc: "/tech/linux.png" },
            ],
        },
    ];

    return (
        <section className="section">
            <div className="container">
                <h2 className="techHeading">
                    <span style={{ color: "var(--accent2)" }}>Technologies</span> I Work With
                </h2>

                <p className="techSubheading">
                    Tools and frameworks I use to build robust systems and clean interfaces.
                </p>

                <div className="techColumns">
                    {columns.map((col) => (
                        <div key={col.title}>
                            <div className="techColumnTitle">{col.title}</div>

                            <div className="techCardsGrid">
                                {col.items.map((t) => (
                                    <TechCard key={t.name} {...t} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
