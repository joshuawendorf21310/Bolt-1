export const useBillingWorkspace = () => {
  const supabase = useSupabaseClient()

  const getEmailThreads = async (filters?: { status?: string; linkedAgencyId?: string; linkedClaimId?: string }) => {
    let query = supabase
      .from('billing_emails')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.linkedAgencyId) {
      query = query.eq('linked_agency_id', filters.linkedAgencyId)
    }
    if (filters?.linkedClaimId) {
      query = query.eq('linked_claim_id', filters.linkedClaimId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const sendEmail = async (emailData: {
    subject: string
    toAddresses: string[]
    ccAddresses?: string[]
    bodyText: string
    bodyHtml?: string
    linkedAgencyId?: string
    linkedClaimId?: string
    linkedEncounterId?: string
  }) => {
    const threadId = `thread-${Date.now()}`
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const { data, error } = await supabase
      .from('billing_emails')
      .insert({
        thread_id: threadId,
        message_id: messageId,
        subject: emailData.subject,
        from_address: 'billing@malibuems.com',
        to_addresses: emailData.toAddresses,
        cc_addresses: emailData.ccAddresses || [],
        body_text: emailData.bodyText,
        body_html: emailData.bodyHtml || emailData.bodyText,
        direction: 'outbound',
        status: 'sent',
        linked_agency_id: emailData.linkedAgencyId,
        linked_claim_id: emailData.linkedClaimId,
        linked_encounter_id: emailData.linkedEncounterId,
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      activityType: 'email_sent',
      entityType: 'email',
      entityId: data.id,
      description: `Sent email: ${emailData.subject}`,
      metadata: { to: emailData.toAddresses }
    })

    return data
  }

  const archiveEmail = async (emailId: string) => {
    const { error } = await supabase
      .from('billing_emails')
      .update({ status: 'archived' })
      .eq('id', emailId)

    if (error) throw error
  }

  const updateEmailNotes = async (emailId: string, notes: string) => {
    const { error } = await supabase
      .from('billing_emails')
      .update({ internal_notes: notes })
      .eq('id', emailId)

    if (error) throw error
  }

  const getAICalls = async (filters?: { status?: string; escalationRequired?: boolean }) => {
    let query = supabase
      .from('ai_phone_calls')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('call_status', filters.status)
    }
    if (filters?.escalationRequired !== undefined) {
      query = query.eq('escalation_required', filters.escalationRequired)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const initiateAICall = async (callData: {
    phoneNumber: string
    purpose: 'eligibility' | 'claim_status' | 'follow_up' | 'escalation' | 'other'
    organizationName: string
    linkedAgencyId?: string
    linkedClaimId?: string
    linkedEncounterId?: string
  }) => {
    const { data, error } = await supabase
      .from('ai_phone_calls')
      .insert({
        phone_number: callData.phoneNumber,
        direction: 'outbound',
        call_purpose: callData.purpose,
        organization_name: callData.organizationName,
        call_status: 'initiated',
        linked_agency_id: callData.linkedAgencyId,
        linked_claim_id: callData.linkedClaimId,
        linked_encounter_id: callData.linkedEncounterId,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      activityType: 'call_made',
      entityType: 'phone_call',
      entityId: data.id,
      description: `Initiated AI call to ${callData.organizationName}`,
      metadata: { purpose: callData.purpose }
    })

    return data
  }

  const updateCallStatus = async (callId: string, status: string, updates?: {
    transcript?: string
    summary?: string
    outcome?: string
    escalationRequired?: boolean
    escalationReason?: string
  }) => {
    const updateData: any = { call_status: status }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    if (updates) {
      Object.assign(updateData, updates)
    }

    const { error } = await supabase
      .from('ai_phone_calls')
      .update(updateData)
      .eq('id', callId)

    if (error) throw error
  }

  const markCallReviewed = async (callId: string) => {
    const { error } = await supabase
      .from('ai_phone_calls')
      .update({ founder_reviewed: true })
      .eq('id', callId)

    if (error) throw error
  }

  const getFaxes = async (filters?: { direction?: string; status?: string }) => {
    let query = supabase
      .from('billing_faxes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.direction) {
      query = query.eq('direction', filters.direction)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const sendFax = async (faxData: {
    faxNumber: string
    pdfUrl: string
    purpose: string
    linkedAgencyId?: string
    linkedClaimId?: string
    linkedEncounterId?: string
  }) => {
    const { data, error } = await supabase
      .from('billing_faxes')
      .insert({
        fax_number: faxData.faxNumber,
        direction: 'outbound',
        status: 'sending',
        pdf_url: faxData.pdfUrl,
        purpose: faxData.purpose,
        linked_agency_id: faxData.linkedAgencyId,
        linked_claim_id: faxData.linkedClaimId,
        linked_encounter_id: faxData.linkedEncounterId
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      activityType: 'fax_sent',
      entityType: 'fax',
      entityId: data.id,
      description: `Sent fax to ${faxData.faxNumber}`,
      metadata: { purpose: faxData.purpose }
    })

    return data
  }

  const getDocuments = async (filters?: { documentType?: string; organizationType?: string; isFinalized?: boolean }) => {
    let query = supabase
      .from('workspace_documents')
      .select('*')
      .order('updated_at', { ascending: false })

    if (filters?.documentType) {
      query = query.eq('document_type', filters.documentType)
    }
    if (filters?.organizationType) {
      query = query.eq('organization_type', filters.organizationType)
    }
    if (filters?.isFinalized !== undefined) {
      query = query.eq('is_finalized', filters.isFinalized)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  const createDocument = async (documentData: {
    documentName: string
    documentType: 'word' | 'excel' | 'powerpoint' | 'pdf' | 'text'
    mimeType: string
    storagePath: string
    organizationType?: string
    linkedAgencyId?: string
    linkedClaimId?: string
    linkedEncounterId?: string
    billingPeriod?: string
    tags?: string[]
  }) => {
    const { data, error } = await supabase
      .from('workspace_documents')
      .insert({
        document_name: documentData.documentName,
        document_type: documentData.documentType,
        mime_type: documentData.mimeType,
        storage_path: documentData.storagePath,
        organization_type: documentData.organizationType,
        linked_agency_id: documentData.linkedAgencyId,
        linked_claim_id: documentData.linkedClaimId,
        linked_encounter_id: documentData.linkedEncounterId,
        billing_period: documentData.billingPeriod,
        tags: documentData.tags || []
      })
      .select()
      .single()

    if (error) throw error

    await createDocumentVersion(data.id, 1, documentData.storagePath, 'Initial version')

    await logActivity({
      activityType: 'document_created',
      entityType: 'document',
      entityId: data.id,
      description: `Created document: ${documentData.documentName}`,
      metadata: { type: documentData.documentType }
    })

    return data
  }

  const updateDocument = async (documentId: string, storagePath: string, changeSummary?: string) => {
    const { data: doc } = await supabase
      .from('workspace_documents')
      .select('current_version')
      .eq('id', documentId)
      .maybeSingle()

    if (!doc) throw new Error('Document not found')

    const newVersion = doc.current_version + 1

    await supabase
      .from('workspace_documents')
      .update({
        storage_path: storagePath,
        current_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    await createDocumentVersion(documentId, newVersion, storagePath, changeSummary || 'Updated')

    await logActivity({
      activityType: 'document_edited',
      entityType: 'document',
      entityId: documentId,
      description: `Updated document to version ${newVersion}`,
      metadata: { version: newVersion }
    })
  }

  const finalizeDocument = async (documentId: string) => {
    const { error } = await supabase
      .from('workspace_documents')
      .update({
        is_finalized: true,
        finalized_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (error) throw error

    await logActivity({
      activityType: 'document_finalized',
      entityType: 'document',
      entityId: documentId,
      description: 'Document finalized (immutable)',
      metadata: {}
    })
  }

  const createDocumentVersion = async (documentId: string, versionNumber: number, storagePath: string, changeSummary: string) => {
    const { error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: versionNumber,
        storage_path: storagePath,
        change_summary: changeSummary
      })

    if (error) throw error
  }

  const getDocumentVersions = async (documentId: string) => {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return data || []
  }

  const addPDFAnnotation = async (annotationData: {
    documentId: string
    pageNumber: number
    annotationType: 'note' | 'highlight' | 'stamp' | 'drawing'
    annotationData: any
    annotationText?: string
  }) => {
    const { data, error } = await supabase
      .from('pdf_annotations')
      .insert({
        document_id: annotationData.documentId,
        page_number: annotationData.pageNumber,
        annotation_type: annotationData.annotationType,
        annotation_data: annotationData.annotationData,
        annotation_text: annotationData.annotationText
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      activityType: 'pdf_annotated',
      entityType: 'document',
      entityId: annotationData.documentId,
      description: `Added ${annotationData.annotationType} annotation to page ${annotationData.pageNumber}`,
      metadata: { page: annotationData.pageNumber, type: annotationData.annotationType }
    })

    return data
  }

  const getPDFAnnotations = async (documentId: string) => {
    const { data, error } = await supabase
      .from('pdf_annotations')
      .select('*')
      .eq('document_id', documentId)
      .order('page_number')

    if (error) throw error
    return data || []
  }

  const getActivityLog = async (limit: number = 50) => {
    const { data, error } = await supabase
      .from('workspace_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  const logActivity = async (activityData: {
    activityType: string
    entityType: string
    entityId: string
    description: string
    metadata: any
  }) => {
    await supabase
      .from('workspace_activity_log')
      .insert({
        activity_type: activityData.activityType,
        entity_type: activityData.entityType,
        entity_id: activityData.entityId,
        activity_description: activityData.description,
        metadata: activityData.metadata
      })
  }

  const getWorkspaceDashboard = async () => {
    const { data: emails } = await supabase
      .from('billing_emails')
      .select('id, status')

    const { data: calls } = await supabase
      .from('ai_phone_calls')
      .select('id, call_status, escalation_required')

    const { data: faxes } = await supabase
      .from('billing_faxes')
      .select('id, status')

    const { data: documents } = await supabase
      .from('workspace_documents')
      .select('id, is_finalized')

    const unreadEmails = emails?.filter(e => e.status === 'received').length || 0
    const pendingCalls = calls?.filter(c => c.call_status === 'requires_review').length || 0
    const escalatedCalls = calls?.filter(c => c.escalation_required && !c.founder_reviewed).length || 0
    const pendingFaxes = faxes?.filter(f => f.status === 'sending').length || 0
    const draftDocuments = documents?.filter(d => !d.is_finalized).length || 0

    return {
      totalEmails: emails?.length || 0,
      unreadEmails,
      totalCalls: calls?.length || 0,
      pendingCalls,
      escalatedCalls,
      totalFaxes: faxes?.length || 0,
      pendingFaxes,
      totalDocuments: documents?.length || 0,
      draftDocuments
    }
  }

  return {
    getEmailThreads,
    sendEmail,
    archiveEmail,
    updateEmailNotes,
    getAICalls,
    initiateAICall,
    updateCallStatus,
    markCallReviewed,
    getFaxes,
    sendFax,
    getDocuments,
    createDocument,
    updateDocument,
    finalizeDocument,
    getDocumentVersions,
    addPDFAnnotation,
    getPDFAnnotations,
    getActivityLog,
    getWorkspaceDashboard
  }
}
