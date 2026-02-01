<template>
  <div class="mdt-telemetry">
    <div class="telemetry-header">
      <h2>Vehicle Status</h2>
      <div class="status-badges">
        <span class="badge badge-success" v-if="connected">Connected</span>
        <span class="badge badge-error" v-else>Disconnected</span>
        <span class="badge badge-lights" v-if="lightsActive">Lights ON</span>
        <span class="badge badge-sirens" v-if="sirensActive">Sirens ON</span>
      </div>
    </div>

    <div class="telemetry-grid">
      <div class="telemetry-card">
        <div class="card-header">
          <h3>Speed & Distance</h3>
        </div>
        <div class="telemetry-data">
          <div class="data-item large">
            <span class="value">{{ latestTelemetry?.speed_mph?.toFixed(0) || '0' }}</span>
            <span class="unit">MPH</span>
          </div>
          <div class="data-row">
            <div class="data-item">
              <span class="label">Trip</span>
              <span class="value">{{ currentTrip?.toFixed(1) || '0.0' }} mi</span>
            </div>
            <div class="data-item">
              <span class="label">Odometer</span>
              <span class="value">{{ (latestTelemetry?.odometer || 0).toFixed(0) }} mi</span>
            </div>
          </div>
        </div>
      </div>

      <div class="telemetry-card">
        <div class="card-header">
          <h3>Engine</h3>
        </div>
        <div class="telemetry-data">
          <div class="data-row">
            <div class="data-item">
              <span class="label">RPM</span>
              <span class="value">{{ latestTelemetry?.rpm?.toFixed(0) || '0' }}</span>
            </div>
            <div class="data-item">
              <span class="label">Temp</span>
              <span class="value">{{ latestTelemetry?.engine_temp?.toFixed(0) || '0' }}°F</span>
            </div>
          </div>
          <div class="data-row">
            <div class="data-item">
              <span class="label">Load</span>
              <span class="value">{{ latestTelemetry?.engine_load?.toFixed(0) || '0' }}%</span>
            </div>
            <div class="data-item">
              <span class="label">Fuel</span>
              <span class="value">{{ latestTelemetry?.fuel_level?.toFixed(0) || '0' }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="telemetry-card">
        <div class="card-header">
          <h3>Systems</h3>
        </div>
        <div class="telemetry-data">
          <div class="data-row">
            <div class="data-item">
              <span class="label">Battery</span>
              <span class="value">{{ latestTelemetry?.battery_voltage?.toFixed(1) || '0' }}V</span>
            </div>
            <div class="data-item">
              <span class="label">Oil PSI</span>
              <span class="value">{{ latestTelemetry?.oil_pressure?.toFixed(0) || '0' }}</span>
            </div>
          </div>
          <div class="warning-row" v-if="latestTelemetry?.check_engine_light">
            <span class="warning-icon">⚠</span>
            <span>Check Engine Light</span>
          </div>
        </div>
      </div>

      <div class="telemetry-card camera-card">
        <div class="card-header">
          <h3>Camera Events</h3>
          <span class="badge badge-alert" v-if="unacknowledgedCameraEvents > 0">
            {{ unacknowledgedCameraEvents }}
          </span>
        </div>
        <div class="camera-events-list">
          <div
            v-for="event in recentCameraEvents"
            :key="event.id"
            class="camera-event"
            :class="`severity-${event.severity}`"
          >
            <div class="event-info">
              <span class="event-type">{{ formatEventType(event.event_type) }}</span>
              <span class="event-time">{{ formatTime(event.timestamp) }}</span>
            </div>
            <button
              v-if="!event.acknowledged"
              @click="acknowledgeCameraEvent(event.id)"
              class="btn-ack"
            >
              Acknowledge
            </button>
          </div>
          <div v-if="recentCameraEvents.length === 0" class="no-events">
            No recent camera events
          </div>
        </div>
      </div>

      <div class="telemetry-card controls-card">
        <div class="card-header">
          <h3>Emergency Equipment</h3>
        </div>
        <div class="controls-grid">
          <button
            @click="toggleLights"
            class="control-button lights-button"
            :class="{ active: lightsActive }"
          >
            <span class="icon">💡</span>
            <span class="label">Emergency Lights</span>
            <span v-if="lightsActive" class="duration">
              {{ formatDuration(lightsDuration) }}
            </span>
          </button>
          <button
            @click="toggleSirens"
            class="control-button sirens-button"
            :class="{ active: sirensActive }"
          >
            <span class="icon">🔊</span>
            <span class="label">Sirens</span>
            <span v-if="sirensActive" class="duration">
              {{ formatDuration(sirensDuration) }}
            </span>
          </button>
        </div>
      </div>

      <div class="telemetry-card messages-card">
        <div class="card-header">
          <h3>Crew Messages</h3>
          <span class="badge badge-alert" v-if="unreadMessages > 0">
            {{ unreadMessages }}
          </span>
        </div>
        <div class="messages-list">
          <div v-for="msg in recentMessages" :key="msg.id" class="message-item">
            <div class="message-header">
              <span class="sender">{{ msg.sender?.full_name || 'Unknown' }}</span>
              <span class="time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-text">{{ msg.message }}</div>
          </div>
        </div>
        <div class="message-input">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Type message..."
            class="form-input"
          />
          <button @click="sendMessage" class="btn-send">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  unitId: string
  incidentId?: string
}

const props = defineProps<Props>()

const telemetry = useVehicleTelemetry()
const gps = useGPSTracking()
const lightsSirens = useLightsSirens()
const cameraEvents = useCameraEvents()
const messages = useCrewMessages()
const auth = useAuth()

