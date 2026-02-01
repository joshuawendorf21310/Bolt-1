<template>
  <div class="phone-system">
    <div v-if="incomingCall" class="incoming-call-overlay" :class="{ ringing: isRinging }">
      <div class="incoming-call-card">
        <div class="call-icon">📞</div>
        <div class="call-info">
          <h3>Incoming Call</h3>
          <p class="caller">{{ incomingCall.caller_identity || incomingCall.caller_number }}</p>
          <p class="call-type">Billing Related</p>
        </div>
        <div class="call-actions">
          <button @click="answerCall" class="answer-btn">Answer</button>
          <button @click="declineCall" class="decline-btn">Decline</button>
        </div>
        <div v-if="settings.ai_answer_first" class="ai-option">
          <p>AI Assistant will answer in {{ aiAnswerCountdown }}s...</p>
        </div>
      </div>
    </div>

    <div v-if="activeCall" class="active-call-panel">
      <div class="call-header">
        <span class="status-indicator" :class="activeCall.call_state"></span>
        <span class="call-duration">{{ formatDuration(callDuration) }}</span>
      </div>
      <div class="call-identity">
        <h4>{{ activeCall.caller_identity || activeCall.caller_number || activeCall.callee_number }}</h4>
        <p class="call-direction">{{ activeCall.direction === 'inbound' ? 'Inbound' : 'Outbound' }}</p>
      </div>
      <div class="call-controls">
        <button @click="toggleMute" :class="['control-btn', { active: isMuted }]">
          {{ isMuted ? '🔇' : '🎤' }}
        </button>
        <button @click="endActiveCall" class="end-call-btn">End Call</button>
      </div>
      <div v-if="activeCall.escalation_triggered" class="escalation-alert">
        <p>⚠️ Escalation Triggered</p>
        <p class="reason">{{ activeCall.escalation_reason }}</p>
        <button @click="acceptTakeover" class="takeover-btn">Take Over Call</button>
      </div>
      <div v-if="activeCall.live_transcript" class="live-transcript">
        <h5>Live Transcript</h5>
        <p>{{ activeCall.live_transcript }}</p>
      </div>
    </div>

    <div class="phone-controls">
      <div class="phone-status">
        <span class="status-dot" :class="phoneStatus"></span>
        <span>Phone {{ phoneStatus }}</span>
      </div>
      <button @click="showSettings = !showSettings" class="settings-btn">⚙️</button>
    </div>

    <div v-if="showSettings" class="phone-settings-panel">
      <div class="settings-header">
        <h3>Phone Settings</h3>
        <button @click="showSettings = false" class="close-btn">×</button>
      </div>
      <div class="settings-content">
        <div class="setting-group">
          <label>Ringer Volume</label>
          <input
            type="range"
            v-model="settings.ringer_volume"
            min="0"
            max="100"
            @change="saveSettings"
          />
          <span>{{ settings.ringer_volume }}%</span>
        </div>
        <div class="setting-group">
          <label>In-Call Volume</label>
          <input
            type="range"
            v-model="settings.in_call_volume"
            min="0"
            max="100"
            @change="saveSettings"
          />
          <span>{{ settings.in_call_volume }}%</span>
        </div>
        <div class="setting-group">
          <label>Notification Volume</label>
          <input
            type="range"
            v-model="settings.notification_volume"
            min="0"
            max="100"
            @change="saveSettings"
          />
          <span>{{ settings.notification_volume }}%</span>
        </div>
        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="settings.ringer_muted" @change="saveSettings" />
            Mute Ringer
          </label>
        </div>
        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="settings.ai_answer_first" @change="saveSettings" />
            AI Answers First
          </label>
        </div>
        <div class="setting-group">
          <label>Do Not Disturb</label>
          <button
            @click="toggleDND"
            :class="['dnd-btn', { active: settings.dnd_enabled }]"
          >
            {{ settings.dnd_enabled ? 'Disable DND' : 'Enable DND' }}
          </button>
          <div v-if="settings.dnd_enabled" class="dnd-info">
            <p>Active until {{ formatDNDUntil }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="settings.dnd_enabled" class="dnd-indicator">
      🌙 Do Not Disturb
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  getPhoneSettings,
  updatePhoneSettings,
  enableDND,
  disableDND,
  getActiveCalls,
  answerCall: answerCallAction,
  declineCall: declineCallAction,
  endCall,
  acceptEscalation
} = usePhoneSystem()

const incomingCall = ref<any>(null)
const activeCall = ref<any>(null)
const isRinging = ref(false)
const isMuted = ref(false)
const showSettings = ref(false)
const phoneStatus = ref('operational')
const callDuration = ref(0)
const aiAnswerCountdown = ref(10)

const settings = ref({
  ringer_volume: 80,
  in_call_volume: 80,
  notification_volume: 60,
  ringer_muted: false,
  notifications_muted: false,
  dnd_enabled: false,
  dnd_until: null,
  ai_answer_first: true
})

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDNDUntil = computed(() => {
  if (!settings.value.dnd_until) return 'manually disabled'
  return new Date(settings.value.dnd_until).toLocaleTimeString()
})

const loadSettings = async () => {
  const userId = 'founder'
  const data = await getPhoneSettings(userId)
  if (data) {
    settings.value = data
  }
}

const saveSettings = async () => {
  const userId = 'founder'
  await updatePhoneSettings(userId, settings.value)
}

