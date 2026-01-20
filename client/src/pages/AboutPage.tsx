import "./AboutPage.css";

export default function Aboutpage() {
    return (
        <div className="Aboutpage">
            <div className="Aboutpage__overlay" />

            <div className="Aboutpage__container">
                {/* Header */}
                <header className="Aboutpage__header">
                    <h1 className="Aboutpage__title">
                        About <span className="Aboutpage__titleAccent">Me</span>
                    </h1>
                    <p className="Aboutpage__subtitle">
                        Software Engineer focused on robust backend systems, distributed architectures,
                        and production-ready integrations.
                    </p>
                </header>

                {/* Content */}
                <section className="Aboutpage__grid">
                    {/* Left column: narrative */}
                    <div className="Aboutpage__left">
                        <p className="Aboutpage__para">
                            Hi, I&apos;m Oskar. I build system-oriented software with a focus on reliability,
                            maintainability, and clear architecture. I enjoy working in complex codebases
                            where analysis, troubleshooting, and system understanding matter.
                        </p>

                        <p className="Aboutpage__para">
                            I have hands-on experience with backend development in C#/.NET, real-time
                            messaging, and designing services that connect multiple components cleanly.
                            Through both industry work and my master&apos;s thesis, I&apos;ve worked with
                            distributed systems, automation, and system interfaces in collaborative teams.
                        </p>

                        <p className="Aboutpage__para">
                            Recently, I&apos;ve been building a custom MQTT broker (Akka.NET actor model) with
                            push-based topic subscriptions and metadata management in Neo4j. I like building
                            end-to-end solutions where backend logic, data models, and the UI fit together.
                        </p>

                        <div className="Aboutpage__highlights">
                            <div className="Aboutpage__highlight">
                                <div className="Aboutpage__highlightTitle">What I optimize for</div>
                                <ul className="Aboutpage__list">
                                    <li>Predictable behavior and clear failure modes</li>
                                    <li>Simple interfaces between components</li>
                                    <li>Performance that scales with real usage</li>
                                </ul>
                            </div>

                            <div className="Aboutpage__highlight">
                                <div className="Aboutpage__highlightTitle">Currently interested in</div>
                                <ul className="Aboutpage__list">
                                    <li>Distributed systems & event-driven architectures</li>
                                    <li>Real-time data pipelines and message routing</li>
                                    <li>System integration and backend reliability</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right column: cards */}
                    <div className="Aboutpage__right">
                        <InfoCard
                            title="Core Stack"
                            subtitle="C#/.NET • PostgreSQL • Neo4j • GitHub Actions"
                            meta="Backend • Data • CI/CD"
                            icon="🧩"
                        />

                        <InfoCard
                            title="Recent Project"
                            subtitle="Custom MQTT Broker (Akka.NET)"
                            meta="TCP listener • pub/sub • push updates"
                            icon="📡"
                        />

                        <InfoCard
                            title="Strengths"
                            subtitle="Systems thinking, debugging, and architecture"
                            meta="Complex codebases • integration-heavy work"
                            icon="🛠️"
                        />

                        <div className="Aboutpage__ctaCard">
                            <div className="Aboutpage__ctaTitle">Want to work together?</div>
                            <div className="Aboutpage__ctaText">
                                If you have a role or project where backend reliability and system design matter,
                                I&apos;m open to a chat.
                            </div>
                            <a className="Aboutpage__ctaButton" href="/contact">
                                Go to Contact
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function InfoCard({
                      title,
                      subtitle,
                      meta,
                      icon,
                  }: {
    title: string;
    subtitle: string;
    meta: string;
    icon: string;
}) {
    return (
        <div className="Aboutpage__card">
            <div className="Aboutpage__cardIcon" aria-hidden>
                {icon}
            </div>

            <div>
                <div className="Aboutpage__cardTitle">{title}</div>
                <div className="Aboutpage__cardSubtitle">{subtitle}</div>
                <div className="Aboutpage__cardMeta">{meta}</div>
            </div>
        </div>
    );
}
