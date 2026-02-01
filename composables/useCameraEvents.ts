export const useCameraEvents = () => {
  const { $supabase } = useNuxtApp()

  const recordEvent = async (
    unitId: string,
    cameraType: 'front_facing' | 'rear_facing',
    eventType: 'fatigue_detected' | 'collision_detected' | 'hard_brake' | 'object_detected' | 'lane_departure',
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical'
      videoUrl?: string
      snapshotUrl?: string
      metadata?: any
    } = {}
  ) => {
    const { data, error } = await $supabase
      .from('camera_events')
      .insert({
        unit_id: unitId,
        camera_type: cameraType,
        event_type: eventType,
        severity: options.severity || 'medium',
        video_url: options.videoUrl || null,
        snapshot_url: options.snapshotUrl || null,
        metadata: options.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record camera event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const getEvents = async (options: {
    unitId?: string
    cameraType?: string
    eventType?: string
    severity?: string
    acknowledged?: boolean
    limit?: number
    hours?: number
  } = {}) => {
    let query = $supabase
      .from('camera_events')
      .select('*')
      .order('timestamp', { ascending: false })

    if (options.unitId) {
      query = query.eq('unit_id', options.unitId)
    }

    if (options.cameraType) {
      query = query.eq('camera_type', options.cameraType)
    }

    if (options.eventType) {
      query = query.eq('event_type', options.eventType)
    }

    if (options.severity) {
      query = query.eq('severity', options.severity)
    }

    if (options.acknowledged !== undefined) {
      query = query.eq('acknowledged', options.acknowledged)
    }

    if (options.hours) {
      const since = new Date()
      since.setHours(since.getHours() - options.hours)
      query = query.gte('timestamp', since.toISOString())
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch camera events:', error)
      return []
    }

    return data || []
  }

  const acknowledgeEvent = async (eventId: string, userId: string) => {
    const { error } = await $supabase
      .from('camera_events')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (error) {
      console.error('Failed to acknowledge event:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const getUnacknowledgedCount = async (unitId?: string) => {
    let query = $supabase
      .from('camera_events')
      .select('id', { count: 'exact', head: true })
      .eq('acknowledged', false)

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Failed to get unacknowledged count:', error)
      return 0
    }

    return count || 0
  }

  const startFatigueMonitoring = (unitId: string, videoElement: HTMLVideoElement) => {
    let monitoringInterval: NodeJS.Timeout | null = null

    const checkForFatigue = async () => {
      if (!videoElement || videoElement.paused) return

      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(videoElement, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const brightness = calculateBrightness(imageData)

      if (brightness < 50) {
        await recordEvent(unitId, 'front_facing', 'fatigue_detected', {
          severity: 'high',
          snapshotUrl: canvas.toDataURL('image/jpeg'),
          metadata: { brightness, timestamp: new Date().toISOString() }
        })
      }
    }

    const calculateBrightness = (imageData: ImageData): number => {
      let totalBrightness = 0
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        totalBrightness += (r + g + b) / 3
      }
      return totalBrightness / (data.length / 4)
    }

    monitoringInterval = setInterval(checkForFatigue, 5000)

    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval)
      }
    }
  }

  const simulateCameraEvent = async (unitId: string) => {
    const cameraTypes: Array<'front_facing' | 'rear_facing'> = ['front_facing', 'rear_facing']
    const frontEventTypes: Array<'fatigue_detected' | 'collision_detected' | 'hard_brake' | 'object_detected' | 'lane_departure'> = ['fatigue_detected']
    const rearEventTypes: Array<'fatigue_detected' | 'collision_detected' | 'hard_brake' | 'object_detected' | 'lane_departure'> = ['collision_detected', 'hard_brake', 'object_detected', 'lane_departure']
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']

    const cameraType = cameraTypes[Math.floor(Math.random() * cameraTypes.length)]
    const eventTypes = cameraType === 'front_facing' ? frontEventTypes : rearEventTypes
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]

    return await recordEvent(unitId, cameraType, eventType, {
      severity,
      snapshotUrl: `https://picsum.photos/seed/${Date.now()}/640/480`,
      metadata: {
        simulated: true,
        timestamp: new Date().toISOString()
      }
    })
  }

  return {
    recordEvent,
    getEvents,
    acknowledgeEvent,
    getUnacknowledgedCount,
    startFatigueMonitoring,
    simulateCameraEvent
  }
}
