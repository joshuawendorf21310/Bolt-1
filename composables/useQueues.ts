export const useQueues = () => {
  const supabase = useSupabaseClient()

  const getCallsQueue = async (state?: string) => {
    let query = supabase
      .from('queue_calls')
      .select('*')
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true })

    if (state) {
      query = query.eq('queue_state', state)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const addToCallsQueue = async (callData: {
    callId: string
    callDirection: string
    callStatus: string
    callerIdentity?: string
    handledBy?: string
    priority?: number
  }) => {
    const { data, error } = await supabase
      .from('queue_calls')
      .insert({
        call_id: callData.callId,
        queue_state: 'active',
        call_direction: callData.callDirection,
        call_status: callData.callStatus,
        caller_identity: callData.callerIdentity,
        handled_by: callData.handledBy,
        priority: callData.priority || 50
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateCallsQueueItem = async (queueId: string, updates: any) => {
    const { error } = await supabase
      .from('queue_calls')
      .update(updates)
      .eq('id', queueId)

    if (error) throw error
  }

  const completeCallsQueueItem = async (queueId: string) => {
    const { error } = await supabase
      .from('queue_calls')
      .update({
        queue_state: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', queueId)

    if (error) throw error
  }

  const getVoicemailsQueue = async (state?: string) => {
    let query = supabase
      .from('queue_voicemails')
      .select(`
        *,
        voicemail_records (*)
      `)
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true })

    if (state) {
      query = query.eq('queue_state', state)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const addToVoicemailsQueue = async (voicemailData: {
    voicemailId: string
    callerIdentity?: string
    suggestedAction?: string
    priority?: number
  }) => {
    const { data, error } = await supabase
      .from('queue_voicemails')
      .insert({
        voicemail_id: voicemailData.voicemailId,
        queue_state: 'new',
        caller_identity: voicemailData.callerIdentity,
        suggested_action: voicemailData.suggestedAction,
        priority: voicemailData.priority || 50
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateVoicemailsQueueItem = async (queueId: string, state: string) => {
    const updateData: any = { queue_state: state }

    if (state === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('queue_voicemails')
      .update(updateData)
      .eq('id', queueId)

    if (error) throw error
  }

  const getDocumentsQueue = async (state?: string, blockingOnly?: boolean) => {
    let query = supabase
      .from('queue_documents')
      .select(`
        *,
        workspace_documents (*)
      `)
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true })

    if (state) {
      query = query.eq('queue_state', state)
    }

    if (blockingOnly) {
      query = query.eq('blocking_workflow', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const addToDocumentsQueue = async (documentData: {
    documentId: string
    documentPurpose?: string
    blockingWorkflow?: boolean
    workflowReference?: string
    requiredBy?: string
    priority?: number
  }) => {
    const { data, error } = await supabase
      .from('queue_documents')
      .insert({
        document_id: documentData.documentId,
        queue_state: 'draft',
        document_purpose: documentData.documentPurpose,
        blocking_workflow: documentData.blockingWorkflow || false,
        workflow_reference: documentData.workflowReference,
        required_by: documentData.requiredBy,
        priority: documentData.priority || 50
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateDocumentsQueueItem = async (queueId: string, state: string) => {
    const updateData: any = { queue_state: state }

    if (state === 'ready_to_finalize') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('queue_documents')
      .update(updateData)
      .eq('id', queueId)

    if (error) throw error
  }

  const getBillingQueue = async (state?: string) => {
    let query = supabase
      .from('queue_billing')
      .select('*')
      .order('priority', { ascending: false })
      .order('entered_queue_at', { ascending: true })

    if (state) {
      query = query.eq('queue_state', state)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const addToBillingQueue = async (billingData: {
    billingReference: string
    billingType: string
    encounterId?: string
    claimId?: string
    agencyId?: string
    billingStage?: string
    nextAction: string
    actionDeadline?: string
    priority?: number
    metadata?: any
  }) => {
    const { data, error } = await supabase
      .from('queue_billing')
      .insert({
        billing_reference: billingData.billingReference,
        billing_type: billingData.billingType,
        queue_state: 'ready',
        encounter_id: billingData.encounterId,
        claim_id: billingData.claimId,
        agency_id: billingData.agencyId,
        billing_stage: billingData.billingStage,
        next_action: billingData.nextAction,
        action_deadline: billingData.actionDeadline,
        priority: billingData.priority || 50,
        metadata: billingData.metadata || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateBillingQueueItem = async (queueId: string, state: string, metadata?: any) => {
    const updateData: any = { queue_state: state }

    if (state === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    const { error } = await supabase
      .from('queue_billing')
      .update(updateData)
      .eq('id', queueId)

    if (error) throw error
  }

  const getQueueCounts = async () => {
    const [calls, voicemails, documents, billing] = await Promise.all([
      getCallsQueue('active'),
      getVoicemailsQueue('new'),
      getDocumentsQueue(undefined, true),
      getBillingQueue('action_required')
    ])

    return {
      activeCalls: calls.length,
      newVoicemails: voicemails.length,
      blockingDocuments: documents.length,
      actionRequiredBilling: billing.length
    }
  }

  return {
    getCallsQueue,
    addToCallsQueue,
    updateCallsQueueItem,
    completeCallsQueueItem,
    getVoicemailsQueue,
    addToVoicemailsQueue,
    updateVoicemailsQueueItem,
    getDocumentsQueue,
    addToDocumentsQueue,
    updateDocumentsQueueItem,
    getBillingQueue,
    addToBillingQueue,
    updateBillingQueueItem,
    getQueueCounts
  }
}
