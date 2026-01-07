# i18n-countries-ts

TypeScript library for converting ISO 3166-1 country codes and retrieving country names in multiple languages.

**Based on:** [node-i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries) but completely rewritten in TypeScript with Vite for a modern development experience.

## Features

- **Code conversions**: Convert between Alpha-2, Alpha-3, and numeric ISO codes
- **Localized names**: Get country names in multiple languages
- **Name search**: Find country codes by name in any registered language
- **Type-safe**: Fully typed in TypeScript
- **Immutability**: Loaded locales are immutable, preventing accidental mutations
- **Zero external dependencies**: Only diacritics for normalization

## Installation

```bash
npm install @shabsfr/i18n-countries
```

## Usage

### Register locales

First, register the language data you need:

```typescript
import { registerLocale } from "@shabsfr/i18n-countries";
import esLocale from "@shabsfr/i18n-countries/locales/es.json";
import enLocale from "@shabsfr/i18n-countries/locales/en.json";

registerLocale(esLocale);
registerLocale(enLocale);
```

### Convert codes

```typescript
import {
  alpha2ToAlpha3,
  alpha3ToAlpha2,
  toAlpha2,
  toAlpha3,
} from "@shabsfr/i18n-countries";

alpha2ToAlpha3("ES"); // 'ESP'
alpha3ToAlpha2("USA"); // 'US'
toAlpha2("840"); // 'US' (numeric code)
toAlpha3("FR"); // 'FRA'
```

### Get country names

```typescript
import { getName } from "@shabsfr/i18n-countries";

getName("ES", "es"); // 'España'
getName("US", "en"); // 'United States'
getName("FR", "es"); // 'Francia'

// Advanced options
getName("ES", "es", { select: "all" }); // ['España', 'Reino de España']
getName("ES", "es", { select: "official" }); // 'España'
getName("ES", "es", { select: "alias" }); // 'Reino de España'
```

### Search code by name

```typescript
import { getCode } from "@shabsfr/i18n-countries";

getCode("España", "es"); // 'ES'
getCode("España", "es", { type: "alpha3" }); // 'ESP'
getCode("Spain", "en", { simple: true }); // 'ES' (ignores accents)
```

### Utilities

```typescript
import { isValid, langs, getSupportedLanguages } from "@shabsfr/i18n-countries";

isValid("ES"); // true
isValid("XX"); // false
isValid("840"); // true (numeric code)

langs(); // Array of registered languages
getSupportedLanguages(); // Array of supported languages by default
```

## API

### Main functions

**`registerLocale(localeData: LocaleData): void`**
Registers localization data for a specific language.

**`alpha2ToAlpha3(code: Alpha2Code): Alpha3Code | undefined`**
Converts Alpha-2 code to Alpha-3.

**`alpha3ToAlpha2(code: Alpha3Code): Alpha2Code | undefined`**
Converts Alpha-3 code to Alpha-2.

**`toAlpha2(code: string | number): Alpha2Code | undefined`**
Normalizes any code format to Alpha-2.

**`toAlpha3(code: string | number): Alpha3Code | undefined`**
Normalizes any code format to Alpha-3.

**`getName(code: string | number, lang: string, options?: GetNameOptions): CountryName | undefined`**
Gets the name of a country in a specific language.

**`getCode(name: string, lang: string, options?: { type?: CodeType; simple?: boolean }): Alpha2Code | Alpha3Code | undefined`**
Searches for a country code by its name.

**`isValid(code: string | number): boolean`**
Validates if a code is valid.

**`langs(): string[]`**
Returns array of registered languages.

**`getSupportedLanguages(): string[]`**
Returns array of supported languages by default.

## Improvements over the original

- **Native TypeScript**: Written in TypeScript for full type safety
- **Immutability**: Registered locales cannot be modified after loading
- **Vite**: Modern build tooling
- **Better validation**: Runtime validation for data integrity
- **Modular architecture**: Well-organized and maintainable code

## License

MIT
