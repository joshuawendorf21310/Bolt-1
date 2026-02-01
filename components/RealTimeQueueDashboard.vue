<template>
  <div class="queue-dashboard">
    <div class="dashboard-header">
      <h1>Real-Time Queue Management</h1>
      <div class="header-stats">
        <div class="stat-box stat-active">
          <div class="stat-number">{{ activeCallsCount }}</div>
          <div class="stat-label">Active Calls</div>
        </div>
        <div class="stat-box stat-pending">
          <div class="stat-number">{{ pendingCallsCount }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-box stat-billing">
          <div class="stat-number">{{ billingPendingCount }}</div>
          <div class="stat-label">Pending Billing</div>
        </div>
        <div class="stat-box stat-health">
          <div class="stat-number">{{ systemHealth }}</div>
          <div class="stat-label">System Health</div>
        </div>
      </div>
    </div>

    <div class="main-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- CALL QUEUE TAB -->
    <div v-if="activeTab === 'calls'" class="tab-content">
      <div class="queue-section">
        <h2>Priority Queue</h2>
        <div class="priority-grid">
          <div v-for="priority in priorityQueues" :key="`priority-${priority.level}`" class="priority-column">
            <div :class="`priority-header priority-${priority.level}`">
              <strong>Priority {{ priority.level }}</strong>
              <span class="count">{{ priority.calls.length }}</span>
            </div>
            <div class="call-list">
              <div v-if="priority.calls.length === 0" class="no-calls">No calls</div>
              <div v-else>
                <div v-for="call in priority.calls" :key="call.id" class="call-card">
                  <div class="call-header">
                    <div class="call-number">{{ call.call_number }}</div>
                    <div class="call-wait">{{ getWaitTime(call.received_time) }}</div>
                  </div>
                  <div class="call-complaint">{{ call.complaint }}</div>
                  <div class="call-location">📍 {{ call.location_address }}</div>
                  <div class="call-actions">
                    <button @click="assignCall(call.id)" class="btn-assign">Assign</button>
                    <button @click="viewCallDetails(call.id)" class="btn-view">Details</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ENCOUNTERS TAB -->
    <div v-if="activeTab === 'encounters'" class="tab-content">
      <div class="encounters-section">
        <h2>Active Encounters</h2>
        <div class="encounter-list">
          <div v-if="activeEncounters.length === 0" class="no-data">
            No active encounters
          </div>
          <div v-else>
            <div v-for="encounter in activeEncounters" :key="encounter.id" class="encounter-card">
              <div class="encounter-patient">
                <strong>{{ encounter.patient_name }}</strong> ({{ encounter.patient_dob }})
              </div>
              <div class="encounter-complaint">{{ encounter.chief_complaint }}</div>
              <div class="encounter-crew">
                <span v-if="encounter.crew_member_1_name">👨‍⚕️ {{ encounter.crew_member_1_name }}</span>
                <span v-if="encounter.crew_member_2_name">��‍⚕️ {{ encounter.crew_member_2_name }}</span>
              </div>
              <div class="encounter-vitals">
                <span v-if="latestVitals[encounter.id]">
                  🫀 HR: {{ latestVitals[encounter.id].heart_rate }} | 🫁 RR: {{ latestVitals[encounter.id].respirations }}
                </span>
              </div>
              <div class="encounter-actions">
                <button @click="recordVitals(encounter.id)" class="btn-vitals">Record Vitals</button>
                <button @click="recordTreatment(encounter.id)" class="btn-treatment">Add Treatment</button>
                <button @click="submitEncounter(encounter.id)" class="btn-submit">Submit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BILLING TAB -->
    <div v-if="activeTab === 'billing'" class="tab-content">
      <div class="billing-section">
        <h2>Billing Queue</h2>
        <div class="billing-filters">
          <select v-model="billingFilter" class="filter-select">
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="submitted_to_insurance">Submitted</option>
          </select>
        </div>
        <table class="billing-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Service Date</th>
              <th>Charge</th>
              <th>Insurance</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredBillingItems" :key="item.id">
              <td>{{ item.patient_name }}</td>
              <td>{{ formatDate(item.service_date) }}</td>
              <td>${{ item.total_charge?.toFixed(2) }}</td>
              <td>{{ item.insurance_primary }}</td>
              <td>
                <span :class="`status-badge status-${item.status}`">{{ item.status }}</span>
              </td>
              <td>{{ item.priority_score }}</td>
              <td>
                <button @click="approveBillingItem(item.id)" class="btn-approve">Approve</button>
                <button @click="rejectBillingItem(item.id)" class="btn-reject">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ELIGIBILITY TAB -->
    <div v-if="activeTab === 'eligibility'" class="tab-content">
      <div class="eligibility-section">
        <h2>Insurance Eligibility Verification</h2>
        <div class="eligibility-form">
          <div class="form-row">
            <div class="form-group">
              <label>Patient Name</label>
              <input v-model="eligibilityForm.patient_name" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label>Insurance Company</label>
              <select v-model="eligibilityForm.insurance_company">
                <option value="">Select Insurance</option>
                <option value="Aetna">Aetna</option>
                <option value="BCBS">Blue Cross Blue Shield</option>
                <option value="Humana">Humana</option>
                <option value="United">United Healthcare</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Medicare">Medicare</option>
              </select>
            </div>
            <div class="form-group">
              <label>Member ID</label>
              <input v-model="eligibilityForm.member_id" placeholder="Member ID" />
            </div>
            <button @click="checkEligibility" class="btn-check">Check Eligibility</button>
          </div>
        </div>
        <div v-if="eligibilityResult" class="eligibility-result">
          <div class="result-grid">
            <div class="result-item">
              <span class="label">Eligible:</span>
              <span class="value">{{ eligibilityResult.eligible ? 'Yes' : 'No' }}</span>
            </div>
            <div class="result-item">
              <span class="label">Copay:</span>
              <span class="value">${{ eligibilityResult.copay }}</span>
            </div>
            <div class="result-item">
              <span class="label">Deductible:</span>
              <span class="value">${{ eligibilityResult.deductible }}</span>
            </div>
            <div class="result-item">
              <span class="label">Deductible Met:</span>
              <span class="value">${{ eligibilityResult.deductible_met }}</span>
            </div>
            <div class="result-item">
              <span class="label">Pre-Auth Required:</span>
              <span class="value">{{ eligibilityResult.pre_auth_required ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CALL DETAIL MODAL -->
    <div v-if="selectedCall" class="modal" @click.self="selectedCall = null">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedCall.call_number }}</h2>
          <button @click="selectedCall = null" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <strong>Complaint:</strong> {{ selectedCall.complaint }}
          </div>
          <div class="detail-row">
            <strong>Location:</strong> {{ selectedCall.location_address }}
          </div>
          <div class="detail-row">
            <strong>Caller:</strong> {{ selectedCall.caller_name }} ({{ selectedCall.caller_phone }})
          </div>
          <div class="detail-row">
            <strong>Priority:</strong> {{ selectedCall.priority }}
          </div>
          <div class="detail-row">
            <strong>AI Screening:</strong> {{ selectedCall.ai_screening_result }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getPendingCalls, getQueueStats } = useCallQueue()
const { getOpenEncounters, getEncounterStats } = usePatientEncounter()
const { getPendingBillingItems, getBillingStats } = useBillingQueue()

const activeTab = ref('calls')
const activeCallsCount = ref(0)
const pendingCallsCount = ref(0)
const billingPendingCount = ref(0)
const systemHealth = ref('Good')

const pendingCalls = ref([])
const activeEncounters = ref([])
const billingItems = ref([])
const latestVitals = ref({})

const billingFilter = ref('pending_review')
const selectedCall = ref(null)

const eligibilityForm = ref({
  patient_name: '',
  insurance_company: '',
  member_id: '',
})
const eligibilityResult = ref(null)

const tabs = [
  { id: 'calls', label: '📞 Calls' },
  { id: 'encounters', label: '🏥 Encounters' },
  { id: 'billing', label: '💰 Billing' },
  { id: 'eligibility', label: '🛡️ Eligibility' },
]

const priorityQueues = computed(() => [
  { level: 1, calls: pendingCalls.value.filter(c => c.priority === 1) },
  { level: 2, calls: pendingCalls.value.filter(c => c.priority === 2) },
  { level: 3, calls: pendingCalls.value.filter(c => c.priority === 3) },
  { level: 4, calls: pendingCalls.value.filter(c => c.priority === 4) },
])

const filteredBillingItems = computed(() => {
  return billingItems.value.filter(item => item.status === billingFilter.value)
})

const loadData = async () => {
  pendingCalls.value = await getPendingCalls() || []
  activeEncounters.value = await getOpenEncounters() || []
  billingItems.value = await getPendingBillingItems() || []

  const stats = await getQueueStats()
  activeCallsCount.value = stats.active_calls
  pendingCallsCount.value = stats.pending_calls

  const billingStats = await getBillingStats()
  billingPendingCount.value = billingStats.pending_review
}

const getWaitTime = (receivedTime: string) => {
  const received = new Date(receivedTime)
  const now = new Date()
  const minutes = Math.floor((now.getTime() - received.getTime()) / 60000)
  return `${minutes}m`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const assignCall = (callId: string) => {
  alert('Assign call ' + callId)
}

const viewCallDetails = (callId: string) => {
  selectedCall.value = pendingCalls.value.find(c => c.id === callId)
}

const recordVitals = (encounterId: string) => {
  alert('Record vitals for encounter ' + encounterId)
}

const recordTreatment = (encounterId: string) => {
  alert('Record treatment for encounter ' + encounterId)
}

const submitEncounter = (encounterId: string) => {
  alert('Submit encounter ' + encounterId)
}

const approveBillingItem = (itemId: string) => {
  alert('Approve billing item ' + itemId)
}

const rejectBillingItem = (itemId: string) => {
  alert('Reject billing item ' + itemId)
}

const checkEligibility = async () => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eligibility-check`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eligibilityForm.value),
  })

  const result = await response.json()
  if (result.success) {
    eligibilityResult.value = result.eligibility
  }
}

onMounted(() => {
  loadData()
  setInterval(loadData, 10000)
})
</script>

<style scoped>
.queue-dashboard {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-box {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #ddd;
}

.stat-active {
  border-left-color: #f44336;
}

.stat-pending {
  border-left-color: #ff9800;
}

.stat-billing {
  border-left-color: #2196f3;
}

.stat-health {
  border-left-color: #4caf50;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  margin-top: 4px;
}

.main-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-button.active {
  background: #2196f3;
  color: #fff;
}

.tab-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.queue-section h2,
.encounters-section h2,
.billing-section h2,
.eligibility-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.priority-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.priority-column {
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.priority-header {
  padding: 12px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority-1 {
  background: #f44336;
}

.priority-2 {
  background: #ff9800;
}

.priority-3 {
  background: #2196f3;
}

.priority-4 {
  background: #9c27b0;
}

.count {
  font-size: 18px;
  font-weight: 700;
}

.call-list {
  padding: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.no-calls {
  text-align: center;
  padding: 20px;
  color: #999;
}

.call-card {
  background: #fff;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.call-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.call-number {
  font-weight: 700;
}

.call-wait {
  font-size: 12px;
  color: #f44336;
  font-weight: 700;
}

.call-complaint {
  font-size: 14px;
  margin-bottom: 4px;
}

.call-location {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.call-actions {
  display: flex;
  gap: 6px;
}

.btn-assign,
.btn-view,
.btn-vitals,
.btn-treatment,
.btn-submit,
.btn-approve,
.btn-reject,
.btn-check {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.btn-assign,
.btn-check {
  background: #2196f3;
  color: #fff;
  flex: 1;
}

.btn-view,
.btn-vitals {
  background: #4caf50;
  color: #fff;
  flex: 1;
}

.btn-treatment,
.btn-submit {
  background: #ff9800;
  color: #fff;
  flex: 1;
}

.btn-approve {
  background: #4caf50;
  color: #fff;
}

.btn-reject {
  background: #f44336;
  color: #fff;
}

.encounter-list,
.no-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.encounter-card {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.encounter-patient {
  font-weight: 700;
  margin-bottom: 8px;
}

.encounter-complaint {
  color: #666;
  margin-bottom: 8px;
}

.encounter-crew,
.encounter-vitals {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.encounter-actions {
  display: flex;
  gap: 8px;
}

.billing-filters {
  margin-bottom: 16px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-weight: 600;
}

.billing-table {
  width: 100%;
  border-collapse: collapse;
}

.billing-table th,
.billing-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.billing-table th {
  background: #f5f5f5;
  font-weight: 700;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pending_review {
  background: #fff3e0;
  color: #e65100;
}

.status-approved {
  background: #e8f5e9;
  color: #1b5e20;
}

.eligibility-form {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 13px;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.eligibility-result {
  background: #e8f5e9;
  padding: 16px;
  border-radius: 8px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
}

.result-item .label {
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.result-item .value {
  font-size: 18px;
  font-weight: 700;
  color: #1b5e20;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.detail-row {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}
</style>
