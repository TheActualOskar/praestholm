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
                }}
            >
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

                <nav style={{ display: "flex", gap: 6 }}>
                    <NavItem to="/about" label="About" />
                    <NavItem to="/projects" label="Projects" />
                    <NavItem to="/contact" label="Contact" />
                </nav>
            </div>
        </header>
    );
}
