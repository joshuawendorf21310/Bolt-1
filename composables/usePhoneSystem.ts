export const usePhoneSystem = () => {
  const supabase = useSupabaseClient()

  const ESCALATION_KEYWORDS = {
    human_request: ['human', 'person', 'transfer', 'supervisor', 'manager'],
    dispute_denial: ['denied', 'denial', 'appeal', 'reconsideration', 'overturned', 'not payable', 'not covered'],
    legal_compliance: ['legal', 'attorney', 'lawyer', 'compliance', 'hipaa', 'cms', 'fraud', 'audit'],
    payment_commitment: ['can\'t guarantee', 'can\'t confirm payment', 'payment decision', 'policy exception', 'out of network exception']
  }

  const getPhoneSettings = async (userId: string) => {
    const { data, error } = await supabase
      .from('phone_system_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return await createDefaultPhoneSettings(userId)
    }

    return data
  }

  const createDefaultPhoneSettings = async (userId: string) => {
    const { data, error } = await supabase
      .from('phone_system_settings')
      .insert({
        user_id: userId,
        ringer_volume: 80,
        in_call_volume: 80,
        notification_volume: 60,
        ringer_muted: false,
        notifications_muted: false,
        dnd_enabled: false,
        ai_answer_first: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updatePhoneSettings = async (userId: string, settings: any) => {
    const { data, error } = await supabase
      .from('phone_system_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const enableDND = async (userId: string, duration?: number) => {
    const dndUntil = duration ? new Date(Date.now() + duration * 60000).toISOString() : null

    return await updatePhoneSettings(userId, {
      dnd_enabled: true,
      dnd_until: dndUntil
    })
  }

  const disableDND = async (userId: string) => {
    return await updatePhoneSettings(userId, {
      dnd_enabled: false,
      dnd_until: null
    })
  }

  const getActiveCalls = async () => {
    const { data, error } = await supabase
      .from('active_calls')
      .select('*')
      .neq('call_state', 'completed')
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const createInboundCall = async (callData: {
    callSid: string
    callerNumber: string
    callerIdentity?: string
  }) => {
    const { data, error } = await supabase
      .from('active_calls')
      .insert({
        call_sid: callData.callSid,
        direction: 'inbound',
        caller_number: callData.callerNumber,
        caller_identity: callData.callerIdentity,
        call_state: 'ringing'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const createOutboundCall = async (callData: {
    callSid: string
    calleeNumber: string
    context?: any
  }) => {
    const { data, error } = await supabase
      .from('active_calls')
      .insert({
        call_sid: callData.callSid,
        direction: 'outbound',
        callee_number: callData.calleeNumber,
        call_state: 'ringing',
        call_context: callData.context || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const answerCall = async (callId: string, handledBy: 'ai' | 'founder') => {
    const { data, error } = await supabase
      .from('active_calls')
      .update({
        call_state: 'answered',
        handled_by: handledBy,
        answered_at: new Date().toISOString()
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const declineCall = async (callId: string) => {
    const { data, error } = await supabase
      .from('active_calls')
      .update({
        call_state: 'completed',
        handled_by: 'voicemail',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const escalateCall = async (callId: string, trigger: string, keywords: string[], aiSummary: string) => {
    await supabase
      .from('active_calls')
      .update({
        call_state: 'escalating',
        escalation_triggered: true,
        escalation_reason: trigger,
        escalation_keywords: keywords
      })
      .eq('id', callId)

    const { data, error } = await supabase
      .from('call_escalations')
      .insert({
        call_id: callId,
        escalation_trigger: trigger,
        trigger_keywords: keywords,
        ai_summary: aiSummary
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const acceptEscalation = async (escalationId: string) => {
    const { data, error } = await supabase
      .from('call_escalations')
      .update({
        escalation_accepted: true,
        founder_joined_at: new Date().toISOString()
      })
      .eq('id', escalationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const endCall = async (callId: string, duration: number) => {
    const { data, error } = await supabase
      .from('active_calls')
      .update({
        call_state: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const createVoicemail = async (voicemailData: {
    callId: string
    callerNumber: string
    callerIdentity?: string
    audioUrl?: string
    transcript?: string
    durationSeconds: number
  }) => {
    const { data, error } = await supabase
      .from('voicemail_records')
      .insert({
        call_id: voicemailData.callId,
        caller_number: voicemailData.callerNumber,
        caller_identity: voicemailData.callerIdentity,
        audio_url: voicemailData.audioUrl,
        transcript: voicemailData.transcript,
        duration_seconds: voicemailData.durationSeconds,
        voicemail_status: 'new'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getVoicemails = async (status?: string) => {
    let query = supabase
      .from('voicemail_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('voicemail_status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const updateVoicemailStatus = async (voicemailId: string, status: string) => {
    const updateData: any = { voicemail_status: status }

    if (status === 'reviewed') {
      updateData.reviewed_at = new Date().toISOString()
    } else if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('voicemail_records')
      .update(updateData)
      .eq('id', voicemailId)

    if (error) throw error
  }

  const checkForEscalationKeywords = (transcript: string): { triggered: boolean; keywords: string[]; trigger: string } => {
    const lowerTranscript = transcript.toLowerCase()

    for (const [trigger, keywords] of Object.entries(ESCALATION_KEYWORDS)) {
      const foundKeywords = keywords.filter(keyword => lowerTranscript.includes(keyword.toLowerCase()))
      if (foundKeywords.length > 0) {
        return {
          triggered: true,
          keywords: foundKeywords,
          trigger
        }
      }
    }

    return { triggered: false, keywords: [], trigger: '' }
  }

  return {
    ESCALATION_KEYWORDS,
    getPhoneSettings,
    updatePhoneSettings,
    enableDND,
    disableDND,
    getActiveCalls,
    createInboundCall,
    createOutboundCall,
    answerCall,
    declineCall,
    escalateCall,
    acceptEscalation,
    endCall,
    createVoicemail,
    getVoicemails,
    updateVoicemailStatus,
    checkForEscalationKeywords
  }
}
