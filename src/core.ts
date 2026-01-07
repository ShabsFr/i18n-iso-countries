import codes from "./codes.json" with { type: "json" };
import supportedLocales from "./supportedLocales.json" with { type: "json" };
import { remove as removeDiacritics } from "diacritics";

type Alpha2Code = string;
type Alpha3Code = string;
type NumericCode = string;
type CodeType = "alpha2" | "alpha3";

type CountryName = string | string[];
type LocalizedCountryNames = Record<Alpha2Code, CountryName>;

export interface LocaleData {
  locale: string;
  countries: LocalizedCountryNames;
}

interface GetNameOptions {
  select?: "all" | "official" | "alias";
}

let _registeredLocales: Record<string, LocalizedCountryNames> = {};

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

export const isValid = (code: string | number) => {
  if (code === null || code === undefined || code === "") return false;

  return !!toAlpha2(code) || !!toAlpha3(code) || !!numericToAlpha2(code);
};

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

export function alpha2ToAlpha3(code: Alpha2Code): Alpha3Code | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([a2]) => a2 === code.toUpperCase(),
  );
  return entry ? entry[1] : undefined;
}

export function alpha3ToAlpha2(code: Alpha3Code): Alpha2Code | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([, a3]) => a3 === code.toUpperCase(),
  );
  return entry ? entry[0] : undefined;
}

export function alpha2ToNumeric(code: Alpha2Code): NumericCode | undefined {
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([a2]) => a2 === code.toUpperCase(),
  );
  return entry ? entry[2] : undefined;
}

export function alpha3ToNumeric(code: Alpha3Code): NumericCode | undefined {
  const a2 = alpha3ToAlpha2(code);
  return a2 ? alpha2ToNumeric(a2) : undefined;
}

export function numericToAlpha2(code: number | string): Alpha2Code | undefined {
  const padded = formatNumericCode(code);
  const entry = (codes as [Alpha2Code, Alpha3Code, NumericCode][]).find(
    ([, , num]) => num === padded,
  );
  return entry ? entry[0] : undefined;
}

export function numericToAlpha3(code: number | string): Alpha3Code | undefined {
  const a2 = numericToAlpha2(code);
  return a2 ? alpha2ToAlpha3(a2) : undefined;
}

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

export function langs(): string[] {
  return Object.keys(_registeredLocales);
}

export function getSupportedLanguages(): string[] {
  return supportedLocales as string[];
}
