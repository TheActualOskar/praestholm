function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.78)",
            }}
        >
      {children}
    </span>
    );
}

function TechCard({ label }: { label: string }) {
    return (
        <div
            style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 14,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                backdropFilter: "blur(10px)",
            }}
        >
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{label}</div>
        </div>
    );
}

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

    const techColumns: { title: string; items: string[] }[] = [
        { title: "Languages", items: ["C#", "TypeScript", "SQL"] },
        { title: "Frontend", items: ["React", "Vite", "CSS"] },
        { title: "Backend", items: [".NET", "REST APIs", "WebSockets"] },
        { title: "Database", items: ["PostgreSQL", "Neo4j"] },
        { title: "DevOps", items: ["Docker", "CI/CD", "Linux"] },
    ];

    return (
        <>
            {/* HERO */}
            <section className="section">
                <div className="container">
                    <div
                        className="hero-grid-fix"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 320px 1fr",
                            gap: 28,
                            alignItems: "center",
                        }}
                    >
                        {/* Left */}
                        <div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: 1.2,
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.55)",
                                }}
                            >
                                Backend + Product
                            </div>

                            <h1
                                style={{
                                    fontSize: 44,
                                    margin: "10px 0 0",
                                    lineHeight: 1.02,
                                    letterSpacing: -0.6,
                                    color: "rgba(255,255,255,0.92)",
                                }}
                            >
                                Full<span style={{ opacity: 0.75 }}>stack</span>
                            </h1>

                            <p style={{ marginTop: 12, maxWidth: 420, color: "rgba(255,255,255,0.68)" }}>
                                I build robust backend systems and connect them to clean, usable web interfaces.
                            </p>

                            <ul
                                style={{
                                    marginTop: 14,
                                    paddingLeft: 18,
                                    color: "rgba(255,255,255,0.72)",
                                    lineHeight: 1.9,
                                    fontSize: 14,
                                }}
                            >
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
                                border: "1px solid rgba(255,255,255,0.12)",
                                display: "grid",
                                placeItems: "center",
                                background:
                                    "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 60%)",
                                boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 0.8,
                                        color: "rgba(255,255,255,0.75)",
                                        opacity: 0.85,
                                    }}
                                >
                                    OSKAR PRÆSTHOLM
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, color: "rgba(255,255,255,0.92)" }}>
                                    Software Engineer
                                </div>
                                <div style={{ fontSize: 13, marginTop: 10, color: "rgba(255,255,255,0.65)" }}>
                                    (add your photo later)
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="hero-right-fix" style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: 1.2,
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.55)",
                                }}
                            >
                                Infra + Delivery
                            </div>

                            <h1
                                style={{
                                    fontSize: 44,
                                    margin: "10px 0 0",
                                    lineHeight: 1.02,
                                    letterSpacing: -0.6,
                                    color: "rgba(255,255,255,0.92)",
                                }}
                            >
                                Dev<span style={{ opacity: 0.75 }}>Ops</span>
                            </h1>

                            <p
                                style={{
                                    marginTop: 12,
                                    marginLeft: "auto",
                                    maxWidth: 420,
                                    color: "rgba(255,255,255,0.68)",
                                }}
                            >
                                I like systems that run well in production: automation, containers, and observability.
                            </p>

                            <ul
                                style={{
                                    marginTop: 14,
                                    listStylePosition: "inside",
                                    color: "rgba(255,255,255,0.72)",
                                    lineHeight: 1.9,
                                    paddingLeft: 0,
                                    fontSize: 14,
                                }}
                            >
                                {rightSkills.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Responsive fallback */}
                    <style>
                        {`
              @media (max-width: 980px) {
                .hero-grid-fix {
                  grid-template-columns: 1fr !important;
                  text-align: center !important;
                  justify-items: center !important;
                }
                .hero-right-fix {
                  text-align: center !important;
                }
              }
            `}
                    </style>
                </div>
            </section>

            {/* FEATURED */}
            <section style={{ padding: "0 0 80px" }}>
                <div className="container">
                    <h2 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2, color: "rgba(255,255,255,0.92)" }}>
                        Featured work
                    </h2>

                    <p style={{ marginTop: 10, maxWidth: 740, color: "rgba(255,255,255,0.68)" }}>
                        A few projects that reflect what I enjoy building: scalable backend systems, real-time data, and clean architecture.
                    </p>

                    <div
                        className="featured-grid-fix"
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
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 18,
                                    padding: 18,
                                    background: "rgba(255,255,255,0.06)",
                                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                <h3 style={{ margin: 0, fontSize: 16, letterSpacing: 0.2, color: "rgba(255,255,255,0.92)" }}>
                                    {p.title}
                                </h3>

                                <p style={{ marginTop: 10, color: "rgba(255,255,255,0.68)" }}>{p.description}</p>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                    {p.tags.map((t) => (
                                        <Pill key={t}>{t}</Pill>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>

                    <style>
                        {`
              @media (max-width: 980px) {
                .featured-grid-fix {
                  grid-template-columns: 1fr !important;
                }
              }
            `}
                    </style>
                </div>
            </section>

            {/* TECHNOLOGIES */}
            <section className="section">
                <div className="container">
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 40,
                            textAlign: "center",
                            letterSpacing: 0.2,
                            color: "rgba(255,255,255,0.92)",
                        }}
                    >
                        <span style={{ color: "var(--accent2)" }}>Technologies</span> I Work With
                    </h2>

                    <p style={{ textAlign: "center", marginTop: 12, color: "rgba(255,255,255,0.68)" }}>
                        Tools and frameworks I use to build robust systems and clean interfaces.
                    </p>

                    <div
                        className="tech-grid-fix"
                        style={{
                            marginTop: 34,
                            display: "grid",
                            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                            gap: 22,
                        }}
                    >
                        {techColumns.map((col) => (
                            <div key={col.title}>
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        marginBottom: 14,
                                        color: "rgba(255,255,255,0.88)",
                                    }}
                                >
                                    {col.title}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                        gap: 14,
                                    }}
                                >
                                    {col.items.map((item) => (
                                        <TechCard key={item} label={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <style>
                        {`
              @media (max-width: 1100px) {
                .tech-grid-fix {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 650px) {
                .tech-grid-fix {
                  grid-template-columns: 1fr !important;
                }
              }
            `}
                    </style>
                </div>
            </section>
        </>
    );
}
