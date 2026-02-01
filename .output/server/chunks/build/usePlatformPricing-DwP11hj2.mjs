const usePlatformPricing = () => {
  const supabase = useSupabaseClient();
  const MONTHLY_PLATFORM_FEE = 5e4;
  const PER_CALL_FEE = 4500;
  const createAgencySubscription = async (agencyId, agencyName, billingCycleDay = 1) => {
    const today = /* @__PURE__ */ new Date();
    const currentPeriodStart = new Date(today.getFullYear(), today.getMonth(), billingCycleDay);
    const currentPeriodEnd = new Date(today.getFullYear(), today.getMonth() + 1, billingCycleDay);
    const { data, error } = await supabase.from("agency_subscriptions").insert({
      agency_id: agencyId,
      agency_name: agencyName,
      subscription_status: "active",
      monthly_platform_fee: MONTHLY_PLATFORM_FEE,
      billing_cycle_day: billingCycleDay,
      current_period_start: currentPeriodStart.toISOString().split("T")[0],
      current_period_end: currentPeriodEnd.toISOString().split("T")[0]
    }).select().single();
    if (error) throw error;
    return data;
  };
  const recordBillableCall = async (data) => {
    const { data: existing } = await supabase.from("billable_calls").select("id").eq("encounter_id", data.encounterId).maybeSingle();
    if (existing) {
      return existing;
    }
    const { data: billableCall, error } = await supabase.from("billable_calls").insert({
      agency_id: data.agencyId,
      call_type: data.callType,
      encounter_id: data.encounterId,
      encounter_number: data.encounterNumber,
      call_date: data.callDate,
      per_call_fee: PER_CALL_FEE,
      billing_status: "pending"
    }).select().single();
    if (error) throw error;
    return billableCall;
  };
  const generateMonthlyInvoice = async (agencyId, periodStart, periodEnd) => {
    const { data: subscription } = await supabase.from("agency_subscriptions").select("*").eq("agency_id", agencyId).maybeSingle();
    if (!subscription) throw new Error("No active subscription found");
    const { data: unbilledCalls } = await supabase.from("billable_calls").select("*").eq("agency_id", agencyId).eq("billing_status", "pending").gte("call_date", periodStart).lte("call_date", periodEnd);
    const callsCount = (unbilledCalls == null ? void 0 : unbilledCalls.length) || 0;
    const callsTotal = callsCount * PER_CALL_FEE;
    const subtotal = MONTHLY_PLATFORM_FEE + callsTotal;
    const invoiceNumber = `PLAT-${Date.now()}-${agencyId.substring(0, 8)}`;
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 15);
    const { data: invoice, error } = await supabase.from("platform_invoices").insert({
      agency_id: agencyId,
      invoice_number: invoiceNumber,
      invoice_period_start: periodStart,
      invoice_period_end: periodEnd,
      base_platform_fee: MONTHLY_PLATFORM_FEE,
      billable_calls_count: callsCount,
      billable_calls_total: callsTotal,
      subtotal,
      total_amount_due: subtotal,
      invoice_status: "draft",
      due_date: dueDate.toISOString().split("T")[0]
    }).select().single();
    if (error) throw error;
    await supabase.from("platform_invoice_line_items").insert([
      {
        invoice_id: invoice.id,
        line_type: "base_fee",
        description: "Monthly Platform Fee",
        quantity: 1,
        unit_price: MONTHLY_PLATFORM_FEE,
        amount: MONTHLY_PLATFORM_FEE,
        period_start: periodStart,
        period_end: periodEnd
      },
      {
        invoice_id: invoice.id,
        line_type: "per_call_fee",
        description: `Billable Calls (${callsCount} calls @ $45.00 each)`,
        quantity: callsCount,
        unit_price: PER_CALL_FEE,
        amount: callsTotal,
        period_start: periodStart,
        period_end: periodEnd
      }
    ]);
    if (unbilledCalls && unbilledCalls.length > 0) {
      await supabase.from("billable_calls").update({
        billing_status: "invoiced",
        invoiced_at: (/* @__PURE__ */ new Date()).toISOString(),
        platform_invoice_id: invoice.id
      }).in("id", unbilledCalls.map((call) => call.id));
    }
    return invoice;
  };
  const sendInvoice = async (invoiceId) => {
    const { error } = await supabase.from("platform_invoices").update({
      invoice_status: "sent",
      issued_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invoiceId);
    if (error) throw error;
  };
  const markInvoicePaid = async (invoiceId) => {
    const { data: invoice } = await supabase.from("platform_invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (!invoice) throw new Error("Invoice not found");
    const { error } = await supabase.from("platform_invoices").update({
      invoice_status: "paid",
      amount_paid: invoice.total_amount_due,
      paid_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invoiceId);
    if (error) throw error;
    await supabase.from("billable_calls").update({ billing_status: "paid" }).eq("platform_invoice_id", invoiceId);
  };
  const getAgencyInvoices = async (agencyId) => {
    const { data, error } = await supabase.from("platform_invoices").select("*").eq("agency_id", agencyId).order("invoice_period_start", { ascending: false });
    if (error) throw error;
    return data || [];
  };
  const getInvoiceDetails = async (invoiceId) => {
    const { data: invoice } = await supabase.from("platform_invoices").select("*").eq("id", invoiceId).maybeSingle();
    const { data: lineItems } = await supabase.from("platform_invoice_line_items").select("*").eq("invoice_id", invoiceId).order("line_type");
    return {
      invoice,
      lineItems: lineItems || []
    };
  };
  const getPlatformRevenueAnalytics = async () => {
    const { data: invoices } = await supabase.from("platform_invoices").select("*");
    const totalRevenue = (invoices == null ? void 0 : invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0)) || 0;
    const recurringRevenue = (invoices == null ? void 0 : invoices.reduce((sum, inv) => sum + Number(inv.base_platform_fee), 0)) || 0;
    const usageRevenue = (invoices == null ? void 0 : invoices.reduce((sum, inv) => sum + Number(inv.billable_calls_total), 0)) || 0;
    const paidInvoices = (invoices == null ? void 0 : invoices.filter((inv) => inv.invoice_status === "paid")) || [];
    const overdueInvoices = (invoices == null ? void 0 : invoices.filter((inv) => inv.invoice_status === "overdue")) || [];
    const outstandingAmount = (invoices == null ? void 0 : invoices.reduce(
      (sum, inv) => sum + (Number(inv.total_amount_due) - Number(inv.amount_paid)),
      0
    )) || 0;
    const { data: subscriptions } = await supabase.from("agency_subscriptions").select("*").eq("subscription_status", "active");
    const activeSubscriptions = (subscriptions == null ? void 0 : subscriptions.length) || 0;
    const monthlyRecurringRevenue = activeSubscriptions * MONTHLY_PLATFORM_FEE;
    const { data: calls } = await supabase.from("billable_calls").select("*");
    const totalBillableCalls = (calls == null ? void 0 : calls.length) || 0;
    const paidCalls = (calls == null ? void 0 : calls.filter((c) => c.billing_status === "paid").length) || 0;
    return {
      totalRevenue,
      recurringRevenue,
      usageRevenue,
      monthlyRecurringRevenue,
      outstandingAmount,
      activeSubscriptions,
      totalInvoices: (invoices == null ? void 0 : invoices.length) || 0,
      paidInvoices: paidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      totalBillableCalls,
      paidCalls,
      averageCallsPerAgency: activeSubscriptions > 0 ? totalBillableCalls / activeSubscriptions : 0
    };
  };
  const getBillableCallsByPeriod = async (agencyId, startDate, endDate) => {
    const { data, error } = await supabase.from("billable_calls").select("*").eq("agency_id", agencyId).gte("call_date", startDate).lte("call_date", endDate).order("call_date", { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return {
    MONTHLY_PLATFORM_FEE,
    PER_CALL_FEE,
    createAgencySubscription,
    recordBillableCall,
    generateMonthlyInvoice,
    sendInvoice,
    markInvoicePaid,
    getAgencyInvoices,
    getInvoiceDetails,
    getPlatformRevenueAnalytics,
    getBillableCallsByPeriod
  };
};

export { usePlatformPricing as u };
//# sourceMappingURL=usePlatformPricing-DwP11hj2.mjs.map
