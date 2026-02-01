import { defineComponent, ref, mergeProps, unref, useSSRContext, computed } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderComponent } from "vue/server-renderer";
import { u as usePlatformPricing } from "./usePlatformPricing-DwP11hj2.js";
import { _ as _export_sfc } from "../server.mjs";
import { u as useStripe } from "./useStripe-CrT1Y72L.js";
import "/tmp/cc-agent/63214198/project/node_modules/hookable/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/tmp/cc-agent/63214198/project/node_modules/unctx/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/tmp/cc-agent/63214198/project/node_modules/defu/dist/defu.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ufo/dist/index.mjs";
import "@supabase/supabase-js";
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "PlatformRevenueBreakdown",
  __ssrInlineRender: true,
  setup(__props) {
    usePlatformPricing();
    const analytics = ref(null);
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
      }).format(amount / 100);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "platform-revenue" }, _attrs))} data-v-74e31ee3><div class="panel-header" data-v-74e31ee3><h3 data-v-74e31ee3>Platform Revenue Model</h3><p class="subtitle" data-v-74e31ee3>Fixed pricing: $500/month + $45/billable call</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-74e31ee3>Loading revenue data...</div>`);
      } else if (unref(analytics)) {
        _push(`<div class="revenue-content" data-v-74e31ee3><div class="pricing-model-info" data-v-74e31ee3><div class="pricing-box" data-v-74e31ee3><span class="pricing-label" data-v-74e31ee3>Monthly Platform Fee</span><span class="pricing-value" data-v-74e31ee3>$500</span><span class="pricing-desc" data-v-74e31ee3>per agency</span></div><div class="pricing-box" data-v-74e31ee3><span class="pricing-label" data-v-74e31ee3>Per-Billable-Call Fee</span><span class="pricing-value" data-v-74e31ee3>$45</span><span class="pricing-desc" data-v-74e31ee3>per encounter</span></div></div><div class="revenue-metrics" data-v-74e31ee3><div class="metric-card primary" data-v-74e31ee3><span class="metric-label" data-v-74e31ee3>Total Platform Revenue</span><span class="metric-value" data-v-74e31ee3>${ssrInterpolate(formatCurrency(unref(analytics).totalRevenue))}</span><div class="metric-breakdown" data-v-74e31ee3><div class="breakdown-item" data-v-74e31ee3><span class="breakdown-label" data-v-74e31ee3>Recurring (Base Fees)</span><span class="breakdown-value" data-v-74e31ee3>${ssrInterpolate(formatCurrency(unref(analytics).recurringRevenue))}</span></div><div class="breakdown-item" data-v-74e31ee3><span class="breakdown-label" data-v-74e31ee3>Usage (Call Fees)</span><span class="breakdown-value" data-v-74e31ee3>${ssrInterpolate(formatCurrency(unref(analytics).usageRevenue))}</span></div></div></div><div class="metric-card" data-v-74e31ee3><span class="metric-label" data-v-74e31ee3>Monthly Recurring Revenue (MRR)</span><span class="metric-value" data-v-74e31ee3>${ssrInterpolate(formatCurrency(unref(analytics).monthlyRecurringRevenue))}</span><span class="metric-detail" data-v-74e31ee3>${ssrInterpolate(unref(analytics).activeSubscriptions)} active ${ssrInterpolate(unref(analytics).activeSubscriptions === 1 ? "agency" : "agencies")}</span></div><div class="metric-card" data-v-74e31ee3><span class="metric-label" data-v-74e31ee3>Outstanding Amount</span><span class="metric-value" data-v-74e31ee3>${ssrInterpolate(formatCurrency(unref(analytics).outstandingAmount))}</span>`);
        if (unref(analytics).overdueInvoices > 0) {
          _push(`<span class="metric-detail warning" data-v-74e31ee3>${ssrInterpolate(unref(analytics).overdueInvoices)} overdue ${ssrInterpolate(unref(analytics).overdueInvoices === 1 ? "invoice" : "invoices")}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="usage-metrics" data-v-74e31ee3><h4 data-v-74e31ee3>Usage Metrics</h4><div class="usage-grid" data-v-74e31ee3><div class="usage-stat" data-v-74e31ee3><span class="stat-value" data-v-74e31ee3>${ssrInterpolate(unref(analytics).totalBillableCalls.toLocaleString())}</span><span class="stat-label" data-v-74e31ee3>Total Billable Calls</span></div><div class="usage-stat" data-v-74e31ee3><span class="stat-value" data-v-74e31ee3>${ssrInterpolate(unref(analytics).paidCalls.toLocaleString())}</span><span class="stat-label" data-v-74e31ee3>Paid Calls</span></div><div class="usage-stat" data-v-74e31ee3><span class="stat-value" data-v-74e31ee3>${ssrInterpolate(unref(analytics).averageCallsPerAgency.toFixed(0))}</span><span class="stat-label" data-v-74e31ee3>Avg Calls per Agency</span></div></div></div><div class="invoice-summary" data-v-74e31ee3><h4 data-v-74e31ee3>Invoice Status</h4><div class="invoice-stats" data-v-74e31ee3><div class="invoice-stat" data-v-74e31ee3><span class="stat-count" data-v-74e31ee3>${ssrInterpolate(unref(analytics).totalInvoices)}</span><span class="stat-label" data-v-74e31ee3>Total Invoices</span></div><div class="invoice-stat paid" data-v-74e31ee3><span class="stat-count" data-v-74e31ee3>${ssrInterpolate(unref(analytics).paidInvoices)}</span><span class="stat-label" data-v-74e31ee3>Paid</span></div>`);
        if (unref(analytics).overdueInvoices > 0) {
          _push(`<div class="invoice-stat overdue" data-v-74e31ee3><span class="stat-count" data-v-74e31ee3>${ssrInterpolate(unref(analytics).overdueInvoices)}</span><span class="stat-label" data-v-74e31ee3>Overdue</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="pricing-notes" data-v-74e31ee3><h4 data-v-74e31ee3>Pricing Policy</h4><ul data-v-74e31ee3><li data-v-74e31ee3>Base fee charged regardless of call volume</li><li data-v-74e31ee3>Per-call fee applies to all billable encounters</li><li data-v-74e31ee3>No percentage-based pricing or revenue sharing</li><li data-v-74e31ee3>Pricing not adjusted for automation level</li><li data-v-74e31ee3>Stripe fees passed through transparently (not marked up)</li></ul></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PlatformRevenueBreakdown.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-74e31ee3"]]);
