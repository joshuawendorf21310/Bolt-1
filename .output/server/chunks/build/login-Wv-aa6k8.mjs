import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const { signIn } = useAuth();
    useRouter();
    const email = ref("");
    const password = ref("");
    const loading = ref(false);
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "login-container" }, _attrs))} data-v-0e356d6e><div class="login-card" data-v-0e356d6e><div class="login-header" data-v-0e356d6e><div class="logo" data-v-0e356d6e><span class="logo-text" data-v-0e356d6e>FUSION</span><span class="logo-accent" data-v-0e356d6e>EMS</span><span class="logo-quantum" data-v-0e356d6e>QUANTUM</span></div><p data-v-0e356d6e>Next-Generation Emergency Operations Platform</p></div><form class="login-form" data-v-0e356d6e><div class="form-group" data-v-0e356d6e><label class="form-label" data-v-0e356d6e>Email</label><input${ssrRenderAttr("value", unref(email))} type="email" class="form-input" placeholder="Enter your email" required data-v-0e356d6e></div><div class="form-group" data-v-0e356d6e><label class="form-label" data-v-0e356d6e>Password</label><input${ssrRenderAttr("value", unref(password))} type="password" class="form-input" placeholder="Enter your password" required data-v-0e356d6e></div>`);
      if (unref(error)) {
        _push(`<div class="error-message" data-v-0e356d6e>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit" class="btn btn-primary btn-lg"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-0e356d6e>${ssrInterpolate(unref(loading) ? "Signing in..." : "Sign In")}</button></form></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const login = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0e356d6e"]]);

export { login as default };
//# sourceMappingURL=login-Wv-aa6k8.mjs.map
