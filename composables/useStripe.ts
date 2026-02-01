export const useStripe = () => {
  const supabase = useSupabaseClient()

  const createPrivatePartyInvoice = async (data: {
    encounterId: string
    serviceType: 'ambulance_transport' | 'telehealth'
    payerType: 'patient' | 'guarantor' | 'private_party'
    payerName: string
    payerEmail: string
    amountTotal: number
    amountInsurancePaid: number
    amountPatientResponsibility: number
    dueDate: string
  }) => {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data: invoice, error } = await supabase
      .from('private_party_invoices')
      .insert({
        invoice_number: invoiceNumber,
        encounter_id: data.encounterId,
        service_type: data.serviceType,
        payer_type: data.payerType,
        payer_name: data.payerName,
        payer_email: data.payerEmail,
        amount_total: data.amountTotal,
        amount_insurance_paid: data.amountInsurancePaid,
        amount_patient_responsibility: data.amountPatientResponsibility,
        amount_outstanding: data.amountPatientResponsibility,
        due_date: data.dueDate,
        status: 'draft'
      })
      .select()
      .single()

    if (error) throw error
    return invoice
  }

  const createStripeInvoice = async (invoiceId: string, stripeCustomerId?: string) => {
    const { data: invoice } = await supabase
      .from('private_party_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    if (!invoice) throw new Error('Invoice not found')

    const stripeInvoiceUrl = `https://stripe-checkout-placeholder.com/invoice/${invoice.invoice_number}`

    const { error } = await supabase
      .from('private_party_invoices')
      .update({
        stripe_customer_id: stripeCustomerId || null,
        stripe_hosted_url: stripeInvoiceUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) throw error

    return { stripeHostedUrl: stripeInvoiceUrl }
  }

  const getInvoicesByEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('private_party_invoices')
      .select('*')
      .eq('payer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const getInvoiceDetails = async (invoiceId: string) => {
    const { data: invoice } = await supabase
      .from('private_party_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    const { data: statement } = await supabase
      .from('patient_statements')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle()

    const { data: paymentPlan } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle()

    const { data: disputes } = await supabase
      .from('billing_disputes')
      .select('*')
      .eq('invoice_id', invoiceId)

    return {
      invoice,
      statement,
      paymentPlan,
      disputes: disputes || []
    }
  }

  const getPrivatePayAnalytics = async () => {
    const { data: invoices } = await supabase
      .from('private_party_invoices')
      .select('*')

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0
    const outstandingBalance = invoices?.reduce((sum, inv) => sum + Number(inv.amount_outstanding), 0) || 0
    const paidCount = invoices?.filter(inv => inv.payment_status === 'paid').length || 0
    const failedCount = invoices?.filter(inv => inv.payment_status === 'failed').length || 0
    const disputedCount = invoices?.filter(inv => inv.payment_status === 'disputed').length || 0

    const ambulanceRevenue = invoices
      ?.filter(inv => inv.service_type === 'ambulance_transport')
      .reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0

    const telehealthRevenue = invoices
      ?.filter(inv => inv.service_type === 'telehealth')
      .reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0

    return {
      totalRevenue,
      outstandingBalance,
      paidCount,
      failedCount,
      disputedCount,
      completionRate: invoices?.length ? (paidCount / invoices.length) * 100 : 0,
      ambulanceRevenue,
      telehealthRevenue
    }
  }

  return {
    createPrivatePartyInvoice,
    createStripeInvoice,
    getInvoicesByEmail,
    getInvoiceDetails,
    getPrivatePayAnalytics
  }
}
