import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    createRecipe,
    deleteRecipe,
    fetchRecipe,
    fetchRecipes,
    formatAmount,
    NotLoggedInError,
    updateRecipe,
    type Ingredient,
    type Recipe,
    type RecipeInput,
    type Step,
} from "../api/recipes";
import { parseAmount, parseIngredientsText, parseStepsText, UNITS } from "../api/recipeText";
import RecipeLogin from "./RecipeLogin";
import { LinkForm } from "./RecipeImportsPage";
import { addImport } from "../api/recipeImports";
import "./BlogPage.css";
import "./RecipesPage.css";
import "./RecipeEditor.css";

const DEFAULT_CUISINES = [
    "amerikansk", "dansk", "fransk", "græsk", "indisk", "italiensk", "japansk",
    "kinesisk", "koreansk", "malaysisk", "mellemøstlig", "mexicansk", "spansk", "thai", "vietnamesisk",
];

const DEFAULT_TAGS = ["hverdag", "weekend", "vegetar", "meal prep", "ovn", "gryde", "pasta", "suppe", "salat"];

// ---------- Form model ----------

type IngredientRow =
    | { key: string; kind: "item"; amount: string; unit: string; name: string; note: string }
    | { key: string; kind: "heading"; text: string };

type StepRow = { key: string; kind: "item" | "heading"; text: string };

type FormState = {
    title: string;
    sourceUrl: string;
    cuisine: string;
    servings: string;
    totalMinutes: string;
    activeMinutes: string;
    tags: string[];
    freezesWell: boolean;
    keepsDays: string;
    intro: string;
    ingredients: IngredientRow[];
    steps: StepRow[];
    leftovers: string;
    notes: string;
};

let keyCounter = 0;
const newKey = () => `row-${++keyCounter}`;

const emptyIngredient = (): IngredientRow => ({ key: newKey(), kind: "item", amount: "", unit: "", name: "", note: "" });
const emptyStep = (): StepRow => ({ key: newKey(), kind: "item", text: "" });

/** Flat API rows -> editor rows, inserting a heading row whenever the section changes. */
function ingredientRows(items: Ingredient[]): IngredientRow[] {
    const rows: IngredientRow[] = [];
    let section: string | null = null;
    for (const i of items) {
        if (i.section !== section && i.section) rows.push({ key: newKey(), kind: "heading", text: i.section });
        section = i.section;
        rows.push({
            key: newKey(),
            kind: "item",
            amount: i.amount != null ? formatAmount(i.amount) : "",
            unit: i.unit ?? "",
            name: i.name,
            note: i.note ?? "",
        });
    }
    return rows;
}

function stepRows(items: Step[]): StepRow[] {
    const rows: StepRow[] = [];
    let section: string | null = null;
    for (const s of items) {
        if (s.section !== section && s.section) rows.push({ key: newKey(), kind: "heading", text: s.section });
        section = s.section;
        rows.push({ key: newKey(), kind: "item", text: s.text });
    }
    return rows;
}

function initialForm(recipe: Recipe | null, defaultCuisine = ""): FormState {
    const str = (n: number | null) => (n == null ? "" : String(n));
    return {
        title: recipe?.title ?? "",
        sourceUrl: recipe?.sourceUrl ?? "",
        cuisine: recipe ? (recipe.cuisine ?? "") : defaultCuisine,
        servings: recipe ? str(recipe.servings) : "4",
        totalMinutes: str(recipe?.totalMinutes ?? null),
        activeMinutes: str(recipe?.activeMinutes ?? null),
        tags: recipe?.tags ?? [],
        freezesWell: recipe?.freezesWell ?? false,
        keepsDays: str(recipe?.keepsDays ?? null),
        intro: recipe?.intro ?? "",
        ingredients: recipe?.ingredients.length ? ingredientRows(recipe.ingredients) : [emptyIngredient()],
        steps: recipe?.steps.length ? stepRows(recipe.steps) : [emptyStep()],
        leftovers: recipe?.leftovers ?? "",
        notes: recipe?.notes ?? "",
    };
}

