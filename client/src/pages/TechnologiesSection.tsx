type TechItem = { name: string; emoji: string };

function TechCard({ name, emoji }: TechItem) {
    return (
        <div
            style={{
                border: "1px solid var(--border)",
                background: "var(--card)",
                borderRadius: 16,
                padding: 14,
                display: "grid",
                placeItems: "center",
                gap: 10,
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                backdropFilter: "blur(10px)",
            }}
        >
            <div style={{ fontSize: 28 }}>{emoji}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{name}</div>
        </div>
    );
}

export default function TechnologiesSection() {
    const columns: { title: string; items: TechItem[] }[] = [
        {
            title: "Languages",
            items: [
                { name: "C#", emoji: "⚡" },
                { name: "TypeScript", emoji: "🔷" },
                { name: "SQL", emoji: "🧠" },
            ],
        },
        {
            title: "Frontend",
            items: [
                { name: "React", emoji: "⚛️" },
                { name: "Vite", emoji: "⚡" },
                { name: "CSS", emoji: "🎨" },
            ],
        },
        {
            title: "Backend",
            items: [
                { name: ".NET", emoji: "🧩" },
                { name: "REST APIs", emoji: "🔌" },
                { name: "WebSockets", emoji: "📡" },
            ],
        },
        {
            title: "Database",
            items: [
                { name: "PostgreSQL", emoji: "🐘" },
                { name: "Neo4j", emoji: "🕸️" },
            ],
        },
        {
            title: "DevOps",
            items: [
                { name: "Docker", emoji: "🐳" },
                { name: "CI/CD", emoji: "🔁" },
                { name: "Linux", emoji: "🐧" },
            ],
        },
    ];

    return (
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
                    Technologies I Work With
                </h2>

                <p style={{ textAlign: "center", marginTop: 12 }}>
                    Tools and frameworks I use to build robust systems and clean interfaces.
                </p>

                <div
                    style={{
                        marginTop: 34,
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: 22,
                    }}
                >
                    {columns.map((col) => (
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

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                                {col.items.map((t) => (
                                    <TechCard key={t.name} {...t} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile responsiveness */}
                <div className="tech-grid-mobile-spacer" />
            </div>
        </section>
    );
}
