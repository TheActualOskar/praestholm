/** Presentation for cuisine theme pages. Cuisines without an entry get a neutral fallback. */
export type RecipeTheme = {
    key: string;
    name: string;
    color: string;
    intro: string;
    flavours: string[];
};

const THEMES: Omit<RecipeTheme, "key">[] = [
    { name: "Italiensk", color: "#e4572e", intro: "Få, gode råvarer og god tid: langtidssimrede saucer, pasta og ovnretter.", flavours: ["tomat", "hvidløg", "olivenolie", "parmesan", "basilikum", "oregano"] },
    { name: "Thai", color: "#2fbf71", intro: "Balancen mellem sødt, surt, salt og stærkt, ofte på under en halv time.", flavours: ["kokosmælk", "citrongræs", "fiskesauce", "lime", "chili", "koriander"] },
    { name: "Malaysisk", color: "#f2a541", intro: "Malajisk, kinesisk og indisk i én gryde: laksa, rendang og nasi lemak.", flavours: ["sambal", "kokosmælk", "tamarind", "citrongræs", "rejepasta", "galangal"] },
    { name: "Indisk", color: "#f0803c", intro: "Ristede krydderier, linser og cremede karryretter, der bliver bedre dagen efter.", flavours: ["garam masala", "spidskommen", "gurkemeje", "ingefær", "yoghurt", "kardemomme"] },
    { name: "Mexicansk", color: "#d1495b", intro: "Tacos, bønner og salsaer med masser af lime og frisk koriander.", flavours: ["chipotle", "lime", "koriander", "avocado", "sorte bønner", "spidskommen"] },
    { name: "Japansk", color: "#c8553d", intro: "Rene smage og umami: ramen, donburi og grillet med teriyaki.", flavours: ["soja", "miso", "mirin", "ingefær", "sesam", "dashi"] },
    { name: "Kinesisk", color: "#c03221", intro: "Wok ved høj varme, sprøde grøntsager og saucer med dybde.", flavours: ["soja", "østerssauce", "ingefær", "stjerneanis", "sichuanpeber", "forårsløg"] },
    { name: "Koreansk", color: "#e0475b", intro: "Fermenteret, stærkt og sødt: kimchi, bibimbap og bulgogi.", flavours: ["gochujang", "kimchi", "sesamolie", "hvidløg", "soja", "forårsløg"] },
    { name: "Vietnamesisk", color: "#5fb49c", intro: "Friske urter, klare supper og sprødt grønt: pho, banh mi og sommerruller.", flavours: ["fiskesauce", "mynte", "koriander", "lime", "risnudler", "stjerneanis"] },
    { name: "Fransk", color: "#4c6ef5", intro: "Klassiske teknikker, smør og vin: gryderetter, saucer og bistromad.", flavours: ["smør", "timian", "rødvin", "dijonsennep", "skalotteløg", "fløde"] },
    { name: "Græsk", color: "#3a86ff", intro: "Solmoden middelhavsmad med citron, oregano og feta.", flavours: ["feta", "citron", "oregano", "oliven", "yoghurt", "dild"] },
    { name: "Spansk", color: "#ef8354", intro: "Tapas, paella og røget paprika.", flavours: ["røget paprika", "safran", "chorizo", "hvidløg", "sherryeddike", "mandler"] },
    { name: "Mellemøstlig", color: "#c9a227", intro: "Krydrede grøntsager, kikærter og frisk brød.", flavours: ["tahin", "sumak", "za'atar", "spidskommen", "kikærter", "granatæble"] },
    { name: "Dansk", color: "#e63946", intro: "Hverdagsklassikere og søndagsmad, der minder om barndommen.", flavours: ["kartofler", "persille", "smør", "dild", "rugbrød", "løg"] },
    { name: "Amerikansk", color: "#457b9d", intro: "BBQ, burgere og comfort food, gerne lavet langsomt.", flavours: ["barbecuesauce", "røget paprika", "brun farin", "cheddar", "majs", "pickles"] },
];

const BY_KEY = new Map(THEMES.map((t) => [t.name.toLowerCase(), { ...t, key: t.name.toLowerCase() }]));

/** Cuisines always shown as tiles, even before they have recipes. */
export const FEATURED_CUISINES = ["italiensk", "thai", "malaysisk"];

export function themeFor(cuisine: string): RecipeTheme {
    const key = cuisine.toLowerCase();
    return (
        BY_KEY.get(key) ?? {
            key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            color: "#38d6c8",
            intro: "",
            flavours: [],
        }
    );
}

export const cuisinePath = (cuisine: string) => `/opskrifter/tema/${encodeURIComponent(cuisine.toLowerCase())}`;
