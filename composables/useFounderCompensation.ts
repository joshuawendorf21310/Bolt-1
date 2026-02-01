export const useFounderCompensation = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const getCompensationSummary = async () => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const { data: events } = await supabase
      .from('founder_compensation_events')
      .select('event_type, amount, event_date')
      .eq('founder_id', user.value?.id)
      .gte('event_date', startOfYear.toISOString().split('T')[0])
      .order('event_date', { ascending: false })

    const salaryYTD = events
      ?.filter(e => e.event_type === 'salary')
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

    const distributionsYTD = events
      ?.filter(e => e.event_type === 'distribution')
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return {
      salaryYTD,
      distributionsYTD,
      totalYTD: salaryYTD + distributionsYTD,
      events: events || []
    }
  }

  const calculateSafeDistribution = async () => {
    const { data: policy } = await supabase
      .from('founder_compensation_policy')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (!policy) {
      return {
        safeAmount: 0,
        breakdown: {
          totalCash: 0,
          minimumBuffer: 0,
          payrollReserve: 0,
          taxReserve: 0,
          apReserve: 0,
          available: 0
        }
      }
    }

    const { data: accounts } = await supabase
      .from('business_accounts')
      .select('current_balance')
      .eq('is_active', true)

    const totalCash = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0

    const { data: apData } = await supabase
      .from('accounts_payable')
      .select('amount_outstanding, priority')
      .eq('status', 'pending')

    const payrollReserve = apData
      ?.filter(ap => ap.priority === 'payroll')
      .reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0

    const taxReserve = apData
      ?.filter(ap => ap.priority === 'taxes')
      .reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0

    const apReserve = apData
      ?.filter(ap => ['critical', 'normal'].includes(ap.priority))
      .reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0

    const minimumBuffer = Number(policy.minimum_cash_buffer)

    const available = Math.max(0, totalCash - minimumBuffer - payrollReserve - taxReserve - apReserve)
    const safeAmount = Math.floor(available * (Number(policy.safe_distribution_percentage) / 100))

    const calculation = {
      totalCash,
      minimumBuffer,
      payrollReserve,
      taxReserve,
      apReserve,
      available
    }

    await supabase
      .from('founder_withdrawal_calculations')
      .insert({
        total_cash_available: totalCash,
        minimum_buffer_required: minimumBuffer,
        payroll_reserve_required: payrollReserve,
        tax_reserve_required: taxReserve,
        ap_reserve_required: apReserve,
        available_for_distribution: available,
        safe_distribution_amount: safeAmount,
        calculation_notes: 'Automated calculation'
      })

    return {
      safeAmount,
      breakdown: calculation
    }
  }

  const getCompensationPolicy = async () => {
    const { data } = await supabase
      .from('founder_compensation_policy')
      .select('*')
      .limit(1)
      .maybeSingle()

    return data
  }

  return {
    getCompensationSummary,
    calculateSafeDistribution,
    getCompensationPolicy
  }
}
