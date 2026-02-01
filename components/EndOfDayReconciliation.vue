<template>
  <div class="reconciliation-container">
    <div class="reconciliation-header">
      <h2>End of Day Reconciliation</h2>
      <p class="timestamp">{{ formatDate(new Date()) }}</p>
    </div>

    <div v-if="loading" class="loading">Generating reconciliation...</div>

    <div v-else class="reconciliation-content">
      <div v-if="reconciliation" class="reconciliation-summary">
        <div :class="['all-clear-banner', { cleared: reconciliation.all_clear }]">
          <span v-if="reconciliation.all_clear" class="check-icon">✅</span>
          <span v-else class="warning-icon">⚠️</span>
          <div class="banner-text">
            <h3>{{ reconciliation.all_clear ? 'All Clear!' : 'Items Requiring Attention' }}</h3>
            <p>
              {{
                reconciliation.all_clear
                  ? 'You can safely close the day.'
                  : `${reconciliation.missed_deadlines + reconciliation.unresolved_critical_items} items need review.`
              }}
            </p>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-icon">📋</span>
            <span class="metric-label">Billable Encounters</span>
            <span class="metric-value">{{ reconciliation.total_billable_encounters }}</span>
          </div>

          <div class="metric-card">
            <span class="metric-icon">👤</span>
            <span class="metric-label">Face Sheets Created</span>
            <span class="metric-value">{{ reconciliation.total_face_sheets_created }}</span>
          </div>

          <div class="metric-card">
            <span class="metric-icon">✓</span>
            <span class="metric-label">Face Sheets Approved</span>
            <span class="metric-value">{{ reconciliation.total_face_sheets_approved }}</span>
          </div>

          <div class="metric-card">
            <span class="metric-icon">⏳</span>
            <span class="metric-label">Face Sheets Pending</span>
            <span class="metric-value">{{ reconciliation.total_face_sheets_pending }}</span>
          </div>

          <div class="metric-card">
            <span class="metric-icon">📤</span>
            <span class="metric-label">Claims Submitted</span>
            <span class="metric-value">{{ reconciliation.total_claims_submitted }}</span>
          </div>

          <div class="metric-card">
            <span class="metric-icon">⌛</span>
            <span class="metric-label">Claims In Progress</span>
            <span class="metric-value">{{ reconciliation.total_claims_in_progress }}</span>
          </div>
        </div>

        <div class="issues-section">
          <h3>Issues Requiring Attention</h3>

          <div v-if="reconciliation.missed_deadlines > 0" class="issue-item critical">
            <span class="issue-icon">🚨</span>
            <div class="issue-content">
              <h4>Hard SLA Breaches</h4>
              <p>{{ reconciliation.missed_deadlines }} items have missed hard deadlines</p>
            </div>
            <button @click="viewHardBreaches" class="view-btn">View</button>
          </div>

          <div v-if="reconciliation.unresolved_critical_items > 0" class="issue-item warning">
            <span class="issue-icon">⚠️</span>
            <div class="issue-content">
              <h4>Unresolved Critical Items</h4>
              <p>{{ reconciliation.unresolved_critical_items }} critical items need resolution</p>
            </div>
            <button @click="viewCriticalItems" class="view-btn">View</button>
          </div>

          <div v-if="reconciliation.unlinked_calls > 0" class="issue-item">
            <span class="issue-icon">📞</span>
            <div class="issue-content">
              <h4>Unlinked Calls</h4>
              <p>{{ reconciliation.unlinked_calls }} calls not linked to billing records</p>
            </div>
            <button @click="viewUnlinkedCalls" class="view-btn">View</button>
          </div>

          <div v-if="reconciliation.blocking_documents > 0" class="issue-item">
            <span class="issue-icon">📄</span>
            <div class="issue-content">
              <h4>Blocking Documents</h4>
              <p>{{ reconciliation.blocking_documents }} documents are blocking billing</p>
            </div>
            <button @click="viewBlockingDocs" class="view-btn">View</button>
          </div>

          <div v-if="allIssuesResolved" class="no-issues">
            <span>✅ All issues resolved</span>
          </div>
        </div>

        <div class="action-buttons">
          <button v-if="!reconciliation.all_clear" @click="reviewAgain" class="review-btn">
            Review Issues
          </button>
          <button @click="closeDay" class="close-btn" :disabled="!reconciliation.all_clear">
            {{ reconciliation.all_clear ? 'Close Day' : 'Cannot close yet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { generateEndOfDayReport } = useEndOfDayReconciliation()

const reconciliation = ref<any>(null)
const loading = ref(true)

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const allIssuesResolved = computed(() => {
  if (!reconciliation.value) return false
  return (
    reconciliation.value.missed_deadlines === 0 &&
    reconciliation.value.unresolved_critical_items === 0 &&
    reconciliation.value.unlinked_calls === 0 &&
    reconciliation.value.blocking_documents === 0
  )
})

const generateReconciliation = async () => {
  try {
    loading.value = true
    const result = await generateEndOfDayReport()
    reconciliation.value = result.summary
  } catch (error) {
    console.error('Error generating reconciliation:', error)
  } finally {
    loading.value = false
  }
}

const viewHardBreaches = () => {
  console.log('View hard breaches')
}

const viewCriticalItems = () => {
  console.log('View critical items')
}

const viewUnlinkedCalls = () => {
  console.log('View unlinked calls')
}

const viewBlockingDocs = () => {
  console.log('View blocking documents')
}

const reviewAgain = () => {
  generateReconciliation()
}

const closeDay = async () => {
  console.log('Closing day')
}

onMounted(() => {
  generateReconciliation()
})
</script>

<style scoped>
.reconciliation-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 1000px;
}

.reconciliation-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.reconciliation-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.timestamp {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #6b7280;
  font-size: 16px;
}

.all-clear-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  margin-bottom: 24px;
}

.all-clear-banner.cleared {
  background: #d1fae5;
  border-left-color: #10b981;
}

.check-icon,
.warning-icon {
  font-size: 32px;
}

.banner-text {
  flex: 1;
}

.banner-text h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.banner-text p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.all-clear-banner.cleared h3 {
  color: #065f46;
}

.all-clear-banner.cleared p {
  color: #065f46;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.metric-icon {
  font-size: 24px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.issues-section {
  margin: 24px 0;
}

.issues-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-left: 4px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 12px;
}

.issue-item.critical {
  background: #fee2e2;
  border-left-color: #ef4444;
}

.issue-item.warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.issue-icon {
  font-size: 20px;
}

.issue-content {
  flex: 1;
}

.issue-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.issue-content p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.view-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.no-issues {
  text-align: center;
  padding: 32px;
  color: #10b981;
  font-size: 16px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.review-btn,
.close-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.review-btn {
  background: #3b82f6;
  color: white;
}

.review-btn:hover {
  background: #2563eb;
}

.close-btn {
  background: #10b981;
  color: white;
}

.close-btn:hover:not(:disabled) {
  background: #059669;
}

.close-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
