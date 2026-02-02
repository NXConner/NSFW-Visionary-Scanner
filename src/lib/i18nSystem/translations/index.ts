import type { Language, TranslationDictionary } from "../types";
import { ar } from "./ar";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { zh } from "./zh";

export const translations: Record<Language, TranslationDictionary> = {
  en,
  es,
  fr,
  de,
  pt,
  it,
  zh,
  ja,
  ko,
  ar,
};

export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
};
