import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { formatAmount, NotLoggedInError } from "../api/recipes";
import { parseIngredientLine } from "../api/recipeText";
import {
    addListItem,
    addSpiceSuggestions,
    DAYS,
    deleteListItem,
    fetchBasket,
    fetchBasketById,
    fetchHistory,
    fetchList,
    formatDate,
    isoWeek,
    lockBasket,
    markOrdered,
    removeBasketExtra,
    removeBasketRecipe,
    reopenBasket,
    repeatBasket,
    setHave,
    updateBasketRecipe,
    updateListItem,
    type Basket,
    type BasketRecipe,
    type BasketSummary,
    type HouseholdItem,
    type ListKind,
    type ShoppingItem,
} from "../api/madkurv";
import RecipeLogin from "./RecipeLogin";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";
import "./Madkurv.css";

const TABS: { path: string; label: string }[] = [
    { path: "", label: "Madkurv" },
    { path: "faste-varer", label: "Faste varer" },
    { path: "oensker", label: "Ønsker" },
    { path: "beholdning", label: "Beholdning" },
    { path: "krydderiskab", label: "Krydderiskab" },
    { path: "historik", label: "Historik" },
];

const LIST_INFO: Record<ListKind, { title: string; hint: string; placeholder: string }> = {
    "faste-varer": {
        title: "Faste varer",
        hint: "Kommer med i hver madkurv. Sæt en vare på pause, hvis I har nok i en periode.",
        placeholder: "fx 2 l sødmælk",
    },
    oensker: {
        title: "Ønsker",
        hint: "Alt, hvad nogen i husstanden ønsker til næste bestilling. Listen ryddes, når madkurven bliver bestilt.",
        placeholder: "fx chokolade",
    },
    beholdning: {
        title: "Beholdning",
        hint: "Det, I har derhjemme. Trækkes fra indkøbslisten. Uden mængde betyder “vi har nok”, fx salt eller olivenolie.",
        placeholder: "fx 500 g ris",
    },
    krydderiskab: {
        title: "Krydderiskab",
        hint: "Sæt flueben ved det, I altid har. Det bliver aldrig købt, heller ikke når en opskrift bruger det. Fjern fluebenet, når noget er løbet tør, så kommer det med, næste gang en opskrift skal bruge det.",
        placeholder: "fx kardemomme",
    },
};

const formatQuantity = (amount: number | null, unit: string | null) =>
    [amount != null ? formatAmount(amount) : null, unit].filter(Boolean).join(" ");

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Noget gik galt");

export default function MadkurvPage() {
    const { tab = "" } = useParams<{ tab: string }>();
    const [needsLogin, setNeedsLogin] = useState(false);
    const [session, setSession] = useState(0);

    const onAuthError = useCallback((e: unknown) => {
        if (e instanceof NotLoggedInError) {
            setNeedsLogin(true);
            return true;
        }
        return false;
    }, []);

    return (
        <div className="Blogpage">
            <div className="Blogpage__overlay" />
            <div className="Blogpage__container Madkurv">
                <Link to="/opskrifter" className="BlogPost__back">
                    ← Opskrifter
                </Link>
                <header className="Blogpage__header">
                    <h1 className="Blogpage__title">Madkurv</h1>
                    <p className="Blogpage__subtitle">Ugens retter, husstandens lister og indkøbslisten til nemlig.</p>
                </header>

                <nav className="Madkurv__tabs" aria-label="Madkurv">
                    {TABS.map((t) => (
                        <NavLink key={t.path} to={t.path ? `/madkurv/${t.path}` : "/madkurv"} end className={({ isActive }) => `Recipes__tag ${isActive ? "is-active" : ""}`}>
                            {t.label}
                        </NavLink>
                    ))}
                </nav>

                {needsLogin ? (
                    <RecipeLogin
                        onLoggedIn={() => {
                            setNeedsLogin(false);
                            setSession((s) => s + 1);
                        }}
                    />
                ) : tab === "" ? (
                    <BasketTab key={session} onAuthError={onAuthError} />
                ) : tab === "historik" ? (
                    <HistoryTab key={session} onAuthError={onAuthError} />
                ) : tab === "krydderiskab" ? (
                    <SpiceTab key={session} onAuthError={onAuthError} />
                ) : tab in LIST_INFO ? (
                    <ListTab key={`${tab}-${session}`} kind={tab as ListKind} onAuthError={onAuthError} />
                ) : (
                    <p className="Blogpage__subtitle">Siden findes ikke.</p>
                )}
            </div>
        </div>
    );
}

