export const useTelehealth = () => {
  const supabase = useSupabaseClient()

  const createTelehealthEncounter = async (data: {
    patientName: string
    patientDob: string
    sessionStart: string
    providerType: string
    serviceCategory: string
    disposition: string
  }) => {
    const encounterNumber = `TH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data: encounter, error } = await supabase
      .from('telehealth_encounters')
      .insert({
        encounter_number: encounterNumber,
        patient_name: data.patientName,
        patient_dob: data.patientDob,
        session_start: data.sessionStart,
        provider_type: data.providerType,
        service_category: data.serviceCategory,
        disposition: data.disposition,
        is_billable: true
      })
      .select()
      .single()

    if (error) throw error
    return encounter
  }

  const completeTelehealthSession = async (
    encounterId: string,
    sessionEnd: string,
    clinicalNotes: string,
    resultedInTransport: boolean,
    transportIncidentId?: string
  ) => {
    const sessionStart = new Date((await supabase
      .from('telehealth_encounters')
      .select('session_start')
      .eq('id', encounterId)
      .single()).data?.session_start || '')

    const sessionEndDate = new Date(sessionEnd)
    const durationMinutes = Math.round((sessionEndDate.getTime() - sessionStart.getTime()) / 60000)

    const { error } = await supabase
      .from('telehealth_encounters')
      .update({
        session_end: sessionEnd,
        duration_minutes: durationMinutes,
        clinical_notes: clinicalNotes,
        resulted_in_transport: resultedInTransport,
        transport_incident_id: transportIncidentId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', encounterId)

    if (error) throw error
  }

  const createTelehealthBillingEvent = async (data: {
    encounterId: string
    cptCode: string
    serviceDescription: string
    chargeAmount: number
    payerPath: 'insurance' | 'patient_self_pay' | 'contracted_organization'
    billingClaimId?: string
    privateInvoiceId?: string
  }) => {
    const { data: billingEvent, error } = await supabase
      .from('telehealth_billing_events')
      .insert({
        encounter_id: data.encounterId,
        cpt_code: data.cptCode,
        service_description: data.serviceDescription,
        charge_amount: data.chargeAmount,
        payer_path: data.payerPath,
        billing_claim_id: data.billingClaimId || null,
        private_invoice_id: data.privateInvoiceId || null,
        billing_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return billingEvent
  }

  const linkTelehealthToTransport = async (
    telehealthEncounterId: string,
    transportIncidentId: string,
    billingRelationship: 'separate' | 'bundled' | 'telehealth_only' | 'transport_only',
    bundlingRule: string
  ) => {
    const { error } = await supabase
      .from('telehealth_transport_bundles')
      .insert({
        telehealth_encounter_id: telehealthEncounterId,
        transport_incident_id: transportIncidentId,
        billing_relationship: billingRelationship,
        bundling_rule: bundlingRule
      })

    if (error) throw error
  }

  const getTelehealthEncounters = async (filters?: {
    startDate?: string
    endDate?: string
    disposition?: string
    isBillable?: boolean
  }) => {
    let query = supabase
      .from('telehealth_encounters')
      .select('*')
      .order('session_start', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('session_start', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('session_start', filters.endDate)
    }
    if (filters?.disposition) {
      query = query.eq('disposition', filters.disposition)
    }
    if (filters?.isBillable !== undefined) {
      query = query.eq('is_billable', filters.isBillable)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const getTelehealthBillingEvents = async (encounterId: string) => {
    const { data, error } = await supabase
      .from('telehealth_billing_events')
      .select('*')
      .eq('encounter_id', encounterId)

    if (error) throw error
    return data || []
  }

  const getTelehealthAnalytics = async () => {
    const { data: encounters } = await supabase
      .from('telehealth_encounters')
      .select('*')

    const { data: billingEvents } = await supabase
      .from('telehealth_billing_events')
      .select('*')

    const totalEncounters = encounters?.length || 0
    const billableEncounters = encounters?.filter(e => e.is_billable).length || 0
    const transportDispatched = encounters?.filter(e => e.resulted_in_transport).length || 0

    const totalRevenue = billingEvents?.reduce((sum, e) => sum + Number(e.charge_amount), 0) || 0
    const paidRevenue = billingEvents
      ?.filter(e => e.billing_status === 'paid')
      .reduce((sum, e) => sum + Number(e.charge_amount), 0) || 0

    return {
      totalEncounters,
      billableEncounters,
      transportDispatched,
      totalRevenue,
      paidRevenue,
      transportRate: totalEncounters ? (transportDispatched / totalEncounters) * 100 : 0
    }
  }

  return {
    createTelehealthEncounter,
    completeTelehealthSession,
    createTelehealthBillingEvent,
    linkTelehealthToTransport,
    getTelehealthEncounters,
    getTelehealthBillingEvents,
    getTelehealthAnalytics
  }
}
