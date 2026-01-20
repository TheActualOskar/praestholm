import "./ContactPage.css";

export default function Contactpage() {
    return (
        <div className="Contactpage">
            <div className="Contactpage__overlay" />

            <div className="Contactpage__container">
                {/* Header */}
                <header className="Contactpage__header">
                    <h1 className="Contactpage__title">
                        Get In <span className="Contactpage__titleAccent">Touch</span>
                    </h1>
                    <p className="Contactpage__subtitle">
                        Have a project in mind or want to collaborate? Feel free to reach out! I&apos;m
                        always open to discussing new opportunities.
                    </p>
                </header>

                {/* Grid */}
                <section className="Contactpage__grid">
                    {/* Left */}
                    <div>
                        <h2 className="Contactpage__sectionTitle">Let&apos;s Connect</h2>
                        <p className="Contactpage__sectionText">
                            If you want to talk about a project, a role, or anything engineering-related,
                            the fastest way is email. I typically reply within 1–2 days.
                        </p>

                        <div className="Contactpage__stack">
                            <a className="Contactpage__cardLink" href="mailto:oskar.svendborg@gmail.com">
                                <div className="Contactpage__infoCard">
                                    <div className="Contactpage__iconBox" aria-hidden>
                                        ✉️
                                    </div>
                                    <div>
                                        <div className="Contactpage__infoTitle">Email</div>
                                        <div className="Contactpage__infoValue">oskar.svendborg@gmail.com</div>
                                    </div>
                                </div>
                            </a>

                            <a className="Contactpage__cardLink" href="tel:+4560137775">
                                <div className="Contactpage__infoCard">
                                    <div className="Contactpage__iconBox" aria-hidden>
                                        📞
                                    </div>
                                    <div>
                                        <div className="Contactpage__infoTitle">Phone</div>
                                        <div className="Contactpage__infoValue">+45 60137775</div>
                                    </div>
                                </div>
                            </a>

                            <div className="Contactpage__availabilityCard">
                                <div className="Contactpage__availabilityTop">
                                    <span className="Contactpage__dot" />
                                    <div className="Contactpage__availabilityTitle">
                                        Available for opportunities
                                    </div>
                                </div>
                                <div className="Contactpage__availabilityText">
                                    Open to software engineering roles • Denmark
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="Contactpage__formCard">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                const form = e.currentTarget;
                                const fd = new FormData(form);

                                const name = String(fd.get("name") ?? "");
                                const email = String(fd.get("email") ?? "");
                                const subject = String(fd.get("subject") ?? "Portfolio contact");
                                const message = String(fd.get("message") ?? "");

                                const body = encodeURIComponent(
                                    `Name: ${name}\nEmail: ${email}\n\n${message}`
                                );
                                const subj = encodeURIComponent(subject);

                                window.location.href = `mailto:oskar.svendborg@gmail.com?subject=${subj}&body=${body}`;
                            }}
                        >
                            <div className="Contactpage__field">
                                <div className="Contactpage__label">Name</div>
                                <input
                                    name="name"
                                    className="Contactpage__input"
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="Contactpage__field">
                                <div className="Contactpage__label">Email</div>
                                <input
                                    name="email"
                                    type="email"
                                    className="Contactpage__input"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="Contactpage__field">
                                <div className="Contactpage__label">Subject</div>
                                <input
                                    name="subject"
                                    className="Contactpage__input"
                                    placeholder="What's this about?"
                                />
                            </div>

                            <div className="Contactpage__field">
                                <div className="Contactpage__label">Message</div>
                                <textarea
                                    name="message"
                                    className="Contactpage__textarea"
                                    rows={6}
                                    placeholder="Tell me about your project or idea..."
                                />
                            </div>

                            <button className="Contactpage__button" type="submit">
                <span className="Contactpage__buttonIcon" aria-hidden>
                  ✈️
                </span>
                                Send Message
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
