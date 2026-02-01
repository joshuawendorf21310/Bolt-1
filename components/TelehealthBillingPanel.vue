<template>
  <div class="telehealth-billing">
    <div class="panel-header">
      <h3>Telehealth Billing</h3>
      <p class="subtitle">Carefusion Telehealth encounters and revenue</p>
    </div>

    <div v-if="loading" class="loading">Loading telehealth data...</div>

    <div v-else-if="analytics" class="content">
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Total Encounters</span>
          <span class="metric-value">{{ analytics.totalEncounters }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Billable Encounters</span>
          <span class="metric-value">{{ analytics.billableEncounters }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Transport Dispatched</span>
          <span class="metric-value">{{ analytics.transportDispatched }}</span>
          <span class="metric-detail">{{ analytics.transportRate.toFixed(1) }}% dispatch rate</span>
        </div>
        <div class="metric-card highlight">
          <span class="metric-label">Telehealth Revenue</span>
          <span class="metric-value">{{ formatCurrency(analytics.paidRevenue) }}</span>
          <span class="metric-detail">of {{ formatCurrency(analytics.totalRevenue) }} billed</span>
        </div>
      </div>

      <div class="encounters-section">
        <h4>Recent Encounters</h4>
        <div v-if="encounters.length === 0" class="empty-state">
          No telehealth encounters yet
        </div>
        <div v-else class="encounters-list">
          <div v-for="encounter in encounters" :key="encounter.id" class="encounter-item">
            <div class="encounter-info">
              <span class="encounter-number">{{ encounter.encounter_number }}</span>
              <span class="encounter-date">{{ formatDate(encounter.session_start) }}</span>
            </div>
            <div class="encounter-details">
              <span>{{ formatProviderType(encounter.provider_type) }}</span>
              <span>{{ formatServiceCategory(encounter.service_category) }}</span>
              <span v-if="encounter.duration_minutes">{{ encounter.duration_minutes }} min</span>
            </div>
            <div class="encounter-status">
              <span :class="['disposition-badge', encounter.resulted_in_transport ? 'transport' : 'resolved']">
                {{ formatDisposition(encounter.disposition) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getTelehealthAnalytics, getTelehealthEncounters } = useTelehealth()

const analytics = ref<any>(null)
const encounters = ref<any[]>([])
const loading = ref(true)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatProviderType = (type: string) => {
  const types: Record<string, string> = {
    'physician': 'MD',
    'nurse_practitioner': 'NP',
    'physician_assistant': 'PA',
    'nurse': 'RN',
    'paramedic': 'Paramedic',
    'emt': 'EMT'
  }
  return types[type] || type
}

const formatServiceCategory = (category: string) => {
  const categories: Record<string, string> = {
    'consultation': 'Consultation',
    'follow_up': 'Follow-up',
    'triage': 'Triage',
    'assessment': 'Assessment',
    'urgent_care': 'Urgent Care',
    'mental_health': 'Mental Health'
  }
  return categories[category] || category
}

const formatDisposition = (disposition: string) => {
  const dispositions: Record<string, string> = {
    'resolved': 'Resolved',
    'ems_dispatched': 'EMS Dispatched',
    'referred': 'Referred',
    'follow_up_needed': 'Follow-up',
    'transferred': 'Transferred',
    'self_care': 'Self-care'
  }
  return dispositions[disposition] || disposition
}

onMounted(async () => {
  analytics.value = await getTelehealthAnalytics()
  encounters.value = await getTelehealthEncounters({ isBillable: true })
  loading.value = false
})
</script>

<style scoped>
.telehealth-billing {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.metric-card.highlight {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.metric-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.metric-detail {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.encounters-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.encounters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.encounter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.encounter-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.encounter-number {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.encounter-date {
  font-size: 12px;
  color: #6b7280;
}

.encounter-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.encounter-status {
  display: flex;
  align-items: center;
}

.disposition-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.disposition-badge.resolved {
  background: #d1fae5;
  color: #065f46;
}

.disposition-badge.transport {
  background: #fef3c7;
  color: #92400e;
}
</style>
