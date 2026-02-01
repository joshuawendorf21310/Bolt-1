import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface PhoneEventRequest {
  event_type: string
  call_id?: string
  caller_phone: string
  caller_name?: string
  voicemail_url?: string
  transcription?: string
  duration_seconds?: number
  timestamp: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const payload: PhoneEventRequest = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (payload.event_type === "voicemail") {
      const priority = payload.transcription?.toLowerCase().includes("emergency") ? 1 : 3

      const { data: voicemailData, error: voicemailError } = await supabase
        .from("phone_voicemails")
        .insert([
          {
            call_time: new Date(payload.timestamp),
            caller_phone: payload.caller_phone,
            caller_name: payload.caller_name,
            voicemail_duration_seconds: payload.duration_seconds,
            voicemail_url: payload.voicemail_url,
            transcription: payload.transcription,
            transcription_confidence: 0.92,
            ai_priority_score: priority,
            callback_priority: priority === 1 ? "urgent" : "normal",
            status: "new",
          },
        ])
        .select()
        .maybeSingle()

      if (voicemailError) throw voicemailError

      const notificationText = payload.transcription || "New voicemail from " + payload.caller_phone

      await supabase.from("notification_queue").insert([
        {
          notification_type: "voicemail_received",
          recipient_phone: "+1555-0100",
          message_subject: "New Voicemail",
          message_body: notificationText,
          priority: priority === 1 ? "high" : "normal",
          status: "pending",
          related_call_id: payload.call_id,
        },
      ])

      return new Response(
        JSON.stringify({
          success: true,
          voicemail_id: voicemailData?.id,
          message: "Voicemail recorded and transcribed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    if (payload.event_type === "call_ended") {
      const { error: assignmentError } = await supabase
        .from("call_assignments")
        .update({ status: "completed", departed_time: new Date(payload.timestamp) })
        .eq("call_id", payload.call_id)

      if (assignmentError) throw assignmentError

      const { error: callError } = await supabase
        .from("call_queue")
        .update({ status: "completed", updated_at: new Date(payload.timestamp) })
        .eq("id", payload.call_id)

      if (callError) throw callError

      return new Response(
        JSON.stringify({
          success: true,
          message: "Call closed and logged",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unknown event type",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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
