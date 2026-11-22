import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { NotLoggedInError } from "../api/recipes";
import { addImport, deleteImport, fetchImports, hostOf, retryImport, type ImportStatus, type RecipeImport } from "../api/recipeImports";
import { formatDate } from "../api/madkurv";
import RecipeLogin from "./RecipeLogin";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";
import "./Madkurv.css";

const STATUS_LABEL: Record<ImportStatus, string> = {
    venter: "Venter",
    behandles: "Genereres",
    faerdig: "Kladde klar",
    fejlet: "Fejlet",
};

/** "Til generering": links waiting to be turned into draft recipes on the PC. */
export default function RecipeImportsPage() {
    const [items, setItems] = useState<RecipeImport[] | null>(null);
    const [needsLogin, setNeedsLogin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const run = useCallback(async (action: () => Promise<unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            setItems(await fetchImports());
        } catch (e) {
            if (e instanceof NotLoggedInError) setNeedsLogin(true);
            else setError(e instanceof Error ? e.message : "Noget gik galt");
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        void run(async () => {});
    }, [run]);

    const waiting = items?.filter((i) => i.status === "venter" || i.status === "behandles").length ?? 0;

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />
            <div className="Blogpage__container">
                <Link to="/opskrifter" className="BlogPost__back">
                    ← Opskrifter
                </Link>
                <header className="Blogpage__header">
                    <h1 className="Blogpage__title">Til generering</h1>
                    <p className="Blogpage__subtitle">
                        Links til opskrifter, som Claude laver om til kladder, når generatoren køres på PC’en. Kladderne skal gennemses og
                        udgives, før de vises som færdige opskrifter.
                    </p>
                </header>

                {needsLogin ? (
                    <RecipeLogin
                        onLoggedIn={() => {
                            setNeedsLogin(false);
                            void run(async () => {});
                        }}
                    />
                ) : (
                    <div className="Madkurv__content">
                        <section className="Editor__card">
                            <h2 className="Madkurv__heading">Tilføj link</h2>
                            <LinkForm busy={busy} onAdd={(url, comment) => run(() => addImport(url, comment))} />
                        </section>

                        {error && (
                            <div className="Editor__error" role="alert">
                                {error}
                            </div>
                        )}

                        <section className="Editor__card">
                            <div className="Madkurv__listHeader">
                                <h2 className="Madkurv__heading">Links</h2>
                                {waiting > 0 && <span className="Madkurv__muted">{waiting} venter på generatoren</span>}
                            </div>
                            {items === null ? (
                                !error && (
                                    <div className="spinner">
                                        <div className="spinner__circle" />
                                        Henter…
                                    </div>
                                )
                            ) : items.length === 0 ? (
                                <p className="Editor__hint">Ingen links endnu.</p>
                            ) : (
                                <ul className="Imports">
                                    {items.map((i) => (
                                        <li key={i.id} className="Imports__item">
                                            <div className="Imports__main">
                                                <div className="Imports__top">
                                                    <span className={`Imports__status is-${i.status}`}>{STATUS_LABEL[i.status]}</span>
                                                    <a href={i.url} target="_blank" rel="noreferrer noopener" className="Imports__url">
                                                        {hostOf(i.url)} ↗
                                                    </a>
                                                </div>
                                                {i.comment && <span className="Imports__comment">“{i.comment}”</span>}
                                                {i.error && <span className="Editor__error Imports__error">{i.error}</span>}
                                                <span className="Madkurv__muted">
                                                    {i.addedBy ? `${i.addedBy} · ` : ""}
                                                    {formatDate(i.createdAt)}
                                                    {i.attempts > 1 && ` · ${i.attempts} forsøg`}
                                                </span>
                                            </div>
                                            <div className="Madkurv__rowActions">
                                                {i.status === "faerdig" && i.recipeSlug && (
                                                    <Link to={`/opskrifter/${i.recipeSlug}`} className="RecipeLogin__button">
                                                        Gennemse kladde
                                                    </Link>
                                                )}
                                                {(i.status === "fejlet" || i.status === "behandles") && (
                                                    <button type="button" className="Recipes__logout" disabled={busy} onClick={() => run(() => retryImport(i.id))}>
                                                        Prøv igen
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="Editor__iconButton"
                                                    disabled={busy}
                                                    aria-label="Fjern link"
                                                    title="Fjern"
                                                    onClick={() => run(() => deleteImport(i.id))}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

/** URL + optional comment. Also used on /opskrifter/ny when "Fra et link" is chosen. */
export function LinkForm({ busy, onAdd }: { busy: boolean; onAdd: (url: string, comment: string | null) => Promise<unknown> | void }) {
    const [url, setUrl] = useState("");
    const [comment, setComment] = useState("");

    async function submit(e: FormEvent) {
        e.preventDefault();
        await onAdd(url.trim(), comment.trim() || null);
        setUrl("");
        setComment("");
    }

    return (
        <form className="Imports__form" onSubmit={submit}>
            <label className="Editor__field">
                <span className="Editor__label">Link til opskriften</span>
                <input
                    className="Editor__input"
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.valdemarsro.dk/…"
                    maxLength={500}
                    required
                />
            </label>
            <label className="Editor__field">
                <span className="Editor__label">Kommentar til Claude (valgfri)</span>
                <input
                    className="Editor__input"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="fx dobbelt portion, uden koriander, køkken: thai"
                    maxLength={500}
                />
                <span className="Editor__fieldHint">Ønsker til opskriften. Claude tilpasser kladden efter dem.</span>
            </label>
            <div>
                <button type="submit" className="RecipeLogin__button" disabled={busy || !url.trim()}>
                    Tilføj til generering
                </button>
            </div>
        </form>
    );
}
