import { defineComponent, ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderAttr } from "vue/server-renderer";
import { u as useStripe } from "./useStripe-CrT1Y72L.js";
import { _ as _export_sfc } from "../server.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/tmp/cc-agent/63214198/project/node_modules/hookable/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/unctx/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/tmp/cc-agent/63214198/project/node_modules/defu/dist/defu.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ufo/dist/index.mjs";
import "@supabase/supabase-js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bills",
  __ssrInlineRender: true,
  setup(__props) {
    useStripe();
    useSupabaseUser();
    const invoices = ref([]);
    const selectedInvoice = ref(null);
    const invoiceDetails = ref({});
    const loading = ref(true);
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }).format(amount / 100);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };
    const formatStatus = (status) => {
      const statusMap = {
        "unpaid": "Unpaid",
        "paid": "Paid",
        "failed": "Payment Failed",
        "disputed": "Disputed"
      };
      return statusMap[status] || status;
    };
    const formatServiceType = (type) => {
      const typeMap = {
        "ambulance_transport": "Ambulance Transport",
        "telehealth": "Telehealth Service"
      };
      return typeMap[type] || type;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "patient-portal" }, _attrs))} data-v-4016c403><div class="portal-header" data-v-4016c403><h1 data-v-4016c403>Your Bills</h1><p class="subtitle" data-v-4016c403>View and pay your ambulance and telehealth bills securely</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading-state" data-v-4016c403><div class="spinner" data-v-4016c403></div><p data-v-4016c403>Loading your bills...</p></div>`);
      } else if (unref(invoices).length === 0) {
        _push(`<div class="empty-state" data-v-4016c403><p data-v-4016c403>You have no bills at this time.</p></div>`);
      } else {
        _push(`<div class="invoices-list" data-v-4016c403><!--[-->`);
        ssrRenderList(unref(invoices), (invoice) => {
          _push(`<div class="invoice-card" data-v-4016c403><div class="invoice-header" data-v-4016c403><span class="invoice-number" data-v-4016c403>${ssrInterpolate(invoice.invoice_number)}</span><span class="${ssrRenderClass(["status-badge", `status-${invoice.payment_status}`])}" data-v-4016c403>${ssrInterpolate(formatStatus(invoice.payment_status))}</span></div><div class="invoice-details" data-v-4016c403><div class="detail-row" data-v-4016c403><span class="label" data-v-4016c403>Service Type:</span><span data-v-4016c403>${ssrInterpolate(formatServiceType(invoice.service_type))}</span></div><div class="detail-row" data-v-4016c403><span class="label" data-v-4016c403>Due Date:</span><span data-v-4016c403>${ssrInterpolate(formatDate(invoice.due_date))}</span></div><div class="detail-row" data-v-4016c403><span class="label" data-v-4016c403>Amount Due:</span><span class="amount-due" data-v-4016c403>${ssrInterpolate(formatCurrency(invoice.amount_outstanding))}</span></div></div>`);
          if (invoice.payment_status === "unpaid") {
            _push(`<button class="pay-button" data-v-4016c403> Pay Now </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedInvoice)) {
        _push(`<div class="modal-overlay" data-v-4016c403><div class="modal" data-v-4016c403><div class="modal-header" data-v-4016c403><h2 data-v-4016c403>Bill Details</h2><button class="close-button" data-v-4016c403>×</button></div><div class="modal-body" data-v-4016c403>`);
        if (unref(invoiceDetails).statement) {
          _push(`<div class="statement-section" data-v-4016c403><h3 data-v-4016c403>Statement of Services</h3><div class="statement-content" data-v-4016c403><div class="statement-row" data-v-4016c403><span class="label" data-v-4016c403>Service Date:</span><span data-v-4016c403>${ssrInterpolate(formatDate(unref(invoiceDetails).statement.service_date))}</span></div><div class="statement-row" data-v-4016c403><span class="label" data-v-4016c403>Service Description:</span><span data-v-4016c403>${ssrInterpolate(unref(invoiceDetails).statement.service_description)}</span></div>`);
          if (unref(invoiceDetails).statement.origin_address) {
            _push(`<div class="statement-row" data-v-4016c403><span class="label" data-v-4016c403>From:</span><span data-v-4016c403>${ssrInterpolate(unref(invoiceDetails).statement.origin_address)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(invoiceDetails).statement.destination_address) {
            _push(`<div class="statement-row" data-v-4016c403><span class="label" data-v-4016c403>To:</span><span data-v-4016c403>${ssrInterpolate(unref(invoiceDetails).statement.destination_address)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="charges-breakdown" data-v-4016c403><div class="charge-row" data-v-4016c403><span data-v-4016c403>Total Charge</span><span data-v-4016c403>${ssrInterpolate(formatCurrency(unref(invoiceDetails).statement.total_charge))}</span></div><div class="charge-row" data-v-4016c403><span data-v-4016c403>Insurance Payment</span><span data-v-4016c403>-${ssrInterpolate(formatCurrency(unref(invoiceDetails).statement.insurance_payment))}</span></div>`);
          if (unref(invoiceDetails).statement.adjustments > 0) {
            _push(`<div class="charge-row" data-v-4016c403><span data-v-4016c403>Adjustments</span><span data-v-4016c403>-${ssrInterpolate(formatCurrency(unref(invoiceDetails).statement.adjustments))}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="charge-row total" data-v-4016c403><span data-v-4016c403>Your Responsibility</span><span data-v-4016c403>${ssrInterpolate(formatCurrency(unref(invoiceDetails).statement.patient_balance))}</span></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(invoiceDetails).paymentPlan) {
          _push(`<div class="payment-plan-section" data-v-4016c403><h3 data-v-4016c403>Payment Plan</h3><div class="plan-details" data-v-4016c403><div class="plan-row" data-v-4016c403><span data-v-4016c403>Installment Amount:</span><span data-v-4016c403>${ssrInterpolate(formatCurrency(unref(invoiceDetails).paymentPlan.installment_amount))}</span></div><div class="plan-row" data-v-4016c403><span data-v-4016c403>Payments Made:</span><span data-v-4016c403>${ssrInterpolate(unref(invoiceDetails).paymentPlan.installments_paid)} of ${ssrInterpolate(unref(invoiceDetails).paymentPlan.installments_total)}</span></div><div class="plan-row" data-v-4016c403><span data-v-4016c403>Next Payment:</span><span data-v-4016c403>${ssrInterpolate(formatDate(unref(invoiceDetails).paymentPlan.next_payment_date))}</span></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="modal-footer" data-v-4016c403>`);
        if (unref(selectedInvoice).stripe_hosted_url && unref(selectedInvoice).payment_status === "unpaid") {
          _push(`<a${ssrRenderAttr("href", unref(selectedInvoice).stripe_hosted_url)} target="_blank" class="stripe-pay-button" data-v-4016c403> Pay Securely with Stripe </a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="security-notice" data-v-4016c403> All payments are processed securely by Stripe. We never store your payment information. </p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/patient/bills.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const bills = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4016c403"]]);
export {
  bills as default
};
//# sourceMappingURL=bills-CWW4jLfJ.js.map
