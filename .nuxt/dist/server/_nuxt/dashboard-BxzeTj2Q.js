import { _ as __nuxt_component_0 } from "./nuxt-layout-CzSJTQFr.js";
import { defineComponent, ref, mergeProps, withCtx, unref, createVNode, openBlock, createBlock, toDisplayString, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import "/tmp/cc-agent/63214198/project/node_modules/hookable/dist/index.mjs";
import { _ as _export_sfc } from "../server.mjs";
import "vue-router";
import "/tmp/cc-agent/63214198/project/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/tmp/cc-agent/63214198/project/node_modules/unctx/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/h3/dist/index.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/defu/dist/defu.mjs";
import "/tmp/cc-agent/63214198/project/node_modules/ufo/dist/index.mjs";
import "@supabase/supabase-js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const stats = ref({
      activeIncidents: 8,
      availableUnits: 15,
      activeTransports: 5,
      onDutyStaff: 42
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      _push(ssrRenderComponent(_component_NuxtLayout, mergeProps({ name: "default" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="dashboard-content" data-v-e74c17ff${_scopeId}><div class="page-header" data-v-e74c17ff${_scopeId}><h1 data-v-e74c17ff${_scopeId}>Mission Control</h1><p data-v-e74c17ff${_scopeId}>Real-time operational overview</p></div><div class="metrics-grid" data-v-e74c17ff${_scopeId}><div class="metric-card" data-v-e74c17ff${_scopeId}><div class="metric-icon emergency" data-v-e74c17ff${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-e74c17ff${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-e74c17ff${_scopeId}></path></svg></div><div class="metric-details" data-v-e74c17ff${_scopeId}><div class="metric-label" data-v-e74c17ff${_scopeId}>Active Incidents</div><div class="metric-value" data-v-e74c17ff${_scopeId}>${ssrInterpolate(unref(stats).activeIncidents)}</div><div class="metric-change up" data-v-e74c17ff${_scopeId}>+2 from last hour</div></div></div><div class="metric-card" data-v-e74c17ff${_scopeId}><div class="metric-icon success" data-v-e74c17ff${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-e74c17ff${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-e74c17ff${_scopeId}></path></svg></div><div class="metric-details" data-v-e74c17ff${_scopeId}><div class="metric-label" data-v-e74c17ff${_scopeId}>Available Units</div><div class="metric-value" data-v-e74c17ff${_scopeId}>${ssrInterpolate(unref(stats).availableUnits)}</div><div class="metric-change" data-v-e74c17ff${_scopeId}>87% readiness</div></div></div><div class="metric-card" data-v-e74c17ff${_scopeId}><div class="metric-icon warning" data-v-e74c17ff${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-e74c17ff${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-e74c17ff${_scopeId}></path></svg></div><div class="metric-details" data-v-e74c17ff${_scopeId}><div class="metric-label" data-v-e74c17ff${_scopeId}>Active Transports</div><div class="metric-value" data-v-e74c17ff${_scopeId}>${ssrInterpolate(unref(stats).activeTransports)}</div><div class="metric-change" data-v-e74c17ff${_scopeId}>3 enroute to hospital</div></div></div><div class="metric-card" data-v-e74c17ff${_scopeId}><div class="metric-icon info" data-v-e74c17ff${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-e74c17ff${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" data-v-e74c17ff${_scopeId}></path></svg></div><div class="metric-details" data-v-e74c17ff${_scopeId}><div class="metric-label" data-v-e74c17ff${_scopeId}>On-Duty Personnel</div><div class="metric-value" data-v-e74c17ff${_scopeId}>${ssrInterpolate(unref(stats).onDutyStaff)}</div><div class="metric-change" data-v-e74c17ff${_scopeId}>24 shift changes today</div></div></div></div><div class="content-grid" data-v-e74c17ff${_scopeId}><div class="card" data-v-e74c17ff${_scopeId}><h3 data-v-e74c17ff${_scopeId}>Recent Activity</h3><div class="activity-list" data-v-e74c17ff${_scopeId}><div class="activity-item" data-v-e74c17ff${_scopeId}><div class="activity-icon emergency" data-v-e74c17ff${_scopeId}>🚨</div><div class="activity-content" data-v-e74c17ff${_scopeId}><div class="activity-title" data-v-e74c17ff${_scopeId}>New Emergency Call</div><div class="activity-details" data-v-e74c17ff${_scopeId}>Medical emergency at 123 Main St</div><div class="activity-time" data-v-e74c17ff${_scopeId}>2 minutes ago</div></div></div><div class="activity-item" data-v-e74c17ff${_scopeId}><div class="activity-icon success" data-v-e74c17ff${_scopeId}>✓</div><div class="activity-content" data-v-e74c17ff${_scopeId}><div class="activity-title" data-v-e74c17ff${_scopeId}>Transport Completed</div><div class="activity-details" data-v-e74c17ff${_scopeId}>Unit A-12 returned to service</div><div class="activity-time" data-v-e74c17ff${_scopeId}>15 minutes ago</div></div></div><div class="activity-item" data-v-e74c17ff${_scopeId}><div class="activity-icon info" data-v-e74c17ff${_scopeId}>📋</div><div class="activity-content" data-v-e74c17ff${_scopeId}><div class="activity-title" data-v-e74c17ff${_scopeId}>ePCR Submitted</div><div class="activity-details" data-v-e74c17ff${_scopeId}>Patient care report for INC-2024-001</div><div class="activity-time" data-v-e74c17ff${_scopeId}>28 minutes ago</div></div></div></div></div><div class="card" data-v-e74c17ff${_scopeId}><h3 data-v-e74c17ff${_scopeId}>System Status</h3><div class="status-list" data-v-e74c17ff${_scopeId}><div class="status-item" data-v-e74c17ff${_scopeId}><span class="status-label" data-v-e74c17ff${_scopeId}>CAD System</span><span class="status-badge online" data-v-e74c17ff${_scopeId}>Online</span></div><div class="status-item" data-v-e74c17ff${_scopeId}><span class="status-label" data-v-e74c17ff${_scopeId}>Database</span><span class="status-badge online" data-v-e74c17ff${_scopeId}>Online</span></div><div class="status-item" data-v-e74c17ff${_scopeId}><span class="status-label" data-v-e74c17ff${_scopeId}>GPS Tracking</span><span class="status-badge online" data-v-e74c17ff${_scopeId}>Online</span></div><div class="status-item" data-v-e74c17ff${_scopeId}><span class="status-label" data-v-e74c17ff${_scopeId}>Billing System</span><span class="status-badge online" data-v-e74c17ff${_scopeId}>Online</span></div></div></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "dashboard-content" }, [
                createVNode("div", { class: "page-header" }, [
                  createVNode("h1", null, "Mission Control"),
                  createVNode("p", null, "Real-time operational overview")
                ]),
                createVNode("div", { class: "metrics-grid" }, [
                  createVNode("div", { class: "metric-card" }, [
                    createVNode("div", { class: "metric-icon emergency" }, [
                      (openBlock(), createBlock("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        })
                      ]))
                    ]),
                    createVNode("div", { class: "metric-details" }, [
                      createVNode("div", { class: "metric-label" }, "Active Incidents"),
                      createVNode("div", { class: "metric-value" }, toDisplayString(unref(stats).activeIncidents), 1),
                      createVNode("div", { class: "metric-change up" }, "+2 from last hour")
                    ])
                  ]),
                  createVNode("div", { class: "metric-card" }, [
                    createVNode("div", { class: "metric-icon success" }, [
                      (openBlock(), createBlock("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        })
                      ]))
                    ]),
                    createVNode("div", { class: "metric-details" }, [
                      createVNode("div", { class: "metric-label" }, "Available Units"),
                      createVNode("div", { class: "metric-value" }, toDisplayString(unref(stats).availableUnits), 1),
                      createVNode("div", { class: "metric-change" }, "87% readiness")
                    ])
                  ]),
                  createVNode("div", { class: "metric-card" }, [
                    createVNode("div", { class: "metric-icon warning" }, [
                      (openBlock(), createBlock("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M13 10V3L4 14h7v7l9-11h-7z"
                        })
                      ]))
                    ]),
                    createVNode("div", { class: "metric-details" }, [
                      createVNode("div", { class: "metric-label" }, "Active Transports"),
                      createVNode("div", { class: "metric-value" }, toDisplayString(unref(stats).activeTransports), 1),
                      createVNode("div", { class: "metric-change" }, "3 enroute to hospital")
                    ])
                  ]),
                  createVNode("div", { class: "metric-card" }, [
                    createVNode("div", { class: "metric-icon info" }, [
                      (openBlock(), createBlock("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        })
                      ]))
                    ]),
                    createVNode("div", { class: "metric-details" }, [
                      createVNode("div", { class: "metric-label" }, "On-Duty Personnel"),
                      createVNode("div", { class: "metric-value" }, toDisplayString(unref(stats).onDutyStaff), 1),
                      createVNode("div", { class: "metric-change" }, "24 shift changes today")
                    ])
                  ])
                ]),
                createVNode("div", { class: "content-grid" }, [
                  createVNode("div", { class: "card" }, [
                    createVNode("h3", null, "Recent Activity"),
                    createVNode("div", { class: "activity-list" }, [
                      createVNode("div", { class: "activity-item" }, [
                        createVNode("div", { class: "activity-icon emergency" }, "🚨"),
                        createVNode("div", { class: "activity-content" }, [
                          createVNode("div", { class: "activity-title" }, "New Emergency Call"),
                          createVNode("div", { class: "activity-details" }, "Medical emergency at 123 Main St"),
                          createVNode("div", { class: "activity-time" }, "2 minutes ago")
                        ])
                      ]),
                      createVNode("div", { class: "activity-item" }, [
                        createVNode("div", { class: "activity-icon success" }, "✓"),
                        createVNode("div", { class: "activity-content" }, [
                          createVNode("div", { class: "activity-title" }, "Transport Completed"),
                          createVNode("div", { class: "activity-details" }, "Unit A-12 returned to service"),
                          createVNode("div", { class: "activity-time" }, "15 minutes ago")
                        ])
                      ]),
                      createVNode("div", { class: "activity-item" }, [
                        createVNode("div", { class: "activity-icon info" }, "📋"),
                        createVNode("div", { class: "activity-content" }, [
                          createVNode("div", { class: "activity-title" }, "ePCR Submitted"),
                          createVNode("div", { class: "activity-details" }, "Patient care report for INC-2024-001"),
                          createVNode("div", { class: "activity-time" }, "28 minutes ago")
                        ])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "card" }, [
                    createVNode("h3", null, "System Status"),
                    createVNode("div", { class: "status-list" }, [
                      createVNode("div", { class: "status-item" }, [
                        createVNode("span", { class: "status-label" }, "CAD System"),
                        createVNode("span", { class: "status-badge online" }, "Online")
                      ]),
                      createVNode("div", { class: "status-item" }, [
                        createVNode("span", { class: "status-label" }, "Database"),
                        createVNode("span", { class: "status-badge online" }, "Online")
                      ]),
                      createVNode("div", { class: "status-item" }, [
                        createVNode("span", { class: "status-label" }, "GPS Tracking"),
                        createVNode("span", { class: "status-badge online" }, "Online")
                      ]),
                      createVNode("div", { class: "status-item" }, [
                        createVNode("span", { class: "status-label" }, "Billing System"),
                        createVNode("span", { class: "status-badge online" }, "Online")
                      ])
                    ])
                  ])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const dashboard = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e74c17ff"]]);
export {
  dashboard as default
};
//# sourceMappingURL=dashboard-BxzeTj2Q.js.map
