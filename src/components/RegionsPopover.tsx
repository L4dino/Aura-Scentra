import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { normalizeProvincias } from "@/lib/region";

export function RegionsPopover({ value, className = "" }: { value: unknown; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const provincias = normalizeProvincias(value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (provincias.length === 0) return null;

  if (provincias.length === 1) {
    return (
      <p className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold ${className}`}>
        <MapPin className="h-3.5 w-3.5" /> Disponível em {provincias[0]}
      </p>
    );
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-widest text-gold transition hover:bg-gold/10"
        aria-expanded={open}
      >
        <MapPin className="h-3.5 w-3.5" /> Ver regiões ({provincias.length})
      </button>
      {open && (
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="absolute left-0 top-full z-30 mt-2 w-56 rounded-md border border-border bg-popover p-3 text-sm shadow-xl"
        >
          <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Disponível em</p>
          <ul className="space-y-1">
            {provincias.map((provincia) => (
              <li key={provincia} className="flex items-center gap-2 text-foreground">
                <MapPin className="h-3 w-3 text-gold" /> {provincia}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}