import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { CheckCircle2, Package, MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/confirmacao/$id")({ component: ConfirmPage });

function ConfirmPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setOrder(data));
  }, [id]);

  if (!order) return <div className="container mx-auto p-12 text-center text-muted-foreground">Carregando...</div>;

  return (
    <section className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4 animate-pulse-glow">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold">Pagamento confirmado! 🎉</h1>
        <p className="text-muted-foreground mt-2">Sua participação está garantida. Boa sorte!</p>
      </div>

      <div className="space-y-4">
        <Card icon={Package} title="Resumo do pedido">
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Pedido</span><span className="font-mono text-xs">{order.id.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span>Ticket</span><span>{brl(Number(order.total) - Number(order.shipping) - (order.upsell_items as any[]).reduce((a, b) => a + Number(b.price), 0))}</span></div>
            {(order.upsell_items as any[]).map((u: any) => <div key={u.id} className="flex justify-between"><span>+ {u.name}</span><span>{brl(Number(u.price))}</span></div>)}
            <div className="flex justify-between"><span>Frete</span><span>{brl(Number(order.shipping))}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border mt-2"><span>Total pago</span><span className="text-gradient-gold">{brl(Number(order.total))}</span></div>
          </div>
        </Card>
        <Card icon={MapPin} title="Endereço de entrega">
          <div className="text-sm text-muted-foreground">
            <div className="text-foreground font-medium">{order.customer_name}</div>
            {order.street}, {order.number} {order.complement && `— ${order.complement}`}<br />
            {order.neighborhood} • {order.city}/{order.state} • CEP {order.cep}
          </div>
        </Card>
        <Card icon={Truck} title="Prazo e rastreio">
          <div className="text-sm text-muted-foreground space-y-2">
            <div>📅 Prazo estimado: <strong className="text-foreground">5 a 10 dias úteis</strong></div>
            {order.tracking_code && (
              <div>📦 Código de rastreio: <strong className="text-gold font-mono">{order.tracking_code}</strong></div>
            )}
            <div className="text-xs">Você receberá atualizações por e-mail em {order.email}.</div>
          </div>
        </Card>
      </div>

      <Link to="/" className="mt-8 block w-full text-center px-8 py-4 rounded-full bg-fire text-primary-foreground font-bold shadow-red hover:scale-[1.01] transition-transform">
        Voltar ao início
      </Link>
    </section>
  );
}

function Card({ icon: Icon, title, children }: any) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gold" />
        <h3 className="font-display font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