const toggleDND = async () => {
  const userId = 'founder'
  if (settings.value.dnd_enabled) {
    await disableDND(userId)
    settings.value.dnd_enabled = false
    settings.value.dnd_until = null
  } else {
    await enableDND(userId, 30)
    const newSettings = await getPhoneSettings(userId)
    settings.value = newSettings
  }
}

const startRinging = () => {
  if (settings.value.ringer_muted || settings.value.dnd_enabled) return
  isRinging.value = true
}

const stopRinging = () => {
  isRinging.value = false
}

const answerCall = async () => {
  if (!incomingCall.value) return

  stopRinging()

  await answerCallAction(incomingCall.value.id, 'founder')

  activeCall.value = incomingCall.value
  activeCall.value.call_state = 'active'
  incomingCall.value = null

  startCallTimer()
}

const declineCall = async () => {
  if (!incomingCall.value) return

  stopRinging()

  await declineCallAction(incomingCall.value.id)

  incomingCall.value = null
}

const endActiveCall = async () => {
  if (!activeCall.value) return

  await endCall(activeCall.value.id, callDuration.value)

  stopCallTimer()
  activeCall.value = null
}

const acceptTakeover = async () => {
  if (!activeCall.value) return

  activeCall.value.handled_by = 'founder'
  activeCall.value.escalation_triggered = false
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
}

let callTimer: any = null

const startCallTimer = () => {
  callDuration.value = 0
  callTimer = setInterval(() => {
    callDuration.value++
  }, 1000)
}

const stopCallTimer = () => {
  if (callTimer) {
    clearInterval(callTimer)
    callTimer = null
  }
  callDuration.value = 0
}

const simulateIncomingCall = () => {
  if (incomingCall.value || activeCall.value) return

  const mockCall = {
    id: `call-${Date.now()}`,
    call_sid: `sid-${Date.now()}`,
    direction: 'inbound',
    caller_number: '+1-555-0123',
    caller_identity: 'Blue Cross Insurance',
    call_state: 'ringing'
  }

  incomingCall.value = mockCall
  startRinging()

  if (settings.value.ai_answer_first) {
    aiAnswerCountdown.value = 10
    const countdown = setInterval(() => {
      aiAnswerCountdown.value--
      if (aiAnswerCountdown.value <= 0) {
        clearInterval(countdown)
        if (incomingCall.value) {
          autoAnswerWithAI()
        }
      }
    }, 1000)
  }
}

const autoAnswerWithAI = async () => {
  if (!incomingCall.value) return

  stopRinging()

  await answerCallAction(incomingCall.value.id, 'ai')

  activeCall.value = incomingCall.value
  activeCall.value.call_state = 'active'
  activeCall.value.handled_by = 'ai'
  incomingCall.value = null

  startCallTimer()

  setTimeout(() => {
    if (activeCall.value && activeCall.value.handled_by === 'ai') {
      simulateEscalation()
    }
  }, 15000)
}

const simulateEscalation = () => {
  if (!activeCall.value) return

  activeCall.value.escalation_triggered = true
  activeCall.value.escalation_reason = 'Caller requested human supervisor'
  activeCall.value.call_state = 'escalating'

  startRinging()
}

onMounted(async () => {
  await loadSettings()

  setTimeout(() => {
    simulateIncomingCall()
  }, 5000)
})

onUnmounted(() => {
  stopCallTimer()
  stopRinging()
})
</script>

<style scoped>
.phone-system {
  position: fixed;
  z-index: 2000;
}

.incoming-call-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}

.incoming-call-overlay.ringing {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { background: rgba(0, 0, 0, 0.8); }
  50% { background: rgba(59, 130, 246, 0.3); }
}

.incoming-call-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  min-width: 350px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.call-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: ring 1s infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
}

.call-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.caller {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
  margin: 0 0 4px 0;
}

.call-type {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.call-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.answer-btn,
.decline-btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.answer-btn {
  background: #10b981;
  color: white;
}

.answer-btn:hover {
  background: #059669;
}

.decline-btn {
  background: #ef4444;
  color: white;
}

.decline-btn:hover {
  background: #dc2626;
}

.ai-option {
  margin-top: 16px;
  padding: 12px;
  background: #eff6ff;
  border-radius: 8px;
}

.ai-option p {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
}

.active-call-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 2001;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.call-duration {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.call-identity h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.call-direction {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.call-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.control-btn {
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
}

.control-btn.active {
  background: #fef2f2;
  border-color: #fecaca;
}

.end-call-btn {
  flex: 1;
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.escalation-alert {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.escalation-alert p {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #92400e;
}

.reason {
  font-weight: 600;
}

.takeover-btn {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.live-transcript {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.live-transcript h5 {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.live-transcript p {
  margin: 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.phone-controls {
  position: fixed;
  bottom: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.phone-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.operational {
  background: #10b981;
}

.status-dot.degraded {
  background: #f59e0b;
}

.status-dot.offline {
  background: #ef4444;
}

.settings-btn {
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.phone-settings-panel {
  position: fixed;
  bottom: 80px;
  left: 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  min-width: 350px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 2001;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.settings-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.setting-group input[type="range"] {
  width: 200px;
  margin-right: 8px;
}

.setting-group span {
  font-size: 13px;
  color: #6b7280;
}

.dnd-btn {
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.dnd-btn.active {
  background: #fef3c7;
  border-color: #fde68a;
  color: #92400e;
}

.dnd-info {
  margin-top: 8px;
  padding: 8px;
  background: #fffbeb;
  border-radius: 4px;
}

.dnd-info p {
  margin: 0;
  font-size: 12px;
  color: #78350f;
}

.dnd-indicator {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 12px 20px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  z-index: 2000;
}
</style>
