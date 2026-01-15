import * as React from "react";
import TechnologiesSection from "./TechnologiesSection";
import FeaturedProjectsSection from "../components/FeaturedProjectsSection";

const ROTATING_LINES = [
    "Building backend systems that scale.",
    "Real-time pub/sub and event-driven architectures.",
    "Clean APIs, solid databases, smooth deployments.",
    "C# • .NET • PostgreSQL • Docker • Kubernetes",
];

export default function HomePage() {
    const [idx, setIdx] = React.useState(0);

    React.useEffect(() => {
        const t = window.setInterval(() => {
            setIdx((p) => (p + 1) % ROTATING_LINES.length);
        }, 2600);
        return () => window.clearInterval(t);
    }, []);

    return (
        <>
            <section className="homeHero">
                <div className="container heroInner">
                    <h2>Hello I'm</h2>

                    <h1 className="heroName heroNameShine">Oskar Præstholm</h1>

                    <div className="heroDegree">
                        <h2>Masters Software Engineering</h2>
                    </div>

                    <div className="heroRotator" aria-live="polite">
            <span key={idx} className="rotatingLine">
              {ROTATING_LINES[idx]}
            </span>
                    </div>

                    <div className="heroCtas">
                        <a className="heroBtn primary" href="/projects">
                            Projects
                        </a>
                        <a className="heroBtn" href="/about">
                            About
                        </a>
                        <a className="heroBtn" href="/contact">
                            Contact
                        </a>
                    </div>
                </div>

                {/* Bouncing arrow (no hash -> no page auto-jump) */}
                <button
                    type="button"
                    className="jumpArrow"
                    aria-label="Scroll down"
                    onClick={() =>
                        document.getElementById("below-hero")?.scrollIntoView({ behavior: "smooth" })
                    }
                >
          <span className="jumpArrowIcon" aria-hidden>
            ↓
          </span>
                </button>
            </section>



            <TechnologiesSection />
     
            
            
            <FeaturedProjectsSection />
        </>
    );
}
