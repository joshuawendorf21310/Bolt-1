export const useFaceSheet = () => {
  const supabase = useSupabaseClient()

  const calculateFieldConfidence = (field: string, value: string, sources: any[] = []): number => {
    if (!value) return 0

    let confidence = 70

    const trustedSources = ['fhir', 'eligibility', 'direct_api']
    if (sources.some(s => trustedSources.includes(s))) confidence = 95

    const semiTrustedSources = ['email', 'document']
    if (sources.some(s => semiTrustedSources.includes(s))) confidence = 80

    const untrustedSources = ['phone', 'manual']
    if (sources.some(s => untrustedSources.includes(s))) confidence = 65

    if (field.includes('_id') && value.length > 20) confidence += 10
    if (field === 'member_id' && value.match(/^[A-Z0-9]{6,}$/)) confidence += 5
    if (field === 'group_number' && !value) confidence -= 10

    return Math.min(100, Math.max(0, confidence))
  }

  const calculateOverallConfidence = (fieldConfidences: number[]): number => {
    if (fieldConfidences.length === 0) return 0
    const avg = fieldConfidences.reduce((a, b) => a + b) / fieldConfidences.length
    return Math.round(avg)
  }

  const getConfidenceLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 90) return 'high'
    if (score >= 70) return 'medium'
    return 'low'
  }

  const createFaceSheet = async (faceSheetData: {
    encounterId?: string
    patientFirstName: string
    patientLastName: string
    patientDob: string
    patientSex?: string
    primaryPayerName: string
    primaryPayerId?: string
    planType?: string
    coverageEffectiveDate?: string
    subscriberName?: string
    memberId: string
    extractionMethod: string
    sourceType: 'fax' | 'fhir' | 'eligibility' | 'phone' | 'email' | 'manual'
  }) => {
    const fieldConfidences: number[] = []

    const fields = {
      patient_first_name: [faceSheetData.patientFirstName, ['direct_api']],
      patient_last_name: [faceSheetData.patientLastName, ['direct_api']],
      patient_dob: [faceSheetData.patientDob, ['direct_api']],
      primary_payer_name: [faceSheetData.primaryPayerName, ['eligibility']],
      member_id: [faceSheetData.memberId, ['eligibility']],
      plan_type: [faceSheetData.planType || '', ['eligibility']]
    }

    for (const [fieldName, [value, sources]] of Object.entries(fields)) {
      const conf = calculateFieldConfidence(fieldName, value as string, sources as string[])
      fieldConfidences.push(conf)
    }

    const overallConfidence = calculateOverallConfidence(fieldConfidences)

    const { data: faceSheet, error: fsError } = await supabase
      .from('face_sheets')
      .insert({
        encounter_id: faceSheetData.encounterId,
        patient_first_name: faceSheetData.patientFirstName,
        patient_last_name: faceSheetData.patientLastName,
        patient_dob: faceSheetData.patientDob,
        patient_sex: faceSheetData.patientSex,
        primary_payer_name: faceSheetData.primaryPayerName,
        primary_payer_id: faceSheetData.primaryPayerId,
        plan_type: faceSheetData.planType,
        coverage_effective_date: faceSheetData.coverageEffectiveDate,
        subscriber_name: faceSheetData.subscriberName,
        member_id: faceSheetData.memberId,
        overall_confidence_score: overallConfidence,
        extraction_method: faceSheetData.extractionMethod,
        source_type: faceSheetData.sourceType
      })
      .select()
      .single()

    if (fsError) throw fsError

    let fieldIndex = 0
    for (const [fieldName, [value, sources]] of Object.entries(fields)) {
      const fieldConfidence = fieldConfidences[fieldIndex++]
      const isUncertain = fieldConfidence < 80

      await supabase
        .from('face_sheet_fields')
        .insert({
          face_sheet_id: faceSheet.id,
          field_name: fieldName,
          field_value: value as string,
          field_confidence: fieldConfidence,
          extraction_source: (sources as string[])[0],
          extraction_method: faceSheetData.extractionMethod,
          is_uncertain: isUncertain,
          uncertainty_reason: isUncertain ? `Low confidence (${fieldConfidence}%)` : null
        })
    }

    return {
      faceSheet,
      overallConfidence,
      confidenceLevel: getConfidenceLevel(overallConfidence),
      requiresApproval: overallConfidence < 90,
      uncertaintyFields: fieldConfidences
        .map((conf, idx) => conf < 80 ? Object.keys(fields)[idx] : null)
        .filter(Boolean)
    }
  }

  const getFaceSheet = async (faceSheetId: string) => {
    const { data: faceSheet, error: fsError } = await supabase
      .from('face_sheets')
      .select(`
        *,
        face_sheet_fields (*),
        face_sheet_sources (*)
      `)
      .eq('id', faceSheetId)
      .single()

    if (fsError) throw fsError
    return faceSheet
  }

  const approveFaceSheet = async (faceSheetId: string, userId: string, changes: any = {}) => {
    const { error } = await supabase
      .from('face_sheets')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: userId,
        ...changes
      })
      .eq('id', faceSheetId)

    if (error) throw error
  }

  const createConfidenceDecision = async (decisionData: {
    decisionType: 'face_sheet' | 'eligibility' | 'coding' | 'invoice' | 'appeal' | 'document_classification' | 'payer_mapping' | 'mapping_suggestion'
    entityId?: string
    queueItemId?: string
    confidenceScore: number
    reasoning: string
    uncertainFields?: string[]
    aiRecommendation?: string
  }) => {
    const confidenceLevel = getConfidenceLevel(decisionData.confidenceScore)
    const approvalRequired = confidenceLevel !== 'high'

    const { data, error } = await supabase
      .from('confidence_decisions')
      .insert({
        decision_type: decisionData.decisionType,
        entity_id: decisionData.entityId,
        queue_item_id: decisionData.queueItemId,
        confidence_score: decisionData.confidenceScore,
        confidence_level: confidenceLevel,
        reasoning: decisionData.reasoning,
        uncertain_fields: decisionData.uncertainFields || [],
        ai_recommendation: decisionData.aiRecommendation,
        approval_required: approvalRequired
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getConfidenceDecisionsRequiringApproval = async () => {
    const { data, error } = await supabase
      .from('confidence_decisions')
      .select('*')
      .eq('approval_required', true)
      .eq('approval_given', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  const approveConfidenceDecision = async (decisionId: string, userId: string, approvalChanges: any = {}) => {
    const { error } = await supabase
      .from('confidence_decisions')
      .update({
        approval_given: true,
        approval_given_at: new Date().toISOString(),
        approved_by: userId,
        approval_changes: approvalChanges,
        approved_value_final: approvalChanges
      })
      .eq('id', decisionId)

    if (error) throw error
  }

  const addFaceSheetSource = async (faceSheetId: string, sourceData: {
    sourceType: string
    sourceReference: string
    sourceUrl?: string
    documentId?: string
  }) => {
    const { error } = await supabase
      .from('face_sheet_sources')
      .insert({
        face_sheet_id: faceSheetId,
        source_type: sourceData.sourceType,
        source_reference: sourceData.sourceReference,
        source_url: sourceData.sourceUrl,
        extraction_timestamp: new Date().toISOString(),
        document_id: sourceData.documentId,
        is_original: true
      })

    if (error) throw error
  }

  const updateFaceSheetField = async (fieldId: string, fieldValue: string, userId: string) => {
    const { data: currentField } = await supabase
      .from('face_sheet_fields')
      .select('field_value')
      .eq('id', fieldId)
      .single()

    await supabase
      .from('face_sheet_fields')
      .update({
        original_value: currentField?.field_value,
        field_value: fieldValue,
        validated_at: new Date().toISOString(),
        correction_needed: false
      })
      .eq('id', fieldId)

    return {
      correctedBy: userId,
      correctedAt: new Date().toISOString(),
      previousValue: currentField?.field_value,
      newValue: fieldValue
    }
  }

  return {
    calculateFieldConfidence,
    calculateOverallConfidence,
    getConfidenceLevel,
    createFaceSheet,
    getFaceSheet,
    approveFaceSheet,
    createConfidenceDecision,
    getConfidenceDecisionsRequiringApproval,
    approveConfidenceDecision,
    addFaceSheetSource,
    updateFaceSheetField
  }
}
