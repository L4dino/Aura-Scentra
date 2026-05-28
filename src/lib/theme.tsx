import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  hasChosen: boolean;
  markChosen: () => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
  hasChosen: true,
  markChosen: () => {},
});

const STORAGE_KEY = "aura-theme";
const CHOSEN_KEY = "aura-theme-chosen";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(t);
  root.style.colorScheme = t;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hasChosen, setHasChosen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const chosen = window.localStorage.getItem(CHOSEN_KEY) === "1";
    const initial: Theme = saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    setHasChosen(chosen);
    applyTheme(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, t);
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  const markChosen = () => {
    setHasChosen(true);
    if (typeof window !== "undefined") window.localStorage.setItem(CHOSEN_KEY, "1");
  };

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle, hasChosen, markChosen }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);

export function ThemePrompt() {
  const { hasChosen, setTheme, markChosen } = useTheme();
  if (hasChosen) return null;
  const choose = (t: Theme) => { setTheme(t); markChosen(); };
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <h3 className="font-display text-2xl">Bem-vindo à AURA SCENTRA</h3>
        <p className="mt-2 text-sm text-muted-foreground">Como prefere visualizar o site?</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => choose("light")}
            className="rounded-xl border border-border bg-white p-4 text-sm font-semibold text-neutral-900 transition hover:border-gold"
          >
            ☀ Claro
          </button>
          <button
            onClick={() => choose("dark")}
            className="rounded-xl border border-gold bg-neutral-950 p-4 text-sm font-semibold text-gold transition hover:opacity-90"
          >
            ☾ Escuro
          </button>
        </div>
        <button onClick={markChosen} className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
          Decidir depois
        </button>
      </div>
    </div>
  );
}