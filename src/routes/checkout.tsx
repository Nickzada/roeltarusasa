import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { loadCart, clearCart } from "@/lib/cart-store";
import { brl, maskCPF, maskPhone, maskCEP } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const schema = z.object({
  customer_name: z.string().trim().min(3, "Nome obrigatório").max(120),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido"),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido"),
  street: z.string().trim().min(2).max(120),
  number: z.string().trim().min(1).max(10),
  complement: z.string().max(60).optional(),
  neighborhood: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().length(2, "UF"),
});

const FIELDS = [
  { k: "customer_name", l: "Nome completo", col: 2 },
  { k: "cpf", l: "CPF", col: 1, mask: maskCPF },
  { k: "email", l: "E-mail", col: 1 },
  { k: "phone", l: "Telefone", col: 1, mask: maskPhone },
  { k: "cep", l: "CEP", col: 1, mask: maskCEP },
  { k: "street", l: "Rua", col: 2 },
  { k: "number", l: "Número", col: 1 },
  { k: "complement", l: "Complemento (opcional)", col: 1 },
  { k: "neighborhood", l: "Bairro", col: 2 },
  { k: "city", l: "Cidade", col: 1 },
  { k: "state", l: "Estado (UF)", col: 1 },
] as const;

function CheckoutPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const cart = typeof window !== "undefined" ? loadCart() : null;

  useEffect(() => { if (!cart) navigate({ to: "/" }); }, [cart, navigate]);

  if (!cart) return null;
  const total = cart.ticket_price + cart.upsells.reduce((a, b) => a + b.price, 0) + cart.shipping;

  const onCep = async (v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`).then((r) => r.json());
        if (!r.erro) setForm((f) => ({ ...f, street: r.logradouro || "", neighborhood: r.bairro || "", city: r.localidade || "", state: r.uf || "" }));
      } catch {}
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("orders").insert({
      ...parsed.data,
      promotion_id: cart.promotion_id,
      upsell_items: cart.upsells,
      shipping: cart.shipping,
      total,
      status: "pending",
    }).select("id").single();
    setLoading(false);
    if (error || !data) { toast.error("Erro ao criar pedido"); return; }
    navigate({ to: "/pagamento/$id", params: { id: data.id } });
  };

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="font-display text-3xl font-bold mb-2">Finalize seu pedido</h1>
      <p className="text-muted-foreground mb-8">Preencha seus dados para entrega do prêmio.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.k} className={f.col === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">{f.l}</label>
                <input
                  type="text"
                  value={form[f.k] ?? ""}
                  onChange={(e) => {
                    const v = "mask" in f && f.mask ? f.mask(e.target.value) : e.target.value;
                    setForm((s) => ({ ...s, [f.k]: v }));
                    if (f.k === "cep") onCep(v);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-gold focus:ring-2 focus:ring-gold/30 outline-none transition-all"
                />
              </div>
            ))}
          </div>
          <button disabled={loading} type="submit" className="w-full px-8 py-4 rounded-full bg-fire text-primary-foreground font-bold shadow-red hover:scale-[1.01] transition-transform disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Gerar PIX • {brl(total)}
          </button>
        </form>

        <aside className="rounded-2xl bg-card border border-border p-6 h-fit sticky top-20 space-y-3">
          <h3 className="font-display font-bold">Resumo</h3>
          {cart.ticket_price > 0 && (
            <div className="flex justify-between text-sm"><span>Ticket</span><span>{brl(cart.ticket_price)}</span></div>
          )}
          <div className="flex justify-between text-sm"><span>Participação</span><span className="text-success font-semibold">Grátis</span></div>
          {cart.upsells.map((u) => <div key={u.id} className="flex justify-between text-sm"><span>+ {u.name}</span><span>{brl(u.price)}</span></div>)}
          <div className="flex justify-between text-sm"><span>Frete</span><span>{brl(cart.shipping)}</span></div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
            <span>Total</span><span className="text-gradient-gold">{brl(total)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
