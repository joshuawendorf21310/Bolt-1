export const useGPSTracking = () => {
  const { $supabase } = useNuxtApp()

  let watchId: number | null = null
  let lastPosition: { lat: number; lng: number } | null = null
  let totalDistance = 0
  let tripDistance = 0

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const startTracking = async (unitId: string, incidentId?: string) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return { success: false, error: 'Geolocation not supported' }
    }

    const { data: lastTracking } = await $supabase
      .from('gps_tracking')
      .select('total_distance, latitude, longitude')
      .eq('unit_id', unitId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastTracking) {
      totalDistance = lastTracking.total_distance || 0
      lastPosition = { lat: lastTracking.latitude, lng: lastTracking.longitude }
    }

    tripDistance = 0

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        let distanceIncrement = 0
        if (lastPosition) {
          distanceIncrement = calculateDistance(
            lastPosition.lat,
            lastPosition.lng,
            currentPosition.lat,
            currentPosition.lng
          )
          tripDistance += distanceIncrement
          totalDistance += distanceIncrement
        }

        const trackingData = {
          unit_id: unitId,
          incident_id: incidentId || null,
          timestamp: new Date().toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          speed: position.coords.speed ? position.coords.speed * 2.237 : null,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
          trip_distance: tripDistance,
          total_distance: totalDistance
        }

        const { error } = await $supabase
          .from('gps_tracking')
          .insert(trackingData)

        if (error) {
          console.error('Failed to save GPS tracking:', error)
        }

        await $supabase
          .from('units')
          .update({
            current_odometer: totalDistance,
            updated_at: new Date().toISOString()
          })
          .eq('id', unitId)

        lastPosition = currentPosition
      },
      (error) => {
        console.error('GPS tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )

    return { success: true, watchId }
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    lastPosition = null
    tripDistance = 0
  }

  const getCurrentPosition = async () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      })
    })
  }

  const getTrackingHistory = async (unitId: string, incidentId?: string, hours = 24) => {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    let query = $supabase
      .from('gps_tracking')
      .select('*')
      .eq('unit_id', unitId)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: true })

    if (incidentId) {
      query = query.eq('incident_id', incidentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch tracking history:', error)
      return []
    }

    return data || []
  }

  const getTripMileage = async (incidentId: string) => {
    const { data, error } = await $supabase
      .from('gps_tracking')
      .select('trip_distance')
      .eq('incident_id', incidentId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch trip mileage:', error)
      return 0
    }

    return data?.trip_distance || 0
  }

  const getUnitLocation = async (unitId: string) => {
    const { data, error } = await $supabase
      .from('gps_tracking')
      .select('latitude, longitude, speed, heading, timestamp')
      .eq('unit_id', unitId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch unit location:', error)
      return null
    }

    return data
  }

  const simulateGPSTracking = async (unitId: string, incidentId?: string) => {
    const baseLatitude = 40.7128
    const baseLongitude = -74.0060

    const trackingData = {
      unit_id: unitId,
      incident_id: incidentId || null,
      timestamp: new Date().toISOString(),
      latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
      longitude: baseLongitude + (Math.random() - 0.5) * 0.1,
      altitude: 10 + Math.random() * 100,
      speed: Math.random() * 60,
      heading: Math.random() * 360,
      accuracy: 5 + Math.random() * 10,
      trip_distance: Math.random() * 20,
      total_distance: 5000 + Math.random() * 50000
    }

    const { error } = await $supabase
      .from('gps_tracking')
      .insert(trackingData)

    if (error) {
      console.error('Failed to insert simulated GPS tracking:', error)
      return null
    }

    return trackingData
  }

  return {
    startTracking,
    stopTracking,
    getCurrentPosition,
    getTrackingHistory,
    getTripMileage,
    getUnitLocation,
    simulateGPSTracking,
    get currentTripDistance() {
      return tripDistance
    },
    get currentTotalDistance() {
      return totalDistance
    }
  }
}
