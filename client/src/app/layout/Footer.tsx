import { Link } from "react-router-dom";
import "./Footer.css";

function GitHubIcon() {
    return (
        <svg
            width="28"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={{ display: "block" }}
        >
            <path d="M12 .5C5.73.5.75 5.6.75 12c0 5.13 3.3 9.48 7.88 11.02.58.11.79-.26.79-.57v-2.1c-3.21.71-3.89-1.6-3.89-1.6-.53-1.36-1.28-1.72-1.28-1.72-1.04-.73.08-.72.08-.72 1.15.08 1.75 1.2 1.75 1.2 1.02 1.78 2.68 1.27 3.33.97.1-.76.4-1.27.72-1.56-2.56-.3-5.25-1.3-5.25-5.78 0-1.28.45-2.33 1.19-3.15-.12-.3-.52-1.53.11-3.18 0 0 .97-.32 3.18 1.2a10.7 10.7 0 0 1 2.9-.4c.98 0 1.97.14 2.9.4 2.2-1.52 3.18-1.2 3.18-1.2.63 1.65.23 2.88.11 3.18.74.82 1.19 1.87 1.19 3.15 0 4.49-2.69 5.48-5.26 5.77.41.36.78 1.08.78 2.18v3.24c0 .31.21.69.8.57C20.2 21.48 23.5 17.13 23.5 12 23.5 5.6 18.27.5 12 .5z" />
        </svg>
    );
}

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="Footer">
            <div className="Footer__container">
                <div className="Footer__grid">
                    {/* Brand / about */}
                    <div className="Footer__brand">
                        <div className="Footer__logo">Praestholm</div>
                        <p className="Footer__blurb">
                            Software Engineer focused on backend systems, distributed architecture, and reliable
                            integrations.
                        </p>
                    </div>

                    {/* Quick links */}
                    <nav className="Footer__col" aria-label="Quick links">
                        <div className="Footer__heading">Quick Links</div>
                        <a className="Footer__link" href="/projects">Projects</a>
                        <a className="Footer__link" href="/about">About</a>
                        <a className="Footer__link" href="/contact">Contact</a>
                    </nav>

                    {/* Connect */}
                    <div className="Footer__col">
                        <div className="Footer__heading">Connect</div>

                        <a className="Footer__linkRow" href="mailto:oskar.svendborg@gmail.com">
                            <span className="Footer__icon" aria-hidden>✉️</span>
                            <span>Email</span>
                        </a>

                        <a className="Footer__linkRow" href="tel:+4560137775">
                            <span className="Footer__icon" aria-hidden>📞</span>
                            <span>Phone</span>
                        </a>

                        <div className="Footer__social">
                            <a
                                className="Footer__socialBtn"
                                href="https://www.linkedin.com/in/oskarpraestholm"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                                title="LinkedIn"
                            >
                                in
                            </a>

                            <a
                                className="Footer__socialBtn"
                                href="https://github.com/TheActualOskar"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="GitHub"
                                title="GitHub"
                            >
                                <GitHubIcon />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="Footer__bottom">
                    <small className="Footer__copyright">
                        © {year} Praestholm. All rights reserved.
                    </small>

                    <small className="Footer__built">
                        Built with React + TypeScript + C#.
                    </small>
                </div>
            </div>
        </footer>
    );
}
