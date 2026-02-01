export const useBuilders = () => {
  const supabase = useSupabaseClient()

  const createInvoice = async (invoiceData: {
    invoiceNumber: string
    invoiceType: 'patient_pay' | 'private_party' | 'platform_fee' | 'agency_billing'
    encounterId?: string
    agencyId?: string
    billableCallId?: string
    payerType?: 'insurance' | 'patient' | 'private_party'
    payerName?: string
    payerContact?: any
    dueDate?: string
  }) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceData.invoiceNumber,
        invoice_type: invoiceData.invoiceType,
        invoice_state: 'draft',
        encounter_id: invoiceData.encounterId,
        agency_id: invoiceData.agencyId,
        billable_call_id: invoiceData.billableCallId,
        payer_type: invoiceData.payerType,
        payer_name: invoiceData.payerName,
        payer_contact: invoiceData.payerContact,
        due_date: invoiceData.dueDate
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const addInvoiceLineItem = async (lineItemData: {
    invoiceId: string
    lineNumber: number
    itemType: string
    description: string
    quantity: number
    unitPriceCents: number
    metadata?: any
  }) => {
    const lineTotalCents = Math.round(lineItemData.quantity * lineItemData.unitPriceCents)

    const { data, error } = await supabase
      .from('invoice_line_items')
      .insert({
        invoice_id: lineItemData.invoiceId,
        line_number: lineItemData.lineNumber,
        item_type: lineItemData.itemType,
        description: lineItemData.description,
        quantity: lineItemData.quantity,
        unit_price_cents: lineItemData.unitPriceCents,
        line_total_cents: lineTotalCents,
        metadata: lineItemData.metadata || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const calculateInvoiceTotals = async (invoiceId: string) => {
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('line_total_cents')
      .eq('invoice_id', invoiceId)

    const subtotalCents = lineItems?.reduce((sum, item) => sum + item.line_total_cents, 0) || 0
    const totalCents = subtotalCents

    const { error } = await supabase
      .from('invoices')
      .update({
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        balance_cents: totalCents,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) throw error

    return { subtotalCents, totalCents }
  }

  const finalizeInvoice = async (invoiceId: string) => {
    await calculateInvoiceTotals(invoiceId)

    const { error } = await supabase
      .from('invoices')
      .update({
        invoice_state: 'final',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) throw error
  }

  const sendInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({
        invoice_state: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) throw error
  }

  const getInvoice = async (invoiceId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_line_items (*)
      `)
      .eq('id', invoiceId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  const getInvoices = async (filters?: { state?: string; agencyId?: string; invoiceType?: string }) => {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.state) {
      query = query.eq('invoice_state', filters.state)
    }
    if (filters?.agencyId) {
      query = query.eq('agency_id', filters.agencyId)
    }
    if (filters?.invoiceType) {
      query = query.eq('invoice_type', filters.invoiceType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const createNEMSISValidation = async (validationData: {
    epcrId: string
    validationVersion: string
    requiredFieldsComplete: number
    requiredFieldsTotal: number
    validationErrors?: any[]
    validationWarnings?: any[]
  }) => {
    const exportReady = validationData.requiredFieldsComplete === validationData.requiredFieldsTotal &&
                        (!validationData.validationErrors || validationData.validationErrors.length === 0)

    const validationStatus = exportReady ? 'valid' :
                            validationData.requiredFieldsComplete < validationData.requiredFieldsTotal ? 'incomplete' :
                            'invalid'

    const { data, error } = await supabase
      .from('nemsis_validations')
      .insert({
        epcr_id: validationData.epcrId,
        validation_version: validationData.validationVersion,
        validation_status: validationStatus,
        required_fields_complete: validationData.requiredFieldsComplete,
        required_fields_total: validationData.requiredFieldsTotal,
        validation_errors: validationData.validationErrors || [],
        validation_warnings: validationData.validationWarnings || [],
        export_ready: exportReady
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getNEMSISValidation = async (epcrId: string) => {
    const { data, error } = await supabase
      .from('nemsis_validations')
      .select('*')
      .eq('epcr_id', epcrId)
      .order('validated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  }

  const markNEMSISExported = async (validationId: string, exportFormat: string) => {
    const { error } = await supabase
      .from('nemsis_validations')
      .update({
        exported_at: new Date().toISOString(),
        export_format: exportFormat
      })
      .eq('id', validationId)

    if (error) throw error
  }

  const mapRxNorm = async (mappingData: {
    medicationEntry: string
    rxnormConceptId?: string
    rxnormName?: string
    dose?: string
    doseUnit?: string
    route?: string
    mappingStatus: 'unmapped' | 'suggested' | 'confirmed' | 'unknown'
    mappingConfidence?: number
    mappedBy?: string
  }) => {
    const { data, error } = await supabase
      .from('rxnorm_mappings')
      .insert({
        medication_entry: mappingData.medicationEntry,
        rxnorm_concept_id: mappingData.rxnormConceptId,
        rxnorm_name: mappingData.rxnormName,
        dose: mappingData.dose,
        dose_unit: mappingData.doseUnit,
        route: mappingData.route,
        mapping_status: mappingData.mappingStatus,
        mapping_confidence: mappingData.mappingConfidence,
        mapped_by: mappingData.mappedBy,
        mapped_at: mappingData.mappingStatus === 'confirmed' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const confirmRxNormMapping = async (mappingId: string, mappedBy: string) => {
    const { error } = await supabase
      .from('rxnorm_mappings')
      .update({
        mapping_status: 'confirmed',
        mapped_by: mappedBy,
        mapped_at: new Date().toISOString()
      })
      .eq('id', mappingId)

    if (error) throw error
  }

  const getRxNormMappings = async (status?: string) => {
    let query = supabase
      .from('rxnorm_mappings')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('mapping_status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const mapSNOMED = async (mappingData: {
    clinicalTerm: string
    snomedConceptId?: string
    snomedDescription?: string
    termType: 'symptom' | 'finding' | 'impression' | 'procedure' | 'other'
    mappingStatus: 'unmapped' | 'suggested' | 'confirmed' | 'unknown'
    mappingConfidence?: number
    mappedBy?: string
  }) => {
    const { data, error } = await supabase
      .from('snomed_mappings')
      .insert({
        clinical_term: mappingData.clinicalTerm,
        snomed_concept_id: mappingData.snomedConceptId,
        snomed_description: mappingData.snomedDescription,
        term_type: mappingData.termType,
        mapping_status: mappingData.mappingStatus,
        mapping_confidence: mappingData.mappingConfidence,
        mapped_by: mappingData.mappedBy,
        mapped_at: mappingData.mappingStatus === 'confirmed' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const confirmSNOMEDMapping = async (mappingId: string, mappedBy: string) => {
    const { error } = await supabase
      .from('snomed_mappings')
      .update({
        mapping_status: 'confirmed',
        mapped_by: mappedBy,
        mapped_at: new Date().toISOString()
      })
      .eq('id', mappingId)

    if (error) throw error
  }

  const getSNOMEDMappings = async (status?: string) => {
    let query = supabase
      .from('snomed_mappings')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('mapping_status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  return {
    createInvoice,
    addInvoiceLineItem,
    calculateInvoiceTotals,
    finalizeInvoice,
    sendInvoice,
    getInvoice,
    getInvoices,
    createNEMSISValidation,
    getNEMSISValidation,
    markNEMSISExported,
    mapRxNorm,
    confirmRxNormMapping,
    getRxNormMappings,
    mapSNOMED,
    confirmSNOMEDMapping,
    getSNOMEDMappings
  }
}
