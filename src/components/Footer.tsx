import { Link } from "@tanstack/react-router";
import lgSignature from "@/assets/lg-signature.png";
import { WHATSAPP_NUMBER } from "@/lib/supabase";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.11 4.91A10 10 0 0 0 4.07 18.2L3 22l3.9-1.02a10 10 0 0 0 12.21-16.07Zm-7.1 15.18a8.32 8.32 0 0 1-4.24-1.16l-.3-.18-2.32.61.62-2.26-.2-.32a8.31 8.31 0 1 1 6.44 3.31Zm4.55-6.23c-.25-.12-1.47-.73-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06a6.83 6.83 0 0 1-2-1.23 7.55 7.55 0 0 1-1.39-1.73c-.14-.25 0-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.87 2.07c0 1.22.89 2.4 1.01 2.57.13.17 1.76 2.68 4.27 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.17-.06-.1-.23-.17-.48-.29Z"/>
    </svg>
  );
}
function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  const wa = `https://wa.me/258${WHATSAPP_NUMBER.replace(/\D/g, "")}`;
  const ig = "https://instagram.com/"; // 👈 substituir pelo handle real
  return (
    <footer className="mt-24 border-t border-border/60 bg-black/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-[0.18em] text-gold">AURA</span>
            <span className="font-display text-2xl font-light tracking-[0.18em]">SCENTRA</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Perfumes premium entregues em todo Moçambique. Sinta a sua melhor versão todos os dias.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href={wa} target="_blank" rel="noreferrer noopener" aria-label="WhatsApp"
               className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-gold">
              <WhatsAppIcon />
            </a>
            <a href={ig} target="_blank" rel="noreferrer noopener" aria-label="Instagram"
               className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-gold">
              <InstagramIcon />
            </a>
          </div>
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
        <div>
          <h4 className="mb-3 text-xs uppercase tracking-widest text-gold">Ajuda</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/trocas-devolucoes" className="hover:text-foreground">Trocas e Devoluções</Link></li>
            <li><Link to="/formas-pagamento" className="hover:text-foreground">Formas de Pagamento</Link></li>
            <li><Link to="/prazo-entrega" className="hover:text-foreground">Prazo de Entrega</Link></li>
            <li><Link to="/politica-privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
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