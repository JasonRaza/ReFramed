"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "reframed_theme";

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
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(KEY, t);
    apply(t);
  }

  return { theme, setTheme };
}
