import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrizeWheel } from "@/components/PrizeWheel";
import { Countdown } from "@/components/Countdown";
import { brl } from "@/lib/format";
import { saveCart } from "@/lib/cart-store";
import xiaomiHero from "@/assets/xiaomi-hero.jpg";
import {
  Trophy, Shield, Clock, Users, Star, CheckCircle2,
  Smartphone, Camera, Battery, Cpu, Award, Lock, CreditCard,
  Truck, HelpCircle, Gift, Zap
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SortePremiada — Concorra a um Xiaomi Redmi Note 13 Pro" },
      { name: "description", content: "Gire a roleta e concorra a um Xiaomi Redmi Note 13 Pro. Promoção transparente, pagamento via PIX e entrega em todo Brasil." },
    ],
  }),
  component: HomePage,
});

type Promotion = {
  id: string; name: string; prize_name: string; prize_value: number;
  ticket_price: number; odds: string; rules: string;
  participants_count: number; stock: number;
};
type Winner = { id: string; name: string; city: string | null; prize: string; won_at: string };
type Testimonial = { id: string; name: string; rating: number; text: string; city: string | null };

function HomePage() {
  const navigate = useNavigate();
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [liveCount, setLiveCount] = useState(847);
  const [won, setWon] = useState(false);

  // Flash promotion ends in 4 hours from first visit (persisted)
  const promoEnd = useMemo(() => {
    if (typeof window === "undefined") return new Date(Date.now() + 4 * 3600 * 1000);
    const key = "promo_end_ts";
    const stored = localStorage.getItem(key);
    if (stored) {
      const ts = parseInt(stored, 10);
      if (!isNaN(ts) && ts > Date.now()) return new Date(ts);
    }
    const ts = Date.now() + 4 * 3600 * 1000;
    localStorage.setItem(key, ts.toString());
    return new Date(ts);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("promotions").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (p) { setPromo(p as Promotion); setLiveCount(p.participants_count); }
      const { data: w } = await supabase.from("winners").select("*").order("won_at", { ascending: false }).limit(8);
      if (w) setWinners(w as Winner[]);
      const { data: t } = await supabase.from("testimonials").select("*").limit(8);
      if (t) setTestimonials(t as Testimonial[]);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveCount((n) => n + Math.floor(Math.random() * 3)), 4500);
    return () => clearInterval(id);
  }, []);

  const handleWin = () => {
    setWon(true);
    if (promo) {
      saveCart({
        promotion_id: promo.id,
        ticket_price: 0,
        upsells: [],
        shipping: 19.9,
      });
    }
    setTimeout(() => {
      document.getElementById("win-modal")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  const economia = promo ? Number(promo.prize_value) : 0;

  return (
    <>
      {/* Live ticker — professional, no emojis */}
      <div className="bg-fire text-primary-foreground overflow-hidden text-xs sm:text-sm font-semibold">
        <div className="flex animate-ticker whitespace-nowrap py-2">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-10 px-4">
              <span>Promoção ativa por tempo limitado</span>
              <span>Pagamento 100% via PIX</span>
              <span>+1.200 prêmios entregues</span>
              <span>Entrega em todo o Brasil</span>
              <span>Sorteio transparente e auditado</span>
              <span>Site seguro SSL</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO — roleta + countdown em primeiro plano */}
      <section id="roleta" className="relative bg-hero overflow-hidden">
        <div className="container mx-auto px-4 py-10 md:py-16">
          {/* Countdown bar */}
          <div className="max-w-2xl mx-auto rounded-2xl bg-card/80 backdrop-blur border border-gold/30 px-5 py-4 mb-8 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Promoção relâmpago termina em
            </div>
            <Countdown target={promoEnd} />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Wheel first */}
            <div className="order-1 lg:order-1 flex flex-col items-center">
              <PrizeWheel onWin={handleWin} disabled={won} />
              <p className="mt-5 text-sm text-muted-foreground text-center max-w-sm">
                Gire grátis e descubra seu prêmio. Sorteio transparente e auditado.
              </p>
            </div>

            {/* Basic info */}
            <div className="order-2 lg:order-2 space-y-5 animate-float-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                {liveCount.toLocaleString("pt-BR")} participantes ativos
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.05]">
                Concorra GRÁTIS a um <span className="text-gradient-gold">Xiaomi Redmi Note 13 Pro</span>
              </h1>
              <p className="text-base text-muted-foreground max-w-xl">
                Participação <span className="text-gold font-bold">100% gratuita</span>. Você paga apenas
                o frete de <span className="text-foreground font-bold">{brl(19.9)}</span> para receber seu
                prêmio em casa. Smartphone avaliado em <span className="text-foreground font-bold">{brl(Number(promo?.prize_value ?? 2499))}</span>.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md">
                <Stat icon={Users} label="Participantes" value={liveCount.toLocaleString("pt-BR")} />
                <Stat icon={Trophy} label="Prêmios" value="1.200+" />
                <Stat icon={Shield} label="Auditado" value="100%" />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <a href="#premio" className="px-7 py-3.5 rounded-full bg-fire text-primary-foreground font-bold shadow-red hover:scale-105 transition-transform inline-flex items-center gap-2">
                  Ver o Prêmio
                </a>
                <a href="#regras" className="px-7 py-3.5 rounded-full border border-border bg-card font-semibold hover:bg-muted transition-colors">
                  Como Funciona
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-success" /> SSL Seguro</div>
                <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-success" /> PIX Aprovado</div>
                <div className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-success" /> Sorteio Auditado</div>
              </div>
            </div>
          </div>

          {won && (
            <div id="win-modal" className="mt-12 max-w-xl mx-auto rounded-3xl bg-card border-2 border-gold p-8 text-center shadow-gold animate-float-up">
              <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
              <h3 className="font-display text-3xl font-bold text-gradient-gold mb-2">Parabéns!</h3>
              <p className="text-muted-foreground mb-6">
                Você desbloqueou o acesso ao sorteio do <strong className="text-foreground">{promo?.prize_name}</strong>.
                Conclua sua participação agora.
              </p>
              <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6 text-sm">
                <div className="text-success font-bold mb-1">Participação 100% gratuita</div>
                <div className="text-muted-foreground">Você paga apenas o frete de {brl(19.9)} para receber um prêmio de {brl(Number(promo?.prize_value ?? 2499))}</div>
              </div>
              <button
                onClick={() => navigate({ to: "/upsells" })}
                className="w-full px-8 py-4 rounded-full bg-fire text-primary-foreground font-bold shadow-red hover:scale-[1.02] transition-transform"
              >
                Continuar e Garantir Prêmio
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PRÊMIO */}
      <section id="premio" className="py-16 md:py-24">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <img src={xiaomiHero} alt="Xiaomi Redmi Note 13 Pro" loading="lazy" width={1024} height={1024} className="w-full max-w-md mx-auto rounded-3xl" />
          <div className="space-y-5">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Xiaomi Redmi Note 13 Pro <span className="text-gradient-gold">256GB</span>
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gold">{brl(Number(promo?.prize_value ?? 2499))}</span>
              <span className="text-sm text-muted-foreground line-through">{brl(2899)}</span>
              <span className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-bold">-14%</span>
            </div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <Spec icon={Smartphone} label="Tela AMOLED 6.67” 120Hz" />
              <Spec icon={Camera} label="Câmera 200MP OIS" />
              <Spec icon={Cpu} label="Snapdragon 7s Gen 2" />
              <Spec icon={Battery} label="Bateria 5100mAh" />
            </ul>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 border border-gold/20 p-5">
              <div className="text-sm text-muted-foreground">Valor do prêmio</div>
              <div className="text-2xl font-bold text-gradient-gold">{brl(Number(promo?.prize_value ?? 2499))}</div>
              <div className="text-xs text-muted-foreground mt-1">Participação gratuita — pague apenas {brl(19.9)} de frete</div>
            </div>
          </div>
        </div>
      </section>

      {/* GANHADORES */}
      <section id="ganhadores" className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Últimos ganhadores</h2>
            <p className="text-muted-foreground mt-2">Pessoas reais. Prêmios reais. Entrega comprovada.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {winners.map((w) => (
              <div key={w.id} className="rounded-2xl bg-card border border-border p-5 hover:border-gold/50 transition-colors">
                <Trophy className="w-6 h-6 text-gold mb-3" />
                <div className="font-display font-bold">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.city}</div>
                <div className="mt-3 text-sm text-gradient-gold font-semibold">{w.prize}</div>
                <div className="mt-2 text-xs text-muted-foreground">{new Date(w.won_at).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">O que dizem nossos clientes</h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 fill-gold text-gold" />)}
              <span className="ml-2 text-sm text-muted-foreground">4.9 / 5 — 2.847 avaliações</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl bg-card border border-border p-5 space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <p className="text-sm text-muted-foreground">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGRAS */}
      <section id="regras" className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-3">Regras e transparência</h2>
          <p className="text-center text-muted-foreground mb-10">Tudo claro, sem letras miúdas.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: CheckCircle2, t: "Sorteio transparente", d: "Resultados auditados e divulgados publicamente." },
              { icon: Clock, t: "Prazo definido", d: "Sorteio em até 7 dias após atingir o mínimo de participantes." },
              { icon: Shield, t: "Seguro e legal", d: "Conforme legislação. Apenas maiores de 18 anos." },
              { icon: Trophy, t: "Entrega garantida", d: "Frete grátis para o ganhador em todo o Brasil." },
            ].map((r) => (
              <div key={r.t} className="rounded-2xl bg-card border border-border p-5 flex gap-3">
                <r.icon className="w-6 h-6 text-gold shrink-0" />
                <div>
                  <div className="font-display font-semibold">{r.t}</div>
                  <div className="text-sm text-muted-foreground">{r.d}</div>
                </div>
              </div>
            ))}
          </div>
          {promo && (
            <div className="mt-6 rounded-2xl bg-card border border-border p-6 text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Odds: </strong>{promo.odds}
              <br /><br />
              {promo.rules}
            </div>
          )}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Como funciona</h2>
            <p className="text-muted-foreground mt-2">3 passos simples para concorrer ao seu prêmio.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Zap, n: "01", t: "Gire a roleta", d: "Clique no botão e gire grátis. Descubra na hora qual prêmio você desbloqueou." },
              { icon: Truck, n: "02", t: "Confirme o frete", d: "Preencha seus dados de entrega e pague apenas o frete via PIX para garantir sua participação." },
              { icon: Gift, n: "03", t: "Receba em casa", d: "Acompanhe o pedido em tempo real. Entrega em todo o Brasil com código de rastreio." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-card border border-border p-6 hover:border-gold/50 transition-colors">
                <div className="absolute -top-3 -right-3 text-5xl font-display font-bold text-gold/20">{s.n}</div>
                <s.icon className="w-8 h-8 text-gold mb-3" />
                <h3 className="font-display font-bold text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GARANTIAS */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, t: "Compra Protegida", d: "Pagamento criptografado e dados 100% seguros." },
              { icon: Truck, t: "Entrega Garantida", d: "Envio em até 48h após confirmação do PIX." },
              { icon: Award, t: "Prêmios Originais", d: "Todos os prêmios com nota fiscal e garantia." },
              { icon: Clock, t: "Suporte 7 dias", d: "Atendimento por WhatsApp todos os dias." },
            ].map((g) => (
              <div key={g.t} className="text-center rounded-2xl bg-card border border-border p-5">
                <g.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <div className="font-display font-bold mb-1">{g.t}</div>
                <p className="text-xs text-muted-foreground">{g.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <HelpCircle className="w-10 h-10 text-gold mx-auto mb-3" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Preciso pagar para participar?", a: "Não. A participação na roleta é 100% gratuita. Você paga apenas o frete de R$ 19,90 para receber seu prêmio em casa." },
              { q: "Como é feito o sorteio?", a: "O sorteio é realizado de forma transparente e auditada, com resultado divulgado publicamente em nossas redes sociais." },
              { q: "Quanto tempo leva para receber o prêmio?", a: "Após a confirmação do pagamento do frete, o prêmio é enviado em até 48h úteis. Você recebe um código de rastreio por e-mail." },
              { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos PIX, com aprovação instantânea e total segurança." },
              { q: "Posso participar mais de uma vez?", a: "Sim. Cada nova rodada da roleta é uma nova chance de ganhar." },
              { q: "É seguro informar meus dados?", a: "Sim. Usamos criptografia SSL e seguimos a LGPD. Seus dados nunca são compartilhados com terceiros." },
            ].map((f, i) => (
              <details key={i} className="group rounded-2xl bg-card border border-border p-5 cursor-pointer">
                <summary className="font-display font-semibold flex justify-between items-center list-none">
                  {f.q}
                  <span className="text-gold text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-gradient-to-br from-primary/20 via-card to-gold/10">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Pronto para girar a roleta?
          </h2>
          <p className="text-muted-foreground mb-8">
            Mais de {liveCount.toLocaleString("pt-BR")} pessoas já estão participando. Não fique de fora.
          </p>
          <a href="#roleta" className="inline-block px-10 py-4 rounded-full bg-fire text-primary-foreground font-display font-bold uppercase tracking-wider shadow-red hover:scale-105 transition-transform">
            Girar Roleta Agora
          </a>
        </div>
      </section>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/60 border border-border p-3">
      <Icon className="w-4 h-4 text-gold mb-1" />
      <div className="text-lg font-display font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
function Spec({ icon: Icon, label }: { icon: typeof Trophy; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-card border border-border p-3">
      <Icon className="w-4 h-4 text-gold shrink-0" /><span>{label}</span>
    </li>
  );
}
