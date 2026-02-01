import { defineComponent, mergeProps, ref, computed, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { u as useFireOperations } from './useFireOperations-DllU4M5I.mjs';
import { _ as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';
import '@supabase/supabase-js';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "FireCertificationTracker",
  __ssrInlineRender: true,
  setup(__props) {
    const { personnel: personnel2 } = useFireOperations();
    const searchQuery = ref("");
    const showAddTraining = ref(false);
    const trainingRecords = ref([]);
    const trainingForm = ref({
      personnel_id: "",
      training_name: "",
      training_date: "",
      hours_completed: null,
      trainer: ""
    });
    const filteredPersonnel = computed(() => {
      if (!searchQuery.value) return personnel2.value || [];
      const query = searchQuery.value.toLowerCase();
      return (personnel2.value || []).filter(
        (p) => {
          var _a;
          return p.first_name.toLowerCase().includes(query) || p.last_name.toLowerCase().includes(query) || ((_a = p.badge_number) == null ? void 0 : _a.toLowerCase().includes(query));
        }
      );
    });
    const expiringCertifications = computed(() => {
      const thirtyDaysFromNow = /* @__PURE__ */ new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiring = [](personnel2.value || []).forEach((p) => {
        var _a;
        (_a = p.fire_certifications) == null ? void 0 : _a.forEach((cert) => {
          if (cert.is_current && cert.expiration_date) {
            const expDate = new Date(cert.expiration_date);
            if (expDate <= thirtyDaysFromNow) {
              expiring.push({
                id: cert.id,
                personnel_name: `${p.first_name} ${p.last_name}`,
                certification_name: cert.certification_name,
                expiration_date: cert.expiration_date
              });
            }
          }
        });
      });
      return expiring;
    });
    function formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString();
    }
    function isExpiringSoon(date) {
      if (!date) return false;
      const thirtyDaysFromNow = /* @__PURE__ */ new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expDate = new Date(date);
      return expDate <= thirtyDaysFromNow && expDate > /* @__PURE__ */ new Date();
    }
    function isExpired(date) {
      if (!date) return false;
      return new Date(date) < /* @__PURE__ */ new Date();
    }
    function getTrainingRecords(personnelId) {
      return trainingRecords.value.filter((t) => t.personnel_id === personnelId);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "cert-tracker" }, _attrs))} data-v-b1c98ad0><header class="tracker-header" data-v-b1c98ad0><h2 data-v-b1c98ad0>Personnel Certifications &amp; Training</h2><div class="header-actions" data-v-b1c98ad0><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Search personnel..." class="search-input" data-v-b1c98ad0><button class="btn-add" data-v-b1c98ad0>+ Add Training</button></div></header><div class="tracker-content" data-v-b1c98ad0>`);
      if (expiringCertifications.value.length > 0) {
        _push(`<div class="alert-section expiring" data-v-b1c98ad0><div class="alert-header" data-v-b1c98ad0><span class="icon" data-v-b1c98ad0>\u26A0</span><span class="title" data-v-b1c98ad0>${ssrInterpolate(expiringCertifications.value.length)} Certifications Expiring Soon</span></div><div class="expiring-list" data-v-b1c98ad0><!--[-->`);
        ssrRenderList(expiringCertifications.value, (cert) => {
          _push(`<div class="expiring-item" data-v-b1c98ad0><span class="person-name" data-v-b1c98ad0>${ssrInterpolate(cert.personnel_name)}</span><span class="cert-name" data-v-b1c98ad0>${ssrInterpolate(cert.certification_name)}</span><span class="expiry-date" data-v-b1c98ad0>Expires: ${ssrInterpolate(formatDate(cert.expiration_date))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="personnel-grid" data-v-b1c98ad0><!--[-->`);
      ssrRenderList(filteredPersonnel.value, (person) => {
        var _a, _b;
        _push(`<div class="personnel-card" data-v-b1c98ad0><div class="card-header" data-v-b1c98ad0><h3 data-v-b1c98ad0>${ssrInterpolate(person.first_name)} ${ssrInterpolate(person.last_name)}</h3><span class="rank" data-v-b1c98ad0>${ssrInterpolate(person.rank)}</span></div><div class="card-info" data-v-b1c98ad0><div class="info-row" data-v-b1c98ad0><span class="label" data-v-b1c98ad0>Badge:</span><span class="value" data-v-b1c98ad0>${ssrInterpolate(person.badge_number)}</span></div><div class="info-row" data-v-b1c98ad0><span class="label" data-v-b1c98ad0>Hired:</span><span class="value" data-v-b1c98ad0>${ssrInterpolate(formatDate(person.hire_date))}</span></div>`);
        if ((_a = person.specializations) == null ? void 0 : _a.length) {
          _push(`<div class="specializations" data-v-b1c98ad0><span class="label" data-v-b1c98ad0>Specializations:</span><div class="spec-tags" data-v-b1c98ad0><!--[-->`);
          ssrRenderList(person.specializations, (spec) => {
            _push(`<span class="spec-tag" data-v-b1c98ad0>${ssrInterpolate(spec)}</span>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="certifications-section" data-v-b1c98ad0><h4 data-v-b1c98ad0>Certifications</h4>`);
        if (((_b = person.fire_certifications) == null ? void 0 : _b.length) > 0) {
          _push(`<div class="certs-list" data-v-b1c98ad0><!--[-->`);
          ssrRenderList(person.fire_certifications, (cert) => {
            _push(`<div class="${ssrRenderClass([{ expiring: isExpiringSoon(cert.expiration_date), expired: isExpired(cert.expiration_date) }, "cert-item"])}" data-v-b1c98ad0><span class="cert-name" data-v-b1c98ad0>${ssrInterpolate(cert.certification_name)}</span><span class="${ssrRenderClass([{ current: cert.is_current, expired: !cert.is_current }, "cert-status"])}" data-v-b1c98ad0>${ssrInterpolate(cert.is_current ? "Current" : "Expired")}</span>`);
            if (cert.expiration_date) {
              _push(`<span class="cert-date" data-v-b1c98ad0>${ssrInterpolate(formatDate(cert.expiration_date))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="empty-list" data-v-b1c98ad0> No certifications recorded </div>`);
        }
        _push(`<button class="btn-mini" data-v-b1c98ad0>+ Add Cert</button></div><div class="training-section" data-v-b1c98ad0><h4 data-v-b1c98ad0>Recent Training</h4>`);
        if (getTrainingRecords(person.id).length > 0) {
          _push(`<div class="training-list" data-v-b1c98ad0><!--[-->`);
          ssrRenderList(getTrainingRecords(person.id).slice(0, 3), (training) => {
            _push(`<div class="training-item" data-v-b1c98ad0><span class="training-name" data-v-b1c98ad0>${ssrInterpolate(training.training_name)}</span><span class="training-date" data-v-b1c98ad0>${ssrInterpolate(formatDate(training.training_date))}</span><span class="training-hours" data-v-b1c98ad0>${ssrInterpolate(training.hours_completed)}h</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="empty-list" data-v-b1c98ad0> No training recorded </div>`);
        }
        _push(`<button class="btn-mini" data-v-b1c98ad0>+ Add Training</button></div><div class="card-actions" data-v-b1c98ad0><button class="btn-action" data-v-b1c98ad0>Edit Profile</button><button class="btn-action" data-v-b1c98ad0>Download Certs</button></div></div>`);
      });
      _push(`<!--]--></div></div>`);
      if (showAddTraining.value) {
        _push(`<div class="modal" data-v-b1c98ad0><div class="modal-content" data-v-b1c98ad0><div class="modal-header" data-v-b1c98ad0><h3 data-v-b1c98ad0>Add Training Record</h3><button class="btn-close" data-v-b1c98ad0>\xD7</button></div><form class="modal-form" data-v-b1c98ad0><div class="form-group" data-v-b1c98ad0><label data-v-b1c98ad0>Personnel</label><select required data-v-b1c98ad0><option value="" data-v-b1c98ad0${ssrIncludeBooleanAttr(Array.isArray(trainingForm.value.personnel_id) ? ssrLooseContain(trainingForm.value.personnel_id, "") : ssrLooseEqual(trainingForm.value.personnel_id, "")) ? " selected" : ""}>Select personnel...</option><!--[-->`);
        ssrRenderList(unref(personnel2), (p) => {
          _push(`<option${ssrRenderAttr("value", p.id)} data-v-b1c98ad0${ssrIncludeBooleanAttr(Array.isArray(trainingForm.value.personnel_id) ? ssrLooseContain(trainingForm.value.personnel_id, p.id) : ssrLooseEqual(trainingForm.value.personnel_id, p.id)) ? " selected" : ""}>${ssrInterpolate(p.first_name)} ${ssrInterpolate(p.last_name)}</option>`);
        });
        _push(`<!--]--></select></div><div class="form-group" data-v-b1c98ad0><label data-v-b1c98ad0>Training Name</label><input${ssrRenderAttr("value", trainingForm.value.training_name)} type="text" required data-v-b1c98ad0></div><div class="form-group" data-v-b1c98ad0><label data-v-b1c98ad0>Training Date</label><input${ssrRenderAttr("value", trainingForm.value.training_date)} type="date" required data-v-b1c98ad0></div><div class="form-group" data-v-b1c98ad0><label data-v-b1c98ad0>Hours Completed</label><input${ssrRenderAttr("value", trainingForm.value.hours_completed)} type="number" step="0.5" data-v-b1c98ad0></div><div class="form-group" data-v-b1c98ad0><label data-v-b1c98ad0>Trainer</label><input${ssrRenderAttr("value", trainingForm.value.trainer)} type="text" data-v-b1c98ad0></div><div class="form-actions" data-v-b1c98ad0><button type="submit" class="btn-primary" data-v-b1c98ad0>Save Training</button><button type="button" class="btn-secondary" data-v-b1c98ad0>Cancel</button></div></form></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FireCertificationTracker.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-b1c98ad0"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "personnel",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FireCertificationTracker = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "personnel-page" }, _attrs))} data-v-af9ccd96>`);
      _push(ssrRenderComponent(_component_FireCertificationTracker, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/fire/personnel.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const personnel = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-af9ccd96"]]);

export { personnel as default };
//# sourceMappingURL=personnel-D00a42fl.mjs.map
