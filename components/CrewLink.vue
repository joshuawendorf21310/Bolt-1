<template>
  <div class="crewlink-ptt">
    <div class="ptt-header">
      <h1>CrewLink PTT</h1>
      <div class="header-controls">
        <button @click="showEmergencyModal = true" class="btn-emergency">
          Emergency Broadcast
        </button>
        <button @click="showGroupsModal = true" class="btn-secondary">
          Manage Groups
        </button>
      </div>
    </div>

    <div class="ptt-layout">
      <div class="ptt-main">
        <div class="talk-group-selector">
          <label>Active Talk Group</label>
          <select v-model="selectedGroupId" class="form-select" @change="switchTalkGroup">
            <option value="">Select a group...</option>
            <option v-for="group in myTalkGroups" :key="group.id" :value="group.id">
              {{ group.group_name }}
              {{ group.priority_level > 5 ? ' [PRIORITY]' : '' }}
            </option>
          </select>
        </div>

        <div v-if="currentChannel" class="channel-info">
          <div class="channel-status">
            <span class="channel-name">{{ currentChannel.channel_name }}</span>
            <span v-if="currentChannel.is_emergency" class="badge-emergency">EMERGENCY</span>
            <span class="participant-count">{{ onlineUsers.length }} online</span>
          </div>

          <div v-if="currentChannel.current_speaker_id" class="active-speaker">
            <div class="speaker-indicator pulsing"></div>
            <span>{{ currentChannel.current_speaker?.full_name || 'Unknown' }} is speaking...</span>
          </div>

          <div v-else-if="!isTransmitting" class="channel-idle">
            Channel clear - Press to talk
          </div>
        </div>

        <div class="ptt-controls">
          <button
            v-if="currentChannel"
            @mousedown="startTalking"
            @mouseup="stopTalking"
            @mouseleave="stopTalking"
            @touchstart="startTalking"
            @touchend="stopTalking"
            :class="['ptt-button', { active: isTransmitting, disabled: !currentChannel || channelBusy }]"
            :disabled="!currentChannel || channelBusy"
          >
            <div class="ptt-icon">
              <svg v-if="!isTransmitting" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.3">
                  <animate attributeName="r" from="8" to="12" dur="1s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
            <span class="ptt-text">
              {{ isTransmitting ? 'TRANSMITTING' : 'PUSH TO TALK' }}
            </span>
            <span class="ptt-hint">Press and hold</span>
          </button>

          <div v-else class="no-channel-selected">
            <p>Select a talk group to start communicating</p>
          </div>
        </div>

        <div v-if="activeBroadcasts.length > 0" class="emergency-alerts">
          <div
            v-for="broadcast in activeBroadcasts"
            :key="broadcast.id"
            class="emergency-alert pulsing"
          >
            <div class="alert-header">
              <span class="alert-type">{{ broadcast.emergency_type }}</span>
              <span class="alert-time">{{ formatTime(broadcast.started_at) }}</span>
            </div>
            <div class="alert-title">{{ broadcast.title }}</div>
            <div class="alert-message">{{ broadcast.message }}</div>
            <button
              v-if="!hasAcknowledged(broadcast.id)"
              @click="acknowledgeBroadcast(broadcast.id)"
              class="btn-acknowledge"
            >
              Acknowledge ({{ broadcast.acknowledged_count }}/{{ onlineUsers.length }})
            </button>
            <div v-else class="acknowledged">Acknowledged</div>
          </div>
        </div>

        <div class="online-users">
          <h3>Online Users ({{ onlineUsers.length }})</h3>
          <div class="users-list">
            <div
              v-for="presence in onlineUsers"
              :key="presence.id"
              class="user-presence"
              :class="{ speaking: presence.user_id === currentChannel?.current_speaker_id }"
            >
              <div class="presence-indicator"></div>
              <div class="user-info">
                <span class="user-name">{{ presence.user?.full_name }}</span>
                <span class="user-cert">{{ presence.crew?.certification_level }}</span>
              </div>
              <span v-if="presence.do_not_disturb" class="dnd-badge">DND</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ptt-sidebar">
        <div class="sidebar-section">
          <h3>Talk Groups</h3>
          <div class="groups-list">
            <div
              v-for="group in myTalkGroups"
              :key="group.id"
              class="group-card"
              :class="{ active: group.id === selectedGroupId, emergency: group.is_emergency }"
              @click="selectGroup(group.id)"
            >
              <div class="group-name">{{ group.group_name }}</div>
              <div class="group-meta">
                <span class="group-type">{{ group.group_type }}</span>
                <span v-if="group.channel?.current_speaker_id" class="speaking-indicator">
                  Speaking
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Recent Transmissions</h3>
          <div class="history-list">
            <div
              v-for="session in recentSessions"
              :key="session.id"
              class="history-item"
            >
              <div class="session-speaker">{{ session.speaker?.full_name }}</div>
              <div class="session-meta">
                <span class="session-time">{{ formatTime(session.started_at) }}</span>
                <span class="session-duration">{{ session.duration_seconds }}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEmergencyModal" class="modal-overlay" @click="showEmergencyModal = false">
      <div class="modal-content emergency-modal" @click.stop>
        <div class="modal-header">
          <h2>Emergency Broadcast</h2>
          <button @click="showEmergencyModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Emergency Type</label>
            <select v-model="emergencyBroadcast.type" class="form-select">
              <option value="mayday">Mayday</option>
              <option value="officer_down">Officer Down</option>
              <option value="mass_casualty">Mass Casualty</option>
              <option value="hazmat">Hazmat</option>
              <option value="evacuation">Evacuation</option>
              <option value="all_call">All Call</option>
            </select>
          </div>

          <div class="form-group">
            <label>Title</label>
            <input v-model="emergencyBroadcast.title" type="text" class="form-input" />
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea
              v-model="emergencyBroadcast.message"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Target Scope</label>
            <select v-model="emergencyBroadcast.scope" class="form-select">
              <option value="organization">Entire Organization</option>
              <option value="station">Specific Station</option>
              <option value="radius">Geographic Radius</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEmergencyModal = false" class="btn-secondary">Cancel</button>
          <button @click="broadcastEmergency" class="btn-emergency">
            Send Emergency Broadcast
          </button>
        </div>
      </div>
    </div>

    <div v-if="showGroupsModal" class="modal-overlay" @click="showGroupsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Manage Talk Groups</h2>
          <button @click="showGroupsModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="groups-management">
            <div
              v-for="group in allTalkGroups"
              :key="group.id"
              class="group-item"
            >
              <div class="group-info-full">
                <div class="group-header-row">
                  <span class="group-name-full">{{ group.group_name }}</span>
                  <span class="priority-badge">P{{ group.priority_level }}</span>
                </div>
                <p class="group-description">{{ group.description }}</p>
                <div class="group-stats">
                  <span>{{ group.members?.length || 0 }} members</span>
                  <span>{{ group.group_type }}</span>
                </div>
              </div>
              <div class="group-actions">
                <button
                  v-if="!isMember(group.id)"
                  @click="joinGroup(group.id)"
                  class="btn-join"
                >
                  Join
                </button>
                <button
                  v-else
                  @click="leaveGroup(group.id)"
                  class="btn-leave"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  organizationId: string
}

