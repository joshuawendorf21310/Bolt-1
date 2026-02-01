import { defineComponent, ref, computed, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderComponent } from "vue/server-renderer";
import { u as useFireOperations } from "./useFireOperations-DllU4M5I.js";
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
  __name: "FireDashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      incidents,
      apparatus,
      personnel,
      stations
    } = useFireOperations();
    const selectedIncident = ref(null);
    const filterStatus = ref("all");
    const severityLabels = {
      1: "Minor",
      2: "Moderate",
      3: "Major",
      4: "Critical",
      5: "Catastrophic"
    };
    const activeIncidents = computed(() => {
      return incidents.value?.filter((i) => i.status !== "cleared").length || 0;
    });
    const filteredIncidents = computed(() => {
      if (filterStatus.value === "all") return incidents.value || [];
      return incidents.value?.filter((i) => i.status === filterStatus.value) || [];
    });
    const apparatusStats = computed(() => {
      const stats = {
        available: 0,
        in_service: 0,
        maintenance: 0,
        out_of_service: 0
      };
      apparatus.value?.forEach((app) => {
        if (app.current_status in stats) {
          stats[app.current_status]++;
        }
      });
      return stats;
    });
    const onDutyPersonnel = computed(() => {
      return personnel.value?.filter((p) => p.is_active).slice(0, 8) || [];
    });
    const stationStatuses = computed(() => {
      return stations.value || [];
    });
    function formatIncidentType(type) {
      return type?.replace(/_/g, " ").toUpperCase() || "UNKNOWN";
    }
    function formatTime(time) {
      if (!time) return "";
      return new Date(time).toLocaleTimeString();
    }
    function getIncidentCommander(id) {
      if (!id) return "Unassigned";
      const person = personnel.value?.find((p) => p.id === id);
      return person ? `${person.first_name} ${person.last_name}` : "Unknown";
    }
    function calculateResponseTime(incident) {
      if (!incident.dispatch_time || !incident.arrival_time) return "";
      const diff = new Date(incident.arrival_time) - new Date(incident.dispatch_time);
      const minutes = Math.floor(diff / 6e4);
      return `${minutes} min`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fire-dashboard" }, _attrs))} data-v-d3a9a46d><header class="dashboard-header" data-v-d3a9a46d><div class="header-content" data-v-d3a9a46d><h1 data-v-d3a9a46d>Fire Operations Command</h1><p class="subtitle" data-v-d3a9a46d>Real-time incident management &amp; resource coordination</p></div><div class="header-actions" data-v-d3a9a46d><button class="btn-new-incident" data-v-d3a9a46d><span class="icon" data-v-d3a9a46d>+</span> New Incident </button>`);
      if (activeIncidents.value > 0) {
        _push(`<button class="btn-alert" data-v-d3a9a46d>${ssrInterpolate(activeIncidents.value)} Active </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></header><div class="dashboard-grid" data-v-d3a9a46d><section class="panel incidents-panel" data-v-d3a9a46d><div class="panel-header" data-v-d3a9a46d><h2 data-v-d3a9a46d>Live Incidents</h2><div class="filter-tabs" data-v-d3a9a46d><button class="${ssrRenderClass(["tab", { active: filterStatus.value === "all" }])}" data-v-d3a9a46d> All </button><button class="${ssrRenderClass(["tab", { active: filterStatus.value === "dispatched" }])}" data-v-d3a9a46d> Dispatching </button><button class="${ssrRenderClass(["tab", { active: filterStatus.value === "on_scene" }])}" data-v-d3a9a46d> On Scene </button></div></div><div class="incidents-list" data-v-d3a9a46d><!--[-->`);
      ssrRenderList(filteredIncidents.value, (incident) => {
        _push(`<div class="${ssrRenderClass([`severity-${incident.severity_level}`, "incident-card"])}" data-v-d3a9a46d><div class="incident-header" data-v-d3a9a46d><span class="dispatch-num" data-v-d3a9a46d>${ssrInterpolate(incident.dispatch_number)}</span><span class="incident-type" data-v-d3a9a46d>${ssrInterpolate(formatIncidentType(incident.incident_type))}</span></div><div class="incident-address" data-v-d3a9a46d>${ssrInterpolate(incident.address)}</div><div class="incident-meta" data-v-d3a9a46d><span class="${ssrRenderClass([incident.status, "status"])}" data-v-d3a9a46d>${ssrInterpolate(incident.status)}</span><span class="time" data-v-d3a9a46d>${ssrInterpolate(formatTime(incident.dispatch_time))}</span></div><div class="incident-stats" data-v-d3a9a46d><span class="stat" data-v-d3a9a46d>Units: ${ssrInterpolate(incident.units_dispatched || 0)}</span>`);
        if (incident.injuries > 0) {
          _push(`<span class="stat" data-v-d3a9a46d>Injuries: ${ssrInterpolate(incident.injuries)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]-->`);
      if (filteredIncidents.value.length === 0) {
        _push(`<div class="empty-state" data-v-d3a9a46d><p data-v-d3a9a46d>No incidents ${ssrInterpolate(filterStatus.value !== "all" ? "with status: " + filterStatus.value : "")}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></section><section class="panel details-panel" data-v-d3a9a46d>`);
      if (selectedIncident.value) {
        _push(`<div class="incident-details" data-v-d3a9a46d><div class="details-header" data-v-d3a9a46d><h2 data-v-d3a9a46d>${ssrInterpolate(selectedIncident.value.dispatch_number)}</h2><button class="btn-close" data-v-d3a9a46d>×</button></div><div class="details-content" data-v-d3a9a46d><div class="detail-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Incident Information</h3><div class="detail-row" data-v-d3a9a46d><label data-v-d3a9a46d>Type:</label><span data-v-d3a9a46d>${ssrInterpolate(formatIncidentType(selectedIncident.value.incident_type))}</span></div><div class="detail-row" data-v-d3a9a46d><label data-v-d3a9a46d>Address:</label><span data-v-d3a9a46d>${ssrInterpolate(selectedIncident.value.address)}</span></div><div class="detail-row" data-v-d3a9a46d><label data-v-d3a9a46d>Severity:</label><span class="${ssrRenderClass([`level-${selectedIncident.value.severity_level}`, "severity-badge"])}" data-v-d3a9a46d>${ssrInterpolate(severityLabels[selectedIncident.value.severity_level] || "Unknown")}</span></div><div class="detail-row" data-v-d3a9a46d><label data-v-d3a9a46d>Incident Commander:</label><span data-v-d3a9a46d>${ssrInterpolate(getIncidentCommander(selectedIncident.value.incident_commander))}</span></div></div><div class="detail-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Response Status</h3><div class="response-timeline" data-v-d3a9a46d>`);
        if (selectedIncident.value.dispatch_time) {
          _push(`<div class="timeline-item" data-v-d3a9a46d><span class="time-label" data-v-d3a9a46d>Dispatched</span><span class="time-value" data-v-d3a9a46d>${ssrInterpolate(formatTime(selectedIncident.value.dispatch_time))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (selectedIncident.value.arrival_time) {
          _push(`<div class="timeline-item" data-v-d3a9a46d><span class="time-label" data-v-d3a9a46d>Arrived</span><span class="time-value" data-v-d3a9a46d>${ssrInterpolate(formatTime(selectedIncident.value.arrival_time))}</span><span class="response-time" data-v-d3a9a46d>${ssrInterpolate(calculateResponseTime(selectedIncident.value))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (selectedIncident.value.clearance_time) {
          _push(`<div class="timeline-item" data-v-d3a9a46d><span class="time-label" data-v-d3a9a46d>Cleared</span><span class="time-value" data-v-d3a9a46d>${ssrInterpolate(formatTime(selectedIncident.value.clearance_time))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="detail-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Assigned Units</h3>`);
        if (selectedIncident.value.units && selectedIncident.value.units.length > 0) {
          _push(`<div class="units-list" data-v-d3a9a46d><!--[-->`);
          ssrRenderList(selectedIncident.value.units, (unit) => {
            _push(`<div class="unit-item" data-v-d3a9a46d><span class="unit-number" data-v-d3a9a46d>${ssrInterpolate(unit.apparatus_name)}</span><span class="${ssrRenderClass([unit.status, "unit-status"])}" data-v-d3a9a46d>${ssrInterpolate(unit.status)}</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="empty-units" data-v-d3a9a46d>No units assigned</div>`);
        }
        _push(`</div><div class="detail-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Actions</h3><div class="action-buttons" data-v-d3a9a46d><button class="btn-secondary" data-v-d3a9a46d>Assign Units</button><button class="btn-secondary" data-v-d3a9a46d>Update Status</button><button class="btn-secondary" data-v-d3a9a46d>Add Notes</button>`);
        if (selectedIncident.value.status !== "cleared") {
          _push(`<button class="btn-danger" data-v-d3a9a46d>Close Incident</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div>`);
      } else {
        _push(`<div class="empty-panel" data-v-d3a9a46d><p data-v-d3a9a46d>Select an incident to view details</p></div>`);
      }
      _push(`</section><section class="panel resources-panel" data-v-d3a9a46d><div class="panel-header" data-v-d3a9a46d><h2 data-v-d3a9a46d>Resources</h2><button class="btn-refresh" data-v-d3a9a46d>↻</button></div><div class="resource-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Apparatus Status</h3><div class="status-grid" data-v-d3a9a46d><div class="status-card available" data-v-d3a9a46d><span class="count" data-v-d3a9a46d>${ssrInterpolate(apparatusStats.value.available)}</span><span class="label" data-v-d3a9a46d>Available</span></div><div class="status-card in-service" data-v-d3a9a46d><span class="count" data-v-d3a9a46d>${ssrInterpolate(apparatusStats.value.in_service)}</span><span class="label" data-v-d3a9a46d>In Service</span></div><div class="status-card maintenance" data-v-d3a9a46d><span class="count" data-v-d3a9a46d>${ssrInterpolate(apparatusStats.value.maintenance)}</span><span class="label" data-v-d3a9a46d>Maintenance</span></div><div class="status-card out-of-service" data-v-d3a9a46d><span class="count" data-v-d3a9a46d>${ssrInterpolate(apparatusStats.value.out_of_service)}</span><span class="label" data-v-d3a9a46d>Out of Service</span></div></div></div><div class="resource-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Personnel On Duty</h3><div class="personnel-list" data-v-d3a9a46d><!--[-->`);
      ssrRenderList(onDutyPersonnel.value, (person) => {
        _push(`<div class="personnel-item" data-v-d3a9a46d><span class="name" data-v-d3a9a46d>${ssrInterpolate(person.first_name)} ${ssrInterpolate(person.last_name)}</span><span class="rank" data-v-d3a9a46d>${ssrInterpolate(person.rank)}</span>`);
        if (person.is_incident_commander) {
          _push(`<span class="badge" data-v-d3a9a46d>IC</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div><div class="resource-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>Station Status</h3><div class="stations-list" data-v-d3a9a46d><!--[-->`);
      ssrRenderList(stationStatuses.value, (station) => {
        _push(`<div class="station-item" data-v-d3a9a46d><span class="station-name" data-v-d3a9a46d>${ssrInterpolate(station.name)}</span><span class="${ssrRenderClass([{ active: station.is_active }, "station-status"])}" data-v-d3a9a46d>${ssrInterpolate(station.is_active ? "Active" : "Inactive")}</span></div>`);
      });
      _push(`<!--]--></div></div><div class="resource-section" data-v-d3a9a46d><h3 data-v-d3a9a46d>System Health</h3><div class="health-check" data-v-d3a9a46d><div class="health-item" data-v-d3a9a46d><span data-v-d3a9a46d>Database</span><span class="indicator online" data-v-d3a9a46d>●</span></div><div class="health-item" data-v-d3a9a46d><span data-v-d3a9a46d>Dispatch System</span><span class="indicator online" data-v-d3a9a46d>●</span></div><div class="health-item" data-v-d3a9a46d><span data-v-d3a9a46d>GPS Tracking</span><span class="indicator online" data-v-d3a9a46d>●</span></div></div></div></section></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FireDashboard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-d3a9a46d"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FireDashboard = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fire-page" }, _attrs))} data-v-6845105d>`);
      _push(ssrRenderComponent(_component_FireDashboard, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/fire/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6845105d"]]);
export {
  index as default
};
//# sourceMappingURL=index-DpIOUSWu.js.map
