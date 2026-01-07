import { registerLocale, type LocaleData } from "./core.js";

const localeModules = import.meta.glob("./langs/*.json");

export const importLocale = async (lang: string) => {
  const path = `./langs/${lang}.json`;
  const loader = localeModules[path];
  if (!loader) throw new Error(`Unsupported locale: ${lang}`);
  const module = await loader();
  return (module as { default?: LocaleData }).default ?? (module as LocaleData);
};

export const loadLocale = async (lang: string) => {
  const locale = await importLocale(lang);

  registerLocale(locale);
};
