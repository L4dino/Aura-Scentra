import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PROVINCIAS = [
  "Maputo",
  "Matola",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
];

interface RegionState {
  active: boolean;
  provincia: string | null;
  setActive: (a: boolean) => void;
  setProvincia: (p: string) => void;
  toggle: () => void;
}

export const useRegion = create<RegionState>()(
  persist(
    (set) => ({
      active: false,
      provincia: null,
      setActive: (active) => set({ active }),
      setProvincia: (provincia) => set({ provincia }),
      toggle: () => set((s) => ({ active: !s.active })),
    }),
    { name: "aura-region" },
  ),
);

export async function detectRegion(): Promise<string | null> {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /Maputo/i.test(tz)) return "Maputo";
  } catch {
    /* noop */
  }
  try {
    // Backend proxy — token IPINFO_TOKEN nunca é exposto no frontend
    const r = await fetch("/api/public/geolocate", { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { provincia?: string };
    if (j.provincia) return j.provincia;
  } catch {
    /* noop */
  }
  return null;
}

export function normalizeProvincias(value: unknown): string[] {
  const normalizeList = (items: unknown[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (raw: string) => {
      const cleaned = raw.replace(/^"|"$/g, "").trim();
      const match = PROVINCIAS.find((p) => p.toLocaleLowerCase("pt-MZ") === cleaned.toLocaleLowerCase("pt-MZ"));
      if (match && !seen.has(match)) {
        seen.add(match);
        out.push(match);
      }
    };
    for (const item of items) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed || ["[", "]", '"', "'"].includes(trimmed)) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) normalizeList(parsed).forEach(add);
        else add(trimmed);
      } catch {
        add(trimmed);
      }
    }
    return out;
  };
  if (Array.isArray(value)) return normalizeList(value);
  if (typeof value !== "string" || !value.trim()) return [];
  const clean = value.trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return normalizeList(parsed);
  } catch {
    /* noop */
  }
  return normalizeList(clean.replace(/^\{|\}$/g, "").split(","));
}

export function isAvailableInRegion(provincias: unknown, regiao: string | null): boolean {
  const list = normalizeProvincias(provincias);
  if (list.length === 0) return true; // vazio/null = todas regiões
  if (!regiao) return true;
  return list.includes(regiao);
}