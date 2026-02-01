import { ref, computed } from 'vue'

export const useFireOperations = () => {
  const { $supabase } = useNuxtApp()
  const supabase = $supabase

  const incidents = ref<any[]>([])
  const apparatus = ref<any[]>([])
  const personnel = ref<any[]>([])
  const stations = ref<any[]>([])
  const currentDepartment = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadIncidents = async () => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('fire_incidents')
        .select(`
          *,
          incident_units (
            id,
            status,
            apparatus_id,
            crew_lead,
            personnel_count,
            dispatch_time,
            arrival_time
          ),
          incident_personnel (
            id,
            personnel_id,
            role,
            status
          )
        `)
        .order('dispatch_time', { ascending: false })
        .limit(50)

      if (err) throw err
      incidents.value = data || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const loadApparatus = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fire_apparatus')
        .select(`
          *,
          station_id (
            id,
            name,
            call_sign
          )
        `)
        .order('unit_number')

      if (err) throw err
      apparatus.value = data || []
    } catch (e: any) {
      error.value = e.message
    }
  }

  const loadPersonnel = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fire_personnel')
        .select(`
          *,
          fire_certifications (
            id,
            certification_name,
            expiration_date,
            is_current
          )
        `)
        .eq('is_active', true)
        .order('last_name')

      if (err) throw err
      personnel.value = data || []
    } catch (e: any) {
      error.value = e.message
    }
  }

  const loadStations = async () => {
    try {
      const { data, error: err } = await supabase
        .from('fire_stations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (err) throw err
      stations.value = data || []
    } catch (e: any) {
      error.value = e.message
    }
  }

  const createIncident = async (incidentData: any) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('fire_incidents')
        .insert([incidentData])
        .select()
        .single()

      if (err) throw err
      incidents.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const { data, error: err } = await supabase
        .from('fire_incidents')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId)
        .select()
        .single()

      if (err) throw err

      const idx = incidents.value.findIndex(i => i.id === incidentId)
      if (idx >= 0) {
        incidents.value[idx] = data
      }
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const assignUnitToIncident = async (incidentId: string, apparatusId: string, crewLead?: string) => {
    try {
      const { data, error: err } = await supabase
        .from('incident_units')
        .insert([{
          incident_id: incidentId,
          apparatus_id: apparatusId,
          crew_lead: crewLead,
          dispatch_time: new Date().toISOString(),
          status: 'dispatched'
        }])
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const assignPersonnelToIncident = async (
    incidentId: string,
    personnelId: string,
    role: string,
    unitId?: string
  ) => {
    try {
      const { data, error: err } = await supabase
        .from('incident_personnel')
        .insert([{
          incident_id: incidentId,
          personnel_id: personnelId,
          role,
          unit_id: unitId,
          dispatch_time: new Date().toISOString(),
          status: 'assigned'
        }])
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const updatePersonnelStatus = async (
    incidentPersonnelId: string,
    status: string,
    timestamp: string = 'dispatch_time'
  ) => {
    try {
      const update: any = { status }
      if (timestamp === 'arrival') update.arrival_time = new Date().toISOString()
      if (timestamp === 'departure') update.departure_time = new Date().toISOString()
      if (timestamp === 'check_in') update.accountability_check_in = new Date().toISOString()
      if (timestamp === 'check_out') update.accountability_check_out = new Date().toISOString()

      const { data, error: err } = await supabase
        .from('incident_personnel')
        .update(update)
        .eq('id', incidentPersonnelId)
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const updateApparatusStatus = async (apparatusId: string, status: string) => {
    try {
      const { data, error: err } = await supabase
        .from('fire_apparatus')
        .update({
          current_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', apparatusId)
        .select()
        .single()

      if (err) throw err

      const idx = apparatus.value.findIndex(a => a.id === apparatusId)
      if (idx >= 0) {
        apparatus.value[idx] = data
      }
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const recordTraining = async (personnelId: string, trainingData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('fire_training_records')
        .insert([{
          personnel_id: personnelId,
          ...trainingData
        }])
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const recordCertification = async (personnelId: string, certData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('fire_certifications')
        .insert([{
          personnel_id: personnelId,
          ...certData
        }])
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e.message
      return null
    }
  }

  const getIncidentById = (id: string) => {
    return incidents.value.find(i => i.id === id)
  }

  const getPersonnelById = (id: string) => {
    return personnel.value.find(p => p.id === id)
  }

  const getApparatusById = (id: string) => {
    return apparatus.value.find(a => a.id === id)
  }

  const activeIncidents = computed(() => {
    return incidents.value.filter(i => i.status !== 'cleared')
  })

  const respondingUnits = computed(() => {
    return apparatus.value.filter(a => a.current_status === 'in_service')
  })

  const availableUnits = computed(() => {
    return apparatus.value.filter(a => a.current_status === 'available')
  })

  const certificationExpiringPersonnel = computed(() => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    return personnel.value.filter(p => {
      return p.fire_certifications?.some((cert: any) => {
        if (!cert.is_current) return false
        const expDate = new Date(cert.expiration_date)
        return expDate <= thirtyDaysFromNow
      })
    })
  })

  return {
    // State
    incidents,
    apparatus,
    personnel,
    stations,
    loading,
    error,

    // Loaders
    loadIncidents,
    loadApparatus,
    loadPersonnel,
    loadStations,

    // Incident operations
    createIncident,
    updateIncidentStatus,
    getIncidentById,

    // Unit operations
    assignUnitToIncident,
    updateApparatusStatus,
    getApparatusById,

    // Personnel operations
    assignPersonnelToIncident,
    updatePersonnelStatus,
    recordTraining,
    recordCertification,
    getPersonnelById,

    // Computed
    activeIncidents,
    respondingUnits,
    availableUnits,
    certificationExpiringPersonnel
  }
}
