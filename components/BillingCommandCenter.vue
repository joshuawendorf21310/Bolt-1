<template>
  <div class="billing-command-center">
    <div class="header">
      <h3>Billing Command Center</h3>
      <p class="subtitle">Operational queue for solo biller</p>
    </div>

    <div v-if="loading" class="loading">Loading billing queue...</div>

    <div v-else-if="queue" class="queue-content">
      <div class="queue-summary">
        <div class="summary-stat">
          <span class="stat-value">{{ queue.count }}</span>
          <span class="stat-label">Claims Need Action</span>
        </div>
      </div>

      <div v-if="queue.count === 0" class="empty-state">
        <p>No claims in queue. All billing tasks are current.</p>
      </div>

      <div v-else class="queue-groups">
        <div v-for="(items, action) in queue.grouped" :key="action" class="queue-group">
          <h4 class="group-title">
            {{ formatActionTitle(action) }}
            <span class="count-badge">{{ items.length }}</span>
          </h4>
          <div class="queue-items">
            <div v-for="item in items" :key="item.id" class="queue-item" @click="selectItem(item)">
              <div class="item-info">
                <span class="claim-number">{{ item.billing_claims?.claim_number }}</span>
                <span class="patient-name">{{ item.billing_claims?.patient_name }}</span>
                <span class="service-date">{{ formatDate(item.billing_claims?.service_date) }}</span>
              </div>
              <div class="item-details">
                <span class="payer">{{ item.billing_claims?.payer_name }}</span>
                <span class="amount">{{ formatCurrency(item.billing_claims?.billed_amount) }}</span>
              </div>
              <div class="item-reason">{{ item.blocking_reason }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedItem" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Claim Triage: {{ selectedItem.billing_claims?.claim_number }}</h3>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div class="triage-section">
            <h4>What's Blocking Payment</h4>
            <p>{{ selectedItem.blocking_reason }}</p>
          </div>
          <div class="triage-section">
            <h4>Claim Details</h4>
            <div class="detail-row">
              <span>Patient:</span>
              <span>{{ selectedItem.billing_claims?.patient_name }}</span>
            </div>
            <div class="detail-row">
              <span>Service Date:</span>
              <span>{{ formatDate(selectedItem.billing_claims?.service_date) }}</span>
            </div>
            <div class="detail-row">
              <span>Payer:</span>
              <span>{{ selectedItem.billing_claims?.payer_name }}</span>
            </div>
            <div class="detail-row">
              <span>Amount:</span>
              <span>{{ formatCurrency(selectedItem.billing_claims?.billed_amount) }}</span>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span>{{ selectedItem.billing_claims?.claim_status }}</span>
            </div>
          </div>
          <div class="triage-section">
            <h4>Action Required</h4>
            <p>{{ formatActionTitle(selectedItem.action_required) }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="performAction" class="action-button primary">
            {{ getActionButtonText(selectedItem.action_required) }}
          </button>
          <button @click="closeModal" class="action-button">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getWorkQueue, performAction: executeAction } = useBillingQueue()

const queue = ref<any>(null)
const loading = ref(true)
const selectedItem = ref<any>(null)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatActionTitle = (action: string) => {
  const titles: Record<string, string> = {
    'verify_eligibility': 'Verify Eligibility',
    'recheck_eligibility': 'Recheck Eligibility',
    'submit_claim': 'Submit Claim',
    'resubmit_claim': 'Resubmit Claim',
    'check_status': 'Check Status',
    'review_denial': 'Review Denial',
    'attach_documentation': 'Attach Documentation',
    'post_payment': 'Post Payment',
    'contact_payer': 'Contact Payer',
    'patient_follow_up': 'Patient Follow-up'
  }
  return titles[action] || action
}

const getActionButtonText = (action: string) => {
  const buttons: Record<string, string> = {
    'verify_eligibility': 'Run Eligibility Check',
    'recheck_eligibility': 'Recheck Eligibility',
    'submit_claim': 'Submit Claim',
    'resubmit_claim': 'Resubmit Claim',
    'check_status': 'Request Status',
    'review_denial': 'Review & Decide',
    'attach_documentation': 'Attach Docs',
    'post_payment': 'Post to AR',
    'contact_payer': 'Log Payer Call',
    'patient_follow_up': 'Contact Patient'
  }
  return buttons[action] || 'Take Action'
}

const selectItem = (item: any) => {
  selectedItem.value = item
}

const closeModal = () => {
  selectedItem.value = null
}

const performAction = async () => {
  if (!selectedItem.value) return

  await executeAction(
    selectedItem.value.id,
    selectedItem.value.action_required,
    selectedItem.value.claim_id,
    {}
  )

  closeModal()
  queue.value = await getWorkQueue()
}

onMounted(async () => {
  queue.value = await getWorkQueue()
  loading.value = false
})
</script>

<style scoped>
.billing-command-center {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
}

.header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.queue-summary {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.queue-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.queue-group {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.group-title {
  background: #f9fafb;
  padding: 12px 16px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.queue-items {
  display: flex;
  flex-direction: column;
}

.queue-item {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
}

.queue-item:hover {
  background: #f9fafb;
}

.item-info {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

.claim-number {
  font-weight: 600;
  color: #111827;
}

.patient-name {
  color: #374151;
}

.service-date {
  font-size: 13px;
  color: #6b7280;
}

.item-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.item-reason {
  font-size: 13px;
  color: #d97706;
  font-weight: 500;
}

.modal-overlay {
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
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-body {
  padding: 20px;
}

.triage-section {
  margin-bottom: 20px;
}

.triage-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.triage-section p {
  margin: 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.detail-row span:first-child {
  color: #6b7280;
  font-weight: 500;
}

.detail-row span:last-child {
  color: #111827;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: #f9fafb;
}

.action-button.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background: #2563eb;
}
</style>
