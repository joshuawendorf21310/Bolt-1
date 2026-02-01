<template>
  <div class="sla-timer-container">
    <div class="timer-badge" :class="[slaStatus.severity, { pulsing: slaStatus.isHardBreach }]">
      <span class="timer-icon">⏱️</span>
      <span class="timer-text">{{ formatTime(slaStatus.hoursRemaining) }}</span>
      <span class="timer-label">{{ slaStatus.label }}</span>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: slaStatus.percentComplete + '%', backgroundColor: progressColor }"></div>
    </div>

    <div class="sla-info">
      <p class="sla-details">
        <span>Started:</span>
        <span>{{ formatDateTime(slaStatus.startedAt) }}</span>
      </p>
      <p class="sla-details">
        <span>Target:</span>
        <span>{{ slaStatus.targetHours }}h</span>
      </p>
      <p v-if="slaStatus.isSoftBreach" class="soft-breach-warning">
        ⚠️ Soft SLA breach in {{ Math.ceil(slaStatus.hoursUntilHardBreach) }}h
      </p>
      <p v-if="slaStatus.isHardBreach" class="hard-breach-alert">
        🚨 HARD SLA BREACH - Requires acknowledgment
      </p>
    </div>

    <div v-if="slaStatus.isHardBreach && !acknowledged" class="breach-actions">
      <button @click="acknowledgeAction" class="acknowledge-btn">Acknowledge</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  queueType: string
  itemType: string
  startedAt: string
  slaTrackingId?: string
}>()

const emit = defineEmits<{
  breachAcknowledged: [id: string]
}>()

const { calculateSLATimers, acknowledgeSLABreach } = useSLAAndPriority()

const slaStatus = ref<any>({
  severity: 'normal',
  label: 'On track',
  hoursRemaining: 0,
  percentComplete: 0,
  isSoftBreach: false,
  isHardBreach: false,
  hoursUntilHardBreach: 0,
  startedAt: props.startedAt,
  targetHours: 24
})

const acknowledged = ref(false)

const progressColor = computed(() => {
  if (slaStatus.value.isHardBreach) return '#ef4444'
  if (slaStatus.value.isSoftBreach) return '#f59e0b'
  return '#10b981'
})

const formatTime = (hours: number) => {
  if (hours < 0) return 'Expired'
  if (hours < 1) {
    const minutes = Math.ceil(hours * 60)
    return `${minutes}m`
  }
  return `${Math.ceil(hours)}h`
}

const formatDateTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const updateSLAStatus = () => {
  const timers = calculateSLATimers(props.queueType, props.itemType, props.startedAt)

  let severity = 'normal'
  let label = 'On track'

  if (timers.isHardBreach) {
    severity = 'critical'
    label = 'HARD BREACH'
  } else if (timers.isSoftBreach) {
    severity = 'warning'
    label = 'Soft breach'
  }

  const percentComplete = Math.min(
    100,
    (timers.elapsedHours / timers.hardBreachHours) * 100
  )

  slaStatus.value = {
    ...timers,
    severity,
    label,
    percentComplete,
    startedAt: props.startedAt,
    targetHours: timers.targetHours
  }
}

const acknowledgeAction = async () => {
  if (props.slaTrackingId) {
    await acknowledgeSLABreach(props.slaTrackingId, 'hard')
    acknowledged.value = true
    emit('breachAcknowledged', props.slaTrackingId)
  }
}

onMounted(() => {
  updateSLAStatus()
  setInterval(updateSLAStatus, 60000)
})

onUnmounted(() => {
  // cleanup
})
</script>

<style scoped>
.sla-timer-container {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}

.timer-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.timer-badge.normal {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.timer-badge.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.timer-badge.critical {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.timer-badge.pulsing {
  animation: pulse-alert 1s infinite;
}

@keyframes pulse-alert {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.timer-icon {
  font-size: 16px;
}

.timer-text {
  font-size: 18px;
  font-weight: 700;
}

.timer-label {
  font-size: 12px;
  opacity: 0.7;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.sla-info {
  font-size: 13px;
  color: #374151;
}

.sla-details {
  margin: 0 0 8px 0;
  display: flex;
  justify-content: space-between;
}

.sla-details span:first-child {
  font-weight: 500;
  color: #6b7280;
}

.soft-breach-warning {
  margin: 12px 0 0 0;
  padding: 8px;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  color: #92400e;
}

.hard-breach-alert {
  margin: 12px 0 0 0;
  padding: 8px;
  background: #fee2e2;
  border-left: 3px solid #ef4444;
  border-radius: 4px;
  color: #991b1b;
  font-weight: 600;
}

.breach-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.acknowledge-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.acknowledge-btn:hover {
  background: #2563eb;
}
</style>
