import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { lookupInvite, signup, type InviteInfo } from "../api/invites";
import "./BlogPage.css";
import "./RecipesPage.css";

const MIN_PASSWORD = 6;

type State =
    | { kind: "loading" }
    | { kind: "invalid"; message: string }
    | { kind: "ready"; invite: InviteInfo };

export default function SignupPage() {
    // The invite token travels in the URL fragment (/tilmeld#<token>), which is never sent to the server.
    const token = useLocation().hash.replace(/^#/, "");
    const navigate = useNavigate();

    const [state, setState] = useState<State>({ kind: "loading" });
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [repeat, setRepeat] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setState({ kind: "invalid", message: "Linket mangler invitationskoden." });
            return;
        }
        lookupInvite(token)
            .then((invite) =>
                setState(
                    invite
                        ? { kind: "ready", invite }
                        : { kind: "invalid", message: "Invitationen er ugyldig, allerede brugt eller udløbet." },
                ),
            )
            .catch((e) => setState({ kind: "invalid", message: e instanceof Error ? e.message : "Fejl" }));
    }, [token]);

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (password !== repeat) {
            setError("Kodeordene er ikke ens.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await signup(token, username.trim(), password);
            navigate("/opskrifter", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Kunne ikke oprette brugeren");
        } finally {
            setBusy(false);
        }
    }

    const canSubmit = !busy && username.trim().length >= 2 && password.length >= MIN_PASSWORD && repeat.length > 0;

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />
            <div className="Blogpage__container">
                <header className="Blogpage__header">
                    <h1 className="Blogpage__title">Opret bruger</h1>
                    <p className="Blogpage__subtitle">Adgang til husstandens opskrifter.</p>
                </header>

                {state.kind === "loading" && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Tjekker invitation…
                    </div>
                )}

                {state.kind === "invalid" && (
                    <div className="RecipeLogin">
                        <div className="RecipeLogin__error">{state.message}</div>
                        <p className="RecipeLogin__hint">
                            Bed om en ny invitation, eller <Link to="/opskrifter">log ind</Link> hvis du allerede har
                            en bruger.
                        </p>
                    </div>
                )}

                {state.kind === "ready" && (
                    <form className="RecipeLogin" onSubmit={submit}>
                        <p className="RecipeLogin__hint">
                            Inviteret af <strong>{state.invite.invitedBy}</strong>.
                        </p>
                        <input
                            className="RecipeLogin__input"
                            type="email"
                            autoComplete="email"
                            value={state.invite.email}
                            readOnly
                            title="Emailen kommer fra invitationen"
                        />
                        <input
                            className="RecipeLogin__input"
                            type="text"
                            name="username"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="Brugernavn"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={50}
                            autoFocus
                            required
                        />
                        <input
                            className="RecipeLogin__input"
                            type="password"
                            name="new-password"
                            autoComplete="new-password"
                            placeholder={`Kodeord (mindst ${MIN_PASSWORD} tegn)`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={MIN_PASSWORD}
                            required
                        />
                        <input
                            className="RecipeLogin__input"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Gentag kodeord"
                            value={repeat}
                            onChange={(e) => setRepeat(e.target.value)}
                            required
                        />
                        <button className="RecipeLogin__button" type="submit" disabled={!canSubmit}>
                            {busy ? "Opretter…" : "Opret bruger"}
                        </button>
                        {error && <div className="RecipeLogin__error">{error}</div>}
                    </form>
                )}
            </div>
        </div>
    );
}
