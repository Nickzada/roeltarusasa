import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, Download, Settings, Package, Users, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"orders" | "upsells" | "promos" | "settings">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [upsells, setUpsells] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/admin/login" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      setReady(true);
      if (admin) refresh();
    })();
  }, [navigate]);

  const refresh = async () => {
    const [o, u, p, s] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("upsells").select("*").order("sort_order"),
      supabase.from("promotions").select("*").order("created_at", { ascending: false }),
      supabase.from("settings").select("*"),
    ]);
    setOrders(o.data ?? []); setUpsells(u.data ?? []); setPromos(p.data ?? []); setSettings(s.data ?? []);
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); };

  const exportOrders = () => {
    const header = "id,nome,cpf,email,cidade,uf,total,status,data\n";
    const rows = orders.map((o) => `${o.id},${o.customer_name},${o.cpf},${o.email},${o.city},${o.state},${o.total},${o.status},${o.created_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "pedidos.csv"; a.click();
  };

  const saveUpsell = async (u: any) => {
    await supabase.from("upsells").update({ name: u.name, price: Number(u.price), active: u.active }).eq("id", u.id);
    toast.success("Upsell atualizado"); refresh();
  };

  const savePromo = async (p: any) => {
    await supabase.from("promotions").update({ ticket_price: Number(p.ticket_price), prize_value: Number(p.prize_value), active: p.active, stock: Number(p.stock) }).eq("id", p.id);
    toast.success("Promoção atualizada"); refresh();
  };

  const saveShipping = async (v: number) => {
    await supabase.from("settings").upsert({ key: "shipping", value: { price: v } as any });
    toast.success("Frete salvo"); refresh();
  };

  if (!ready) return <div className="container mx-auto p-12 text-center">Carregando...</div>;
  if (!isAdmin) return (
    <div className="container mx-auto p-12 text-center space-y-4">
      <h1 className="font-display text-2xl font-bold">Sem permissão de administrador</h1>
      <button onClick={logout} className="px-6 py-3 rounded-full bg-fire text-primary-foreground font-bold">Sair</button>
    </div>
  );

  const shipping = (settings.find((s) => s.key === "shipping")?.value as any)?.price ?? 19.9;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" /><span className="font-display font-bold">Admin</span></div>
          <button onClick={logout} className="text-sm inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
        <nav className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { k: "orders", l: "Pedidos", i: Package },
            { k: "upsells", l: "Upsells", i: Users },
            { k: "promos", l: "Promoções", i: Trophy },
            { k: "settings", l: "Configurações", i: Settings },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-colors ${tab === t.k ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.i className="w-4 h-4" /> {t.l}
            </button>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        {tab === "orders" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Pedidos ({orders.length})</h2>
              <button onClick={exportOrders} className="px-4 py-2 rounded-full bg-gold text-gold-foreground font-semibold inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exportar CSV</button>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase">
                  <tr><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Cidade</th><th className="p-3 text-left">Total</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Data</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3"><div className="font-medium">{o.customer_name}</div><div className="text-xs text-muted-foreground">{o.email}</div></td>
                      <td className="p-3">{o.city}/{o.state}</td>
                      <td className="p-3 font-semibold">{brl(Number(o.total))}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${o.status === "paid" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "upsells" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {upsells.map((u, idx) => (
              <div key={u.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <input className="w-full px-3 py-2 rounded-lg bg-input border border-border" value={u.name} onChange={(e) => setUpsells((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-input border border-border" value={u.price} onChange={(e) => setUpsells((arr) => arr.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={u.active} onChange={(e) => setUpsells((arr) => arr.map((x, i) => i === idx ? { ...x, active: e.target.checked } : x))} /> Ativo</label>
                <button onClick={() => saveUpsell(u)} className="w-full px-4 py-2 rounded-full bg-fire text-primary-foreground font-bold">Salvar</button>
              </div>
            ))}
          </div>
        )}

        {tab === "promos" && (
          <div className="space-y-4">
            {promos.map((p, idx) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5 grid sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-4 font-display font-bold">{p.name}</div>
                <div><label className="text-xs text-muted-foreground">Ticket</label><input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-input border border-border" value={p.ticket_price} onChange={(e) => setPromos((arr) => arr.map((x, i) => i === idx ? { ...x, ticket_price: e.target.value } : x))} /></div>
                <div><label className="text-xs text-muted-foreground">Valor prêmio</label><input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-input border border-border" value={p.prize_value} onChange={(e) => setPromos((arr) => arr.map((x, i) => i === idx ? { ...x, prize_value: e.target.value } : x))} /></div>
                <div><label className="text-xs text-muted-foreground">Estoque</label><input type="number" className="w-full px-3 py-2 rounded-lg bg-input border border-border" value={p.stock} onChange={(e) => setPromos((arr) => arr.map((x, i) => i === idx ? { ...x, stock: e.target.value } : x))} /></div>
                <button onClick={() => savePromo(p)} className="px-4 py-2 rounded-full bg-fire text-primary-foreground font-bold">Salvar</button>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <label className="text-sm font-semibold">Valor do frete (R$)</label>
              <input id="ship" type="number" step="0.01" defaultValue={shipping} className="w-full px-3 py-2 rounded-lg bg-input border border-border" />
              <button onClick={() => saveShipping(Number((document.getElementById("ship") as HTMLInputElement).value))} className="px-4 py-2 rounded-full bg-fire text-primary-foreground font-bold">Salvar frete</button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-2">Integração PIX</strong>
              Configure suas credenciais de gateway PIX (Mercado Pago, Gerencianet, etc.) entrando em contato com o suporte técnico. Atualmente em modo simulado.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
