import TechnologiesSection from "./TechnologiesSection";
import FeaturedProjectsSection from "../components/FeaturedProjectsSection";

export default function HomePage() {
    return (
        <>
            <section className="homeHero">
                <div className="container heroInner">
                    <h2>Hello I'm</h2>

                    <h1 className="heroName heroNameShine">Oskar Præstholm</h1>

                    <div className="heroDegree">
                        <h2>Masters Software Engineering</h2>
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

                <button
                    type="button"
                    className="jumpArrow"
                    aria-label="Scroll down"
                    onClick={() =>
                        document.getElementById("technologies")?.scrollIntoView({ behavior: "smooth" })
                    }
                >
                    <span className="jumpArrowIcon" aria-hidden>↓</span>
                </button>
            </section>


            <div id="technologies" />
            <TechnologiesSection />

            <div id="projects" />
            <FeaturedProjectsSection />
        </>
    );
}
