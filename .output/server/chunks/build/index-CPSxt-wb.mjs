import { _ as __nuxt_component_0 } from './nuxt-layout-CzSJTQFr.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, unref, createVNode, openBlock, createBlock, createCommentVNode, withDirectives, isRef, vModelSelect, Fragment, renderList, toDisplayString, Teleport, withModifiers, vModelText, watch, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderTeleport, ssrRenderAttr, ssrRenderAttrs } from 'vue/server-renderer';
import { _ as _export_sfc, a as useNuxtApp } from './server.mjs';
import { u as useAuth } from './useAuth-BbjuGs-d.mjs';
import L from 'leaflet';
import { u as useApi } from './useApi-BbYKoEyw.mjs';
import 'vue-router';
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
import '@supabase/supabase-js';

const usePTT = () => {
  const { $supabase } = useNuxtApp();
  const auth = useAuth();
  const mediaRecorder = ref(null);
  const audioStream = ref(null);
  const isTransmitting = ref(false);
  const currentSession = ref(null);
  const startTransmission = async (channelId, options = {}) => {
    var _a, _b, _c;
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { data: crewData } = await $supabase.from("crew_roster").select("id").eq("user_id", user.id).maybeSingle();
    const { data: channel } = await $supabase.from("ptt_channels").select("*").eq("id", channelId).single();
    if (!channel) {
      return { success: false, error: "Channel not found" };
    }
    if (channel.current_speaker_id && !options.isEmergency) {
      return { success: false, error: "Channel is busy" };
    }
    if (channel.current_speaker_id && options.isEmergency) {
      await $supabase.from("ptt_sessions").update({
        ended_at: (/* @__PURE__ */ new Date()).toISOString(),
        interrupted_by: user.id
      }).eq("channel_id", channelId).is("ended_at", null);
    }
    const { data: session, error } = await $supabase.from("ptt_sessions").insert({
      channel_id: channelId,
      talk_group_id: options.talkGroupId || null,
      speaker_id: user.id,
      speaker_crew_id: (crewData == null ? void 0 : crewData.id) || null,
      priority: options.priority || 1,
      is_emergency: options.isEmergency || false,
      location_lat: ((_a = options.location) == null ? void 0 : _a.lat) || null,
      location_lng: ((_b = options.location) == null ? void 0 : _b.lng) || null,
      location_address: ((_c = options.location) == null ? void 0 : _c.address) || null
    }).select().single();
    if (error) {
      console.error("Failed to start PTT session:", error);
      return { success: false, error: error.message };
    }
    await $supabase.from("ptt_channels").update({
      current_speaker_id: user.id,
      speaking_started_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", channelId);
    currentSession.value = session;
    isTransmitting.value = true;
    try {
      audioStream.value = await (void 0).mediaDevices.getUserMedia({ audio: true });
      startRecording(session.id);
    } catch (err) {
      console.error("Failed to access microphone:", err);
    }
    return { success: true, session };
  };
  const endTransmission = async () => {
    if (!currentSession.value) {
      return { success: false, error: "No active session" };
    }
    const endedAt = /* @__PURE__ */ new Date();
    const startedAt = new Date(currentSession.value.started_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1e3);
    await $supabase.from("ptt_sessions").update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds
    }).eq("id", currentSession.value.id);
    await $supabase.from("ptt_channels").update({
      current_speaker_id: null,
      speaking_started_at: null
    }).eq("id", currentSession.value.channel_id);
    stopRecording();
    if (audioStream.value) {
      audioStream.value.getTracks().forEach((track) => track.stop());
      audioStream.value = null;
    }
    isTransmitting.value = false;
    currentSession.value = null;
    return { success: true };
  };
  const startRecording = (sessionId) => {
    if (!audioStream.value) return;
    const chunks = [];
    mediaRecorder.value = new MediaRecorder(audioStream.value);
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    mediaRecorder.value.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      await saveRecording(sessionId, blob);
    };
    mediaRecorder.value.start(100);
  };
  const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
      mediaRecorder.value.stop();
    }
  };
  const saveRecording = async (sessionId, audioBlob) => {
    const user = await auth.getUser();
    if (!user) return;
    const { data: session } = await $supabase.from("ptt_sessions").select("*, channel:ptt_channels(organization_id)").eq("id", sessionId).single();
    if (!session) return;
    const fileName = `ptt-${sessionId}-${Date.now()}.webm`;
    const fileSizeBytes = audioBlob.size;
    const durationSeconds = session.duration_seconds || 0;
    await $supabase.from("ptt_recordings").insert({
      session_id: sessionId,
      organization_id: session.channel.organization_id,
      storage_path: fileName,
      file_size_bytes: fileSizeBytes,
      duration_seconds: durationSeconds,
      format: "webm",
      is_available: true
    });
  };
  const updatePresence = async (status, options = {}) => {
    var _a, _b;
    const user = await auth.getUser();
    if (!user) return;
    const { data: crewData } = await $supabase.from("crew_roster").select("id").eq("user_id", user.id).maybeSingle();
    const { data: existing } = await $supabase.from("ptt_presence").select("id").eq("user_id", user.id).maybeSingle();
    const presenceData = {
      user_id: user.id,
      crew_id: (crewData == null ? void 0 : crewData.id) || null,
      status,
      do_not_disturb: options.doNotDisturb || false,
      current_channel_id: options.channelId || null,
      current_talk_group_id: options.talkGroupId || null,
      location_lat: ((_a = options.location) == null ? void 0 : _a.lat) || null,
      location_lng: ((_b = options.location) == null ? void 0 : _b.lng) || null,
      last_active_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (existing) {
      await $supabase.from("ptt_presence").update(presenceData).eq("id", existing.id);
    } else {
      await $supabase.from("ptt_presence").insert(presenceData);
    }
  };
  const getActivePresence = async (organizationId) => {
    const { data, error } = await $supabase.from("ptt_presence").select(`
        *,
        user:users(full_name, email),
        crew:crew_roster(certification_level, employee_id),
        channel:ptt_channels(channel_name),
        talk_group:talk_groups(group_name)
      `).eq("status", "online").gte("last_active_at", new Date(Date.now() - 5 * 60 * 1e3).toISOString());
    if (error) {
      console.error("Failed to fetch presence:", error);
      return [];
    }
    return data || [];
  };
  const initiateEmergencyBroadcast = async (broadcast) => {
    var _a, _b;
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { data, error } = await $supabase.from("emergency_broadcasts").insert({
      organization_id: broadcast.organizationId,
      initiated_by: user.id,
      emergency_type: broadcast.emergencyType,
      priority: 10,
      title: broadcast.title,
      message: broadcast.message,
      incident_id: broadcast.incidentId || null,
      target_scope: broadcast.targetScope || "organization",
      target_location_lat: ((_a = broadcast.location) == null ? void 0 : _a.lat) || null,
      target_location_lng: ((_b = broadcast.location) == null ? void 0 : _b.lng) || null,
      requires_acknowledgment: true
    }).select().single();
    if (error) {
      console.error("Failed to initiate emergency broadcast:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };
  const acknowledgeEmergencyBroadcast = async (broadcastId, options = {}) => {
    var _a, _b;
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { data: crewData } = await $supabase.from("crew_roster").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = await $supabase.from("emergency_broadcast_acks").insert({
      broadcast_id: broadcastId,
      user_id: user.id,
      crew_id: (crewData == null ? void 0 : crewData.id) || null,
      location_lat: ((_a = options.location) == null ? void 0 : _a.lat) || null,
      location_lng: ((_b = options.location) == null ? void 0 : _b.lng) || null,
      notes: options.notes || null
    });
    if (error) {
      console.error("Failed to acknowledge emergency broadcast:", error);
      return { success: false, error: error.message };
    }
    await $supabase.rpc("increment", {
      table_name: "emergency_broadcasts",
      row_id: broadcastId,
      column_name: "acknowledged_count"
    });
    return { success: true };
  };
  const getChannelHistory = async (channelId, limit = 50) => {
    const { data, error } = await $supabase.from("ptt_sessions").select(`
        *,
        speaker:users(full_name, email),
        crew:crew_roster(certification_level, employee_id),
        recording:ptt_recordings(*)
      `).eq("channel_id", channelId).order("started_at", { ascending: false }).limit(limit);
    if (error) {
      console.error("Failed to fetch channel history:", error);
      return [];
    }
    return data || [];
  };
  const subscribeToChannel = (channelId, callbacks) => {
    const channel = $supabase.channel(`ptt-channel-${channelId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ptt_sessions",
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        if (callbacks.onTransmissionStart) {
          callbacks.onTransmissionStart(payload.new);
        }
      }
    ).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "ptt_sessions",
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        if (payload.new.ended_at && callbacks.onTransmissionEnd) {
          callbacks.onTransmissionEnd(payload.new);
        }
      }
    ).subscribe();
    return () => {
      $supabase.removeChannel(channel);
    };
  };
  return {
    isTransmitting,
    currentSession,
    startTransmission,
    endTransmission,
    updatePresence,
    getActivePresence,
    initiateEmergencyBroadcast,
    acknowledgeEmergencyBroadcast,
    getChannelHistory,
    subscribeToChannel
  };
};
const useTalkGroups = () => {
  const { $supabase } = useNuxtApp();
  const auth = useAuth();
  const getTalkGroups = async (organizationId) => {
    const { data, error } = await $supabase.from("talk_groups").select(`
        *,
        members:talk_group_members(
          *,
          user:users(full_name, email),
          crew:crew_roster(certification_level)
        ),
        channel:ptt_channels(*)
      `).eq("organization_id", organizationId).eq("is_active", true).order("priority_level", { ascending: false });
    if (error) {
      console.error("Failed to fetch talk groups:", error);
      return [];
    }
    return data || [];
  };
  const getTalkGroup = async (groupId) => {
    const { data, error } = await $supabase.from("talk_groups").select(`
        *,
        members:talk_group_members(
          *,
          user:users(full_name, email),
          crew:crew_roster(certification_level, employee_id)
        ),
        channel:ptt_channels(
          *,
          current_speaker:users(full_name)
        )
      `).eq("id", groupId).single();
    if (error) {
      console.error("Failed to fetch talk group:", error);
      return null;
    }
    return data;
  };
  const createTalkGroup = async (group) => {
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { data: groupData, error: groupError } = await $supabase.from("talk_groups").insert({
      organization_id: group.organizationId,
      group_name: group.groupName,
      group_type: group.groupType || "standard",
      description: group.description || null,
      priority_level: group.priorityLevel || 1,
      is_emergency: group.isEmergency || false,
      auto_join: group.autoJoin || false,
      created_by: user.id,
      incident_id: group.incidentId || null,
      station: group.station || null,
      max_members: group.maxMembers || null
    }).select().single();
    if (groupError) {
      console.error("Failed to create talk group:", groupError);
      return { success: false, error: groupError.message };
    }
    const { data: channelData, error: channelError } = await $supabase.from("ptt_channels").insert({
      organization_id: group.organizationId,
      talk_group_id: groupData.id,
      channel_type: "group",
      channel_name: group.groupName,
      is_emergency: group.isEmergency || false,
      priority_level: group.priorityLevel || 1
    }).select().single();
    if (channelError) {
      console.error("Failed to create PTT channel:", channelError);
    }
    if (group.autoJoin) {
      await joinTalkGroup(groupData.id);
    }
    return { success: true, data: groupData };
  };
  const joinTalkGroup = async (groupId, role = "member") => {
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { data: crewData } = await $supabase.from("crew_roster").select("id").eq("user_id", user.id).maybeSingle();
    const { data: existing } = await $supabase.from("talk_group_members").select("id, is_active").eq("talk_group_id", groupId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      if (!existing.is_active) {
        await $supabase.from("talk_group_members").update({
          is_active: true,
          joined_at: (/* @__PURE__ */ new Date()).toISOString(),
          left_at: null
        }).eq("id", existing.id);
      }
      return { success: true };
    }
    const { error } = await $supabase.from("talk_group_members").insert({
      talk_group_id: groupId,
      user_id: user.id,
      crew_id: (crewData == null ? void 0 : crewData.id) || null,
      role
    });
    if (error) {
      console.error("Failed to join talk group:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };
  const leaveTalkGroup = async (groupId) => {
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const { error } = await $supabase.from("talk_group_members").update({
      is_active: false,
      left_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("talk_group_id", groupId).eq("user_id", user.id);
    if (error) {
      console.error("Failed to leave talk group:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };
  const getMyTalkGroups = async () => {
    const user = await auth.getUser();
    if (!user) return [];
    const { data, error } = await $supabase.from("talk_group_members").select(`
        *,
        talk_group:talk_groups(
          *,
          channel:ptt_channels(
            *,
            current_speaker:users(full_name)
          )
        )
      `).eq("user_id", user.id).eq("is_active", true);
    if (error) {
      console.error("Failed to fetch user talk groups:", error);
      return [];
    }
    return (data == null ? void 0 : data.map((m) => m.talk_group)) || [];
  };
  const getChannelForGroup = async (groupId) => {
    const { data, error } = await $supabase.from("ptt_channels").select(`
        *,
        talk_group:talk_groups(*),
        current_speaker:users(full_name, email)
      `).eq("talk_group_id", groupId).eq("is_active", true).maybeSingle();
    if (error) {
      console.error("Failed to fetch channel for group:", error);
      return null;
    }
    return data;
  };
  const createDirectChannel = async (targetUserId, organizationId) => {
    const user = await auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    const channelName = `Direct: ${user.id} <-> ${targetUserId}`;
    const { data, error } = await $supabase.from("ptt_channels").insert({
      organization_id: organizationId,
      channel_type: "direct",
      channel_name: channelName,
      priority_level: 1
    }).select().single();
    if (error) {
      console.error("Failed to create direct channel:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };
  const getActiveBroadcasts = async (organizationId) => {
    const { data, error } = await $supabase.from("emergency_broadcasts").select(`
        *,
        initiator:users(full_name, email),
        acknowledgments:emergency_broadcast_acks(
          *,
          user:users(full_name)
        )
      `).eq("organization_id", organizationId).eq("is_active", true).order("started_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch active broadcasts:", error);
      return [];
    }
    return data || [];
  };
  const updateTalkGroup = async (groupId, updates) => {
    const { error } = await $supabase.from("talk_groups").update({
      group_name: updates.groupName,
      description: updates.description,
      priority_level: updates.priorityLevel,
      is_active: updates.isActive,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", groupId);
    if (error) {
      console.error("Failed to update talk group:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };
  const deleteTalkGroup = async (groupId) => {
    const { error } = await $supabase.from("talk_groups").update({
      is_active: false,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", groupId);
    if (error) {
      console.error("Failed to delete talk group:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };
  const subscribeToTalkGroupUpdates = (organizationId, callback) => {
    const channel = $supabase.channel("talk-groups").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "talk_groups",
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        callback(payload.new);
      }
    ).subscribe();
    return () => {
      $supabase.removeChannel(channel);
    };
  };
  return {
    getTalkGroups,
    getTalkGroup,
    createTalkGroup,
    joinTalkGroup,
    leaveTalkGroup,
    getMyTalkGroups,
    getChannelForGroup,
    createDirectChannel,
    getActiveBroadcasts,
    updateTalkGroup,
    deleteTalkGroup,
    subscribeToTalkGroupUpdates
  };
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "CrewLink",
  __ssrInlineRender: true,
  props: {
    organizationId: {}
  },
  setup(__props) {
    const ptt = usePTT();
    useTalkGroups();
    const myTalkGroups = ref([]);
    const allTalkGroups = ref([]);
    const selectedGroupId = ref("");
    const currentChannel = ref(null);
    const onlineUsers = ref([]);
    const recentSessions = ref([]);
    const activeBroadcasts = ref([]);
    const isTransmitting = ref(false);
    const channelBusy = ref(false);
    const showEmergencyModal = ref(false);
    const showGroupsModal = ref(false);
    const acknowledgedBroadcasts = ref(/* @__PURE__ */ new Set());
    const emergencyBroadcast = ref({
      type: "all_call",
      title: "",
      message: "",
      scope: "organization"
    });
    const hasAcknowledged = (broadcastId) => {
      return acknowledgedBroadcasts.value.has(broadcastId);
    };
    const isMember = (groupId) => {
      return myTalkGroups.value.some((g) => g.id === groupId);
    };
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString();
    };
    watch(() => {
      var _a;
      return (_a = currentChannel.value) == null ? void 0 : _a.current_speaker_id;
    }, (newSpeaker) => {
      var _a;
      channelBusy.value = !!newSpeaker && newSpeaker !== ((_a = ptt.currentSession.value) == null ? void 0 : _a.speaker_id);
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "crewlink-ptt" }, _attrs))} data-v-97f6cf20><div class="ptt-header" data-v-97f6cf20><h1 data-v-97f6cf20>CrewLink PTT</h1><div class="header-controls" data-v-97f6cf20><button class="btn-emergency" data-v-97f6cf20> Emergency Broadcast </button><button class="btn-secondary" data-v-97f6cf20> Manage Groups </button></div></div><div class="ptt-layout" data-v-97f6cf20><div class="ptt-main" data-v-97f6cf20><div class="talk-group-selector" data-v-97f6cf20><label data-v-97f6cf20>Active Talk Group</label><select class="form-select" data-v-97f6cf20><option value="" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(selectedGroupId)) ? ssrLooseContain(unref(selectedGroupId), "") : ssrLooseEqual(unref(selectedGroupId), "")) ? " selected" : ""}>Select a group...</option><!--[-->`);
      ssrRenderList(unref(myTalkGroups), (group) => {
        _push(`<option${ssrRenderAttr("value", group.id)} data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(selectedGroupId)) ? ssrLooseContain(unref(selectedGroupId), group.id) : ssrLooseEqual(unref(selectedGroupId), group.id)) ? " selected" : ""}>${ssrInterpolate(group.group_name)} ${ssrInterpolate(group.priority_level > 5 ? " [PRIORITY]" : "")}</option>`);
      });
      _push(`<!--]--></select></div>`);
      if (unref(currentChannel)) {
        _push(`<div class="channel-info" data-v-97f6cf20><div class="channel-status" data-v-97f6cf20><span class="channel-name" data-v-97f6cf20>${ssrInterpolate(unref(currentChannel).channel_name)}</span>`);
        if (unref(currentChannel).is_emergency) {
          _push(`<span class="badge-emergency" data-v-97f6cf20>EMERGENCY</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="participant-count" data-v-97f6cf20>${ssrInterpolate(unref(onlineUsers).length)} online</span></div>`);
        if (unref(currentChannel).current_speaker_id) {
          _push(`<div class="active-speaker" data-v-97f6cf20><div class="speaker-indicator pulsing" data-v-97f6cf20></div><span data-v-97f6cf20>${ssrInterpolate(((_a = unref(currentChannel).current_speaker) == null ? void 0 : _a.full_name) || "Unknown")} is speaking...</span></div>`);
        } else if (!unref(isTransmitting)) {
          _push(`<div class="channel-idle" data-v-97f6cf20> Channel clear - Press to talk </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="ptt-controls" data-v-97f6cf20>`);
      if (unref(currentChannel)) {
        _push(`<button class="${ssrRenderClass(["ptt-button", { active: unref(isTransmitting), disabled: !unref(currentChannel) || unref(channelBusy) }])}"${ssrIncludeBooleanAttr(!unref(currentChannel) || unref(channelBusy)) ? " disabled" : ""} data-v-97f6cf20><div class="ptt-icon" data-v-97f6cf20>`);
        if (!unref(isTransmitting)) {
          _push(`<svg viewBox="0 0 24 24" fill="currentColor" data-v-97f6cf20><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" data-v-97f6cf20></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" data-v-97f6cf20></path></svg>`);
        } else {
          _push(`<svg viewBox="0 0 24 24" fill="currentColor" data-v-97f6cf20><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" data-v-97f6cf20></path><circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.3" data-v-97f6cf20><animate attributeName="r" from="8" to="12" dur="1s" repeatCount="indefinite" data-v-97f6cf20></animate><animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" data-v-97f6cf20></animate></circle></svg>`);
        }
        _push(`</div><span class="ptt-text" data-v-97f6cf20>${ssrInterpolate(unref(isTransmitting) ? "TRANSMITTING" : "PUSH TO TALK")}</span><span class="ptt-hint" data-v-97f6cf20>Press and hold</span></button>`);
      } else {
        _push(`<div class="no-channel-selected" data-v-97f6cf20><p data-v-97f6cf20>Select a talk group to start communicating</p></div>`);
      }
      _push(`</div>`);
      if (unref(activeBroadcasts).length > 0) {
        _push(`<div class="emergency-alerts" data-v-97f6cf20><!--[-->`);
        ssrRenderList(unref(activeBroadcasts), (broadcast) => {
          _push(`<div class="emergency-alert pulsing" data-v-97f6cf20><div class="alert-header" data-v-97f6cf20><span class="alert-type" data-v-97f6cf20>${ssrInterpolate(broadcast.emergency_type)}</span><span class="alert-time" data-v-97f6cf20>${ssrInterpolate(formatTime(broadcast.started_at))}</span></div><div class="alert-title" data-v-97f6cf20>${ssrInterpolate(broadcast.title)}</div><div class="alert-message" data-v-97f6cf20>${ssrInterpolate(broadcast.message)}</div>`);
          if (!hasAcknowledged(broadcast.id)) {
            _push(`<button class="btn-acknowledge" data-v-97f6cf20> Acknowledge (${ssrInterpolate(broadcast.acknowledged_count)}/${ssrInterpolate(unref(onlineUsers).length)}) </button>`);
          } else {
            _push(`<div class="acknowledged" data-v-97f6cf20>Acknowledged</div>`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="online-users" data-v-97f6cf20><h3 data-v-97f6cf20>Online Users (${ssrInterpolate(unref(onlineUsers).length)})</h3><div class="users-list" data-v-97f6cf20><!--[-->`);
      ssrRenderList(unref(onlineUsers), (presence) => {
        var _a2, _b, _c;
        _push(`<div class="${ssrRenderClass([{ speaking: presence.user_id === ((_a2 = unref(currentChannel)) == null ? void 0 : _a2.current_speaker_id) }, "user-presence"])}" data-v-97f6cf20><div class="presence-indicator" data-v-97f6cf20></div><div class="user-info" data-v-97f6cf20><span class="user-name" data-v-97f6cf20>${ssrInterpolate((_b = presence.user) == null ? void 0 : _b.full_name)}</span><span class="user-cert" data-v-97f6cf20>${ssrInterpolate((_c = presence.crew) == null ? void 0 : _c.certification_level)}</span></div>`);
        if (presence.do_not_disturb) {
          _push(`<span class="dnd-badge" data-v-97f6cf20>DND</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div></div><div class="ptt-sidebar" data-v-97f6cf20><div class="sidebar-section" data-v-97f6cf20><h3 data-v-97f6cf20>Talk Groups</h3><div class="groups-list" data-v-97f6cf20><!--[-->`);
      ssrRenderList(unref(myTalkGroups), (group) => {
        var _a2;
        _push(`<div class="${ssrRenderClass([{ active: group.id === unref(selectedGroupId), emergency: group.is_emergency }, "group-card"])}" data-v-97f6cf20><div class="group-name" data-v-97f6cf20>${ssrInterpolate(group.group_name)}</div><div class="group-meta" data-v-97f6cf20><span class="group-type" data-v-97f6cf20>${ssrInterpolate(group.group_type)}</span>`);
        if ((_a2 = group.channel) == null ? void 0 : _a2.current_speaker_id) {
          _push(`<span class="speaking-indicator" data-v-97f6cf20> Speaking </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]--></div></div><div class="sidebar-section" data-v-97f6cf20><h3 data-v-97f6cf20>Recent Transmissions</h3><div class="history-list" data-v-97f6cf20><!--[-->`);
      ssrRenderList(unref(recentSessions), (session) => {
        var _a2;
        _push(`<div class="history-item" data-v-97f6cf20><div class="session-speaker" data-v-97f6cf20>${ssrInterpolate((_a2 = session.speaker) == null ? void 0 : _a2.full_name)}</div><div class="session-meta" data-v-97f6cf20><span class="session-time" data-v-97f6cf20>${ssrInterpolate(formatTime(session.started_at))}</span><span class="session-duration" data-v-97f6cf20>${ssrInterpolate(session.duration_seconds)}s</span></div></div>`);
      });
      _push(`<!--]--></div></div></div></div>`);
      if (unref(showEmergencyModal)) {
        _push(`<div class="modal-overlay" data-v-97f6cf20><div class="modal-content emergency-modal" data-v-97f6cf20><div class="modal-header" data-v-97f6cf20><h2 data-v-97f6cf20>Emergency Broadcast</h2><button class="btn-close" data-v-97f6cf20>\xD7</button></div><div class="modal-body" data-v-97f6cf20><div class="form-group" data-v-97f6cf20><label data-v-97f6cf20>Emergency Type</label><select class="form-select" data-v-97f6cf20><option value="mayday" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "mayday") : ssrLooseEqual(unref(emergencyBroadcast).type, "mayday")) ? " selected" : ""}>Mayday</option><option value="officer_down" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "officer_down") : ssrLooseEqual(unref(emergencyBroadcast).type, "officer_down")) ? " selected" : ""}>Officer Down</option><option value="mass_casualty" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "mass_casualty") : ssrLooseEqual(unref(emergencyBroadcast).type, "mass_casualty")) ? " selected" : ""}>Mass Casualty</option><option value="hazmat" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "hazmat") : ssrLooseEqual(unref(emergencyBroadcast).type, "hazmat")) ? " selected" : ""}>Hazmat</option><option value="evacuation" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "evacuation") : ssrLooseEqual(unref(emergencyBroadcast).type, "evacuation")) ? " selected" : ""}>Evacuation</option><option value="all_call" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).type) ? ssrLooseContain(unref(emergencyBroadcast).type, "all_call") : ssrLooseEqual(unref(emergencyBroadcast).type, "all_call")) ? " selected" : ""}>All Call</option></select></div><div class="form-group" data-v-97f6cf20><label data-v-97f6cf20>Title</label><input${ssrRenderAttr("value", unref(emergencyBroadcast).title)} type="text" class="form-input" data-v-97f6cf20></div><div class="form-group" data-v-97f6cf20><label data-v-97f6cf20>Message</label><textarea class="form-textarea" rows="4" data-v-97f6cf20>${ssrInterpolate(unref(emergencyBroadcast).message)}</textarea></div><div class="form-group" data-v-97f6cf20><label data-v-97f6cf20>Target Scope</label><select class="form-select" data-v-97f6cf20><option value="organization" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).scope) ? ssrLooseContain(unref(emergencyBroadcast).scope, "organization") : ssrLooseEqual(unref(emergencyBroadcast).scope, "organization")) ? " selected" : ""}>Entire Organization</option><option value="station" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).scope) ? ssrLooseContain(unref(emergencyBroadcast).scope, "station") : ssrLooseEqual(unref(emergencyBroadcast).scope, "station")) ? " selected" : ""}>Specific Station</option><option value="radius" data-v-97f6cf20${ssrIncludeBooleanAttr(Array.isArray(unref(emergencyBroadcast).scope) ? ssrLooseContain(unref(emergencyBroadcast).scope, "radius") : ssrLooseEqual(unref(emergencyBroadcast).scope, "radius")) ? " selected" : ""}>Geographic Radius</option></select></div></div><div class="modal-footer" data-v-97f6cf20><button class="btn-secondary" data-v-97f6cf20>Cancel</button><button class="btn-emergency" data-v-97f6cf20> Send Emergency Broadcast </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showGroupsModal)) {
        _push(`<div class="modal-overlay" data-v-97f6cf20><div class="modal-content" data-v-97f6cf20><div class="modal-header" data-v-97f6cf20><h2 data-v-97f6cf20>Manage Talk Groups</h2><button class="btn-close" data-v-97f6cf20>\xD7</button></div><div class="modal-body" data-v-97f6cf20><div class="groups-management" data-v-97f6cf20><!--[-->`);
        ssrRenderList(unref(allTalkGroups), (group) => {
          var _a2;
          _push(`<div class="group-item" data-v-97f6cf20><div class="group-info-full" data-v-97f6cf20><div class="group-header-row" data-v-97f6cf20><span class="group-name-full" data-v-97f6cf20>${ssrInterpolate(group.group_name)}</span><span class="priority-badge" data-v-97f6cf20>P${ssrInterpolate(group.priority_level)}</span></div><p class="group-description" data-v-97f6cf20>${ssrInterpolate(group.description)}</p><div class="group-stats" data-v-97f6cf20><span data-v-97f6cf20>${ssrInterpolate(((_a2 = group.members) == null ? void 0 : _a2.length) || 0)} members</span><span data-v-97f6cf20>${ssrInterpolate(group.group_type)}</span></div></div><div class="group-actions" data-v-97f6cf20>`);
          if (!isMember(group.id)) {
            _push(`<button class="btn-join" data-v-97f6cf20> Join </button>`);
          } else {
            _push(`<button class="btn-leave" data-v-97f6cf20> Leave </button>`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CrewLink.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-97f6cf20"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "MapNavigation",
  __ssrInlineRender: true,
  props: {
    destination: {},
    origin: {}
  },
  setup(__props) {
    const props = __props;
    ref(null);
    const map = ref(null);
    const route = ref(null);
    const loading = ref(false);
    const error = ref("");
    const showDirections = ref(false);
    let routeLayer = null;
    let originMarker = null;
    let destinationMarker = null;
    const geocodeAddress = async (address) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }
        return null;
      } catch (err) {
        console.error("Geocoding error:", err);
        return null;
      }
    };
    const calculateRoute = async (start, end) => {
      try {
        loading.value = true;
        error.value = "";
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
        );
        const data = await response.json();
        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
          throw new Error("No route found");
        }
        const routeData = data.routes[0];
        route.value = {
          distance: routeData.distance,
          duration: routeData.duration,
          geometry: routeData.geometry.coordinates,
          steps: routeData.legs[0].steps.map((step) => ({
            instruction: step.maneuver.type === "depart" ? `Head ${step.maneuver.modifier || "forward"} on ${step.name || "road"}` : step.maneuver.type === "arrive" ? "Arrive at destination" : `${step.maneuver.type.replace(/-/g, " ")} ${step.maneuver.modifier || ""} onto ${step.name || "road"}`.trim(),
            distance: step.distance
          }))
        };
        drawRoute(routeData.geometry.coordinates, start, end);
      } catch (err) {
        error.value = "Failed to calculate route. Please try again.";
        console.error("Routing error:", err);
      } finally {
        loading.value = false;
      }
    };
    const drawRoute = (coordinates, start, end) => {
      if (!map.value) return;
      if (routeLayer) {
        map.value.removeLayer(routeLayer);
      }
      if (originMarker) {
        map.value.removeLayer(originMarker);
      }
      if (destinationMarker) {
        map.value.removeLayer(destinationMarker);
      }
      const latlngs = coordinates.map((coord) => [coord[1], coord[0]]);
      routeLayer = L.polyline(latlngs, {
        color: "#ff6b00",
        weight: 5,
        opacity: 0.8
      }).addTo(map.value);
      const originIcon = L.divIcon({
        html: '<div style="background: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
        className: "custom-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      const destIcon = L.divIcon({
        html: '<div style="background: #ff6b00; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
        className: "custom-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      originMarker = L.marker([start.lat, start.lng], { icon: originIcon }).addTo(map.value);
      destinationMarker = L.marker([end.lat, end.lng], { icon: destIcon }).addTo(map.value);
      map.value.fitBounds(routeLayer.getBounds(), {
        padding: [50, 50]
      });
    };
    const loadRoute = async () => {
      if (!props.destination) return;
      let destCoords = props.destination.lat && props.destination.lng ? { lat: props.destination.lat, lng: props.destination.lng } : await geocodeAddress(props.destination.address);
      if (!destCoords) {
        error.value = "Could not find destination location";
        return;
      }
      const startCoords = props.origin || { lat: 40.7128, lng: -74.006 };
      await calculateRoute(startCoords, destCoords);
    };
    const formatDistance = (meters) => {
      const miles = meters / 1609.344;
      return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
    };
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    };
    watch(() => props.destination, () => {
      loadRoute();
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "map-navigation" }, _attrs))} data-v-17d21ebe><div class="map-container" data-v-17d21ebe></div>`);
      if (unref(route)) {
        _push(`<div class="route-info" data-v-17d21ebe><div class="route-header" data-v-17d21ebe><div class="route-stats" data-v-17d21ebe><div class="stat" data-v-17d21ebe><span class="stat-label" data-v-17d21ebe>Distance</span><span class="stat-value" data-v-17d21ebe>${ssrInterpolate(formatDistance(unref(route).distance))}</span></div><div class="stat" data-v-17d21ebe><span class="stat-label" data-v-17d21ebe>ETA</span><span class="stat-value" data-v-17d21ebe>${ssrInterpolate(formatDuration(unref(route).duration))}</span></div></div><button class="btn-refresh"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-17d21ebe>${ssrInterpolate(unref(loading) ? "Updating..." : "Refresh Route")}</button></div>`);
        if (unref(showDirections)) {
          _push(`<div class="directions-panel" data-v-17d21ebe><h3 data-v-17d21ebe>Turn-by-Turn Directions</h3><div class="directions-list" data-v-17d21ebe><!--[-->`);
          ssrRenderList(unref(route).steps, (step, index2) => {
            _push(`<div class="direction-step" data-v-17d21ebe><div class="step-number" data-v-17d21ebe>${ssrInterpolate(index2 + 1)}</div><div class="step-content" data-v-17d21ebe><div class="step-instruction" data-v-17d21ebe>${ssrInterpolate(step.instruction)}</div><div class="step-distance" data-v-17d21ebe>${ssrInterpolate(formatDistance(step.distance))}</div></div></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="btn-toggle-directions" data-v-17d21ebe>${ssrInterpolate(unref(showDirections) ? "Hide" : "Show")} Directions </button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<div class="error-message" data-v-17d21ebe>${ssrInterpolate(unref(error))}</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MapNavigation.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-17d21ebe"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { $supabase } = useNuxtApp();
    const api = useApi();
    useAuth();
    const activeTab = ref("incidents");
    const organizationId = ref("");
    const incidents = ref([]);
    const selectedIncident = ref(null);
    const assignedUnits = ref([]);
    const availableUnits = ref([]);
    const filter = ref("active");
    const loading = ref(true);
    const showNewIncidentModal = ref(false);
    const showDispatchModal = ref(false);
    const creating = ref(false);
    const dispatching = ref(false);
    const newIncident = ref({
      incident_type: "",
      priority: 3,
      location_address: "",
      location_details: "",
      caller_name: "",
      caller_phone: "",
      chief_complaint: ""
    });
    const dispatchData = ref({
      unit_id: ""
    });
    const unitLocation = ref(void 0);
    const filteredIncidents = computed(() => {
      if (filter.value === "all") return incidents.value;
      if (filter.value === "active") {
        return incidents.value.filter((i) => ["pending", "dispatched", "active"].includes(i.status));
      }
      return incidents.value.filter((i) => i.status === filter.value);
    });
    const shouldShowMap = computed(() => {
      return selectedIncident.value && assignedUnits.value.length > 0;
    });
    const fetchIncidents = async () => {
      loading.value = true;
      const result = await api.incidents.list();
      if (result.success) {
        incidents.value = result.data;
      }
      loading.value = false;
    };
    const selectIncident = async (incident) => {
      selectedIncident.value = incident;
      const [dispatchesRes] = await Promise.all([
        $supabase.from("dispatches").select("*, unit:units(*, unit_type:unit_types(*))").eq("incident_id", incident.id)
      ]);
      assignedUnits.value = dispatchesRes.data || [];
    };
    const createIncident = async () => {
      creating.value = true;
      const result = await api.incidents.create({
        ...newIncident.value,
        status: "pending"
      });
      if (result.success) {
        showNewIncidentModal.value = false;
        newIncident.value = {
          incident_type: "",
          priority: 3,
          location_address: "",
          location_details: "",
          caller_name: "",
          caller_phone: "",
          chief_complaint: ""
        };
        await fetchIncidents();
      }
      creating.value = false;
    };
    const dispatchUnit = async () => {
      if (!selectedIncident.value || !dispatchData.value.unit_id) return;
      dispatching.value = true;
      const result = await api.dispatches.create(selectedIncident.value.id, dispatchData.value.unit_id);
      if (result.success) {
        showDispatchModal.value = false;
        dispatchData.value.unit_id = "";
        await selectIncident(selectedIncident.value);
        await fetchIncidents();
        await fetchAvailableUnits();
      }
      dispatching.value = false;
    };
    const closeIncident = async () => {
      if (!selectedIncident.value) return;
      if (confirm("Are you sure you want to close this incident?")) {
        await api.incidents.update(selectedIncident.value.id, {
          status: "closed",
          clear_time: (/* @__PURE__ */ new Date()).toISOString()
        });
        selectedIncident.value = null;
        await fetchIncidents();
      }
    };
    const fetchAvailableUnits = async () => {
      const result = await api.units.list({ is_active: true });
      if (result.success) {
        availableUnits.value = result.data.filter(
          (u) => ["available", "dispatched"].includes(u.status)
        );
      }
    };
    const formatTime = (timestamp) => {
      if (!timestamp) return "N/A";
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      const _component_CrewLink = __nuxt_component_1;
      const _component_MapNavigation = __nuxt_component_2;
      _push(ssrRenderComponent(_component_NuxtLayout, mergeProps({ name: "default" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="cad-page" data-v-1aefa167${_scopeId}><div class="page-header" data-v-1aefa167${_scopeId}><div class="header-left" data-v-1aefa167${_scopeId}><h1 data-v-1aefa167${_scopeId}>Computer-Aided Dispatch</h1><div class="tab-navigation" data-v-1aefa167${_scopeId}><button class="${ssrRenderClass([{ active: unref(activeTab) === "incidents" }, "tab-button"])}" data-v-1aefa167${_scopeId}> Incidents </button><button class="${ssrRenderClass([{ active: unref(activeTab) === "crewlink" }, "tab-button"])}" data-v-1aefa167${_scopeId}> CrewLink </button></div></div>`);
            if (unref(activeTab) === "incidents") {
              _push2(`<button class="btn btn-primary" data-v-1aefa167${_scopeId}> + New Incident </button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (unref(activeTab) === "crewlink") {
              _push2(`<div class="crewlink-container" data-v-1aefa167${_scopeId}>`);
              _push2(ssrRenderComponent(_component_CrewLink, { "organization-id": unref(organizationId) }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<div class="cad-layout" data-v-1aefa167${_scopeId}><div class="incidents-panel" data-v-1aefa167${_scopeId}><div class="panel-header" data-v-1aefa167${_scopeId}><h3 data-v-1aefa167${_scopeId}>Active Incidents</h3><select class="form-select filter-select" data-v-1aefa167${_scopeId}><option value="active" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(filter)) ? ssrLooseContain(unref(filter), "active") : ssrLooseEqual(unref(filter), "active")) ? " selected" : ""}${_scopeId}>Active</option><option value="pending" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(filter)) ? ssrLooseContain(unref(filter), "pending") : ssrLooseEqual(unref(filter), "pending")) ? " selected" : ""}${_scopeId}>Pending</option><option value="dispatched" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(filter)) ? ssrLooseContain(unref(filter), "dispatched") : ssrLooseEqual(unref(filter), "dispatched")) ? " selected" : ""}${_scopeId}>Dispatched</option><option value="all" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(filter)) ? ssrLooseContain(unref(filter), "all") : ssrLooseEqual(unref(filter), "all")) ? " selected" : ""}${_scopeId}>All</option></select></div>`);
              if (unref(loading)) {
                _push2(`<div class="loading" data-v-1aefa167${_scopeId}>Loading...</div>`);
              } else if (unref(filteredIncidents).length === 0) {
                _push2(`<div class="empty-state" data-v-1aefa167${_scopeId}> No incidents found </div>`);
              } else {
                _push2(`<div class="incidents-list" data-v-1aefa167${_scopeId}><!--[-->`);
                ssrRenderList(unref(filteredIncidents), (incident) => {
                  var _a;
                  _push2(`<div class="${ssrRenderClass([{ selected: ((_a = unref(selectedIncident)) == null ? void 0 : _a.id) === incident.id }, "incident-card"])}" data-v-1aefa167${_scopeId}><div class="incident-header-row" data-v-1aefa167${_scopeId}><span class="incident-number" data-v-1aefa167${_scopeId}>${ssrInterpolate(incident.incident_number)}</span><span class="${ssrRenderClass([`badge-priority-${incident.priority}`, "badge"])}" data-v-1aefa167${_scopeId}> P${ssrInterpolate(incident.priority)}</span></div><div class="incident-type" data-v-1aefa167${_scopeId}>${ssrInterpolate(incident.incident_type)}</div><div class="incident-location" data-v-1aefa167${_scopeId}>\u{1F4CD} ${ssrInterpolate(incident.location_address)}</div><div class="incident-time" data-v-1aefa167${_scopeId}>\u{1F550} ${ssrInterpolate(formatTime(incident.created_at))}</div><div class="incident-status" data-v-1aefa167${_scopeId}><span class="${ssrRenderClass([`badge-${incident.status}`, "badge"])}" data-v-1aefa167${_scopeId}>${ssrInterpolate(incident.status)}</span></div></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`</div>`);
              if (unref(selectedIncident)) {
                _push2(`<div class="details-panel" data-v-1aefa167${_scopeId}><div class="panel-header" data-v-1aefa167${_scopeId}><h3 data-v-1aefa167${_scopeId}>Incident Details</h3><div class="header-actions" data-v-1aefa167${_scopeId}><button class="btn btn-sm btn-primary" data-v-1aefa167${_scopeId}> Assign Unit </button><button class="btn btn-sm btn-success" data-v-1aefa167${_scopeId}> Close </button></div></div>`);
                if (unref(shouldShowMap)) {
                  _push2(`<div class="map-section" data-v-1aefa167${_scopeId}>`);
                  _push2(ssrRenderComponent(_component_MapNavigation, {
                    destination: {
                      address: unref(selectedIncident).location_address,
                      lat: unref(selectedIncident).location_lat,
                      lng: unref(selectedIncident).location_lng
                    },
                    origin: unref(unitLocation)
                  }, null, _parent2, _scopeId));
                  _push2(`</div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="details-content" data-v-1aefa167${_scopeId}><div class="detail-section" data-v-1aefa167${_scopeId}><h4 data-v-1aefa167${_scopeId}>Incident Information</h4><div class="detail-grid" data-v-1aefa167${_scopeId}><div class="detail-item" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Incident Number</label><div data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).incident_number)}</div></div><div class="detail-item" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Type</label><div data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).incident_type)}</div></div><div class="detail-item" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Priority</label><div data-v-1aefa167${_scopeId}><span class="${ssrRenderClass([`badge-priority-${unref(selectedIncident).priority}`, "badge"])}" data-v-1aefa167${_scopeId}> Priority ${ssrInterpolate(unref(selectedIncident).priority)}</span></div></div><div class="detail-item" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Status</label><div data-v-1aefa167${_scopeId}><span class="${ssrRenderClass([`badge-${unref(selectedIncident).status}`, "badge"])}" data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).status)}</span></div></div></div></div><div class="detail-section" data-v-1aefa167${_scopeId}><h4 data-v-1aefa167${_scopeId}>Location</h4><div class="detail-grid" data-v-1aefa167${_scopeId}><div class="detail-item full-width" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Address</label><div data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).location_address)}</div></div>`);
                if (unref(selectedIncident).location_details) {
                  _push2(`<div class="detail-item full-width" data-v-1aefa167${_scopeId}><label data-v-1aefa167${_scopeId}>Additional Details</label><div data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).location_details)}</div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
                if (unref(selectedIncident).chief_complaint) {
                  _push2(`<div class="detail-section" data-v-1aefa167${_scopeId}><h4 data-v-1aefa167${_scopeId}>Chief Complaint</h4><div class="narrative-text" data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(selectedIncident).chief_complaint)}</div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="detail-section" data-v-1aefa167${_scopeId}><h4 data-v-1aefa167${_scopeId}>Assigned Units (${ssrInterpolate(unref(assignedUnits).length)})</h4>`);
                if (unref(assignedUnits).length === 0) {
                  _push2(`<div class="empty-state-small" data-v-1aefa167${_scopeId}> No units assigned </div>`);
                } else {
                  _push2(`<div class="units-list" data-v-1aefa167${_scopeId}><!--[-->`);
                  ssrRenderList(unref(assignedUnits), (dispatch) => {
                    var _a;
                    _push2(`<div class="unit-assignment" data-v-1aefa167${_scopeId}><div class="unit-info" data-v-1aefa167${_scopeId}><span class="unit-number" data-v-1aefa167${_scopeId}>${ssrInterpolate((_a = dispatch.unit) == null ? void 0 : _a.unit_number)}</span><span class="badge badge-info" data-v-1aefa167${_scopeId}>${ssrInterpolate(dispatch.status)}</span></div><div class="unit-times" data-v-1aefa167${_scopeId}>`);
                    if (dispatch.acknowledged_at) {
                      _push2(`<span data-v-1aefa167${_scopeId}>Ack: ${ssrInterpolate(formatTime(dispatch.acknowledged_at))}</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (dispatch.enroute_at) {
                      _push2(`<span data-v-1aefa167${_scopeId}>Enroute: ${ssrInterpolate(formatTime(dispatch.enroute_at))}</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (dispatch.on_scene_at) {
                      _push2(`<span data-v-1aefa167${_scopeId}>On Scene: ${ssrInterpolate(formatTime(dispatch.on_scene_at))}</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  });
                  _push2(`<!--]--></div>`);
                }
                _push2(`</div></div></div>`);
              } else {
                _push2(`<div class="details-panel empty" data-v-1aefa167${_scopeId}><div class="empty-state" data-v-1aefa167${_scopeId}> Select an incident to view details </div></div>`);
              }
              _push2(`</div>`);
            }
            ssrRenderTeleport(_push2, (_push3) => {
              if (unref(showNewIncidentModal)) {
                _push3(`<div class="modal-overlay" data-v-1aefa167${_scopeId}><div class="modal-content" data-v-1aefa167${_scopeId}><h2 data-v-1aefa167${_scopeId}>Create New Incident</h2><form data-v-1aefa167${_scopeId}><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Incident Type *</label><select class="form-select" required data-v-1aefa167${_scopeId}><option value="" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "") : ssrLooseEqual(unref(newIncident).incident_type, "")) ? " selected" : ""}${_scopeId}>Select type</option><option value="Medical Emergency" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Medical Emergency") : ssrLooseEqual(unref(newIncident).incident_type, "Medical Emergency")) ? " selected" : ""}${_scopeId}>Medical Emergency</option><option value="Fire" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Fire") : ssrLooseEqual(unref(newIncident).incident_type, "Fire")) ? " selected" : ""}${_scopeId}>Fire</option><option value="Vehicle Accident" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Vehicle Accident") : ssrLooseEqual(unref(newIncident).incident_type, "Vehicle Accident")) ? " selected" : ""}${_scopeId}>Vehicle Accident</option><option value="Cardiac Arrest" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Cardiac Arrest") : ssrLooseEqual(unref(newIncident).incident_type, "Cardiac Arrest")) ? " selected" : ""}${_scopeId}>Cardiac Arrest</option><option value="Trauma" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Trauma") : ssrLooseEqual(unref(newIncident).incident_type, "Trauma")) ? " selected" : ""}${_scopeId}>Trauma</option><option value="Respiratory Distress" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Respiratory Distress") : ssrLooseEqual(unref(newIncident).incident_type, "Respiratory Distress")) ? " selected" : ""}${_scopeId}>Respiratory Distress</option><option value="Other" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).incident_type) ? ssrLooseContain(unref(newIncident).incident_type, "Other") : ssrLooseEqual(unref(newIncident).incident_type, "Other")) ? " selected" : ""}${_scopeId}>Other</option></select></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Priority *</label><select class="form-select" required data-v-1aefa167${_scopeId}><option${ssrRenderAttr("value", 1)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).priority) ? ssrLooseContain(unref(newIncident).priority, 1) : ssrLooseEqual(unref(newIncident).priority, 1)) ? " selected" : ""}${_scopeId}>Priority 1 (Critical)</option><option${ssrRenderAttr("value", 2)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).priority) ? ssrLooseContain(unref(newIncident).priority, 2) : ssrLooseEqual(unref(newIncident).priority, 2)) ? " selected" : ""}${_scopeId}>Priority 2 (Urgent)</option><option${ssrRenderAttr("value", 3)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).priority) ? ssrLooseContain(unref(newIncident).priority, 3) : ssrLooseEqual(unref(newIncident).priority, 3)) ? " selected" : ""}${_scopeId}>Priority 3 (Routine)</option><option${ssrRenderAttr("value", 4)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).priority) ? ssrLooseContain(unref(newIncident).priority, 4) : ssrLooseEqual(unref(newIncident).priority, 4)) ? " selected" : ""}${_scopeId}>Priority 4 (Non-Emergency)</option><option${ssrRenderAttr("value", 5)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(newIncident).priority) ? ssrLooseContain(unref(newIncident).priority, 5) : ssrLooseEqual(unref(newIncident).priority, 5)) ? " selected" : ""}${_scopeId}>Priority 5 (Low)</option></select></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Location Address *</label><input${ssrRenderAttr("value", unref(newIncident).location_address)} type="text" class="form-input" required data-v-1aefa167${_scopeId}></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Location Details</label><input${ssrRenderAttr("value", unref(newIncident).location_details)} type="text" class="form-input" placeholder="Apt, floor, cross streets, etc." data-v-1aefa167${_scopeId}></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Caller Name</label><input${ssrRenderAttr("value", unref(newIncident).caller_name)} type="text" class="form-input" data-v-1aefa167${_scopeId}></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Caller Phone</label><input${ssrRenderAttr("value", unref(newIncident).caller_phone)} type="tel" class="form-input" data-v-1aefa167${_scopeId}></div><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Chief Complaint</label><textarea class="form-textarea" data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(newIncident).chief_complaint)}</textarea></div><div class="modal-actions" data-v-1aefa167${_scopeId}><button type="button" class="btn btn-secondary" data-v-1aefa167${_scopeId}> Cancel </button><button type="submit" class="btn btn-primary"${ssrIncludeBooleanAttr(unref(creating)) ? " disabled" : ""} data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(creating) ? "Creating..." : "Create Incident")}</button></div></form></div></div>`);
              } else {
                _push3(`<!---->`);
              }
              if (unref(showDispatchModal)) {
                _push3(`<div class="modal-overlay" data-v-1aefa167${_scopeId}><div class="modal-content" data-v-1aefa167${_scopeId}><h2 data-v-1aefa167${_scopeId}>Assign Unit to Incident</h2><form data-v-1aefa167${_scopeId}><div class="form-group" data-v-1aefa167${_scopeId}><label class="form-label" data-v-1aefa167${_scopeId}>Available Units *</label><select class="form-select" required data-v-1aefa167${_scopeId}><option value="" data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(dispatchData).unit_id) ? ssrLooseContain(unref(dispatchData).unit_id, "") : ssrLooseEqual(unref(dispatchData).unit_id, "")) ? " selected" : ""}${_scopeId}>Select unit</option><!--[-->`);
                ssrRenderList(unref(availableUnits), (unit) => {
                  var _a;
                  _push3(`<option${ssrRenderAttr("value", unit.id)} data-v-1aefa167${ssrIncludeBooleanAttr(Array.isArray(unref(dispatchData).unit_id) ? ssrLooseContain(unref(dispatchData).unit_id, unit.id) : ssrLooseEqual(unref(dispatchData).unit_id, unit.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(unit.unit_number)} - ${ssrInterpolate((_a = unit.unit_type) == null ? void 0 : _a.name)} (${ssrInterpolate(unit.status)}) </option>`);
                });
                _push3(`<!--]--></select></div><div class="modal-actions" data-v-1aefa167${_scopeId}><button type="button" class="btn btn-secondary" data-v-1aefa167${_scopeId}> Cancel </button><button type="submit" class="btn btn-primary"${ssrIncludeBooleanAttr(unref(dispatching)) ? " disabled" : ""} data-v-1aefa167${_scopeId}>${ssrInterpolate(unref(dispatching) ? "Dispatching..." : "Dispatch Unit")}</button></div></form></div></div>`);
              } else {
                _push3(`<!---->`);
              }
            }, "body", false, _parent2);
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "cad-page" }, [
                createVNode("div", { class: "page-header" }, [
                  createVNode("div", { class: "header-left" }, [
                    createVNode("h1", null, "Computer-Aided Dispatch"),
                    createVNode("div", { class: "tab-navigation" }, [
                      createVNode("button", {
                        onClick: ($event) => activeTab.value = "incidents",
                        class: ["tab-button", { active: unref(activeTab) === "incidents" }]
                      }, " Incidents ", 10, ["onClick"]),
                      createVNode("button", {
                        onClick: ($event) => activeTab.value = "crewlink",
                        class: ["tab-button", { active: unref(activeTab) === "crewlink" }]
                      }, " CrewLink ", 10, ["onClick"])
                    ])
                  ]),
                  unref(activeTab) === "incidents" ? (openBlock(), createBlock("button", {
                    key: 0,
                    onClick: ($event) => showNewIncidentModal.value = true,
                    class: "btn btn-primary"
                  }, " + New Incident ", 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                unref(activeTab) === "crewlink" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "crewlink-container"
                }, [
                  createVNode(_component_CrewLink, { "organization-id": unref(organizationId) }, null, 8, ["organization-id"])
                ])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "cad-layout"
                }, [
                  createVNode("div", { class: "incidents-panel" }, [
                    createVNode("div", { class: "panel-header" }, [
                      createVNode("h3", null, "Active Incidents"),
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => isRef(filter) ? filter.value = $event : null,
                        class: "form-select filter-select"
                      }, [
                        createVNode("option", { value: "active" }, "Active"),
                        createVNode("option", { value: "pending" }, "Pending"),
                        createVNode("option", { value: "dispatched" }, "Dispatched"),
                        createVNode("option", { value: "all" }, "All")
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, unref(filter)]
                      ])
                    ]),
                    unref(loading) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "loading"
                    }, "Loading...")) : unref(filteredIncidents).length === 0 ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "empty-state"
                    }, " No incidents found ")) : (openBlock(), createBlock("div", {
                      key: 2,
                      class: "incidents-list"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(filteredIncidents), (incident) => {
                        var _a;
                        return openBlock(), createBlock("div", {
                          key: incident.id,
                          class: ["incident-card", { selected: ((_a = unref(selectedIncident)) == null ? void 0 : _a.id) === incident.id }],
                          onClick: ($event) => selectIncident(incident)
                        }, [
                          createVNode("div", { class: "incident-header-row" }, [
                            createVNode("span", { class: "incident-number" }, toDisplayString(incident.incident_number), 1),
                            createVNode("span", {
                              class: ["badge", `badge-priority-${incident.priority}`]
                            }, " P" + toDisplayString(incident.priority), 3)
                          ]),
                          createVNode("div", { class: "incident-type" }, toDisplayString(incident.incident_type), 1),
                          createVNode("div", { class: "incident-location" }, "\u{1F4CD} " + toDisplayString(incident.location_address), 1),
                          createVNode("div", { class: "incident-time" }, "\u{1F550} " + toDisplayString(formatTime(incident.created_at)), 1),
                          createVNode("div", { class: "incident-status" }, [
                            createVNode("span", {
                              class: ["badge", `badge-${incident.status}`]
                            }, toDisplayString(incident.status), 3)
                          ])
                        ], 10, ["onClick"]);
                      }), 128))
                    ]))
                  ]),
                  unref(selectedIncident) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "details-panel"
                  }, [
                    createVNode("div", { class: "panel-header" }, [
                      createVNode("h3", null, "Incident Details"),
                      createVNode("div", { class: "header-actions" }, [
                        createVNode("button", {
                          onClick: ($event) => showDispatchModal.value = true,
                          class: "btn btn-sm btn-primary"
                        }, " Assign Unit ", 8, ["onClick"]),
                        createVNode("button", {
                          onClick: closeIncident,
                          class: "btn btn-sm btn-success"
                        }, " Close ")
                      ])
                    ]),
                    unref(shouldShowMap) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "map-section"
                    }, [
                      createVNode(_component_MapNavigation, {
                        destination: {
                          address: unref(selectedIncident).location_address,
                          lat: unref(selectedIncident).location_lat,
                          lng: unref(selectedIncident).location_lng
                        },
                        origin: unref(unitLocation)
                      }, null, 8, ["destination", "origin"])
                    ])) : createCommentVNode("", true),
                    createVNode("div", { class: "details-content" }, [
                      createVNode("div", { class: "detail-section" }, [
                        createVNode("h4", null, "Incident Information"),
                        createVNode("div", { class: "detail-grid" }, [
                          createVNode("div", { class: "detail-item" }, [
                            createVNode("label", null, "Incident Number"),
                            createVNode("div", null, toDisplayString(unref(selectedIncident).incident_number), 1)
                          ]),
                          createVNode("div", { class: "detail-item" }, [
                            createVNode("label", null, "Type"),
                            createVNode("div", null, toDisplayString(unref(selectedIncident).incident_type), 1)
                          ]),
                          createVNode("div", { class: "detail-item" }, [
                            createVNode("label", null, "Priority"),
                            createVNode("div", null, [
                              createVNode("span", {
                                class: ["badge", `badge-priority-${unref(selectedIncident).priority}`]
                              }, " Priority " + toDisplayString(unref(selectedIncident).priority), 3)
                            ])
                          ]),
                          createVNode("div", { class: "detail-item" }, [
                            createVNode("label", null, "Status"),
                            createVNode("div", null, [
                              createVNode("span", {
                                class: ["badge", `badge-${unref(selectedIncident).status}`]
                              }, toDisplayString(unref(selectedIncident).status), 3)
                            ])
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "detail-section" }, [
                        createVNode("h4", null, "Location"),
                        createVNode("div", { class: "detail-grid" }, [
                          createVNode("div", { class: "detail-item full-width" }, [
                            createVNode("label", null, "Address"),
                            createVNode("div", null, toDisplayString(unref(selectedIncident).location_address), 1)
                          ]),
                          unref(selectedIncident).location_details ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "detail-item full-width"
                          }, [
                            createVNode("label", null, "Additional Details"),
                            createVNode("div", null, toDisplayString(unref(selectedIncident).location_details), 1)
                          ])) : createCommentVNode("", true)
                        ])
                      ]),
                      unref(selectedIncident).chief_complaint ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "detail-section"
                      }, [
                        createVNode("h4", null, "Chief Complaint"),
                        createVNode("div", { class: "narrative-text" }, toDisplayString(unref(selectedIncident).chief_complaint), 1)
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "detail-section" }, [
                        createVNode("h4", null, "Assigned Units (" + toDisplayString(unref(assignedUnits).length) + ")", 1),
                        unref(assignedUnits).length === 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "empty-state-small"
                        }, " No units assigned ")) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "units-list"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(assignedUnits), (dispatch) => {
                            var _a;
                            return openBlock(), createBlock("div", {
                              key: dispatch.id,
                              class: "unit-assignment"
                            }, [
                              createVNode("div", { class: "unit-info" }, [
                                createVNode("span", { class: "unit-number" }, toDisplayString((_a = dispatch.unit) == null ? void 0 : _a.unit_number), 1),
                                createVNode("span", { class: "badge badge-info" }, toDisplayString(dispatch.status), 1)
                              ]),
                              createVNode("div", { class: "unit-times" }, [
                                dispatch.acknowledged_at ? (openBlock(), createBlock("span", { key: 0 }, "Ack: " + toDisplayString(formatTime(dispatch.acknowledged_at)), 1)) : createCommentVNode("", true),
                                dispatch.enroute_at ? (openBlock(), createBlock("span", { key: 1 }, "Enroute: " + toDisplayString(formatTime(dispatch.enroute_at)), 1)) : createCommentVNode("", true),
                                dispatch.on_scene_at ? (openBlock(), createBlock("span", { key: 2 }, "On Scene: " + toDisplayString(formatTime(dispatch.on_scene_at)), 1)) : createCommentVNode("", true)
                              ])
                            ]);
                          }), 128))
                        ]))
                      ])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "details-panel empty"
                  }, [
                    createVNode("div", { class: "empty-state" }, " Select an incident to view details ")
                  ]))
                ])),
                (openBlock(), createBlock(Teleport, { to: "body" }, [
                  unref(showNewIncidentModal) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "modal-overlay",
                    onClick: ($event) => showNewIncidentModal.value = false
                  }, [
                    createVNode("div", {
                      class: "modal-content",
                      onClick: withModifiers(() => {
                      }, ["stop"])
                    }, [
                      createVNode("h2", null, "Create New Incident"),
                      createVNode("form", {
                        onSubmit: withModifiers(createIncident, ["prevent"])
                      }, [
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Incident Type *"),
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).incident_type = $event,
                            class: "form-select",
                            required: ""
                          }, [
                            createVNode("option", { value: "" }, "Select type"),
                            createVNode("option", { value: "Medical Emergency" }, "Medical Emergency"),
                            createVNode("option", { value: "Fire" }, "Fire"),
                            createVNode("option", { value: "Vehicle Accident" }, "Vehicle Accident"),
                            createVNode("option", { value: "Cardiac Arrest" }, "Cardiac Arrest"),
                            createVNode("option", { value: "Trauma" }, "Trauma"),
                            createVNode("option", { value: "Respiratory Distress" }, "Respiratory Distress"),
                            createVNode("option", { value: "Other" }, "Other")
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(newIncident).incident_type]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Priority *"),
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).priority = $event,
                            class: "form-select",
                            required: ""
                          }, [
                            createVNode("option", { value: 1 }, "Priority 1 (Critical)"),
                            createVNode("option", { value: 2 }, "Priority 2 (Urgent)"),
                            createVNode("option", { value: 3 }, "Priority 3 (Routine)"),
                            createVNode("option", { value: 4 }, "Priority 4 (Non-Emergency)"),
                            createVNode("option", { value: 5 }, "Priority 5 (Low)")
                          ], 8, ["onUpdate:modelValue"]), [
                            [
                              vModelSelect,
                              unref(newIncident).priority,
                              void 0,
                              { number: true }
                            ]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Location Address *"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).location_address = $event,
                            type: "text",
                            class: "form-input",
                            required: ""
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(newIncident).location_address]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Location Details"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).location_details = $event,
                            type: "text",
                            class: "form-input",
                            placeholder: "Apt, floor, cross streets, etc."
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(newIncident).location_details]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Caller Name"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).caller_name = $event,
                            type: "text",
                            class: "form-input"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(newIncident).caller_name]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Caller Phone"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).caller_phone = $event,
                            type: "tel",
                            class: "form-input"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(newIncident).caller_phone]
                          ])
                        ]),
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Chief Complaint"),
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => unref(newIncident).chief_complaint = $event,
                            class: "form-textarea"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(newIncident).chief_complaint]
                          ])
                        ]),
                        createVNode("div", { class: "modal-actions" }, [
                          createVNode("button", {
                            type: "button",
                            onClick: ($event) => showNewIncidentModal.value = false,
                            class: "btn btn-secondary"
                          }, " Cancel ", 8, ["onClick"]),
                          createVNode("button", {
                            type: "submit",
                            class: "btn btn-primary",
                            disabled: unref(creating)
                          }, toDisplayString(unref(creating) ? "Creating..." : "Create Incident"), 9, ["disabled"])
                        ])
                      ], 32)
                    ], 8, ["onClick"])
                  ], 8, ["onClick"])) : createCommentVNode("", true),
                  unref(showDispatchModal) ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "modal-overlay",
                    onClick: ($event) => showDispatchModal.value = false
                  }, [
                    createVNode("div", {
                      class: "modal-content",
                      onClick: withModifiers(() => {
                      }, ["stop"])
                    }, [
                      createVNode("h2", null, "Assign Unit to Incident"),
                      createVNode("form", {
                        onSubmit: withModifiers(dispatchUnit, ["prevent"])
                      }, [
                        createVNode("div", { class: "form-group" }, [
                          createVNode("label", { class: "form-label" }, "Available Units *"),
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(dispatchData).unit_id = $event,
                            class: "form-select",
                            required: ""
                          }, [
                            createVNode("option", { value: "" }, "Select unit"),
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(availableUnits), (unit) => {
                              var _a;
                              return openBlock(), createBlock("option", {
                                key: unit.id,
                                value: unit.id
                              }, toDisplayString(unit.unit_number) + " - " + toDisplayString((_a = unit.unit_type) == null ? void 0 : _a.name) + " (" + toDisplayString(unit.status) + ") ", 9, ["value"]);
                            }), 128))
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(dispatchData).unit_id]
                          ])
                        ]),
                        createVNode("div", { class: "modal-actions" }, [
                          createVNode("button", {
                            type: "button",
                            onClick: ($event) => showDispatchModal.value = false,
                            class: "btn btn-secondary"
                          }, " Cancel ", 8, ["onClick"]),
                          createVNode("button", {
                            type: "submit",
                            class: "btn btn-primary",
                            disabled: unref(dispatching)
                          }, toDisplayString(unref(dispatching) ? "Dispatching..." : "Dispatch Unit"), 9, ["disabled"])
                        ])
                      ], 32)
                    ], 8, ["onClick"])
                  ], 8, ["onClick"])) : createCommentVNode("", true)
                ]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/cad/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1aefa167"]]);

export { index as default };
//# sourceMappingURL=index-CPSxt-wb.mjs.map