const props = defineProps<Props>()

const ptt = usePTT()
const talkGroups = useTalkGroups()

const myTalkGroups = ref<any[]>([])
const allTalkGroups = ref<any[]>([])
const selectedGroupId = ref('')
const currentChannel = ref<any>(null)
const onlineUsers = ref<any[]>([])
const recentSessions = ref<any[]>([])
const activeBroadcasts = ref<any[]>([])
const isTransmitting = ref(false)
const channelBusy = ref(false)
const showEmergencyModal = ref(false)
const showGroupsModal = ref(false)
const acknowledgedBroadcasts = ref<Set<string>>(new Set())

const emergencyBroadcast = ref({
  type: 'all_call',
  title: '',
  message: '',
  scope: 'organization'
})

const loadTalkGroups = async () => {
  const [myGroups, allGroups] = await Promise.all([
    talkGroups.getMyTalkGroups(),
    talkGroups.getTalkGroups(props.organizationId)
  ])
  myTalkGroups.value = myGroups
  allTalkGroups.value = allGroups
}

const switchTalkGroup = async () => {
  if (!selectedGroupId.value) {
    currentChannel.value = null
    return
  }

  const channel = await talkGroups.getChannelForGroup(selectedGroupId.value)
  currentChannel.value = channel

  if (channel) {
    loadChannelHistory(channel.id)
    ptt.updatePresence('online', {
      channelId: channel.id,
      talkGroupId: selectedGroupId.value
    })
  }
}

