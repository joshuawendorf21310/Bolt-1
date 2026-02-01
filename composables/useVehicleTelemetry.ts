export const useVehicleTelemetry = () => {
  const { $supabase } = useNuxtApp()

  const startTelemetryTracking = async (unitId: string) => {
    if (!('serial' in navigator)) {
      console.warn('Web Serial API not supported')
      return null
    }

    try {
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 38400 })

      const reader = port.readable.getReader()
      const writer = port.writable.getWriter()

      return {
        port,
        reader,
        writer,
        readTelemetry: async () => {
          const obdCommands = {
            speed: '010D',
            rpm: '010C',
            engineTemp: '0105',
            fuelLevel: '012F',
            batteryVoltage: '0142',
            engineLoad: '0104',
            throttlePosition: '0111',
            coolantTemp: '0105',
            oilPressure: '010A',
            dtcCodes: '03'
          }

          const telemetryData: any = {
            unit_id: unitId,
            timestamp: new Date().toISOString()
          }

          for (const [key, command] of Object.entries(obdCommands)) {
            try {
              const encoder = new TextEncoder()
              await writer.write(encoder.encode(`${command}\r`))

              const { value } = await reader.read()
              const decoder = new TextDecoder()
              const response = decoder.decode(value)

              telemetryData[key] = parseOBDResponse(command, response)
            } catch (err) {
              console.error(`Failed to read ${key}:`, err)
            }
          }

          const { error } = await $supabase
            .from('vehicle_telemetry')
            .insert(telemetryData)

          if (error) {
            console.error('Failed to insert telemetry:', error)
          }

          return telemetryData
        },
        close: async () => {
          reader.releaseLock()
          writer.releaseLock()
          await port.close()
        }
      }
    } catch (err) {
      console.error('Failed to connect to OBD:', err)
      return null
    }
  }

  const parseOBDResponse = (command: string, response: string): any => {
    const cleaned = response.replace(/\s/g, '')

    switch (command) {
      case '010D':
        return parseInt(cleaned.substring(4, 6), 16)
      case '010C':
        return parseInt(cleaned.substring(4, 8), 16) / 4
      case '0105':
      case '0142':
        return parseInt(cleaned.substring(4, 6), 16) - 40
      case '012F':
      case '0104':
      case '0111':
        return (parseInt(cleaned.substring(4, 6), 16) * 100) / 255
      default:
        return cleaned.substring(4)
    }
  }

  const getTelemetryHistory = async (unitId: string, hours = 24) => {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    const { data, error } = await $supabase
      .from('vehicle_telemetry')
      .select('*')
      .eq('unit_id', unitId)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Failed to fetch telemetry history:', error)
      return []
    }

    return data || []
  }

  const getLatestTelemetry = async (unitId: string) => {
    const { data, error } = await $supabase
      .from('vehicle_telemetry')
      .select('*')
      .eq('unit_id', unitId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch latest telemetry:', error)
      return null
    }

    return data
  }

  const simulateTelemetry = async (unitId: string) => {
    const telemetryData = {
      unit_id: unitId,
      timestamp: new Date().toISOString(),
      speed_mph: Math.random() * 60,
      rpm: 1000 + Math.random() * 3000,
      engine_temp: 180 + Math.random() * 40,
      fuel_level: 30 + Math.random() * 70,
      battery_voltage: 12 + Math.random() * 2,
      odometer: 50000 + Math.random() * 100000,
      engine_load: 20 + Math.random() * 60,
      throttle_position: Math.random() * 100,
      coolant_temp: 180 + Math.random() * 30,
      oil_pressure: 30 + Math.random() * 50,
      check_engine_light: Math.random() > 0.95,
      dtc_codes: Math.random() > 0.95 ? ['P0301', 'P0420'] : []
    }

    const { error } = await $supabase
      .from('vehicle_telemetry')
      .insert(telemetryData)

    if (error) {
      console.error('Failed to insert simulated telemetry:', error)
      return null
    }

    return telemetryData
  }

  return {
    startTelemetryTracking,
    getTelemetryHistory,
    getLatestTelemetry,
    simulateTelemetry
  }
}
