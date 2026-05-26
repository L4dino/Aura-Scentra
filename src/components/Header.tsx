import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Perfumes" },
  { to: "/nhoguista", label: "Nhoguista" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contactos", label: "Contactos" },
];

export function Header() {
  const count = useCart((s) => s.count());
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="bg-black/60 text-[11px] text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-center tracking-wide">
          <span>Entrega rápida em todo o país</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Produtos 100% originais</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold tracking-[0.18em] text-gold">
            AURA
          </span>
          <span className="font-display text-2xl font-light tracking-[0.18em] text-foreground/85">
            SCENTRA
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm tracking-wide text-foreground/80 transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to="/favoritos"
            className="rounded-full p-2 text-foreground/80 transition hover:bg-secondary hover:text-gold"
            aria-label="Favoritos"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to="/carrinho"
            className="relative rounded-full p-2 text-foreground/80 transition hover:bg-secondary hover:text-gold"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="hidden rounded-full px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-secondary lg:inline"
            >
              Admin
            </Link>
          )}
          <Link
            to={user ? "/conta" : "/auth"}
            className="ml-1 hidden rounded-full border border-gold/40 px-4 py-2 text-xs uppercase tracking-widest text-gold transition hover:bg-gold hover:text-primary-foreground sm:inline-flex"
          >
            {user ? "Conta" : "Entrar"}
          </Link>
          <button
            className="rounded-full p-2 text-foreground/80 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background/95 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="border-b border-border/40 py-3 text-sm tracking-wide text-foreground/85"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to={user ? "/conta" : "/auth"}
              className="py-3 text-sm uppercase tracking-widest text-gold"
              onClick={() => setOpen(false)}
            >
              {user ? "Minha conta" : "Entrar"}
            </Link>
            {profile?.is_admin && (
              <Link to="/admin" className="py-3 text-sm uppercase tracking-widest text-gold" onClick={() => setOpen(false)}>
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}