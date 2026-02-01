import { _ as __nuxt_component_0 } from './nuxt-link-ClShZCXv.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { u as useAuth } from './useAuth-BbjuGs-d.mjs';
import { _ as _export_sfc, u as useRouter } from './server.mjs';
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

const usePermissions = () => {
  const { employee } = useAuth();
  const hasPermission = (permission) => {
    if (!employee.value) return false;
    const credentials = employee.value.credentials || [];
    return credentials.includes(permission);
  };
  const hasRole = (roleName) => {
    var _a;
    if (!employee.value) return false;
    return (_a = employee.value.position) == null ? void 0 : _a.toLowerCase().includes(roleName.toLowerCase());
  };
  const canAccessModule = (module) => {
    var _a;
    if (!employee.value) return false;
    const modulePermissions = {
      cad: ["dispatcher", "admin", "supervisor"],
      mdt: ["paramedic", "emt", "firefighter", "admin", "supervisor"],
      epcr: ["paramedic", "emt", "admin", "supervisor"],
      transport: ["dispatcher", "admin", "supervisor"],
      hems: ["pilot", "flight_medic", "admin", "supervisor"],
      fire: ["firefighter", "fire_chief", "admin", "supervisor"],
      scheduling: ["admin", "supervisor", "hr"],
      crewlink: ["all"],
      billing: ["billing", "admin", "finance"],
      hr: ["hr", "admin"]
    };
    const allowedRoles = modulePermissions[module.toLowerCase()] || [];
    if (allowedRoles.includes("all")) return true;
    const position = ((_a = employee.value.position) == null ? void 0 : _a.toLowerCase()) || "";
    return allowedRoles.some((role) => position.includes(role));
  };
  const isAdmin = () => {
    return hasRole("admin");
  };
  const isSupervisor = () => {
    return hasRole("supervisor") || isAdmin();
  };
  return {
    hasPermission,
    hasRole,
    canAccessModule,
    isAdmin,
    isSupervisor
  };
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const { signOut, employee } = useAuth();
    const { canAccessModule } = usePermissions();
    useRouter();
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app-layout" }, _attrs))} data-v-3788f7e7><header class="app-header" data-v-3788f7e7><div class="header-content" data-v-3788f7e7><div class="logo" data-v-3788f7e7><span class="logo-text" data-v-3788f7e7>FUSION</span><span class="logo-accent" data-v-3788f7e7>EMS</span><span class="logo-quantum" data-v-3788f7e7>QUANTUM</span></div><nav class="nav-menu" data-v-3788f7e7>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/dashboard",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F4CA}</span> Dashboard `);
          } else {
            return [
              createVNode("span", { class: "nav-icon" }, "\u{1F4CA}"),
              createTextVNode(" Dashboard ")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(canAccessModule)("cad")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/cad",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F6A8}</span> CAD `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F6A8}"),
                createTextVNode(" CAD ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("mdt")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/mdt",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F4F1}</span> MDT `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F4F1}"),
                createTextVNode(" MDT ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("epcr")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/epcr",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F4CB}</span> ePCR `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F4CB}"),
                createTextVNode(" ePCR ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("transport")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/transport",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F691}</span> Transport `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F691}"),
                createTextVNode(" Transport ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("hems")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/hems",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F681}</span> HEMS `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F681}"),
                createTextVNode(" HEMS ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("fire")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/fire",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F525}</span> Fire `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F525}"),
                createTextVNode(" Fire ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("scheduling")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/scheduling",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F4C5}</span> Schedule `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F4C5}"),
                createTextVNode(" Schedule ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("billing")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/billing",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F4B0}</span> Billing `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F4B0}"),
                createTextVNode(" Billing ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(canAccessModule)("hr")) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/hr",
          class: "nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="nav-icon" data-v-3788f7e7${_scopeId}>\u{1F465}</span> HR `);
            } else {
              return [
                createVNode("span", { class: "nav-icon" }, "\u{1F465}"),
                createTextVNode(" HR ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</nav><div class="header-actions" data-v-3788f7e7><div class="user-info" data-v-3788f7e7><span class="user-name" data-v-3788f7e7>${ssrInterpolate((_a = unref(employee)) == null ? void 0 : _a.first_name)} ${ssrInterpolate((_b = unref(employee)) == null ? void 0 : _b.last_name)}</span><span class="user-role" data-v-3788f7e7>${ssrInterpolate((_c = unref(employee)) == null ? void 0 : _c.position)}</span></div><button class="btn btn-secondary btn-sm" data-v-3788f7e7>Sign Out</button></div></div></header><main class="app-main" data-v-3788f7e7>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3788f7e7"]]);

export { _default as default };
//# sourceMappingURL=default-BVUnTX0g.mjs.map
