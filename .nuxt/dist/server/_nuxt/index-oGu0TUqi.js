import { ref, reactive, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import "/tmp/cc-agent/63214198/project/node_modules/hookable/dist/index.mjs";
import { u as useApi } from "./useApi-BbYKoEyw.js";
import "../server.mjs";
import "./useAuth-BbjuGs-d.js";
import "/tmp/cc-agent/63214198/project/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/tmp/cc-agent/63214198/project/node_modules/unctx/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/tmp/cc-agent/63214198/project/node_modules/defu/dist/defu.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ufo/dist/index.mjs";
import "@supabase/supabase-js";
const useBilling = () => {
  const { supabase } = useApi();
  const AMBULANCE_CODES = {
    BLS: { code: "A0428", description: "Ambulance service, basic life support, non-emergency transport" },
    BLS_EMERGENCY: { code: "A0429", description: "Ambulance service, basic life support, emergency transport" },
    ALS1: { code: "A0426", description: "Ambulance service, advanced life support, non-emergency transport, level 1" },
    ALS1_EMERGENCY: { code: "A0427", description: "Ambulance service, advanced life support, emergency transport, level 1" },
    ALS2: { code: "A0433", description: "Ambulance service, advanced life support, level 2" },
    SCT: { code: "A0434", description: "Ambulance service, specialty care transport" },
    MILEAGE: { code: "A0425", description: "Ground mileage, per statute mile" }
  };
  const determineAmbulanceCode = (levelOfService, isEmergency) => {
    if (levelOfService === "BLS") {
      return isEmergency ? AMBULANCE_CODES.BLS_EMERGENCY : AMBULANCE_CODES.BLS;
    } else if (levelOfService === "ALS1") {
      return isEmergency ? AMBULANCE_CODES.ALS1_EMERGENCY : AMBULANCE_CODES.ALS1;
    } else if (levelOfService === "ALS2") {
      return AMBULANCE_CODES.ALS2;
    } else if (levelOfService === "SCT") {
      return AMBULANCE_CODES.SCT;
    }
    return AMBULANCE_CODES.BLS;
  };
  const generateClaimFromIncident = async (incidentId, organizationId) => {
    try {
      const { data: incident, error: incidentError } = await supabase.from("incidents").select(`
          *,
          patients (*),
          transport_data (*)
        `).eq("id", incidentId).single();
      if (incidentError) throw incidentError;
      const patient = incident.patients[0];
      const transport = incident.transport_data[0];
      if (!transport) {
        throw new Error("No transport data found for this incident");
      }
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const isEmergency = transport.patient_acuity === "emergent";
      const baseCode = determineAmbulanceCode(transport.level_of_service, isEmergency);
      const baseCharge = {
        BLS: 450,
        BLS_EMERGENCY: 550,
        ALS1: 650,
        ALS1_EMERGENCY: 750,
        ALS2: 950,
        SCT: 1200
      }[transport.level_of_service] || 450;
      const mileageRate = 12.5;
      const mileageCharge = transport.total_mileage * mileageRate;
      const totalCharge = baseCharge + mileageCharge;
      const { data: claim, error: claimError } = await supabase.from("claims").insert([{
        organization_id: organizationId,
        incident_id: incidentId,
        patient_id: patient.id,
        payer_id: patient.primary_insurance_payer_id,
        claim_number: claimNumber,
        claim_type: "professional",
        total_charge: totalCharge,
        balance: totalCharge,
        service_date: new Date(transport.created_at).toISOString().split("T")[0],
        status: "draft",
        medical_necessity_documented: !!transport.medical_necessity_reason
      }]).select().single();
      if (claimError) throw claimError;
      const claimLines = [
        {
          claim_id: claim.id,
          line_number: 1,
          procedure_code: baseCode.code,
          procedure_description: baseCode.description,
          modifier_1: "QM",
          modifier_2: "QN",
          origin_code: transport.origin_code,
          destination_code: transport.destination_code || "H",
          unit_charge: baseCharge,
          units: 1,
          total_charge: baseCharge,
          service_date: claim.service_date,
          diagnosis_pointers: ["A"]
        }
      ];
      if (transport.total_mileage > 0) {
        claimLines.push({
          claim_id: claim.id,
          line_number: 2,
          procedure_code: AMBULANCE_CODES.MILEAGE.code,
          procedure_description: AMBULANCE_CODES.MILEAGE.description,
          origin_code: transport.origin_code,
          destination_code: transport.destination_code || "H",
          unit_charge: mileageRate,
          units: transport.total_mileage,
          total_charge: mileageCharge,
          service_date: claim.service_date,
          diagnosis_pointers: ["A"]
        });
      }
      const { error: linesError } = await supabase.from("claim_lines").insert(claimLines);
      if (linesError) throw linesError;
      await supabase.from("audit_logs").insert([{
        organization_id: organizationId,
        action: "create",
        resource_type: "claim",
        resource_id: claim.id,
        details: { claim_number: claimNumber, incident_id: incidentId }
      }]);
      return { success: true, claim };
    } catch (error) {
      console.error("Error generating claim:", error);
      return { success: false, error };
    }
  };
  const getClaims = async (organizationId, filters = {}) => {
    try {
      let query = supabase.from("claims").select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          incidents (
            incident_number
          ),
          payers (
            name,
            payer_type
          ),
          claim_lines (*)
        `).eq("organization_id", organizationId).order("created_at", { ascending: false });
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching claims:", error);
      return { success: false, error };
    }
  };
  const submitClaim = async (claimId, method) => {
    try {
      const { data: claim, error: claimError } = await supabase.from("claims").select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*)
        `).eq("id", claimId).single();
      if (claimError) throw claimError;
      const { error: statusError } = await supabase.from("claims").update({
        status: "submitted",
        submission_method: method,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", claimId);
      if (statusError) throw statusError;
      const { data: submission, error: submissionError } = await supabase.from("claim_submissions").insert([{
        claim_id: claimId,
        submission_method: method,
        submitted_at: (/* @__PURE__ */ new Date()).toISOString()
      }]).select().single();
      if (submissionError) throw submissionError;
      return { success: true, submission };
    } catch (error) {
      console.error("Error submitting claim:", error);
      return { success: false, error };
    }
  };
  const analyzeDenials = async (organizationId) => {
    try {
      const { data, error } = await supabase.from("denied_claims").select(`
          *,
          claims (
            claim_number,
            total_charge,
            payers (name)
          )
        `).eq("claims.organization_id", organizationId).order("denied_at", { ascending: false });
      if (error) throw error;
      const denialsByReason = data.reduce((acc, denial) => {
        const reason = denial.denial_reason_description;
        if (!acc[reason]) {
          acc[reason] = { count: 0, total_amount: 0 };
        }
        acc[reason].count++;
        acc[reason].total_amount += denial.claims.total_charge;
        return acc;
      }, {});
      return {
        success: true,
        data,
        denialsByReason,
        totalDenials: data.length,
        totalAmount: data.reduce((sum, d) => sum + d.claims.total_charge, 0)
      };
    } catch (error) {
      console.error("Error analyzing denials:", error);
      return { success: false, error };
    }
  };
  const validateMedicalNecessity = (transport) => {
    const issues = [];
    if (!transport.medical_necessity_reason || transport.medical_necessity_reason.length < 20) {
      issues.push("Medical necessity reason is too short or missing");
    }
    if (!transport.patient_acuity) {
      issues.push("Patient acuity not documented");
    }
    if (!transport.patient_condition_codes || transport.patient_condition_codes.length === 0) {
      issues.push("No condition codes documented");
    }
    if (transport.level_of_service === "ALS2" && transport.patient_acuity !== "emergent") {
      issues.push("ALS2 typically requires emergent acuity");
    }
    return {
      valid: issues.length === 0,
      issues
    };
  };
  return {
    AMBULANCE_CODES,
    determineAmbulanceCode,
    generateClaimFromIncident,
    getClaims,
    submitClaim,
    analyzeDenials,
    validateMedicalNecessity
  };
};
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useBilling();
    const claims = ref([]);
    const loading = ref(true);
    const showFilters = ref(false);
    const filters = reactive({
      status: "",
      payerType: "",
      submissionMethod: ""
    });
    const stats = reactive({
      totalClaims: 0,
      totalBilled: 0,
      totalPaid: 0,
      outstanding: 0
    });
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString();
    };
    const getStatusColor = (status) => {
      const colors = {
        draft: "bg-gray-100 text-gray-800",
        ready: "bg-blue-100 text-blue-800",
        submitted: "bg-yellow-100 text-yellow-800",
        accepted: "bg-green-100 text-green-800",
        paid: "bg-green-100 text-green-800",
        denied: "bg-red-100 text-red-800"
      };
      return colors[status] || "bg-gray-100 text-gray-800";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50 py-8" }, _attrs))}><div class="max-w-7xl mx-auto px-4"><div class="flex justify-between items-center mb-6"><div><h1 class="text-3xl font-bold text-gray-900">Billing &amp; Claims</h1><p class="text-gray-600 mt-1">CMS-compliant ambulance billing management</p></div><div class="flex gap-3"><button class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"> Filters </button></div></div>`);
      if (showFilters.value) {
        _push(`<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"><div class="grid grid-cols-4 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Status</label><select class="w-full px-3 py-2 border border-gray-300 rounded-md"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}>All Statuses</option><option value="draft"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "draft") : ssrLooseEqual(filters.status, "draft")) ? " selected" : ""}>Draft</option><option value="ready"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "ready") : ssrLooseEqual(filters.status, "ready")) ? " selected" : ""}>Ready</option><option value="submitted"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "submitted") : ssrLooseEqual(filters.status, "submitted")) ? " selected" : ""}>Submitted</option><option value="accepted"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "accepted") : ssrLooseEqual(filters.status, "accepted")) ? " selected" : ""}>Accepted</option><option value="paid"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "paid") : ssrLooseEqual(filters.status, "paid")) ? " selected" : ""}>Paid</option><option value="denied"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "denied") : ssrLooseEqual(filters.status, "denied")) ? " selected" : ""}>Denied</option></select></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Payer Type</label><select class="w-full px-3 py-2 border border-gray-300 rounded-md"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "") : ssrLooseEqual(filters.payerType, "")) ? " selected" : ""}>All Payers</option><option value="medicare"${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "medicare") : ssrLooseEqual(filters.payerType, "medicare")) ? " selected" : ""}>Medicare</option><option value="medicaid"${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "medicaid") : ssrLooseEqual(filters.payerType, "medicaid")) ? " selected" : ""}>Medicaid</option><option value="commercial"${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "commercial") : ssrLooseEqual(filters.payerType, "commercial")) ? " selected" : ""}>Commercial</option><option value="workers_comp"${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "workers_comp") : ssrLooseEqual(filters.payerType, "workers_comp")) ? " selected" : ""}>Workers Comp</option><option value="self_pay"${ssrIncludeBooleanAttr(Array.isArray(filters.payerType) ? ssrLooseContain(filters.payerType, "self_pay") : ssrLooseEqual(filters.payerType, "self_pay")) ? " selected" : ""}>Self Pay</option></select></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Submission Method</label><select class="w-full px-3 py-2 border border-gray-300 rounded-md"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.submissionMethod) ? ssrLooseContain(filters.submissionMethod, "") : ssrLooseEqual(filters.submissionMethod, "")) ? " selected" : ""}>All Methods</option><option value="office_ally_837p"${ssrIncludeBooleanAttr(Array.isArray(filters.submissionMethod) ? ssrLooseContain(filters.submissionMethod, "office_ally_837p") : ssrLooseEqual(filters.submissionMethod, "office_ally_837p")) ? " selected" : ""}>Electronic (837P)</option><option value="lob_paper"${ssrIncludeBooleanAttr(Array.isArray(filters.submissionMethod) ? ssrLooseContain(filters.submissionMethod, "lob_paper") : ssrLooseEqual(filters.submissionMethod, "lob_paper")) ? " selected" : ""}>Paper (Lob)</option></select></div><div class="flex items-end"><button class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"> Apply Filters </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid grid-cols-4 gap-6 mb-6"><div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-600">Total Claims</p><p class="text-2xl font-bold text-gray-900 mt-1">${ssrInterpolate(stats.totalClaims)}</p></div><div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><span class="text-2xl">📄</span></div></div></div><div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-600">Total Billed</p><p class="text-2xl font-bold text-gray-900 mt-1">$${ssrInterpolate(stats.totalBilled.toLocaleString())}</p></div><div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><span class="text-2xl">💰</span></div></div></div><div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-600">Total Paid</p><p class="text-2xl font-bold text-green-600 mt-1">$${ssrInterpolate(stats.totalPaid.toLocaleString())}</p></div><div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><span class="text-2xl">✅</span></div></div></div><div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-600">Outstanding</p><p class="text-2xl font-bold text-orange-600 mt-1">$${ssrInterpolate(stats.outstanding.toLocaleString())}</p></div><div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><span class="text-2xl">⏳</span></div></div></div></div><div class="bg-white rounded-lg shadow-sm border border-gray-200"><div class="p-6 border-b border-gray-200"><h2 class="text-lg font-semibold text-gray-900">Claims List</h2></div>`);
      if (loading.value) {
        _push(`<div class="p-12 text-center text-gray-500"> Loading claims... </div>`);
      } else if (claims.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500"> No claims found </div>`);
      } else {
        _push(`<div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50 border-b border-gray-200"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Claim # </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Patient </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Service Date </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Payer </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Amount </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Status </th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Actions </th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
        ssrRenderList(claims.value, (claim) => {
          _push(`<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ssrInterpolate(claim.claim_number)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ssrInterpolate(claim.patients.last_name)}, ${ssrInterpolate(claim.patients.first_name)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${ssrInterpolate(formatDate(claim.service_date))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${ssrInterpolate(claim.payers?.name || "N/A")}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> $${ssrInterpolate(claim.total_charge.toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap"><span class="${ssrRenderClass([
            "px-2 py-1 text-xs font-semibold rounded-full",
            getStatusColor(claim.status)
          ])}">${ssrInterpolate(claim.status)}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm">`);
          if (claim.status === "ready" || claim.status === "draft") {
            _push(`<button class="text-blue-600 hover:text-blue-900 font-medium mr-3"> Submit </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="text-gray-600 hover:text-gray-900 font-medium"> View </button></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/billing/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-oGu0TUqi.js.map
