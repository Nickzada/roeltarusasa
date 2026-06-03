import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createPixCharge, checkPixStatus } from "@/lib/pix.functions";
import { brl } from "@/lib/format";
import { clearCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { Copy, Check, Loader2, QrCode } from "lucide-react";

export const Route = createFileRoute("/pagamento/$id")({ component: PaymentPage });

function PaymentPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const createPix = useServerFn(createPixCharge);
  const checkStatus = useServerFn(checkPixStatus);

  const [order, setOrder] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Carrega pedido + gera PIX (apenas uma vez)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      setOrder(data);
      if (!data) return;
      if (data.status === "paid") {
        navigate({ to: "/confirmacao/$id", params: { id } });
        return;
      }
      try {
        const res = await createPix({ data: { orderId: id } });
        setQrCode(res.qrCodeText);
      } catch (e: any) {
        setError(e?.message || "Falha ao gerar PIX");
      }
    })();
  }, [id, createPix, navigate]);

  // Polling de status
  useEffect(() => {
    if (!order || order.status === "paid") return;
    const interval = setInterval(async () => {
      try {
        const r = await checkStatus({ data: { orderId: id } });
        if (r.status === "paid") {
          clearInterval(interval);
          clearCart();
          navigate({ to: "/confirmacao/$id", params: { id } });
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [order, id, checkStatus, navigate]);

  if (!order) {
    return (
      <div className="container mx-auto p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
      </div>
    );
  }

  const copy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImgUrl = qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&data=${encodeURIComponent(qrCode)}`
    : null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold mb-3">
          <QrCode className="w-3.5 h-3.5" /> AGUARDANDO PAGAMENTO
        </div>
        <h1 className="font-display text-3xl font-bold">Pague com PIX</h1>
        <p className="text-muted-foreground mt-2">
          Valor: <span className="text-gradient-gold font-bold">{brl(Number(order.total))}</span>
        </p>
      </div>

      <div className="rounded-3xl bg-card border border-border p-8 text-center space-y-6">
        <div className="mx-auto w-64 h-64 bg-white rounded-2xl p-3 flex items-center justify-center">
          {qrImgUrl ? (
            <img src={qrImgUrl} alt="QR Code PIX" className="w-full h-full" />
          ) : error ? (
            <div className="text-sm text-destructive p-4">{error}</div>
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Aponte a câmera do seu banco no QR Code acima ou copie o código abaixo:
        </p>

        <div className="rounded-xl bg-muted p-3 text-xs font-mono text-muted-foreground break-all min-h-[48px]">
          {qrCode ?? (error ? "—" : "Gerando código PIX...")}
        </div>

        <button
          onClick={copy}
          disabled={!qrCode}
          className="w-full px-6 py-3 rounded-full bg-gold text-gold-foreground font-bold inline-flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </button>

        <div className="text-xs text-muted-foreground inline-flex items-center gap-2 justify-center">
          <Loader2 className="w-3 h-3 animate-spin" />
          Aguardando confirmação automática do pagamento...
        </div>
      </div>
    </section>
  );
}
