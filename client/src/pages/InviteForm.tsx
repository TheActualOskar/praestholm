import { useState, type FormEvent } from "react";
import { createInvite, type InviteResult } from "../api/invites";

export default function InviteForm({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<InviteResult | null>(null);
    const [copied, setCopied] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setResult(null);
        setCopied(false);
        try {
            setResult(await createInvite(email.trim()));
            setEmail("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Kunne ikke oprette invitationen");
        } finally {
            setBusy(false);
        }
    }

    async function copy(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch {
            // Clipboard blocked: the link is still selectable in the field.
        }
    }

    return (
        <form className="RecipeLogin" onSubmit={submit}>
            <h2 className="RecipeLogin__title">Inviter en bruger</h2>
            <p className="RecipeLogin__hint">De får et link, hvor de selv vælger brugernavn og kodeord.</p>
            <input
                className="RecipeLogin__input"
                type="email"
                autoComplete="off"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
            />
            <div className="Invite__actions">
                <button className="RecipeLogin__button" type="submit" disabled={busy || email.trim().length === 0}>
                    {busy ? "Opretter…" : "Send invitation"}
                </button>
                <button className="Recipes__logout" type="button" onClick={onClose}>
                    Luk
                </button>
            </div>

            {error && <div className="RecipeLogin__error">{error}</div>}

            {result && (
                <div className="Invite__result">
                    <p className="RecipeLogin__hint">
                        {result.emailed
                            ? `Invitation sendt til ${result.email}. Du kan også dele linket selv:`
                            : `Kunne ikke sende email. Del linket med ${result.email} selv:`}
                    </p>
                    <input
                        className="RecipeLogin__input"
                        readOnly
                        value={result.inviteUrl}
                        onFocus={(e) => e.currentTarget.select()}
                    />
                    <button className="Recipes__logout" type="button" onClick={() => copy(result.inviteUrl)}>
                        {copied ? "Kopieret ✓" : "Kopier link"}
                    </button>
                </div>
            )}
        </form>
    );
}