type TabProps = { onAuthError: (e: unknown) => boolean };

// ---------- Basket ----------

function BasketTab({ onAuthError }: TabProps) {
    const [basket, setBasket] = useState<Basket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);

    const run = useCallback(
        async (action: () => Promise<Basket>) => {
            setBusy(true);
            setError(null);
            try {
                setBasket(await action());
            } catch (e) {
                if (!onAuthError(e)) setError(errorText(e));
            } finally {
                setBusy(false);
            }
        },
        [onAuthError],
    );

    useEffect(() => {
        void run(fetchBasket);
    }, [run]);

    if (!basket)
        return error ? (
            <div className="Blogpage__error">{error}</div>
        ) : (
            <div className="spinner">
                <div className="spinner__circle" />
                Henter madkurven…
            </div>
        );

    const locked = basket.status !== "kladde";

    async function order(deliveryDate: string | null) {
        await run(async () => {
            await markOrdered(deliveryDate);
            setFlash("Bestilt! Ønskerne er ryddet, og en ny madkurv er klar.");
            return fetchBasket();
        });
    }

    return (
        <div className="Madkurv__content">
            {flash && (
                <div className="Madkurv__flash" role="status">
                    {flash}
                </div>
            )}

            <StatusCard basket={basket} busy={busy} onLock={() => run(lockBasket)} onReopen={() => run(reopenBasket)} onOrdered={order} />

            {error && (
                <div className="Editor__error" role="alert">
                    {error}
                </div>
            )}

            <section className="Editor__card">
                <h2 className="Madkurv__heading">Retter</h2>
                {basket.recipes.length === 0 ? (
                    <p className="Editor__hint">
                        Ingen retter endnu. Find en opskrift og tryk “Læg i madkurv”. <Link to="/opskrifter">Se opskrifter</Link>
                    </p>
                ) : (
                    <ul className="Madkurv__recipes">
                        {basket.recipes.map((r) => (
                            <RecipeRow
                                key={r.id}
                                line={r}
                                locked={locked}
                                busy={busy}
                                onChange={(servings, day, note) => run(() => updateBasketRecipe(r.id, servings, day, note))}
                                onRemove={() => run(() => removeBasketRecipe(r.id))}
                            />
                        ))}
                    </ul>
                )}
            </section>

            <section className="Editor__card">
                <h2 className="Madkurv__heading">Ekstra varer og ønsker</h2>
                <p className="Editor__hint">
                    {locked
                        ? "Madkurven er låst. Nye ønsker kommer med i næste madkurv."
                        : "Alt det, der ikke hører til en ret. Ønsker deles med husstanden og ryddes, når I har bestilt."}
                </p>
                {(basket.wishes.length > 0 || basket.extras.length > 0) && (
                    <ul className="Madkurv__plainList">
                        {basket.wishes.map((w) => (
                            <li key={`w${w.id}`}>
                                <span>
                                    <strong>{formatQuantity(w.amount, w.unit)}</strong> {w.name}
                                    {w.addedBy && <span className="Madkurv__muted"> · {w.addedBy}</span>}
                                </span>
                                {!locked && (
                                    <button
                                        type="button"
                                        className="Editor__iconButton"
                                        aria-label={`Fjern ${w.name}`}
                                        disabled={busy}
                                        onClick={() => run(async () => (await deleteListItem("oensker", w.id), fetchBasket()))}
                                    >
                                        ×
                                    </button>
                                )}
                            </li>
                        ))}
                        {basket.extras.map((x) => (
                            <li key={`x${x.id}`}>
                                <span>
                                    <strong>{formatQuantity(x.amount, x.unit)}</strong> {x.name}
                                </span>
                                {!locked && (
                                    <button type="button" className="Editor__iconButton" aria-label={`Fjern ${x.name}`} disabled={busy} onClick={() => run(() => removeBasketExtra(x.id))}>
                                        ×
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                <QuickAdd
                    placeholder="Tilføj vare, fx 2 pk køkkenrulle"
                    busy={busy}
                    onAdd={(item) =>
                        run(async () => {
                            await addListItem("oensker", item);
                            return fetchBasket();
                        })
                    }
                />
            </section>

            <ShoppingList
                basket={basket}
                busy={busy}
                onToggle={(item) => run(() => setHave(item.key, !item.have))}
                onOutOf={(item) =>
                    run(async () => {
                        await updateListItem("krydderiskab", item.ignoredBy!, { name: item.ignoredAs!, amount: null, unit: null, note: null, active: false });
                        return fetchBasket();
                    })
                }
            />
        </div>
    );
}

function StatusCard({
    basket,
    busy,
    onLock,
    onReopen,
    onOrdered,
}: {
    basket: Basket;
    busy: boolean;
    onLock: () => void;
    onReopen: () => void;
    onOrdered: (deliveryDate: string | null) => void;
}) {
    const [delivery, setDelivery] = useState("");
    const toBuy = basket.items.filter((i) => !i.have).length;

    if (basket.status === "kladde")
        return (
            <div className="Madkurv__status is-draft">
                <div>
                    <p className="Madkurv__statusTitle">Kladde · uge {isoWeek(new Date())}</p>
                    <p className="Editor__hint">
                        Planlæg ugens mad. Når I er klar, låser I madkurven, så indkøbslisten ligger fast og kan lægges i nemlig-kurven
                        fra PC’en.
                    </p>
                </div>
                <button type="button" className="RecipeLogin__button" disabled={busy || basket.items.length === 0} onClick={onLock}>
                    Klar til bestilling
                </button>
            </div>
        );

    return (
        <div className="Madkurv__status is-ready">
            <div>
                <p className="Madkurv__statusTitle">
                    {basket.status === "fyldt" ? "Kurven er fyldt i nemlig" : "Klar til bestilling"}
                    {basket.lockedAt && <span className="Madkurv__muted"> · låst {formatDate(basket.lockedAt)}</span>}
                </p>
                <p className="Editor__hint">
                    {basket.status === "fyldt"
                        ? "Gå til nemlig.com og gennemfør bestillingen. Markér den derefter som bestilt her."
                        : `${toBuy} varer skal købes. Bed Claude på PC’en om at “lave nemlig-ordren”, eller bestil selv ud fra listen.`}
                </p>
                <label className="Madkurv__delivery">
                    <span>Levering</span>
                    <input className="Editor__input" type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
                </label>
            </div>
            <div className="Madkurv__statusActions">
                <button type="button" className="RecipeLogin__button" disabled={busy} onClick={() => onOrdered(delivery || null)}>
                    Markér som bestilt
                </button>
                <button type="button" className="Recipes__logout" disabled={busy} onClick={onReopen}>
                    Ret igen
                </button>
            </div>
        </div>
    );
}

function RecipeRow({
    line,
    locked,
    busy,
    onChange,
    onRemove,
}: {
    line: BasketRecipe;
    locked: boolean;
    busy: boolean;
    onChange: (servings: number, day: number | null, note: string | null) => void;
    onRemove: () => void;
}) {
    const [note, setNote] = useState(line.note ?? "");
    const saveNote = () => {
        if ((note.trim() || null) !== line.note) onChange(line.servings, line.day, note.trim() || null);
    };

    return (
        <li className="Madkurv__recipe">
            <div className="Madkurv__recipeMain">
                {line.slug ? (
                    <Link to={`/opskrifter/${line.slug}`} className="Madkurv__recipeTitle">
                        {line.title}
                    </Link>
                ) : (
                    <span className="Madkurv__recipeTitle">{line.title} (slettet)</span>
                )}
                {locked ? (
                    <span className="Madkurv__muted">
                        {line.servings} pers.{line.day != null && ` · ${DAYS[line.day]}`}
                        {line.note && ` · ${line.note}`}
                    </span>
                ) : (
                    <input
                        className="Editor__input Madkurv__note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={saveNote}
                        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                        placeholder="Note, fx uden chili"
                        aria-label={`Note til ${line.title}`}
                        maxLength={200}
                    />
                )}
            </div>
            {!locked && (
                <div className="Madkurv__recipeControls">
                    <div className="Madkurv__stepper" aria-label="Portioner">
                        <button type="button" className="Editor__iconButton" disabled={busy || line.servings <= 1} onClick={() => onChange(line.servings - 1, line.day, line.note)} aria-label="Færre portioner">
                            −
                        </button>
                        <span>{line.servings} pers.</span>
                        <button type="button" className="Editor__iconButton" disabled={busy || line.servings >= 100} onClick={() => onChange(line.servings + 1, line.day, line.note)} aria-label="Flere portioner">
                            +
                        </button>
                    </div>
                    <select
                        className="RecipeBrowser__select"
                        value={line.day ?? ""}
                        disabled={busy}
                        onChange={(e) => onChange(line.servings, e.target.value === "" ? null : Number(e.target.value), line.note)}
                        aria-label={`Dag for ${line.title}`}
                    >
                        <option value="">Ingen dag</option>
                        {DAYS.map((d, i) => (
                            <option key={d} value={i}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <button type="button" className="Editor__iconButton" disabled={busy} onClick={onRemove} aria-label={`Fjern ${line.title}`} title="Fjern">
                        ×
                    </button>
                </div>
            )}
        </li>
    );
}

function ShoppingList({
    basket,
    busy,
    onToggle,
    onOutOf,
}: {
    basket: Basket;
    busy: boolean;
    onToggle: (item: ShoppingItem) => void;
    onOutOf: (item: ShoppingItem) => void;
}) {
    const [copied, setCopied] = useState(false);
    const toBuy = basket.items.filter((i) => !i.have);
    const have = basket.items.filter((i) => i.have && !i.ignored);
    const ignored = basket.items.filter((i) => i.ignored);
    const editable = basket.status === "kladde";

    async function copy() {
        const text = toBuy.map((i) => `${formatQuantity(i.amount, i.unit)} ${i.name}`.trim()).join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <section className="Editor__card">
            <div className="Madkurv__listHeader">
                <h2 className="Madkurv__heading">Indkøbsliste</h2>
                {toBuy.length > 0 && (
                    <button type="button" className="Recipes__logout" onClick={copy}>
                        {copied ? "Kopieret ✓" : "Kopiér liste"}
                    </button>
                )}
            </div>
            {basket.items.length === 0 ? (
                <p className="Editor__hint">Listen bygges automatisk ud fra retter, faste varer, ønsker og beholdning.</p>
            ) : (
                <>
                    <p className="Editor__hint">
                        {toBuy.length} varer skal købes. Sæt flueben ved det, I allerede har. Mængder er lagt sammen og skaleret til
                        portionerne.
                    </p>
                    <ul className="Madkurv__items">
                        {toBuy.map((i) => (
                            <ItemRow key={i.key} item={i} busy={busy} onToggle={onToggle} />
                        ))}
                    </ul>
                    {have.length > 0 && (
                        <details className="Madkurv__have">
                            <summary>Har det allerede ({have.length})</summary>
                            <ul className="Madkurv__items">
                                {have.map((i) => (
                                    <ItemRow key={i.key} item={i} busy={busy} onToggle={onToggle} />
                                ))}
                            </ul>
                        </details>
                    )}
                    {ignored.length > 0 && (
                        <details className="Madkurv__have">
                            <summary>Ignoreret, krydderiskab ({ignored.length})</summary>
                            <ul className="Madkurv__plainList">
                                {ignored.map((i) => (
                                    <li key={i.key}>
                                        <span>
                                            {i.amount != null && <strong>{formatQuantity(i.amount, i.unit)} </strong>}
                                            {i.name}
                                            {i.ignoredAs && i.ignoredAs.toLowerCase() !== i.name.toLowerCase() && (
                                                <span className="Madkurv__muted"> · som “{i.ignoredAs}”</span>
                                            )}
                                        </span>
                                        {editable && i.ignoredBy != null && (
                                            <button type="button" className="Recipes__tag" disabled={busy} onClick={() => onOutOf(i)} title="Fjern fluebenet i krydderiskabet, så det bliver købt">
                                                Løbet tør
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </>
            )}
        </section>
    );
}

function ItemRow({ item, busy, onToggle }: { item: ShoppingItem; busy: boolean; onToggle: (item: ShoppingItem) => void }) {
    return (
        <li className={`Madkurv__item ${item.have ? "is-have" : ""}`}>
            <label>
                <input type="checkbox" checked={item.have} disabled={busy} onChange={() => onToggle(item)} />
                <span className="Madkurv__itemText">
                    <span>
                        {item.amount != null && <strong>{formatQuantity(item.amount, item.unit)} </strong>}
                        {item.name}
                    </span>
                    <span className="Madkurv__muted">
                        {item.sources.join(", ")}
                        {item.fromPantry && " · i beholdningen"}
                        {item.note && ` · ${item.note}`}
                    </span>
                </span>
            </label>
        </li>
    );
}

function QuickAdd({ placeholder, busy, onAdd }: { placeholder: string; busy: boolean; onAdd: (item: { name: string; amount: number | null; unit: string | null; note: string | null }) => Promise<void> | void }) {
    const [text, setText] = useState("");

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!text.trim()) return;
        const parsed = parseIngredientLine(text, null);
        // Clear right away so the next item can be typed while this one saves.
        setText("");
        await onAdd({ name: parsed.name, amount: parsed.amount, unit: parsed.unit, note: parsed.note });
    }

    return (
        <form className="Madkurv__quickAdd" onSubmit={submit}>
            <input className="Editor__input" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label="Ny vare" maxLength={200} />
            <button type="submit" className="RecipeLogin__button" disabled={busy || !text.trim()}>
                Tilføj
            </button>
        </form>
    );
}

// ---------- Household lists ----------

function ListTab({ kind, onAuthError }: TabProps & { kind: ListKind }) {
    const info = LIST_INFO[kind];
    const [items, setItems] = useState<HouseholdItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const run = useCallback(
        async (action: () => Promise<unknown>) => {
            setBusy(true);
            setError(null);
            try {
                await action();
                setItems(await fetchList(kind));
            } catch (e) {
                if (!onAuthError(e)) setError(errorText(e));
            } finally {
                setBusy(false);
            }
        },
        [kind, onAuthError],
    );

    useEffect(() => {
        void run(async () => {});
    }, [run]);

    return (
        <section className="Editor__card Madkurv__content">
            <h2 className="Madkurv__heading">{info.title}</h2>
            <p className="Editor__hint">{info.hint}</p>
            {error && (
                <div className="Editor__error" role="alert">
                    {error}
                </div>
            )}
            {items === null ? (
                !error && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter…
                    </div>
                )
            ) : items.length === 0 ? (
                <p className="Editor__hint">Listen er tom.</p>
            ) : (
                <ul className="Madkurv__plainList">
                    {items.map((i) => (
                        <li key={i.id} className={kind === "faste-varer" && !i.active ? "is-paused" : ""}>
                            <span>
                                {i.amount != null && <strong>{formatQuantity(i.amount, i.unit)} </strong>}
                                {i.name}
                                {i.note && <span className="Madkurv__muted"> · {i.note}</span>}
                                {kind === "oensker" && i.addedBy && <span className="Madkurv__muted"> · {i.addedBy}</span>}
                            </span>
                            <span className="Madkurv__rowActions">
                                {kind === "faste-varer" && (
                                    <button
                                        type="button"
                                        className="Recipes__tag"
                                        disabled={busy}
                                        onClick={() => run(() => updateListItem(kind, i.id, { ...i, active: !i.active }))}
                                    >
                                        {i.active ? "Pause" : "Genoptag"}
                                    </button>
                                )}
                                <button type="button" className="Editor__iconButton" disabled={busy} aria-label={`Fjern ${i.name}`} onClick={() => run(() => deleteListItem(kind, i.id))}>
                                    ×
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <QuickAdd placeholder={info.placeholder} busy={busy} onAdd={(item) => run(() => addListItem(kind, item))} />
        </section>
    );
}

// ---------- Krydderiskab (checklist) ----------

function SpiceTab({ onAuthError }: TabProps) {
    const info = LIST_INFO.krydderiskab;
    const [items, setItems] = useState<HouseholdItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const run = useCallback(
        async (action: () => Promise<HouseholdItem[] | unknown>) => {
            setBusy(true);
            setError(null);
            try {
                await action();
                setItems(await fetchList("krydderiskab"));
            } catch (e) {
                if (!onAuthError(e)) setError(errorText(e));
            } finally {
                setBusy(false);
            }
        },
        [onAuthError],
    );

    useEffect(() => {
        void run(async () => {});
    }, [run]);

    const ticked = items?.filter((i) => i.active).length ?? 0;

    return (
        <section className="Editor__card Madkurv__content">
            <div className="Madkurv__listHeader">
                <h2 className="Madkurv__heading">{info.title}</h2>
                <button type="button" className="Recipes__logout" disabled={busy} onClick={() => run(addSpiceSuggestions)}>
                    Tilføj forslag
                </button>
            </div>
            <p className="Editor__hint">{info.hint}</p>
            <p className="Editor__hint">
                Et flueben dækker også sammensatte navne: “olie” dækker olivenolie, “peber” dækker cayennepeber og “salt og peber”.
                Friske urter (“frisk oregano”) bliver altid købt.
            </p>
            {error && (
                <div className="Editor__error" role="alert">
                    {error}
                </div>
            )}
            {items === null ? (
                !error && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter…
                    </div>
                )
            ) : items.length === 0 ? (
                <p className="Editor__hint">Tomt. Tryk “Tilføj forslag” for at starte med salt, peber, olie, smør, mel og de almindelige krydderier.</p>
            ) : (
                <>
                    <p className="Madkurv__muted">
                        {ticked} af {items.length} ignoreres
                    </p>
                    <ul className="Spices">
                        {items.map((i) => (
                            <li key={i.id} className={`Spices__item ${i.active ? "" : "is-out"}`}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={i.active}
                                        disabled={busy}
                                        onChange={() => run(() => updateListItem("krydderiskab", i.id, { ...i, active: !i.active }))}
                                    />
                                    <span>{i.name}</span>
                                </label>
                                <button type="button" className="Editor__iconButton" disabled={busy} aria-label={`Fjern ${i.name}`} onClick={() => run(() => deleteListItem("krydderiskab", i.id))}>
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <QuickAdd placeholder={info.placeholder} busy={busy} onAdd={(item) => run(() => addListItem("krydderiskab", { ...item, active: true }))} />
        </section>
    );
}

// ---------- History ----------

function HistoryTab({ onAuthError }: TabProps) {
    const navigate = useNavigate();
    const [history, setHistory] = useState<BasketSummary[] | null>(null);
    const [open, setOpen] = useState<Record<number, Basket>>({});
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        fetchHistory()
            .then(setHistory)
            .catch((e) => !onAuthError(e) && setError(errorText(e)));
    }, [onAuthError]);

    async function toggle(id: number) {
        if (open[id]) {
            setOpen((o) => {
                const rest = { ...o };
                delete rest[id];
                return rest;
            });
            return;
        }
        try {
            const basket = await fetchBasketById(id);
            setOpen((o) => ({ ...o, [id]: basket }));
        } catch (e) {
            if (!onAuthError(e)) setError(errorText(e));
        }
    }

    async function repeat(id: number) {
        setBusy(true);
        try {
            await repeatBasket(id);
            navigate("/madkurv");
        } catch (e) {
            if (!onAuthError(e)) setError(errorText(e));
            setBusy(false);
        }
    }

    if (error)
        return (
            <div className="Editor__error" role="alert">
                {error}
            </div>
        );
    if (!history)
        return (
            <div className="spinner">
                <div className="spinner__circle" />
                Henter historik…
            </div>
        );
    if (history.length === 0) return <p className="Blogpage__subtitle">Ingen bestillinger endnu.</p>;

    return (
        <div className="Madkurv__content">
            {history.map((h) => {
                const date = h.orderedAt ?? h.createdAt;
                const detail = open[h.id];
                return (
                    <section key={h.id} className="Editor__card">
                        <div className="Madkurv__listHeader">
                            <div>
                                <h2 className="Madkurv__heading">Uge {isoWeek(new Date(date))}</h2>
                                <p className="Madkurv__muted">
                                    Bestilt {formatDate(date)}
                                    {h.deliveryDate && ` · levering ${formatDate(h.deliveryDate)}`} · {h.itemCount} varer
                                </p>
                            </div>
                            <div className="Madkurv__rowActions">
                                <button type="button" className="Recipes__logout" onClick={() => toggle(h.id)}>
                                    {detail ? "Skjul liste" : "Vis liste"}
                                </button>
                                {h.recipes.length > 0 && (
                                    <button type="button" className="RecipeLogin__button" disabled={busy} onClick={() => repeat(h.id)}>
                                        Gentag retterne
                                    </button>
                                )}
                            </div>
                        </div>
                        {h.recipes.length > 0 && <p className="Madkurv__historyRecipes">{h.recipes.join(" · ")}</p>}
                        {detail && (
                            <ul className="Madkurv__plainList">
                                {detail.items
                                    .filter((i) => !i.have)
                                    .map((i) => (
                                        <li key={i.key}>
                                            <span>
                                                {i.amount != null && <strong>{formatQuantity(i.amount, i.unit)} </strong>}
                                                {i.name}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
