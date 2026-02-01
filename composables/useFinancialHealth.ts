export const useFinancialHealth = () => {
  const supabase = useSupabaseClient()

  const calculateBusinessHealth = async () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const { data: accounts } = await supabase
      .from('business_accounts')
      .select('current_balance, sync_status, last_synced_at')
      .eq('is_active', true)

    const totalCash = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0

    const { data: transactions } = await supabase
      .from('business_transactions')
      .select('amount, transaction_date, transaction_type')
      .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false })

    const last30DaysInflow = transactions
      ?.filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const last30DaysOutflow = transactions
      ?.filter(t => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

    const monthlyBurn = last30DaysOutflow - last30DaysInflow
    const runway = monthlyBurn > 0 ? Math.floor(totalCash / monthlyBurn) : Infinity

    const { data: mtdTransactions } = await supabase
      .from('business_transactions')
      .select('amount, transaction_type')
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0])

    const mtdRevenue = mtdTransactions
      ?.filter(t => t.transaction_type === 'revenue')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const mtdExpenses = mtdTransactions
      ?.filter(t => ['expense', 'payroll', 'tax'].includes(t.transaction_type))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

    const mtdNetProfit = mtdRevenue - mtdExpenses

    const { data: ytdTransactions } = await supabase
      .from('business_transactions')
      .select('amount, transaction_type')
      .gte('transaction_date', startOfYear.toISOString().split('T')[0])

    const ytdRevenue = ytdTransactions
      ?.filter(t => t.transaction_type === 'revenue')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const ytdExpenses = ytdTransactions
      ?.filter(t => ['expense', 'payroll', 'tax'].includes(t.transaction_type))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0

    const ytdNetProfit = ytdRevenue - ytdExpenses

    const { data: arData } = await supabase
      .from('accounts_receivable')
      .select('amount_outstanding, aging_bucket')
      .eq('status', 'outstanding')

    const totalAR = arData?.reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0
    const arAging = {
      current: arData?.filter(ar => ar.aging_bucket === 'current').reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      '30': arData?.filter(ar => ar.aging_bucket === '30').reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      '60': arData?.filter(ar => ar.aging_bucket === '60').reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      '90': arData?.filter(ar => ar.aging_bucket === '90').reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      '120_plus': arData?.filter(ar => ar.aging_bucket === '120_plus').reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0
    }

    const { data: apData } = await supabase
      .from('accounts_payable')
      .select('amount_outstanding, priority, due_date')
      .eq('status', 'pending')

    const totalAP = apData?.reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0
    const apByPriority = {
      payroll: apData?.filter(ap => ap.priority === 'payroll').reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      taxes: apData?.filter(ap => ap.priority === 'taxes').reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      critical: apData?.filter(ap => ap.priority === 'critical').reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      normal: apData?.filter(ap => ap.priority === 'normal').reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0
    }

    const { data: serviceLines } = await supabase
      .from('service_lines')
      .select('id, name')
      .eq('is_active', true)

    const revenueByServiceLine = await Promise.all(
      (serviceLines || []).map(async (line) => {
        const { data } = await supabase
          .from('business_transactions')
          .select('amount')
          .eq('service_line_id', line.id)
          .eq('transaction_type', 'revenue')
          .gte('transaction_date', startOfMonth.toISOString().split('T')[0])

        return {
          name: line.name,
          revenue: data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        }
      })
    )

    return {
      cash: {
        total: totalCash,
        trend: last30DaysInflow - last30DaysOutflow
      },
      burn: {
        monthly: monthlyBurn,
        last30DaysInflow,
        last30DaysOutflow
      },
      runway,
      netProfit: {
        mtd: mtdNetProfit,
        ytd: ytdNetProfit
      },
      ar: {
        total: totalAR,
        aging: arAging
      },
      ap: {
        total: totalAP,
        byPriority: apByPriority
      },
      revenueByServiceLine,
      bankFeedStatus: accounts?.[0]?.sync_status || 'unknown',
      lastBankSync: accounts?.[0]?.last_synced_at || null
    }
  }

  const getAccountingIntegrity = async () => {
    const { data: accounts } = await supabase
      .from('business_accounts')
      .select('id, account_name, sync_status, last_synced_at')
      .eq('is_active', true)

    const { data: lastReconciliation } = await supabase
      .from('bank_reconciliations')
      .select('reconciled_at, status')
      .order('reconciled_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: freshness } = await supabase
      .from('data_freshness_tracking')
      .select('data_source, last_updated, is_stale')

    const { data: unreconciled } = await supabase
      .from('business_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('reconciled', false)

    return {
      bankFeeds: accounts?.map(acc => ({
        name: acc.account_name,
        status: acc.sync_status,
        lastSync: acc.last_synced_at
      })) || [],
      lastReconciliation: lastReconciliation ? {
        date: lastReconciliation.reconciled_at,
        status: lastReconciliation.status
      } : null,
      dataFreshness: freshness || [],
      unreconciledCount: unreconciled || 0
    }
  }

  return {
    calculateBusinessHealth,
    getAccountingIntegrity
  }
}
