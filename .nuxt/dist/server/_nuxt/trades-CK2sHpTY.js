import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderStyle, ssrRenderAttr } from "vue/server-renderer";
import { u as useAuth } from "./useAuth-BbjuGs-d.js";
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
  __name: "trades",
  __ssrInlineRender: true,
  setup(__props) {
    ref("org-123");
    useShiftTrades();
    useScheduling();
    const auth = useAuth();
    const currentTab = ref("marketplace");
    const filterType = ref("");
    const filterStation = ref("");
    const isManager = ref(true);
    const trades2 = ref([]);
    const myUpcomingShifts = ref([]);
    const showOfferModal = ref(false);
    const showAcceptModal = ref(false);
    const selectedTrade = ref(null);
    const acceptingShiftId = ref("");
    const newTrade = ref({
      shiftId: "",
      tradeType: "swap",
      reason: ""
    });
    const tabs = computed(() => {
      const allTabs = [
        { key: "marketplace", label: "Marketplace", count: marketplaceTrades.value.length },
        { key: "my-trades", label: "My Trades", count: myTrades.value.length }
      ];
      if (isManager.value) {
        allTabs.push(
          { key: "pending-approval", label: "Pending Approval", count: pendingApproval.value.length }
        );
      }
      allTabs.push(
        { key: "history", label: "History", count: null }
      );
      return allTabs;
    });
    const marketplaceTrades = computed(() => {
      return trades2.value.filter((t) => t.status === "pending");
    });
    const myTrades = computed(() => {
      const user = auth.getUser();
      if (!user) return [];
      return trades2.value.filter(
        (t) => (t.offering_user_id === user.id || t.requesting_user_id === user.id) && !["management_approved", "management_denied", "cancelled"].includes(t.status)
      );
    });
    const pendingApproval = computed(() => {
      return trades2.value.filter((t) => t.status === "accepted");
    });
    const completedTrades = computed(() => {
      return trades2.value.filter(
        (t) => ["management_approved", "management_denied", "cancelled"].includes(t.status)
      );
    });
    const filteredMarketplaceTrades = computed(() => {
      return marketplaceTrades.value.filter((trade) => {
        if (filterType.value && trade.trade_type !== filterType.value) return false;
        if (filterStation.value && trade.offering_shift?.station !== filterStation.value) return false;
        return true;
      });
    });
    const isMyTrade = (trade) => {
      const user = auth.getUser();
      return user && trade.offering_user_id === user.id;
    };
    const getInitials = (name) => {
      if (!name) return "?";
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
    const formatShiftTime = (shift) => {
      if (!shift) return "";
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      return `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "trades-container" }, _attrs))} data-v-be42500f><div class="page-header" data-v-be42500f><div class="header-content" data-v-be42500f><h1 data-v-be42500f>Shift Trading Marketplace</h1><p class="subtitle" data-v-be42500f>Trade, swap, or cover shifts with your team</p></div><button class="btn-primary" data-v-be42500f><span class="icon" data-v-be42500f>+</span> Offer Shift </button></div><div class="trades-tabs" data-v-be42500f><!--[-->`);
      ssrRenderList(unref(tabs), (tab) => {
        _push(`<button class="${ssrRenderClass(["tab-btn", { active: unref(currentTab) === tab.key }])}" data-v-be42500f>${ssrInterpolate(tab.label)} `);
        if (tab.count) {
          _push(`<span class="tab-badge" data-v-be42500f>${ssrInterpolate(tab.count)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div><div class="trades-filters" data-v-be42500f><div class="filter-group" data-v-be42500f><select class="filter-select" data-v-be42500f><option value="" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "") : ssrLooseEqual(unref(filterType), "")) ? " selected" : ""}>All Types</option><option value="swap" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "swap") : ssrLooseEqual(unref(filterType), "swap")) ? " selected" : ""}>Swap</option><option value="giveaway" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "giveaway") : ssrLooseEqual(unref(filterType), "giveaway")) ? " selected" : ""}>Giveaway</option><option value="cover" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterType)) ? ssrLooseContain(unref(filterType), "cover") : ssrLooseEqual(unref(filterType), "cover")) ? " selected" : ""}>Cover</option></select><select class="filter-select" data-v-be42500f><option value="" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterStation)) ? ssrLooseContain(unref(filterStation), "") : ssrLooseEqual(unref(filterStation), "")) ? " selected" : ""}>All Stations</option><option value="Station 1" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterStation)) ? ssrLooseContain(unref(filterStation), "Station 1") : ssrLooseEqual(unref(filterStation), "Station 1")) ? " selected" : ""}>Station 1</option><option value="Station 2" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterStation)) ? ssrLooseContain(unref(filterStation), "Station 2") : ssrLooseEqual(unref(filterStation), "Station 2")) ? " selected" : ""}>Station 2</option><option value="Station 3" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(filterStation)) ? ssrLooseContain(unref(filterStation), "Station 3") : ssrLooseEqual(unref(filterStation), "Station 3")) ? " selected" : ""}>Station 3</option></select></div><div class="filter-stats" data-v-be42500f><div class="stat-item" data-v-be42500f><span class="stat-value" data-v-be42500f>${ssrInterpolate(unref(trades2).length)}</span><span class="stat-label" data-v-be42500f>Active Trades</span></div><div class="stat-item" data-v-be42500f><span class="stat-value" data-v-be42500f>${ssrInterpolate(unref(myTrades).length)}</span><span class="stat-label" data-v-be42500f>My Trades</span></div></div></div><div class="trades-content" data-v-be42500f>`);
      if (unref(currentTab) === "marketplace") {
        _push(`<div class="marketplace-grid" data-v-be42500f><!--[-->`);
        ssrRenderList(unref(filteredMarketplaceTrades), (trade) => {
          _push(`<div class="trade-card" data-v-be42500f><div class="trade-header" data-v-be42500f><div class="${ssrRenderClass([`type-${trade.trade_type}`, "trade-type-badge"])}" data-v-be42500f>${ssrInterpolate(trade.trade_type)}</div><div class="trade-date" data-v-be42500f>${ssrInterpolate(formatDate(trade.offering_shift?.shift_date))}</div></div><div class="trade-shift-info" data-v-be42500f><div class="shift-detail" data-v-be42500f><span class="detail-label" data-v-be42500f>Offering:</span><div class="shift-block" style="${ssrRenderStyle({ backgroundColor: trade.offering_shift?.template?.color_code || "#ff6b00" })}" data-v-be42500f><span class="shift-name" data-v-be42500f>${ssrInterpolate(trade.offering_shift?.template?.template_name || "Shift")}</span><span class="shift-time" data-v-be42500f>${ssrInterpolate(formatShiftTime(trade.offering_shift))}</span><span class="shift-station" data-v-be42500f>${ssrInterpolate(trade.offering_shift?.station || "No Station")}</span></div></div><div class="shift-separator" data-v-be42500f>⇄</div>`);
          if (trade.trade_type === "swap") {
            _push(`<div class="shift-detail" data-v-be42500f><span class="detail-label" data-v-be42500f>Looking for:</span><div class="shift-placeholder" data-v-be42500f><span data-v-be42500f>Any compatible shift</span></div></div>`);
          } else {
            _push(`<div class="shift-detail" data-v-be42500f><span class="detail-label" data-v-be42500f>Need:</span><div class="shift-placeholder" data-v-be42500f><span data-v-be42500f>${ssrInterpolate(trade.trade_type === "giveaway" ? "Someone to take" : "Coverage")}</span></div></div>`);
          }
          _push(`</div>`);
          if (trade.reason) {
            _push(`<div class="trade-reason" data-v-be42500f><span class="reason-icon" data-v-be42500f>💬</span><span class="reason-text" data-v-be42500f>${ssrInterpolate(trade.reason)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="trade-footer" data-v-be42500f><div class="trade-user" data-v-be42500f><span class="user-avatar" data-v-be42500f>${ssrInterpolate(getInitials(trade.offering_user?.full_name))}</span><span class="user-name" data-v-be42500f>${ssrInterpolate(trade.offering_user?.full_name)}</span></div>`);
          if (!isMyTrade(trade)) {
            _push(`<button class="btn-accept" data-v-be42500f> Accept Trade </button>`);
          } else {
            _push(`<span class="my-trade-badge" data-v-be42500f>Your Trade</span>`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(filteredMarketplaceTrades).length === 0) {
          _push(`<div class="empty-state" data-v-be42500f><div class="empty-icon" data-v-be42500f>🔄</div><h3 data-v-be42500f>No Available Trades</h3><p data-v-be42500f>There are no shifts available for trading right now.</p><button class="btn-primary" data-v-be42500f> Offer a Shift </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(currentTab) === "my-trades") {
        _push(`<div class="trades-list" data-v-be42500f><!--[-->`);
        ssrRenderList(unref(myTrades), (trade) => {
          _push(`<div class="${ssrRenderClass(["trade-list-item", `status-${trade.status}`])}" data-v-be42500f><div class="trade-status-bar" data-v-be42500f></div><div class="trade-content" data-v-be42500f><div class="trade-list-header" data-v-be42500f><div class="${ssrRenderClass([`type-${trade.trade_type}`, "trade-type-badge"])}" data-v-be42500f>${ssrInterpolate(trade.trade_type)}</div><span class="${ssrRenderClass(["status-badge", `status-${trade.status}`])}" data-v-be42500f>${ssrInterpolate(trade.status.replace("_", " "))}</span></div><div class="trade-shifts" data-v-be42500f><div class="offering-shift" data-v-be42500f><span class="shift-label" data-v-be42500f>Offering:</span><div class="shift-info" data-v-be42500f><span class="shift-date" data-v-be42500f>${ssrInterpolate(formatDate(trade.offering_shift?.shift_date))}</span><span class="shift-time" data-v-be42500f>${ssrInterpolate(formatShiftTime(trade.offering_shift))}</span><span class="shift-station" data-v-be42500f>${ssrInterpolate(trade.offering_shift?.station)}</span></div></div>`);
          if (trade.requesting_user) {
            _push(`<div class="requesting-shift" data-v-be42500f><span class="shift-label" data-v-be42500f>With:</span><div class="shift-info" data-v-be42500f><span class="user-name" data-v-be42500f>${ssrInterpolate(trade.requesting_user?.full_name)}</span>`);
            if (trade.requesting_shift) {
              _push(`<span class="shift-date" data-v-be42500f>${ssrInterpolate(formatDate(trade.requesting_shift?.shift_date))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="trade-actions" data-v-be42500f><span class="trade-time" data-v-be42500f>${ssrInterpolate(formatDateTime(trade.offered_at))}</span><div class="action-buttons" data-v-be42500f>`);
          if (trade.status === "pending") {
            _push(`<button class="btn-cancel" data-v-be42500f> Cancel </button>`);
          } else {
            _push(`<!---->`);
          }
          if (trade.status === "accepted" && unref(isManager)) {
            _push(`<button class="btn-approve" data-v-be42500f> Approve </button>`);
          } else {
            _push(`<!---->`);
          }
          if (trade.status === "accepted" && unref(isManager)) {
            _push(`<button class="btn-deny" data-v-be42500f> Deny </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(myTrades).length === 0) {
          _push(`<div class="empty-state" data-v-be42500f><div class="empty-icon" data-v-be42500f>📋</div><h3 data-v-be42500f>No Active Trades</h3><p data-v-be42500f>You don&#39;t have any shift trades in progress.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(currentTab) === "pending-approval") {
        _push(`<div class="trades-list" data-v-be42500f><!--[-->`);
        ssrRenderList(unref(pendingApproval), (trade) => {
          _push(`<div class="trade-list-item approval-card" data-v-be42500f><div class="trade-status-bar" data-v-be42500f></div><div class="trade-content" data-v-be42500f><div class="trade-approval-header" data-v-be42500f><div class="participants" data-v-be42500f><div class="participant" data-v-be42500f><span class="participant-label" data-v-be42500f>From:</span><span class="participant-name" data-v-be42500f>${ssrInterpolate(trade.offering_user?.full_name)}</span></div><span class="separator" data-v-be42500f>↔</span><div class="participant" data-v-be42500f><span class="participant-label" data-v-be42500f>To:</span><span class="participant-name" data-v-be42500f>${ssrInterpolate(trade.requesting_user?.full_name)}</span></div></div><div class="${ssrRenderClass([`type-${trade.trade_type}`, "trade-type-badge"])}" data-v-be42500f>${ssrInterpolate(trade.trade_type)}</div></div><div class="trade-details-grid" data-v-be42500f><div class="detail-card" data-v-be42500f><span class="card-label" data-v-be42500f>Offering Shift</span><span class="card-date" data-v-be42500f>${ssrInterpolate(formatDate(trade.offering_shift?.shift_date))}</span><span class="card-time" data-v-be42500f>${ssrInterpolate(formatShiftTime(trade.offering_shift))}</span><span class="card-station" data-v-be42500f>${ssrInterpolate(trade.offering_shift?.station)}</span></div>`);
          if (trade.requesting_shift) {
            _push(`<div class="detail-card" data-v-be42500f><span class="card-label" data-v-be42500f>Requesting Shift</span><span class="card-date" data-v-be42500f>${ssrInterpolate(formatDate(trade.requesting_shift?.shift_date))}</span><span class="card-time" data-v-be42500f>${ssrInterpolate(formatShiftTime(trade.requesting_shift))}</span><span class="card-station" data-v-be42500f>${ssrInterpolate(trade.requesting_shift?.station)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (trade.reason) {
            _push(`<div class="trade-reason-box" data-v-be42500f><span class="reason-label" data-v-be42500f>Reason:</span><span class="reason-text" data-v-be42500f>${ssrInterpolate(trade.reason)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="approval-footer" data-v-be42500f><span class="trade-time" data-v-be42500f>Requested ${ssrInterpolate(formatDateTime(trade.accepted_at))}</span><div class="approval-buttons" data-v-be42500f><button class="btn-deny" data-v-be42500f> Deny </button><button class="btn-approve" data-v-be42500f> Approve Trade </button></div></div></div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(pendingApproval).length === 0) {
          _push(`<div class="empty-state" data-v-be42500f><div class="empty-icon" data-v-be42500f>✅</div><h3 data-v-be42500f>All Caught Up!</h3><p data-v-be42500f>No trades waiting for approval.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="trades-list" data-v-be42500f><!--[-->`);
        ssrRenderList(unref(completedTrades), (trade) => {
          _push(`<div class="${ssrRenderClass(["trade-list-item", `status-${trade.status}`])}" data-v-be42500f><div class="trade-status-bar" data-v-be42500f></div><div class="trade-content" data-v-be42500f><div class="trade-list-header" data-v-be42500f><div class="participants-inline" data-v-be42500f><span data-v-be42500f>${ssrInterpolate(trade.offering_user?.full_name)}</span><span class="separator" data-v-be42500f>→</span><span data-v-be42500f>${ssrInterpolate(trade.requesting_user?.full_name)}</span></div><span class="${ssrRenderClass(["status-badge", `status-${trade.status}`])}" data-v-be42500f>${ssrInterpolate(trade.status.replace("_", " "))}</span></div><div class="trade-summary" data-v-be42500f><span data-v-be42500f>${ssrInterpolate(trade.trade_type)} • ${ssrInterpolate(formatDate(trade.offering_shift?.shift_date))}</span></div><div class="trade-completed-date" data-v-be42500f> Completed ${ssrInterpolate(formatDateTime(trade.completed_at || trade.updated_at))}</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
      if (unref(showOfferModal)) {
        _push(`<div class="modal-overlay" data-v-be42500f><div class="modal-content" data-v-be42500f><div class="modal-header" data-v-be42500f><h2 data-v-be42500f>Offer Shift for Trade</h2><button class="btn-close" data-v-be42500f>×</button></div><div class="modal-body" data-v-be42500f><div class="form-group" data-v-be42500f><label data-v-be42500f>Select Your Shift</label><select class="form-select" data-v-be42500f><option value="" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(newTrade).shiftId) ? ssrLooseContain(unref(newTrade).shiftId, "") : ssrLooseEqual(unref(newTrade).shiftId, "")) ? " selected" : ""}>Choose a shift...</option><!--[-->`);
        ssrRenderList(unref(myUpcomingShifts), (shift) => {
          _push(`<option${ssrRenderAttr("value", shift.id)} data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(newTrade).shiftId) ? ssrLooseContain(unref(newTrade).shiftId, shift.id) : ssrLooseEqual(unref(newTrade).shiftId, shift.id)) ? " selected" : ""}>${ssrInterpolate(formatDate(shift.shift_date))} - ${ssrInterpolate(formatShiftTime(shift))} (${ssrInterpolate(shift.station)}) </option>`);
        });
        _push(`<!--]--></select></div><div class="form-group" data-v-be42500f><label data-v-be42500f>Trade Type</label><div class="trade-type-options" data-v-be42500f><label class="radio-option" data-v-be42500f><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(unref(newTrade).tradeType, "swap")) ? " checked" : ""} value="swap" data-v-be42500f><div class="option-content" data-v-be42500f><span class="option-title" data-v-be42500f>Swap</span><span class="option-desc" data-v-be42500f>Exchange shifts with another employee</span></div></label><label class="radio-option" data-v-be42500f><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(unref(newTrade).tradeType, "giveaway")) ? " checked" : ""} value="giveaway" data-v-be42500f><div class="option-content" data-v-be42500f><span class="option-title" data-v-be42500f>Giveaway</span><span class="option-desc" data-v-be42500f>Give your shift to someone else</span></div></label><label class="radio-option" data-v-be42500f><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(unref(newTrade).tradeType, "cover")) ? " checked" : ""} value="cover" data-v-be42500f><div class="option-content" data-v-be42500f><span class="option-title" data-v-be42500f>Cover</span><span class="option-desc" data-v-be42500f>Need someone to cover part of your shift</span></div></label></div></div><div class="form-group" data-v-be42500f><label data-v-be42500f>Reason (Optional)</label><textarea class="form-textarea" rows="3" placeholder="Why do you need to trade this shift?" data-v-be42500f>${ssrInterpolate(unref(newTrade).reason)}</textarea></div></div><div class="modal-footer" data-v-be42500f><button class="btn-secondary" data-v-be42500f> Cancel </button><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(newTrade).shiftId) ? " disabled" : ""} data-v-be42500f> Post Trade Offer </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showAcceptModal)) {
        _push(`<div class="modal-overlay" data-v-be42500f><div class="modal-content" data-v-be42500f><div class="modal-header" data-v-be42500f><h2 data-v-be42500f>Accept Trade</h2><button class="btn-close" data-v-be42500f>×</button></div><div class="modal-body" data-v-be42500f><div class="accept-summary" data-v-be42500f><h3 data-v-be42500f>You&#39;re accepting this trade:</h3><div class="trade-preview" data-v-be42500f><div class="preview-shift" data-v-be42500f><span class="preview-label" data-v-be42500f>Their Shift:</span><div class="preview-details" data-v-be42500f><span data-v-be42500f>${ssrInterpolate(formatDate(unref(selectedTrade)?.offering_shift?.shift_date))}</span><span data-v-be42500f>${ssrInterpolate(formatShiftTime(unref(selectedTrade)?.offering_shift))}</span><span data-v-be42500f>${ssrInterpolate(unref(selectedTrade)?.offering_shift?.station)}</span></div></div></div></div>`);
        if (unref(selectedTrade)?.trade_type === "swap") {
          _push(`<div class="form-group" data-v-be42500f><label data-v-be42500f>Select Your Shift to Exchange</label><select class="form-select" data-v-be42500f><option value="" data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(acceptingShiftId)) ? ssrLooseContain(unref(acceptingShiftId), "") : ssrLooseEqual(unref(acceptingShiftId), "")) ? " selected" : ""}>Choose a shift...</option><!--[-->`);
          ssrRenderList(unref(myUpcomingShifts), (shift) => {
            _push(`<option${ssrRenderAttr("value", shift.id)} data-v-be42500f${ssrIncludeBooleanAttr(Array.isArray(unref(acceptingShiftId)) ? ssrLooseContain(unref(acceptingShiftId), shift.id) : ssrLooseEqual(unref(acceptingShiftId), shift.id)) ? " selected" : ""}>${ssrInterpolate(formatDate(shift.shift_date))} - ${ssrInterpolate(formatShiftTime(shift))} (${ssrInterpolate(shift.station)}) </option>`);
          });
          _push(`<!--]--></select></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="trade-notice" data-v-be42500f><span class="notice-icon" data-v-be42500f>ℹ️</span><span class="notice-text" data-v-be42500f> This trade requires management approval before it takes effect. </span></div></div><div class="modal-footer" data-v-be42500f><button class="btn-secondary" data-v-be42500f> Cancel </button><button class="btn-primary"${ssrIncludeBooleanAttr(unref(selectedTrade)?.trade_type === "swap" && !unref(acceptingShiftId)) ? " disabled" : ""} data-v-be42500f> Confirm Trade </button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule/trades.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const trades = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-be42500f"]]);
export {
  trades as default
};
//# sourceMappingURL=trades-CK2sHpTY.js.map
