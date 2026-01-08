import { NavLink } from "react-router-dom";

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            style={({ isActive }) => ({
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.2,
                padding: "10px 10px",
                borderRadius: 10,
                opacity: isActive ? 1 : 0.78,
                background: isActive ? "rgba(17,17,17,0.06)" : "transparent",
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
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(17,17,17,0.10)",
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
                <NavLink to="/" style={{ fontWeight: 800, letterSpacing: 0.2 }}>
                    praestholm
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
