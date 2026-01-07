import codes from "./codes.json" with { type: "json" };
import supportedLocales from "./supportedLocales.json" with { type: "json" };
import { remove as removeDiacritics } from "diacritics";

type Alpha2Code = string;
type Alpha3Code = string;
type NumericCode = string;
type CodeType = "alpha2" | "alpha3";

type CountryName = string | string[];
type LocalizedCountryNames = Record<Alpha2Code, CountryName>;

/**
 * Locale data structure containing language code and country names mapping
 */
export interface LocaleData {
  locale: string;
  countries: LocalizedCountryNames;
}

/**
 * Options for filtering country names by type
 */
interface GetNameOptions {
  select?: "all" | "official" | "alias";
}

let _registeredLocales: Record<string, LocalizedCountryNames> = {};

/**
 * Registers a locale with country names for a specific language.
 * Validates the locale data structure before registration.
 *
 * @param localeData - The locale data object containing language code and country mappings
 * @throws {TypeError} If localeData is invalid or missing required properties
 *
 * @example
 * ```typescript
 * registerLocale({
 *   locale: 'es',
 *   countries: { 'ES': 'España', 'US': 'Estados Unidos' }
 * });
 * ```
 */
export function registerLocale(localeData: LocaleData): void {
  if (!localeData || typeof localeData !== "object") {
    throw new TypeError("localeData must be an object");
  }

  if (!localeData.locale || typeof localeData.locale !== "string") {
    throw new TypeError("Missing or invalid localeData.locale");
  }

  if (!localeData.countries || typeof localeData.countries !== "object") {
    throw new TypeError("Missing or invalid localeData.countries");
  }

  _registeredLocales = {
    ..._registeredLocales,
    [localeData.locale]: localeData.countries,
  };
}

const isValidLanguage = (lang: string) => {
  return typeof lang === "string" && lang.length > 0;
};

const formatNumericCode = (code?: number | string) => {
  const stringCode = String(code ?? "");

  return ("000" + stringCode).slice(-3);
};

/**
 * Validates if a country code is valid (Alpha-2, Alpha-3, or numeric format)
 *
 * @param code - Country code to validate (string or number)
 * @returns true if the code is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValid('ES');   // true
 * isValid('ESP');  // true
 * isValid(724);    // true
 * isValid('XX');   // false
 * ```
 */
export const isValid = (code: string | number) => {
  if (code === null || code === undefined || code === "") return false;

  return !!toAlpha2(code) || !!toAlpha3(code) || !!numericToAlpha2(code);
};

/**
 * Searches for a country by name in a specific language
 *
 * @internal
 */
function searchCountryByName(
  name: string,
  lang: string,
  normalize: (s: string) => string,
): Alpha2Code | undefined {
  if (!name || !isValidLanguage(lang)) return undefined;

  const codenames = _registeredLocales[lang.toLowerCase()];
  if (!codenames) return undefined;

  const normalizedInput = normalize(name);

  return Object.entries(codenames).find(([code, value]) => {
    if (typeof value === "string") {
      return normalize(value) === normalizedInput;
    } else if (Array.isArray(value)) {
      return value.some(
        (n) => typeof n === "string" && normalize(n) === normalizedInput,
      );
    }
    return false;
  })?.[0];
}

/**
 * Filters country names based on selection type (official, all, or alias)
 *
 * @internal
 */
function filterNameBy(
  type: NonNullable<GetNameOptions["select"]>,
  countryNameList: CountryName,
): CountryName {
  switch (type) {
    case "official":
      return Array.isArray(countryNameList)
        ? (countryNameList[0] ?? "")
        : countryNameList;
    case "all":
      return typeof countryNameList === "string"
        ? [countryNameList]
        : countryNameList;
    case "alias":
      return Array.isArray(countryNameList)
        ? (countryNameList[1] ?? countryNameList[0] ?? "")
        : countryNameList;
  }
}

