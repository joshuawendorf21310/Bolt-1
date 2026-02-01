import { defineComponent, ref, computed, mergeProps, unref, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderComponent, ssrRenderStyle, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
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

const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "SystemFailoverStatus",
  __ssrInlineRender: true,
  setup(__props) {
    useSupabaseClient();
    const systemStatus = ref([]);
    const dismissedAlerts = ref([]);
    const showStatusPanel = ref(false);
    const degradedComponents = computed(() => {
      return systemStatus.value.filter(
        (c) => c.component_status !== "operational" && !dismissedAlerts.value.includes(c.component_name)
      );
    });
    const hasFailures = computed(() => degradedComponents.value.length > 0);
    const overallStatus = computed(() => {
      const statuses = systemStatus.value.map((c) => c.component_status);
      if (statuses.includes("offline")) return "offline";
      if (statuses.includes("degraded")) return "degraded";
      return "operational";
    });
    const formatComponentName = (name) => {
      return name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };
    const formatTime = (timestamp) => {
      const d = new Date(timestamp);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      if (unref(hasFailures)) {
        _push(`<div class="failover-banner" data-v-89181e50><div class="failover-alerts" data-v-89181e50><!--[-->`);
        ssrRenderList(unref(degradedComponents), (component) => {
          _push(`<div class="failover-alert" data-v-89181e50><span class="alert-icon" data-v-89181e50>\u26A0\uFE0F</span><div class="alert-content" data-v-89181e50><strong data-v-89181e50>${ssrInterpolate(formatComponentName(component.component_name))} ${ssrInterpolate(component.component_status)}</strong><p data-v-89181e50>${ssrInterpolate(component.status_message)}</p>`);
          if (component.failover_active) {
            _push(`<p class="failover-mode" data-v-89181e50> Failover active: ${ssrInterpolate(component.failover_mode)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button class="dismiss-btn" data-v-89181e50>\xD7</button></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showStatusPanel)) {
        _push(`<div class="status-panel" data-v-89181e50><div class="panel-header" data-v-89181e50><h3 data-v-89181e50>System Status</h3><button class="close-btn" data-v-89181e50>\xD7</button></div><div class="status-list" data-v-89181e50><!--[-->`);
        ssrRenderList(unref(systemStatus), (component) => {
          _push(`<div class="status-item" data-v-89181e50><span class="${ssrRenderClass(["status-indicator", component.component_status])}" data-v-89181e50></span><div class="status-details" data-v-89181e50><p class="status-name" data-v-89181e50>${ssrInterpolate(formatComponentName(component.component_name))}</p><p class="status-message" data-v-89181e50>${ssrInterpolate(component.status_message)}</p></div><span class="status-time" data-v-89181e50>${ssrInterpolate(formatTime(component.last_checked))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="status-trigger" data-v-89181e50><span class="${ssrRenderClass(["status-dot", unref(overallStatus)])}" data-v-89181e50></span> System Status </button><!--]-->`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SystemFailoverStatus.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-89181e50"]]);
const usePhoneSystem = () => {
  const supabase = useSupabaseClient();
  const ESCALATION_KEYWORDS = {
    human_request: ["human", "person", "transfer", "supervisor", "manager"],
    dispute_denial: ["denied", "denial", "appeal", "reconsideration", "overturned", "not payable", "not covered"],
    legal_compliance: ["legal", "attorney", "lawyer", "compliance", "hipaa", "cms", "fraud", "audit"],
    payment_commitment: ["can't guarantee", "can't confirm payment", "payment decision", "policy exception", "out of network exception"]
  };
  const getPhoneSettings = async (userId) => {
    const { data, error } = await supabase.from("phone_system_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) {
      return await createDefaultPhoneSettings(userId);
    }
    return data;
  };
  const createDefaultPhoneSettings = async (userId) => {
    const { data, error } = await supabase.from("phone_system_settings").insert({
      user_id: userId,
      ringer_volume: 80,
      in_call_volume: 80,
      notification_volume: 60,
      ringer_muted: false,
      notifications_muted: false,
      dnd_enabled: false,
      ai_answer_first: true
    }).select().single();
    if (error) throw error;
    return data;
  };
  const updatePhoneSettings = async (userId, settings) => {
    const { data, error } = await supabase.from("phone_system_settings").update({
      ...settings,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("user_id", userId).select().single();
    if (error) throw error;
    return data;
  };
  const enableDND = async (userId, duration) => {
    const dndUntil = duration ? new Date(Date.now() + duration * 6e4).toISOString() : null;
    return await updatePhoneSettings(userId, {
      dnd_enabled: true,
      dnd_until: dndUntil
    });
  };
  const disableDND = async (userId) => {
    return await updatePhoneSettings(userId, {
      dnd_enabled: false,
      dnd_until: null
    });
  };
  const getActiveCalls = async () => {
    const { data, error } = await supabase.from("active_calls").select("*").neq("call_state", "completed").order("started_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };
  const createInboundCall = async (callData) => {
    const { data, error } = await supabase.from("active_calls").insert({
      call_sid: callData.callSid,
      direction: "inbound",
      caller_number: callData.callerNumber,
      caller_identity: callData.callerIdentity,
      call_state: "ringing"
    }).select().single();
    if (error) throw error;
    return data;
  };
  const createOutboundCall = async (callData) => {
    const { data, error } = await supabase.from("active_calls").insert({
      call_sid: callData.callSid,
      direction: "outbound",
      callee_number: callData.calleeNumber,
      call_state: "ringing",
      call_context: callData.context || {}
    }).select().single();
    if (error) throw error;
    return data;
  };
  const answerCall = async (callId, handledBy) => {
    const { data, error } = await supabase.from("active_calls").update({
      call_state: "answered",
      handled_by: handledBy,
      answered_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", callId).select().single();
    if (error) throw error;
    return data;
  };
  const declineCall = async (callId) => {
    const { data, error } = await supabase.from("active_calls").update({
      call_state: "completed",
      handled_by: "voicemail",
      ended_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", callId).select().single();
    if (error) throw error;
    return data;
  };
  const escalateCall = async (callId, trigger, keywords, aiSummary) => {
    await supabase.from("active_calls").update({
      call_state: "escalating",
      escalation_triggered: true,
      escalation_reason: trigger,
      escalation_keywords: keywords
    }).eq("id", callId);
    const { data, error } = await supabase.from("call_escalations").insert({
      call_id: callId,
      escalation_trigger: trigger,
      trigger_keywords: keywords,
      ai_summary: aiSummary
    }).select().single();
    if (error) throw error;
    return data;
  };
  const acceptEscalation = async (escalationId) => {
    const { data, error } = await supabase.from("call_escalations").update({
      escalation_accepted: true,
      founder_joined_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", escalationId).select().single();
    if (error) throw error;
    return data;
  };
  const endCall = async (callId, duration) => {
    const { data, error } = await supabase.from("active_calls").update({
      call_state: "completed",
      ended_at: (/* @__PURE__ */ new Date()).toISOString(),
      duration_seconds: duration
    }).eq("id", callId).select().single();
    if (error) throw error;
    return data;
  };
  const createVoicemail = async (voicemailData) => {
    const { data, error } = await supabase.from("voicemail_records").insert({
      call_id: voicemailData.callId,
      caller_number: voicemailData.callerNumber,
      caller_identity: voicemailData.callerIdentity,
      audio_url: voicemailData.audioUrl,
      transcript: voicemailData.transcript,
      duration_seconds: voicemailData.durationSeconds,
      voicemail_status: "new"
    }).select().single();
    if (error) throw error;
    return data;
  };
  const getVoicemails = async (status) => {
    let query = supabase.from("voicemail_records").select("*").order("created_at", { ascending: false });
    if (status) {
      query = query.eq("voicemail_status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const updateVoicemailStatus = async (voicemailId, status) => {
    const updateData = { voicemail_status: status };
    if (status === "reviewed") {
      updateData.reviewed_at = (/* @__PURE__ */ new Date()).toISOString();
    } else if (status === "resolved") {
      updateData.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    const { error } = await supabase.from("voicemail_records").update(updateData).eq("id", voicemailId);
    if (error) throw error;
  };
  const checkForEscalationKeywords = (transcript) => {
    const lowerTranscript = transcript.toLowerCase();
    for (const [trigger, keywords] of Object.entries(ESCALATION_KEYWORDS)) {
      const foundKeywords = keywords.filter((keyword) => lowerTranscript.includes(keyword.toLowerCase()));
      if (foundKeywords.length > 0) {
        return {
          triggered: true,
          keywords: foundKeywords,
          trigger
        };
      }
    }
    return { triggered: false, keywords: [], trigger: "" };
  };
  return {
    ESCALATION_KEYWORDS,
    getPhoneSettings,
    updatePhoneSettings,
    enableDND,
    disableDND,
    getActiveCalls,
    createInboundCall,
    createOutboundCall,
    answerCall,
    declineCall,
    escalateCall,
    acceptEscalation,
    endCall,
    createVoicemail,
    getVoicemails,
    updateVoicemailStatus,
    checkForEscalationKeywords
  };
};
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "PhoneSystem",
  __ssrInlineRender: true,
  setup(__props) {
    usePhoneSystem();
    const incomingCall = ref(null);
    const activeCall = ref(null);
    const isRinging = ref(false);
    const isMuted = ref(false);
    const showSettings = ref(false);
    const phoneStatus = ref("operational");
    const callDuration = ref(0);
    const aiAnswerCountdown = ref(10);
    const settings = ref({
      ringer_volume: 80,
      in_call_volume: 80,
      notification_volume: 60,
      ringer_muted: false,
      notifications_muted: false,
      dnd_enabled: false,
      dnd_until: null,
      ai_answer_first: true
    });
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    const formatDNDUntil = computed(() => {
      if (!settings.value.dnd_until) return "manually disabled";
      return new Date(settings.value.dnd_until).toLocaleTimeString();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "phone-system" }, _attrs))} data-v-23bd3f04>`);
      if (unref(incomingCall)) {
        _push(`<div class="${ssrRenderClass([{ ringing: unref(isRinging) }, "incoming-call-overlay"])}" data-v-23bd3f04><div class="incoming-call-card" data-v-23bd3f04><div class="call-icon" data-v-23bd3f04>\u{1F4DE}</div><div class="call-info" data-v-23bd3f04><h3 data-v-23bd3f04>Incoming Call</h3><p class="caller" data-v-23bd3f04>${ssrInterpolate(unref(incomingCall).caller_identity || unref(incomingCall).caller_number)}</p><p class="call-type" data-v-23bd3f04>Billing Related</p></div><div class="call-actions" data-v-23bd3f04><button class="answer-btn" data-v-23bd3f04>Answer</button><button class="decline-btn" data-v-23bd3f04>Decline</button></div>`);
        if (unref(settings).ai_answer_first) {
          _push(`<div class="ai-option" data-v-23bd3f04><p data-v-23bd3f04>AI Assistant will answer in ${ssrInterpolate(unref(aiAnswerCountdown))}s...</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeCall)) {
        _push(`<div class="active-call-panel" data-v-23bd3f04><div class="call-header" data-v-23bd3f04><span class="${ssrRenderClass([unref(activeCall).call_state, "status-indicator"])}" data-v-23bd3f04></span><span class="call-duration" data-v-23bd3f04>${ssrInterpolate(formatDuration(unref(callDuration)))}</span></div><div class="call-identity" data-v-23bd3f04><h4 data-v-23bd3f04>${ssrInterpolate(unref(activeCall).caller_identity || unref(activeCall).caller_number || unref(activeCall).callee_number)}</h4><p class="call-direction" data-v-23bd3f04>${ssrInterpolate(unref(activeCall).direction === "inbound" ? "Inbound" : "Outbound")}</p></div><div class="call-controls" data-v-23bd3f04><button class="${ssrRenderClass(["control-btn", { active: unref(isMuted) }])}" data-v-23bd3f04>${ssrInterpolate(unref(isMuted) ? "\u{1F507}" : "\u{1F3A4}")}</button><button class="end-call-btn" data-v-23bd3f04>End Call</button></div>`);
        if (unref(activeCall).escalation_triggered) {
          _push(`<div class="escalation-alert" data-v-23bd3f04><p data-v-23bd3f04>\u26A0\uFE0F Escalation Triggered</p><p class="reason" data-v-23bd3f04>${ssrInterpolate(unref(activeCall).escalation_reason)}</p><button class="takeover-btn" data-v-23bd3f04>Take Over Call</button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(activeCall).live_transcript) {
          _push(`<div class="live-transcript" data-v-23bd3f04><h5 data-v-23bd3f04>Live Transcript</h5><p data-v-23bd3f04>${ssrInterpolate(unref(activeCall).live_transcript)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="phone-controls" data-v-23bd3f04><div class="phone-status" data-v-23bd3f04><span class="${ssrRenderClass([unref(phoneStatus), "status-dot"])}" data-v-23bd3f04></span><span data-v-23bd3f04>Phone ${ssrInterpolate(unref(phoneStatus))}</span></div><button class="settings-btn" data-v-23bd3f04>\u2699\uFE0F</button></div>`);
      if (unref(showSettings)) {
        _push(`<div class="phone-settings-panel" data-v-23bd3f04><div class="settings-header" data-v-23bd3f04><h3 data-v-23bd3f04>Phone Settings</h3><button class="close-btn" data-v-23bd3f04>\xD7</button></div><div class="settings-content" data-v-23bd3f04><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04>Ringer Volume</label><input type="range"${ssrRenderAttr("value", unref(settings).ringer_volume)} min="0" max="100" data-v-23bd3f04><span data-v-23bd3f04>${ssrInterpolate(unref(settings).ringer_volume)}%</span></div><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04>In-Call Volume</label><input type="range"${ssrRenderAttr("value", unref(settings).in_call_volume)} min="0" max="100" data-v-23bd3f04><span data-v-23bd3f04>${ssrInterpolate(unref(settings).in_call_volume)}%</span></div><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04>Notification Volume</label><input type="range"${ssrRenderAttr("value", unref(settings).notification_volume)} min="0" max="100" data-v-23bd3f04><span data-v-23bd3f04>${ssrInterpolate(unref(settings).notification_volume)}%</span></div><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(settings).ringer_muted) ? ssrLooseContain(unref(settings).ringer_muted, null) : unref(settings).ringer_muted) ? " checked" : ""} data-v-23bd3f04> Mute Ringer </label></div><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(settings).ai_answer_first) ? ssrLooseContain(unref(settings).ai_answer_first, null) : unref(settings).ai_answer_first) ? " checked" : ""} data-v-23bd3f04> AI Answers First </label></div><div class="setting-group" data-v-23bd3f04><label data-v-23bd3f04>Do Not Disturb</label><button class="${ssrRenderClass(["dnd-btn", { active: unref(settings).dnd_enabled }])}" data-v-23bd3f04>${ssrInterpolate(unref(settings).dnd_enabled ? "Disable DND" : "Enable DND")}</button>`);
        if (unref(settings).dnd_enabled) {
          _push(`<div class="dnd-info" data-v-23bd3f04><p data-v-23bd3f04>Active until ${ssrInterpolate(unref(formatDNDUntil))}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(settings).dnd_enabled) {
        _push(`<div class="dnd-indicator" data-v-23bd3f04> \u{1F319} Do Not Disturb </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PhoneSystem.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-23bd3f04"]]);
const useBillingWorkspace = () => {
  const supabase = useSupabaseClient();
  const getEmailThreads = async (filters) => {
    let query = supabase.from("billing_emails").select("*").order("created_at", { ascending: false });
    if (filters == null ? void 0 : filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters == null ? void 0 : filters.linkedAgencyId) {
      query = query.eq("linked_agency_id", filters.linkedAgencyId);
    }
    if (filters == null ? void 0 : filters.linkedClaimId) {
      query = query.eq("linked_claim_id", filters.linkedClaimId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const sendEmail = async (emailData) => {
    const threadId = `thread-${Date.now()}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.from("billing_emails").insert({
      thread_id: threadId,
      message_id: messageId,
      subject: emailData.subject,
      from_address: "billing@malibuems.com",
      to_addresses: emailData.toAddresses,
      cc_addresses: emailData.ccAddresses || [],
      body_text: emailData.bodyText,
      body_html: emailData.bodyHtml || emailData.bodyText,
      direction: "outbound",
      status: "sent",
      linked_agency_id: emailData.linkedAgencyId,
      linked_claim_id: emailData.linkedClaimId,
      linked_encounter_id: emailData.linkedEncounterId,
      sent_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    await logActivity({
      activityType: "email_sent",
      entityType: "email",
      entityId: data.id,
      description: `Sent email: ${emailData.subject}`,
      metadata: { to: emailData.toAddresses }
    });
    return data;
  };
  const archiveEmail = async (emailId) => {
    const { error } = await supabase.from("billing_emails").update({ status: "archived" }).eq("id", emailId);
    if (error) throw error;
  };
  const updateEmailNotes = async (emailId, notes) => {
    const { error } = await supabase.from("billing_emails").update({ internal_notes: notes }).eq("id", emailId);
    if (error) throw error;
  };
  const getAICalls = async (filters) => {
    let query = supabase.from("ai_phone_calls").select("*").order("created_at", { ascending: false });
    if (filters == null ? void 0 : filters.status) {
      query = query.eq("call_status", filters.status);
    }
    if ((filters == null ? void 0 : filters.escalationRequired) !== void 0) {
      query = query.eq("escalation_required", filters.escalationRequired);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const initiateAICall = async (callData) => {
    const { data, error } = await supabase.from("ai_phone_calls").insert({
      phone_number: callData.phoneNumber,
      direction: "outbound",
      call_purpose: callData.purpose,
      organization_name: callData.organizationName,
      call_status: "initiated",
      linked_agency_id: callData.linkedAgencyId,
      linked_claim_id: callData.linkedClaimId,
      linked_encounter_id: callData.linkedEncounterId,
      started_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    await logActivity({
      activityType: "call_made",
      entityType: "phone_call",
      entityId: data.id,
      description: `Initiated AI call to ${callData.organizationName}`,
      metadata: { purpose: callData.purpose }
    });
    return data;
  };
  const updateCallStatus = async (callId, status, updates) => {
    const updateData = { call_status: status };
    if (status === "completed") {
      updateData.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (updates) {
      Object.assign(updateData, updates);
    }
    const { error } = await supabase.from("ai_phone_calls").update(updateData).eq("id", callId);
    if (error) throw error;
  };
  const markCallReviewed = async (callId) => {
    const { error } = await supabase.from("ai_phone_calls").update({ founder_reviewed: true }).eq("id", callId);
    if (error) throw error;
  };
  const getFaxes = async (filters) => {
    let query = supabase.from("billing_faxes").select("*").order("created_at", { ascending: false });
    if (filters == null ? void 0 : filters.direction) {
      query = query.eq("direction", filters.direction);
    }
    if (filters == null ? void 0 : filters.status) {
      query = query.eq("status", filters.status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const sendFax = async (faxData) => {
    const { data, error } = await supabase.from("billing_faxes").insert({
      fax_number: faxData.faxNumber,
      direction: "outbound",
      status: "sending",
      pdf_url: faxData.pdfUrl,
      purpose: faxData.purpose,
      linked_agency_id: faxData.linkedAgencyId,
      linked_claim_id: faxData.linkedClaimId,
      linked_encounter_id: faxData.linkedEncounterId
    }).select().single();
    if (error) throw error;
    await logActivity({
      activityType: "fax_sent",
      entityType: "fax",
      entityId: data.id,
      description: `Sent fax to ${faxData.faxNumber}`,
      metadata: { purpose: faxData.purpose }
    });
    return data;
  };
  const getDocuments = async (filters) => {
    let query = supabase.from("workspace_documents").select("*").order("updated_at", { ascending: false });
    if (filters == null ? void 0 : filters.documentType) {
      query = query.eq("document_type", filters.documentType);
    }
    if (filters == null ? void 0 : filters.organizationType) {
      query = query.eq("organization_type", filters.organizationType);
    }
    if ((filters == null ? void 0 : filters.isFinalized) !== void 0) {
      query = query.eq("is_finalized", filters.isFinalized);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const createDocument = async (documentData) => {
    const { data, error } = await supabase.from("workspace_documents").insert({
      document_name: documentData.documentName,
      document_type: documentData.documentType,
      mime_type: documentData.mimeType,
      storage_path: documentData.storagePath,
      organization_type: documentData.organizationType,
      linked_agency_id: documentData.linkedAgencyId,
      linked_claim_id: documentData.linkedClaimId,
      linked_encounter_id: documentData.linkedEncounterId,
      billing_period: documentData.billingPeriod,
      tags: documentData.tags || []
    }).select().single();
    if (error) throw error;
    await createDocumentVersion(data.id, 1, documentData.storagePath, "Initial version");
    await logActivity({
      activityType: "document_created",
      entityType: "document",
      entityId: data.id,
      description: `Created document: ${documentData.documentName}`,
      metadata: { type: documentData.documentType }
    });
    return data;
  };
  const updateDocument = async (documentId, storagePath, changeSummary) => {
    const { data: doc } = await supabase.from("workspace_documents").select("current_version").eq("id", documentId).maybeSingle();
    if (!doc) throw new Error("Document not found");
    const newVersion = doc.current_version + 1;
    await supabase.from("workspace_documents").update({
      storage_path: storagePath,
      current_version: newVersion,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", documentId);
    await createDocumentVersion(documentId, newVersion, storagePath, changeSummary || "Updated");
    await logActivity({
      activityType: "document_edited",
      entityType: "document",
      entityId: documentId,
      description: `Updated document to version ${newVersion}`,
      metadata: { version: newVersion }
    });
  };
  const finalizeDocument = async (documentId) => {
    const { error } = await supabase.from("workspace_documents").update({
      is_finalized: true,
      finalized_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", documentId);
    if (error) throw error;
    await logActivity({
      activityType: "document_finalized",
      entityType: "document",
      entityId: documentId,
      description: "Document finalized (immutable)",
      metadata: {}
    });
  };
  const createDocumentVersion = async (documentId, versionNumber, storagePath, changeSummary) => {
    const { error } = await supabase.from("document_versions").insert({
      document_id: documentId,
      version_number: versionNumber,
      storage_path: storagePath,
      change_summary: changeSummary
    });
    if (error) throw error;
  };
  const getDocumentVersions = async (documentId) => {
    const { data, error } = await supabase.from("document_versions").select("*").eq("document_id", documentId).order("version_number", { ascending: false });
    if (error) throw error;
    return data || [];
  };
  const addPDFAnnotation = async (annotationData) => {
    const { data, error } = await supabase.from("pdf_annotations").insert({
      document_id: annotationData.documentId,
      page_number: annotationData.pageNumber,
      annotation_type: annotationData.annotationType,
      annotation_data: annotationData.annotationData,
      annotation_text: annotationData.annotationText
    }).select().single();
    if (error) throw error;
    await logActivity({
      activityType: "pdf_annotated",
      entityType: "document",
      entityId: annotationData.documentId,
      description: `Added ${annotationData.annotationType} annotation to page ${annotationData.pageNumber}`,
      metadata: { page: annotationData.pageNumber, type: annotationData.annotationType }
    });
    return data;
  };
  const getPDFAnnotations = async (documentId) => {
    const { data, error } = await supabase.from("pdf_annotations").select("*").eq("document_id", documentId).order("page_number");
    if (error) throw error;
    return data || [];
  };
  const getActivityLog = async (limit = 50) => {
    const { data, error } = await supabase.from("workspace_activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  };
  const logActivity = async (activityData) => {
    await supabase.from("workspace_activity_log").insert({
      activity_type: activityData.activityType,
      entity_type: activityData.entityType,
      entity_id: activityData.entityId,
      activity_description: activityData.description,
      metadata: activityData.metadata
    });
  };
  const getWorkspaceDashboard = async () => {
    const { data: emails } = await supabase.from("billing_emails").select("id, status");
    const { data: calls } = await supabase.from("ai_phone_calls").select("id, call_status, escalation_required");
    const { data: faxes } = await supabase.from("billing_faxes").select("id, status");
    const { data: documents } = await supabase.from("workspace_documents").select("id, is_finalized");
    const unreadEmails = (emails == null ? void 0 : emails.filter((e) => e.status === "received").length) || 0;
    const pendingCalls = (calls == null ? void 0 : calls.filter((c) => c.call_status === "requires_review").length) || 0;
    const escalatedCalls = (calls == null ? void 0 : calls.filter((c) => c.escalation_required && !c.founder_reviewed).length) || 0;
    const pendingFaxes = (faxes == null ? void 0 : faxes.filter((f) => f.status === "sending").length) || 0;
    const draftDocuments = (documents == null ? void 0 : documents.filter((d) => !d.is_finalized).length) || 0;
    return {
      totalEmails: (emails == null ? void 0 : emails.length) || 0,
      unreadEmails,
      totalCalls: (calls == null ? void 0 : calls.length) || 0,
      pendingCalls,
      escalatedCalls,
      totalFaxes: (faxes == null ? void 0 : faxes.length) || 0,
      pendingFaxes,
      totalDocuments: (documents == null ? void 0 : documents.length) || 0,
      draftDocuments
    };
  };
  return {
    getEmailThreads,
    sendEmail,
    archiveEmail,
    updateEmailNotes,
    getAICalls,
    initiateAICall,
    updateCallStatus,
    markCallReviewed,
    getFaxes,
    sendFax,
    getDocuments,
    createDocument,
    updateDocument,
    finalizeDocument,
    getDocumentVersions,
    addPDFAnnotation,
    getPDFAnnotations,
    getActivityLog,
    getWorkspaceDashboard
  };
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "BillingEmailCenter",
  __ssrInlineRender: true,
  setup(__props) {
    const { getEmailThreads } = useBillingWorkspace();
    const emails = ref([]);
    const selectedEmail = ref(null);
    const showCompose = ref(false);
    const filterStatus = ref("");
    const loading = ref(true);
    const composeData = ref({
      to: "",
      cc: "",
      subject: "",
      body: ""
    });
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    };
    const loadEmails = async () => {
      loading.value = true;
      const filters = {};
      if (filterStatus.value) {
        filters.status = filterStatus.value;
      }
      emails.value = await getEmailThreads(filters);
      loading.value = false;
    };
    watch(filterStatus, () => {
      loadEmails();
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "email-center" }, _attrs))} data-v-d7bc254f><div class="email-header" data-v-d7bc254f><h3 data-v-d7bc254f>Billing Email (Malibu)</h3><button class="compose-btn" data-v-d7bc254f>Compose Email</button></div><div class="email-filters" data-v-d7bc254f><!--[-->`);
      ssrRenderList(["all", "sent", "received", "archived"], (status) => {
        _push(`<button class="${ssrRenderClass(["filter-btn", { active: unref(filterStatus) === (status === "all" ? "" : status) }])}" data-v-d7bc254f>${ssrInterpolate(status.charAt(0).toUpperCase() + status.slice(1))}</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-d7bc254f>Loading emails...</div>`);
      } else if (unref(emails).length === 0) {
        _push(`<div class="empty-state" data-v-d7bc254f> No emails found </div>`);
      } else {
        _push(`<div class="email-list" data-v-d7bc254f><!--[-->`);
        ssrRenderList(unref(emails), (email) => {
          var _a2;
          _push(`<div class="${ssrRenderClass([{ selected: ((_a2 = unref(selectedEmail)) == null ? void 0 : _a2.id) === email.id }, "email-item"])}" data-v-d7bc254f><div class="email-meta" data-v-d7bc254f><span class="${ssrRenderClass([email.direction, "email-direction"])}" data-v-d7bc254f>${ssrInterpolate(email.direction === "inbound" ? "\u2190" : "\u2192")}</span><span class="email-from" data-v-d7bc254f>${ssrInterpolate(email.from_address)}</span><span class="email-date" data-v-d7bc254f>${ssrInterpolate(formatDate(email.created_at))}</span></div><div class="email-subject" data-v-d7bc254f>${ssrInterpolate(email.subject || "(No Subject)")}</div>`);
          if (email.tags && email.tags.length > 0) {
            _push(`<div class="email-tags" data-v-d7bc254f><!--[-->`);
            ssrRenderList(email.tags, (tag) => {
              _push(`<span class="tag" data-v-d7bc254f>${ssrInterpolate(tag)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedEmail)) {
        _push(`<div class="email-viewer" data-v-d7bc254f><div class="viewer-header" data-v-d7bc254f><h4 data-v-d7bc254f>${ssrInterpolate(unref(selectedEmail).subject || "(No Subject)")}</h4><button class="close-btn" data-v-d7bc254f>\xD7</button></div><div class="email-details" data-v-d7bc254f><div class="detail-row" data-v-d7bc254f><span class="label" data-v-d7bc254f>From:</span><span data-v-d7bc254f>${ssrInterpolate(unref(selectedEmail).from_address)}</span></div><div class="detail-row" data-v-d7bc254f><span class="label" data-v-d7bc254f>To:</span><span data-v-d7bc254f>${ssrInterpolate(unref(selectedEmail).to_addresses.join(", "))}</span></div>`);
        if (unref(selectedEmail).cc_addresses.length > 0) {
          _push(`<div class="detail-row" data-v-d7bc254f><span class="label" data-v-d7bc254f>CC:</span><span data-v-d7bc254f>${ssrInterpolate(unref(selectedEmail).cc_addresses.join(", "))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="detail-row" data-v-d7bc254f><span class="label" data-v-d7bc254f>Date:</span><span data-v-d7bc254f>${ssrInterpolate(formatDateTime(unref(selectedEmail).created_at))}</span></div></div><div class="email-body" data-v-d7bc254f>${(_a = unref(selectedEmail).body_html || unref(selectedEmail).body_text) != null ? _a : ""}</div><div class="email-notes" data-v-d7bc254f><h5 data-v-d7bc254f>Internal Notes</h5><textarea placeholder="Add internal notes..." data-v-d7bc254f>${ssrInterpolate(unref(selectedEmail).internal_notes)}</textarea></div><div class="email-actions" data-v-d7bc254f><button class="action-btn" data-v-d7bc254f>Archive</button><button class="action-btn primary" data-v-d7bc254f>Reply</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showCompose)) {
        _push(`<div class="compose-modal" data-v-d7bc254f><div class="modal-content" data-v-d7bc254f><div class="modal-header" data-v-d7bc254f><h4 data-v-d7bc254f>Compose Email</h4><button class="close-btn" data-v-d7bc254f>\xD7</button></div><div class="compose-form" data-v-d7bc254f><div class="form-field" data-v-d7bc254f><label data-v-d7bc254f>To:</label><input${ssrRenderAttr("value", unref(composeData).to)} type="email" placeholder="recipient@example.com" data-v-d7bc254f></div><div class="form-field" data-v-d7bc254f><label data-v-d7bc254f>CC:</label><input${ssrRenderAttr("value", unref(composeData).cc)} type="email" placeholder="cc@example.com (optional)" data-v-d7bc254f></div><div class="form-field" data-v-d7bc254f><label data-v-d7bc254f>Subject:</label><input${ssrRenderAttr("value", unref(composeData).subject)} type="text" placeholder="Email subject" data-v-d7bc254f></div><div class="form-field" data-v-d7bc254f><label data-v-d7bc254f>Message:</label><textarea rows="10" placeholder="Email body..." data-v-d7bc254f>${ssrInterpolate(unref(composeData).body)}</textarea></div><div class="form-actions" data-v-d7bc254f><button class="cancel-btn" data-v-d7bc254f>Cancel</button><button class="send-btn" data-v-d7bc254f>Send Email</button></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BillingEmailCenter.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-d7bc254f"]]);
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "AIPhoneAssistant",
  __ssrInlineRender: true,
  setup(__props) {
    const { getAICalls } = useBillingWorkspace();
    const calls = ref([]);
    const selectedCall = ref(null);
    const showInitiate = ref(false);
    const currentFilter = ref("all");
    const loading = ref(true);
    const callData = ref({
      organizationName: "",
      phoneNumber: "",
      purpose: "eligibility"
    });
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString("en-US");
    };
    const loadCalls = async () => {
      loading.value = true;
      const filters = {};
      if (currentFilter.value === "requires_review") {
        filters.status = "requires_review";
      } else if (currentFilter.value === "escalated") {
        filters.escalationRequired = true;
      }
      calls.value = await getAICalls(filters);
      loading.value = false;
    };
    watch(currentFilter, () => {
      loadCalls();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "phone-assistant" }, _attrs))} data-v-ede29ec5><div class="assistant-header" data-v-ede29ec5><h3 data-v-ede29ec5>AI Phone Assistant</h3><button class="initiate-btn" data-v-ede29ec5>New Call</button></div><div class="call-filters" data-v-ede29ec5><!--[-->`);
      ssrRenderList(["all", "requires_review", "escalated"], (filter) => {
        _push(`<button class="${ssrRenderClass(["filter-btn", { active: unref(currentFilter) === filter }])}" data-v-ede29ec5>${ssrInterpolate(filter === "all" ? "All Calls" : filter === "requires_review" ? "Needs Review" : "Escalated")}</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-ede29ec5>Loading calls...</div>`);
      } else if (unref(calls).length === 0) {
        _push(`<div class="empty-state" data-v-ede29ec5> No calls found </div>`);
      } else {
        _push(`<div class="call-list" data-v-ede29ec5><!--[-->`);
        ssrRenderList(unref(calls), (call) => {
          _push(`<div class="${ssrRenderClass([{ escalated: call.escalation_required }, "call-item"])}" data-v-ede29ec5><div class="call-header" data-v-ede29ec5><span class="call-org" data-v-ede29ec5>${ssrInterpolate(call.organization_name)}</span><span class="${ssrRenderClass(["call-status", call.call_status])}" data-v-ede29ec5>${ssrInterpolate(call.call_status)}</span></div><div class="call-details" data-v-ede29ec5><span class="call-purpose" data-v-ede29ec5>${ssrInterpolate(call.call_purpose)}</span><span class="call-phone" data-v-ede29ec5>${ssrInterpolate(call.phone_number)}</span><span class="call-date" data-v-ede29ec5>${ssrInterpolate(formatDate(call.created_at))}</span></div>`);
          if (call.escalation_required) {
            _push(`<div class="escalation-badge" data-v-ede29ec5> \u26A0 Escalation Required </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedCall)) {
        _push(`<div class="call-viewer" data-v-ede29ec5><div class="viewer-header" data-v-ede29ec5><h4 data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).organization_name)}</h4><button class="close-btn" data-v-ede29ec5>\xD7</button></div><div class="call-info" data-v-ede29ec5><div class="info-row" data-v-ede29ec5><span class="label" data-v-ede29ec5>Purpose:</span><span data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).call_purpose)}</span></div><div class="info-row" data-v-ede29ec5><span class="label" data-v-ede29ec5>Status:</span><span data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).call_status)}</span></div><div class="info-row" data-v-ede29ec5><span class="label" data-v-ede29ec5>Duration:</span><span data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).duration_seconds)}s</span></div><div class="info-row" data-v-ede29ec5><span class="label" data-v-ede29ec5>Started:</span><span data-v-ede29ec5>${ssrInterpolate(formatDateTime(unref(selectedCall).started_at))}</span></div></div>`);
        if (unref(selectedCall).summary) {
          _push(`<div class="call-summary" data-v-ede29ec5><h5 data-v-ede29ec5>Summary</h5><p data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedCall).outcome) {
          _push(`<div class="call-outcome" data-v-ede29ec5><h5 data-v-ede29ec5>Outcome</h5><p data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).outcome)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedCall).transcript) {
          _push(`<div class="call-transcript" data-v-ede29ec5><h5 data-v-ede29ec5>Transcript</h5><pre data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).transcript)}</pre></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedCall).escalation_required) {
          _push(`<div class="escalation-section" data-v-ede29ec5><h5 data-v-ede29ec5>Escalation Required</h5><p data-v-ede29ec5>${ssrInterpolate(unref(selectedCall).escalation_reason)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="call-actions" data-v-ede29ec5>`);
        if (!unref(selectedCall).founder_reviewed) {
          _push(`<button class="action-btn primary" data-v-ede29ec5> Mark as Reviewed </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedCall).recording_url) {
          _push(`<button class="action-btn" data-v-ede29ec5>Listen to Recording</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showInitiate)) {
        _push(`<div class="initiate-modal" data-v-ede29ec5><div class="modal-content" data-v-ede29ec5><div class="modal-header" data-v-ede29ec5><h4 data-v-ede29ec5>Initiate AI Call</h4><button class="close-btn" data-v-ede29ec5>\xD7</button></div><div class="initiate-form" data-v-ede29ec5><div class="form-field" data-v-ede29ec5><label data-v-ede29ec5>Organization Name:</label><input${ssrRenderAttr("value", unref(callData).organizationName)} type="text" placeholder="Insurance Company Name" data-v-ede29ec5></div><div class="form-field" data-v-ede29ec5><label data-v-ede29ec5>Phone Number:</label><input${ssrRenderAttr("value", unref(callData).phoneNumber)} type="tel" placeholder="(555) 123-4567" data-v-ede29ec5></div><div class="form-field" data-v-ede29ec5><label data-v-ede29ec5>Purpose:</label><select data-v-ede29ec5><option value="eligibility" data-v-ede29ec5${ssrIncludeBooleanAttr(Array.isArray(unref(callData).purpose) ? ssrLooseContain(unref(callData).purpose, "eligibility") : ssrLooseEqual(unref(callData).purpose, "eligibility")) ? " selected" : ""}>Eligibility Verification</option><option value="claim_status" data-v-ede29ec5${ssrIncludeBooleanAttr(Array.isArray(unref(callData).purpose) ? ssrLooseContain(unref(callData).purpose, "claim_status") : ssrLooseEqual(unref(callData).purpose, "claim_status")) ? " selected" : ""}>Claim Status</option><option value="follow_up" data-v-ede29ec5${ssrIncludeBooleanAttr(Array.isArray(unref(callData).purpose) ? ssrLooseContain(unref(callData).purpose, "follow_up") : ssrLooseEqual(unref(callData).purpose, "follow_up")) ? " selected" : ""}>Follow Up</option><option value="escalation" data-v-ede29ec5${ssrIncludeBooleanAttr(Array.isArray(unref(callData).purpose) ? ssrLooseContain(unref(callData).purpose, "escalation") : ssrLooseEqual(unref(callData).purpose, "escalation")) ? " selected" : ""}>Escalation</option><option value="other" data-v-ede29ec5${ssrIncludeBooleanAttr(Array.isArray(unref(callData).purpose) ? ssrLooseContain(unref(callData).purpose, "other") : ssrLooseEqual(unref(callData).purpose, "other")) ? " selected" : ""}>Other</option></select></div><div class="form-actions" data-v-ede29ec5><button class="cancel-btn" data-v-ede29ec5>Cancel</button><button class="initiate-btn-submit" data-v-ede29ec5>Initiate Call</button></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AIPhoneAssistant.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-ede29ec5"]]);
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "BillingFaxCenter",
  __ssrInlineRender: true,
  setup(__props) {
    useBillingWorkspace();
    const faxes = ref([]);
    const selectedFax = ref(null);
    const showSend = ref(false);
    const loading = ref(true);
    const faxData = ref({
      faxNumber: "",
      purpose: "claim_submission",
      pdfFile: null
    });
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString("en-US");
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fax-center" }, _attrs))} data-v-613b6b93><div class="fax-header" data-v-613b6b93><h3 data-v-613b6b93>Billing Fax</h3><button class="send-btn" data-v-613b6b93>Send Fax</button></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-613b6b93>Loading faxes...</div>`);
      } else if (unref(faxes).length === 0) {
        _push(`<div class="empty-state" data-v-613b6b93> No faxes found </div>`);
      } else {
        _push(`<div class="fax-list" data-v-613b6b93><!--[-->`);
        ssrRenderList(unref(faxes), (fax) => {
          _push(`<div class="fax-item" data-v-613b6b93><div class="fax-header-item" data-v-613b6b93><span class="${ssrRenderClass([fax.direction, "fax-direction"])}" data-v-613b6b93>${ssrInterpolate(fax.direction === "inbound" ? "\u{1F4E5}" : "\u{1F4E4}")}</span><span class="fax-number" data-v-613b6b93>${ssrInterpolate(fax.fax_number)}</span><span class="${ssrRenderClass(["fax-status", fax.status])}" data-v-613b6b93>${ssrInterpolate(fax.status)}</span></div><div class="fax-details" data-v-613b6b93><span class="fax-purpose" data-v-613b6b93>${ssrInterpolate(fax.purpose || "General")}</span><span class="fax-pages" data-v-613b6b93>${ssrInterpolate(fax.page_count)} ${ssrInterpolate(fax.page_count === 1 ? "page" : "pages")}</span><span class="fax-date" data-v-613b6b93>${ssrInterpolate(formatDate(fax.created_at))}</span></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedFax)) {
        _push(`<div class="fax-viewer" data-v-613b6b93><div class="viewer-content" data-v-613b6b93><div class="viewer-header" data-v-613b6b93><h4 data-v-613b6b93>Fax Details</h4><button class="close-btn" data-v-613b6b93>\xD7</button></div><div class="fax-info" data-v-613b6b93><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Number:</span><span data-v-613b6b93>${ssrInterpolate(unref(selectedFax).fax_number)}</span></div><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Direction:</span><span data-v-613b6b93>${ssrInterpolate(unref(selectedFax).direction)}</span></div><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Status:</span><span data-v-613b6b93>${ssrInterpolate(unref(selectedFax).status)}</span></div><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Pages:</span><span data-v-613b6b93>${ssrInterpolate(unref(selectedFax).page_count)}</span></div><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Purpose:</span><span data-v-613b6b93>${ssrInterpolate(unref(selectedFax).purpose || "General")}</span></div><div class="info-row" data-v-613b6b93><span class="label" data-v-613b6b93>Date:</span><span data-v-613b6b93>${ssrInterpolate(formatDateTime(unref(selectedFax).created_at))}</span></div></div>`);
        if (unref(selectedFax).ocr_text) {
          _push(`<div class="fax-ocr" data-v-613b6b93><h5 data-v-613b6b93>Extracted Text (OCR)</h5><pre data-v-613b6b93>${ssrInterpolate(unref(selectedFax).ocr_text)}</pre></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="fax-actions" data-v-613b6b93>`);
        if (unref(selectedFax).pdf_url) {
          _push(`<button class="action-btn" data-v-613b6b93>View PDF</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedFax).fax_image_url) {
          _push(`<button class="action-btn" data-v-613b6b93>View Original</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showSend)) {
        _push(`<div class="send-modal" data-v-613b6b93><div class="modal-content" data-v-613b6b93><div class="modal-header" data-v-613b6b93><h4 data-v-613b6b93>Send Fax</h4><button class="close-btn" data-v-613b6b93>\xD7</button></div><div class="send-form" data-v-613b6b93><div class="form-field" data-v-613b6b93><label data-v-613b6b93>Fax Number:</label><input${ssrRenderAttr("value", unref(faxData).faxNumber)} type="tel" placeholder="+1 (555) 123-4567" data-v-613b6b93></div><div class="form-field" data-v-613b6b93><label data-v-613b6b93>Purpose:</label><select data-v-613b6b93><option value="eob" data-v-613b6b93${ssrIncludeBooleanAttr(Array.isArray(unref(faxData).purpose) ? ssrLooseContain(unref(faxData).purpose, "eob") : ssrLooseEqual(unref(faxData).purpose, "eob")) ? " selected" : ""}>EOB</option><option value="prior_auth" data-v-613b6b93${ssrIncludeBooleanAttr(Array.isArray(unref(faxData).purpose) ? ssrLooseContain(unref(faxData).purpose, "prior_auth") : ssrLooseEqual(unref(faxData).purpose, "prior_auth")) ? " selected" : ""}>Prior Authorization</option><option value="claim_submission" data-v-613b6b93${ssrIncludeBooleanAttr(Array.isArray(unref(faxData).purpose) ? ssrLooseContain(unref(faxData).purpose, "claim_submission") : ssrLooseEqual(unref(faxData).purpose, "claim_submission")) ? " selected" : ""}>Claim Submission</option><option value="payer_correspondence" data-v-613b6b93${ssrIncludeBooleanAttr(Array.isArray(unref(faxData).purpose) ? ssrLooseContain(unref(faxData).purpose, "payer_correspondence") : ssrLooseEqual(unref(faxData).purpose, "payer_correspondence")) ? " selected" : ""}>Payer Correspondence</option><option value="other" data-v-613b6b93${ssrIncludeBooleanAttr(Array.isArray(unref(faxData).purpose) ? ssrLooseContain(unref(faxData).purpose, "other") : ssrLooseEqual(unref(faxData).purpose, "other")) ? " selected" : ""}>Other</option></select></div><div class="form-field" data-v-613b6b93><label data-v-613b6b93>PDF Document:</label><input type="file" accept=".pdf" data-v-613b6b93></div><div class="form-actions" data-v-613b6b93><button class="cancel-btn" data-v-613b6b93>Cancel</button><button class="send-btn-submit" data-v-613b6b93>Send Fax</button></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BillingFaxCenter.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-613b6b93"]]);
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "DocumentWorkspace",
  __ssrInlineRender: true,
  setup(__props) {
    const { getDocuments } = useBillingWorkspace();
    const documents = ref([]);
    const selectedDocument = ref(null);
    const showCreate = ref(false);
    const filterType = ref("");
    const loading = ref(true);
    const createData = ref({
      documentName: "",
      documentType: "word",
      organizationType: "general"
    });
    const getDocIcon = (type) => {
      const icons = {
        word: "\u{1F4DD}",
        excel: "\u{1F4CA}",
        powerpoint: "\u{1F4FD}\uFE0F",
        pdf: "\u{1F4C4}",
        text: "\u{1F4C3}"
      };
      return icons[type] || "\u{1F4C4}";
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString("en-US");
    };
    const loadDocuments = async () => {
      loading.value = true;
      const filters = {};
      if (filterType.value) {
        filters.documentType = filterType.value;
      }
      documents.value = await getDocuments(filters);
      loading.value = false;
    };
    watch(filterType, () => {
      loadDocuments();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "document-workspace" }, _attrs))} data-v-fce11ada><div class="workspace-header" data-v-fce11ada><h3 data-v-fce11ada>Document Workspace</h3><button class="create-btn" data-v-fce11ada>New Document</button></div><div class="document-filters" data-v-fce11ada><!--[-->`);
      ssrRenderList(["all", "word", "excel", "powerpoint", "pdf"], (type) => {
        _push(`<button class="${ssrRenderClass(["filter-btn", { active: unref(filterType) === (type === "all" ? "" : type) }])}" data-v-fce11ada>${ssrInterpolate(type.charAt(0).toUpperCase() + type.slice(1))}</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-fce11ada>Loading documents...</div>`);
      } else if (unref(documents).length === 0) {
        _push(`<div class="empty-state" data-v-fce11ada> No documents found </div>`);
      } else {
        _push(`<div class="document-grid" data-v-fce11ada><!--[-->`);
        ssrRenderList(unref(documents), (doc) => {
          _push(`<div class="document-card" data-v-fce11ada><div class="doc-icon" data-v-fce11ada>${ssrInterpolate(getDocIcon(doc.document_type))}</div><div class="doc-info" data-v-fce11ada><div class="doc-name" data-v-fce11ada>${ssrInterpolate(doc.document_name)}</div><div class="doc-meta" data-v-fce11ada><span class="doc-type" data-v-fce11ada>${ssrInterpolate(doc.document_type)}</span><span class="doc-version" data-v-fce11ada>v${ssrInterpolate(doc.current_version)}</span>`);
          if (doc.is_finalized) {
            _push(`<span class="doc-finalized" data-v-fce11ada>\u{1F512} Finalized</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="doc-date" data-v-fce11ada>Updated ${ssrInterpolate(formatDate(doc.updated_at))}</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(selectedDocument)) {
        _push(`<div class="document-viewer" data-v-fce11ada><div class="viewer-content" data-v-fce11ada><div class="viewer-header" data-v-fce11ada><h4 data-v-fce11ada>${ssrInterpolate(unref(selectedDocument).document_name)}</h4><button class="close-btn" data-v-fce11ada>\xD7</button></div><div class="doc-details" data-v-fce11ada><div class="detail-row" data-v-fce11ada><span class="label" data-v-fce11ada>Type:</span><span data-v-fce11ada>${ssrInterpolate(unref(selectedDocument).document_type)}</span></div><div class="detail-row" data-v-fce11ada><span class="label" data-v-fce11ada>Version:</span><span data-v-fce11ada>${ssrInterpolate(unref(selectedDocument).current_version)}</span></div><div class="detail-row" data-v-fce11ada><span class="label" data-v-fce11ada>Status:</span><span data-v-fce11ada>${ssrInterpolate(unref(selectedDocument).is_finalized ? "Finalized (Immutable)" : "Draft (Editable)")}</span></div><div class="detail-row" data-v-fce11ada><span class="label" data-v-fce11ada>Created:</span><span data-v-fce11ada>${ssrInterpolate(formatDateTime(unref(selectedDocument).created_at))}</span></div><div class="detail-row" data-v-fce11ada><span class="label" data-v-fce11ada>Updated:</span><span data-v-fce11ada>${ssrInterpolate(formatDateTime(unref(selectedDocument).updated_at))}</span></div></div><div class="doc-editor" data-v-fce11ada><div class="editor-placeholder" data-v-fce11ada><p data-v-fce11ada>Document editor interface</p><p class="editor-note" data-v-fce11ada>Cloud-based editing with automatic version control</p></div></div><div class="doc-actions" data-v-fce11ada><button class="action-btn" data-v-fce11ada>View Versions</button>`);
        if (!unref(selectedDocument).is_finalized) {
          _push(`<button class="action-btn" data-v-fce11ada> Finalize Document </button>`);
        } else {
          _push(`<!---->`);
        }
        if (!unref(selectedDocument).is_finalized) {
          _push(`<button class="action-btn primary" data-v-fce11ada>Save Changes</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showCreate)) {
        _push(`<div class="create-modal" data-v-fce11ada><div class="modal-content" data-v-fce11ada><div class="modal-header" data-v-fce11ada><h4 data-v-fce11ada>Create New Document</h4><button class="close-btn" data-v-fce11ada>\xD7</button></div><div class="create-form" data-v-fce11ada><div class="form-field" data-v-fce11ada><label data-v-fce11ada>Document Name:</label><input${ssrRenderAttr("value", unref(createData).documentName)} type="text" placeholder="My Document" data-v-fce11ada></div><div class="form-field" data-v-fce11ada><label data-v-fce11ada>Document Type:</label><select data-v-fce11ada><option value="word" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).documentType) ? ssrLooseContain(unref(createData).documentType, "word") : ssrLooseEqual(unref(createData).documentType, "word")) ? " selected" : ""}>Word Document</option><option value="excel" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).documentType) ? ssrLooseContain(unref(createData).documentType, "excel") : ssrLooseEqual(unref(createData).documentType, "excel")) ? " selected" : ""}>Spreadsheet</option><option value="powerpoint" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).documentType) ? ssrLooseContain(unref(createData).documentType, "powerpoint") : ssrLooseEqual(unref(createData).documentType, "powerpoint")) ? " selected" : ""}>Presentation</option><option value="pdf" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).documentType) ? ssrLooseContain(unref(createData).documentType, "pdf") : ssrLooseEqual(unref(createData).documentType, "pdf")) ? " selected" : ""}>PDF</option><option value="text" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).documentType) ? ssrLooseContain(unref(createData).documentType, "text") : ssrLooseEqual(unref(createData).documentType, "text")) ? " selected" : ""}>Text Document</option></select></div><div class="form-field" data-v-fce11ada><label data-v-fce11ada>Organization:</label><select data-v-fce11ada><option value="general" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).organizationType) ? ssrLooseContain(unref(createData).organizationType, "general") : ssrLooseEqual(unref(createData).organizationType, "general")) ? " selected" : ""}>General</option><option value="agency" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).organizationType) ? ssrLooseContain(unref(createData).organizationType, "agency") : ssrLooseEqual(unref(createData).organizationType, "agency")) ? " selected" : ""}>Agency</option><option value="claim" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).organizationType) ? ssrLooseContain(unref(createData).organizationType, "claim") : ssrLooseEqual(unref(createData).organizationType, "claim")) ? " selected" : ""}>Claim</option><option value="billing_period" data-v-fce11ada${ssrIncludeBooleanAttr(Array.isArray(unref(createData).organizationType) ? ssrLooseContain(unref(createData).organizationType, "billing_period") : ssrLooseEqual(unref(createData).organizationType, "billing_period")) ? " selected" : ""}>Billing Period</option></select></div><div class="form-actions" data-v-fce11ada><button class="cancel-btn" data-v-fce11ada>Cancel</button><button class="create-btn-submit" data-v-fce11ada>Create Document</button></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DocumentWorkspace.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_5 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-fce11ada"]]);