/** Validates the form and converts it to the API body; returns an error message instead if invalid. */
function toInput(form: FormState, isDraft: boolean): RecipeInput | string {
    if (!form.title.trim()) return "Giv retten et navn.";

    const int = (value: string, label: string, min: number): number | null | string => {
        if (!value.trim()) return null;
        const n = Number(value);
        return Number.isInteger(n) && n >= min ? n : `${label} skal være et helt tal${min > 0 ? ` (mindst ${min})` : ""}.`;
    };
    const servings = int(form.servings, "Portioner", 1);
    const totalMinutes = int(form.totalMinutes, "Tid i alt", 0);
    const activeMinutes = int(form.activeMinutes, "Arbejdstid", 0);
    const keepsDays = int(form.keepsDays, "Holder dage", 0);
    for (const v of [servings, totalMinutes, activeMinutes, keepsDays]) if (typeof v === "string") return v;

    const sourceUrl = form.sourceUrl.trim();
    if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) return "Kilde skal være et link, der starter med https://";

    const ingredients: Ingredient[] = [];
    let section: string | null = null;
    for (const row of form.ingredients) {
        if (row.kind === "heading") {
            section = row.text.trim() || null;
            continue;
        }
        const name = row.name.trim();
        if (!name && !row.amount.trim() && !row.unit.trim() && !row.note.trim()) continue; // empty row
        if (!name) return `En ingrediens mangler navn (${[row.amount, row.unit].filter(Boolean).join(" ")}).`;
        const amount = row.amount.trim() ? parseAmount(row.amount) : null;
        if (row.amount.trim() && amount == null) return `Mængden "${row.amount}" for ${name} er ikke et tal. Brug fx 2, 1,5 eller 1½.`;
        ingredients.push({ section, amount, unit: row.unit.trim() || null, name, note: row.note.trim() || null });
    }

    const steps: Step[] = [];
    section = null;
    for (const row of form.steps) {
        if (row.kind === "heading") section = row.text.trim() || null;
        else if (row.text.trim()) steps.push({ section, text: row.text.trim() });
    }

    const orNull = (s: string) => s.trim() || null;
    return {
        title: form.title.trim(),
        sourceUrl: orNull(sourceUrl),
        cuisine: orNull(form.cuisine)?.toLowerCase() ?? null,
        servings: servings as number | null,
        totalMinutes: totalMinutes as number | null,
        activeMinutes: activeMinutes as number | null,
        tags: form.tags,
        freezesWell: form.freezesWell,
        keepsDays: keepsDays as number | null,
        intro: orNull(form.intro),
        ingredients,
        steps,
        leftovers: orNull(form.leftovers),
        notes: orNull(form.notes),
        isDraft,
    };
}

function move<T>(list: T[], index: number, delta: number): T[] {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
}

// ---------- Page ----------

type LoadState =
    | { kind: "loading" }
    | { kind: "login" }
    | { kind: "error"; message: string }
    | { kind: "ready"; recipe: Recipe | null; cuisines: string[]; tags: string[] };

