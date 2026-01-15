import { NavLink } from "react-router-dom";

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            style={({ isActive }) => ({
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.2,
                padding: "10px 12px",
                borderRadius: 10,
                color: "white",
                opacity: isActive ? 1 : 0.75,
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                transition: "background 120ms ease, opacity 120ms ease",
            })}
        >
            {label}
        </NavLink>
    );
}

function IconLink({
                      href,
                      label,
                      children,
                  }: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            aria-label={label}
            title={label}
            target="_blank"
            rel="noreferrer"
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,            
                height: 40,
                borderRadius: 12,
                color: "white",
                opacity: 0.85,
                transition: "opacity 120ms ease, background 120ms ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.background = "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.background = "transparent";
            }}
        >
            {children}
        </a>
    );
}

function LinkedInIcon() {
    return (
        <span
            style={{
                display: "block",
                fontSize: 28, // icon size
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -0.6,
                transform: "translateY(-1px)", 
            }}
        >
      in
    </span>
    );
}


function GitHubIcon() {
    return (
        <svg
            width="28"             // icon size
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={{ display: "block" }}  // avoids baseline weirdness
        >
            <path d="M12 .5C5.73.5.75 5.6.75 12c0 5.13 3.3 9.48 7.88 11.02.58.11.79-.26.79-.57v-2.1c-3.21.71-3.89-1.6-3.89-1.6-.53-1.36-1.28-1.72-1.28-1.72-1.04-.73.08-.72.08-.72 1.15.08 1.75 1.2 1.75 1.2 1.02 1.78 2.68 1.27 3.33.97.1-.76.4-1.27.72-1.56-2.56-.3-5.25-1.3-5.25-5.78 0-1.28.45-2.33 1.19-3.15-.12-.3-.52-1.53.11-3.18 0 0 .97-.32 3.18 1.2a10.7 10.7 0 0 1 2.9-.4c.98 0 1.97.14 2.9.4 2.2-1.52 3.18-1.2 3.18-1.2.63 1.65.23 2.88.11 3.18.74.82 1.19 1.87 1.19 3.15 0 4.49-2.69 5.48-5.26 5.77.41.36.78 1.08.78 2.18v3.24c0 .31.21.69.8.57C20.2 21.48 23.5 17.13 23.5 12 23.5 5.6 18.27.5 12 .5z" />
        </svg>
    );
}

export default function Header() {
    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                background: "linear-gradient(to bottom, #111 0%, #1b1b1b 55%, #111 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
        >
            <div
                className="container"
                style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                }}
            >
                {/* Brand */}
                <NavLink
                    to="/"
                    style={{
                        fontWeight: 800,
                        letterSpacing: 0.2,
                        color: "white",
                        fontSize: 16,
                    }}
                >
                    Praestholm
                </NavLink>

                {/* Right side: nav + icons */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <nav style={{ display: "flex", gap: 6 }}>
                        <NavItem to="/projects" label="Projects" />
                        <NavItem to="/about" label="About" />
                        <NavItem to="/contact" label="Contact" />
                    </nav>

                    <div
                        style={{
                            width: 1,
                            height: 22,
                            background: "rgba(255,255,255,0.15)",
                            marginLeft: 6,
                            marginRight: 2,
                        }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        
                        <IconLink href="https://www.linkedin.com/in/oskarpraestholm" label="LinkedIn">
                            <LinkedInIcon />
                        </IconLink>
                        <IconLink href="https://github.com/TheActualOskar" label="GitHub">
                            <GitHubIcon />
                        </IconLink>
                    </div>
                </div>
            </div>
        </header>
    );
}