const selectGroup = (groupId: string) => {
  selectedGroupId.value = groupId
  switchTalkGroup()
}

const startTalking = async () => {
  if (!currentChannel.value || channelBusy.value) return

  const result = await ptt.startTransmission(currentChannel.value.id, {
    talkGroupId: selectedGroupId.value,
    priority: currentChannel.value.priority_level
  })

  if (result.success) {
    isTransmitting.value = true
  }
}

const stopTalking = async () => {
  if (!isTransmitting.value) return

  await ptt.endTransmission()
  isTransmitting.value = false
  loadChannelHistory(currentChannel.value.id)
}

const loadChannelHistory = async (channelId: string) => {
  const sessions = await ptt.getChannelHistory(channelId, 20)
  recentSessions.value = sessions
}

const loadPresence = async () => {
  const presence = await ptt.getActivePresence(props.organizationId)
  onlineUsers.value = presence
}

const loadBroadcasts = async () => {
  const broadcasts = await talkGroups.getActiveBroadcasts(props.organizationId)
  activeBroadcasts.value = broadcasts
}

const broadcastEmergency = async () => {
  await ptt.initiateEmergencyBroadcast({
    organizationId: props.organizationId,
    emergencyType: emergencyBroadcast.value.type,
    title: emergencyBroadcast.value.title,
    message: emergencyBroadcast.value.message,
    targetScope: emergencyBroadcast.value.scope
  })

  showEmergencyModal.value = false
  emergencyBroadcast.value = {
    type: 'all_call',
    title: '',
    message: '',
    scope: 'organization'
  }

  loadBroadcasts()
}

const acknowledgeBroadcast = async (broadcastId: string) => {
  await ptt.acknowledgeEmergencyBroadcast(broadcastId)
  acknowledgedBroadcasts.value.add(broadcastId)
  loadBroadcasts()
}

const hasAcknowledged = (broadcastId: string) => {
  return acknowledgedBroadcasts.value.has(broadcastId)
}

const joinGroup = async (groupId: string) => {
  await talkGroups.joinTalkGroup(groupId)
  loadTalkGroups()
}

const leaveGroup = async (groupId: string) => {
  await talkGroups.leaveTalkGroup(groupId)
  loadTalkGroups()
}

const isMember = (groupId: string) => {
  return myTalkGroups.value.some(g => g.id === groupId)
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

watch(() => currentChannel.value?.current_speaker_id, (newSpeaker) => {
  channelBusy.value = !!newSpeaker && newSpeaker !== ptt.currentSession.value?.speaker_id
})

onMounted(() => {
  loadTalkGroups()
  loadPresence()
  loadBroadcasts()

  const presenceInterval = setInterval(loadPresence, 10000)
  const broadcastInterval = setInterval(loadBroadcasts, 5000)

  ptt.updatePresence('online')

  onUnmounted(() => {
    clearInterval(presenceInterval)
    clearInterval(broadcastInterval)
    ptt.updatePresence('offline')
  })
})
</script>

<style scoped>
.crewlink-ptt {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-dark-400);
}

.ptt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 2px solid var(--color-primary-500);
  background: var(--color-dark-300);
}

.ptt-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--color-primary-500);
}

.header-controls {
  display: flex;
  gap: var(--spacing-3);
}

.btn-emergency {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-error-500);
  border: none;
  border-radius: var(--border-radius-md);
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: pulse-red 2s infinite;
}

.btn-emergency:hover {
  background: #b91c1c;
  transform: scale(1.05);
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  50% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
}

.ptt-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 0;
  overflow: hidden;
}

.ptt-main {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-6);
  gap: var(--spacing-6);
  overflow-y: auto;
}

.talk-group-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.talk-group-selector label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-400);
  text-transform: uppercase;
}

.channel-info {
  padding: var(--spacing-4);
  background: var(--color-dark-300);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
}

.channel-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.channel-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.badge-emergency {
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-error-500);
  color: #ffffff;
  border-radius: var(--border-radius-sm);
  font-size: 0.625rem;
  font-weight: 700;
  animation: pulse-red 2s infinite;
}

.participant-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.active-speaker {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: rgba(255, 107, 0, 0.1);
  border-radius: var(--border-radius-md);
  color: var(--color-primary-500);
  font-weight: 600;
}

.speaker-indicator {
  width: 12px;
  height: 12px;
  background: var(--color-primary-500);
  border-radius: 50%;
}

.speaker-indicator.pulsing {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
}

