export default function HomePage() {
    const leftSkills = [
        ".NET / C# (backend systems)",
        "SQL & relational databases",
        "REST APIs & integrations",
        "Real-time web interfaces",
    ];

    const rightSkills = [
        "Linux",
        "Docker & Kubernetes",
        "CI/CD (Azure DevOps)",
        "Git + scripting / automation",
    ];

    const featured = [
        {
            title: "MQTT Broker (from scratch)",
            description:
                "Custom C# broker with routing, real-time streaming, and metadata-driven subscriptions.",
            tags: ["C#", ".NET", "Akka.NET", "WebSockets", "Neo4j"],
        },
        {
            title: "Push-based topic subscriptions",
            description:
                "Designed subscriptions that update when new streams match metadata—without polling.",
            tags: ["Pub/Sub", "Push model", "Graph metadata"],
        },
        {
            title: "Clean architecture systems",
            description:
                "Structured apps for maintainability and testing with clear separation of concerns.",
            tags: ["Architecture", "Separation", "Maintainability"],
        },
    ];

    return (
        <>
            {/* HERO */}
            <section className="section">
                <div className="container">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 320px 1fr",
                            gap: 28,
                            alignItems: "center",
                        }}
                    >
                        {/* Left */}
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.6, letterSpacing: 0.6 }}>
                                BACKEND + PRODUCT
                            </div>
                            <h1 style={{ fontSize: 56, margin: "10px 0 0", lineHeight: 0.98 }}>
                                Full<span style={{ opacity: 0.55 }}>stack</span>
                            </h1>
                            <p style={{ marginTop: 14, maxWidth: 420 }}>
                                I build robust backend systems and connect them to clean, usable web interfaces.
                            </p>
                            <ul style={{ marginTop: 16, paddingLeft: 18, color: "rgba(17,17,17,0.75)", lineHeight: 1.9 }}>
                                {leftSkills.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Center portrait */}
                        <div
                            style={{
                                width: 320,
                                height: 320,
                                borderRadius: 999,
                                border: "1px solid rgba(17,17,17,0.12)",
                                display: "grid",
                                placeItems: "center",
                                background:
                                    "radial-gradient(circle at 30% 20%, rgba(17,17,17,0.10), rgba(17,17,17,0.02) 60%)",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, letterSpacing: 0.8 }}>
                                    OSKAR PRÆSTHOLM
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>
                                    Software Engineer
                                </div>
                                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 10 }}>
                                    (add your photo later)
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.6, letterSpacing: 0.6 }}>
                                INFRA + DELIVERY
                            </div>
                            <h1 style={{ fontSize: 56, margin: "10px 0 0", lineHeight: 0.98 }}>
                                Dev<span style={{ opacity: 0.55 }}>Ops</span>
                            </h1>
                            <p style={{ marginTop: 14, marginLeft: "auto", maxWidth: 420 }}>
                                I like systems that run well in production: automation, containerization, and observability.
                            </p>
                            <ul
                                style={{
                                    marginTop: 16,
                                    listStylePosition: "inside",
                                    color: "rgba(17,17,17,0.75)",
                                    lineHeight: 1.9,
                                    paddingLeft: 0,
                                }}
                            >
                                {rightSkills.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            <section style={{ padding: "0 0 80px" }}>
                <div className="container">
                    <h2 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>Featured work</h2>
                    <p style={{ marginTop: 10, maxWidth: 740 }}>
                        A few projects that reflect what I enjoy building: scalable backend systems, real-time data, and clean architecture.
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
                                    border: "1px solid rgba(17,17,17,0.10)",
                                    borderRadius: 18,
                                    padding: 18,
                                    background: "white",
                                    boxShadow: "0 8px 24px rgba(17,17,17,0.06)",
                                }}
                            >
                                <h3 style={{ margin: 0, fontSize: 16, letterSpacing: 0.2 }}>{p.title}</h3>
                                <p style={{ marginTop: 10 }}>{p.description}</p>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                    {p.tags.map((t) => (
                                        <span
                                            key={t}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                                borderRadius: 999,
                                                border: "1px solid rgba(17,17,17,0.10)",
                                                background: "rgba(17,17,17,0.03)",
                                                color: "rgba(17,17,17,0.75)",
                                            }}
                                        >
                      {t}
                    </span>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
