export const useTripLogs = () => {
  const { $supabase } = useNuxtApp()
  const gps = useGPSTracking()
  const lightsSirens = useLightsSirens()

  const startTrip = async (unitId: string, incidentId?: string) => {
    const { data: unit } = await $supabase
      .from('units')
      .select('current_odometer')
      .eq('id', unitId)
      .single()

    const { data, error } = await $supabase
      .from('trip_logs')
      .insert({
        unit_id: unitId,
        incident_id: incidentId || null,
        start_time: new Date().toISOString(),
        start_odometer: unit?.current_odometer || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to start trip:', error)
      return { success: false, error: error.message }
    }

    await gps.startTracking(unitId, incidentId)

    return { success: true, data }
  }

  const endTrip = async (tripId: string) => {
    const { data: trip } = await $supabase
      .from('trip_logs')
      .select('*, unit:units(current_odometer)')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return { success: false, error: 'Trip not found' }
    }

    gps.stopTracking()

    const endOdometer = trip.unit?.current_odometer || 0
    const tripDistance = endOdometer - trip.start_odometer

    const trackingHistory = await gps.getTrackingHistory(trip.unit_id, trip.incident_id)
    const speeds = trackingHistory.map(t => t.speed).filter(s => s !== null) as number[]
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0

    const lightsSirensData = trip.incident_id
      ? await lightsSirens.getIncidentLightsSirensData(trip.incident_id)
      : null

    const { error } = await $supabase
      .from('trip_logs')
      .update({
        end_time: new Date().toISOString(),
        end_odometer: endOdometer,
        trip_distance: tripDistance,
        average_speed: avgSpeed,
        max_speed: maxSpeed,
        lights_used: lightsSirensData?.lights_used || false,
        sirens_used: lightsSirensData?.sirens_used || false,
        lights_duration_seconds: lightsSirensData?.lights_duration_seconds || 0,
        sirens_duration_seconds: lightsSirensData?.sirens_duration_seconds || 0,
        route_data: trackingHistory.map(t => ({
          lat: t.latitude,
          lng: t.longitude,
          timestamp: t.timestamp
        }))
      })
      .eq('id', tripId)

    if (error) {
      console.error('Failed to end trip:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const getTripLog = async (tripId: string) => {
    const { data, error } = await $supabase
      .from('trip_logs')
      .select('*')
      .eq('id', tripId)
      .single()

    if (error) {
      console.error('Failed to fetch trip log:', error)
      return null
    }

    return data
  }

  const getIncidentTripLog = async (incidentId: string) => {
    const { data, error } = await $supabase
      .from('trip_logs')
      .select('*')
      .eq('incident_id', incidentId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch incident trip log:', error)
      return null
    }

    return data
  }

  const getActiveTrip = async (unitId: string) => {
    const { data, error } = await $supabase
      .from('trip_logs')
      .select('*')
      .eq('unit_id', unitId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch active trip:', error)
      return null
    }

    return data
  }

  const linkTripToEPCR = async (tripId: string, epcrId: string) => {
    const { error } = await $supabase
      .from('trip_logs')
      .update({ epcr_id: epcrId })
      .eq('id', tripId)

    if (error) {
      console.error('Failed to link trip to ePCR:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const getUnitTripHistory = async (unitId: string, days = 30) => {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await $supabase
      .from('trip_logs')
      .select('*')
      .eq('unit_id', unitId)
      .gte('start_time', since.toISOString())
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Failed to fetch trip history:', error)
      return []
    }

    return data || []
  }

  return {
    startTrip,
    endTrip,
    getTripLog,
    getIncidentTripLog,
    getActiveTrip,
    linkTripToEPCR,
    getUnitTripHistory
  }
}
