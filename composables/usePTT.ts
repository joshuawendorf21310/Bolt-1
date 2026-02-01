export const usePTT = () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const mediaRecorder = ref<MediaRecorder | null>(null)
  const audioStream = ref<MediaStream | null>(null)
  const isTransmitting = ref(false)
  const currentSession = ref<any>(null)

  const startTransmission = async (
    channelId: string,
    options: {
      talkGroupId?: string
      priority?: number
      isEmergency?: boolean
      location?: { lat: number; lng: number; address?: string }
    } = {}
  ) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: crewData } = await $supabase
      .from('crew_roster')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: channel } = await $supabase
      .from('ptt_channels')
      .select('*')
      .eq('id', channelId)
      .single()

    if (!channel) {
      return { success: false, error: 'Channel not found' }
    }

    if (channel.current_speaker_id && !options.isEmergency) {
      return { success: false, error: 'Channel is busy' }
    }

    if (channel.current_speaker_id && options.isEmergency) {
      await $supabase
        .from('ptt_sessions')
        .update({
          ended_at: new Date().toISOString(),
          interrupted_by: user.id
        })
        .eq('channel_id', channelId)
        .is('ended_at', null)
    }

    const { data: session, error } = await $supabase
      .from('ptt_sessions')
      .insert({
        channel_id: channelId,
        talk_group_id: options.talkGroupId || null,
        speaker_id: user.id,
        speaker_crew_id: crewData?.id || null,
        priority: options.priority || 1,
        is_emergency: options.isEmergency || false,
        location_lat: options.location?.lat || null,
        location_lng: options.location?.lng || null,
        location_address: options.location?.address || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to start PTT session:', error)
      return { success: false, error: error.message }
    }

    await $supabase
      .from('ptt_channels')
      .update({
        current_speaker_id: user.id,
        speaking_started_at: new Date().toISOString()
      })
      .eq('id', channelId)

    currentSession.value = session
    isTransmitting.value = true

    try {
      audioStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
      startRecording(session.id)
    } catch (err) {
      console.error('Failed to access microphone:', err)
    }

    return { success: true, session }
  }

  const endTransmission = async () => {
    if (!currentSession.value) {
      return { success: false, error: 'No active session' }
    }

    const endedAt = new Date()
    const startedAt = new Date(currentSession.value.started_at)
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)

    await $supabase
      .from('ptt_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', currentSession.value.id)

    await $supabase
      .from('ptt_channels')
      .update({
        current_speaker_id: null,
        speaking_started_at: null
      })
      .eq('id', currentSession.value.channel_id)

    stopRecording()

    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => track.stop())
      audioStream.value = null
    }

    isTransmitting.value = false
    currentSession.value = null

    return { success: true }
  }

  const startRecording = (sessionId: string) => {
    if (!audioStream.value) return

    const chunks: Blob[] = []
    mediaRecorder.value = new MediaRecorder(audioStream.value)

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.value.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      await saveRecording(sessionId, blob)
    }

    mediaRecorder.value.start(100)
  }

  const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
  }

  const saveRecording = async (sessionId: string, audioBlob: Blob) => {
    const user = await auth.getUser()
    if (!user) return

    const { data: session } = await $supabase
      .from('ptt_sessions')
      .select('*, channel:ptt_channels(organization_id)')
      .eq('id', sessionId)
      .single()

    if (!session) return

    const fileName = `ptt-${sessionId}-${Date.now()}.webm`
    const fileSizeBytes = audioBlob.size
    const durationSeconds = session.duration_seconds || 0

    await $supabase
      .from('ptt_recordings')
      .insert({
        session_id: sessionId,
        organization_id: session.channel.organization_id,
        storage_path: fileName,
        file_size_bytes: fileSizeBytes,
        duration_seconds: durationSeconds,
        format: 'webm',
        is_available: true
      })
  }

  const updatePresence = async (status: string, options: {
    doNotDisturb?: boolean
    channelId?: string
    talkGroupId?: string
    location?: { lat: number; lng: number }
  } = {}) => {
    const user = await auth.getUser()
    if (!user) return

    const { data: crewData } = await $supabase
      .from('crew_roster')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: existing } = await $supabase
      .from('ptt_presence')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const presenceData = {
      user_id: user.id,
      crew_id: crewData?.id || null,
      status,
      do_not_disturb: options.doNotDisturb || false,
      current_channel_id: options.channelId || null,
      current_talk_group_id: options.talkGroupId || null,
      location_lat: options.location?.lat || null,
      location_lng: options.location?.lng || null,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (existing) {
      await $supabase
        .from('ptt_presence')
        .update(presenceData)
        .eq('id', existing.id)
    } else {
      await $supabase
        .from('ptt_presence')
        .insert(presenceData)
    }
  }

  const getActivePresence = async (organizationId: string) => {
    const { data, error } = await $supabase
      .from('ptt_presence')
      .select(`
        *,
        user:users(full_name, email),
        crew:crew_roster(certification_level, employee_id),
        channel:ptt_channels(channel_name),
        talk_group:talk_groups(group_name)
      `)
      .eq('status', 'online')
      .gte('last_active_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    if (error) {
      console.error('Failed to fetch presence:', error)
      return []
    }

    return data || []
  }

  const initiateEmergencyBroadcast = async (broadcast: {
    organizationId: string
    emergencyType: string
    title: string
    message: string
    incidentId?: string
    targetScope?: string
    location?: { lat: number; lng: number }
  }) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await $supabase
      .from('emergency_broadcasts')
      .insert({
        organization_id: broadcast.organizationId,
        initiated_by: user.id,
        emergency_type: broadcast.emergencyType,
        priority: 10,
        title: broadcast.title,
        message: broadcast.message,
        incident_id: broadcast.incidentId || null,
        target_scope: broadcast.targetScope || 'organization',
        target_location_lat: broadcast.location?.lat || null,
        target_location_lng: broadcast.location?.lng || null,
        requires_acknowledgment: true
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to initiate emergency broadcast:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const acknowledgeEmergencyBroadcast = async (
    broadcastId: string,
    options: {
      location?: { lat: number; lng: number }
      notes?: string
    } = {}
  ) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: crewData } = await $supabase
      .from('crew_roster')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { error } = await $supabase
      .from('emergency_broadcast_acks')
      .insert({
        broadcast_id: broadcastId,
        user_id: user.id,
        crew_id: crewData?.id || null,
        location_lat: options.location?.lat || null,
        location_lng: options.location?.lng || null,
        notes: options.notes || null
      })

    if (error) {
      console.error('Failed to acknowledge emergency broadcast:', error)
      return { success: false, error: error.message }
    }

    await $supabase.rpc('increment', {
      table_name: 'emergency_broadcasts',
      row_id: broadcastId,
      column_name: 'acknowledged_count'
    })

    return { success: true }
  }

  const getChannelHistory = async (channelId: string, limit: number = 50) => {
    const { data, error } = await $supabase
      .from('ptt_sessions')
      .select(`
        *,
        speaker:users(full_name, email),
        crew:crew_roster(certification_level, employee_id),
        recording:ptt_recordings(*)
      `)
      .eq('channel_id', channelId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch channel history:', error)
      return []
    }

    return data || []
  }

  const subscribeToChannel = (
    channelId: string,
    callbacks: {
      onTransmissionStart?: (session: any) => void
      onTransmissionEnd?: (session: any) => void
    }
  ) => {
    const channel = $supabase
      .channel(`ptt-channel-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ptt_sessions',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (callbacks.onTransmissionStart) {
            callbacks.onTransmissionStart(payload.new)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ptt_sessions',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (payload.new.ended_at && callbacks.onTransmissionEnd) {
            callbacks.onTransmissionEnd(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      $supabase.removeChannel(channel)
    }
  }

  return {
    isTransmitting,
    currentSession,
    startTransmission,
    endTransmission,
    updatePresence,
    getActivePresence,
    initiateEmergencyBroadcast,
    acknowledgeEmergencyBroadcast,
    getChannelHistory,
    subscribeToChannel
  }
}
