export const useEndOfDayReconciliation = () => {
  const supabase = useSupabaseClient()

  const generateEndOfDayReport = async (reconciliationDate: Date = new Date()) => {
    const dateStr = reconciliationDate.toISOString().split('T')[0]
    const startOfDay = new Date(reconciliationDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(reconciliationDate)
    endOfDay.setHours(23, 59, 59, 999)

    const [
      billableEncounters,
      faceSheets,
      faceSheetsApproved,
      claimsSubmitted,
      claimsInProgress,
      hardBreaches,
      criticalItems,
      unlinkedCalls,
      blockingDocs
    ] = await Promise.all([
      countBillableEncounters(startOfDay, endOfDay),
      countFaceSheets(startOfDay, endOfDay),
      countApprovedFaceSheets(startOfDay, endOfDay),
      countSubmittedClaims(startOfDay, endOfDay),
      countInProgressClaims(),
      countHardSLABreaches(),
      countUnresolvedCriticalItems(),
      countUnlinkedCalls(startOfDay, endOfDay),
      countBlockingDocuments()
    ])

    const allClear =
      hardBreaches === 0 &&
      criticalItems === 0 &&
      unlinkedCalls === 0 &&
      blockingDocs === 0

    const { data: reconciliation, error } = await supabase
      .from('end_of_day_reconciliation')
      .insert({
        reconciliation_date: dateStr,
        total_billable_encounters: billableEncounters,
        total_face_sheets_created: faceSheets,
        total_face_sheets_approved: faceSheetsApproved,
        total_face_sheets_pending: faceSheets - faceSheetsApproved,
        total_claims_submitted: claimsSubmitted,
        total_claims_in_progress: claimsInProgress,
        missed_deadlines: hardBreaches,
        unresolved_critical_items: criticalItems,
        unlinked_calls: unlinkedCalls,
        blocking_documents: blockingDocs,
        all_clear: allClear,
        reconciliation_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return {
      reconciliationId: reconciliation.id,
      summary: {
        allClear,
        billableEncounters,
        faceSheetStats: {
          created: faceSheets,
          approved: faceSheetsApproved,
          pending: faceSheets - faceSheetsApproved
        },
        claimStats: {
          submitted: claimsSubmitted,
          inProgress: claimsInProgress
        },
        issues: {
          hardBreaches,
          criticalItems,
          unlinkedCalls,
          blockingDocuments: blockingDocs
        }
      },
      recommendation: allClear ? 'All clear. You can close the day.' : 'Review flagged items before closing.'
    }
  }

  const countBillableEncounters = async (startDate: Date, endDate: Date) => {
    const { count, error } = await supabase
      .from('queue_billing')
      .select('*', { count: 'exact' })
      .eq('billing_type', 'epcr_complete')
      .gte('entered_queue_at', startDate.toISOString())
      .lte('entered_queue_at', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  const countFaceSheets = async (startDate: Date, endDate: Date) => {
    const { count, error } = await supabase
      .from('face_sheets')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  const countApprovedFaceSheets = async (startDate: Date, endDate: Date) => {
    const { count, error } = await supabase
      .from('face_sheets')
      .select('*', { count: 'exact' })
      .eq('is_approved', true)
      .gte('approved_at', startDate.toISOString())
      .lte('approved_at', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  const countSubmittedClaims = async (startDate: Date, endDate: Date) => {
    const { count, error } = await supabase
      .from('queue_billing')
      .select('*', { count: 'exact' })
      .eq('queue_state', 'submitted')
      .gte('entered_queue_at', startDate.toISOString())
      .lte('entered_queue_at', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  const countInProgressClaims = async () => {
    const { count, error } = await supabase
      .from('queue_billing')
      .select('*', { count: 'exact' })
      .eq('queue_state', 'in_progress')

    if (error) throw error
    return count || 0
  }

  const countHardSLABreaches = async () => {
    const { count, error } = await supabase
      .from('queue_item_sla_tracking')
      .select('*', { count: 'exact' })
      .eq('hard_breach_triggered', true)
      .eq('hard_breach_acknowledged', false)

    if (error) throw error
    return count || 0
  }

  const countUnresolvedCriticalItems = async () => {
    const { count, error } = await supabase
      .from('priority_scores')
      .select('*', { count: 'exact' })
      .eq('is_critical', true)

    if (error) throw error
    return count || 0
  }

  const countUnlinkedCalls = async (startDate: Date, endDate: Date) => {
    const { count, error } = await supabase
      .from('active_calls')
      .select('*', { count: 'exact' })
      .is('linked_claim_id', null)
      .is('linked_invoice_id', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  const countBlockingDocuments = async () => {
    const { count, error } = await supabase
      .from('queue_documents')
      .select('*', { count: 'exact' })
      .eq('blocking_workflow', true)

    if (error) throw error
    return count || 0
  }

  const reviewReconciliation = async (reconciliationId: string, userId: string, notes: string = '') => {
    const { error } = await supabase
      .from('end_of_day_reconciliation')
      .update({
        reconciliation_status: 'reviewed',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', reconciliationId)

    if (error) throw error
  }

  const closeDay = async (reconciliationId: string, userId: string) => {
    const { error } = await supabase
      .from('end_of_day_reconciliation')
      .update({
        reconciliation_status: 'closed',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reconciliationId)

    if (error) throw error
  }

  const getTodaysReconciliation = async () => {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('end_of_day_reconciliation')
      .select('*')
      .eq('reconciliation_date', dateStr)
      .maybeSingle()

    if (error) throw error
    return data
  }

  return {
    generateEndOfDayReport,
    reviewReconciliation,
    closeDay,
    getTodaysReconciliation,
    countBillableEncounters,
    countFaceSheets,
    countApprovedFaceSheets,
    countSubmittedClaims,
    countInProgressClaims,
    countHardSLABreaches,
    countUnresolvedCriticalItems,
    countUnlinkedCalls,
    countBlockingDocuments
  }
}
