import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();
    let event: any;

    try {
      event = JSON.parse(body);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingEvent } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: webhookRecord, error: insertError } = await supabase
      .from("stripe_webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data,
        processing_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting webhook event:", insertError);
      throw insertError;
    }

    let relatedInvoiceId: string | null = null;

    if (event.type === "invoice.paid") {
      const stripeInvoiceId = event.data.object.id;

      const { data: invoice } = await supabase
        .from("private_party_invoices")
        .select("id")
        .eq("stripe_invoice_id", stripeInvoiceId)
        .maybeSingle();

      if (invoice) {
        relatedInvoiceId = invoice.id;

        await supabase
          .from("private_party_invoices")
          .update({
            payment_status: "paid",
            status: "paid",
            amount_paid: event.data.object.amount_paid,
            amount_outstanding: 0,
            paid_at: new Date().toISOString(),
            payment_method_type: event.data.object.payment_intent?.payment_method_types?.[0] || "card",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const stripeInvoiceId = event.data.object.id;

      const { data: invoice } = await supabase
        .from("private_party_invoices")
        .select("id")
        .eq("stripe_invoice_id", stripeInvoiceId)
        .maybeSingle();

      if (invoice) {
        relatedInvoiceId = invoice.id;

        await supabase
          .from("private_party_invoices")
          .update({
            payment_status: "failed",
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);
      }
    }

    if (event.type === "charge.dispute.created") {
      const stripeChargeId = event.data.object.charge;
      const stripeInvoiceId = event.data.object.metadata?.invoice_id;

      if (stripeInvoiceId) {
        const { data: invoice } = await supabase
          .from("private_party_invoices")
          .select("id")
          .eq("stripe_invoice_id", stripeInvoiceId)
          .maybeSingle();

        if (invoice) {
          relatedInvoiceId = invoice.id;

          await supabase
            .from("private_party_invoices")
            .update({
              payment_status: "disputed",
              status: "disputed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id);

          await supabase
            .from("billing_disputes")
            .insert({
              invoice_id: invoice.id,
              stripe_dispute_id: event.data.object.id,
              dispute_reason: event.data.object.reason,
              dispute_status: "open",
              amount_disputed: event.data.object.amount,
            });
        }
      }
    }

    if (event.type === "charge.dispute.closed") {
      const disputeId = event.data.object.id;

      const { data: dispute } = await supabase
        .from("billing_disputes")
        .select("id, invoice_id")
        .eq("stripe_dispute_id", disputeId)
        .maybeSingle();

      if (dispute) {
        await supabase
          .from("billing_disputes")
          .update({
            dispute_status: event.data.object.status === "won" ? "won" : "lost",
            resolved_at: new Date().toISOString(),
          })
          .eq("id", dispute.id);

        if (event.data.object.status === "won") {
          await supabase
            .from("private_party_invoices")
            .update({
              payment_status: "paid",
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", dispute.invoice_id);
        }
      }
    }

    await supabase
      .from("stripe_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        related_invoice_id: relatedInvoiceId,
      })
      .eq("id", webhookRecord.id);

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
