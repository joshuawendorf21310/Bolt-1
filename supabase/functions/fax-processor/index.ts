import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface FaxRequest {
  sender_phone: string
  sender_name?: string
  document_type: string
  pages_count: number
  document_url: string
  received_time: string
}

const extractDocumentType = (docType: string): string => {
  const types: { [key: string]: string } = {
    invoice: "billing_invoice",
    eob: "explanation_of_benefits",
    auth: "prior_authorization",
    appeal: "insurance_appeal",
    referral: "medical_referral",
    prescription: "prescription",
    insurance: "insurance_form",
    claim: "claim_form",
  }

  for (const [key, value] of Object.entries(types)) {
    if (docType.toLowerCase().includes(key)) {
      return value
    }
  }

  return "general_document"
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const payload: FaxRequest = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const docType = extractDocumentType(payload.document_type)

    const { data: faxData, error: faxError } = await supabase
      .from("fax_documents")
      .insert([
        {
          fax_received_time: new Date(payload.received_time),
          sender_phone: payload.sender_phone,
          sender_name: payload.sender_name || "Unknown",
          document_type: docType,
          pages_count: payload.pages_count,
          document_url: payload.document_url,
          processing_status: "pending_ocr",
          follow_up_required: docType === "prior_authorization" || docType === "insurance_appeal",
        },
      ])
      .select()
      .maybeSingle()

    if (faxError) throw faxError

    const priority =
      docType === "prior_authorization" || docType === "insurance_appeal" ? "high" : "normal"

    const { error: notificationError } = await supabase
      .from("notification_queue")
      .insert([
        {
          notification_type: "fax_received",
          recipient_email: "billing@medicalservice.com",
          message_subject: `Fax Received: ${docType.replace(/_/g, " ")}`,
          message_body: `New fax received from ${payload.sender_phone} with ${payload.pages_count} pages. Document type: ${docType}`,
          priority: priority,
          status: "pending",
          related_call_id: faxData?.id,
        },
      ])

    if (notificationError) throw notificationError

    return new Response(
      JSON.stringify({
        success: true,
        fax_id: faxData?.id,
        document_type: docType,
        message: "Fax received and queued for processing",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
