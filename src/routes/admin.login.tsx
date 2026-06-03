import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      if (error) { toast.error(error.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        toast.success("Conta criada! Faça login.");
        setMode("in");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setLoading(false); return; }
      navigate({ to: "/admin" });
    }
    setLoading(false);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-hero px-4">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-glow">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-fire flex items-center justify-center"><Trophy className="w-5 h-5 text-primary-foreground" /></div>
          <span className="font-display font-bold text-lg">Painel Admin</span>
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">{mode === "in" ? "Entrar" : "Criar conta admin"}</h1>
        <p className="text-sm text-muted-foreground mb-6">Acesso restrito a administradores.</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-gold outline-none" />
          <input type="password" placeholder="Senha (mínimo 8 caracteres)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-gold outline-none" />
          <button disabled={loading} className="w-full px-6 py-3 rounded-full bg-fire text-primary-foreground font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Lock className="w-4 h-4" /> {mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted-foreground hover:text-gold w-full text-center">
          {mode === "in" ? "Criar conta admin" : "Já tenho conta"}
        </button>
      </div>
    </section>
  );
}
