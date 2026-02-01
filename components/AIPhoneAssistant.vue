<template>
  <div class="phone-assistant">
    <div class="assistant-header">
      <h3>AI Phone Assistant</h3>
      <button @click="showInitiate = true" class="initiate-btn">New Call</button>
    </div>

    <div class="call-filters">
      <button
        v-for="filter in ['all', 'requires_review', 'escalated']"
        :key="filter"
        @click="currentFilter = filter"
        :class="['filter-btn', { active: currentFilter === filter }]"
      >
        {{ filter === 'all' ? 'All Calls' : filter === 'requires_review' ? 'Needs Review' : 'Escalated' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading calls...</div>

    <div v-else-if="calls.length === 0" class="empty-state">
      No calls found
    </div>

    <div v-else class="call-list">
      <div
        v-for="call in calls"
        :key="call.id"
        class="call-item"
        @click="selectCall(call)"
        :class="{ escalated: call.escalation_required }"
      >
        <div class="call-header">
          <span class="call-org">{{ call.organization_name }}</span>
          <span :class="['call-status', call.call_status]">{{ call.call_status }}</span>
        </div>
        <div class="call-details">
          <span class="call-purpose">{{ call.call_purpose }}</span>
          <span class="call-phone">{{ call.phone_number }}</span>
          <span class="call-date">{{ formatDate(call.created_at) }}</span>
        </div>
        <div v-if="call.escalation_required" class="escalation-badge">
          ⚠ Escalation Required
        </div>
      </div>
    </div>

    <div v-if="selectedCall" class="call-viewer">
      <div class="viewer-header">
        <h4>{{ selectedCall.organization_name }}</h4>
        <button @click="selectedCall = null" class="close-btn">×</button>
      </div>
      <div class="call-info">
        <div class="info-row">
          <span class="label">Purpose:</span>
          <span>{{ selectedCall.call_purpose }}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span>{{ selectedCall.call_status }}</span>
        </div>
        <div class="info-row">
          <span class="label">Duration:</span>
          <span>{{ selectedCall.duration_seconds }}s</span>
        </div>
        <div class="info-row">
          <span class="label">Started:</span>
          <span>{{ formatDateTime(selectedCall.started_at) }}</span>
        </div>
      </div>
      <div v-if="selectedCall.summary" class="call-summary">
        <h5>Summary</h5>
        <p>{{ selectedCall.summary }}</p>
      </div>
      <div v-if="selectedCall.outcome" class="call-outcome">
        <h5>Outcome</h5>
        <p>{{ selectedCall.outcome }}</p>
      </div>
      <div v-if="selectedCall.transcript" class="call-transcript">
        <h5>Transcript</h5>
        <pre>{{ selectedCall.transcript }}</pre>
      </div>
      <div v-if="selectedCall.escalation_required" class="escalation-section">
        <h5>Escalation Required</h5>
        <p>{{ selectedCall.escalation_reason }}</p>
      </div>
      <div class="call-actions">
        <button v-if="!selectedCall.founder_reviewed" @click="markReviewed(selectedCall.id)" class="action-btn primary">
          Mark as Reviewed
        </button>
        <button v-if="selectedCall.recording_url" class="action-btn">Listen to Recording</button>
      </div>
    </div>

    <div v-if="showInitiate" class="initiate-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Initiate AI Call</h4>
          <button @click="closeInitiate" class="close-btn">×</button>
        </div>
        <div class="initiate-form">
          <div class="form-field">
            <label>Organization Name:</label>
            <input v-model="callData.organizationName" type="text" placeholder="Insurance Company Name" />
          </div>
          <div class="form-field">
            <label>Phone Number:</label>
            <input v-model="callData.phoneNumber" type="tel" placeholder="(555) 123-4567" />
          </div>
          <div class="form-field">
            <label>Purpose:</label>
            <select v-model="callData.purpose">
              <option value="eligibility">Eligibility Verification</option>
              <option value="claim_status">Claim Status</option>
              <option value="follow_up">Follow Up</option>
              <option value="escalation">Escalation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-actions">
            <button @click="closeInitiate" class="cancel-btn">Cancel</button>
            <button @click="initiateCall" class="initiate-btn-submit">Initiate Call</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAICalls, initiateAICall, markCallReviewed } = useBillingWorkspace()

const calls = ref<any[]>([])
const selectedCall = ref<any>(null)
const showInitiate = ref(false)
const currentFilter = ref('all')
const loading = ref(true)

const callData = ref({
  organizationName: '',
  phoneNumber: '',
  purpose: 'eligibility'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US')
}

const loadCalls = async () => {
  loading.value = true
  const filters: any = {}
  if (currentFilter.value === 'requires_review') {
    filters.status = 'requires_review'
  } else if (currentFilter.value === 'escalated') {
    filters.escalationRequired = true
  }
  calls.value = await getAICalls(filters)
  loading.value = false
}

const selectCall = (call: any) => {
  selectedCall.value = call
}

const markReviewed = async (callId: string) => {
  await markCallReviewed(callId)
  selectedCall.value = null
  await loadCalls()
}

const initiateCall = async () => {
  await initiateAICall({
    phoneNumber: callData.value.phoneNumber,
    purpose: callData.value.purpose as any,
    organizationName: callData.value.organizationName
  })
  closeInitiate()
  await loadCalls()
}

const closeInitiate = () => {
  showInitiate.value = false
  callData.value = {
    organizationName: '',
    phoneNumber: '',
    purpose: 'eligibility'
  }
}

watch(currentFilter, () => {
  loadCalls()
})

onMounted(() => {
  loadCalls()
})
</script>

<style scoped>
.phone-assistant {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.assistant-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.initiate-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.call-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.filter-btn.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.loading,
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}

.call-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.call-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.call-item:hover {
  border-color: #10b981;
  background: #f9fafb;
}

.call-item.escalated {
  border-color: #f59e0b;
  background: #fffbeb;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.call-org {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.call-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.call-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.call-status.requires_review {
  background: #fef3c7;
  color: #92400e;
}

.call-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.escalation-badge {
  margin-top: 8px;
  padding: 4px 8px;
  background: #fed7aa;
  color: #9a3412;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.call-viewer,
.initiate-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.call-viewer {
  overflow-y: auto;
}

.call-viewer > div:first-child {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  padding: 24px;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.viewer-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
}

.call-info,
.call-summary,
.call-outcome,
.call-transcript,
.escalation-section {
  margin-bottom: 16px;
}

.call-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}

.info-row .label {
  font-weight: 600;
  color: #6b7280;
  min-width: 80px;
}

h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.call-transcript pre {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
}

.escalation-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 12px;
  border-radius: 6px;
}

.call-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn.primary {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.initiate-form {
  padding: 20px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-field input,
.form-field select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn,
.initiate-btn-submit {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: white;
}

.initiate-btn-submit {
  background: #10b981;
  color: white;
  border-color: #10b981;
}
</style>
