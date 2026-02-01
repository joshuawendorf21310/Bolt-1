<template>
  <div v-if="hasFailures" class="failover-banner">
    <div class="failover-alerts">
      <div v-for="component in degradedComponents" :key="component.component_name" class="failover-alert">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <strong>{{ formatComponentName(component.component_name) }} {{ component.component_status }}</strong>
          <p>{{ component.status_message }}</p>
          <p v-if="component.failover_active" class="failover-mode">
            Failover active: {{ component.failover_mode }}
          </p>
        </div>
        <button @click="dismissAlert(component.component_name)" class="dismiss-btn">×</button>
      </div>
    </div>
  </div>

  <div v-if="showStatusPanel" class="status-panel">
    <div class="panel-header">
      <h3>System Status</h3>
      <button @click="showStatusPanel = false" class="close-btn">×</button>
    </div>
    <div class="status-list">
      <div v-for="component in systemStatus" :key="component.component_name" class="status-item">
        <span :class="['status-indicator', component.component_status]"></span>
        <div class="status-details">
          <p class="status-name">{{ formatComponentName(component.component_name) }}</p>
          <p class="status-message">{{ component.status_message }}</p>
        </div>
        <span class="status-time">{{ formatTime(component.last_checked) }}</span>
      </div>
    </div>
  </div>

  <button @click="showStatusPanel = true" class="status-trigger">
    <span :class="['status-dot', overallStatus]"></span>
    System Status
  </button>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

const systemStatus = ref<any[]>([])
const dismissedAlerts = ref<string[]>([])
const showStatusPanel = ref(false)

const degradedComponents = computed(() => {
  return systemStatus.value.filter(
    c => c.component_status !== 'operational' && !dismissedAlerts.value.includes(c.component_name)
  )
})

const hasFailures = computed(() => degradedComponents.value.length > 0)

const overallStatus = computed(() => {
  const statuses = systemStatus.value.map(c => c.component_status)
  if (statuses.includes('offline')) return 'offline'
  if (statuses.includes('degraded')) return 'degraded'
  return 'operational'
})

const formatComponentName = (name: string) => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatTime = (timestamp: string) => {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const dismissAlert = (componentName: string) => {
  dismissedAlerts.value.push(componentName)
}

const loadSystemStatus = async () => {
  const { data, error } = await supabase
    .from('system_failover_status')
    .select('*')

  if (error) {
    console.error('Error loading system status:', error)
    return
  }

  systemStatus.value = data || []
}

onMounted(() => {
  loadSystemStatus()

  setInterval(() => {
    loadSystemStatus()
  }, 30000)
})
</script>

<style scoped>
.failover-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background: #fef2f2;
  border-bottom: 2px solid #fecaca;
  padding: 12px 24px;
}

.failover-alerts {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.failover-alert {
  display: flex;
  align-items: start;
  gap: 12px;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
}

.alert-icon {
  font-size: 24px;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  font-size: 14px;
  color: #991b1b;
  display: block;
  margin-bottom: 4px;
}

.alert-content p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.failover-mode {
  margin-top: 4px;
  color: #f59e0b;
  font-weight: 500;
}

.dismiss-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
}

.dismiss-btn:hover {
  color: #6b7280;
}

.status-trigger {
  position: fixed;
  bottom: 24px;
  right: 400px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1999;
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

.status-panel {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 400px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 2000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
}

.status-list {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.status-item {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
}

.status-indicator.operational {
  background: #10b981;
}

.status-indicator.degraded {
  background: #f59e0b;
}

.status-indicator.offline {
  background: #ef4444;
}

.status-details {
  flex: 1;
}

.status-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.status-message {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.status-time {
  font-size: 12px;
  color: #9ca3af;
}
</style>