const latestTelemetry = ref<any>(null)
const connected = ref(false)
const lightsActive = ref(false)
const sirensActive = ref(false)
const lightsDuration = ref(0)
const sirensDuration = ref(0)
const currentTrip = ref(0)
const recentCameraEvents = ref<any[]>([])
const unacknowledgedCameraEvents = ref(0)
const recentMessages = ref<any[]>([])
const unreadMessages = ref(0)
const newMessage = ref('')

let telemetryInterval: NodeJS.Timeout | null = null
let durationInterval: NodeJS.Timeout | null = null

const loadTelemetry = async () => {
  const data = await telemetry.getLatestTelemetry(props.unitId)
  if (data) {
    latestTelemetry.value = data
    connected.value = true
  }
}

const loadCameraEvents = async () => {
  const events = await cameraEvents.getEvents({
    unitId: props.unitId,
    limit: 5,
    hours: 24
  })
  recentCameraEvents.value = events

  const count = await cameraEvents.getUnacknowledgedCount(props.unitId)
  unacknowledgedCameraEvents.value = count
}

const loadMessages = async () => {
  const msgs = await messages.getMessages({
    unitId: props.unitId,
    limit: 5
  })
  recentMessages.value = msgs

  const count = await messages.getUnreadCount({
    unitId: props.unitId
  })
  unreadMessages.value = count
}

const toggleLights = async () => {
  if (lightsActive.value) {
    await lightsSirens.deactivateLights(props.unitId, props.incidentId)
    lightsActive.value = false
  } else {
    await lightsSirens.activateLights(props.unitId, props.incidentId)
    lightsActive.value = true
  }
}

const toggleSirens = async () => {
  if (sirensActive.value) {
    await lightsSirens.deactivateSirens(props.unitId, props.incidentId)
    sirensActive.value = false
  } else {
    await lightsSirens.activateSirens(props.unitId, props.incidentId)
    sirensActive.value = true
  }
}

const updateDurations = () => {
  if (lightsActive.value) {
    lightsDuration.value = lightsSirens.lightsActiveDuration
  }
  if (sirensActive.value) {
    sirensDuration.value = lightsSirens.sirensActiveDuration
  }
  currentTrip.value = gps.currentTripDistance
}

const acknowledgeCameraEvent = async (eventId: string) => {
  const user = await auth.getUser()
  if (!user) return

  await cameraEvents.acknowledgeEvent(eventId, user.id)
  await loadCameraEvents()
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  await messages.sendMessage(newMessage.value, {
    unitId: props.unitId,
    incidentId: props.incidentId
  })

  newMessage.value = ''
  await loadMessages()
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatEventType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

onMounted(() => {
  loadTelemetry()
  loadCameraEvents()
  loadMessages()

  gps.startTracking(props.unitId, props.incidentId)

  telemetryInterval = setInterval(() => {
    telemetry.simulateTelemetry(props.unitId)
    loadTelemetry()
  }, 5000)

  durationInterval = setInterval(updateDurations, 1000)

  messages.subscribeToMessages(
    () => {
      loadMessages()
    },
    { unitId: props.unitId }
  )
})

onUnmounted(() => {
  if (telemetryInterval) clearInterval(telemetryInterval)
  if (durationInterval) clearInterval(durationInterval)
  gps.stopTracking()
})
</script>

<style scoped>
.mdt-telemetry {
  padding: var(--spacing-6);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-lg);
}

.telemetry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}

.telemetry-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--color-primary-500);
}

.status-badges {
  display: flex;
  gap: var(--spacing-2);
}

.badge-lights {
  background: rgba(255, 107, 0, 0.2);
  color: var(--color-primary-500);
  animation: pulse 1s infinite;
}

.badge-sirens {
  background: rgba(220, 38, 38, 0.2);
  color: var(--color-error-500);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.telemetry-card {
  background: var(--color-dark-300);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-dark-50);
}

.card-header h3 {
  font-size: 1rem;
  margin: 0;
  color: var(--color-gray-400);
}

.telemetry-data {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.data-item.large {
  text-align: center;
  padding: var(--spacing-4) 0;
}

.data-item.large .value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.data-item.large .unit {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin-left: var(--spacing-2);
}

.data-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.data-item .label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-item .value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

.warning-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: rgba(220, 38, 38, 0.1);
  border-radius: var(--border-radius-sm);
  color: var(--color-error-500);
  font-weight: 600;
}

.camera-events-list,
.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-height: 200px;
  overflow-y: auto;
}

.camera-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-gray-500);
}

.camera-event.severity-high {
  border-left-color: var(--color-primary-500);
}

.camera-event.severity-critical {
  border-left-color: var(--color-error-500);
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.event-type {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.event-time {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.btn-ack {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-dark-400);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ack:hover {
  background: var(--color-primary-600);
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.control-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-dark-400);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  border-color: var(--color-primary-500);
}

.control-button.active {
  background: rgba(255, 107, 0, 0.2);
  border-color: var(--color-primary-500);
}

.control-button.sirens-button.active {
  background: rgba(220, 38, 38, 0.2);
  border-color: var(--color-error-500);
}

.control-button .icon {
  font-size: 2rem;
}

.control-button .label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.control-button .duration {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.message-item {
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-sm);
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-1);
}

.sender {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary-500);
}

.time {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.message-text {
  font-size: 0.875rem;
  color: #ffffff;
}

.message-input {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-dark-50);
}

.message-input .form-input {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: 0.875rem;
}

.btn-send {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-dark-400);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-send:hover {
  background: var(--color-primary-600);
}

.no-events {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}
</style>
