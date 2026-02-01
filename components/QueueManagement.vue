<template>
  <div class="queue-management">
    <div class="queue-tabs">
      <button
        v-for="queue in queues"
        :key="queue.id"
        @click="activeQueue = queue.id"
        :class="['queue-tab', { active: activeQueue === queue.id }]"
      >
        <span class="queue-icon">{{ queue.icon }}</span>
        <span class="queue-name">{{ queue.name }}</span>
        <span v-if="queue.count > 0" class="queue-badge">{{ queue.count }}</span>
      </button>
    </div>

    <div class="queue-content">
      <div v-if="activeQueue === 'calls'" class="queue-section">
        <h3>Calls Queue</h3>
        <p class="queue-description">Real-time and historical call control</p>
        <div v-if="callsQueue.length === 0" class="empty-state">No active calls</div>
        <div v-else class="queue-list">
          <div v-for="item in callsQueue" :key="item.id" class="queue-item">
            <div class="item-header">
              <span class="item-direction">{{ item.call_direction === 'inbound' ? '📞 Inbound' : '📱 Outbound' }}</span>
              <span :class="['item-state', item.queue_state]">{{ item.queue_state }}</span>
            </div>
            <div class="item-details">
              <p class="item-title">{{ item.caller_identity || 'Unknown Caller' }}</p>
              <p class="item-meta">{{ item.call_status }} • Handled by {{ item.handled_by }}</p>
            </div>
            <div class="item-actions">
              <button v-if="item.queue_state === 'active'" @click="completeCall(item.id)" class="complete-btn">
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeQueue === 'voicemails'" class="queue-section">
        <h3>Voicemails Queue</h3>
        <p class="queue-description">Unattended call triage</p>
        <div v-if="voicemailsQueue.length === 0" class="empty-state">No voicemails</div>
        <div v-else class="queue-list">
          <div v-for="item in voicemailsQueue" :key="item.id" class="queue-item">
            <div class="item-header">
              <span class="item-icon">📨</span>
              <span :class="['item-state', item.queue_state]">{{ item.queue_state }}</span>
            </div>
            <div class="item-details">
              <p class="item-title">{{ item.caller_identity || item.voicemail_records?.caller_number }}</p>
              <p class="item-meta">{{ item.voicemail_records?.duration_seconds }}s • {{ formatTime(item.entered_queue_at) }}</p>
            </div>
            <div class="item-actions">
              <button v-if="item.queue_state === 'new'" @click="reviewVoicemail(item.id)" class="review-btn">
                Review
              </button>
              <button v-if="item.queue_state !== 'resolved'" @click="resolveVoicemail(item.id)" class="resolve-btn">
                Resolve
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeQueue === 'documents'" class="queue-section">
        <h3>Documents Queue</h3>
        <p class="queue-description">Work-in-progress and compliance checkpoint</p>
        <div v-if="documentsQueue.length === 0" class="empty-state">No pending documents</div>
        <div v-else class="queue-list">
          <div v-for="item in documentsQueue" :key="item.id" class="queue-item" :class="{ blocking: item.blocking_workflow }">
            <div class="item-header">
              <span class="item-icon">📄</span>
              <span :class="['item-state', item.queue_state]">{{ item.queue_state }}</span>
              <span v-if="item.blocking_workflow" class="blocking-badge">Blocking</span>
            </div>
            <div class="item-details">
              <p class="item-title">{{ item.workspace_documents?.document_name }}</p>
              <p class="item-meta">{{ item.document_purpose || 'General' }} • {{ formatTime(item.entered_queue_at) }}</p>
            </div>
            <div class="item-actions">
              <button @click="openDocument(item.document_id)" class="open-btn">Open</button>
              <button v-if="item.queue_state === 'draft'" @click="readyToFinalize(item.id)" class="finalize-btn">
                Ready to Finalize
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeQueue === 'billing'" class="queue-section">
        <h3>Billing Queue</h3>
        <p class="queue-description">Primary billing execution queue</p>
        <div v-if="billingQueue.length === 0" class="empty-state">No billing items</div>
        <div v-else class="queue-list">
          <div v-for="item in billingQueue" :key="item.id" class="queue-item">
            <div class="item-header">
              <span class="item-icon">💼</span>
              <span :class="['item-state', item.queue_state]">{{ item.queue_state }}</span>
            </div>
            <div class="item-details">
              <p class="item-title">{{ item.billing_reference }}</p>
              <p class="item-meta">{{ item.billing_type }} • {{ item.next_action }}</p>
              <p v-if="item.action_deadline" class="item-deadline">Due: {{ formatDate(item.action_deadline) }}</p>
            </div>
            <div class="item-actions">
              <button v-if="item.queue_state === 'ready'" @click="startBilling(item.id)" class="start-btn">
                Start
              </button>
              <button v-if="item.queue_state !== 'resolved'" @click="resolveBilling(item.id)" class="resolve-btn">
                Resolve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  getCallsQueue,
  completeCallsQueueItem,
  getVoicemailsQueue,
  updateVoicemailsQueueItem,
  getDocumentsQueue,
  updateDocumentsQueueItem,
  getBillingQueue,
  updateBillingQueueItem,
  getQueueCounts
} = useQueues()

