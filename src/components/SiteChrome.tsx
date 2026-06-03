import { Link, useRouterState } from "@tanstack/react-router";
import { Trophy, Shield } from "lucide-react";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-fire flex items-center justify-center shadow-red">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Sorte<span className="text-gradient-gold">Premiada</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" hash="premio" className="hover:text-gold transition-colors">Prêmio</Link>
          <Link to="/" hash="ganhadores" className="hover:text-gold transition-colors">Ganhadores</Link>
          <Link to="/" hash="regras" className="hover:text-gold transition-colors">Regras</Link>
        </nav>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-success" />
          <span className="hidden sm:inline">Site Seguro</span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="border-t border-border/40 bg-card/50 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="font-display font-bold">SortePremiada</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Promoções transparentes, sorteios auditados e prêmios entregues em todo o Brasil.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Segurança</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Pagamento criptografado</li>
            <li>✓ LGPD compliant</li>
            <li>✓ Sorteio auditado</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>WhatsApp: (11) 99999-9999</li>
            <li>contato@sortepremiada.com</li>
            <li>Seg–Sex 9h–18h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SortePremiada. Maiores de 18 anos. Jogue com responsabilidade.
      </div>
    </footer>
  );
}
