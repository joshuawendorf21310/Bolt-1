export const useCrewRoster = () => {
  const { $supabase } = useNuxtApp()

  const getCrewRoster = async (organizationId: string) => {
    const { data, error } = await $supabase
      .from('crew_roster')
      .select(`
        *,
        user:users(full_name, email),
        shifts:crew_shifts(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('current_status', { ascending: false })

    if (error) {
      console.error('Failed to fetch crew roster:', error)
      return []
    }

    return data || []
  }

  const getCrewMember = async (crewId: string) => {
    const { data, error } = await $supabase
      .from('crew_roster')
      .select(`
        *,
        user:users(full_name, email),
        current_assignment:crew_assignments!crew_assignments_crew_id_fkey(
          *,
          unit:units(unit_number)
        )
      `)
      .eq('id', crewId)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch crew member:', error)
      return null
    }

    return data
  }

  const getAvailableCrew = async (organizationId: string) => {
    const { data, error } = await $supabase
      .from('crew_roster')
      .select('*, user:users(full_name)')
      .eq('organization_id', organizationId)
      .in('current_status', ['available', 'on_call'])
      .eq('is_active', true)
      .order('current_status', { ascending: false })

    if (error) {
      console.error('Failed to fetch available crew:', error)
      return []
    }

    return data || []
  }

  const updateCrewStatus = async (
    crewId: string,
    newStatus: string,
    options: {
      unitId?: string
      incidentId?: string
      location?: { lat: number; lng: number }
      notes?: string
    } = {}
  ) => {
    const { data: crew } = await $supabase
      .from('crew_roster')
      .select('current_status')
      .eq('id', crewId)
      .single()

    const previousStatus = crew?.current_status

    const { error: updateError } = await $supabase
      .from('crew_roster')
      .update({
        current_status: newStatus,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', crewId)

    if (updateError) {
      console.error('Failed to update crew status:', updateError)
      return { success: false, error: updateError.message }
    }

    const { error: logError } = await $supabase
      .from('crew_status_log')
      .insert({
        crew_id: crewId,
        previous_status: previousStatus,
        new_status: newStatus,
        unit_id: options.unitId || null,
        incident_id: options.incidentId || null,
        location_lat: options.location?.lat || null,
        location_lng: options.location?.lng || null,
        notes: options.notes || null
      })

    if (logError) {
      console.error('Failed to log crew status change:', logError)
    }

    return { success: true }
  }

  const assignCrewToUnit = async (
    crewId: string,
    unitId: string,
    role: string,
    incidentId?: string
  ) => {
    const { data: existingAssignment } = await $supabase
      .from('crew_assignments')
      .select('id')
      .eq('crew_id', crewId)
      .eq('is_active', true)
      .maybeSingle()

    if (existingAssignment) {
      await $supabase
        .from('crew_assignments')
        .update({
          is_active: false,
          assignment_end: new Date().toISOString()
        })
        .eq('id', existingAssignment.id)
    }

    const { data, error } = await $supabase
      .from('crew_assignments')
      .insert({
        crew_id: crewId,
        unit_id: unitId,
        incident_id: incidentId || null,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to assign crew to unit:', error)
      return { success: false, error: error.message }
    }

    await updateCrewStatus(crewId, 'assigned', { unitId, incidentId })

    return { success: true, data }
  }

  const unassignCrewFromUnit = async (assignmentId: string) => {
    const { data: assignment } = await $supabase
      .from('crew_assignments')
      .select('crew_id')
      .eq('id', assignmentId)
      .single()

    const { error } = await $supabase
      .from('crew_assignments')
      .update({
        is_active: false,
        assignment_end: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (error) {
      console.error('Failed to unassign crew from unit:', error)
      return { success: false, error: error.message }
    }

    if (assignment) {
      await updateCrewStatus(assignment.crew_id, 'available')
    }

    return { success: true }
  }

  const getUnitCrew = async (unitId: string) => {
    const { data, error } = await $supabase
      .from('crew_assignments')
      .select(`
        *,
        crew:crew_roster(
          *,
          user:users(full_name, email)
        )
      `)
      .eq('unit_id', unitId)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to fetch unit crew:', error)
      return []
    }

    return data || []
  }

  const scheduleShift = async (shift: {
    crewId: string
    organizationId: string
    shiftDate: string
    shiftStart: string
    shiftEnd: string
    shiftType?: string
    assignedStation?: string
    assignedUnitId?: string
    role?: string
    notes?: string
  }) => {
    const { data, error } = await $supabase
      .from('crew_shifts')
      .insert({
        crew_id: shift.crewId,
        organization_id: shift.organizationId,
        shift_date: shift.shiftDate,
        shift_start: shift.shiftStart,
        shift_end: shift.shiftEnd,
        shift_type: shift.shiftType || 'regular',
        assigned_station: shift.assignedStation || null,
        assigned_unit_id: shift.assignedUnitId || null,
        role: shift.role || null,
        notes: shift.notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to schedule shift:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const getShiftSchedule = async (organizationId: string, startDate: string, endDate: string) => {
    const { data, error } = await $supabase
      .from('crew_shifts')
      .select(`
        *,
        crew:crew_roster(
          *,
          user:users(full_name, email)
        ),
        unit:units(unit_number)
      `)
      .eq('organization_id', organizationId)
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_start', { ascending: true })

    if (error) {
      console.error('Failed to fetch shift schedule:', error)
      return []
    }

    return data || []
  }

  const checkInShift = async (shiftId: string) => {
    const { error } = await $supabase
      .from('crew_shifts')
      .update({
        checked_in_at: new Date().toISOString()
      })
      .eq('id', shiftId)

    if (error) {
      console.error('Failed to check in shift:', error)
      return { success: false, error: error.message }
    }

    const { data: shift } = await $supabase
      .from('crew_shifts')
      .select('crew_id')
      .eq('id', shiftId)
      .single()

    if (shift) {
      await updateCrewStatus(shift.crew_id, 'available')
    }

    return { success: true }
  }

  const checkOutShift = async (shiftId: string) => {
    const { error } = await $supabase
      .from('crew_shifts')
      .update({
        checked_out_at: new Date().toISOString()
      })
      .eq('id', shiftId)

    if (error) {
      console.error('Failed to check out shift:', error)
      return { success: false, error: error.message }
    }

    const { data: shift } = await $supabase
      .from('crew_shifts')
      .select('crew_id')
      .eq('id', shiftId)
      .single()

    if (shift) {
      await updateCrewStatus(shift.crew_id, 'off_duty')
    }

    return { success: true }
  }

  return {
    getCrewRoster,
    getCrewMember,
    getAvailableCrew,
    updateCrewStatus,
    assignCrewToUnit,
    unassignCrewFromUnit,
    getUnitCrew,
    scheduleShift,
    getShiftSchedule,
    checkInShift,
    checkOutShift
  }
}