const activeQueue = ref('billing')
const callsQueue = ref<any[]>([])
const voicemailsQueue = ref<any[]>([])
const documentsQueue = ref<any[]>([])
const billingQueue = ref<any[]>([])

const queueCounts = ref({
  activeCalls: 0,
  newVoicemails: 0,
  blockingDocuments: 0,
  actionRequiredBilling: 0
})

const queues = computed(() => [
  { id: 'calls', name: 'Calls', icon: '📞', count: queueCounts.value.activeCalls },
  { id: 'voicemails', name: 'Voicemails', icon: '📨', count: queueCounts.value.newVoicemails },
  { id: 'documents', name: 'Documents', icon: '📄', count: queueCounts.value.blockingDocuments },
  { id: 'billing', name: 'Billing', icon: '💼', count: queueCounts.value.actionRequiredBilling }
])

const formatTime = (timestamp: string) => {
  const d = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return d.toLocaleDateString()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const loadQueues = async () => {
  callsQueue.value = await getCallsQueue()
  voicemailsQueue.value = await getVoicemailsQueue()
  documentsQueue.value = await getDocumentsQueue()
  billingQueue.value = await getBillingQueue()
  queueCounts.value = await getQueueCounts()
}

const completeCall = async (queueId: string) => {
  await completeCallsQueueItem(queueId)
  await loadQueues()
}

const reviewVoicemail = async (queueId: string) => {
  await updateVoicemailsQueueItem(queueId, 'reviewed')
  await loadQueues()
}

const resolveVoicemail = async (queueId: string) => {
  await updateVoicemailsQueueItem(queueId, 'resolved')
  await loadQueues()
}

const openDocument = (documentId: string) => {
  console.log('Open document:', documentId)
}

const readyToFinalize = async (queueId: string) => {
  await updateDocumentsQueueItem(queueId, 'ready_to_finalize')
  await loadQueues()
}

const startBilling = async (queueId: string) => {
  await updateBillingQueueItem(queueId, 'in_progress')
  await loadQueues()
}

const resolveBilling = async (queueId: string) => {
  await updateBillingQueueItem(queueId, 'resolved')
  await loadQueues()
}

onMounted(() => {
  loadQueues()

  setInterval(() => {
    loadQueues()
  }, 30000)
})
</script>

<style scoped>
.queue-management {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.queue-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.queue-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.queue-tab:hover {
  background: white;
}

.queue-tab.active {
  background: white;
  border-bottom-color: #3b82f6;
}

.queue-icon {
  font-size: 20px;
}

.queue-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.queue-badge {
  padding: 2px 8px;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.queue-content {
  padding: 24px;
}

.queue-section h3 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.queue-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.empty-state {
  padding: 60px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-item {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.queue-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.queue-item.blocking {
  border-color: #f59e0b;
  background: #fffbeb;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-direction,
.item-icon {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.item-state {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.item-state.active,
.item-state.new,
.item-state.ready {
  background: #dbeafe;
  color: #1e40af;
}

.item-state.completed,
.item-state.resolved {
  background: #d1fae5;
  color: #065f46;
}

.item-state.action_required {
  background: #fef3c7;
  color: #92400e;
}

.blocking-badge {
  padding: 2px 8px;
  background: #fed7aa;
  color: #9a3412;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.item-details {
  margin-bottom: 12px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.item-meta {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.item-deadline {
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
  margin: 4px 0 0 0;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.complete-btn,
.review-btn,
.resolve-btn,
.open-btn,
.finalize-btn,
.start-btn {
  padding: 6px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.complete-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.review-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.resolve-btn {
  background: #059669;
  color: white;
  border-color: #059669;
}

.open-btn {
  background: white;
}

.finalize-btn {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.start-btn {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}
</style>
