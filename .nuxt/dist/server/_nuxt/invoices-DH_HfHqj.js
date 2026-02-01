import { defineComponent, ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from "vue/server-renderer";
import { u as usePlatformPricing } from "./usePlatformPricing-DwP11hj2.js";
import { _ as _export_sfc } from "../server.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/hookable/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/tmp/cc-agent/63214198/project/node_modules/unctx/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/tmp/cc-agent/63214198/project/node_modules/defu/dist/defu.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ufo/dist/index.mjs";
import "@supabase/supabase-js";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PlatformInvoiceList",
  __ssrInlineRender: true,
  props: {
    agencyId: {}
  },
  setup(__props) {
    usePlatformPricing();
    const invoices2 = ref([]);
    const selectedInvoice = ref(null);
    const invoiceDetails = ref({ lineItems: [] });
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }).format(amount / 100);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };
    const formatStatus = (status) => {
      const statusMap = {
        "draft": "Draft",
        "sent": "Sent",
        "paid": "Paid",
        "overdue": "Overdue",
        "cancelled": "Cancelled"
      };
      return statusMap[status] || status;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "invoice-list" }, _attrs))} data-v-9037f528><div class="list-header" data-v-9037f528><h4 data-v-9037f528>Platform Invoices</h4><button class="refresh-button" data-v-9037f528>Refresh</button></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-9037f528>Loading invoices...</div>`);
      } else if (unref(invoices2).length === 0) {
        _push(`<div class="empty-state" data-v-9037f528> No invoices found </div>`);
      } else {
        _push(`<div class="invoices-container" data-v-9037f528><!--[-->`);
        ssrRenderList(unref(invoices2), (invoice) => {
          _push(`<div class="invoice-card" data-v-9037f528><div class="invoice-header" data-v-9037f528><span class="invoice-number" data-v-9037f528>${ssrInterpolate(invoice.invoice_number)}</span><span class="${ssrRenderClass(["status-badge", `status-${invoice.invoice_status}`])}" data-v-9037f528>${ssrInterpolate(formatStatus(invoice.invoice_status))}</span></div><div class="invoice-details" data-v-9037f528><div class="detail-row" data-v-9037f528><span class="label" data-v-9037f528>Period:</span><span data-v-9037f528>${ssrInterpolate(formatDate(invoice.invoice_period_start))} - ${ssrInterpolate(formatDate(invoice.invoice_period_end))}</span></div><div class="detail-row" data-v-9037f528><span class="label" data-v-9037f528>Base Fee:</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(invoice.base_platform_fee))}</span></div><div class="detail-row" data-v-9037f528><span class="label" data-v-9037f528>Billable Calls:</span><span data-v-9037f528>${ssrInterpolate(invoice.billable_calls_count)} calls (${ssrInterpolate(formatCurrency(invoice.billable_calls_total))})</span></div><div class="detail-row total" data-v-9037f528><span class="label" data-v-9037f528>Total Due:</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(invoice.total_amount_due))}</span></div></div><div class="invoice-footer" data-v-9037f528><span class="due-date" data-v-9037f528>Due: ${ssrInterpolate(formatDate(invoice.due_date))}</span></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedInvoice)) {
        _push(`<div class="modal-overlay" data-v-9037f528><div class="modal" data-v-9037f528><div class="modal-header" data-v-9037f528><h3 data-v-9037f528>Invoice Details</h3><button class="close-button" data-v-9037f528>×</button></div><div class="modal-body" data-v-9037f528><div class="invoice-info" data-v-9037f528><div class="info-row" data-v-9037f528><span class="label" data-v-9037f528>Invoice Number:</span><span data-v-9037f528>${ssrInterpolate(unref(selectedInvoice).invoice_number)}</span></div><div class="info-row" data-v-9037f528><span class="label" data-v-9037f528>Billing Period:</span><span data-v-9037f528>${ssrInterpolate(formatDate(unref(selectedInvoice).invoice_period_start))} - ${ssrInterpolate(formatDate(unref(selectedInvoice).invoice_period_end))}</span></div><div class="info-row" data-v-9037f528><span class="label" data-v-9037f528>Status:</span><span class="${ssrRenderClass(["status-badge", `status-${unref(selectedInvoice).invoice_status}`])}" data-v-9037f528>${ssrInterpolate(formatStatus(unref(selectedInvoice).invoice_status))}</span></div><div class="info-row" data-v-9037f528><span class="label" data-v-9037f528>Due Date:</span><span data-v-9037f528>${ssrInterpolate(formatDate(unref(selectedInvoice).due_date))}</span></div></div>`);
        if (unref(invoiceDetails).lineItems.length > 0) {
          _push(`<div class="line-items" data-v-9037f528><h4 data-v-9037f528>Line Items</h4><div class="line-items-table" data-v-9037f528><!--[-->`);
          ssrRenderList(unref(invoiceDetails).lineItems, (item) => {
            _push(`<div class="line-item" data-v-9037f528><div class="item-desc" data-v-9037f528><span class="item-title" data-v-9037f528>${ssrInterpolate(item.description)}</span><span class="item-qty" data-v-9037f528>Qty: ${ssrInterpolate(item.quantity)} × ${ssrInterpolate(formatCurrency(item.unit_price))}</span></div><span class="item-amount" data-v-9037f528>${ssrInterpolate(formatCurrency(item.amount))}</span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="invoice-totals" data-v-9037f528><div class="total-row" data-v-9037f528><span data-v-9037f528>Subtotal</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(unref(selectedInvoice).subtotal))}</span></div>`);
        if (unref(selectedInvoice).stripe_passthrough_fees > 0) {
          _push(`<div class="total-row" data-v-9037f528><span data-v-9037f528>Stripe Fees (passthrough)</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(unref(selectedInvoice).stripe_passthrough_fees))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="total-row final" data-v-9037f528><span data-v-9037f528>Total Amount Due</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(unref(selectedInvoice).total_amount_due))}</span></div>`);
        if (unref(selectedInvoice).amount_paid > 0) {
          _push(`<div class="total-row paid" data-v-9037f528><span data-v-9037f528>Amount Paid</span><span data-v-9037f528>${ssrInterpolate(formatCurrency(unref(selectedInvoice).amount_paid))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PlatformInvoiceList.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-9037f528"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "invoices",
  __ssrInlineRender: true,
  setup(__props) {
    const agencyId = ref("default-agency-id");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PlatformInvoiceList = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "billing-invoices-page" }, _attrs))} data-v-bbaa833e><div class="page-header" data-v-bbaa833e><h1 data-v-bbaa833e>Platform Invoices</h1><p class="subtitle" data-v-bbaa833e>Monthly platform fees and billable call charges</p></div><div class="pricing-summary" data-v-bbaa833e><div class="pricing-card" data-v-bbaa833e><span class="pricing-icon" data-v-bbaa833e>💳</span><div class="pricing-info" data-v-bbaa833e><span class="pricing-label" data-v-bbaa833e>Monthly Platform Fee</span><span class="pricing-amount" data-v-bbaa833e>$500.00</span><span class="pricing-desc" data-v-bbaa833e>Base subscription fee</span></div></div><div class="pricing-card" data-v-bbaa833e><span class="pricing-icon" data-v-bbaa833e>📞</span><div class="pricing-info" data-v-bbaa833e><span class="pricing-label" data-v-bbaa833e>Per-Billable-Call Fee</span><span class="pricing-amount" data-v-bbaa833e>$45.00</span><span class="pricing-desc" data-v-bbaa833e>Per encounter charge</span></div></div></div><div class="invoice-section" data-v-bbaa833e>`);
      _push(ssrRenderComponent(_component_PlatformInvoiceList, { "agency-id": unref(agencyId) }, null, _parent));
      _push(`</div><div class="pricing-policy" data-v-bbaa833e><h3 data-v-bbaa833e>Pricing Policy</h3><div class="policy-content" data-v-bbaa833e><p data-v-bbaa833e>Our platform uses a fixed pricing model designed for predictability and transparency:</p><ul data-v-bbaa833e><li data-v-bbaa833e><strong data-v-bbaa833e>Monthly Platform Fee ($500):</strong> Covers system availability, automation readiness, integrations, compliance posture, monitoring, and support. Charged regardless of call volume.</li><li data-v-bbaa833e><strong data-v-bbaa833e>Per-Billable-Call Fee ($45):</strong> Charged once per completed billable encounter (EMS transports, treatment-in-place, refusals, private-pay, telehealth). Not dependent on insurance reimbursement or claim outcome.</li><li data-v-bbaa833e><strong data-v-bbaa833e>No Percentage-Based Pricing:</strong> We do not use revenue sharing or percentage-based fees.</li><li data-v-bbaa833e><strong data-v-bbaa833e>Transparent Pass-Through:</strong> Stripe payment processing fees are passed through at cost with no markup.</li><li data-v-bbaa833e><strong data-v-bbaa833e>Automation Value:</strong> Pricing is not adjusted based on automation level. Automation improves reliability, not just reduces manual effort.</li></ul></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/billing/invoices.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const invoices = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bbaa833e"]]);
export {
  invoices as default
};
//# sourceMappingURL=invoices-DH_HfHqj.js.map
