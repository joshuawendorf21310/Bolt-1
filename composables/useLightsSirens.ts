export const useLightsSirens = () => {
  const { $supabase } = useNuxtApp()
  const gps = useGPSTracking()

  let lightsStartTime: Date | null = null
  let sirensStartTime: Date | null = null
  let lightsEventId: string | null = null
  let sirensEventId: string | null = null

  const activateLights = async (unitId: string, incidentId?: string) => {
    if (lightsStartTime) {
      console.warn('Lights already activated')
      return { success: false, error: 'Already activated' }
    }

    lightsStartTime = new Date()

    const position = await gps.getCurrentPosition().catch(() => null)
    const location = position?.coords

    const { data, error } = await $supabase
      .from('lights_sirens_events')
      .insert({
        unit_id: unitId,
        incident_id: incidentId || null,
        event_type: 'lights_activated',
        timestamp: lightsStartTime.toISOString(),
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record lights activation:', error)
      lightsStartTime = null
      return { success: false, error: error.message }
    }

    lightsEventId = data.id

    return { success: true, eventId: data.id }
  }

  const deactivateLights = async (unitId: string, incidentId?: string) => {
    if (!lightsStartTime) {
      console.warn('Lights not activated')
      return { success: false, error: 'Not activated' }
    }

    const endTime = new Date()
    const durationSeconds = Math.floor((endTime.getTime() - lightsStartTime.getTime()) / 1000)

    const position = await gps.getCurrentPosition().catch(() => null)
    const location = position?.coords

    if (lightsEventId) {
      await $supabase
        .from('lights_sirens_events')
        .update({
          duration_seconds: durationSeconds
        })
        .eq('id', lightsEventId)
    }

    const { data, error } = await $supabase
      .from('lights_sirens_events')
      .insert({
        unit_id: unitId,
        incident_id: incidentId || null,
        event_type: 'lights_deactivated',
        timestamp: endTime.toISOString(),
        duration_seconds: durationSeconds,
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record lights deactivation:', error)
      return { success: false, error: error.message }
    }

    const duration = durationSeconds
    lightsStartTime = null
    lightsEventId = null

    return { success: true, duration, eventId: data.id }
  }

  const activateSirens = async (unitId: string, incidentId?: string) => {
    if (sirensStartTime) {
      console.warn('Sirens already activated')
      return { success: false, error: 'Already activated' }
    }

    sirensStartTime = new Date()

    const position = await gps.getCurrentPosition().catch(() => null)
    const location = position?.coords

    const { data, error } = await $supabase
      .from('lights_sirens_events')
      .insert({
        unit_id: unitId,
        incident_id: incidentId || null,
        event_type: 'sirens_activated',
        timestamp: sirensStartTime.toISOString(),
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record sirens activation:', error)
      sirensStartTime = null
      return { success: false, error: error.message }
    }

    sirensEventId = data.id

    return { success: true, eventId: data.id }
  }

  const deactivateSirens = async (unitId: string, incidentId?: string) => {
    if (!sirensStartTime) {
      console.warn('Sirens not activated')
      return { success: false, error: 'Not activated' }
    }

    const endTime = new Date()
    const durationSeconds = Math.floor((endTime.getTime() - sirensStartTime.getTime()) / 1000)

    const position = await gps.getCurrentPosition().catch(() => null)
    const location = position?.coords

    if (sirensEventId) {
      await $supabase
        .from('lights_sirens_events')
        .update({
          duration_seconds: durationSeconds
        })
        .eq('id', sirensEventId)
    }

    const { data, error } = await $supabase
      .from('lights_sirens_events')
      .insert({
        unit_id: unitId,
        incident_id: incidentId || null,
        event_type: 'sirens_deactivated',
        timestamp: endTime.toISOString(),
        duration_seconds: durationSeconds,
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record sirens deactivation:', error)
      return { success: false, error: error.message }
    }

    const duration = durationSeconds
    sirensStartTime = null
    sirensEventId = null

    return { success: true, duration, eventId: data.id }
  }

  const getIncidentLightsSirensData = async (incidentId: string) => {
    const { data, error } = await $supabase
      .from('lights_sirens_events')
      .select('*')
      .eq('incident_id', incidentId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Failed to fetch lights/sirens data:', error)
      return null
    }

    const lightsActivations = data.filter(e => e.event_type === 'lights_activated')
    const sirensActivations = data.filter(e => e.event_type === 'sirens_activated')

    const lightsTotalDuration = lightsActivations.reduce((sum, e) => sum + (e.duration_seconds || 0), 0)
    const sirensTotalDuration = sirensActivations.reduce((sum, e) => sum + (e.duration_seconds || 0), 0)

    return {
      lights_used: lightsActivations.length > 0,
      sirens_used: sirensActivations.length > 0,
      lights_duration_seconds: lightsTotalDuration,
      sirens_duration_seconds: sirensTotalDuration,
      events: data
    }
  }

  const markExportedToNEMSIS = async (eventIds: string[]) => {
    const { error } = await $supabase
      .from('lights_sirens_events')
      .update({ exported_to_nemsis: true })
      .in('id', eventIds)

    if (error) {
      console.error('Failed to mark events as exported:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  return {
    activateLights,
    deactivateLights,
    activateSirens,
    deactivateSirens,
    getIncidentLightsSirensData,
    markExportedToNEMSIS,
    get lightsActive() {
      return lightsStartTime !== null
    },
    get sirensActive() {
      return sirensStartTime !== null
    },
    get lightsActiveDuration() {
      return lightsStartTime ? Math.floor((Date.now() - lightsStartTime.getTime()) / 1000) : 0
    },
    get sirensActiveDuration() {
      return sirensStartTime ? Math.floor((Date.now() - sirensStartTime.getTime()) / 1000) : 0
    }
  }
}
