export default function HomePage() {
    const leftSkills = [
        ".NET / C# (backend systems)",
        "SQL & relational databases",
        "REST APIs & integrations",
        "Real-time web interfaces (Razor Pages / Web UI)",
    ];

    const rightSkills = [
        "Linux",
        "Docker & Kubernetes",
        "CI/CD (Azure DevOps)",
        "Git + scripting (Shell / automation)",
    ];

    const featured = [
        {
            title: "MQTT Broker (from scratch)",
            description:
                "Built a complete broker in C# with routing, real-time streaming via WebSockets, and Neo4j integration for metadata-driven subscriptions.",
            tags: ["C#", ".NET", "Akka.NET", "WebSockets", "Neo4j"],
        },
        {
            title: "Query-based IoT subscriptions",
            description:
                "Designed a push-based subscription model where new data sources match active subscriptions without polling.",
            tags: ["Pub/Sub", "Graph metadata", "Push model"],
        },
        {
            title: "Containerized booking system",
            description:
                "Modernized an internal system with Docker-based environments, health checks, and improved maintainability using Clean Architecture.",
            tags: ["Docker", "Clean Architecture", "Health checks"],
        },
    ];

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 18px" }}>
            {/* HERO */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 300px 1fr",
                    gap: 28,
                    alignItems: "center",
                }}
            >
                {/* Left */}
                <div>
                    <h1 style={{ fontSize: 44, margin: 0, lineHeight: 1.05 }}>
                        Full<span style={{ opacity: 0.6 }}>stack</span>
                    </h1>
                    <p style={{ marginTop: 14, fontSize: 16, opacity: 0.82, maxWidth: 420 }}>
                        I build robust backend systems and connect them to clean, usable web
                        interfaces.
                    </p>
                    <ul style={{ marginTop: 14, opacity: 0.9, lineHeight: 1.8, paddingLeft: 18 }}>
                        {leftSkills.map((s) => (
                            <li key={s}>{s}</li>
                        ))}
                    </ul>
                </div>

                {/* Center */}
                <div
                    style={{
                        width: 300,
                        height: 300,
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.12)",
                        display: "grid",
                        placeItems: "center",
                        background:
                            "radial-gradient(circle at 30% 20%, rgba(0,0,0,0.06), rgba(0,0,0,0.01) 60%)",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 6 }}>OSKAR PRÆSTHOLM</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>Software Engineer</div>
                        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Your photo here</div>
                    </div>
                </div>

                {/* Right */}
                <div>
                    <h1 style={{ fontSize: 44, margin: 0, lineHeight: 1.05, textAlign: "right" }}>
                        Dev<span style={{ opacity: 0.6 }}>Ops</span>
                    </h1>
                    <p
                        style={{
                            marginTop: 14,
                            fontSize: 16,
                            opacity: 0.82,
                            maxWidth: 420,
                            marginLeft: "auto",
                            textAlign: "right",
                        }}
                    >
                        I like systems that run well in production: automation, containerization,
                        and observability.
                    </p>
                    <ul
                        style={{
                            marginTop: 14,
                            opacity: 0.9,
                            lineHeight: 1.8,
                            listStylePosition: "inside",
                            textAlign: "right",
                            paddingLeft: 0,
                        }}
                    >
                        {rightSkills.map((s) => (
                            <li key={s}>{s}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* FEATURED */}
            <section style={{ marginTop: 72 }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Featured work</h2>
                <p style={{ opacity: 0.82, maxWidth: 720, marginTop: 10 }}>
                    A few projects that reflect what I enjoy building: scalable backend systems,
                    real-time data, and clean architecture.
                </p>

                <div
                    style={{
                        marginTop: 18,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 14,
                    }}
                >
                    {featured.map((p) => (
                        <article
                            key={p.title}
                            style={{
                                border: "1px solid rgba(0,0,0,0.10)",
                                borderRadius: 14,
                                padding: 16,
                                background: "white",
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: 16 }}>{p.title}</h3>
                            <p style={{ marginTop: 10, opacity: 0.82, lineHeight: 1.55 }}>
                                {p.description}
                            </p>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                {p.tags.map((t) => (
                                    <span
                                        key={t}
                                        style={{
                                            fontSize: 12,
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            border: "1px solid rgba(0,0,0,0.10)",
                                            background: "rgba(0,0,0,0.03)",
                                            opacity: 0.9,
                                        }}
                                    >
                    {t}
                  </span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
