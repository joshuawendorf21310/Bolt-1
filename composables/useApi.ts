export const useApi = () => {
  const { $supabase } = useNuxtApp()
  const { employee } = useAuth()

  const handleError = (error: any) => {
    console.error('API Error:', error)
    return {
      success: false,
      error: error.message || 'An error occurred'
    }
  }

  const incidents = {
    list: async (filters?: any) => {
      try {
        let query = $supabase
          .from('incidents')
          .select('*')
          .eq('organization_id', employee.value.organization_id)
          .order('created_at', { ascending: false })

        if (filters?.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status)
          } else {
            query = query.eq('status', filters.status)
          }
        }

        if (filters?.priority) {
          query = query.eq('priority', filters.priority)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    get: async (id: string) => {
      try {
        const { data, error } = await $supabase
          .from('incidents')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    create: async (incidentData: any) => {
      try {
        const { data, error } = await $supabase
          .from('incidents')
          .insert({
            ...incidentData,
            organization_id: employee.value.organization_id,
            created_by: employee.value.id,
            incident_number: `INC-${Date.now()}`,
            dispatch_time: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        await $supabase
          .from('incident_timeline')
          .insert({
            incident_id: data.id,
            event_type: 'Incident Created',
            created_by: employee.value.id
          })

        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    update: async (id: string, updates: any) => {
      try {
        const { data, error } = await $supabase
          .from('incidents')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    }
  }

  const units = {
    list: async (filters?: any) => {
      try {
        let query = $supabase
          .from('units')
          .select('*, unit_type:unit_types(*)')
          .eq('organization_id', employee.value.organization_id)

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        if (filters?.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    updateStatus: async (id: string, status: string) => {
      try {
        const { data, error } = await $supabase
          .from('units')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await $supabase
          .from('unit_status_history')
          .insert({
            unit_id: id,
            status,
            updated_by: employee.value.id
          })

        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    }
  }

  const dispatches = {
    create: async (incidentId: string, unitId: string) => {
      try {
        const { data, error } = await $supabase
          .from('dispatches')
          .insert({
            incident_id: incidentId,
            unit_id: unitId,
            assigned_by: employee.value.id,
            status: 'assigned'
          })
          .select()
          .single()

        if (error) throw error

        await units.updateStatus(unitId, 'dispatched')

        await $supabase
          .from('incident_timeline')
          .insert({
            incident_id: incidentId,
            event_type: 'Unit Dispatched',
            created_by: employee.value.id
          })

        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    updateStatus: async (id: string, status: string) => {
      try {
        const updateData: any = { status }

        if (status === 'acknowledged') updateData.acknowledged_at = new Date().toISOString()
        if (status === 'enroute') updateData.enroute_at = new Date().toISOString()
        if (status === 'on_scene') updateData.on_scene_at = new Date().toISOString()
        if (status === 'cleared') updateData.cleared_at = new Date().toISOString()

        const { data, error } = await $supabase
          .from('dispatches')
          .update(updateData)
          .eq('id', id)
          .select('*, incident:incidents(*)')
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    }
  }

  const patientRecords = {
    list: async (filters?: any) => {
      try {
        let query = $supabase
          .from('patient_records')
          .select('*, incident:incidents(*), transport:transports(*)')
          .eq('organization_id', employee.value.organization_id)
          .order('created_at', { ascending: false })

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    get: async (id: string) => {
      try {
        const { data, error } = await $supabase
          .from('patient_records')
          .select('*, incident:incidents(*), transport:transports(*), destination:destinations(*)')
          .eq('id', id)
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    create: async (recordData: any) => {
      try {
        const { data, error } = await $supabase
          .from('patient_records')
          .insert({
            ...recordData,
            organization_id: employee.value.organization_id,
            record_number: `PCR-${Date.now()}`,
            completed_by: employee.value.id
          })
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    update: async (id: string, updates: any) => {
      try {
        const { data, error } = await $supabase
          .from('patient_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    }
  }

  const transports = {
    list: async (filters?: any) => {
      try {
        let query = $supabase
          .from('transports')
          .select('*, unit:units(*), destination:destinations(*), incident:incidents(*)')
          .order('requested_at', { ascending: false })

        if (filters?.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status)
          } else {
            query = query.eq('status', filters.status)
          }
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    },

    create: async (transportData: any) => {
      try {
        const { data, error } = await $supabase
          .from('transports')
          .insert({
            ...transportData,
            requested_by: employee.value.id,
            status: 'requested'
          })
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return handleError(error)
      }
    }
  }

  return {
    incidents,
    units,
    dispatches,
    patientRecords,
    transports
  }
}
