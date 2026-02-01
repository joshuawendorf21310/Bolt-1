export const usePatientEncounter = () => {
  const supabase = useSupabaseClient()

  const createEncounter = async (encounterData: any) => {
    const { data, error } = await supabase
      .from('patient_encounters')
      .insert([encounterData])
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const updateEncounter = async (encounterId: string, updates: any) => {
    const { data, error } = await supabase
      .from('patient_encounters')
      .update(updates)
      .eq('id', encounterId)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const recordVitals = async (encounterId: string, vitals: any) => {
    const { data, error } = await supabase
      .from('encounter_vitals')
      .insert([{ encounter_id: encounterId, ...vitals }])
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const recordTreatment = async (encounterId: string, treatment: any) => {
    const { data, error } = await supabase
      .from('encounter_treatments')
      .insert([{ encounter_id: encounterId, ...treatment }])
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const recordMedication = async (encounterId: string, medication: any) => {
    const { data, error } = await supabase
      .from('encounter_medications')
      .insert([{ encounter_id: encounterId, ...medication }])
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const getVitalsHistory = async (encounterId: string) => {
    const { data, error } = await supabase
      .from('encounter_vitals')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('recorded_time', { ascending: false })

    if (error) throw error
    return data
  }

  const getTreatments = async (encounterId: string) => {
    const { data, error } = await supabase
      .from('encounter_treatments')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('treatment_time', { ascending: false })

    if (error) throw error
    return data
  }

  const getMedications = async (encounterId: string) => {
    const { data, error } = await supabase
      .from('encounter_medications')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('medication_time', { ascending: false })

    if (error) throw error
    return data
  }

  const getCompleteEncounter = async (encounterId: string) => {
    const { data: encounter, error: encounterError } = await supabase
      .from('patient_encounters')
      .select('*')
      .eq('id', encounterId)
      .maybeSingle()

    if (encounterError) throw encounterError

    const vitals = await getVitalsHistory(encounterId)
    const treatments = await getTreatments(encounterId)
    const medications = await getMedications(encounterId)

    return {
      encounter,
      vitals: vitals || [],
      treatments: treatments || [],
      medications: medications || [],
    }
  }

  const submitForBilling = async (encounterId: string) => {
    const { data: encounter, error: fetchError } = await supabase
      .from('patient_encounters')
      .select('*')
      .eq('id', encounterId)
      .maybeSingle()

    if (fetchError) throw fetchError

    await supabase
      .from('patient_encounters')
      .update({
        encounter_status: 'completed',
        submitted_for_billing: true,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', encounterId)

    const { data: billingItem, error: billingError } = await supabase
      .from('billing_queue')
      .insert([
        {
          epcr_id: encounterId,
          call_id: encounter?.call_id,
          patient_name: encounter?.patient_name,
          service_date: new Date().toISOString().split('T')[0],
          status: 'pending_review',
          priority_score: encounter?.chief_complaint?.includes('chest') ? 100 : 50,
          insurance_primary: encounter?.insurance_primary,
          insurance_secondary: encounter?.insurance_secondary,
        },
      ])
      .select()
      .maybeSingle()

    if (billingError) throw billingError

    return billingItem
  }

  const getOpenEncounters = async () => {
    const { data, error } = await supabase
      .from('patient_encounters')
      .select('*')
      .eq('encounter_status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  const getEncountersByDate = async (date: string) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('patient_encounters')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  const getEncounterStats = async () => {
    const { count: activeCount } = await supabase
      .from('patient_encounters')
      .select('*', { count: 'exact', head: true })
      .eq('encounter_status', 'active')

    const { count: completedToday } = await supabase
      .from('patient_encounters')
      .select('*', { count: 'exact', head: true })
      .eq('encounter_status', 'completed')
      .gte('created_at', new Date().toISOString().split('T')[0])

    const { count: submittedToday } = await supabase
      .from('patient_encounters')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_for_billing', true)
      .gte('submitted_at', new Date().toISOString().split('T')[0])

    return {
      active_encounters: activeCount || 0,
      completed_today: completedToday || 0,
      submitted_to_billing: submittedToday || 0,
    }
  }

  return {
    createEncounter,
    updateEncounter,
    recordVitals,
    recordTreatment,
    recordMedication,
    getVitalsHistory,
    getTreatments,
    getMedications,
    getCompleteEncounter,
    submitForBilling,
    getOpenEncounters,
    getEncountersByDate,
    getEncounterStats,
  }
}
