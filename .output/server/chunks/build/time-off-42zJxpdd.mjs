import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { u as useAuth } from './useAuth-BbjuGs-d.mjs';
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
  __name: "time-off",
  __ssrInlineRender: true,
  setup(__props) {
    ref("org-123");
    useTimeOff();
    useAuth();
    const currentTab = ref("my-requests");
    const searchQuery = ref("");
    const filterType = ref("");
    const filterMonth = ref("");
    const calendarDate = ref(/* @__PURE__ */ new Date());
    const myRequests = ref([]);
    const pendingApprovals = ref([]);
    const allRequests = ref([]);
    const myBalance = ref({
      vacation: { used: 0, pending: 0, available: 80 },
      sick: { used: 0, pending: 0, available: 40 },
      personal: { used: 0, pending: 0, available: 24 }
    });
    const showRequestModal = ref(false);
    const showReviewModal = ref(false);
    const reviewingRequest = ref(null);
    const reviewAction = ref("approve");
    const reviewNotes = ref("");
    const newRequest = ref({
      requestType: "vacation",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      isPartialDay: false,
      reason: ""
    });
    const tabs = computed(() => [
      { key: "my-requests", label: "My Requests", count: myRequests.value.length },
      { key: "pending-approval", label: "Pending Approval", count: pendingApprovals.value.length },
      { key: "team-calendar", label: "Team Calendar", count: null },
      { key: "all-requests", label: "All Requests", count: allRequests.value.length }
    ]);
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const calendarMonth = computed(() => {
      return calendarDate.value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    });
    const calendarDays = computed(() => {
      const year = calendarDate.value.getFullYear();
      const month = calendarDate.value.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      const days = [];
      const currentDateObj = new Date(startDate);
      for (let i = 0; i < 42; i++) {
        const dateStr = currentDateObj.toISOString().split("T")[0];
        const dayRequests = allRequests.value.filter(
          (r) => dateStr >= r.start_date && dateStr <= r.end_date && r.status === "approved"
        );
        days.push({
          date: dateStr,
          dayNumber: currentDateObj.getDate(),
          isToday: dateStr === (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          isOtherMonth: currentDateObj.getMonth() !== month,
          timeOffRequests: dayRequests
        });
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      return days;
    });
    const filteredMyRequests = computed(() => {
      return myRequests.value.filter((req) => {
        var _a;
        if (searchQuery.value && !((_a = req.reason) == null ? void 0 : _a.toLowerCase().includes(searchQuery.value.toLowerCase()))) {
          return false;
        }
        if (filterType.value && req.request_type !== filterType.value) {
          return false;
        }
        if (filterMonth.value) {
          const reqMonth = new Date(req.start_date).getMonth() + 1;
          if (reqMonth !== parseInt(filterMonth.value)) {
            return false;
          }
        }
        return true;
      });
    });
    const filteredAllRequests = computed(() => {
      return allRequests.value.filter((req) => {
        var _a, _b;
        if (searchQuery.value && !((_b = (_a = req.user) == null ? void 0 : _a.full_name) == null ? void 0 : _b.toLowerCase().includes(searchQuery.value.toLowerCase()))) {
          return false;
        }
        if (filterType.value && req.request_type !== filterType.value) {
          return false;
        }
        if (filterMonth.value) {
          const reqMonth = new Date(req.start_date).getMonth() + 1;
          if (reqMonth !== parseInt(filterMonth.value)) {
            return false;
          }
        }
        return true;
      });
    });
    const canSubmitRequest = computed(() => {
      return newRequest.value.startDate && newRequest.value.endDate;
    });
    const calculateTotalHours = () => {
      if (!newRequest.value.startDate || !newRequest.value.endDate) return 0;
      if (newRequest.value.isPartialDay && newRequest.value.startTime && newRequest.value.endTime) {
        const start2 = /* @__PURE__ */ new Date(`2000-01-01T${newRequest.value.startTime}`);
        const end2 = /* @__PURE__ */ new Date(`2000-01-01T${newRequest.value.endTime}`);
        return Math.round((end2.getTime() - start2.getTime()) / (1e3 * 60 * 60) * 10) / 10;
      }
      const start = new Date(newRequest.value.startDate);
      const end = new Date(newRequest.value.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
      return days * 8;
    };
    const getBalanceAfter = (type, hours) => {
      const typeKey = type.toLowerCase();
      if (!myBalance.value[typeKey]) return 0;
      return myBalance.value[typeKey].available - myBalance.value[typeKey].used - hours;
    };
    const getTypeIcon = (type) => {
      const icons = {
        vacation: "\u{1F3D6}\uFE0F",
        sick: "\u{1F912}",
        personal: "\u{1F4C5}",
        bereavement: "\u{1F54A}\uFE0F",
        training: "\u{1F4DA}"
      };
      return icons[type.toLowerCase()] || "\u{1F4DD}";
    };
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };
    const formatDateTime = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "timeoff-container" }, _attrs))} data-v-9249964b><div class="page-header" data-v-9249964b><div class="header-content" data-v-9249964b><h1 data-v-9249964b>Time-Off Management</h1><p class="subtitle" data-v-9249964b>Request and manage time off for your team</p></div><button class="btn-primary" data-v-9249964b><span class="icon" data-v-9249964b>+</span> New Request </button></div><div class="timeoff-stats" data-v-9249964b><div class="balance-card" data-v-9249964b><div class="balance-header" data-v-9249964b><span class="balance-icon" data-v-9249964b>\u{1F3D6}\uFE0F</span><span class="balance-type" data-v-9249964b>Vacation</span></div><div class="balance-details" data-v-9249964b><div class="balance-main" data-v-9249964b><span class="balance-value" data-v-9249964b>${ssrInterpolate(unref(myBalance).vacation.available - unref(myBalance).vacation.used)}</span><span class="balance-label" data-v-9249964b>hours available</span></div><div class="balance-secondary" data-v-9249964b><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Used:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).vacation.used)}h</span></div><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Pending:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).vacation.pending)}h</span></div></div></div></div><div class="balance-card" data-v-9249964b><div class="balance-header" data-v-9249964b><span class="balance-icon" data-v-9249964b>\u{1F912}</span><span class="balance-type" data-v-9249964b>Sick Leave</span></div><div class="balance-details" data-v-9249964b><div class="balance-main" data-v-9249964b><span class="balance-value" data-v-9249964b>${ssrInterpolate(unref(myBalance).sick.available - unref(myBalance).sick.used)}</span><span class="balance-label" data-v-9249964b>hours available</span></div><div class="balance-secondary" data-v-9249964b><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Used:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).sick.used)}h</span></div><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Pending:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).sick.pending)}h</span></div></div></div></div><div class="balance-card" data-v-9249964b><div class="balance-header" data-v-9249964b><span class="balance-icon" data-v-9249964b>\u{1F4C5}</span><span class="balance-type" data-v-9249964b>Personal</span></div><div class="balance-details" data-v-9249964b><div class="balance-main" data-v-9249964b><span class="balance-value" data-v-9249964b>${ssrInterpolate(unref(myBalance).personal.available - unref(myBalance).personal.used)}</span><span class="balance-label" data-v-9249964b>hours available</span></div><div class="balance-secondary" data-v-9249964b><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Used:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).personal.used)}h</span></div><div class="balance-item" data-v-9249964b><span class="label" data-v-9249964b>Pending:</span><span class="value" data-v-9249964b>${ssrInterpolate(unref(myBalance).personal.pending)}h</span></div></div></div></div></div><div class="timeoff-tabs" data-v-9249964b><!--[-->`);
      ssrRenderList(unref(tabs), (tab) => {
        _push(`<button class="${ssrRenderClass(["tab-btn", { active: unref(currentTab) === tab.key }])}" data-v-9249964b>${ssrInterpolate(tab.label)} `);
        if (tab.count) {
          _push(`<span class="tab-badge" data-v-9249964b>${ssrInterpolate(tab.count)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div><div class="timeoff-filters" data-v-9249964b><div class="filter-group" data-v-9249964b><input${ssrRenderAttr("value", unref(searchQuery))} type="text" placeholder="Search by name or reason..." class="search-input" data-v-9249964b></div><div class="filter-group" data-v-9249964b><select class="filter-select" data-v-9249964b><option value="" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "") : ssrLooseEqual(unref(filterType), "")) ? " selected" : ""}>All Types</option><option value="vacation" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "vacation") : ssrLooseEqual(unref(filterType), "vacation")) ? " selected" : ""}>Vacation</option><option value="sick" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "sick") : ssrLooseEqual(unref(filterType), "sick")) ? " selected" : ""}>Sick Leave</option><option value="personal" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "personal") : ssrLooseEqual(unref(filterType), "personal")) ? " selected" : ""}>Personal</option><option value="bereavement" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "bereavement") : ssrLooseEqual(unref(filterType), "bereavement")) ? " selected" : ""}>Bereavement</option><option value="training" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "training") : ssrLooseEqual(unref(filterType), "training")) ? " selected" : ""}>Training</option></select><select class="filter-select" data-v-9249964b><option value="" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterMonth)) ? ssrLooseContain(unref(filterMonth), "") : ssrLooseEqual(unref(filterMonth), "")) ? " selected" : ""}>All Months</option><!--[-->`);
      ssrRenderList(12, (month) => {
        _push(`<option${ssrRenderAttr("value", month)} data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(filterMonth)) ? ssrLooseContain(unref(filterMonth), month) : ssrLooseEqual(unref(filterMonth), month)) ? " selected" : ""}>${ssrInterpolate(new Date(2024, month - 1).toLocaleDateString("en-US", { month: "long" }))}</option>`);
      });
      _push(`<!--]--></select></div></div><div class="timeoff-content" data-v-9249964b>`);
      if (unref(currentTab) === "my-requests") {
        _push(`<div class="requests-list" data-v-9249964b><!--[-->`);
        ssrRenderList(unref(filteredMyRequests), (request) => {
          _push(`<div class="${ssrRenderClass(["request-card", `status-${request.status}`])}" data-v-9249964b><div class="request-status-indicator" data-v-9249964b></div><div class="request-content" data-v-9249964b><div class="request-header" data-v-9249964b><div class="request-type" data-v-9249964b><span class="type-icon" data-v-9249964b>${ssrInterpolate(getTypeIcon(request.request_type))}</span><span class="type-label" data-v-9249964b>${ssrInterpolate(request.request_type)}</span></div><span class="${ssrRenderClass(["status-badge", `status-${request.status}`])}" data-v-9249964b>${ssrInterpolate(request.status)}</span></div><div class="request-dates" data-v-9249964b><div class="date-range" data-v-9249964b><span class="date-label" data-v-9249964b>From:</span><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.start_date))}</span></div><span class="date-separator" data-v-9249964b>\u2192</span><div class="date-range" data-v-9249964b><span class="date-label" data-v-9249964b>To:</span><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.end_date))}</span></div><div class="date-duration" data-v-9249964b><span class="duration-value" data-v-9249964b>${ssrInterpolate(request.total_hours)}h</span></div></div>`);
          if (request.reason) {
            _push(`<div class="request-reason" data-v-9249964b><span class="reason-label" data-v-9249964b>Reason:</span><span class="reason-text" data-v-9249964b>${ssrInterpolate(request.reason)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (request.review_notes) {
            _push(`<div class="request-review" data-v-9249964b><span class="review-label" data-v-9249964b>Review Notes:</span><span class="review-text" data-v-9249964b>${ssrInterpolate(request.review_notes)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="request-footer" data-v-9249964b><span class="request-date" data-v-9249964b> Submitted ${ssrInterpolate(formatDateTime(request.submitted_at))}</span>`);
          if (request.status === "pending") {
            _push(`<div class="request-actions" data-v-9249964b><button class="btn-cancel" data-v-9249964b> Cancel Request </button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(filteredMyRequests).length === 0) {
          _push(`<div class="empty-state" data-v-9249964b><div class="empty-icon" data-v-9249964b>\u{1F4DD}</div><h3 data-v-9249964b>No Requests Found</h3><p data-v-9249964b>You haven&#39;t submitted any time-off requests yet.</p><button class="btn-primary" data-v-9249964b> Create Your First Request </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(currentTab) === "pending-approval") {
        _push(`<div class="requests-list" data-v-9249964b><!--[-->`);
        ssrRenderList(unref(pendingApprovals), (request) => {
          var _a2, _b2;
          _push(`<div class="request-card approval-card" data-v-9249964b><div class="request-status-indicator" data-v-9249964b></div><div class="request-content" data-v-9249964b><div class="request-header" data-v-9249964b><div class="user-info" data-v-9249964b><span class="user-name" data-v-9249964b>${ssrInterpolate((_a2 = request.user) == null ? void 0 : _a2.full_name)}</span><span class="user-email" data-v-9249964b>${ssrInterpolate((_b2 = request.user) == null ? void 0 : _b2.email)}</span></div><div class="request-type" data-v-9249964b><span class="type-icon" data-v-9249964b>${ssrInterpolate(getTypeIcon(request.request_type))}</span><span class="type-label" data-v-9249964b>${ssrInterpolate(request.request_type)}</span></div></div><div class="request-dates" data-v-9249964b><div class="date-range" data-v-9249964b><span class="date-label" data-v-9249964b>From:</span><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.start_date))}</span></div><span class="date-separator" data-v-9249964b>\u2192</span><div class="date-range" data-v-9249964b><span class="date-label" data-v-9249964b>To:</span><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.end_date))}</span></div><div class="date-duration" data-v-9249964b><span class="duration-value" data-v-9249964b>${ssrInterpolate(request.total_hours)}h</span></div></div>`);
          if (request.reason) {
            _push(`<div class="request-reason" data-v-9249964b><span class="reason-label" data-v-9249964b>Reason:</span><span class="reason-text" data-v-9249964b>${ssrInterpolate(request.reason)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="request-footer" data-v-9249964b><span class="request-date" data-v-9249964b> Submitted ${ssrInterpolate(formatDateTime(request.submitted_at))}</span><div class="approval-actions" data-v-9249964b><button class="btn-deny" data-v-9249964b> Deny </button><button class="btn-approve" data-v-9249964b> Approve </button></div></div></div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(pendingApprovals).length === 0) {
          _push(`<div class="empty-state" data-v-9249964b><div class="empty-icon" data-v-9249964b>\u2705</div><h3 data-v-9249964b>All Caught Up!</h3><p data-v-9249964b>No pending time-off requests to review.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(currentTab) === "team-calendar") {
        _push(`<div class="calendar-view" data-v-9249964b><div class="calendar-controls" data-v-9249964b><button class="nav-btn" data-v-9249964b>\u2190</button><h3 data-v-9249964b>${ssrInterpolate(unref(calendarMonth))}</h3><button class="nav-btn" data-v-9249964b>\u2192</button></div><div class="team-calendar" data-v-9249964b><div class="calendar-header" data-v-9249964b><!--[-->`);
        ssrRenderList(daysOfWeek, (day) => {
          _push(`<div class="day-header" data-v-9249964b>${ssrInterpolate(day)}</div>`);
        });
        _push(`<!--]--></div><div class="calendar-body" data-v-9249964b><!--[-->`);
        ssrRenderList(unref(calendarDays), (day) => {
          _push(`<div class="${ssrRenderClass(["calendar-day", {
            "is-today": day.isToday,
            "is-other-month": day.isOtherMonth,
            "has-timeoff": day.timeOffRequests.length > 0
          }])}" data-v-9249964b><div class="day-number" data-v-9249964b>${ssrInterpolate(day.dayNumber)}</div><div class="day-timeoff" data-v-9249964b><!--[-->`);
          ssrRenderList(day.timeOffRequests.slice(0, 2), (request) => {
            var _a2, _b2, _c2;
            _push(`<div class="${ssrRenderClass(["timeoff-indicator", `type-${request.request_type}`])}"${ssrRenderAttr("title", `${(_a2 = request.user) == null ? void 0 : _a2.full_name} - ${request.request_type}`)} data-v-9249964b>${ssrInterpolate((_c2 = (_b2 = request.user) == null ? void 0 : _b2.full_name) == null ? void 0 : _c2.split(" ")[0])}</div>`);
          });
          _push(`<!--]-->`);
          if (day.timeOffRequests.length > 2) {
            _push(`<div class="more-requests" data-v-9249964b> +${ssrInterpolate(day.timeOffRequests.length - 2)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<div class="requests-list" data-v-9249964b><!--[-->`);
        ssrRenderList(unref(filteredAllRequests), (request) => {
          var _a2;
          _push(`<div class="${ssrRenderClass(["request-card", `status-${request.status}`])}" data-v-9249964b><div class="request-status-indicator" data-v-9249964b></div><div class="request-content" data-v-9249964b><div class="request-header" data-v-9249964b><div class="user-info" data-v-9249964b><span class="user-name" data-v-9249964b>${ssrInterpolate((_a2 = request.user) == null ? void 0 : _a2.full_name)}</span></div><div class="request-type" data-v-9249964b><span class="type-icon" data-v-9249964b>${ssrInterpolate(getTypeIcon(request.request_type))}</span><span class="type-label" data-v-9249964b>${ssrInterpolate(request.request_type)}</span></div><span class="${ssrRenderClass(["status-badge", `status-${request.status}`])}" data-v-9249964b>${ssrInterpolate(request.status)}</span></div><div class="request-dates" data-v-9249964b><div class="date-range" data-v-9249964b><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.start_date))}</span></div><span class="date-separator" data-v-9249964b>\u2192</span><div class="date-range" data-v-9249964b><span class="date-value" data-v-9249964b>${ssrInterpolate(formatDate(request.end_date))}</span></div><div class="date-duration" data-v-9249964b><span class="duration-value" data-v-9249964b>${ssrInterpolate(request.total_hours)}h</span></div></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
      if (unref(showRequestModal)) {
        _push(`<div class="modal-overlay" data-v-9249964b><div class="modal-content" data-v-9249964b><div class="modal-header" data-v-9249964b><h2 data-v-9249964b>Request Time Off</h2><button class="btn-close" data-v-9249964b>\xD7</button></div><div class="modal-body" data-v-9249964b><div class="form-group" data-v-9249964b><label data-v-9249964b>Request Type</label><select class="form-select" data-v-9249964b><option value="vacation" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).requestType) ? ssrLooseContain(unref(newRequest).requestType, "vacation") : ssrLooseEqual(unref(newRequest).requestType, "vacation")) ? " selected" : ""}>Vacation</option><option value="sick" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).requestType) ? ssrLooseContain(unref(newRequest).requestType, "sick") : ssrLooseEqual(unref(newRequest).requestType, "sick")) ? " selected" : ""}>Sick Leave</option><option value="personal" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).requestType) ? ssrLooseContain(unref(newRequest).requestType, "personal") : ssrLooseEqual(unref(newRequest).requestType, "personal")) ? " selected" : ""}>Personal</option><option value="bereavement" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).requestType) ? ssrLooseContain(unref(newRequest).requestType, "bereavement") : ssrLooseEqual(unref(newRequest).requestType, "bereavement")) ? " selected" : ""}>Bereavement</option><option value="training" data-v-9249964b${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).requestType) ? ssrLooseContain(unref(newRequest).requestType, "training") : ssrLooseEqual(unref(newRequest).requestType, "training")) ? " selected" : ""}>Training</option></select></div><div class="form-row" data-v-9249964b><div class="form-group" data-v-9249964b><label data-v-9249964b>Start Date</label><input type="date"${ssrRenderAttr("value", unref(newRequest).startDate)} class="form-input" data-v-9249964b></div><div class="form-group" data-v-9249964b><label data-v-9249964b>End Date</label><input type="date"${ssrRenderAttr("value", unref(newRequest).endDate)} class="form-input" data-v-9249964b></div></div><div class="form-group" data-v-9249964b><label class="checkbox-label" data-v-9249964b><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(newRequest).isPartialDay) ? ssrLooseContain(unref(newRequest).isPartialDay, null) : unref(newRequest).isPartialDay) ? " checked" : ""} data-v-9249964b> Partial Day (specify times) </label></div>`);
        if (unref(newRequest).isPartialDay) {
          _push(`<div class="form-row" data-v-9249964b><div class="form-group" data-v-9249964b><label data-v-9249964b>Start Time</label><input type="time"${ssrRenderAttr("value", unref(newRequest).startTime)} class="form-input" data-v-9249964b></div><div class="form-group" data-v-9249964b><label data-v-9249964b>End Time</label><input type="time"${ssrRenderAttr("value", unref(newRequest).endTime)} class="form-input" data-v-9249964b></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="form-group" data-v-9249964b><label data-v-9249964b>Reason (Optional)</label><textarea class="form-textarea" rows="3" placeholder="Provide additional details..." data-v-9249964b>${ssrInterpolate(unref(newRequest).reason)}</textarea></div><div class="request-summary" data-v-9249964b><div class="summary-item" data-v-9249964b><span class="summary-label" data-v-9249964b>Total Hours:</span><span class="summary-value" data-v-9249964b>${ssrInterpolate(calculateTotalHours())}h</span></div><div class="summary-item" data-v-9249964b><span class="summary-label" data-v-9249964b>Balance After:</span><span class="summary-value" data-v-9249964b>${ssrInterpolate(getBalanceAfter(unref(newRequest).requestType, calculateTotalHours()))}h </span></div></div></div><div class="modal-footer" data-v-9249964b><button class="btn-secondary" data-v-9249964b> Cancel </button><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(canSubmitRequest)) ? " disabled" : ""} data-v-9249964b> Submit Request </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showReviewModal)) {
        _push(`<div class="modal-overlay" data-v-9249964b><div class="modal-content" data-v-9249964b><div class="modal-header" data-v-9249964b><h2 data-v-9249964b>${ssrInterpolate(unref(reviewAction) === "approve" ? "Approve" : "Deny")} Request</h2><button class="btn-close" data-v-9249964b>\xD7</button></div><div class="modal-body" data-v-9249964b><div class="review-summary" data-v-9249964b><div class="summary-row" data-v-9249964b><span class="label" data-v-9249964b>Employee:</span><span class="value" data-v-9249964b>${ssrInterpolate((_b = (_a = unref(reviewingRequest)) == null ? void 0 : _a.user) == null ? void 0 : _b.full_name)}</span></div><div class="summary-row" data-v-9249964b><span class="label" data-v-9249964b>Type:</span><span class="value" data-v-9249964b>${ssrInterpolate((_c = unref(reviewingRequest)) == null ? void 0 : _c.request_type)}</span></div><div class="summary-row" data-v-9249964b><span class="label" data-v-9249964b>Dates:</span><span class="value" data-v-9249964b>${ssrInterpolate(formatDate((_d = unref(reviewingRequest)) == null ? void 0 : _d.start_date))} - ${ssrInterpolate(formatDate((_e = unref(reviewingRequest)) == null ? void 0 : _e.end_date))}</span></div><div class="summary-row" data-v-9249964b><span class="label" data-v-9249964b>Hours:</span><span class="value" data-v-9249964b>${ssrInterpolate((_f = unref(reviewingRequest)) == null ? void 0 : _f.total_hours)}h</span></div></div><div class="form-group" data-v-9249964b><label data-v-9249964b>Notes (Optional)</label><textarea class="form-textarea" rows="3"${ssrRenderAttr("placeholder", unref(reviewAction) === "approve" ? "Add approval notes..." : "Explain reason for denial...")} data-v-9249964b>${ssrInterpolate(unref(reviewNotes))}</textarea></div></div><div class="modal-footer" data-v-9249964b><button class="btn-secondary" data-v-9249964b> Cancel </button><button class="${ssrRenderClass(unref(reviewAction) === "approve" ? "btn-approve" : "btn-deny")}" data-v-9249964b>${ssrInterpolate(unref(reviewAction) === "approve" ? "Approve Request" : "Deny Request")}</button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule/time-off.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const timeOff = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9249964b"]]);

export { timeOff as default };
//# sourceMappingURL=time-off-42zJxpdd.mjs.map
