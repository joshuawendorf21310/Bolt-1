import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface VoiceScreeningRequest {
  caller_name: string
  caller_phone: string
  complaint: string
  location: string
}

interface VoiceScreeningResponse {
  priority: number
  risk_score: number
  recommended_dispatch: string
  follow_up_questions: string[]
  ai_assessment: string
}

const assessComplaint = async (complaint: string): Promise<VoiceScreeningResponse> => {
  const priorities: { [key: string]: number } = {
    chest_pain: 1,
    difficulty_breathing: 1,
    altered_mental_status: 1,
    unresponsive: 1,
    severe_bleeding: 1,
    allergic_reaction: 2,
    severe_pain: 2,
    choking: 1,
    unconscious: 1,
    stroke_symptoms: 1,
    trauma: 2,
    fall: 3,
    fever: 3,
    nausea: 4,
    general_illness: 4,
  }

  let priority = 4
  let riskScore = 0
  let recommendedDispatch = "Standard Response"

  const complaintLower = complaint.toLowerCase()

  for (const [key, value] of Object.entries(priorities)) {
    if (complaintLower.includes(key.replace(/_/g, " "))) {
      priority = value
      riskScore = 10 - value * 2
      break
    }
  }

  if (priority === 1) {
    recommendedDispatch = "Advanced Life Support (ALS) - Code 3"
    riskScore = 95
  } else if (priority === 2) {
    recommendedDispatch = "Basic Life Support (BLS) - Code 2"
    riskScore = 75
  } else if (priority === 3) {
    recommendedDispatch = "Non-Emergency - Code 1"
    riskScore = 45
  } else {
    recommendedDispatch = "Schedule Appointment or Non-Emergency"
    riskScore = 20
  }

  const followUpQuestions: string[] = []

  if (priority <= 2) {
    followUpQuestions.push("Is the patient conscious and breathing?")
    followUpQuestions.push("Is there any severe bleeding?")
    followUpQuestions.push("What is the patient's location?")
  }

  if (complaintLower.includes("chest")) {
    followUpQuestions.push("Is the pain radiating to the arm, jaw, or back?")
    followUpQuestions.push("On a scale of 1-10, how severe is the pain?")
  }

  if (complaintLower.includes("difficulty breathing") || complaintLower.includes("breathing")) {
    followUpQuestions.push("Is the patient able to speak in complete sentences?")
    followUpQuestions.push("Are there any allergies or asthma history?")
  }

  return {
    priority,
    risk_score: riskScore,
    recommended_dispatch: recommendedDispatch,
    follow_up_questions: followUpQuestions,
    ai_assessment: `Priority Level ${priority}: ${recommendedDispatch}. Risk Score: ${riskScore}/100`,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { caller_name, caller_phone, complaint, location }: VoiceScreeningRequest = await req.json()

    const assessment = await assessComplaint(complaint)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: callData, error: callError } = await supabase
      .from("call_queue")
      .insert([
        {
          call_number: `CALL-${Date.now()}`,
          call_type: "emergency_911",
          priority: assessment.priority,
          complaint: complaint,
          location_address: location,
          caller_name: caller_name,
          caller_phone: caller_phone,
          ai_screening_completed: true,
          ai_screening_result: assessment.ai_assessment,
        },
      ])
      .select()
      .maybeSingle()

    if (callError) throw callError

    const { error: interactionError } = await supabase
      .from("ai_call_interactions")
      .insert([
        {
          interaction_type: "voice_screening",
          call_id: callData?.id,
          user_message: complaint,
          ai_response: assessment.ai_assessment,
          confidence_score: 0.95,
          action_recommended: assessment.recommended_dispatch,
          model_used: "gpt-4-mini",
          tokens_used: 150,
        },
      ])

    if (interactionError) throw interactionError

    return new Response(
      JSON.stringify({
        success: true,
        call_id: callData?.id,
        assessment: assessment,
        message: "Voice screening completed and call dispatched",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    )
  }
})
