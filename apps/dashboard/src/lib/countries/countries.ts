// ISO 3166-1 alpha-2 codes (officially assigned), the values stored in
// bookings.destination_country. Names come from Intl.DisplayNames, so
// they follow the UI language without a translation table.
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
  "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
  "UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

export const COUNTRY_CODES: readonly string[] = CODES.split(" ");

export function isCountryCode(value: string): boolean {
  return COUNTRY_CODES.includes(value);
}

const displayNamesCache = new Map<string, Intl.DisplayNames>();

// "TR" -> "Türkiye" / "تركيا". Falls back to the code itself.
export function countryName(code: string, intlLocale: string): string {
  let names = displayNamesCache.get(intlLocale);
  if (!names) {
    names = new Intl.DisplayNames([intlLocale], { type: "region" });
    displayNamesCache.set(intlLocale, names);
  }
  return names.of(code) ?? code;
}

// Every country, sorted by its name in the given language.
export function countryOptions(intlLocale: string): { code: string; name: string }[] {
  const collator = new Intl.Collator(intlLocale);
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, intlLocale) })).sort((a, b) =>
    collator.compare(a.name, b.name),
  );
}
