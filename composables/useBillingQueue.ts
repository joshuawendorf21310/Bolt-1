export const useBillingQueue = () => {
  const supabase = useSupabaseClient()

  const getWorkQueue = async () => {
    const { data: queue } = await supabase
      .from('billing_work_queue')
      .select(`
        *,
        billing_claims (
          claim_number,
          patient_name,
          service_date,
          billed_amount,
          payer_name,
          claim_status
        )
      `)
      .eq('status', 'pending')
      .order('queue_priority', { ascending: true })
      .order('added_to_queue_at', { ascending: true })

    const grouped = queue?.reduce((acc, item) => {
      const action = item.action_required
      if (!acc[action]) {
        acc[action] = []
      }
      acc[action].push(item)
      return acc
    }, {} as Record<string, any[]>)

    return {
      queue: queue || [],
      grouped: grouped || {},
      count: queue?.length || 0
    }
  }

  const getClaimDetails = async (claimId: string) => {
    const { data: claim } = await supabase
      .from('billing_claims')
      .select('*')
      .eq('id', claimId)
      .maybeSingle()

    const { data: eligibility } = await supabase
      .from('eligibility_checks')
      .select('*')
      .eq('claim_id', claimId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: submissions } = await supabase
      .from('claim_submissions')
      .select('*')
      .eq('claim_id', claimId)
      .order('submitted_at', { ascending: false })

    const { data: statusInquiries } = await supabase
      .from('claim_status_inquiries')
      .select('*')
      .eq('claim_id', claimId)
      .order('inquired_at', { ascending: false })

    const { data: remittances } = await supabase
      .from('remittance_advices')
      .select('*')
      .eq('claim_id', claimId)
      .order('received_at', { ascending: false })

    const { data: ediTransactions } = await supabase
      .from('edi_transactions')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })

    return {
      claim,
      eligibility,
      submissions: submissions || [],
      statusInquiries: statusInquiries || [],
      remittances: remittances || [],
      ediTransactions: ediTransactions || []
    }
  }

  const performAction = async (queueItemId: string, action: string, claimId: string, data: any) => {
    const user = useSupabaseUser()

    await supabase
      .from('audit_log')
      .insert({
        event_type: 'billing_action',
        actor_id: user.value?.id,
        actor_role: 'biller',
        resource_type: 'billing_claim',
        resource_id: claimId,
        action: action,
        result: 'success',
        details: { queueItemId, ...data }
      })

    if (action === 'verify_eligibility') {
      await supabase
        .from('edi_transactions')
        .insert({
          claim_id: claimId,
          transaction_type: '270',
          direction: 'outbound',
          status: 'pending',
          sent_at: new Date().toISOString()
        })

      await supabase
        .from('billing_claims')
        .update({
          claim_status: 'eligibility_pending',
          next_action_required: 'wait_for_eligibility',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId)
    }

    if (action === 'submit_claim') {
      const { data: submission } = await supabase
        .from('claim_submissions')
        .insert({
          claim_id: claimId,
          submission_method: 'electronic',
          clearinghouse_status: 'pending'
        })
        .select()
        .single()

      await supabase
        .from('edi_transactions')
        .insert({
          claim_id: claimId,
          transaction_type: '837',
          direction: 'outbound',
          status: 'pending',
          sent_at: new Date().toISOString()
        })

      await supabase
        .from('billing_claims')
        .update({
          claim_status: 'submitted',
          next_action_required: 'wait_for_clearinghouse',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId)
    }

    if (action === 'check_status') {
      await supabase
        .from('edi_transactions')
        .insert({
          claim_id: claimId,
          transaction_type: '276',
          direction: 'outbound',
          status: 'pending',
          sent_at: new Date().toISOString()
        })

      await supabase
        .from('billing_claims')
        .update({
          next_action_required: 'wait_for_status_response',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId)
    }

    await supabase
      .from('billing_work_queue')
      .update({
        status: 'completed',
        action_taken_at: new Date().toISOString()
      })
      .eq('id', queueItemId)
  }

  const addToQueue = async (claimId: string, actionRequired: string, blockingReason: string, priority: number = 100) => {
    const { error } = await supabase
      .from('billing_work_queue')
      .insert({
        claim_id: claimId,
        action_required: actionRequired,
        blocking_reason: blockingReason,
        queue_priority: priority,
        status: 'pending'
      })

    if (error) throw error
  }

  return {
    getWorkQueue,
    getClaimDetails,
    performAction,
    addToQueue
  }
}
