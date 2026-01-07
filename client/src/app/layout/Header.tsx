import { NavLink } from "react-router-dom";

const linkStyle: React.CSSProperties = {
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 500,
};

export default function Header() {
    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                backdropFilter: "blur(10px)",
                background: "rgba(255,255,255,0.75)",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <NavLink to="/" style={{ ...linkStyle, fontSize: 18 }}>
                    praestholm
                </NavLink>

                <nav style={{ display: "flex", gap: 10 }}>
                    <NavLink
                        to="/about"
                        style={({ isActive }) => ({
                            ...linkStyle,
                            background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
                            color: "inherit",
                        })}
                    >
                        About
                    </NavLink>
                    <NavLink
                        to="/projects"
                        style={({ isActive }) => ({
                            ...linkStyle,
                            background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
                            color: "inherit",
                        })}
                    >
                        Projects
                    </NavLink>
                    <NavLink
                        to="/contact"
                        style={({ isActive }) => ({
                            ...linkStyle,
                            background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
                            color: "inherit",
                        })}
                    >
                        Contact
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}
