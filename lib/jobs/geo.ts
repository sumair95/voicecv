/**
 * Location → ISO-3166 alpha-2 country code.
 *
 * JSearch's `country` param defaults to `us`; without it, searches for jobs
 * outside the US return (almost) nothing even when the query names the city.
 * We derive the code from the user-typed location and/or the CV's country so
 * the search targets the right market.
 *
 * Not exhaustive — covers the app's core markets (Pakistan, Gulf, India,
 * Italy, UK, Germany, Canada, US) plus common global hubs. Falls back to
 * `undefined` (caller decides what to do) when nothing matches.
 */

// Country names + safe aliases → ISO2. Keys are lowercase.
const COUNTRY_TO_ISO: Record<string, string> = {
  "united states": "us", "united states of america": "us", usa: "us", america: "us",
  "united kingdom": "gb", "great britain": "gb", britain: "gb", uk: "gb",
  england: "gb", scotland: "gb", wales: "gb", "northern ireland": "gb",
  "united arab emirates": "ae", uae: "ae", emirates: "ae",
  "saudi arabia": "sa", ksa: "sa", "kingdom of saudi arabia": "sa",
  pakistan: "pk", india: "in", canada: "ca", australia: "au",
  germany: "de", deutschland: "de", italy: "it", italia: "it",
  france: "fr", spain: "es", "españa": "es", portugal: "pt",
  netherlands: "nl", holland: "nl", ireland: "ie", "new zealand": "nz",
  qatar: "qa", kuwait: "kw", bahrain: "bh", oman: "om",
  singapore: "sg", malaysia: "my", "south africa": "za", nigeria: "ng",
  egypt: "eg", "turkey": "tr", "türkiye": "tr", switzerland: "ch",
  austria: "at", belgium: "be", sweden: "se", norway: "no",
  denmark: "dk", finland: "fi", poland: "pl", greece: "gr",
  china: "cn", japan: "jp", "south korea": "kr", korea: "kr",
  indonesia: "id", philippines: "ph", bangladesh: "bd", "sri lanka": "lk",
  brazil: "br", mexico: "mx", argentina: "ar", chile: "cl", colombia: "co",
};

// Major cities → ISO2 (users often type just a city). Lowercase keys.
const CITY_TO_ISO: Record<string, string> = {
  // Australia (kept for correct routing even where JSearch coverage is thin)
  melbourne: "au", sydney: "au", brisbane: "au", perth: "au", adelaide: "au", canberra: "au",
  // UK
  london: "gb", manchester: "gb", birmingham: "gb", edinburgh: "gb", glasgow: "gb", leeds: "gb", liverpool: "gb",
  // Gulf
  dubai: "ae", "abu dhabi": "ae", sharjah: "ae", ajman: "ae",
  riyadh: "sa", jeddah: "sa", mecca: "sa", medina: "sa", dammam: "sa", khobar: "sa",
  doha: "qa", "kuwait city": "kw", manama: "bh", muscat: "om",
  // Pakistan
  karachi: "pk", lahore: "pk", islamabad: "pk", rawalpindi: "pk",
  faisalabad: "pk", peshawar: "pk", multan: "pk", quetta: "pk", sialkot: "pk",
  // India
  mumbai: "in", delhi: "in", "new delhi": "in", bangalore: "in", bengaluru: "in",
  hyderabad: "in", chennai: "in", kolkata: "in", pune: "in", ahmedabad: "in", gurgaon: "in", noida: "in",
  // Canada
  toronto: "ca", vancouver: "ca", montreal: "ca", calgary: "ca", ottawa: "ca", edmonton: "ca",
  // Germany
  berlin: "de", munich: "de", "münchen": "de", frankfurt: "de", hamburg: "de",
  cologne: "de", "köln": "de", stuttgart: "de", "düsseldorf": "de", dusseldorf: "de",
  // Italy
  milan: "it", milano: "it", rome: "it", roma: "it", turin: "it", torino: "it",
  naples: "it", napoli: "it", florence: "it", firenze: "it", bologna: "it",
  // Rest of Europe
  paris: "fr", lyon: "fr", marseille: "fr", madrid: "es", barcelona: "es",
  amsterdam: "nl", rotterdam: "nl", dublin: "ie", zurich: "ch", geneva: "ch",
  vienna: "at", brussels: "be", stockholm: "se", oslo: "no", copenhagen: "dk", lisbon: "pt",
  // APAC / other
  auckland: "nz", wellington: "nz", "kuala lumpur": "my", johannesburg: "za", "cape town": "za",
  // US hubs (in case a US city is typed without country)
  "new york": "us", "los angeles": "us", chicago: "us", houston: "us",
  "san francisco": "us", boston: "us", seattle: "us", austin: "us",
  dallas: "us", miami: "us", atlanta: "us", washington: "us",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word (phrase) match, so "us" doesn't hit "houston". */
function contains(haystack: string, term: string): boolean {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(haystack);
}

// Longer keys first so "united arab emirates" wins over a stray "emirates", etc.
const COUNTRY_KEYS = Object.keys(COUNTRY_TO_ISO).sort((a, b) => b.length - a.length);
const CITY_KEYS = Object.keys(CITY_TO_ISO).sort((a, b) => b.length - a.length);

/**
 * Best-effort ISO2 country code from a free-text location and/or CV country.
 * Country names take priority over cities; returns undefined if unknown.
 */
/** Match a single free-text string to an ISO2 (country name first, then city). */
function matchOne(text?: string): string | undefined {
  const hay = (text ?? "").toLowerCase();
  if (!hay.trim()) return undefined;
  for (const name of COUNTRY_KEYS) {
    if (contains(hay, name)) return COUNTRY_TO_ISO[name];
  }
  for (const city of CITY_KEYS) {
    if (contains(hay, city)) return CITY_TO_ISO[city];
  }
  return undefined;
}

export function countryCodeFrom(location?: string, cvCountry?: string): string | undefined {
  // The TYPED location wins — only fall back to the CV's country when the typed
  // location doesn't name a place. (Otherwise a CV country like "Australia"
  // would override every location the user types.)
  return matchOne(location) ?? matchOne(cvCountry);
}

/**
 * Fallback market for the platform's core audience. When no country can be
 * derived we target the Gulf / Middle East instead of JSearch's silent US
 * default (VoiceCV serves Gulf + South-Asian workers, not the US market).
 * Saudi Arabia is the primary market (Vision 2030); UAE is the secondary.
 */
export const DEFAULT_COUNTRY = "sa";

/** Gulf fallback order tried when a search finds nothing — Saudi first, then UAE. */
export const GULF_FALLBACK_ORDER = ["sa", "ae"];