export default function RecipeEditorPage() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const method = slug ? "manuel" : searchParams.get("metode");
    const [state, setState] = useState<LoadState>({ kind: "loading" });

    const load = useCallback(() => {
        Promise.all([fetchRecipes(), slug ? fetchRecipe(slug) : Promise.resolve(null)])
            .then(([all, recipe]) => {
                const cuisines = [...new Set([...DEFAULT_CUISINES, ...all.flatMap((r) => (r.cuisine ? [r.cuisine] : []))])];
                const tags = [...new Set([...all.flatMap((r) => r.tags), ...DEFAULT_TAGS])];
                setState({
                    kind: "ready",
                    recipe,
                    cuisines: cuisines.sort((a, b) => a.localeCompare(b, "da")),
                    tags: tags.sort((a, b) => a.localeCompare(b, "da")),
                });
            })
            .catch((e) =>
                setState(
                    e instanceof NotLoggedInError
                        ? { kind: "login" }
                        : { kind: "error", message: e instanceof Error ? e.message : "Fejl" },
                ),
            );
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="BlogPost">
            <div className="BlogPost__overlay" />
            <div className="BlogPost__container">
                <Link to={slug ? `/opskrifter/${slug}` : "/opskrifter"} className="BlogPost__back">
                    ← {slug ? "Tilbage til opskriften" : "Alle opskrifter"}
                </Link>

                {state.kind === "loading" && (
                    <div className="spinner">
                        <div className="spinner__circle" />
                        Henter…
                    </div>
                )}
                {state.kind === "login" && (
                    <RecipeLogin
                        onLoggedIn={() => {
                            setState({ kind: "loading" });
                            load();
                        }}
                    />
                )}
                {state.kind === "error" && <div className="Blogpage__error">{state.message}</div>}
                {state.kind === "ready" && !state.recipe && method !== "manuel" && method !== "link" && <MethodChooser />}
                {state.kind === "ready" && !state.recipe && method === "link" && <LinkImport onLoggedOut={() => setState({ kind: "login" })} />}
                {state.kind === "ready" && (state.recipe || method === "manuel") && (
                    <RecipeForm
                        key={state.recipe?.slug ?? "new"}
                        recipe={state.recipe}
                        cuisines={state.cuisines}
                        tagSuggestions={state.tags}
                    />
                )}
            </div>
        </div>
    );
}

// ---------- New recipe: choose method ----------

function MethodChooser() {
    const [searchParams] = useSearchParams();
    const withMethod = (metode: string) => {
        const next = new URLSearchParams(searchParams);
        next.set("metode", metode);
        return `/opskrifter/ny?${next}`;
    };

    return (
        <div className="Editor">
            <h1 className="BlogPost__articleTitle">Ny opskrift</h1>
            <p className="Editor__hint">Hvordan vil du tilføje den?</p>
            <div className="Methods">
                <Link to={withMethod("link")} className="Methods__card">
                    <span className="Methods__title">Fra et link</span>
                    <span className="Methods__text">
                        Indsæt et link til en opskrift. Claude laver den om til en kladde, når generatoren køres på PC’en. Du gennemser og
                        udgiver den bagefter.
                    </span>
                </Link>
                <Link to={withMethod("manuel")} className="Methods__card">
                    <span className="Methods__title">Skriv selv</span>
                    <span className="Methods__text">
                        Udfyld formularen med ingredienser og fremgangsmåde. Du kan også indsætte tekst og få den delt op i linjer.
                    </span>
                </Link>
            </div>
        </div>
    );
}

