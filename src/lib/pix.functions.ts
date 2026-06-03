import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({
  orderId: z.string().uuid(),
});

export const createPixCharge = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.EVOPAY_API_KEY;
    if (!apiKey) throw new Error("EVOPAY_API_KEY não configurada");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();

    if (error || !order) throw new Error("Pedido não encontrado");

    // Se já tem QR Code gerado, retorna o existente.
    if (order.qr_code_text && order.external_id) {
      return {
        qrCodeText: order.qr_code_text,
        externalId: order.external_id,
        amount: Number(order.total),
      };
    }

    const host = getRequestHost();
    const callbackUrl = `https://${host}/api/public/pix-webhook`;

    const amountCents = Math.round(Number(order.total) * 100) / 100; // EvoPay usa reais

    const res = await fetch("https://api.evopay.cash/v1/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: amountCents,
        callbackUrl,
        generatedName: order.customer_name,
        generatedEmail: order.email,
        generatedDocument: order.cpf.replace(/\D/g, ""),
        expiresIn: 3600,
        clientReference: order.id,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[EvoPay] erro", res.status, txt);
      throw new Error(`Falha ao gerar PIX (${res.status})`);
    }

    const json = (await res.json()) as {
      id: string;
      qrCodeText: string;
      status: string;
    };

    await supabaseAdmin
      .from("orders")
      .update({
        external_id: json.id,
        qr_code_text: json.qrCodeText,
        pix_code: json.qrCodeText,
      })
      .eq("id", order.id);

    return {
      qrCodeText: json.qrCodeText,
      externalId: json.id,
      amount: Number(order.total),
    };
  });

export const checkPixStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status, tracking_code")
      .eq("id", data.orderId)
      .maybeSingle();
    return { status: order?.status ?? "pending", trackingCode: order?.tracking_code ?? null };
  });
