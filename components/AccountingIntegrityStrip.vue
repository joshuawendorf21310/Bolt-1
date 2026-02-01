<template>
  <div class="accounting-integrity">
    <h3>Accounting Integrity</h3>
    <p class="question">Can I trust the numbers on this screen?</p>

    <div v-if="loading" class="loading">Checking data integrity...</div>

    <div v-else-if="integrity" class="integrity-grid">
      <div class="integrity-item" :class="bankFeedStatusClass">
        <span class="label">Bank Feed</span>
        <span class="value">{{ bankFeedStatus }}</span>
        <span v-if="integrity.bankFeeds[0]?.lastSync" class="detail">
          Last sync: {{ formatTimestamp(integrity.bankFeeds[0].lastSync) }}
        </span>
      </div>

      <div class="integrity-item" :class="reconciliationStatusClass">
        <span class="label">Reconciliation</span>
        <span class="value">{{ reconciliationStatus }}</span>
        <span v-if="integrity.lastReconciliation" class="detail">
          Last: {{ formatDate(integrity.lastReconciliation.date) }}
        </span>
      </div>

      <div class="integrity-item">
        <span class="label">Unreconciled Transactions</span>
        <span class="value">{{ integrity.unreconciledCount }}</span>
      </div>

      <div class="integrity-item" :class="dataFreshnessClass">
        <span class="label">Data Freshness</span>
        <span class="value">{{ dataFreshnessStatus }}</span>
        <span v-if="staleDataSources.length > 0" class="detail warning">
          Stale: {{ staleDataSources.join(', ') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAccountingIntegrity } = useFinancialHealth()

const integrity = ref<any>(null)
const loading = ref(true)

const bankFeedStatus = computed(() => {
  if (!integrity.value?.bankFeeds[0]) return 'Unknown'
  return integrity.value.bankFeeds[0].status === 'connected' ? 'Connected' : 'Degraded'
})

const bankFeedStatusClass = computed(() => {
  if (!integrity.value?.bankFeeds[0]) return 'status-unknown'
  return integrity.value.bankFeeds[0].status === 'connected' ? 'status-good' : 'status-warning'
})

const reconciliationStatus = computed(() => {
  if (!integrity.value?.lastReconciliation) return 'Never reconciled'
  const daysSince = Math.floor((Date.now() - new Date(integrity.value.lastReconciliation.date).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince > 30) return 'Stale'
  if (daysSince > 14) return 'Needs attention'
  return 'Current'
})

const reconciliationStatusClass = computed(() => {
  const status = reconciliationStatus.value
  if (status === 'Never reconciled' || status === 'Stale') return 'status-critical'
  if (status === 'Needs attention') return 'status-warning'
  return 'status-good'
})

const staleDataSources = computed(() => {
  if (!integrity.value?.dataFreshness) return []
  return integrity.value.dataFreshness
    .filter((d: any) => d.is_stale)
    .map((d: any) => d.data_source.replace(/_/g, ' '))
})

const dataFreshnessStatus = computed(() => {
  const count = staleDataSources.value.length
  if (count === 0) return 'All current'
  return `${count} stale`
})

const dataFreshnessClass = computed(() => {
  return staleDataSources.value.length > 0 ? 'status-warning' : 'status-good'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

onMounted(async () => {
  integrity.value = await getAccountingIntegrity()
  loading.value = false
})
</script>

<style scoped>
.accounting-integrity {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.accounting-integrity h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.question {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.integrity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.integrity-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.integrity-item.status-good {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.integrity-item.status-warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.integrity-item.status-critical {
  background: #fef2f2;
  border-color: #fecaca;
}

.integrity-item.status-unknown {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.detail {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.detail.warning {
  color: #d97706;
  font-weight: 500;
}
</style>