/**
 * Converts an Alpha-2 country code to Alpha-3 format
 *
 * @param code - Alpha-2 country code (case-insensitive)
 * @returns Alpha-3 code or undefined if not found
 *
 * @example
 * ```typescript
 * alpha2ToAlpha3('ES');  // 'ESP'
 * alpha2ToAlpha3('XX');  // undefined
 * ```
 */
export function alpha2ToAlpha3(code: Alpha2Code): Alpha3Code | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([a2]) => a2 === code.toUpperCase(),
  );
  return entry ? entry[1] : undefined;
}

/**
 * Converts an Alpha-3 country code to Alpha-2 format
 *
 * @param code - Alpha-3 country code (case-insensitive)
 * @returns Alpha-2 code or undefined if not found
 *
 * @example
 * ```typescript
 * alpha3ToAlpha2('ESP');  // 'ES'
 * alpha3ToAlpha2('XXX');  // undefined
 * ```
 */
export function alpha3ToAlpha2(code: Alpha3Code): Alpha2Code | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([, a3]) => a3 === code.toUpperCase(),
  );
  return entry ? entry[0] : undefined;
}

/**
 * Converts an Alpha-2 country code to numeric format
 *
 * @param code - Alpha-2 country code (case-insensitive)
 * @returns Numeric code as string (zero-padded to 3 digits) or undefined if not found
 *
 * @example
 * ```typescript
 * alpha2ToNumeric('ES');  // '724'
 * alpha2ToNumeric('XX');  // undefined
 * ```
 */
export function alpha2ToNumeric(code: Alpha2Code): NumericCode | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([a2]) => a2 === code.toUpperCase(),
  );
  return entry ? entry[2] : undefined;
}

/**
 * Converts an Alpha-3 country code to numeric format
 *
 * @param code - Alpha-3 country code (case-insensitive)
 * @returns Numeric code as string (zero-padded to 3 digits) or undefined if not found
 *
 * @example
 * ```typescript
 * alpha3ToNumeric('ESP');  // '724'
 * alpha3ToNumeric('XXX');  // undefined
 * ```
 */
export function alpha3ToNumeric(code: Alpha3Code): NumericCode | undefined {
  const a2 = alpha3ToAlpha2(code);
  return a2 ? alpha2ToNumeric(a2) : undefined;
}

/**
 * Converts a numeric country code to Alpha-2 format
 *
 * @param code - Numeric country code (string or number)
 * @returns Alpha-2 code or undefined if not found
 *
 * @example
 * ```typescript
 * numericToAlpha2('724');  // 'ES'
 * numericToAlpha2(724);    // 'ES'
 * numericToAlpha2('999');  // undefined
 * ```
 */
export function numericToAlpha2(code: number | string): Alpha2Code | undefined {
  const padded = formatNumericCode(code);
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([, , num]) => num === padded,
  );
  return entry ? entry[0] : undefined;
}

/**
 * Converts a numeric country code to Alpha-3 format
 *
 * @param code - Numeric country code (string or number)
 * @returns Alpha-3 code or undefined if not found
 *
 * @example
 * ```typescript
 * numericToAlpha3('724');  // 'ESP'
 * numericToAlpha3(724);    // 'ESP'
 * ```
 */
export function numericToAlpha3(code: number | string): Alpha3Code | undefined {
  const a2 = numericToAlpha2(code);
  return a2 ? alpha2ToAlpha3(a2) : undefined;
}

/**
 * Normalizes any country code format to Alpha-3
 * Automatically detects input format (Alpha-2, Alpha-3, or numeric)
 *
 * @param code - Country code in any format (case-insensitive for strings)
 * @returns Normalized Alpha-3 code or undefined if invalid
 *
 * @example
 * ```typescript
 * toAlpha3('ES');   // 'ESP'
 * toAlpha3('ESP');  // 'ESP'
 * toAlpha3(724);    // 'ESP'
 * toAlpha3('724');  // 'ESP'
 * ```
 */
export function toAlpha3(code: string | number): Alpha3Code | undefined {
  if (code === null || code === undefined || code === "") return undefined;

  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) return numericToAlpha3(code);
    if (code.length === 2) return alpha2ToAlpha3(code.toUpperCase());
    if (code.length === 3) return code.toUpperCase();
    return undefined;
  }

  return numericToAlpha3(code);
}