.channel-idle {
  padding: var(--spacing-3);
  text-align: center;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.ptt-controls {
  display: flex;
  justify-content: center;
  padding: var(--spacing-8) 0;
}

.ptt-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, var(--color-dark-200) 0%, var(--color-dark-300) 100%);
  border: 4px solid var(--color-primary-500);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.ptt-button:hover:not(.disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(255, 107, 0, 0.4);
}

.ptt-button:active:not(.disabled),
.ptt-button.active {
  transform: scale(0.95);
  background: var(--color-primary-500);
  border-color: #ff8c00;
  box-shadow: 0 0 60px rgba(255, 107, 0, 0.6);
}

.ptt-button.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ptt-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-4);
  color: var(--color-primary-500);
}

.ptt-button.active .ptt-icon {
  color: var(--color-dark-400);
}

.ptt-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-500);
  margin-bottom: var(--spacing-2);
}

.ptt-button.active .ptt-text {
  color: var(--color-dark-400);
}

.ptt-hint {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.ptt-button.active .ptt-hint {
  color: var(--color-dark-400);
}

.no-channel-selected {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-gray-500);
}

.emergency-alerts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.emergency-alert {
  padding: var(--spacing-4);
  background: rgba(220, 38, 38, 0.2);
  border: 2px solid var(--color-error-500);
  border-radius: var(--border-radius-lg);
  animation: pulse-red 2s infinite;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.alert-type {
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-error-500);
  color: #ffffff;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.alert-time {
  font-size: 0.75rem;
  color: var(--color-gray-400);
}

.alert-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-error-500);
  margin-bottom: var(--spacing-2);
}

.alert-message {
  color: #ffffff;
  margin-bottom: var(--spacing-3);
}

.btn-acknowledge {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-error-500);
  border: none;
  border-radius: var(--border-radius-md);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.acknowledged {
  padding: var(--spacing-2);
  color: #10b981;
  font-weight: 600;
  text-align: center;
}

.online-users {
  background: var(--color-dark-300);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-4);
}

.online-users h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: #ffffff;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.user-presence {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.user-presence.speaking {
  background: rgba(255, 107, 0, 0.2);
}

.presence-indicator {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.user-cert {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.dnd-badge {
  padding: var(--spacing-1) var(--spacing-2);
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: var(--border-radius-sm);
  font-size: 0.625rem;
  font-weight: 700;
}

.ptt-sidebar {
  background: var(--color-dark-300);
  border-left: 1px solid var(--color-dark-50);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  overflow-y: auto;
}

.sidebar-section h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: #ffffff;
  font-size: 1rem;
}

.groups-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.group-card {
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-card:hover {
  border-color: var(--color-primary-500);
  transform: translateX(4px);
}

.group-card.active {
  border-color: var(--color-primary-500);
  background: rgba(255, 107, 0, 0.1);
}

.group-card.emergency {
  border-color: var(--color-error-500);
  animation: pulse-red 2s infinite;
}

.group-name {
  font-weight: 600;
  color: #ffffff;
  margin-bottom: var(--spacing-1);
}

.group-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.speaking-indicator {
  color: var(--color-primary-500);
  font-weight: 600;
}

.history-item {
  padding: var(--spacing-2);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-sm);
}

.session-speaker {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: var(--spacing-1);
}

.session-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-dark-300);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.emergency-modal {
  border-color: var(--color-error-500);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-dark-50);
}

.modal-header h2 {
  margin: 0;
  color: #ffffff;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-gray-500);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  line-height: 1;
}

.modal-body {
  padding: var(--spacing-4);
}

.modal-footer {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-dark-50);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-400);
}

.groups-management {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
}

.group-info-full {
  flex: 1;
}

.group-header-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.group-name-full {
  font-weight: 700;
  color: #ffffff;
}

.priority-badge {
  padding: var(--spacing-1) var(--spacing-2);
  background: rgba(255, 107, 0, 0.2);
  color: var(--color-primary-500);
  border-radius: var(--border-radius-sm);
  font-size: 0.625rem;
  font-weight: 700;
}

.group-description {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  margin: 0 0 var(--spacing-2) 0;
}

.group-stats {
  display: flex;
  gap: var(--spacing-3);
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.btn-join,
.btn-leave {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-join {
  background: var(--color-primary-500);
  color: var(--color-dark-400);
}

.btn-leave {
  background: var(--color-dark-200);
  color: var(--color-gray-400);
}
</style>