const useFinancialHealth = () => {
  const supabase = useSupabaseClient();
  const calculateBusinessHealth = async () => {
    const now = /* @__PURE__ */ new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const { data: accounts } = await supabase.from("business_accounts").select("current_balance, sync_status, last_synced_at").eq("is_active", true);
    const totalCash = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;
    const { data: transactions } = await supabase.from("business_transactions").select("amount, transaction_date, transaction_type").gte("transaction_date", thirtyDaysAgo.toISOString().split("T")[0]).order("transaction_date", { ascending: false });
    const last30DaysInflow = transactions?.filter((t) => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const last30DaysOutflow = transactions?.filter((t) => Number(t.amount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    const monthlyBurn = last30DaysOutflow - last30DaysInflow;
    const runway = monthlyBurn > 0 ? Math.floor(totalCash / monthlyBurn) : Infinity;
    const { data: mtdTransactions } = await supabase.from("business_transactions").select("amount, transaction_type").gte("transaction_date", startOfMonth.toISOString().split("T")[0]);
    const mtdRevenue = mtdTransactions?.filter((t) => t.transaction_type === "revenue").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const mtdExpenses = mtdTransactions?.filter((t) => ["expense", "payroll", "tax"].includes(t.transaction_type)).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    const mtdNetProfit = mtdRevenue - mtdExpenses;
    const { data: ytdTransactions } = await supabase.from("business_transactions").select("amount, transaction_type").gte("transaction_date", startOfYear.toISOString().split("T")[0]);
    const ytdRevenue = ytdTransactions?.filter((t) => t.transaction_type === "revenue").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const ytdExpenses = ytdTransactions?.filter((t) => ["expense", "payroll", "tax"].includes(t.transaction_type)).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    const ytdNetProfit = ytdRevenue - ytdExpenses;
    const { data: arData } = await supabase.from("accounts_receivable").select("amount_outstanding, aging_bucket").eq("status", "outstanding");
    const totalAR = arData?.reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0;
    const arAging = {
      current: arData?.filter((ar) => ar.aging_bucket === "current").reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      "30": arData?.filter((ar) => ar.aging_bucket === "30").reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      "60": arData?.filter((ar) => ar.aging_bucket === "60").reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      "90": arData?.filter((ar) => ar.aging_bucket === "90").reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0,
      "120_plus": arData?.filter((ar) => ar.aging_bucket === "120_plus").reduce((sum, ar) => sum + Number(ar.amount_outstanding), 0) || 0
    };
    const { data: apData } = await supabase.from("accounts_payable").select("amount_outstanding, priority, due_date").eq("status", "pending");
    const totalAP = apData?.reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0;
    const apByPriority = {
      payroll: apData?.filter((ap) => ap.priority === "payroll").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      taxes: apData?.filter((ap) => ap.priority === "taxes").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      critical: apData?.filter((ap) => ap.priority === "critical").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0,
      normal: apData?.filter((ap) => ap.priority === "normal").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0
    };
    const { data: serviceLines } = await supabase.from("service_lines").select("id, name").eq("is_active", true);
    const revenueByServiceLine = await Promise.all(
      (serviceLines || []).map(async (line) => {
        const { data } = await supabase.from("business_transactions").select("amount").eq("service_line_id", line.id).eq("transaction_type", "revenue").gte("transaction_date", startOfMonth.toISOString().split("T")[0]);
        return {
          name: line.name,
          revenue: data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        };
      })
    );
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
      bankFeedStatus: accounts?.[0]?.sync_status || "unknown",
      lastBankSync: accounts?.[0]?.last_synced_at || null
    };
  };
  const getAccountingIntegrity = async () => {
    const { data: accounts } = await supabase.from("business_accounts").select("id, account_name, sync_status, last_synced_at").eq("is_active", true);
    const { data: lastReconciliation } = await supabase.from("bank_reconciliations").select("reconciled_at, status").order("reconciled_at", { ascending: false }).limit(1).maybeSingle();
    const { data: freshness } = await supabase.from("data_freshness_tracking").select("data_source, last_updated, is_stale");
    const { data: unreconciled } = await supabase.from("business_transactions").select("id", { count: "exact", head: true }).eq("reconciled", false);
    return {
      bankFeeds: accounts?.map((acc) => ({
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
    };
  };
  return {
    calculateBusinessHealth,
    getAccountingIntegrity
  };
};
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "BusinessHealthSummary",
  __ssrInlineRender: true,
  setup(__props) {
    useFinancialHealth();
    const health = ref(null);
    const loading = ref(true);
    const cashStatus = computed(() => {
      if (!health.value) return "";
      const cash = health.value.cash.total;
      const burn = health.value.burn.monthly;
      if (cash < burn * 2) return "status-critical";
      if (cash < burn * 6) return "status-warning";
      return "status-healthy";
    });
    const runwayStatus = computed(() => {
      if (!health.value) return "";
      const runway = health.value.runway;
      if (runway === Infinity) return "status-healthy";
      if (runway < 3) return "status-critical";
      if (runway < 6) return "status-warning";
      return "status-healthy";
    });
    const statusMessage = computed(() => {
      if (!health.value) return "Loading...";
      if (cashStatus.value === "status-critical" || runwayStatus.value === "status-critical") {
        return "Immediate attention needed: low cash reserves";
      }
      if (cashStatus.value === "status-warning" || runwayStatus.value === "status-warning") {
        return "Monitor closely: cash reserves below recommended levels";
      }
      return "Company is operating within safe parameters";
    });
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 100);
    };
    const formatServiceLineName = (name) => {
      const names = {
        "transport": "Transport",
        "ems": "EMS",
        "fire_contracts": "Fire Contracts",
        "other": "Other"
      };
      return names[name] || name;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "business-health-summary" }, _attrs))} data-v-9bfd8a00><div class="header" data-v-9bfd8a00><h2 data-v-9bfd8a00>Business Health</h2><p class="subtitle" data-v-9bfd8a00>${ssrInterpolate(unref(statusMessage))}</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-9bfd8a00>Loading financial data...</div>`);
      } else if (unref(health)) {
        _push(`<div class="metrics-grid" data-v-9bfd8a00><div class="${ssrRenderClass([unref(cashStatus), "metric-card"])}" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00>Cash on Hand</div><div class="metric-value" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(unref(health).cash.total))}</div><div class="${ssrRenderClass([unref(health).cash.trend >= 0 ? "positive" : "negative", "metric-trend"])}" data-v-9bfd8a00>${ssrInterpolate(unref(health).cash.trend >= 0 ? "↑" : "↓")} ${ssrInterpolate(formatCurrency(Math.abs(unref(health).cash.trend)))} (30d) </div></div><div class="metric-card" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00> Monthly Burn <span class="tooltip" data-v-9bfd8a00>ⓘ <span class="tooltip-text" data-v-9bfd8a00>Cash out minus cash in over the last 30 days. Different from accounting net income.</span></span></div><div class="metric-value" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(unref(health).burn.monthly))}</div><div class="metric-detail" data-v-9bfd8a00> In: ${ssrInterpolate(formatCurrency(unref(health).burn.last30DaysInflow))} | Out: ${ssrInterpolate(formatCurrency(unref(health).burn.last30DaysOutflow))}</div></div><div class="${ssrRenderClass([unref(runwayStatus), "metric-card"])}" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00> Runway <span class="tooltip" data-v-9bfd8a00>ⓘ <span class="tooltip-text" data-v-9bfd8a00>Months until cash runs out at current burn rate. Cash balance ÷ monthly burn.</span></span></div><div class="metric-value" data-v-9bfd8a00>${ssrInterpolate(unref(health).runway === Infinity ? "∞" : unref(health).runway)} ${ssrInterpolate(unref(health).runway === Infinity ? "" : unref(health).runway === 1 ? "month" : "months")}</div></div><div class="metric-card" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00> Net Profit/Loss <span class="tooltip" data-v-9bfd8a00>ⓘ <span class="tooltip-text" data-v-9bfd8a00>Accounting view (revenue minus expenses). Different from burn rate.</span></span></div><div class="${ssrRenderClass([unref(health).netProfit.mtd >= 0 ? "positive" : "negative", "metric-value"])}" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(unref(health).netProfit.mtd))}</div><div class="metric-detail" data-v-9bfd8a00>MTD | YTD: ${ssrInterpolate(formatCurrency(unref(health).netProfit.ytd))}</div></div><div class="metric-card" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00>Accounts Receivable</div><div class="metric-value" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(unref(health).ar.total))}</div><div class="metric-detail aging-breakdown" data-v-9bfd8a00><span data-v-9bfd8a00>Current: ${ssrInterpolate(formatCurrency(unref(health).ar.aging.current))}</span><span data-v-9bfd8a00>30+: ${ssrInterpolate(formatCurrency(unref(health).ar.aging["30"]))}</span><span data-v-9bfd8a00>60+: ${ssrInterpolate(formatCurrency(unref(health).ar.aging["60"]))}</span><span data-v-9bfd8a00>90+: ${ssrInterpolate(formatCurrency(unref(health).ar.aging["90"]))}</span></div></div><div class="metric-card" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00>Accounts Payable</div><div class="metric-value" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(unref(health).ap.total))}</div><div class="metric-detail" data-v-9bfd8a00>`);
        if (unref(health).ap.byPriority.payroll > 0) {
          _push(`<span class="priority-high" data-v-9bfd8a00> Payroll: ${ssrInterpolate(formatCurrency(unref(health).ap.byPriority.payroll))}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(health).ap.byPriority.taxes > 0) {
          _push(`<span class="priority-high" data-v-9bfd8a00> Taxes: ${ssrInterpolate(formatCurrency(unref(health).ap.byPriority.taxes))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if (unref(health).revenueByServiceLine.length > 0) {
          _push(`<div class="metric-card full-width" data-v-9bfd8a00><div class="metric-label" data-v-9bfd8a00>Revenue by Service Line (MTD)</div><div class="service-lines" data-v-9bfd8a00><!--[-->`);
          ssrRenderList(unref(health).revenueByServiceLine, (line) => {
            _push(`<div class="service-line" data-v-9bfd8a00><span class="line-name" data-v-9bfd8a00>${ssrInterpolate(formatServiceLineName(line.name))}</span><span class="line-revenue" data-v-9bfd8a00>${ssrInterpolate(formatCurrency(line.revenue))}</span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BusinessHealthSummary.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-9bfd8a00"]]);
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "AccountingIntegrityStrip",
  __ssrInlineRender: true,
  setup(__props) {
    useFinancialHealth();
    const integrity = ref(null);
    const loading = ref(true);
    const bankFeedStatus = computed(() => {
      if (!integrity.value?.bankFeeds[0]) return "Unknown";
      return integrity.value.bankFeeds[0].status === "connected" ? "Connected" : "Degraded";
    });
    const bankFeedStatusClass = computed(() => {
      if (!integrity.value?.bankFeeds[0]) return "status-unknown";
      return integrity.value.bankFeeds[0].status === "connected" ? "status-good" : "status-warning";
    });
    const reconciliationStatus = computed(() => {
      if (!integrity.value?.lastReconciliation) return "Never reconciled";
      const daysSince = Math.floor((Date.now() - new Date(integrity.value.lastReconciliation.date).getTime()) / (1e3 * 60 * 60 * 24));
      if (daysSince > 30) return "Stale";
      if (daysSince > 14) return "Needs attention";
      return "Current";
    });
    const reconciliationStatusClass = computed(() => {
      const status = reconciliationStatus.value;
      if (status === "Never reconciled" || status === "Stale") return "status-critical";
      if (status === "Needs attention") return "status-warning";
      return "status-good";
    });
    const staleDataSources = computed(() => {
      if (!integrity.value?.dataFreshness) return [];
      return integrity.value.dataFreshness.filter((d) => d.is_stale).map((d) => d.data_source.replace(/_/g, " "));
    });
    const dataFreshnessStatus = computed(() => {
      const count = staleDataSources.value.length;
      if (count === 0) return "All current";
      return `${count} stale`;
    });
    const dataFreshnessClass = computed(() => {
      return staleDataSources.value.length > 0 ? "status-warning" : "status-good";
    });
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      const now = Date.now();
      const diff = now - date.getTime();
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "accounting-integrity" }, _attrs))} data-v-2cc3db56><h3 data-v-2cc3db56>Accounting Integrity</h3><p class="question" data-v-2cc3db56>Can I trust the numbers on this screen?</p>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-2cc3db56>Checking data integrity...</div>`);
      } else if (unref(integrity)) {
        _push(`<div class="integrity-grid" data-v-2cc3db56><div class="${ssrRenderClass([unref(bankFeedStatusClass), "integrity-item"])}" data-v-2cc3db56><span class="label" data-v-2cc3db56>Bank Feed</span><span class="value" data-v-2cc3db56>${ssrInterpolate(unref(bankFeedStatus))}</span>`);
        if (unref(integrity).bankFeeds[0]?.lastSync) {
          _push(`<span class="detail" data-v-2cc3db56> Last sync: ${ssrInterpolate(formatTimestamp(unref(integrity).bankFeeds[0].lastSync))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="${ssrRenderClass([unref(reconciliationStatusClass), "integrity-item"])}" data-v-2cc3db56><span class="label" data-v-2cc3db56>Reconciliation</span><span class="value" data-v-2cc3db56>${ssrInterpolate(unref(reconciliationStatus))}</span>`);
        if (unref(integrity).lastReconciliation) {
          _push(`<span class="detail" data-v-2cc3db56> Last: ${ssrInterpolate(formatDate(unref(integrity).lastReconciliation.date))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="integrity-item" data-v-2cc3db56><span class="label" data-v-2cc3db56>Unreconciled Transactions</span><span class="value" data-v-2cc3db56>${ssrInterpolate(unref(integrity).unreconciledCount)}</span></div><div class="${ssrRenderClass([unref(dataFreshnessClass), "integrity-item"])}" data-v-2cc3db56><span class="label" data-v-2cc3db56>Data Freshness</span><span class="value" data-v-2cc3db56>${ssrInterpolate(unref(dataFreshnessStatus))}</span>`);
        if (unref(staleDataSources).length > 0) {
          _push(`<span class="detail warning" data-v-2cc3db56> Stale: ${ssrInterpolate(unref(staleDataSources).join(", "))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AccountingIntegrityStrip.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-2cc3db56"]]);
const useTaxSafety = () => {
  const supabase = useSupabaseClient();
  const getTaxObligations = async () => {
    const now = /* @__PURE__ */ new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
    const { data: upcoming } = await supabase.from("business_tax_reserves").select("*").in("status", ["accruing", "due_soon"]).lte("due_date", thirtyDaysFromNow.toISOString().split("T")[0]).order("due_date", { ascending: true });
    const { data: overdue } = await supabase.from("business_tax_reserves").select("*").eq("status", "overdue").order("due_date", { ascending: true });
    const { data: allReserves } = await supabase.from("business_tax_reserves").select("amount_expected, amount_reserved, status").in("status", ["accruing", "due_soon", "overdue"]);
    const totalExpected = allReserves?.reduce((sum, r) => sum + Number(r.amount_expected), 0) || 0;
    const totalReserved = allReserves?.reduce((sum, r) => sum + Number(r.amount_reserved), 0) || 0;
    const shortfall = Math.max(0, totalExpected - totalReserved);
    return {
      upcoming: upcoming || [],
      overdue: overdue || [],
      summary: {
        totalExpected,
        totalReserved,
        shortfall,
        isFullyFunded: shortfall === 0
      }
    };
  };
  const updateTaxReserve = async (id, amountReserved) => {
    const { error } = await supabase.from("business_tax_reserves").update({
      amount_reserved: amountReserved,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id);
    if (error) throw error;
  };
  const markTaxPaid = async (id) => {
    const { error } = await supabase.from("business_tax_reserves").update({
      status: "paid",
      paid_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    }).eq("id", id);
    if (error) throw error;
  };
  return {
    getTaxObligations,
    updateTaxReserve,
    markTaxPaid
  };
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "TaxSafetyBlock",
  __ssrInlineRender: true,
  setup(__props) {
    useTaxSafety();
    const taxes = ref(null);
    const loading = ref(true);
    const shortfallClass = computed(() => {
      if (!taxes.value) return "";
      return taxes.value.summary.shortfall > 0 ? "status-warning" : "status-good";
    });
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 100);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatTaxType = (type) => {
      const types = {
        "payroll_federal": "Federal Payroll Tax",
        "payroll_state": "State Payroll Tax",
        "payroll_local": "Local Payroll Tax",
        "sales": "Sales Tax",
        "estimated_income": "Estimated Income Tax",
        "property": "Property Tax",
        "other": "Other Tax"
      };
      return types[type] || type;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tax-safety" }, _attrs))} data-v-cb0aae78><h3 data-v-cb0aae78>Tax Safety</h3><p class="subtitle" data-v-cb0aae78>Business tax obligations and reserves</p>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-cb0aae78>Loading tax data...</div>`);
      } else if (unref(taxes)) {
        _push(`<div class="tax-content" data-v-cb0aae78><div class="summary-row" data-v-cb0aae78><div class="summary-item" data-v-cb0aae78><span class="label" data-v-cb0aae78>Total Expected</span><span class="value" data-v-cb0aae78>${ssrInterpolate(formatCurrency(unref(taxes).summary.totalExpected))}</span></div><div class="summary-item" data-v-cb0aae78><span class="label" data-v-cb0aae78>Total Reserved</span><span class="value" data-v-cb0aae78>${ssrInterpolate(formatCurrency(unref(taxes).summary.totalReserved))}</span></div><div class="${ssrRenderClass([unref(shortfallClass), "summary-item"])}" data-v-cb0aae78><span class="label" data-v-cb0aae78>Shortfall</span><span class="value" data-v-cb0aae78>${ssrInterpolate(formatCurrency(unref(taxes).summary.shortfall))}</span></div></div>`);
        if (unref(taxes).overdue.length > 0) {
          _push(`<div class="alert-section critical" data-v-cb0aae78><strong data-v-cb0aae78>⚠ Overdue Obligations (${ssrInterpolate(unref(taxes).overdue.length)})</strong><!--[-->`);
          ssrRenderList(unref(taxes).overdue, (tax) => {
            _push(`<div class="tax-item" data-v-cb0aae78><span data-v-cb0aae78>${ssrInterpolate(formatTaxType(tax.tax_type))}</span><span data-v-cb0aae78>Due: ${ssrInterpolate(formatDate(tax.due_date))}</span><span data-v-cb0aae78>${ssrInterpolate(formatCurrency(tax.amount_expected))}</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(taxes).upcoming.length > 0) {
          _push(`<div class="obligations-list" data-v-cb0aae78><h4 data-v-cb0aae78>Upcoming (Next 30 Days)</h4><!--[-->`);
          ssrRenderList(unref(taxes).upcoming, (tax) => {
            _push(`<div class="tax-item" data-v-cb0aae78><div class="tax-info" data-v-cb0aae78><span class="tax-type" data-v-cb0aae78>${ssrInterpolate(formatTaxType(tax.tax_type))}</span><span class="tax-period" data-v-cb0aae78>${ssrInterpolate(formatDate(tax.period_start))} - ${ssrInterpolate(formatDate(tax.period_end))}</span></div><div class="tax-amounts" data-v-cb0aae78><span data-v-cb0aae78>Expected: ${ssrInterpolate(formatCurrency(tax.amount_expected))}</span><span data-v-cb0aae78>Reserved: ${ssrInterpolate(formatCurrency(tax.amount_reserved))}</span><span class="due-date" data-v-cb0aae78>Due: ${ssrInterpolate(formatDate(tax.due_date))}</span></div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TaxSafetyBlock.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-cb0aae78"]]);
const useFounderCompensation = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const getCompensationSummary = async () => {
    const now = /* @__PURE__ */ new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const { data: events } = await supabase.from("founder_compensation_events").select("event_type, amount, event_date").eq("founder_id", user.value?.id).gte("event_date", startOfYear.toISOString().split("T")[0]).order("event_date", { ascending: false });
    const salaryYTD = events?.filter((e) => e.event_type === "salary").reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const distributionsYTD = events?.filter((e) => e.event_type === "distribution").reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    return {
      salaryYTD,
      distributionsYTD,
      totalYTD: salaryYTD + distributionsYTD,
      events: events || []
    };
  };
  const calculateSafeDistribution = async () => {
    const { data: policy } = await supabase.from("founder_compensation_policy").select("*").limit(1).maybeSingle();
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
      };
    }
    const { data: accounts } = await supabase.from("business_accounts").select("current_balance").eq("is_active", true);
    const totalCash = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;
    const { data: apData } = await supabase.from("accounts_payable").select("amount_outstanding, priority").eq("status", "pending");
    const payrollReserve = apData?.filter((ap) => ap.priority === "payroll").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0;
    const taxReserve = apData?.filter((ap) => ap.priority === "taxes").reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0;
    const apReserve = apData?.filter((ap) => ["critical", "normal"].includes(ap.priority)).reduce((sum, ap) => sum + Number(ap.amount_outstanding), 0) || 0;
    const minimumBuffer = Number(policy.minimum_cash_buffer);
    const available = Math.max(0, totalCash - minimumBuffer - payrollReserve - taxReserve - apReserve);
    const safeAmount = Math.floor(available * (Number(policy.safe_distribution_percentage) / 100));
    const calculation = {
      totalCash,
      minimumBuffer,
      payrollReserve,
      taxReserve,
      apReserve,
      available
    };
    await supabase.from("founder_withdrawal_calculations").insert({
      total_cash_available: totalCash,
      minimum_buffer_required: minimumBuffer,
      payroll_reserve_required: payrollReserve,
      tax_reserve_required: taxReserve,
      ap_reserve_required: apReserve,
      available_for_distribution: available,
      safe_distribution_amount: safeAmount,
      calculation_notes: "Automated calculation"
    });
    return {
      safeAmount,
      breakdown: calculation
    };
  };
  const getCompensationPolicy = async () => {
    const { data } = await supabase.from("founder_compensation_policy").select("*").limit(1).maybeSingle();
    return data;
  };
  return {
    getCompensationSummary,
    calculateSafeDistribution,
    getCompensationPolicy
  };
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "FounderCompensationGuardrails",
  __ssrInlineRender: true,
  setup(__props) {
    useFounderCompensation();
    const compensation = ref(null);
    const safeDistribution = ref(null);
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 100);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "founder-compensation" }, _attrs))} data-v-302d3144><h3 data-v-302d3144>Founder Compensation Guardrails</h3><p class="subtitle" data-v-302d3144>Business-side record of compensation (not personal finances)</p>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-302d3144>Loading compensation data...</div>`);
      } else if (unref(compensation) && unref(safeDistribution)) {
        _push(`<div class="compensation-content" data-v-302d3144><div class="summary-grid" data-v-302d3144><div class="summary-card" data-v-302d3144><span class="label" data-v-302d3144>Salary Paid YTD</span><span class="value" data-v-302d3144>${ssrInterpolate(formatCurrency(unref(compensation).salaryYTD))}</span></div><div class="summary-card" data-v-302d3144><span class="label" data-v-302d3144>Distributions YTD</span><span class="value" data-v-302d3144>${ssrInterpolate(formatCurrency(unref(compensation).distributionsYTD))}</span></div><div class="summary-card highlight" data-v-302d3144><span class="label" data-v-302d3144>Safe to Distribute Now</span><span class="value large" data-v-302d3144>${ssrInterpolate(formatCurrency(unref(safeDistribution).safeAmount))}</span><span class="help-text" data-v-302d3144>Based on cash safety rules</span></div></div><details class="breakdown" data-v-302d3144><summary data-v-302d3144>View Calculation Breakdown</summary><div class="breakdown-content" data-v-302d3144><div class="breakdown-row" data-v-302d3144><span data-v-302d3144>Total Cash Available</span><span data-v-302d3144>${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.totalCash))}</span></div><div class="breakdown-row deduction" data-v-302d3144><span data-v-302d3144>Minimum Cash Buffer</span><span data-v-302d3144>-${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.minimumBuffer))}</span></div><div class="breakdown-row deduction" data-v-302d3144><span data-v-302d3144>Payroll Reserve</span><span data-v-302d3144>-${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.payrollReserve))}</span></div><div class="breakdown-row deduction" data-v-302d3144><span data-v-302d3144>Tax Reserve</span><span data-v-302d3144>-${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.taxReserve))}</span></div><div class="breakdown-row deduction" data-v-302d3144><span data-v-302d3144>AP Reserve</span><span data-v-302d3144>-${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.apReserve))}</span></div><div class="breakdown-row total" data-v-302d3144><span data-v-302d3144>Available for Distribution</span><span data-v-302d3144>${ssrInterpolate(formatCurrency(unref(safeDistribution).breakdown.available))}</span></div></div></details><div class="notice" data-v-302d3144><p data-v-302d3144>This system tracks only what the business pays to you. It does not track personal finances, personal spending, or what you do with distributions after they leave the business.</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FounderCompensationGuardrails.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-302d3144"]]);
