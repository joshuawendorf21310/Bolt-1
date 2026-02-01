<template>
  <div class="founder-dashboard">
    <div class="dashboard-header">
      <h1>Founder Dashboard</h1>
      <p class="dashboard-subtitle">Single-screen monitoring view for fast decisions</p>
      <div v-if="alerts.length > 0" class="active-alerts">
        <span class="alerts-badge">{{ alerts.length }} {{ alerts.length === 1 ? 'Alert' : 'Alerts' }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <div v-else class="dashboard-content">
      <section v-if="alerts.length > 0" class="alerts-section">
        <div v-for="alert in alerts" :key="alert.id" :class="['alert-item', `severity-${alert.severity}`]">
          <div class="alert-header">
            <span class="alert-icon">
              {{ alert.severity === 'critical' ? '⚠' : alert.severity === 'warning' ? '⚡' : 'ℹ' }}
            </span>
            <span class="alert-title">{{ alert.title }}</span>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <p class="alert-action"><strong>What to do:</strong> {{ alert.action_required }}</p>
          <div class="alert-actions">
            <button @click="acknowledgeAlert(alert.id)" class="alert-button">Acknowledge</button>
            <button @click="resolveAlert(alert.id)" class="alert-button primary">Resolve</button>
          </div>
        </div>
      </section>

      <section class="platform-revenue-section">
        <PlatformRevenueBreakdown />
      </section>

      <section class="monitoring-layer">
        <BusinessHealthSummary />
        <AccountingIntegrityStrip />
      </section>

      <section class="decision-support-layer">
        <div class="two-column-grid">
          <TaxSafetyBlock />
          <FounderCompensationGuardrails />
        </div>
      </section>

      <section class="operations-layer">
        <BillingCommandCenter />
      </section>

      <section class="revenue-layer">
        <div class="two-column-grid">
          <PrivatePayRevenue />
          <div>
            <TelehealthBillingPanel />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { getActiveAlerts, acknowledgeAlert: ackAlert, resolveAlert: resAlert } = useSystemHealth()

const alerts = ref<any[]>([])
const loading = ref(true)

const acknowledgeAlert = async (alertId: string) => {
  await ackAlert(alertId)
  alerts.value = await getActiveAlerts()
}

const resolveAlert = async (alertId: string) => {
  await resAlert(alertId)
  alerts.value = await getActiveAlerts()
}

onMounted(async () => {
  alerts.value = await getActiveAlerts()
  loading.value = false
})
</script>

<style scoped>
.founder-dashboard {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 24px;
}

.dashboard-header {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.active-alerts {
  display: flex;
  align-items: center;
}

.alerts-badge {
  background: #dc2626;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alerts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  background: white;
  border: 2px solid;
  border-radius: 8px;
  padding: 16px;
}

.alert-item.severity-critical {
  border-color: #dc2626;
  background: #fef2f2;
}

.alert-item.severity-warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.alert-item.severity-info {
  border-color: #3b82f6;
  background: #eff6ff;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.alert-icon {
  font-size: 20px;
}

.alert-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.alert-message {
  margin: 0 0 8px 28px;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.alert-action {
  margin: 0 0 12px 28px;
  color: #111827;
  font-size: 14px;
}

.alert-actions {
  display: flex;
  gap: 8px;
  margin-left: 28px;
}

.alert-button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-button:hover {
  background: #f9fafb;
}

.alert-button.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.alert-button.primary:hover {
  background: #2563eb;
}

.platform-revenue-section,
.monitoring-layer,
.decision-support-layer,
.operations-layer,
.revenue-layer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.two-column-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .founder-dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .two-column-grid {
    grid-template-columns: 1fr;
  }
}
</style>
