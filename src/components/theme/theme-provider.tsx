/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  toggleHighContrast: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("storybook-theme");
    if (stored) {
      const parsed = JSON.parse(stored) as { theme: Theme; highContrast: boolean };
      setThemeState(parsed.theme);
      setHighContrast(parsed.highContrast ?? false);
    }
  }, []);

  useEffect(() => {
    const mode = theme === "system" ? resolveSystemTheme() : theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    localStorage.setItem("storybook-theme", JSON.stringify({ theme, highContrast }));
  }, [theme, highContrast]);

  const value = useMemo(
    (): ThemeContextValue => ({
      theme,
      setTheme: setThemeState,
      highContrast,
      toggleHighContrast: setHighContrast
    }),
    [theme, highContrast]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
