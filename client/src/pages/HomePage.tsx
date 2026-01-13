import * as React from "react";
import TechnologiesSection from "./TechnologiesSection";
import FeaturedProjectsSection from "../components/FeaturedProjectsSection";


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

    return (
        <>
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

                            <p
                                style={{
                                    marginTop: 12,
                                    maxWidth: 420,
                                    color: "rgba(255,255,255,0.68)",
                                }}
                            >
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
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        marginTop: 6,
                                        color: "rgba(255,255,255,0.92)",
                                    }}
                                >
                                    Software Engineer
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        marginTop: 10,
                                        color: "rgba(255,255,255,0.65)",
                                    }}
                                >
                                    (add your photo later)
                                </div>
                            </div>
                        </div>

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

            <FeaturedProjectsSection/>

            <TechnologiesSection />
        </>
    );
}