const useBillingQueue = () => {
  const supabase = useSupabaseClient();
  const getWorkQueue = async () => {
    const { data: queue } = await supabase.from("billing_work_queue").select(`
        *,
        billing_claims (
          claim_number,
          patient_name,
          service_date,
          billed_amount,
          payer_name,
          claim_status
        )
      `).eq("status", "pending").order("queue_priority", { ascending: true }).order("added_to_queue_at", { ascending: true });
    const grouped = queue?.reduce((acc, item) => {
      const action = item.action_required;
      if (!acc[action]) {
        acc[action] = [];
      }
      acc[action].push(item);
      return acc;
    }, {});
    return {
      queue: queue || [],
      grouped: grouped || {},
      count: queue?.length || 0
    };
  };
  const getClaimDetails = async (claimId) => {
    const { data: claim } = await supabase.from("billing_claims").select("*").eq("id", claimId).maybeSingle();
    const { data: eligibility } = await supabase.from("eligibility_checks").select("*").eq("claim_id", claimId).order("checked_at", { ascending: false }).limit(1).maybeSingle();
    const { data: submissions } = await supabase.from("claim_submissions").select("*").eq("claim_id", claimId).order("submitted_at", { ascending: false });
    const { data: statusInquiries } = await supabase.from("claim_status_inquiries").select("*").eq("claim_id", claimId).order("inquired_at", { ascending: false });
    const { data: remittances } = await supabase.from("remittance_advices").select("*").eq("claim_id", claimId).order("received_at", { ascending: false });
    const { data: ediTransactions } = await supabase.from("edi_transactions").select("*").eq("claim_id", claimId).order("created_at", { ascending: false });
    return {
      claim,
      eligibility,
      submissions: submissions || [],
      statusInquiries: statusInquiries || [],
      remittances: remittances || [],
      ediTransactions: ediTransactions || []
    };
  };
  const performAction = async (queueItemId, action, claimId, data) => {
    const user = useSupabaseUser();
    await supabase.from("audit_log").insert({
      event_type: "billing_action",
      actor_id: user.value?.id,
      actor_role: "biller",
      resource_type: "billing_claim",
      resource_id: claimId,
      action,
      result: "success",
      details: { queueItemId, ...data }
    });
    if (action === "verify_eligibility") {
      await supabase.from("edi_transactions").insert({
        claim_id: claimId,
        transaction_type: "270",
        direction: "outbound",
        status: "pending",
        sent_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await supabase.from("billing_claims").update({
        claim_status: "eligibility_pending",
        next_action_required: "wait_for_eligibility",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", claimId);
    }
    if (action === "submit_claim") {
      const { data: submission } = await supabase.from("claim_submissions").insert({
        claim_id: claimId,
        submission_method: "electronic",
        clearinghouse_status: "pending"
      }).select().single();
      await supabase.from("edi_transactions").insert({
        claim_id: claimId,
        transaction_type: "837",
        direction: "outbound",
        status: "pending",
        sent_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await supabase.from("billing_claims").update({
        claim_status: "submitted",
        next_action_required: "wait_for_clearinghouse",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", claimId);
    }
    if (action === "check_status") {
      await supabase.from("edi_transactions").insert({
        claim_id: claimId,
        transaction_type: "276",
        direction: "outbound",
        status: "pending",
        sent_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await supabase.from("billing_claims").update({
        next_action_required: "wait_for_status_response",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", claimId);
    }
    await supabase.from("billing_work_queue").update({
      status: "completed",
      action_taken_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", queueItemId);
  };
  const addToQueue = async (claimId, actionRequired, blockingReason, priority = 100) => {
    const { error } = await supabase.from("billing_work_queue").insert({
      claim_id: claimId,
      action_required: actionRequired,
      blocking_reason: blockingReason,
      queue_priority: priority,
      status: "pending"
    });
    if (error) throw error;
  };
  return {
    getWorkQueue,
    getClaimDetails,
    performAction,
    addToQueue
  };
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "BillingCommandCenter",
  __ssrInlineRender: true,
  setup(__props) {
    useBillingQueue();
    const queue = ref(null);
    const loading = ref(true);
    const selectedItem = ref(null);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 100);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatActionTitle = (action) => {
      const titles = {
        "verify_eligibility": "Verify Eligibility",
        "recheck_eligibility": "Recheck Eligibility",
        "submit_claim": "Submit Claim",
        "resubmit_claim": "Resubmit Claim",
        "check_status": "Check Status",
        "review_denial": "Review Denial",
        "attach_documentation": "Attach Documentation",
        "post_payment": "Post Payment",
        "contact_payer": "Contact Payer",
        "patient_follow_up": "Patient Follow-up"
      };
      return titles[action] || action;
    };
    const getActionButtonText = (action) => {
      const buttons = {
        "verify_eligibility": "Run Eligibility Check",
        "recheck_eligibility": "Recheck Eligibility",
        "submit_claim": "Submit Claim",
        "resubmit_claim": "Resubmit Claim",
        "check_status": "Request Status",
        "review_denial": "Review & Decide",
        "attach_documentation": "Attach Docs",
        "post_payment": "Post to AR",
        "contact_payer": "Log Payer Call",
        "patient_follow_up": "Contact Patient"
      };
      return buttons[action] || "Take Action";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "billing-command-center" }, _attrs))} data-v-4295016d><div class="header" data-v-4295016d><h3 data-v-4295016d>Billing Command Center</h3><p class="subtitle" data-v-4295016d>Operational queue for solo biller</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-4295016d>Loading billing queue...</div>`);
      } else if (unref(queue)) {
        _push(`<div class="queue-content" data-v-4295016d><div class="queue-summary" data-v-4295016d><div class="summary-stat" data-v-4295016d><span class="stat-value" data-v-4295016d>${ssrInterpolate(unref(queue).count)}</span><span class="stat-label" data-v-4295016d>Claims Need Action</span></div></div>`);
        if (unref(queue).count === 0) {
          _push(`<div class="empty-state" data-v-4295016d><p data-v-4295016d>No claims in queue. All billing tasks are current.</p></div>`);
        } else {
          _push(`<div class="queue-groups" data-v-4295016d><!--[-->`);
          ssrRenderList(unref(queue).grouped, (items, action) => {
            _push(`<div class="queue-group" data-v-4295016d><h4 class="group-title" data-v-4295016d>${ssrInterpolate(formatActionTitle(action))} <span class="count-badge" data-v-4295016d>${ssrInterpolate(items.length)}</span></h4><div class="queue-items" data-v-4295016d><!--[-->`);
            ssrRenderList(items, (item) => {
              _push(`<div class="queue-item" data-v-4295016d><div class="item-info" data-v-4295016d><span class="claim-number" data-v-4295016d>${ssrInterpolate(item.billing_claims?.claim_number)}</span><span class="patient-name" data-v-4295016d>${ssrInterpolate(item.billing_claims?.patient_name)}</span><span class="service-date" data-v-4295016d>${ssrInterpolate(formatDate(item.billing_claims?.service_date))}</span></div><div class="item-details" data-v-4295016d><span class="payer" data-v-4295016d>${ssrInterpolate(item.billing_claims?.payer_name)}</span><span class="amount" data-v-4295016d>${ssrInterpolate(formatCurrency(item.billing_claims?.billed_amount))}</span></div><div class="item-reason" data-v-4295016d>${ssrInterpolate(item.blocking_reason)}</div></div>`);
            });
            _push(`<!--]--></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(selectedItem)) {
        _push(`<div class="modal-overlay" data-v-4295016d><div class="modal" data-v-4295016d><div class="modal-header" data-v-4295016d><h3 data-v-4295016d>Claim Triage: ${ssrInterpolate(unref(selectedItem).billing_claims?.claim_number)}</h3><button class="close-button" data-v-4295016d>×</button></div><div class="modal-body" data-v-4295016d><div class="triage-section" data-v-4295016d><h4 data-v-4295016d>What&#39;s Blocking Payment</h4><p data-v-4295016d>${ssrInterpolate(unref(selectedItem).blocking_reason)}</p></div><div class="triage-section" data-v-4295016d><h4 data-v-4295016d>Claim Details</h4><div class="detail-row" data-v-4295016d><span data-v-4295016d>Patient:</span><span data-v-4295016d>${ssrInterpolate(unref(selectedItem).billing_claims?.patient_name)}</span></div><div class="detail-row" data-v-4295016d><span data-v-4295016d>Service Date:</span><span data-v-4295016d>${ssrInterpolate(formatDate(unref(selectedItem).billing_claims?.service_date))}</span></div><div class="detail-row" data-v-4295016d><span data-v-4295016d>Payer:</span><span data-v-4295016d>${ssrInterpolate(unref(selectedItem).billing_claims?.payer_name)}</span></div><div class="detail-row" data-v-4295016d><span data-v-4295016d>Amount:</span><span data-v-4295016d>${ssrInterpolate(formatCurrency(unref(selectedItem).billing_claims?.billed_amount))}</span></div><div class="detail-row" data-v-4295016d><span data-v-4295016d>Status:</span><span data-v-4295016d>${ssrInterpolate(unref(selectedItem).billing_claims?.claim_status)}</span></div></div><div class="triage-section" data-v-4295016d><h4 data-v-4295016d>Action Required</h4><p data-v-4295016d>${ssrInterpolate(formatActionTitle(unref(selectedItem).action_required))}</p></div></div><div class="modal-footer" data-v-4295016d><button class="action-button primary" data-v-4295016d>${ssrInterpolate(getActionButtonText(unref(selectedItem).action_required))}</button><button class="action-button" data-v-4295016d>Cancel</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BillingCommandCenter.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_5 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-4295016d"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PrivatePayRevenue",
  __ssrInlineRender: true,
  setup(__props) {
    useStripe();
    const analytics = ref(null);
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
      }).format(amount / 100);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "private-pay-revenue" }, _attrs))} data-v-a8308937><h3 data-v-a8308937>Private-Pay Revenue</h3><p class="subtitle" data-v-a8308937>Patient billing separate from insurance</p>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-a8308937>Loading private-pay data...</div>`);
      } else if (unref(analytics)) {
        _push(`<div class="revenue-content" data-v-a8308937><div class="summary-grid" data-v-a8308937><div class="summary-card highlight" data-v-a8308937><span class="label" data-v-a8308937>Total Revenue</span><span class="value" data-v-a8308937>${ssrInterpolate(formatCurrency(unref(analytics).totalRevenue))}</span></div><div class="summary-card" data-v-a8308937><span class="label" data-v-a8308937>Outstanding Balance</span><span class="value" data-v-a8308937>${ssrInterpolate(formatCurrency(unref(analytics).outstandingBalance))}</span></div><div class="summary-card" data-v-a8308937><span class="label" data-v-a8308937>Payment Success Rate</span><span class="value" data-v-a8308937>${ssrInterpolate(unref(analytics).completionRate.toFixed(1))}%</span></div></div><div class="breakdown-section" data-v-a8308937><h4 data-v-a8308937>Revenue by Service Type</h4><div class="breakdown-grid" data-v-a8308937><div class="breakdown-item" data-v-a8308937><span class="breakdown-label" data-v-a8308937>Ambulance Transport</span><span class="breakdown-value" data-v-a8308937>${ssrInterpolate(formatCurrency(unref(analytics).ambulanceRevenue))}</span></div><div class="breakdown-item" data-v-a8308937><span class="breakdown-label" data-v-a8308937>Telehealth</span><span class="breakdown-value" data-v-a8308937>${ssrInterpolate(formatCurrency(unref(analytics).telehealthRevenue))}</span></div></div></div><div class="status-section" data-v-a8308937><h4 data-v-a8308937>Payment Status</h4><div class="status-grid" data-v-a8308937><div class="status-item" data-v-a8308937><span class="status-count" data-v-a8308937>${ssrInterpolate(unref(analytics).paidCount)}</span><span class="status-label" data-v-a8308937>Paid</span></div><div class="status-item warning" data-v-a8308937><span class="status-count" data-v-a8308937>${ssrInterpolate(unref(analytics).failedCount)}</span><span class="status-label" data-v-a8308937>Failed</span></div><div class="status-item critical" data-v-a8308937><span class="status-count" data-v-a8308937>${ssrInterpolate(unref(analytics).disputedCount)}</span><span class="status-label" data-v-a8308937>Disputed</span></div></div></div>`);
        if (unref(analytics).failedCount > 0 || unref(analytics).disputedCount > 0) {
          _push(`<div class="alert-box" data-v-a8308937><strong data-v-a8308937>Attention Required</strong>`);
          if (unref(analytics).failedCount > 0) {
            _push(`<p data-v-a8308937>${ssrInterpolate(unref(analytics).failedCount)} failed ${ssrInterpolate(unref(analytics).failedCount === 1 ? "payment" : "payments")} need follow-up </p>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(analytics).disputedCount > 0) {
            _push(`<p data-v-a8308937>${ssrInterpolate(unref(analytics).disputedCount)} ${ssrInterpolate(unref(analytics).disputedCount === 1 ? "dispute" : "disputes")} in progress </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="notice" data-v-a8308937><p data-v-a8308937>All payment processing is handled securely by Stripe. No payment data is stored on this platform.</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PrivatePayRevenue.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-a8308937"]]);
const useTelehealth = () => {
  const supabase = useSupabaseClient();
  const createTelehealthEncounter = async (data) => {
    const encounterNumber = `TH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: encounter, error } = await supabase.from("telehealth_encounters").insert({
      encounter_number: encounterNumber,
      patient_name: data.patientName,
      patient_dob: data.patientDob,
      session_start: data.sessionStart,
      provider_type: data.providerType,
      service_category: data.serviceCategory,
      disposition: data.disposition,
      is_billable: true
    }).select().single();
    if (error) throw error;
    return encounter;
  };
  const completeTelehealthSession = async (encounterId, sessionEnd, clinicalNotes, resultedInTransport, transportIncidentId) => {
    const sessionStart = new Date((await supabase.from("telehealth_encounters").select("session_start").eq("id", encounterId).single()).data?.session_start || "");
    const sessionEndDate = new Date(sessionEnd);
    const durationMinutes = Math.round((sessionEndDate.getTime() - sessionStart.getTime()) / 6e4);
    const { error } = await supabase.from("telehealth_encounters").update({
      session_end: sessionEnd,
      duration_minutes: durationMinutes,
      clinical_notes: clinicalNotes,
      resulted_in_transport: resultedInTransport,
      transport_incident_id: transportIncidentId || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", encounterId);
    if (error) throw error;
  };
  const createTelehealthBillingEvent = async (data) => {
    const { data: billingEvent, error } = await supabase.from("telehealth_billing_events").insert({
      encounter_id: data.encounterId,
      cpt_code: data.cptCode,
      service_description: data.serviceDescription,
      charge_amount: data.chargeAmount,
      payer_path: data.payerPath,
      billing_claim_id: data.billingClaimId || null,
      private_invoice_id: data.privateInvoiceId || null,
      billing_status: "pending"
    }).select().single();
    if (error) throw error;
    return billingEvent;
  };
  const linkTelehealthToTransport = async (telehealthEncounterId, transportIncidentId, billingRelationship, bundlingRule) => {
    const { error } = await supabase.from("telehealth_transport_bundles").insert({
      telehealth_encounter_id: telehealthEncounterId,
      transport_incident_id: transportIncidentId,
      billing_relationship: billingRelationship,
      bundling_rule: bundlingRule
    });
    if (error) throw error;
  };
  const getTelehealthEncounters = async (filters) => {
    let query = supabase.from("telehealth_encounters").select("*").order("session_start", { ascending: false });
    if (filters?.startDate) {
      query = query.gte("session_start", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("session_start", filters.endDate);
    }
    if (filters?.disposition) {
      query = query.eq("disposition", filters.disposition);
    }
    if (filters?.isBillable !== void 0) {
      query = query.eq("is_billable", filters.isBillable);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const getTelehealthBillingEvents = async (encounterId) => {
    const { data, error } = await supabase.from("telehealth_billing_events").select("*").eq("encounter_id", encounterId);
    if (error) throw error;
    return data || [];
  };
  const getTelehealthAnalytics = async () => {
    const { data: encounters } = await supabase.from("telehealth_encounters").select("*");
    const { data: billingEvents } = await supabase.from("telehealth_billing_events").select("*");
    const totalEncounters = encounters?.length || 0;
    const billableEncounters = encounters?.filter((e) => e.is_billable).length || 0;
    const transportDispatched = encounters?.filter((e) => e.resulted_in_transport).length || 0;
    const totalRevenue = billingEvents?.reduce((sum, e) => sum + Number(e.charge_amount), 0) || 0;
    const paidRevenue = billingEvents?.filter((e) => e.billing_status === "paid").reduce((sum, e) => sum + Number(e.charge_amount), 0) || 0;
    return {
      totalEncounters,
      billableEncounters,
      transportDispatched,
      totalRevenue,
      paidRevenue,
      transportRate: totalEncounters ? transportDispatched / totalEncounters * 100 : 0
    };
  };
  return {
    createTelehealthEncounter,
    completeTelehealthSession,
    createTelehealthBillingEvent,
    linkTelehealthToTransport,
    getTelehealthEncounters,
    getTelehealthBillingEvents,
    getTelehealthAnalytics
  };
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TelehealthBillingPanel",
  __ssrInlineRender: true,
  setup(__props) {
    useTelehealth();
    const analytics = ref(null);
    const encounters = ref([]);
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
      }).format(amount / 100);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatProviderType = (type) => {
      const types = {
        "physician": "MD",
        "nurse_practitioner": "NP",
        "physician_assistant": "PA",
        "nurse": "RN",
        "paramedic": "Paramedic",
        "emt": "EMT"
      };
      return types[type] || type;
    };
    const formatServiceCategory = (category) => {
      const categories = {
        "consultation": "Consultation",
        "follow_up": "Follow-up",
        "triage": "Triage",
        "assessment": "Assessment",
        "urgent_care": "Urgent Care",
        "mental_health": "Mental Health"
      };
      return categories[category] || category;
    };
    const formatDisposition = (disposition) => {
      const dispositions = {
        "resolved": "Resolved",
        "ems_dispatched": "EMS Dispatched",
        "referred": "Referred",
        "follow_up_needed": "Follow-up",
        "transferred": "Transferred",
        "self_care": "Self-care"
      };
      return dispositions[disposition] || disposition;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "telehealth-billing" }, _attrs))} data-v-17617311><div class="panel-header" data-v-17617311><h3 data-v-17617311>Telehealth Billing</h3><p class="subtitle" data-v-17617311>Carefusion Telehealth encounters and revenue</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-17617311>Loading telehealth data...</div>`);
      } else if (unref(analytics)) {
        _push(`<div class="content" data-v-17617311><div class="metrics-grid" data-v-17617311><div class="metric-card" data-v-17617311><span class="metric-label" data-v-17617311>Total Encounters</span><span class="metric-value" data-v-17617311>${ssrInterpolate(unref(analytics).totalEncounters)}</span></div><div class="metric-card" data-v-17617311><span class="metric-label" data-v-17617311>Billable Encounters</span><span class="metric-value" data-v-17617311>${ssrInterpolate(unref(analytics).billableEncounters)}</span></div><div class="metric-card" data-v-17617311><span class="metric-label" data-v-17617311>Transport Dispatched</span><span class="metric-value" data-v-17617311>${ssrInterpolate(unref(analytics).transportDispatched)}</span><span class="metric-detail" data-v-17617311>${ssrInterpolate(unref(analytics).transportRate.toFixed(1))}% dispatch rate</span></div><div class="metric-card highlight" data-v-17617311><span class="metric-label" data-v-17617311>Telehealth Revenue</span><span class="metric-value" data-v-17617311>${ssrInterpolate(formatCurrency(unref(analytics).paidRevenue))}</span><span class="metric-detail" data-v-17617311>of ${ssrInterpolate(formatCurrency(unref(analytics).totalRevenue))} billed</span></div></div><div class="encounters-section" data-v-17617311><h4 data-v-17617311>Recent Encounters</h4>`);
        if (unref(encounters).length === 0) {
          _push(`<div class="empty-state" data-v-17617311> No telehealth encounters yet </div>`);
        } else {
          _push(`<div class="encounters-list" data-v-17617311><!--[-->`);
          ssrRenderList(unref(encounters), (encounter) => {
            _push(`<div class="encounter-item" data-v-17617311><div class="encounter-info" data-v-17617311><span class="encounter-number" data-v-17617311>${ssrInterpolate(encounter.encounter_number)}</span><span class="encounter-date" data-v-17617311>${ssrInterpolate(formatDate(encounter.session_start))}</span></div><div class="encounter-details" data-v-17617311><span data-v-17617311>${ssrInterpolate(formatProviderType(encounter.provider_type))}</span><span data-v-17617311>${ssrInterpolate(formatServiceCategory(encounter.service_category))}</span>`);
            if (encounter.duration_minutes) {
              _push(`<span data-v-17617311>${ssrInterpolate(encounter.duration_minutes)} min</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="encounter-status" data-v-17617311><span class="${ssrRenderClass(["disposition-badge", encounter.resulted_in_transport ? "transport" : "resolved"])}" data-v-17617311>${ssrInterpolate(formatDisposition(encounter.disposition))}</span></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TelehealthBillingPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-17617311"]]);
const useSystemHealth = () => {
  const supabase = useSupabaseClient();
  const getHealthSignals = async () => {
    const { data: signals } = await supabase.from("system_health_signals").select("*").order("system_name");
    const { data: tools } = await supabase.from("tool_integration_status").select("*").order("tool_name");
    return {
      signals: signals || [],
      tools: tools || []
    };
  };
  const getActiveAlerts = async () => {
    const { data: alerts } = await supabase.from("dashboard_alerts").select("*").is("resolved_at", null).order("severity", { ascending: false }).order("triggered_at", { ascending: false });
    return alerts || [];
  };
  const acknowledgeAlert = async (alertId) => {
    const user = useSupabaseUser();
    const { error } = await supabase.from("dashboard_alerts").update({
      acknowledged_at: (/* @__PURE__ */ new Date()).toISOString(),
      acknowledged_by: user.value?.id
    }).eq("id", alertId);
    if (error) throw error;
  };
  const resolveAlert = async (alertId) => {
    const { error } = await supabase.from("dashboard_alerts").update({
      resolved_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", alertId);
    if (error) throw error;
  };
  const createAlert = async (alert) => {
    const { error } = await supabase.from("dashboard_alerts").insert({
      alert_type: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      action_required: alert.actionRequired,
      context: alert.context || {}
    });
    if (error) throw error;
  };
  const updateToolStatus = async (toolName, status) => {
    const { error } = await supabase.from("tool_integration_status").update({
      ...status,
      last_checked: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("tool_name", toolName);
    if (error) throw error;
  };
  return {
    getHealthSignals,
    getActiveAlerts,
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    updateToolStatus
  };
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    useSystemHealth();
    const alerts = ref([]);
    const loading = ref(true);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PlatformRevenueBreakdown = __nuxt_component_0;
      const _component_BusinessHealthSummary = __nuxt_component_1;
      const _component_AccountingIntegrityStrip = __nuxt_component_2;
      const _component_TaxSafetyBlock = __nuxt_component_3;
      const _component_FounderCompensationGuardrails = __nuxt_component_4;
      const _component_BillingCommandCenter = __nuxt_component_5;
      const _component_PrivatePayRevenue = __nuxt_component_6;
      const _component_TelehealthBillingPanel = __nuxt_component_7;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "founder-dashboard" }, _attrs))} data-v-4b2a9d8d><div class="dashboard-header" data-v-4b2a9d8d><h1 data-v-4b2a9d8d>Founder Dashboard</h1><p class="dashboard-subtitle" data-v-4b2a9d8d>Single-screen monitoring view for fast decisions</p>`);
      if (unref(alerts).length > 0) {
        _push(`<div class="active-alerts" data-v-4b2a9d8d><span class="alerts-badge" data-v-4b2a9d8d>${ssrInterpolate(unref(alerts).length)} ${ssrInterpolate(unref(alerts).length === 1 ? "Alert" : "Alerts")}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="loading-state" data-v-4b2a9d8d><div class="spinner" data-v-4b2a9d8d></div><p data-v-4b2a9d8d>Loading dashboard...</p></div>`);
      } else {
        _push(`<div class="dashboard-content" data-v-4b2a9d8d>`);
        if (unref(alerts).length > 0) {
          _push(`<section class="alerts-section" data-v-4b2a9d8d><!--[-->`);
          ssrRenderList(unref(alerts), (alert) => {
            _push(`<div class="${ssrRenderClass(["alert-item", `severity-${alert.severity}`])}" data-v-4b2a9d8d><div class="alert-header" data-v-4b2a9d8d><span class="alert-icon" data-v-4b2a9d8d>${ssrInterpolate(alert.severity === "critical" ? "⚠" : alert.severity === "warning" ? "⚡" : "ℹ")}</span><span class="alert-title" data-v-4b2a9d8d>${ssrInterpolate(alert.title)}</span></div><p class="alert-message" data-v-4b2a9d8d>${ssrInterpolate(alert.message)}</p><p class="alert-action" data-v-4b2a9d8d><strong data-v-4b2a9d8d>What to do:</strong> ${ssrInterpolate(alert.action_required)}</p><div class="alert-actions" data-v-4b2a9d8d><button class="alert-button" data-v-4b2a9d8d>Acknowledge</button><button class="alert-button primary" data-v-4b2a9d8d>Resolve</button></div></div>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="platform-revenue-section" data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_PlatformRevenueBreakdown, null, null, _parent));
        _push(`</section><section class="monitoring-layer" data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_BusinessHealthSummary, null, null, _parent));
        _push(ssrRenderComponent(_component_AccountingIntegrityStrip, null, null, _parent));
        _push(`</section><section class="decision-support-layer" data-v-4b2a9d8d><div class="two-column-grid" data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_TaxSafetyBlock, null, null, _parent));
        _push(ssrRenderComponent(_component_FounderCompensationGuardrails, null, null, _parent));
        _push(`</div></section><section class="operations-layer" data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_BillingCommandCenter, null, null, _parent));
        _push(`</section><section class="revenue-layer" data-v-4b2a9d8d><div class="two-column-grid" data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_PrivatePayRevenue, null, null, _parent));
        _push(`<div data-v-4b2a9d8d>`);
        _push(ssrRenderComponent(_component_TelehealthBillingPanel, null, null, _parent));
        _push(`</div></div></section></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/founder/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const dashboard = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4b2a9d8d"]]);
export {
  dashboard as default
};
//# sourceMappingURL=dashboard-CS_4XqtU.js.map
