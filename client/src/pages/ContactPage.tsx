export default function ContactPage() {
    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 18px" }}>
            <h1 style={{ margin: 0, fontSize: 34 }}>Contact</h1>
            <p style={{ marginTop: 14, opacity: 0.85 }}>
                For now, just put your email + links. We’ll add a backend contact form later.
            </p>

            <div style={{ marginTop: 18 }}>
                <p style={{ margin: 0 }}>
                    Email: <a href="mailto:you@example.com">you@example.com</a>
                </p>
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                    GitHub: <a href="https://github.com/">github.com/</a>
                </p>
            </div>
        </div>
    );
}
