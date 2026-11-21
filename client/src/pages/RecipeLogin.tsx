import { useState, type FormEvent } from "react";
import { loginRecipes } from "../api/recipes";

export default function RecipeLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await loginRecipes(login, password);
            setPassword("");
            onLoggedIn();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login fejlede");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="RecipeLogin" onSubmit={submit}>
            <h2 className="RecipeLogin__title">Log ind</h2>
            <p className="RecipeLogin__hint">Opskrifterne er kun for husstanden.</p>
            <input
                className="RecipeLogin__input"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Brugernavn eller email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoFocus
                required
            />
            <input
                className="RecipeLogin__input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Kodeord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button className="RecipeLogin__button" type="submit" disabled={busy || login.trim().length === 0 || password.length === 0}>
                {busy ? "Logger ind…" : "Log ind"}
            </button>
            {error && <div className="RecipeLogin__error">{error}</div>}
        </form>
    );
}
