import { defineComponent, mergeProps, ref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
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
  __name: "FireAnalyticsDashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const timeRange = ref("30d");
    const lastUpdated = ref("");
    const metrics = ref({
      totalIncidents: 247,
      avgResponseTime: "4:32 min",
      dispatchAccuracy: "97.3%",
      personnelAvailable: 42,
      certExpiring: 8
    });
    const incidentTypes = ref([
      { name: "Structure Fire", count: 45, percentage: 18 },
      { name: "Vehicle Fire", count: 28, percentage: 11 },
      { name: "EMS Call", count: 98, percentage: 40 },
      { name: "Rescue", count: 38, percentage: 15 },
      { name: "False Alarm", count: 28, percentage: 11 },
      { name: "Hazmat", count: 10, percentage: 4 }
    ]);
    const severityLevels = ref([
      { level: 1, label: "Minor", count: 89, percent: 36 },
      { level: 2, label: "Moderate", count: 76, percent: 31 },
      { level: 3, label: "Major", count: 54, percent: 22 },
      { level: 4, label: "Critical", count: 22, percent: 9 },
      { level: 5, label: "Catastrophic", count: 6, percent: 2 }
    ]);
    const stationPerformance = ref([
      { id: "1", name: "Station 1 (Downtown)", calls: 67, avgResponse: "3:45 min", safetyScore: 98 },
      { id: "2", name: "Station 2 (North)", calls: 54, avgResponse: "4:12 min", safetyScore: 96 },
      { id: "3", name: "Station 3 (West)", calls: 48, avgResponse: "5:28 min", safetyScore: 94 },
      { id: "4", name: "Station 4 (South)", calls: 61, avgResponse: "3:58 min", safetyScore: 97 },
      { id: "5", name: "Station 5 (East)", calls: 17, avgResponse: "4:05 min", safetyScore: 99 }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "analytics-dashboard" }, _attrs))} data-v-586681f6><header class="analytics-header" data-v-586681f6><h2 data-v-586681f6>Incident Analytics &amp; Performance</h2><div class="time-filters" data-v-586681f6><button class="${ssrRenderClass(["filter-btn", { active: timeRange.value === "7d" }])}" data-v-586681f6> 7 Days </button><button class="${ssrRenderClass(["filter-btn", { active: timeRange.value === "30d" }])}" data-v-586681f6> 30 Days </button><button class="${ssrRenderClass(["filter-btn", { active: timeRange.value === "90d" }])}" data-v-586681f6> 90 Days </button><button class="${ssrRenderClass(["filter-btn", { active: timeRange.value === "1y" }])}" data-v-586681f6> 1 Year </button></div></header><div class="analytics-grid" data-v-586681f6><section class="kpi-section" data-v-586681f6><div class="kpi-card" data-v-586681f6><span class="kpi-label" data-v-586681f6>Total Incidents</span><span class="kpi-value" data-v-586681f6>${ssrInterpolate(metrics.value.totalIncidents)}</span><span class="kpi-change positive" data-v-586681f6>+12% vs last period</span></div><div class="kpi-card" data-v-586681f6><span class="kpi-label" data-v-586681f6>Avg Response Time</span><span class="kpi-value" data-v-586681f6>${ssrInterpolate(metrics.value.avgResponseTime)}</span><span class="kpi-change positive" data-v-586681f6>\u2193 2:15 min improvement</span></div><div class="kpi-card" data-v-586681f6><span class="kpi-label" data-v-586681f6>Dispatch Accuracy</span><span class="kpi-value" data-v-586681f6>${ssrInterpolate(metrics.value.dispatchAccuracy)}</span><span class="kpi-change positive" data-v-586681f6>+3.2% accuracy</span></div><div class="kpi-card" data-v-586681f6><span class="kpi-label" data-v-586681f6>Personnel Available</span><span class="kpi-value" data-v-586681f6>${ssrInterpolate(metrics.value.personnelAvailable)}</span><span class="kpi-change" data-v-586681f6>${ssrInterpolate(metrics.value.certExpiring)} certs expiring</span></div></section><section class="chart-section incident-types" data-v-586681f6><h3 data-v-586681f6>Incidents by Type</h3><div class="chart-container" data-v-586681f6><div class="chart-bar-group" data-v-586681f6><!--[-->`);
      ssrRenderList(incidentTypes.value, (type) => {
        _push(`<div class="chart-bar" data-v-586681f6><div class="bar-label" data-v-586681f6>${ssrInterpolate(type.name)}</div><div class="bar-container" data-v-586681f6><div class="bar-fill" style="${ssrRenderStyle({ width: type.percentage + "%" })}" data-v-586681f6></div></div><div class="bar-value" data-v-586681f6>${ssrInterpolate(type.count)} (${ssrInterpolate(type.percentage)}%)</div></div>`);
      });
      _push(`<!--]--></div></div></section><section class="chart-section response-times" data-v-586681f6><h3 data-v-586681f6>Response Time Trend</h3><div class="trend-chart" data-v-586681f6><svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" data-v-586681f6><defs data-v-586681f6><linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%" data-v-586681f6><stop offset="0%" style="${ssrRenderStyle({ "stop-color": "#3b82f6", "stop-opacity": "0.3" })}" data-v-586681f6></stop><stop offset="100%" style="${ssrRenderStyle({ "stop-color": "#3b82f6", "stop-opacity": "0" })}" data-v-586681f6></stop></linearGradient></defs><polyline points="10,100 50,85 90,95 130,70 170,60 210,75 250,50 290,40 330,55 370,35" fill="none" stroke="#3b82f6" stroke-width="2" data-v-586681f6></polyline><polygon points="10,100 50,85 90,95 130,70 170,60 210,75 250,50 290,40 330,55 370,35 370,150 10,150" fill="url(#trendGradient)" data-v-586681f6></polygon></svg><div class="trend-labels" data-v-586681f6><span data-v-586681f6>6:45</span><span data-v-586681f6>5:30</span><span data-v-586681f6>4:15</span></div></div></section><section class="chart-section severity" data-v-586681f6><h3 data-v-586681f6>Incidents by Severity</h3><div class="severity-grid" data-v-586681f6><!--[-->`);
      ssrRenderList(severityLevels.value, (level) => {
        _push(`<div class="severity-item" data-v-586681f6><div class="${ssrRenderClass([`level-${level.level}`, "severity-color"])}" data-v-586681f6></div><span class="severity-label" data-v-586681f6>${ssrInterpolate(level.label)}</span><span class="severity-count" data-v-586681f6>${ssrInterpolate(level.count)}</span><span class="severity-percent" data-v-586681f6>${ssrInterpolate(level.percent)}%</span></div>`);
      });
      _push(`<!--]--></div></section><section class="chart-section stations" data-v-586681f6><h3 data-v-586681f6>Station Performance</h3><div class="stations-table" data-v-586681f6><div class="table-header" data-v-586681f6><span class="station-col" data-v-586681f6>Station</span><span class="calls-col" data-v-586681f6>Calls</span><span class="avg-response-col" data-v-586681f6>Avg Response</span><span class="safety-col" data-v-586681f6>Safety Score</span></div><!--[-->`);
      ssrRenderList(stationPerformance.value, (station) => {
        _push(`<div class="table-row" data-v-586681f6><span class="station-col" data-v-586681f6>${ssrInterpolate(station.name)}</span><span class="calls-col" data-v-586681f6>${ssrInterpolate(station.calls)}</span><span class="avg-response-col" data-v-586681f6>${ssrInterpolate(station.avgResponse)}</span><span class="safety-col" data-v-586681f6>${ssrInterpolate(station.safetyScore)}/100</span></div>`);
      });
      _push(`<!--]--></div></section><section class="chart-section personnel" data-v-586681f6><h3 data-v-586681f6>Personnel Utilization</h3><div class="utilization-metrics" data-v-586681f6><div class="util-item" data-v-586681f6><span class="util-label" data-v-586681f6>Average Shift Hours</span><div class="util-bar" data-v-586681f6><div class="util-fill" style="${ssrRenderStyle({ "width": "72%" })}" data-v-586681f6></div></div><span class="util-value" data-v-586681f6>34.2 / 48 hrs</span></div><div class="util-item" data-v-586681f6><span class="util-label" data-v-586681f6>Overtime Hours</span><div class="util-bar" data-v-586681f6><div class="util-fill" style="${ssrRenderStyle({ "width": "45%" })}" data-v-586681f6></div></div><span class="util-value" data-v-586681f6>1,250 hrs total</span></div><div class="util-item" data-v-586681f6><span class="util-label" data-v-586681f6>Training Compliance</span><div class="util-bar" data-v-586681f6><div class="util-fill" style="${ssrRenderStyle({ "width": "92%" })}" data-v-586681f6></div></div><span class="util-value" data-v-586681f6>92% compliant</span></div></div></section><section class="chart-section insights" data-v-586681f6><h3 data-v-586681f6>Key Insights &amp; Recommendations</h3><div class="insights-list" data-v-586681f6><div class="insight-item positive" data-v-586681f6><span class="icon" data-v-586681f6>\u2713</span><span class="text" data-v-586681f6>Response times improved 15% this quarter - excellent progress!</span></div><div class="insight-item warning" data-v-586681f6><span class="icon" data-v-586681f6>!</span><span class="text" data-v-586681f6>Station 3 response time above target - consider resource review</span></div><div class="insight-item info" data-v-586681f6><span class="icon" data-v-586681f6>i</span><span class="text" data-v-586681f6>8 personnel certifications expiring in next 30 days</span></div><div class="insight-item positive" data-v-586681f6><span class="icon" data-v-586681f6>\u2713</span><span class="text" data-v-586681f6>Dispatch accuracy at 97.3% - best performance in history</span></div></div></section></div><footer class="analytics-footer" data-v-586681f6><button class="btn-export" data-v-586681f6>\u{1F4CA} Export Full Report</button><button class="btn-export" data-v-586681f6>\u{1F4E4} Share Report</button><span class="updated" data-v-586681f6>Last updated: ${ssrInterpolate(lastUpdated.value)}</span></footer></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FireAnalyticsDashboard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-586681f6"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "operations",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FireAnalyticsDashboard = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "operations-page" }, _attrs))} data-v-ac104862>`);
      _push(ssrRenderComponent(_component_FireAnalyticsDashboard, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/fire/operations.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const operations = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ac104862"]]);

export { operations as default };
//# sourceMappingURL=operations-DUDzApbM.mjs.map
