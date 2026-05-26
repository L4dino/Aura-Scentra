import { Link } from "@tanstack/react-router";
import lgSignature from "@/assets/lg-signature.png";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-black/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-[0.18em] text-gold">AURA</span>
            <span className="font-display text-2xl font-light tracking-[0.18em]">SCENTRA</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Perfumes premium entregues em todo Moçambique. Sinta a sua melhor versão todos os dias.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs uppercase tracking-widest text-gold">Loja</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalogo" className="hover:text-foreground">Catálogo</Link></li>
            <li><Link to="/favoritos" className="hover:text-foreground">Favoritos</Link></li>
            <li><Link to="/nhoguista" className="hover:text-foreground">Seja Nhoguista</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs uppercase tracking-widest text-gold">Institucional</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-foreground">Sobre nós</Link></li>
            <li><Link to="/contactos" className="hover:text-foreground">Contactos</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-4 text-xs text-muted-foreground/70 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img src={lgSignature} alt="" className="h-5 w-auto opacity-30 invert" />
            <span>© {new Date().getFullYear()} AURA SCENTRA</span>
          </div>
          <span>Pagamentos em MZN • Moçambique</span>
        </div>
      </div>
    </footer>
  );
}