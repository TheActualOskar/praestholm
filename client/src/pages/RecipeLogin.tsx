import { useState, type FormEvent } from "react";
import { loginRecipes } from "../api/recipes";

export default function RecipeLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await loginRecipes(password);
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
                type="password"
                autoComplete="current-password"
                placeholder="Kodeord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
            />
            <button className="RecipeLogin__button" type="submit" disabled={busy || password.length === 0}>
                {busy ? "Logger ind…" : "Log ind"}
            </button>
            {error && <div className="RecipeLogin__error">{error}</div>}
        </form>
    );
}