const useQueues = () => {
  const supabase = useSupabaseClient();
  const getCallsQueue = async (state) => {
    let query = supabase.from("queue_calls").select("*").order("priority", { ascending: false }).order("entered_queue_at", { ascending: true });
    if (state) {
      query = query.eq("queue_state", state);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const addToCallsQueue = async (callData) => {
    const { data, error } = await supabase.from("queue_calls").insert({
      call_id: callData.callId,
      queue_state: "active",
      call_direction: callData.callDirection,
      call_status: callData.callStatus,
      caller_identity: callData.callerIdentity,
      handled_by: callData.handledBy,
      priority: callData.priority || 50
    }).select().single();
    if (error) throw error;
    return data;
  };
  const updateCallsQueueItem = async (queueId, updates) => {
    const { error } = await supabase.from("queue_calls").update(updates).eq("id", queueId);
    if (error) throw error;
  };
  const completeCallsQueueItem = async (queueId) => {
    const { error } = await supabase.from("queue_calls").update({
      queue_state: "completed",
      completed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", queueId);
    if (error) throw error;
  };
  const getVoicemailsQueue = async (state) => {
    let query = supabase.from("queue_voicemails").select(`
        *,
        voicemail_records (*)
      `).order("priority", { ascending: false }).order("entered_queue_at", { ascending: true });
    if (state) {
      query = query.eq("queue_state", state);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const addToVoicemailsQueue = async (voicemailData) => {
    const { data, error } = await supabase.from("queue_voicemails").insert({
      voicemail_id: voicemailData.voicemailId,
      queue_state: "new",
      caller_identity: voicemailData.callerIdentity,
      suggested_action: voicemailData.suggestedAction,
      priority: voicemailData.priority || 50
    }).select().single();
    if (error) throw error;
    return data;
  };
  const updateVoicemailsQueueItem = async (queueId, state) => {
    const updateData = { queue_state: state };
    if (state === "resolved") {
      updateData.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    const { error } = await supabase.from("queue_voicemails").update(updateData).eq("id", queueId);
    if (error) throw error;
  };
  const getDocumentsQueue = async (state, blockingOnly) => {
    let query = supabase.from("queue_documents").select(`
        *,
        workspace_documents (*)
      `).order("priority", { ascending: false }).order("entered_queue_at", { ascending: true });
    if (state) {
      query = query.eq("queue_state", state);
    }
    if (blockingOnly) {
      query = query.eq("blocking_workflow", true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const addToDocumentsQueue = async (documentData) => {
    const { data, error } = await supabase.from("queue_documents").insert({
      document_id: documentData.documentId,
      queue_state: "draft",
      document_purpose: documentData.documentPurpose,
      blocking_workflow: documentData.blockingWorkflow || false,
      workflow_reference: documentData.workflowReference,
      required_by: documentData.requiredBy,
      priority: documentData.priority || 50
    }).select().single();
    if (error) throw error;
    return data;
  };
  const updateDocumentsQueueItem = async (queueId, state) => {
    const updateData = { queue_state: state };
    if (state === "ready_to_finalize") {
      updateData.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    const { error } = await supabase.from("queue_documents").update(updateData).eq("id", queueId);
    if (error) throw error;
  };
  const getBillingQueue = async (state) => {
    let query = supabase.from("queue_billing").select("*").order("priority", { ascending: false }).order("entered_queue_at", { ascending: true });
    if (state) {
      query = query.eq("queue_state", state);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const addToBillingQueue = async (billingData) => {
    const { data, error } = await supabase.from("queue_billing").insert({
      billing_reference: billingData.billingReference,
      billing_type: billingData.billingType,
      queue_state: "ready",
      encounter_id: billingData.encounterId,
      claim_id: billingData.claimId,
      agency_id: billingData.agencyId,
      billing_stage: billingData.billingStage,
      next_action: billingData.nextAction,
      action_deadline: billingData.actionDeadline,
      priority: billingData.priority || 50,
      metadata: billingData.metadata || {}
    }).select().single();
    if (error) throw error;
    return data;
  };
  const updateBillingQueueItem = async (queueId, state, metadata) => {
    const updateData = { queue_state: state };
    if (state === "resolved") {
      updateData.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (metadata) {
      updateData.metadata = metadata;
    }
    const { error } = await supabase.from("queue_billing").update(updateData).eq("id", queueId);
    if (error) throw error;
  };
  const getQueueCounts = async () => {
    const [calls, voicemails, documents, billing] = await Promise.all([
      getCallsQueue("active"),
      getVoicemailsQueue("new"),
      getDocumentsQueue(void 0, true),
      getBillingQueue("action_required")
    ]);
    return {
      activeCalls: calls.length,
      newVoicemails: voicemails.length,
      blockingDocuments: documents.length,
      actionRequiredBilling: billing.length
    };
  };
  return {
    getCallsQueue,
    addToCallsQueue,
    updateCallsQueueItem,
    completeCallsQueueItem,
    getVoicemailsQueue,
    addToVoicemailsQueue,
    updateVoicemailsQueueItem,
    getDocumentsQueue,
    addToDocumentsQueue,
    updateDocumentsQueueItem,
    getBillingQueue,
    addToBillingQueue,
    updateBillingQueueItem,
    getQueueCounts
  };
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "QueueManagement",
  __ssrInlineRender: true,
  setup(__props) {
    useQueues();
    const activeQueue = ref("billing");
    const callsQueue = ref([]);
    const voicemailsQueue = ref([]);
    const documentsQueue = ref([]);
    const billingQueue = ref([]);
    const queueCounts = ref({
      activeCalls: 0,
      newVoicemails: 0,
      blockingDocuments: 0,
      actionRequiredBilling: 0
    });
    const queues = computed(() => [
      { id: "calls", name: "Calls", icon: "\u{1F4DE}", count: queueCounts.value.activeCalls },
      { id: "voicemails", name: "Voicemails", icon: "\u{1F4E8}", count: queueCounts.value.newVoicemails },
      { id: "documents", name: "Documents", icon: "\u{1F4C4}", count: queueCounts.value.blockingDocuments },
      { id: "billing", name: "Billing", icon: "\u{1F4BC}", count: queueCounts.value.actionRequiredBilling }
    ]);
    const formatTime = (timestamp) => {
      const d = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return d.toLocaleDateString();
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "queue-management" }, _attrs))} data-v-cfc73b57><div class="queue-tabs" data-v-cfc73b57><!--[-->`);
      ssrRenderList(unref(queues), (queue) => {
        _push(`<button class="${ssrRenderClass(["queue-tab", { active: unref(activeQueue) === queue.id }])}" data-v-cfc73b57><span class="queue-icon" data-v-cfc73b57>${ssrInterpolate(queue.icon)}</span><span class="queue-name" data-v-cfc73b57>${ssrInterpolate(queue.name)}</span>`);
        if (queue.count > 0) {
          _push(`<span class="queue-badge" data-v-cfc73b57>${ssrInterpolate(queue.count)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div><div class="queue-content" data-v-cfc73b57>`);
      if (unref(activeQueue) === "calls") {
        _push(`<div class="queue-section" data-v-cfc73b57><h3 data-v-cfc73b57>Calls Queue</h3><p class="queue-description" data-v-cfc73b57>Real-time and historical call control</p>`);
        if (unref(callsQueue).length === 0) {
          _push(`<div class="empty-state" data-v-cfc73b57>No active calls</div>`);
        } else {
          _push(`<div class="queue-list" data-v-cfc73b57><!--[-->`);
          ssrRenderList(unref(callsQueue), (item) => {
            _push(`<div class="queue-item" data-v-cfc73b57><div class="item-header" data-v-cfc73b57><span class="item-direction" data-v-cfc73b57>${ssrInterpolate(item.call_direction === "inbound" ? "\u{1F4DE} Inbound" : "\u{1F4F1} Outbound")}</span><span class="${ssrRenderClass(["item-state", item.queue_state])}" data-v-cfc73b57>${ssrInterpolate(item.queue_state)}</span></div><div class="item-details" data-v-cfc73b57><p class="item-title" data-v-cfc73b57>${ssrInterpolate(item.caller_identity || "Unknown Caller")}</p><p class="item-meta" data-v-cfc73b57>${ssrInterpolate(item.call_status)} \u2022 Handled by ${ssrInterpolate(item.handled_by)}</p></div><div class="item-actions" data-v-cfc73b57>`);
            if (item.queue_state === "active") {
              _push(`<button class="complete-btn" data-v-cfc73b57> Complete </button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeQueue) === "voicemails") {
        _push(`<div class="queue-section" data-v-cfc73b57><h3 data-v-cfc73b57>Voicemails Queue</h3><p class="queue-description" data-v-cfc73b57>Unattended call triage</p>`);
        if (unref(voicemailsQueue).length === 0) {
          _push(`<div class="empty-state" data-v-cfc73b57>No voicemails</div>`);
        } else {
          _push(`<div class="queue-list" data-v-cfc73b57><!--[-->`);
          ssrRenderList(unref(voicemailsQueue), (item) => {
            var _a, _b;
            _push(`<div class="queue-item" data-v-cfc73b57><div class="item-header" data-v-cfc73b57><span class="item-icon" data-v-cfc73b57>\u{1F4E8}</span><span class="${ssrRenderClass(["item-state", item.queue_state])}" data-v-cfc73b57>${ssrInterpolate(item.queue_state)}</span></div><div class="item-details" data-v-cfc73b57><p class="item-title" data-v-cfc73b57>${ssrInterpolate(item.caller_identity || ((_a = item.voicemail_records) == null ? void 0 : _a.caller_number))}</p><p class="item-meta" data-v-cfc73b57>${ssrInterpolate((_b = item.voicemail_records) == null ? void 0 : _b.duration_seconds)}s \u2022 ${ssrInterpolate(formatTime(item.entered_queue_at))}</p></div><div class="item-actions" data-v-cfc73b57>`);
            if (item.queue_state === "new") {
              _push(`<button class="review-btn" data-v-cfc73b57> Review </button>`);
            } else {
              _push(`<!---->`);
            }
            if (item.queue_state !== "resolved") {
              _push(`<button class="resolve-btn" data-v-cfc73b57> Resolve </button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeQueue) === "documents") {
        _push(`<div class="queue-section" data-v-cfc73b57><h3 data-v-cfc73b57>Documents Queue</h3><p class="queue-description" data-v-cfc73b57>Work-in-progress and compliance checkpoint</p>`);
        if (unref(documentsQueue).length === 0) {
          _push(`<div class="empty-state" data-v-cfc73b57>No pending documents</div>`);
        } else {
          _push(`<div class="queue-list" data-v-cfc73b57><!--[-->`);
          ssrRenderList(unref(documentsQueue), (item) => {
            var _a;
            _push(`<div class="${ssrRenderClass([{ blocking: item.blocking_workflow }, "queue-item"])}" data-v-cfc73b57><div class="item-header" data-v-cfc73b57><span class="item-icon" data-v-cfc73b57>\u{1F4C4}</span><span class="${ssrRenderClass(["item-state", item.queue_state])}" data-v-cfc73b57>${ssrInterpolate(item.queue_state)}</span>`);
            if (item.blocking_workflow) {
              _push(`<span class="blocking-badge" data-v-cfc73b57>Blocking</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="item-details" data-v-cfc73b57><p class="item-title" data-v-cfc73b57>${ssrInterpolate((_a = item.workspace_documents) == null ? void 0 : _a.document_name)}</p><p class="item-meta" data-v-cfc73b57>${ssrInterpolate(item.document_purpose || "General")} \u2022 ${ssrInterpolate(formatTime(item.entered_queue_at))}</p></div><div class="item-actions" data-v-cfc73b57><button class="open-btn" data-v-cfc73b57>Open</button>`);
            if (item.queue_state === "draft") {
              _push(`<button class="finalize-btn" data-v-cfc73b57> Ready to Finalize </button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeQueue) === "billing") {
        _push(`<div class="queue-section" data-v-cfc73b57><h3 data-v-cfc73b57>Billing Queue</h3><p class="queue-description" data-v-cfc73b57>Primary billing execution queue</p>`);
        if (unref(billingQueue).length === 0) {
          _push(`<div class="empty-state" data-v-cfc73b57>No billing items</div>`);
        } else {
          _push(`<div class="queue-list" data-v-cfc73b57><!--[-->`);
          ssrRenderList(unref(billingQueue), (item) => {
            _push(`<div class="queue-item" data-v-cfc73b57><div class="item-header" data-v-cfc73b57><span class="item-icon" data-v-cfc73b57>\u{1F4BC}</span><span class="${ssrRenderClass(["item-state", item.queue_state])}" data-v-cfc73b57>${ssrInterpolate(item.queue_state)}</span></div><div class="item-details" data-v-cfc73b57><p class="item-title" data-v-cfc73b57>${ssrInterpolate(item.billing_reference)}</p><p class="item-meta" data-v-cfc73b57>${ssrInterpolate(item.billing_type)} \u2022 ${ssrInterpolate(item.next_action)}</p>`);
            if (item.action_deadline) {
              _push(`<p class="item-deadline" data-v-cfc73b57>Due: ${ssrInterpolate(formatDate(item.action_deadline))}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="item-actions" data-v-cfc73b57>`);
            if (item.queue_state === "ready") {
              _push(`<button class="start-btn" data-v-cfc73b57> Start </button>`);
            } else {
              _push(`<!---->`);
            }
            if (item.queue_state !== "resolved") {
              _push(`<button class="resolve-btn" data-v-cfc73b57> Resolve </button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/QueueManagement.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-cfc73b57"]]);
const useBuilders = () => {
  const supabase = useSupabaseClient();
  const createInvoice = async (invoiceData) => {
    const { data, error } = await supabase.from("invoices").insert({
      invoice_number: invoiceData.invoiceNumber,
      invoice_type: invoiceData.invoiceType,
      invoice_state: "draft",
      encounter_id: invoiceData.encounterId,
      agency_id: invoiceData.agencyId,
      billable_call_id: invoiceData.billableCallId,
      payer_type: invoiceData.payerType,
      payer_name: invoiceData.payerName,
      payer_contact: invoiceData.payerContact,
      due_date: invoiceData.dueDate
    }).select().single();
    if (error) throw error;
    return data;
  };
  const addInvoiceLineItem = async (lineItemData) => {
    const lineTotalCents = Math.round(lineItemData.quantity * lineItemData.unitPriceCents);
    const { data, error } = await supabase.from("invoice_line_items").insert({
      invoice_id: lineItemData.invoiceId,
      line_number: lineItemData.lineNumber,
      item_type: lineItemData.itemType,
      description: lineItemData.description,
      quantity: lineItemData.quantity,
      unit_price_cents: lineItemData.unitPriceCents,
      line_total_cents: lineTotalCents,
      metadata: lineItemData.metadata || {}
    }).select().single();
    if (error) throw error;
    return data;
  };
  const calculateInvoiceTotals = async (invoiceId) => {
    const { data: lineItems } = await supabase.from("invoice_line_items").select("line_total_cents").eq("invoice_id", invoiceId);
    const subtotalCents = (lineItems == null ? void 0 : lineItems.reduce((sum, item) => sum + item.line_total_cents, 0)) || 0;
    const totalCents = subtotalCents;
    const { error } = await supabase.from("invoices").update({
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      balance_cents: totalCents,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invoiceId);
    if (error) throw error;
    return { subtotalCents, totalCents };
  };
  const finalizeInvoice = async (invoiceId) => {
    await calculateInvoiceTotals(invoiceId);
    const { error } = await supabase.from("invoices").update({
      invoice_state: "final",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invoiceId);
    if (error) throw error;
  };
  const sendInvoice = async (invoiceId) => {
    const { error } = await supabase.from("invoices").update({
      invoice_state: "sent",
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invoiceId);
    if (error) throw error;
  };
  const getInvoice = async (invoiceId) => {
    const { data, error } = await supabase.from("invoices").select(`
        *,
        invoice_line_items (*)
      `).eq("id", invoiceId).maybeSingle();
    if (error) throw error;
    return data;
  };
  const getInvoices = async (filters) => {
    let query = supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (filters == null ? void 0 : filters.state) {
      query = query.eq("invoice_state", filters.state);
    }
    if (filters == null ? void 0 : filters.agencyId) {
      query = query.eq("agency_id", filters.agencyId);
    }
    if (filters == null ? void 0 : filters.invoiceType) {
      query = query.eq("invoice_type", filters.invoiceType);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const createNEMSISValidation = async (validationData) => {
    const exportReady = validationData.requiredFieldsComplete === validationData.requiredFieldsTotal && (!validationData.validationErrors || validationData.validationErrors.length === 0);
    const validationStatus = exportReady ? "valid" : validationData.requiredFieldsComplete < validationData.requiredFieldsTotal ? "incomplete" : "invalid";
    const { data, error } = await supabase.from("nemsis_validations").insert({
      epcr_id: validationData.epcrId,
      validation_version: validationData.validationVersion,
      validation_status: validationStatus,
      required_fields_complete: validationData.requiredFieldsComplete,
      required_fields_total: validationData.requiredFieldsTotal,
      validation_errors: validationData.validationErrors || [],
      validation_warnings: validationData.validationWarnings || [],
      export_ready: exportReady
    }).select().single();
    if (error) throw error;
    return data;
  };
  const getNEMSISValidation = async (epcrId) => {
    const { data, error } = await supabase.from("nemsis_validations").select("*").eq("epcr_id", epcrId).order("validated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  };
  const markNEMSISExported = async (validationId, exportFormat) => {
    const { error } = await supabase.from("nemsis_validations").update({
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      export_format: exportFormat
    }).eq("id", validationId);
    if (error) throw error;
  };
  const mapRxNorm = async (mappingData) => {
    const { data, error } = await supabase.from("rxnorm_mappings").insert({
      medication_entry: mappingData.medicationEntry,
      rxnorm_concept_id: mappingData.rxnormConceptId,
      rxnorm_name: mappingData.rxnormName,
      dose: mappingData.dose,
      dose_unit: mappingData.doseUnit,
      route: mappingData.route,
      mapping_status: mappingData.mappingStatus,
      mapping_confidence: mappingData.mappingConfidence,
      mapped_by: mappingData.mappedBy,
      mapped_at: mappingData.mappingStatus === "confirmed" ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).select().single();
    if (error) throw error;
    return data;
  };
  const confirmRxNormMapping = async (mappingId, mappedBy) => {
    const { error } = await supabase.from("rxnorm_mappings").update({
      mapping_status: "confirmed",
      mapped_by: mappedBy,
      mapped_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", mappingId);
    if (error) throw error;
  };
  const getRxNormMappings = async (status) => {
    let query = supabase.from("rxnorm_mappings").select("*").order("created_at", { ascending: false });
    if (status) {
      query = query.eq("mapping_status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const mapSNOMED = async (mappingData) => {
    const { data, error } = await supabase.from("snomed_mappings").insert({
      clinical_term: mappingData.clinicalTerm,
      snomed_concept_id: mappingData.snomedConceptId,
      snomed_description: mappingData.snomedDescription,
      term_type: mappingData.termType,
      mapping_status: mappingData.mappingStatus,
      mapping_confidence: mappingData.mappingConfidence,
      mapped_by: mappingData.mappedBy,
      mapped_at: mappingData.mappingStatus === "confirmed" ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).select().single();
    if (error) throw error;
    return data;
  };
  const confirmSNOMEDMapping = async (mappingId, mappedBy) => {
    const { error } = await supabase.from("snomed_mappings").update({
      mapping_status: "confirmed",
      mapped_by: mappedBy,
      mapped_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", mappingId);
    if (error) throw error;
  };
  const getSNOMEDMappings = async (status) => {
    let query = supabase.from("snomed_mappings").select("*").order("created_at", { ascending: false });
    if (status) {
      query = query.eq("mapping_status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  return {
    createInvoice,
    addInvoiceLineItem,
    calculateInvoiceTotals,
    finalizeInvoice,
    sendInvoice,
    getInvoice,
    getInvoices,
    createNEMSISValidation,
    getNEMSISValidation,
    markNEMSISExported,
    mapRxNorm,
    confirmRxNormMapping,
    getRxNormMappings,
    mapSNOMED,
    confirmSNOMEDMapping,
    getSNOMEDMappings
  };
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "WorkspaceBuilders",
  __ssrInlineRender: true,
  setup(__props) {
    useBuilders();
    const activeBuilder = ref("invoice");
    const builders = [
      { id: "invoice", name: "Invoice", icon: "\u{1F4B5}" },
      { id: "nemsis", name: "NEMSIS", icon: "\u{1F691}" },
      { id: "rxnorm", name: "RxNorm", icon: "\u{1F48A}" },
      { id: "snomed", name: "SNOMED", icon: "\u{1FA7A}" }
    ];
    const invoiceForm = ref({
      invoiceNumber: "",
      invoiceType: "patient_pay",
      payerName: "",
      dueDate: "",
      lineItems: [
        { itemType: "transport", description: "", quantity: 1, unitPrice: 0 }
      ]
    });
    const nemsisStatus = ref({
      status: "incomplete",
      requiredComplete: 3,
      requiredTotal: 4,
      exportReady: false
    });
    const nemsisProgress = computed(() => {
      return nemsisStatus.value.requiredComplete / nemsisStatus.value.requiredTotal * 100;
    });
    const rxnormForm = ref({
      medicationEntry: "",
      suggested: false,
      rxnormConceptId: "",
      rxnormName: "",
      dose: "",
      doseUnit: "",
      route: "",
      confidence: 0
    });
    const snomedForm = ref({
      clinicalTerm: "",
      termType: "symptom",
      suggested: false,
      snomedConceptId: "",
      snomedDescription: "",
      confidence: 0
    });
    const rxnormMappings = ref([]);
    const snomedMappings = ref([]);
    const calculateTotal = () => {
      const total = invoiceForm.value.lineItems.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0);
      return (total / 100).toFixed(2);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "workspace-builders" }, _attrs))} data-v-2c7fd8af><div class="builders-tabs" data-v-2c7fd8af><!--[-->`);
      ssrRenderList(builders, (builder) => {
        _push(`<button class="${ssrRenderClass(["builder-tab", { active: unref(activeBuilder) === builder.id }])}" data-v-2c7fd8af>${ssrInterpolate(builder.icon)} ${ssrInterpolate(builder.name)}</button>`);
      });
      _push(`<!--]--></div><div class="builder-content" data-v-2c7fd8af>`);
      if (unref(activeBuilder) === "invoice") {
        _push(`<div class="builder-section" data-v-2c7fd8af><h3 data-v-2c7fd8af>Invoice Builder</h3><p class="builder-description" data-v-2c7fd8af>Create patient-pay and private-party invoices</p><div class="builder-form" data-v-2c7fd8af><div class="form-row" data-v-2c7fd8af><div class="form-field" data-v-2c7fd8af><label data-v-2c7fd8af>Invoice Number:</label><input${ssrRenderAttr("value", unref(invoiceForm).invoiceNumber)} type="text" placeholder="INV-2024-001" data-v-2c7fd8af></div><div class="form-field" data-v-2c7fd8af><label data-v-2c7fd8af>Invoice Type:</label><select data-v-2c7fd8af><option value="patient_pay" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(invoiceForm).invoiceType) ? ssrLooseContain(unref(invoiceForm).invoiceType, "patient_pay") : ssrLooseEqual(unref(invoiceForm).invoiceType, "patient_pay")) ? " selected" : ""}>Patient Pay</option><option value="private_party" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(invoiceForm).invoiceType) ? ssrLooseContain(unref(invoiceForm).invoiceType, "private_party") : ssrLooseEqual(unref(invoiceForm).invoiceType, "private_party")) ? " selected" : ""}>Private Party</option><option value="agency_billing" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(invoiceForm).invoiceType) ? ssrLooseContain(unref(invoiceForm).invoiceType, "agency_billing") : ssrLooseEqual(unref(invoiceForm).invoiceType, "agency_billing")) ? " selected" : ""}>Agency Billing</option></select></div></div><div class="form-row" data-v-2c7fd8af><div class="form-field" data-v-2c7fd8af><label data-v-2c7fd8af>Payer Name:</label><input${ssrRenderAttr("value", unref(invoiceForm).payerName)} type="text" placeholder="John Doe" data-v-2c7fd8af></div><div class="form-field" data-v-2c7fd8af><label data-v-2c7fd8af>Due Date:</label><input${ssrRenderAttr("value", unref(invoiceForm).dueDate)} type="date" data-v-2c7fd8af></div></div><div class="line-items-section" data-v-2c7fd8af><h4 data-v-2c7fd8af>Line Items</h4><!--[-->`);
        ssrRenderList(unref(invoiceForm).lineItems, (item, index) => {
          _push(`<div class="line-item" data-v-2c7fd8af><select data-v-2c7fd8af><option value="transport" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(item.itemType) ? ssrLooseContain(item.itemType, "transport") : ssrLooseEqual(item.itemType, "transport")) ? " selected" : ""}>Transport</option><option value="mileage" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(item.itemType) ? ssrLooseContain(item.itemType, "mileage") : ssrLooseEqual(item.itemType, "mileage")) ? " selected" : ""}>Mileage</option><option value="service_level" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(item.itemType) ? ssrLooseContain(item.itemType, "service_level") : ssrLooseEqual(item.itemType, "service_level")) ? " selected" : ""}>Service Level</option><option value="telehealth" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(item.itemType) ? ssrLooseContain(item.itemType, "telehealth") : ssrLooseEqual(item.itemType, "telehealth")) ? " selected" : ""}>Telehealth</option></select><input${ssrRenderAttr("value", item.description)} type="text" placeholder="Description" data-v-2c7fd8af><input${ssrRenderAttr("value", item.quantity)} type="number" placeholder="Qty" style="${ssrRenderStyle({ "width": "80px" })}" data-v-2c7fd8af><input${ssrRenderAttr("value", item.unitPrice)} type="number" placeholder="Price" style="${ssrRenderStyle({ "width": "100px" })}" data-v-2c7fd8af><button class="remove-btn" data-v-2c7fd8af>\xD7</button></div>`);
        });
        _push(`<!--]--><button class="add-line-btn" data-v-2c7fd8af>+ Add Line Item</button></div><div class="invoice-total" data-v-2c7fd8af><p data-v-2c7fd8af>Subtotal: $${ssrInterpolate(calculateTotal())}</p><p class="total" data-v-2c7fd8af>Total: $${ssrInterpolate(calculateTotal())}</p></div><div class="form-actions" data-v-2c7fd8af><button class="save-btn" data-v-2c7fd8af>Save Draft</button><button class="finalize-btn" data-v-2c7fd8af>Finalize Invoice</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeBuilder) === "nemsis") {
        _push(`<div class="builder-section" data-v-2c7fd8af><h3 data-v-2c7fd8af>NEMSIS Builder</h3><p class="builder-description" data-v-2c7fd8af>Validate and export ePCR data to NEMSIS format</p><div class="validation-status" data-v-2c7fd8af><div class="status-header" data-v-2c7fd8af><h4 data-v-2c7fd8af>NEMSIS Readiness</h4><span class="${ssrRenderClass(["status-badge", unref(nemsisStatus).status])}" data-v-2c7fd8af>${ssrInterpolate(unref(nemsisStatus).status)}</span></div><div class="progress-bar" data-v-2c7fd8af><div class="progress-fill" style="${ssrRenderStyle({ width: unref(nemsisProgress) + "%" })}" data-v-2c7fd8af></div></div><p class="progress-text" data-v-2c7fd8af>${ssrInterpolate(unref(nemsisStatus).requiredComplete)}/${ssrInterpolate(unref(nemsisStatus).requiredTotal)} required fields complete </p></div><div class="validation-sections" data-v-2c7fd8af><div class="validation-item" data-v-2c7fd8af><span class="validation-icon" data-v-2c7fd8af>\u2713</span><span class="validation-label" data-v-2c7fd8af>Patient Demographics</span><span class="validation-status complete" data-v-2c7fd8af>Complete</span></div><div class="validation-item" data-v-2c7fd8af><span class="validation-icon" data-v-2c7fd8af>\u2713</span><span class="validation-label" data-v-2c7fd8af>Incident Information</span><span class="validation-status complete" data-v-2c7fd8af>Complete</span></div><div class="validation-item" data-v-2c7fd8af><span class="validation-icon" data-v-2c7fd8af>\u26A0</span><span class="validation-label" data-v-2c7fd8af>Vital Signs</span><span class="validation-status incomplete" data-v-2c7fd8af>Incomplete</span></div><div class="validation-item" data-v-2c7fd8af><span class="validation-icon" data-v-2c7fd8af>\u2713</span><span class="validation-label" data-v-2c7fd8af>Medications Administered</span><span class="validation-status complete" data-v-2c7fd8af>Complete</span></div></div><div class="form-actions" data-v-2c7fd8af><button${ssrIncludeBooleanAttr(!unref(nemsisStatus).exportReady) ? " disabled" : ""} class="export-btn" data-v-2c7fd8af>Export NEMSIS</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeBuilder) === "rxnorm") {
        _push(`<div class="builder-section" data-v-2c7fd8af><h3 data-v-2c7fd8af>RxNorm Builder</h3><p class="builder-description" data-v-2c7fd8af>Standardize medication documentation</p><div class="mapping-section" data-v-2c7fd8af><div class="mapping-input" data-v-2c7fd8af><label data-v-2c7fd8af>Medication Entry:</label><input${ssrRenderAttr("value", unref(rxnormForm).medicationEntry)} type="text" placeholder="Aspirin 81mg PO" data-v-2c7fd8af><button class="suggest-btn" data-v-2c7fd8af>Suggest Mapping</button></div>`);
        if (unref(rxnormForm).suggested) {
          _push(`<div class="mapping-result" data-v-2c7fd8af><h4 data-v-2c7fd8af>Suggested Mapping</h4><div class="mapping-card" data-v-2c7fd8af><p data-v-2c7fd8af><strong data-v-2c7fd8af>RxNorm Concept:</strong> ${ssrInterpolate(unref(rxnormForm).rxnormName)}</p><p data-v-2c7fd8af><strong data-v-2c7fd8af>Concept ID:</strong> ${ssrInterpolate(unref(rxnormForm).rxnormConceptId)}</p><p data-v-2c7fd8af><strong data-v-2c7fd8af>Confidence:</strong> ${ssrInterpolate(unref(rxnormForm).confidence)}%</p><div class="mapping-details" data-v-2c7fd8af><input${ssrRenderAttr("value", unref(rxnormForm).dose)} type="text" placeholder="Dose (81)" data-v-2c7fd8af><input${ssrRenderAttr("value", unref(rxnormForm).doseUnit)} type="text" placeholder="Unit (mg)" data-v-2c7fd8af><input${ssrRenderAttr("value", unref(rxnormForm).route)} type="text" placeholder="Route (PO)" data-v-2c7fd8af></div><div class="mapping-actions" data-v-2c7fd8af><button class="confirm-btn" data-v-2c7fd8af>Confirm Mapping</button><button class="reject-btn" data-v-2c7fd8af>Reject</button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mapping-list" data-v-2c7fd8af><h4 data-v-2c7fd8af>Recent Mappings</h4><!--[-->`);
        ssrRenderList(unref(rxnormMappings), (mapping) => {
          _push(`<div class="mapping-list-item" data-v-2c7fd8af><span data-v-2c7fd8af>${ssrInterpolate(mapping.medication_entry)}</span><span class="${ssrRenderClass(["mapping-status", mapping.mapping_status])}" data-v-2c7fd8af>${ssrInterpolate(mapping.mapping_status)}</span></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeBuilder) === "snomed") {
        _push(`<div class="builder-section" data-v-2c7fd8af><h3 data-v-2c7fd8af>SNOMED Builder</h3><p class="builder-description" data-v-2c7fd8af>Standardize clinical concepts</p><div class="mapping-section" data-v-2c7fd8af><div class="mapping-input" data-v-2c7fd8af><label data-v-2c7fd8af>Clinical Term:</label><input${ssrRenderAttr("value", unref(snomedForm).clinicalTerm)} type="text" placeholder="Chest pain" data-v-2c7fd8af><select data-v-2c7fd8af><option value="symptom" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(snomedForm).termType) ? ssrLooseContain(unref(snomedForm).termType, "symptom") : ssrLooseEqual(unref(snomedForm).termType, "symptom")) ? " selected" : ""}>Symptom</option><option value="finding" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(snomedForm).termType) ? ssrLooseContain(unref(snomedForm).termType, "finding") : ssrLooseEqual(unref(snomedForm).termType, "finding")) ? " selected" : ""}>Finding</option><option value="impression" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(snomedForm).termType) ? ssrLooseContain(unref(snomedForm).termType, "impression") : ssrLooseEqual(unref(snomedForm).termType, "impression")) ? " selected" : ""}>Impression</option><option value="procedure" data-v-2c7fd8af${ssrIncludeBooleanAttr(Array.isArray(unref(snomedForm).termType) ? ssrLooseContain(unref(snomedForm).termType, "procedure") : ssrLooseEqual(unref(snomedForm).termType, "procedure")) ? " selected" : ""}>Procedure</option></select><button class="suggest-btn" data-v-2c7fd8af>Suggest Mapping</button></div>`);
        if (unref(snomedForm).suggested) {
          _push(`<div class="mapping-result" data-v-2c7fd8af><h4 data-v-2c7fd8af>Suggested Mapping</h4><div class="mapping-card" data-v-2c7fd8af><p data-v-2c7fd8af><strong data-v-2c7fd8af>SNOMED Concept:</strong> ${ssrInterpolate(unref(snomedForm).snomedDescription)}</p><p data-v-2c7fd8af><strong data-v-2c7fd8af>Concept ID:</strong> ${ssrInterpolate(unref(snomedForm).snomedConceptId)}</p><p data-v-2c7fd8af><strong data-v-2c7fd8af>Confidence:</strong> ${ssrInterpolate(unref(snomedForm).confidence)}%</p><div class="mapping-actions" data-v-2c7fd8af><button class="confirm-btn" data-v-2c7fd8af>Confirm Mapping</button><button class="reject-btn" data-v-2c7fd8af>Reject</button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mapping-list" data-v-2c7fd8af><h4 data-v-2c7fd8af>Recent Mappings</h4><!--[-->`);
        ssrRenderList(unref(snomedMappings), (mapping) => {
          _push(`<div class="mapping-list-item" data-v-2c7fd8af><span data-v-2c7fd8af>${ssrInterpolate(mapping.clinical_term)}</span><span class="term-type" data-v-2c7fd8af>${ssrInterpolate(mapping.term_type)}</span><span class="${ssrRenderClass(["mapping-status", mapping.mapping_status])}" data-v-2c7fd8af>${ssrInterpolate(mapping.mapping_status)}</span></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/WorkspaceBuilders.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-2c7fd8af"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AIFaceSheetReviewer",
  __ssrInlineRender: true,
  setup(__props) {
    var _a, _b, _c;
    useSupabaseClient();
    const { useFaceSheet } = ((_c = (_b = (_a = useCurrentInstance()) == null ? void 0 : _a.appContext) == null ? void 0 : _b.config) == null ? void 0 : _c.globalProperties) || {};
    const pendingFaceSheets = ref([]);
    const approvalsSummary = ref([]);
    const expandedId = ref(null);
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatTime = (timestamp) => {
      const now = /* @__PURE__ */ new Date();
      const then = new Date(timestamp);
      const diffMs = now.getTime() - then.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return then.toLocaleDateString();
    };
    const formatFieldName = (name) => {
      return name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };
    const getConfidenceClass = (score) => {
      if (score >= 90) return "high";
      if (score >= 70) return "medium";
      return "low";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "face-sheet-reviewer" }, _attrs))} data-v-cf007d68><div class="reviewer-header" data-v-cf007d68><h2 data-v-cf007d68>Face Sheet Review &amp; Approval</h2><p class="subtitle" data-v-cf007d68>${ssrInterpolate(unref(pendingFaceSheets).length)} pending face sheets requiring your attention</p></div>`);
      if (unref(pendingFaceSheets).length === 0) {
        _push(`<div class="no-pending" data-v-cf007d68><span class="check-icon" data-v-cf007d68>\u2705</span><p data-v-cf007d68>No face sheets pending review</p></div>`);
      } else {
        _push(`<div class="face-sheets-list" data-v-cf007d68><!--[-->`);
        ssrRenderList(unref(pendingFaceSheets), (fs) => {
          _push(`<div class="${ssrRenderClass([{ expanded: unref(expandedId) === fs.id }, "face-sheet-card"])}" data-v-cf007d68><div class="card-header" data-v-cf007d68><div class="patient-info" data-v-cf007d68><div class="patient-name" data-v-cf007d68>${ssrInterpolate(fs.patient_first_name)} ${ssrInterpolate(fs.patient_last_name)}</div><div class="patient-dob" data-v-cf007d68>DOB: ${ssrInterpolate(formatDate(fs.patient_dob))}</div></div><div class="confidence-section" data-v-cf007d68><span class="${ssrRenderClass(["confidence-score", getConfidenceClass(fs.overall_confidence_score)])}" data-v-cf007d68>${ssrInterpolate(fs.overall_confidence_score)}% </span><span class="chevron" data-v-cf007d68>${ssrInterpolate(unref(expandedId) === fs.id ? "\u25BC" : "\u25B6")}</span></div></div>`);
          if (unref(expandedId) === fs.id) {
            _push(`<div class="card-expanded" data-v-cf007d68><div class="field-grid" data-v-cf007d68><div class="field-row" data-v-cf007d68><label data-v-cf007d68>Payer:</label><span data-v-cf007d68>${ssrInterpolate(fs.primary_payer_name)}</span></div><div class="field-row" data-v-cf007d68><label data-v-cf007d68>Plan Type:</label><span data-v-cf007d68>${ssrInterpolate(fs.plan_type)}</span></div><div class="field-row" data-v-cf007d68><label data-v-cf007d68>Member ID:</label><span class="mono" data-v-cf007d68>${ssrInterpolate(fs.member_id)}</span></div><div class="field-row" data-v-cf007d68><label data-v-cf007d68>Group Number:</label><span class="mono" data-v-cf007d68>${ssrInterpolate(fs.group_number || "\u2014")}</span></div>`);
            if (fs.subscriber_name) {
              _push(`<div class="field-row" data-v-cf007d68><label data-v-cf007d68>Subscriber:</label><span data-v-cf007d68>${ssrInterpolate(fs.subscriber_name)}</span></div>`);
            } else {
              _push(`<!---->`);
            }
            if (fs.subscriber_relationship) {
              _push(`<div class="field-row" data-v-cf007d68><label data-v-cf007d68>Relationship:</label><span data-v-cf007d68>${ssrInterpolate(fs.subscriber_relationship)}</span></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (fs.face_sheet_fields) {
              _push(`<div class="field-confidence" data-v-cf007d68><h4 data-v-cf007d68>Field Confidence Scores:</h4><!--[-->`);
              ssrRenderList(fs.face_sheet_fields, (field) => {
                _push(`<div class="${ssrRenderClass([{ uncertain: field.is_uncertain }, "field-confidence-item"])}" data-v-cf007d68><span class="field-name" data-v-cf007d68>${ssrInterpolate(formatFieldName(field.field_name))}</span><span class="${ssrRenderClass(["field-score", getConfidenceClass(field.field_confidence)])}" data-v-cf007d68>${ssrInterpolate(field.field_confidence)}% </span>`);
                if (field.is_uncertain) {
                  _push(`<span class="uncertain-badge" data-v-cf007d68>Uncertain</span>`);
                } else {
                  _push(`<!---->`);
                }
                _push(`</div>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="source-info" data-v-cf007d68><h4 data-v-cf007d68>Source: ${ssrInterpolate(fs.source_type)}</h4><p class="extraction-method" data-v-cf007d68>${ssrInterpolate(fs.extraction_method)}</p></div><div class="card-actions" data-v-cf007d68><button class="approve-btn" data-v-cf007d68>Approve</button><button class="correct-btn" data-v-cf007d68>Request Corrections</button><button class="recovery-btn" data-v-cf007d68>Send to AI for Recovery</button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(approvalsSummary).length > 0) {
        _push(`<div class="approvals-summary" data-v-cf007d68><h3 data-v-cf007d68>Recent Approvals</h3><div class="approval-items" data-v-cf007d68><!--[-->`);
        ssrRenderList(unref(approvalsSummary), (approval) => {
          _push(`<div class="approval-item" data-v-cf007d68><span class="check-mark" data-v-cf007d68>\u2713</span><span class="approval-text" data-v-cf007d68>${ssrInterpolate(approval.patient_name)} approved by ${ssrInterpolate(approval.approved_by)}</span><span class="approval-time" data-v-cf007d68>${ssrInterpolate(formatTime(approval.approved_at))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AIFaceSheetReviewer.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_8 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-cf007d68"]]);
const useEndOfDayReconciliation = () => {
  const supabase = useSupabaseClient();
  const generateEndOfDayReport = async (reconciliationDate = /* @__PURE__ */ new Date()) => {
    const dateStr = reconciliationDate.toISOString().split("T")[0];
    const startOfDay = new Date(reconciliationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reconciliationDate);
    endOfDay.setHours(23, 59, 59, 999);
    const [
      billableEncounters,
      faceSheets,
      faceSheetsApproved,
      claimsSubmitted,
      claimsInProgress,
      hardBreaches,
      criticalItems,
      unlinkedCalls,
      blockingDocs
    ] = await Promise.all([
      countBillableEncounters(startOfDay, endOfDay),
      countFaceSheets(startOfDay, endOfDay),
      countApprovedFaceSheets(startOfDay, endOfDay),
      countSubmittedClaims(startOfDay, endOfDay),
      countInProgressClaims(),
      countHardSLABreaches(),
      countUnresolvedCriticalItems(),
      countUnlinkedCalls(startOfDay, endOfDay),
      countBlockingDocuments()
    ]);
    const allClear = hardBreaches === 0 && criticalItems === 0 && unlinkedCalls === 0 && blockingDocs === 0;
    const { data: reconciliation, error } = await supabase.from("end_of_day_reconciliation").insert({
      reconciliation_date: dateStr,
      total_billable_encounters: billableEncounters,
      total_face_sheets_created: faceSheets,
      total_face_sheets_approved: faceSheetsApproved,
      total_face_sheets_pending: faceSheets - faceSheetsApproved,
      total_claims_submitted: claimsSubmitted,
      total_claims_in_progress: claimsInProgress,
      missed_deadlines: hardBreaches,
      unresolved_critical_items: criticalItems,
      unlinked_calls: unlinkedCalls,
      blocking_documents: blockingDocs,
      all_clear: allClear,
      reconciliation_status: "pending"
    }).select().single();
    if (error) throw error;
    return {
      reconciliationId: reconciliation.id,
      summary: {
        allClear,
        billableEncounters,
        faceSheetStats: {
          created: faceSheets,
          approved: faceSheetsApproved,
          pending: faceSheets - faceSheetsApproved
        },
        claimStats: {
          submitted: claimsSubmitted,
          inProgress: claimsInProgress
        },
        issues: {
          hardBreaches,
          criticalItems,
          unlinkedCalls,
          blockingDocuments: blockingDocs
        }
      },
      recommendation: allClear ? "All clear. You can close the day." : "Review flagged items before closing."
    };
  };
  const countBillableEncounters = async (startDate, endDate) => {
    const { count, error } = await supabase.from("queue_billing").select("*", { count: "exact" }).eq("billing_type", "epcr_complete").gte("entered_queue_at", startDate.toISOString()).lte("entered_queue_at", endDate.toISOString());
    if (error) throw error;
    return count || 0;
  };
  const countFaceSheets = async (startDate, endDate) => {
    const { count, error } = await supabase.from("face_sheets").select("*", { count: "exact" }).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString());
    if (error) throw error;
    return count || 0;
  };
  const countApprovedFaceSheets = async (startDate, endDate) => {
    const { count, error } = await supabase.from("face_sheets").select("*", { count: "exact" }).eq("is_approved", true).gte("approved_at", startDate.toISOString()).lte("approved_at", endDate.toISOString());
    if (error) throw error;
    return count || 0;
  };
  const countSubmittedClaims = async (startDate, endDate) => {
    const { count, error } = await supabase.from("queue_billing").select("*", { count: "exact" }).eq("queue_state", "submitted").gte("entered_queue_at", startDate.toISOString()).lte("entered_queue_at", endDate.toISOString());
    if (error) throw error;
    return count || 0;
  };
  const countInProgressClaims = async () => {
    const { count, error } = await supabase.from("queue_billing").select("*", { count: "exact" }).eq("queue_state", "in_progress");
    if (error) throw error;
    return count || 0;
  };
  const countHardSLABreaches = async () => {
    const { count, error } = await supabase.from("queue_item_sla_tracking").select("*", { count: "exact" }).eq("hard_breach_triggered", true).eq("hard_breach_acknowledged", false);
    if (error) throw error;
    return count || 0;
  };
  const countUnresolvedCriticalItems = async () => {
    const { count, error } = await supabase.from("priority_scores").select("*", { count: "exact" }).eq("is_critical", true);
    if (error) throw error;
    return count || 0;
  };
  const countUnlinkedCalls = async (startDate, endDate) => {
    const { count, error } = await supabase.from("active_calls").select("*", { count: "exact" }).is("linked_claim_id", null).is("linked_invoice_id", null).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString());
    if (error) throw error;
    return count || 0;
  };
  const countBlockingDocuments = async () => {
    const { count, error } = await supabase.from("queue_documents").select("*", { count: "exact" }).eq("blocking_workflow", true);
    if (error) throw error;
    return count || 0;
  };
  const reviewReconciliation = async (reconciliationId, userId, notes = "") => {
    const { error } = await supabase.from("end_of_day_reconciliation").update({
      reconciliation_status: "reviewed",
      reviewed_by: userId,
      reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
      notes
    }).eq("id", reconciliationId);
    if (error) throw error;
  };
  const closeDay = async (reconciliationId, userId) => {
    const { error } = await supabase.from("end_of_day_reconciliation").update({
      reconciliation_status: "closed",
      reviewed_by: userId,
      reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", reconciliationId);
    if (error) throw error;
  };
  const getTodaysReconciliation = async () => {
    const today = /* @__PURE__ */ new Date();
    const dateStr = today.toISOString().split("T")[0];
    const { data, error } = await supabase.from("end_of_day_reconciliation").select("*").eq("reconciliation_date", dateStr).maybeSingle();
    if (error) throw error;
    return data;
  };
  return {
    generateEndOfDayReport,
    reviewReconciliation,
    closeDay,
    getTodaysReconciliation,
    countBillableEncounters,
    countFaceSheets,
    countApprovedFaceSheets,
    countSubmittedClaims,
    countInProgressClaims,
    countHardSLABreaches,
    countUnresolvedCriticalItems,
    countUnlinkedCalls,
    countBlockingDocuments
  };
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "EndOfDayReconciliation",
  __ssrInlineRender: true,
  setup(__props) {
    useEndOfDayReconciliation();
    const reconciliation = ref(null);
    const loading = ref(true);
    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const allIssuesResolved = computed(() => {
      if (!reconciliation.value) return false;
      return reconciliation.value.missed_deadlines === 0 && reconciliation.value.unresolved_critical_items === 0 && reconciliation.value.unlinked_calls === 0 && reconciliation.value.blocking_documents === 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "reconciliation-container" }, _attrs))} data-v-f6d8b7da><div class="reconciliation-header" data-v-f6d8b7da><h2 data-v-f6d8b7da>End of Day Reconciliation</h2><p class="timestamp" data-v-f6d8b7da>${ssrInterpolate(formatDate(/* @__PURE__ */ new Date()))}</p></div>`);
      if (unref(loading)) {
        _push(`<div class="loading" data-v-f6d8b7da>Generating reconciliation...</div>`);
      } else {
        _push(`<div class="reconciliation-content" data-v-f6d8b7da>`);
        if (unref(reconciliation)) {
          _push(`<div class="reconciliation-summary" data-v-f6d8b7da><div class="${ssrRenderClass(["all-clear-banner", { cleared: unref(reconciliation).all_clear }])}" data-v-f6d8b7da>`);
          if (unref(reconciliation).all_clear) {
            _push(`<span class="check-icon" data-v-f6d8b7da>\u2705</span>`);
          } else {
            _push(`<span class="warning-icon" data-v-f6d8b7da>\u26A0\uFE0F</span>`);
          }
          _push(`<div class="banner-text" data-v-f6d8b7da><h3 data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).all_clear ? "All Clear!" : "Items Requiring Attention")}</h3><p data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).all_clear ? "You can safely close the day." : `${unref(reconciliation).missed_deadlines + unref(reconciliation).unresolved_critical_items} items need review.`)}</p></div></div><div class="metrics-grid" data-v-f6d8b7da><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u{1F4CB}</span><span class="metric-label" data-v-f6d8b7da>Billable Encounters</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_billable_encounters)}</span></div><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u{1F464}</span><span class="metric-label" data-v-f6d8b7da>Face Sheets Created</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_face_sheets_created)}</span></div><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u2713</span><span class="metric-label" data-v-f6d8b7da>Face Sheets Approved</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_face_sheets_approved)}</span></div><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u23F3</span><span class="metric-label" data-v-f6d8b7da>Face Sheets Pending</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_face_sheets_pending)}</span></div><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u{1F4E4}</span><span class="metric-label" data-v-f6d8b7da>Claims Submitted</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_claims_submitted)}</span></div><div class="metric-card" data-v-f6d8b7da><span class="metric-icon" data-v-f6d8b7da>\u231B</span><span class="metric-label" data-v-f6d8b7da>Claims In Progress</span><span class="metric-value" data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).total_claims_in_progress)}</span></div></div><div class="issues-section" data-v-f6d8b7da><h3 data-v-f6d8b7da>Issues Requiring Attention</h3>`);
          if (unref(reconciliation).missed_deadlines > 0) {
            _push(`<div class="issue-item critical" data-v-f6d8b7da><span class="issue-icon" data-v-f6d8b7da>\u{1F6A8}</span><div class="issue-content" data-v-f6d8b7da><h4 data-v-f6d8b7da>Hard SLA Breaches</h4><p data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).missed_deadlines)} items have missed hard deadlines</p></div><button class="view-btn" data-v-f6d8b7da>View</button></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(reconciliation).unresolved_critical_items > 0) {
            _push(`<div class="issue-item warning" data-v-f6d8b7da><span class="issue-icon" data-v-f6d8b7da>\u26A0\uFE0F</span><div class="issue-content" data-v-f6d8b7da><h4 data-v-f6d8b7da>Unresolved Critical Items</h4><p data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).unresolved_critical_items)} critical items need resolution</p></div><button class="view-btn" data-v-f6d8b7da>View</button></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(reconciliation).unlinked_calls > 0) {
            _push(`<div class="issue-item" data-v-f6d8b7da><span class="issue-icon" data-v-f6d8b7da>\u{1F4DE}</span><div class="issue-content" data-v-f6d8b7da><h4 data-v-f6d8b7da>Unlinked Calls</h4><p data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).unlinked_calls)} calls not linked to billing records</p></div><button class="view-btn" data-v-f6d8b7da>View</button></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(reconciliation).blocking_documents > 0) {
            _push(`<div class="issue-item" data-v-f6d8b7da><span class="issue-icon" data-v-f6d8b7da>\u{1F4C4}</span><div class="issue-content" data-v-f6d8b7da><h4 data-v-f6d8b7da>Blocking Documents</h4><p data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).blocking_documents)} documents are blocking billing</p></div><button class="view-btn" data-v-f6d8b7da>View</button></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(allIssuesResolved)) {
            _push(`<div class="no-issues" data-v-f6d8b7da><span data-v-f6d8b7da>\u2705 All issues resolved</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="action-buttons" data-v-f6d8b7da>`);
          if (!unref(reconciliation).all_clear) {
            _push(`<button class="review-btn" data-v-f6d8b7da> Review Issues </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="close-btn"${ssrIncludeBooleanAttr(!unref(reconciliation).all_clear) ? " disabled" : ""} data-v-f6d8b7da>${ssrInterpolate(unref(reconciliation).all_clear ? "Close Day" : "Cannot close yet")}</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EndOfDayReconciliation.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_9 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-f6d8b7da"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "billing-workspace",
  __ssrInlineRender: true,
  setup(__props) {
    useBillingWorkspace();
    const activeTab = ref("overview");
    const dashboard = ref({
      totalEmails: 0,
      unreadEmails: 0,
      totalCalls: 0,
      pendingCalls: 0,
      escalatedCalls: 0,
      totalFaxes: 0,
      pendingFaxes: 0,
      totalDocuments: 0,
      draftDocuments: 0
    });
    const activityLog = ref([]);
    const tabs = computed(() => [
      { id: "overview", name: "Overview", icon: "\u{1F3E0}", badge: 0 },
      { id: "sla", name: "SLA & Priority", icon: "\u23F1\uFE0F", badge: 0 },
      { id: "facesheet", name: "Face Sheets", icon: "\u{1F464}", badge: 0 },
      { id: "approval", name: "Approvals", icon: "\u2713", badge: 0 },
      { id: "queues", name: "Queues", icon: "\u{1F4CB}", badge: 0 },
      { id: "eod", name: "End of Day", icon: "\u{1F319}", badge: 0 },
      { id: "email", name: "Email", icon: "\u{1F4E7}", badge: dashboard.value.unreadEmails },
      { id: "phone", name: "Phone", icon: "\u{1F4DE}", badge: dashboard.value.escalatedCalls },
      { id: "fax", name: "Fax", icon: "\u{1F4E0}", badge: dashboard.value.pendingFaxes },
      { id: "documents", name: "Documents", icon: "\u{1F4C4}", badge: 0 },
      { id: "builders", name: "Builders", icon: "\u{1F528}", badge: 0 }
    ]);
    const getActivityIcon = (type) => {
      const icons = {
        email_sent: "\u{1F4E7}",
        email_received: "\u{1F4E8}",
        call_made: "\u{1F4DE}",
        fax_sent: "\u{1F4E0}",
        document_created: "\u{1F4C4}",
        document_edited: "\u270F\uFE0F",
        document_finalized: "\u{1F512}"
      };
      return icons[type] || "\u{1F4CB}";
    };
    const formatDateTime = (date) => {
      const d = new Date(date);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SystemFailoverStatus = __nuxt_component_0;
      const _component_PhoneSystem = __nuxt_component_1;
      const _component_BillingEmailCenter = __nuxt_component_2;
      const _component_AIPhoneAssistant = __nuxt_component_3;
      const _component_BillingFaxCenter = __nuxt_component_4;
      const _component_DocumentWorkspace = __nuxt_component_5;
      const _component_QueueManagement = __nuxt_component_6;
      const _component_WorkspaceBuilders = __nuxt_component_7;
      const _component_AIFaceSheetReviewer = __nuxt_component_8;
      const _component_EndOfDayReconciliation = __nuxt_component_9;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "billing-workspace" }, _attrs))} data-v-9d657fdd><div class="workspace-header" data-v-9d657fdd><div class="header-content" data-v-9d657fdd><h1 data-v-9d657fdd>Founder Billing Workspace</h1><p class="workspace-subtitle" data-v-9d657fdd>Private billing command center for communications and documents</p></div><div class="workspace-stats" data-v-9d657fdd><div class="stat-box" data-v-9d657fdd><span class="stat-value" data-v-9d657fdd>${ssrInterpolate(unref(dashboard).unreadEmails)}</span><span class="stat-label" data-v-9d657fdd>Unread Emails</span></div><div class="stat-box" data-v-9d657fdd><span class="stat-value" data-v-9d657fdd>${ssrInterpolate(unref(dashboard).escalatedCalls)}</span><span class="stat-label" data-v-9d657fdd>Escalated Calls</span></div><div class="stat-box" data-v-9d657fdd><span class="stat-value" data-v-9d657fdd>${ssrInterpolate(unref(dashboard).pendingFaxes)}</span><span class="stat-label" data-v-9d657fdd>Pending Faxes</span></div><div class="stat-box" data-v-9d657fdd><span class="stat-value" data-v-9d657fdd>${ssrInterpolate(unref(dashboard).draftDocuments)}</span><span class="stat-label" data-v-9d657fdd>Draft Documents</span></div></div></div><div class="workspace-tabs" data-v-9d657fdd><!--[-->`);
      ssrRenderList(unref(tabs), (tab) => {
        _push(`<button class="${ssrRenderClass(["tab-button", { active: unref(activeTab) === tab.id }])}" data-v-9d657fdd><span class="tab-icon" data-v-9d657fdd>${ssrInterpolate(tab.icon)}</span><span class="tab-name" data-v-9d657fdd>${ssrInterpolate(tab.name)}</span>`);
        if (tab.badge > 0) {
          _push(`<span class="tab-badge" data-v-9d657fdd>${ssrInterpolate(tab.badge)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div>`);
      _push(ssrRenderComponent(_component_SystemFailoverStatus, null, null, _parent));
      _push(ssrRenderComponent(_component_PhoneSystem, null, null, _parent));
      _push(`<div class="workspace-content" data-v-9d657fdd><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "overview" ? null : { display: "none" })}" data-v-9d657fdd><div class="overview-section" data-v-9d657fdd><h2 data-v-9d657fdd>Workspace Overview</h2><div class="overview-grid" data-v-9d657fdd><div class="overview-card" data-v-9d657fdd><div class="card-icon" data-v-9d657fdd>\u{1F4E7}</div><div class="card-content" data-v-9d657fdd><h3 data-v-9d657fdd>Email Communications</h3><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).totalEmails)} total emails</p><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).unreadEmails)} unread</p></div></div><div class="overview-card" data-v-9d657fdd><div class="card-icon" data-v-9d657fdd>\u{1F4DE}</div><div class="card-content" data-v-9d657fdd><h3 data-v-9d657fdd>AI Phone Calls</h3><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).totalCalls)} total calls</p><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).pendingCalls)} pending review</p><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).escalatedCalls)} escalated</p></div></div><div class="overview-card" data-v-9d657fdd><div class="card-icon" data-v-9d657fdd>\u{1F4E0}</div><div class="card-content" data-v-9d657fdd><h3 data-v-9d657fdd>Fax Communications</h3><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).totalFaxes)} total faxes</p><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).pendingFaxes)} pending</p></div></div><div class="overview-card" data-v-9d657fdd><div class="card-icon" data-v-9d657fdd>\u{1F4C4}</div><div class="card-content" data-v-9d657fdd><h3 data-v-9d657fdd>Documents</h3><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).totalDocuments)} total documents</p><p data-v-9d657fdd>${ssrInterpolate(unref(dashboard).draftDocuments)} drafts</p></div></div></div><div class="recent-activity" data-v-9d657fdd><h3 data-v-9d657fdd>Recent Activity</h3>`);
      if (unref(activityLog).length === 0) {
        _push(`<div class="no-activity" data-v-9d657fdd> No recent activity </div>`);
      } else {
        _push(`<div class="activity-list" data-v-9d657fdd><!--[-->`);
        ssrRenderList(unref(activityLog), (activity) => {
          _push(`<div class="activity-item" data-v-9d657fdd><span class="activity-icon" data-v-9d657fdd>${ssrInterpolate(getActivityIcon(activity.activity_type))}</span><div class="activity-details" data-v-9d657fdd><span class="activity-description" data-v-9d657fdd>${ssrInterpolate(activity.activity_description)}</span><span class="activity-time" data-v-9d657fdd>${ssrInterpolate(formatDateTime(activity.created_at))}</span></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="workspace-info" data-v-9d657fdd><h3 data-v-9d657fdd>About This Workspace</h3><div class="info-content" data-v-9d657fdd><p data-v-9d657fdd>This is a private, founder-only workspace for billing operations.</p><ul data-v-9d657fdd><li data-v-9d657fdd><strong data-v-9d657fdd>Email:</strong> Internal billing communications via Malibu</li><li data-v-9d657fdd><strong data-v-9d657fdd>AI Phone:</strong> Human-quality voice assistant for insurance calls</li><li data-v-9d657fdd><strong data-v-9d657fdd>Fax:</strong> Compliance and legacy payer requirements</li><li data-v-9d657fdd><strong data-v-9d657fdd>Documents:</strong> Cloud-based office suite with version control</li></ul><p class="security-note" data-v-9d657fdd>\u{1F512} All content is encrypted, audited, and immutable when finalized</p></div></div></div></div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "email" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_BillingEmailCenter, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "phone" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_AIPhoneAssistant, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "fax" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_BillingFaxCenter, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "documents" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_DocumentWorkspace, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "queues" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_QueueManagement, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "builders" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_WorkspaceBuilders, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "sla" ? null : { display: "none" })}" data-v-9d657fdd><div class="sla-dashboard" data-v-9d657fdd><h2 data-v-9d657fdd>SLA Timers &amp; Priority Scoring</h2><p class="subtitle" data-v-9d657fdd>Real-time SLA tracking across all queues with priority escalation</p><div class="sla-info" data-v-9d657fdd><p data-v-9d657fdd>SLA timers and priority scores are automatically calculated and updated in real-time.</p><p data-v-9d657fdd>Each queue item has a target response time, soft breach threshold, and hard breach threshold.</p><p data-v-9d657fdd>Hard SLA breaches require immediate acknowledgment and appear at the top of all queues.</p></div></div></div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "facesheet" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_AIFaceSheetReviewer, null, null, _parent));
      _push(`</div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "approval" ? null : { display: "none" })}" data-v-9d657fdd><div class="approval-dashboard" data-v-9d657fdd><h2 data-v-9d657fdd>One-Click Approvals</h2><p class="subtitle" data-v-9d657fdd>Review and approve AI decisions with minimal friction</p><div class="approval-info" data-v-9d657fdd><p data-v-9d657fdd>Confidence scoring determines approval workflow:</p><ul data-v-9d657fdd><li data-v-9d657fdd><strong data-v-9d657fdd>High (90-100%):</strong> Auto-approved, no action needed</li><li data-v-9d657fdd><strong data-v-9d657fdd>Medium (70-89%):</strong> One-click approval with uncertainty highlighted</li><li data-v-9d657fdd><strong data-v-9d657fdd>Low (&lt;70%):</strong> Blocked for AI recovery or human correction</li></ul></div></div></div><div class="tab-content" style="${ssrRenderStyle(unref(activeTab) === "eod" ? null : { display: "none" })}" data-v-9d657fdd>`);
      _push(ssrRenderComponent(_component_EndOfDayReconciliation, null, null, _parent));
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/founder/billing-workspace.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const billingWorkspace = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9d657fdd"]]);

export { billingWorkspace as default };
//# sourceMappingURL=billing-workspace-KAh393-4.mjs.map
