import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderAttr } from 'vue/server-renderer';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "analytics",
  __ssrInlineRender: true,
  setup(__props) {
    const dateRange = ref("30");
    const shiftsChartView = ref("daily");
    const analytics2 = ref({
      totalShifts: 432,
      totalHours: 3456,
      overtimeHours: 156,
      estimatedCost: 172800,
      coverageRate: 96,
      totalTrades: 28,
      approvedTrades: 24,
      timeOffRequests: 45,
      timeOffHours: 360,
      fatigueViolations: 3,
      uniqueStaff: 48
    });
    const shiftsData = ref([42, 45, 38, 48, 52, 44, 41, 46, 50, 43, 39, 47, 49, 44]);
    const certificationData = ref([
      { name: "Paramedic", count: 18, percentage: 37.5, color: "#ff6b00" },
      { name: "EMT-Advanced", count: 15, percentage: 31.25, color: "#3b82f6" },
      { name: "EMT-Basic", count: 12, percentage: 25, color: "#10b981" },
      { name: "Other", count: 3, percentage: 6.25, color: "#8b5cf6" }
    ]);
    const stationData = ref([
      { name: "Station 1", count: 156, percentage: 36, color: "#ff6b00" },
      { name: "Station 2", count: 142, percentage: 33, color: "#3b82f6" },
      { name: "Station 3", count: 98, percentage: 23, color: "#10b981" },
      { name: "Station 4", count: 36, percentage: 8, color: "#f59e0b" }
    ]);
    const shiftTypes = ref([
      { name: "Regular", count: 324, percentage: 75, color: "#3b82f6" },
      { name: "Overtime", count: 72, percentage: 17, color: "#f59e0b" },
      { name: "Holiday", count: 24, percentage: 5, color: "#10b981" },
      { name: "Training", count: 12, percentage: 3, color: "#8b5cf6" }
    ]);
    const workloadData = ref([
      { id: 1, name: "John Smith", certification: "Paramedic", hours: 168, shifts: 21, overtime: 8 },
      { id: 2, name: "Sarah Johnson", certification: "EMT-Advanced", hours: 152, shifts: 19, overtime: 0 },
      { id: 3, name: "Michael Brown", certification: "Paramedic", hours: 176, shifts: 22, overtime: 16 },
      { id: 4, name: "Emily Davis", certification: "EMT-Basic", hours: 144, shifts: 18, overtime: 4 },
      { id: 5, name: "David Wilson", certification: "Paramedic", hours: 160, shifts: 20, overtime: 0 },
      { id: 6, name: "Jessica Martinez", certification: "EMT-Advanced", hours: 136, shifts: 17, overtime: 0 }
    ]);
    const topPerformers = ref([
      { id: 1, name: "Michael Brown", shifts: 22, hours: 176 },
      { id: 2, name: "John Smith", shifts: 21, hours: 168 },
      { id: 3, name: "David Wilson", shifts: 20, hours: 160 }
    ]);
    const recentActivities = ref([
      { id: 1, type: "shift", icon: "\u{1F4C5}", text: "New shift created for Station 1", time: "5m ago" },
      { id: 2, type: "trade", icon: "\u{1F504}", text: "Shift trade approved between John and Sarah", time: "12m ago" },
      { id: 3, type: "timeoff", icon: "\u{1F3D6}\uFE0F", text: "Time-off request approved for Emily Davis", time: "23m ago" },
      { id: 4, type: "alert", icon: "\u26A0\uFE0F", text: "Fatigue alert for Michael Brown", time: "1h ago" },
      { id: 5, type: "shift", icon: "\u{1F4C5}", text: "Shift confirmed by David Wilson", time: "2h ago" }
    ]);
    const maxHours = computed(() => Math.max(...workloadData.value.map((e) => e.hours)));
    const shiftTypeSegments = computed(() => {
      let offset = 0;
      return shiftTypes.value.map((type) => {
        const segment = {
          percentage: type.count / analytics2.value.totalShifts * 100,
          color: type.color,
          offset
        };
        offset -= segment.percentage;
        return segment;
      });
    });
    const getShiftLabel = (index) => {
      if (shiftsChartView.value === "daily") {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() - (shiftsData.value.length - index - 1));
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return `Week ${index + 1}`;
    };
    const getRotation = (index) => {
      let rotation = 0;
      for (let i = 0; i < index; i++) {
        rotation += certificationData.value[i].percentage * 3.6;
      }
      return rotation;
    };
    const getInitials = (name) => {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase();
    };
    const getWorkloadColor = (hours) => {
      if (hours > 160) return "#ef4444";
      if (hours > 140) return "#f59e0b";
      return "#10b981";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "analytics-container" }, _attrs))} data-v-a785acc9><div class="page-header" data-v-a785acc9><div class="header-content" data-v-a785acc9><h1 data-v-a785acc9>Schedule Analytics &amp; Reports</h1><p class="subtitle" data-v-a785acc9>Insights and metrics for optimizing your scheduling</p></div><div class="header-actions" data-v-a785acc9><select class="date-range-select" data-v-a785acc9><option value="7" data-v-a785acc9${ssrIncludeBooleanAttr(Array.isArray(unref(dateRange)) ? ssrLooseContain(unref(dateRange), "7") : ssrLooseEqual(unref(dateRange), "7")) ? " selected" : ""}>Last 7 Days</option><option value="30" data-v-a785acc9${ssrIncludeBooleanAttr(Array.isArray(unref(dateRange)) ? ssrLooseContain(unref(dateRange), "30") : ssrLooseEqual(unref(dateRange), "30")) ? " selected" : ""}>Last 30 Days</option><option value="90" data-v-a785acc9${ssrIncludeBooleanAttr(Array.isArray(unref(dateRange)) ? ssrLooseContain(unref(dateRange), "90") : ssrLooseEqual(unref(dateRange), "90")) ? " selected" : ""}>Last 90 Days</option><option value="365" data-v-a785acc9${ssrIncludeBooleanAttr(Array.isArray(unref(dateRange)) ? ssrLooseContain(unref(dateRange), "365") : ssrLooseEqual(unref(dateRange), "365")) ? " selected" : ""}>Last Year</option></select><button class="btn-secondary" data-v-a785acc9><span class="icon" data-v-a785acc9>\u{1F4CA}</span> Export Report </button></div></div><div class="analytics-grid" data-v-a785acc9><div class="metric-card highlight" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u{1F465}</span><span class="metric-title" data-v-a785acc9>Total Shifts</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).totalShifts)}</div><div class="metric-change positive" data-v-a785acc9><span class="change-icon" data-v-a785acc9>\u2191</span><span data-v-a785acc9>12% from last period</span></div></div><div class="metric-card" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u23F0</span><span class="metric-title" data-v-a785acc9>Total Hours</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).totalHours.toLocaleString())}h</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>Avg ${ssrInterpolate((unref(analytics2).totalHours / unref(analytics2).totalShifts).toFixed(1))}h per shift</span></div></div><div class="metric-card warning" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u26A1</span><span class="metric-title" data-v-a785acc9>Overtime Hours</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).overtimeHours)}h</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>${ssrInterpolate((unref(analytics2).overtimeHours / unref(analytics2).totalHours * 100).toFixed(1))}% of total</span></div></div><div class="metric-card" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u{1F4B0}</span><span class="metric-title" data-v-a785acc9>Labor Cost</span></div><div class="metric-value" data-v-a785acc9>$${ssrInterpolate(unref(analytics2).estimatedCost.toLocaleString())}</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>Estimated</span></div></div><div class="metric-card success" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u2713</span><span class="metric-title" data-v-a785acc9>Coverage Rate</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).coverageRate)}%</div><div class="metric-change positive" data-v-a785acc9><span class="change-icon" data-v-a785acc9>\u2191</span><span data-v-a785acc9>Excellent</span></div></div><div class="metric-card" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u{1F504}</span><span class="metric-title" data-v-a785acc9>Shift Trades</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).totalTrades)}</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>${ssrInterpolate(unref(analytics2).approvedTrades)} approved</span></div></div><div class="metric-card" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u{1F3D6}\uFE0F</span><span class="metric-title" data-v-a785acc9>Time Off Requests</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).timeOffRequests)}</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>${ssrInterpolate(unref(analytics2).timeOffHours)}h total</span></div></div><div class="metric-card danger" data-v-a785acc9><div class="metric-header" data-v-a785acc9><span class="metric-icon" data-v-a785acc9>\u26A0\uFE0F</span><span class="metric-title" data-v-a785acc9>Fatigue Violations</span></div><div class="metric-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).fatigueViolations)}</div><div class="metric-footer" data-v-a785acc9><span data-v-a785acc9>Requires attention</span></div></div></div><div class="charts-section" data-v-a785acc9><div class="chart-card full-width" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Shifts Over Time</h3><div class="chart-controls" data-v-a785acc9><!--[-->`);
      ssrRenderList(["daily", "weekly", "monthly"], (type) => {
        _push(`<button class="${ssrRenderClass(["chart-btn", { active: unref(shiftsChartView) === type }])}" data-v-a785acc9>${ssrInterpolate(type)}</button>`);
      });
      _push(`<!--]--></div></div><div class="chart-body" data-v-a785acc9><div class="chart-placeholder" data-v-a785acc9><div class="bar-chart" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(shiftsData), (value, index) => {
        _push(`<div class="bar-group" data-v-a785acc9><div class="bar" style="${ssrRenderStyle({ height: `${value / Math.max(...unref(shiftsData)) * 100}%` })}" data-v-a785acc9><span class="bar-value" data-v-a785acc9>${ssrInterpolate(value)}</span></div><span class="bar-label" data-v-a785acc9>${ssrInterpolate(getShiftLabel(index))}</span></div>`);
      });
      _push(`<!--]--></div></div></div></div><div class="chart-card" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Staffing by Certification</h3></div><div class="chart-body" data-v-a785acc9><div class="donut-chart" data-v-a785acc9><div class="donut-segments" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(certificationData), (cert, index) => {
        _push(`<div class="donut-segment" style="${ssrRenderStyle({
          "--percentage": cert.percentage,
          "--rotation": getRotation(index),
          "--color": cert.color
        })}" data-v-a785acc9></div>`);
      });
      _push(`<!--]--></div><div class="donut-center" data-v-a785acc9><span class="donut-value" data-v-a785acc9>${ssrInterpolate(unref(analytics2).uniqueStaff)}</span><span class="donut-label" data-v-a785acc9>Total Staff</span></div></div><div class="chart-legend" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(certificationData), (cert) => {
        _push(`<div class="legend-item" data-v-a785acc9><span class="legend-color" style="${ssrRenderStyle({ backgroundColor: cert.color })}" data-v-a785acc9></span><span class="legend-label" data-v-a785acc9>${ssrInterpolate(cert.name)}</span><span class="legend-value" data-v-a785acc9>${ssrInterpolate(cert.count)}</span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="chart-card" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Station Distribution</h3></div><div class="chart-body" data-v-a785acc9><div class="horizontal-bars" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(stationData), (station) => {
        _push(`<div class="h-bar-row" data-v-a785acc9><span class="h-bar-label" data-v-a785acc9>${ssrInterpolate(station.name)}</span><div class="h-bar-container" data-v-a785acc9><div class="h-bar-fill" style="${ssrRenderStyle({ width: `${station.percentage}%`, backgroundColor: station.color })}" data-v-a785acc9><span class="h-bar-value" data-v-a785acc9>${ssrInterpolate(station.count)}</span></div></div><span class="h-bar-percentage" data-v-a785acc9>${ssrInterpolate(station.percentage)}%</span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="chart-card" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Shift Types</h3></div><div class="chart-body" data-v-a785acc9><div class="pie-chart-container" data-v-a785acc9><svg viewBox="0 0 100 100" class="pie-chart" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(shiftTypeSegments), (segment, index) => {
        _push(`<circle cx="50" cy="50" r="40"${ssrRenderAttr("stroke", segment.color)} stroke-width="20" fill="transparent"${ssrRenderAttr("stroke-dasharray", `${segment.percentage} ${100 - segment.percentage}`)}${ssrRenderAttr("stroke-dashoffset", segment.offset)} transform="rotate(-90 50 50)" data-v-a785acc9></circle>`);
      });
      _push(`<!--]--></svg><div class="pie-center" data-v-a785acc9><span class="pie-value" data-v-a785acc9>${ssrInterpolate(unref(shiftTypes).length)}</span><span class="pie-label" data-v-a785acc9>Types</span></div></div><div class="chart-legend" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(shiftTypes), (type) => {
        _push(`<div class="legend-item" data-v-a785acc9><span class="legend-color" style="${ssrRenderStyle({ backgroundColor: type.color })}" data-v-a785acc9></span><span class="legend-label" data-v-a785acc9>${ssrInterpolate(type.name)}</span><span class="legend-value" data-v-a785acc9>${ssrInterpolate(type.count)}</span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="chart-card full-width" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Workload Distribution</h3><span class="chart-subtitle" data-v-a785acc9>Hours by employee</span></div><div class="chart-body" data-v-a785acc9><div class="workload-chart" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(workloadData), (employee) => {
        _push(`<div class="workload-row" data-v-a785acc9><div class="employee-info" data-v-a785acc9><span class="employee-avatar" data-v-a785acc9>${ssrInterpolate(getInitials(employee.name))}</span><div class="employee-details" data-v-a785acc9><span class="employee-name" data-v-a785acc9>${ssrInterpolate(employee.name)}</span><span class="employee-cert" data-v-a785acc9>${ssrInterpolate(employee.certification)}</span></div></div><div class="workload-bar-container" data-v-a785acc9><div class="workload-bar" style="${ssrRenderStyle({
          width: `${employee.hours / unref(maxHours) * 100}%`,
          backgroundColor: getWorkloadColor(employee.hours)
        })}" data-v-a785acc9><span class="workload-hours" data-v-a785acc9>${ssrInterpolate(employee.hours)}h</span></div></div><div class="workload-stats" data-v-a785acc9><span class="shifts-count" data-v-a785acc9>${ssrInterpolate(employee.shifts)} shifts</span><span class="${ssrRenderClass(["overtime-badge", { warning: employee.overtime > 0 }])}" data-v-a785acc9>${ssrInterpolate(employee.overtime)}h OT </span></div></div>`);
      });
      _push(`<!--]--></div></div></div><div class="chart-card" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Top Performers</h3><span class="chart-subtitle" data-v-a785acc9>Most shifts completed</span></div><div class="chart-body" data-v-a785acc9><div class="leaderboard" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(topPerformers), (performer, index) => {
        _push(`<div class="leaderboard-item" data-v-a785acc9><div class="${ssrRenderClass([`rank-${index + 1}`, "rank-badge"])}" data-v-a785acc9>${ssrInterpolate(index + 1)}</div><span class="performer-avatar" data-v-a785acc9>${ssrInterpolate(getInitials(performer.name))}</span><div class="performer-info" data-v-a785acc9><span class="performer-name" data-v-a785acc9>${ssrInterpolate(performer.name)}</span><span class="performer-stats" data-v-a785acc9>${ssrInterpolate(performer.shifts)} shifts</span></div><div class="performer-score" data-v-a785acc9><span class="score-value" data-v-a785acc9>${ssrInterpolate(performer.hours)}h</span></div></div>`);
      });
      _push(`<!--]--></div></div></div><div class="chart-card" data-v-a785acc9><div class="chart-header" data-v-a785acc9><h3 data-v-a785acc9>Recent Activity</h3></div><div class="chart-body" data-v-a785acc9><div class="activity-timeline" data-v-a785acc9><!--[-->`);
      ssrRenderList(unref(recentActivities), (activity) => {
        _push(`<div class="activity-item" data-v-a785acc9><div class="${ssrRenderClass([`activity-${activity.type}`, "activity-icon"])}" data-v-a785acc9>${ssrInterpolate(activity.icon)}</div><div class="activity-content" data-v-a785acc9><span class="activity-text" data-v-a785acc9>${ssrInterpolate(activity.text)}</span><span class="activity-time" data-v-a785acc9>${ssrInterpolate(activity.time)}</span></div></div>`);
      });
      _push(`<!--]--></div></div></div></div><div class="reports-section" data-v-a785acc9><h2 data-v-a785acc9>Quick Reports</h2><div class="reports-grid" data-v-a785acc9><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u{1F4CB}</div><h3 data-v-a785acc9>Staffing Report</h3><p data-v-a785acc9>Complete breakdown of current staffing levels and coverage</p><button class="btn-report" data-v-a785acc9>Generate</button></div><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u{1F4B0}</div><h3 data-v-a785acc9>Payroll Report</h3><p data-v-a785acc9>Hours worked, overtime, and estimated labor costs</p><button class="btn-report" data-v-a785acc9>Generate</button></div><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u{1F504}</div><h3 data-v-a785acc9>Shift Changes Report</h3><p data-v-a785acc9>All trades, swaps, and schedule modifications</p><button class="btn-report" data-v-a785acc9>Generate</button></div><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u26A0\uFE0F</div><h3 data-v-a785acc9>Compliance Report</h3><p data-v-a785acc9>Fatigue violations, overtime limits, and regulatory compliance</p><button class="btn-report" data-v-a785acc9>Generate</button></div><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u{1F4CA}</div><h3 data-v-a785acc9>Performance Report</h3><p data-v-a785acc9>Individual and team performance metrics</p><button class="btn-report" data-v-a785acc9>Generate</button></div><div class="report-card" data-v-a785acc9><div class="report-icon" data-v-a785acc9>\u{1F4C8}</div><h3 data-v-a785acc9>Trends Analysis</h3><p data-v-a785acc9>Historical data and predictive insights</p><button class="btn-report" data-v-a785acc9>Generate</button></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule/analytics.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const analytics = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a785acc9"]]);

export { analytics as default };
//# sourceMappingURL=analytics-BwvJWu_c.mjs.map
