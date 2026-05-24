"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY   = "reframed_theme";
const EVENT = "reframed:theme";

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) ?? "dark") as Theme;
    setThemeState(saved);
    apply(saved);

    function handleChange(e: Event) {
      setThemeState((e as CustomEvent<Theme>).detail);
    }
    window.addEventListener(EVENT, handleChange);
    return () => window.removeEventListener(EVENT, handleChange);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(KEY, t);
    apply(t);
    window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: t }));
  }

  return { theme, setTheme };
}
