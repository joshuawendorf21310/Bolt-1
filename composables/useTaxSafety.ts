export const useTaxSafety = () => {
  const supabase = useSupabaseClient()

  const getTaxObligations = async () => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: upcoming } = await supabase
      .from('business_tax_reserves')
      .select('*')
      .in('status', ['accruing', 'due_soon'])
      .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    const { data: overdue } = await supabase
      .from('business_tax_reserves')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })

    const { data: allReserves } = await supabase
      .from('business_tax_reserves')
      .select('amount_expected, amount_reserved, status')
      .in('status', ['accruing', 'due_soon', 'overdue'])

    const totalExpected = allReserves?.reduce((sum, r) => sum + Number(r.amount_expected), 0) || 0
    const totalReserved = allReserves?.reduce((sum, r) => sum + Number(r.amount_reserved), 0) || 0
    const shortfall = Math.max(0, totalExpected - totalReserved)

    return {
      upcoming: upcoming || [],
      overdue: overdue || [],
      summary: {
        totalExpected,
        totalReserved,
        shortfall,
        isFullyFunded: shortfall === 0
      }
    }
  }

  const updateTaxReserve = async (id: string, amountReserved: number) => {
    const { error } = await supabase
      .from('business_tax_reserves')
      .update({
        amount_reserved: amountReserved,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  const markTaxPaid = async (id: string) => {
    const { error } = await supabase
      .from('business_tax_reserves')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)

    if (error) throw error
  }

  return {
    getTaxObligations,
    updateTaxReserve,
    markTaxPaid
  }
}
