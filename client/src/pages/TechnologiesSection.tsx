import "./TechnologiesSection.css";

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
                { name: "C#", iconSrc: "/tech/languages/csharp.svg" },
                { name: "Python", iconSrc: "/tech/languages/python.svg" },
                { name: "Java", iconSrc: "/tech/languages/Java.svg" },
                { name: "C", iconSrc: "/tech/languages/c.svg" },
                { name: "Bash", iconSrc: "/tech/languages/bash.svg" },
                { name: "PHP", iconSrc: "/tech/languages/PHP.svg" },
            ],
        },
        {
            title: "Frontend",
            items: [
                { name: "React", iconSrc: "/tech/frontend/react.svg" },
                { name: "Razor Pages", iconSrc: "/tech/frontend/dotnet.svg" },
                { name: "TypeScript", iconSrc: "/tech/languages/typescript.svg" },
                { name: "JavaScript", iconSrc: "/tech/languages/javascript.svg" },
                { name: "HTML", iconSrc: "/tech/frontend/html5.svg" },
                { name: "CSS", iconSrc: "/tech/frontend/css.svg" },
            ],
        },
        {
            title: "Backend",
            items: [
                { name: ".NET", iconSrc: "/tech/frontend/dotnet.svg" },
                { name: "REST API's", iconSrc: "/tech/backend/api.svg" },
                { name: "MQTT", iconSrc: "/tech/backend/mqtt.svg" },
                { name: "Node.js", iconSrc: "/tech/backend/nodejs.svg" },
                { name: "Akka.net", iconSrc: "/tech/backend/Akka.svg" },
            ],
        },
        {
            title: "Database",
            items: [
                { name: "PostgreSQL", iconSrc: "/tech/database/postgresql.svg" },
                { name: "MongoDB", iconSrc: "/tech/database/mongoDB.svg" },
                { name: "Microsoft SQL Server", iconSrc: "/tech/database/MicrosoftSQLServer.svg" },
                { name: "Neo4j", iconSrc: "/tech/database/neo4j.svg" },
                { name: "Redis", iconSrc: "/tech/database/redis.svg" },
            ],
        },
        {
            title: "DevOps",
            items: [
                { name: "Docker", iconSrc: "/tech/devops/docker.svg" },
                { name: "Kubernetes", iconSrc: "/tech/devops/kubernetes.svg" },
                { name: "Azure", iconSrc: "/tech/devops/azure.svg" },
                { name: "Linux", iconSrc: "/tech/devops/linux.svg" },
                { name: "Google Cloud", iconSrc: "/tech/devops/google.svg" },
                { name: "Git", iconSrc: "/tech/devops/git.svg" },
                { name: "Jenkins", iconSrc: "/tech/devops/jenkins.svg" },
                { name: "Elasticsearch", iconSrc: "/tech/devops/elasticsearch.svg" },
                { name: "Apache Kafka", iconSrc: "/tech/devops/Kafka.svg" },
            ],
        },
    ];

    
    
    return (
        <div className="Techpage">
            <div className="Techpage__overlay" />

            <div className="Techpage__container">
                {/* Header (matches About/Contact style) */}
                <header className="Techpage__header">
                    <h2 className="Techpage__title">
                        Technologies <span className="Techpage__titleAccent">I Work With</span>
                    </h2>
                    <p className="Techpage__subtitle">
                        Tools and frameworks I use to build robust systems and clean interfaces.
                    </p>
                </header>
                
                {/* Your existing content */}
                <section className="Techpage__content">
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
                </section>
                <div className="techFooterAction">
                    <button
                        type="button"
                        className="jumpArrow"
                        aria-label="Scroll to featured projects"
                        onClick={() =>
                            document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
                        }
                    >
          <span className="jumpArrowIcon" aria-hidden>
            ↓
          </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
