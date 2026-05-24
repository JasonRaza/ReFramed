"use client";

import { useEffect, useState } from "react";

export type Locale = "fr" | "en";
const KEY = "reframed_locale";

const TRANSLATIONS = {
  fr: {
    // Settings
    settings:         "Paramètres",
    appearance:       "Apparence",
    darkMode:         "Mode sombre",
    lightMode:        "Mode clair",
    account:          "Compte",
    changePassword:   "Changer le mot de passe",
    newPassword:      "Nouveau mot de passe",
    confirmPassword:  "Confirmer le mot de passe",
    update:           "Mettre à jour",
    updating:         "Mise à jour…",
    updated:          "Mot de passe mis à jour !",
    cancel:           "Annuler",
    language:         "Langue",
    passwordMin:      "Au moins 6 caractères",
    passwordMatch:    "Les mots de passe correspondent",
    passwordNoMatch:  "Les mots de passe ne correspondent pas",
    // Nav
    home:             "Accueil",
    rankings:         "Classement",
    profile:          "Profil",
  },
  en: {
    // Settings
    settings:         "Settings",
    appearance:       "Appearance",
    darkMode:         "Dark mode",
    lightMode:        "Light mode",
    account:          "Account",
    changePassword:   "Change password",
    newPassword:      "New password",
    confirmPassword:  "Confirm password",
    update:           "Update",
    updating:         "Updating…",
    updated:          "Password updated!",
    cancel:           "Cancel",
    language:         "Language",
    passwordMin:      "At least 6 characters",
    passwordMatch:    "Passwords match",
    passwordNoMatch:  "Passwords do not match",
    // Nav
    home:             "Home",
    rankings:         "Rankings",
    profile:          "Profile",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.fr;

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) ?? "fr") as Locale;
    setLocaleState(saved);
    document.documentElement.lang = saved;
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }

  const t = TRANSLATIONS[locale];
  return { locale, setLocale, t };
}
