import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/pix-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          // EvoPay envia o objeto da transação. Aceitamos tanto raiz quanto { data: {...} }.
          const tx = (body?.data ?? body) as {
            id?: string;
            status?: string;
            clientReference?: string;
            endToEndId?: string;
          };

          const orderId = tx.clientReference;
          const status = String(tx.status || "").toUpperCase();

          if (!orderId) {
            return new Response("ignored", { status: 200 });
          }

          const update: { status?: string; tracking_code?: string } = {};
          if (status === "PAID" || status === "APPROVED" || status === "COMPLETED") {
            update.status = "paid";
            update.tracking_code =
              "BR" + (tx.endToEndId?.slice(-9).toUpperCase() ?? Math.random().toString(36).slice(2, 11).toUpperCase());
          } else if (status === "EXPIRED" || status === "CANCELLED" || status === "CANCELED" || status === "REFUSED") {
            update.status = "cancelled";
          } else if (status === "REFUNDED") {
            update.status = "refunded";
          }

          if (Object.keys(update).length) {
            await supabaseAdmin.from("orders").update(update).eq("id", orderId);
          }

          return Response.json({ ok: true });
        } catch (e) {
          console.error("[pix-webhook]", e);
          return new Response("error", { status: 500 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
