export default function Footer() {
    return (
        <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px" }}>
                <small style={{ opacity: 0.75 }}>
                    © {new Date().getFullYear()} Praestholm. Built with React + TypeScript.
                </small>
            </div>
        </footer>
    );
}
