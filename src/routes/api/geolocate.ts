import { createFileRoute } from "@tanstack/react-router";

const PROVINCIAS = [
  "Maputo","Matola","Gaza","Inhambane","Sofala","Manica",
  "Tete","Zambézia","Nampula","Cabo Delgado","Niassa",
];

function matchProvincia(...candidates: (string | undefined | null)[]): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const found = PROVINCIAS.find((p) => p.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  return null;
}

export const Route = createFileRoute("/api/geolocate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.IPINFO_TOKEN;
        if (!token) {
          return Response.json({ provincia: null, error: "IPINFO_TOKEN missing" }, { status: 500 });
        }
        const fwd = request.headers.get("x-forwarded-for") ?? "";
        const ip = fwd.split(",")[0]?.trim();
        const url = ip
          ? `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${token}`
          : `https://ipinfo.io/json?token=${token}`;
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) return Response.json({ provincia: null }, { status: 200 });
          const j = (await r.json()) as { country?: string; region?: string; city?: string };
          if (j.country !== "MZ") return Response.json({ provincia: null });
          const provincia = matchProvincia(j.region, j.city);
          return Response.json(
            { provincia },
            { headers: { "cache-control": "private, max-age=600" } },
          );
        } catch {
          return Response.json({ provincia: null });
        }
      },
    },
  },
});