function LinkImport({ onLoggedOut }: { onLoggedOut: () => void }) {
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function add(url: string, comment: string | null) {
        setBusy(true);
        setError(null);
        try {
            await addImport(url, comment);
            navigate("/opskrifter/generering");
        } catch (e) {
            if (e instanceof NotLoggedInError) onLoggedOut();
            else setError(e instanceof Error ? e.message : "Kunne ikke tilføje linket");
            setBusy(false);
        }
    }

    return (
        <div className="Editor">
            <h1 className="BlogPost__articleTitle">Ny opskrift fra link</h1>
            <div className="Editor__card">
                <p className="Editor__hint">
                    Linket lægges i køen <Link to="/opskrifter/generering">Til generering</Link>. Når generatoren har kørt på PC’en, ligger
                    opskriften som kladde, klar til at blive gennemset og udgivet.
                </p>
                <LinkForm busy={busy} onAdd={add} />
                {error && (
                    <div className="Editor__error" role="alert">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------- Form ----------

function RecipeForm({
    recipe,
    cuisines,
    tagSuggestions,
}: {
    recipe: Recipe | null;
    cuisines: string[];
    tagSuggestions: string[];
}) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [initial] = useState(() => initialForm(recipe, searchParams.get("koekken") ?? ""));
    const [form, setForm] = useState(initial);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);

    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

    // Warn before closing the tab with unsaved changes.
    useEffect(() => {
        if (!dirty || busy) return;
        const handler = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty, busy]);

    const set = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((f) => ({ ...f, [field]: value }));

    async function save(isDraft: boolean) {
        const input = toInput(form, isDraft);
        if (typeof input === "string") {
            setError(input);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const saved = recipe ? await updateRecipe(recipe.slug, input) : await createRecipe(input);
            navigate(`/opskrifter/${saved.slug}`);
        } catch (e) {
            if (e instanceof NotLoggedInError) setNeedsLogin(true);
            else setError(e instanceof Error ? e.message : "Kunne ikke gemme");
            setBusy(false);
        }
    }

    async function remove() {
        if (!recipe || !window.confirm(`Slet "${recipe.title}"? Det kan ikke fortrydes.`)) return;
        setBusy(true);
        try {
            await deleteRecipe(recipe.slug);
            navigate("/opskrifter");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Kunne ikke slette");
            setBusy(false);
        }
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        void save(recipe ? recipe.isDraft : true);
    }

    const isDraftOrNew = !recipe || recipe.isDraft;

    return (
        <form className="Editor" onSubmit={onSubmit} noValidate>
            <h1 className="BlogPost__articleTitle">{recipe ? "Rediger opskrift" : "Ny opskrift"}</h1>
            {recipe?.isDraft && <p className="Editor__hint">Opskriften er en kladde. Udgiv den, når den er klar.</p>}

            {/* ---- Basics ---- */}
            <fieldset className="Editor__card">
                <legend className="Editor__legend">Om retten</legend>

                <Field label="Navn" hint="Som den skal stå på kortet, fx “Thai rød karry med kylling”.">
                    <input
                        className="Editor__input"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        maxLength={200}
                        autoFocus={!recipe}
                        required
                    />
                </Field>

                <div className="Editor__grid2">
                    <Field label="Køkken" hint="Vælg eller skriv selv. Bruges til temasider.">
                        <input
                            className="Editor__input"
                            list="editor-cuisines"
                            value={form.cuisine}
                            onChange={(e) => set("cuisine", e.target.value)}
                            maxLength={50}
                            placeholder="fx thai"
                        />
                        <datalist id="editor-cuisines">
                            {cuisines.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </Field>

                    <Field label="Kilde" hint="Link til den originale opskrift (valgfri).">
                        <input
                            className="Editor__input"
                            type="url"
                            inputMode="url"
                            value={form.sourceUrl}
                            onChange={(e) => set("sourceUrl", e.target.value)}
                            maxLength={500}
                            placeholder="https://…"
                        />
                    </Field>
                </div>

                <div className="Editor__grid4">
                    <Field label="Portioner">
                        <input className="Editor__input" inputMode="numeric" value={form.servings} onChange={(e) => set("servings", e.target.value)} />
                    </Field>
                    <Field label="Tid i alt (min)" hint="Inkl. ventetid">
                        <input className="Editor__input" inputMode="numeric" value={form.totalMinutes} onChange={(e) => set("totalMinutes", e.target.value)} placeholder="fx 45" />
                    </Field>
                    <Field label="Arbejdstid (min)" hint="Aktiv tid">
                        <input className="Editor__input" inputMode="numeric" value={form.activeMinutes} onChange={(e) => set("activeMinutes", e.target.value)} placeholder="fx 20" />
                    </Field>
                    <Field label="Rester holder (dage)" hint="I køleskab">
                        <input className="Editor__input" inputMode="numeric" value={form.keepsDays} onChange={(e) => set("keepsDays", e.target.value)} placeholder="fx 3" />
                    </Field>
                </div>

                <label className="Editor__check">
                    <input type="checkbox" checked={form.freezesWell} onChange={(e) => set("freezesWell", e.target.checked)} />
                    Kan fryses
                </label>

                <Field label="Tags" hint="Tryk Enter eller komma for at tilføje.">
                    <TagInput tags={form.tags} suggestions={tagSuggestions} onChange={(tags) => set("tags", tags)} />
                </Field>

                <Field label="Intro" hint="Valgfri. Fx planlægning (“start 2 dage før”) eller udstyr. Markdown virker.">
                    <textarea className="Editor__input Editor__textarea" rows={2} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
                </Field>
            </fieldset>

            {/* ---- Ingredients ---- */}
            <fieldset className="Editor__card">
                <legend className="Editor__legend">Ingredienser</legend>
                <p className="Editor__hint">
                    Én vare pr. linje, skrevet som du ville købe den: mængde, enhed og navn. Tilberedning (“finthakket”) og
                    alternativer går i noten. Brug overskrifter til dele af retten, fx “Sauce” og “Til servering”.
                </p>
                <IngredientEditor rows={form.ingredients} onChange={(rows) => set("ingredients", rows)} />
            </fieldset>

            {/* ---- Steps ---- */}
            <fieldset className="Editor__card">
                <legend className="Editor__legend">Fremgangsmåde</legend>
                <p className="Editor__hint">Ét trin pr. felt. Trinene nummereres automatisk, også på tværs af overskrifter.</p>
                <StepEditor rows={form.steps} onChange={(rows) => set("steps", rows)} />
            </fieldset>

            {/* ---- Leftovers & notes ---- */}
            <fieldset className="Editor__card">
                <legend className="Editor__legend">Rester og noter</legend>
                <Field label="Rester og restebrug" hint="Hvad bliver typisk tilovers, og hvad kan det bruges til? Én ting pr. linje, start med “- ”.">
                    <textarea className="Editor__input Editor__textarea" rows={4} value={form.leftovers} onChange={(e) => set("leftovers", e.target.value)} placeholder="- Rest fløde → kartoffelmos" />
                </Field>
                <Field label="Noter" hint="Egne ændringer, fx “mindre chili”.">
                    <textarea className="Editor__input Editor__textarea" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
            </fieldset>

            {needsLogin && (
                <div className="Editor__card">
                    <p className="Editor__error">Du er blevet logget ud. Log ind igen. Dine ændringer bliver på siden.</p>
                    <RecipeLogin onLoggedIn={() => setNeedsLogin(false)} />
                </div>
            )}

            {error && <div className="Editor__error" role="alert">{error}</div>}

            <div className="Editor__actions">
                {isDraftOrNew ? (
                    <>
                        <button type="button" className="Recipes__logout" disabled={busy} onClick={() => save(true)}>
                            Gem som kladde
                        </button>
                        <button type="button" className="RecipeLogin__button" disabled={busy} onClick={() => save(false)}>
                            {busy ? "Gemmer…" : "Udgiv"}
                        </button>
                    </>
                ) : (
                    <button type="button" className="RecipeLogin__button" disabled={busy || !dirty} onClick={() => save(false)}>
                        {busy ? "Gemmer…" : "Gem ændringer"}
                    </button>
                )}
                {recipe && (
                    <button type="button" className="Editor__danger" disabled={busy} onClick={remove}>
                        Slet
                    </button>
                )}
            </div>
        </form>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="Editor__field">
            <span className="Editor__label">{label}</span>
            {children}
            {hint && <span className="Editor__fieldHint">{hint}</span>}
        </label>
    );
}

// ---------- Tags ----------

function TagInput({ tags, suggestions, onChange }: { tags: string[]; suggestions: string[]; onChange: (tags: string[]) => void }) {
    const [text, setText] = useState("");

    function add(raw: string) {
        const tag = raw.trim().toLowerCase().replace(/,/g, "");
        if (tag && !tags.includes(tag)) onChange([...tags, tag]);
        setText("");
    }

    const unused = suggestions.filter((s) => !tags.includes(s));

    return (
        <div className="Editor__tags">
            <div className="Editor__tagRow">
                {tags.map((t) => (
                    <button type="button" key={t} className="Recipes__tag is-active" onClick={() => onChange(tags.filter((x) => x !== t))} title="Fjern">
                        {t} ×
                    </button>
                ))}
                <input
                    className="Editor__input Editor__tagInput"
                    value={text}
                    onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add(text);
                        } else if (e.key === "Backspace" && !text && tags.length) {
                            onChange(tags.slice(0, -1));
                        }
                    }}
                    onBlur={() => text && add(text)}
                    placeholder="Tilføj tag…"
                />
            </div>
            {unused.length > 0 && (
                <div className="Editor__tagRow">
                    {unused.map((t) => (
                        <button type="button" key={t} className="Recipes__tag" onClick={() => add(t)}>
                            + {t}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------- Ingredient rows ----------

function IngredientEditor({ rows, onChange }: { rows: IngredientRow[]; onChange: (rows: IngredientRow[]) => void }) {
    const update = (index: number, patch: Partial<IngredientRow>) =>
        onChange(rows.map((r, i) => (i === index ? ({ ...r, ...patch } as IngredientRow) : r)));

    // Only the first ingredient row shows example placeholders, so later rows don't look filled in.
    const firstItem = rows.findIndex((r) => r.kind === "item");

    function appendParsed(items: Ingredient[]) {
        // Drop the single empty starter row when pasting into an empty list.
        const base = rows.filter((r) => !(r.kind === "item" && !r.name && !r.amount && !r.unit && !r.note));
        onChange([...base, ...ingredientRows(items)]);
    }

    return (
        <div className="Editor__rows">
            <datalist id="editor-units">
                {UNITS.map((u) => (
                    <option key={u} value={u} />
                ))}
            </datalist>

            {rows.map((row, index) => (
                <div key={row.key} className={`Editor__row ${row.kind === "heading" ? "is-heading" : ""}`}>
                    {row.kind === "heading" ? (
                        <input
                            className="Editor__input Editor__headingInput"
                            value={row.text}
                            onChange={(e) => update(index, { text: e.target.value })}
                            placeholder="Overskrift, fx Sauce"
                            aria-label="Overskrift"
                            maxLength={100}
                        />
                    ) : (
                        <div className="Editor__ingredient">
                            <input className="Editor__input" value={row.amount} onChange={(e) => update(index, { amount: e.target.value })} placeholder={index === firstItem ? "400" : "mængde"} aria-label="Mængde" inputMode="decimal" />
                            <input className="Editor__input" list="editor-units" value={row.unit} onChange={(e) => update(index, { unit: e.target.value })} placeholder={index === firstItem ? "g" : "enhed"} aria-label="Enhed" maxLength={30} />
                            <input className="Editor__input" value={row.name} onChange={(e) => update(index, { name: e.target.value })} placeholder={index === firstItem ? "hakket oksekød" : "vare"} aria-label="Vare" maxLength={200} />
                            <input className="Editor__input" value={row.note} onChange={(e) => update(index, { note: e.target.value })} placeholder={index === firstItem ? "note, fx finthakket" : "note"} aria-label="Note" maxLength={200} />
                        </div>
                    )}
                    <RowButtons
                        onUp={() => onChange(move(rows, index, -1))}
                        onDown={() => onChange(move(rows, index, 1))}
                        onRemove={() => onChange(rows.filter((_, i) => i !== index))}
                    />
                </div>
            ))}

            <div className="Editor__rowActions">
                <button type="button" className="Recipes__tag" onClick={() => onChange([...rows, emptyIngredient()])}>
                    + Ingrediens
                </button>
                <button type="button" className="Recipes__tag" onClick={() => onChange([...rows, { key: newKey(), kind: "heading", text: "" }])}>
                    + Overskrift
                </button>
            </div>

            <PasteBox
                label="Indsæt ingredienser som tekst"
                hint={"Én pr. linje, fx “2 stk løg, finthakket”. Linjer som “Sauce:” eller “### Sauce” bliver overskrifter."}
                placeholder={"Sauce:\n2 stk løg, finthakket\n800 g hakkede tomater (2 dåser)\nsalt og peber"}
                parse={(text) => {
                    const items = parseIngredientsText(text);
                    return { count: items.length, apply: () => appendParsed(items) };
                }}
            />
        </div>
    );
}

// ---------- Step rows ----------

function StepEditor({ rows, onChange }: { rows: StepRow[]; onChange: (rows: StepRow[]) => void }) {
    const update = (index: number, text: string) => onChange(rows.map((r, i) => (i === index ? { ...r, text } : r)));

    // Number item rows continuously, skipping headings.
    const numbers = rows.map((_, i) => rows.slice(0, i + 1).filter((r) => r.kind === "item").length);

    function appendParsed(items: Step[]) {
        const base = rows.filter((r) => !(r.kind === "item" && !r.text.trim()));
        onChange([...base, ...stepRows(items)]);
    }

    return (
        <div className="Editor__rows">
            {rows.map((row, index) => (
                <div key={row.key} className={`Editor__row ${row.kind === "heading" ? "is-heading" : ""}`}>
                    {row.kind === "heading" ? (
                        <input
                            className="Editor__input Editor__headingInput"
                            value={row.text}
                            onChange={(e) => update(index, e.target.value)}
                            placeholder="Overskrift, fx Dag 1"
                            aria-label="Overskrift"
                            maxLength={100}
                        />
                    ) : (
                        <div className="Editor__step">
                            <span className="Editor__stepNumber">{numbers[index]}.</span>
                            <textarea
                                className="Editor__input Editor__textarea"
                                rows={2}
                                value={row.text}
                                onChange={(e) => update(index, e.target.value)}
                                aria-label={`Trin ${numbers[index]}`}
                                maxLength={2000}
                            />
                        </div>
                    )}
                    <RowButtons
                        onUp={() => onChange(move(rows, index, -1))}
                        onDown={() => onChange(move(rows, index, 1))}
                        onRemove={() => onChange(rows.filter((_, i) => i !== index))}
                    />
                </div>
            ))}

            <div className="Editor__rowActions">
                <button type="button" className="Recipes__tag" onClick={() => onChange([...rows, emptyStep()])}>
                    + Trin
                </button>
                <button type="button" className="Recipes__tag" onClick={() => onChange([...rows, { key: newKey(), kind: "heading", text: "" }])}>
                    + Overskrift
                </button>
            </div>

            <PasteBox
                label="Indsæt fremgangsmåde som tekst"
                hint="Nummererede linjer eller afsnit bliver til trin. Linjer som “Dag 1:” bliver overskrifter."
                placeholder={"1. Svits løg og hvidløg.\n2. Tilsæt kødet og brun det."}
                parse={(text) => {
                    const items = parseStepsText(text);
                    return { count: items.length, apply: () => appendParsed(items) };
                }}
            />
        </div>
    );
}

function RowButtons({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
    return (
        <div className="Editor__rowButtons">
            <button type="button" className="Editor__iconButton" onClick={onUp} aria-label="Flyt op" title="Flyt op">↑</button>
            <button type="button" className="Editor__iconButton" onClick={onDown} aria-label="Flyt ned" title="Flyt ned">↓</button>
            <button type="button" className="Editor__iconButton" onClick={onRemove} aria-label="Fjern" title="Fjern">×</button>
        </div>
    );
}

function PasteBox({
    label,
    hint,
    placeholder,
    parse,
}: {
    label: string;
    hint: string;
    placeholder: string;
    parse: (text: string) => { count: number; apply: () => void };
}) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const parsed = parse(text);

    if (!open)
        return (
            <button type="button" className="Editor__link" onClick={() => setOpen(true)}>
                {label}
            </button>
        );

    return (
        <div className="Editor__paste">
            <span className="Editor__fieldHint">{hint}</span>
            <textarea className="Editor__input Editor__textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoFocus />
            <div className="Editor__rowActions">
                <button
                    type="button"
                    className="RecipeLogin__button"
                    disabled={parsed.count === 0}
                    onClick={() => {
                        parsed.apply();
                        setText("");
                        setOpen(false);
                    }}
                >
                    Tilføj {parsed.count > 0 ? parsed.count : ""} linjer
                </button>
                <button type="button" className="Recipes__logout" onClick={() => setOpen(false)}>
                    Luk
                </button>
            </div>
        </div>
    );
}
