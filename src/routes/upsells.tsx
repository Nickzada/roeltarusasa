import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadCart, saveCart, type UpsellChoice } from "@/lib/cart-store";
import { brl } from "@/lib/format";
import { Plus, Check, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/upsells")({ component: UpsellsPage });

type Upsell = { id: string; name: string; description: string | null; price: number };

function UpsellsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Upsell[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cart = loadCart();
    if (!cart) { navigate({ to: "/" }); return; }
    supabase.from("upsells").select("*").eq("active", true).order("sort_order").then(({ data }) => {
      if (data) setItems(data as Upsell[]);
    });
  }, [navigate]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const chosen: UpsellChoice[] = items.filter((i) => selected[i.id]).map((i) => ({ id: i.id, name: i.name, price: Number(i.price) }));
  const cart = loadCart();
  const subtotal = (cart?.ticket_price ?? 0) + chosen.reduce((a, b) => a + b.price, 0);
  const total = subtotal + (cart?.shipping ?? 0);

  const next = () => {
    if (!cart) return;
    saveCart({ ...cart, upsells: chosen });
    navigate({ to: "/checkout" });
  };

  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/15 text-success text-xs font-semibold mb-3">
          <Check className="w-3.5 h-3.5" /> PARTICIPAÇÃO DESBLOQUEADA
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Turbine sua participação</h1>
        <p className="text-muted-foreground mt-2">Adicione acessórios exclusivos com desconto especial. Opcional.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {items.map((u) => {
          const on = !!selected[u.id];
          return (
            <button key={u.id} onClick={() => toggle(u.id)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${on ? "border-gold bg-gold/10 shadow-gold" : "border-border bg-card hover:border-gold/50"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${on ? "bg-gold text-gold-foreground" : "bg-muted"}`}>
                  {on ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <span className="text-lg font-display font-bold text-gold">{brl(Number(u.price))}</span>
              </div>
              <h3 className="font-display font-bold mb-1">{u.name}</h3>
              <p className="text-xs text-muted-foreground">{u.description}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-3">
        <div className="flex justify-between text-sm"><span>Ticket de participação</span><span>{brl(cart?.ticket_price ?? 0)}</span></div>
        {chosen.map((c) => <div key={c.id} className="flex justify-between text-sm"><span>+ {c.name}</span><span>{brl(c.price)}</span></div>)}
        <div className="flex justify-between text-sm"><span>Frete</span><span>{brl(cart?.shipping ?? 0)}</span></div>
        <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
          <span>Total</span><span className="text-gradient-gold">{brl(total)}</span>
        </div>
      </div>

      <button onClick={next} className="mt-6 w-full px-8 py-4 rounded-full bg-fire text-primary-foreground font-bold shadow-red hover:scale-[1.01] transition-transform">
        Ir para o pagamento →
      </button>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-success" /> Checkout seguro • PIX criptografado
      </div>
    </section>
  );
}