/**
 * Normalizes any country code format to Alpha-2
 * Automatically detects input format (Alpha-2, Alpha-3, or numeric)
 *
 * @param code - Country code in any format (case-insensitive for strings)
 * @returns Normalized Alpha-2 code or undefined if invalid
 *
 * @example
 * ```typescript
 * toAlpha2('ES');   // 'ES'
 * toAlpha2('ESP');  // 'ES'
 * toAlpha2(724);    // 'ES'
 * toAlpha2('724');  // 'ES'
 * ```
 */
export function toAlpha2(code: string | number): Alpha2Code | undefined {
  if (code === null || code === undefined || code === "") return undefined;

  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) return numericToAlpha2(code);
    if (code.length === 2) return code.toUpperCase();
    if (code.length === 3) return alpha3ToAlpha2(code.toUpperCase());
    return undefined;
  }

  return numericToAlpha2(code);
}

/**
 * Gets the country name in a specific language
 *
 * @param code - Country code in any format (Alpha-2, Alpha-3, or numeric)
 * @param lang - Language code (e.g., 'es', 'en')
 * @param options - Optional filters for name selection
 * @param options.select - Type of name to return: 'official' (default), 'all', or 'alias'
 * @returns Country name(s) or undefined if not found or language not registered
 *
 * @example
 * ```typescript
 * getName('ES', 'es');  // 'España'
 * getName('ES', 'es', { select: 'all' });  // ['España', 'Reino de España']
 * getName('ES', 'en');  // 'Spain'
 * getName('XX', 'es');  // undefined
 * ```
 */
export function getName(
  code: string | number,
  lang: string,
  options: GetNameOptions = {},
): CountryName | undefined {
  if (!isValidLanguage(lang)) return undefined;

  const select = options.select ?? "official";
  const codeMaps = _registeredLocales[lang.toLowerCase()];
  if (!codeMaps) return undefined;

  const alpha2Code = toAlpha2(code);
  if (!alpha2Code) return undefined;

  const nameList = codeMaps[alpha2Code];
  if (!nameList) return undefined;

  return filterNameBy(select, nameList);
}

/**
 * Searches for a country code by its name in a specific language
 *
 * @param name - Country name to search for
 * @param lang - Language code to search in (e.g., 'es', 'en')
 * @param options - Optional configuration for search behavior
 * @param options.type - Return format: 'alpha2' (default) or 'alpha3'
 * @param options.simple - If true, ignores diacritics/accents in comparison
 * @returns Country code or undefined if not found or language not registered
 *
 * @example
 * ```typescript
 * getCode('España', 'es');  // 'ES'
 * getCode('España', 'es', { type: 'alpha3' });  // 'ESP'
 * getCode('Spain', 'en', { simple: true });  // 'ES'
 * getCode('Unknown', 'es');  // undefined
 * ```
 */
export function getCode(
  name: string,
  lang: string,
  options: { type?: CodeType; simple?: boolean } = {},
): Alpha2Code | Alpha3Code | undefined {
  const { type = "alpha2", simple = false } = options;

  const normalize = simple
    ? (s: string) => removeDiacritics(s.toLowerCase())
    : (s: string) => s.toLowerCase();

  const a2 = searchCountryByName(name, lang, normalize);
  if (!a2) return undefined;

  return type === "alpha2" ? a2 : toAlpha3(a2);
}

/**
 * Returns all currently registered language codes
 *
 * @returns Array of registered language codes
 *
 * @example
 * ```typescript
 * langs();  // ['es', 'en', 'fr']
 * ```
 */
export function langs(): string[] {
  return Object.keys(_registeredLocales);
}

/**
 * Returns all supported language codes from the default configuration
 *
 * @returns Array of supported language codes
 *
 * @example
 * ```typescript
 * getSupportedLanguages();  // ['es', 'en', 'fr', 'de', ...]
 * ```
 */
export function getSupportedLanguages(): string[] {
  return supportedLocales as string[];
}
