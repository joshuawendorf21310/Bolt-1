<template>
  <div class="email-center">
    <div class="email-header">
      <h3>Billing Email (Malibu)</h3>
      <button @click="showCompose = true" class="compose-btn">Compose Email</button>
    </div>

    <div class="email-filters">
      <button
        v-for="status in ['all', 'sent', 'received', 'archived']"
        :key="status"
        @click="filterStatus = status === 'all' ? '' : status"
        :class="['filter-btn', { active: filterStatus === (status === 'all' ? '' : status) }]"
      >
        {{ status.charAt(0).toUpperCase() + status.slice(1) }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading emails...</div>

    <div v-else-if="emails.length === 0" class="empty-state">
      No emails found
    </div>

    <div v-else class="email-list">
      <div
        v-for="email in emails"
        :key="email.id"
        class="email-item"
        @click="selectEmail(email)"
        :class="{ selected: selectedEmail?.id === email.id }"
      >
        <div class="email-meta">
          <span class="email-direction" :class="email.direction">
            {{ email.direction === 'inbound' ? '←' : '→' }}
          </span>
          <span class="email-from">{{ email.from_address }}</span>
          <span class="email-date">{{ formatDate(email.created_at) }}</span>
        </div>
        <div class="email-subject">{{ email.subject || '(No Subject)' }}</div>
        <div v-if="email.tags && email.tags.length > 0" class="email-tags">
          <span v-for="tag in email.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedEmail" class="email-viewer">
      <div class="viewer-header">
        <h4>{{ selectedEmail.subject || '(No Subject)' }}</h4>
        <button @click="selectedEmail = null" class="close-btn">×</button>
      </div>
      <div class="email-details">
        <div class="detail-row">
          <span class="label">From:</span>
          <span>{{ selectedEmail.from_address }}</span>
        </div>
        <div class="detail-row">
          <span class="label">To:</span>
          <span>{{ selectedEmail.to_addresses.join(', ') }}</span>
        </div>
        <div v-if="selectedEmail.cc_addresses.length > 0" class="detail-row">
          <span class="label">CC:</span>
          <span>{{ selectedEmail.cc_addresses.join(', ') }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span>{{ formatDateTime(selectedEmail.created_at) }}</span>
        </div>
      </div>
      <div class="email-body" v-html="selectedEmail.body_html || selectedEmail.body_text"></div>
      <div class="email-notes">
        <h5>Internal Notes</h5>
        <textarea
          v-model="selectedEmail.internal_notes"
          @blur="saveNotes(selectedEmail.id, selectedEmail.internal_notes)"
          placeholder="Add internal notes..."
        ></textarea>
      </div>
      <div class="email-actions">
        <button @click="archiveEmail(selectedEmail.id)" class="action-btn">Archive</button>
        <button @click="replyToEmail(selectedEmail)" class="action-btn primary">Reply</button>
      </div>
    </div>

    <div v-if="showCompose" class="compose-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Compose Email</h4>
          <button @click="closeCompose" class="close-btn">×</button>
        </div>
        <div class="compose-form">
          <div class="form-field">
            <label>To:</label>
            <input v-model="composeData.to" type="email" placeholder="recipient@example.com" />
          </div>
          <div class="form-field">
            <label>CC:</label>
            <input v-model="composeData.cc" type="email" placeholder="cc@example.com (optional)" />
          </div>
          <div class="form-field">
            <label>Subject:</label>
            <input v-model="composeData.subject" type="text" placeholder="Email subject" />
          </div>
          <div class="form-field">
            <label>Message:</label>
            <textarea v-model="composeData.body" rows="10" placeholder="Email body..."></textarea>
          </div>
          <div class="form-actions">
            <button @click="closeCompose" class="cancel-btn">Cancel</button>
            <button @click="sendEmailMessage" class="send-btn">Send Email</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getEmailThreads, sendEmail, archiveEmail: archiveEmailAction, updateEmailNotes } = useBillingWorkspace()

const emails = ref<any[]>([])
const selectedEmail = ref<any>(null)
const showCompose = ref(false)
const filterStatus = ref('')
const loading = ref(true)

const composeData = ref({
  to: '',
  cc: '',
  subject: '',
  body: ''
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const loadEmails = async () => {
  loading.value = true
  const filters: any = {}
  if (filterStatus.value) {
    filters.status = filterStatus.value
  }
  emails.value = await getEmailThreads(filters)
  loading.value = false
}

const selectEmail = (email: any) => {
  selectedEmail.value = email
}

const saveNotes = async (emailId: string, notes: string) => {
  await updateEmailNotes(emailId, notes)
}

const archiveEmail = async (emailId: string) => {
  await archiveEmailAction(emailId)
  selectedEmail.value = null
  await loadEmails()
}

const replyToEmail = (email: any) => {
  composeData.value = {
    to: email.from_address,
    cc: '',
    subject: `Re: ${email.subject}`,
    body: ''
  }
  showCompose.value = true
}

const sendEmailMessage = async () => {
  const toAddresses = composeData.value.to.split(',').map(e => e.trim())
  const ccAddresses = composeData.value.cc ? composeData.value.cc.split(',').map(e => e.trim()) : []

  await sendEmail({
    subject: composeData.value.subject,
    toAddresses,
    ccAddresses,
    bodyText: composeData.value.body
  })

  closeCompose()
  await loadEmails()
}

const closeCompose = () => {
  showCompose.value = false
  composeData.value = {
    to: '',
    cc: '',
    subject: '',
    body: ''
  }
}

watch(filterStatus, () => {
  loadEmails()
})

onMounted(() => {
  loadEmails()
})
</script>

<style scoped>
.email-center {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.email-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.email-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.compose-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.compose-btn:hover {
  background: #2563eb;
}

.email-filters {
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
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
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

.email-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.email-item:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

.email-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.email-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.email-direction {
  font-weight: 600;
}

.email-direction.inbound {
  color: #10b981;
}

.email-direction.outbound {
  color: #3b82f6;
}

.email-from {
  flex: 1;
  font-weight: 500;
  color: #111827;
}

.email-subject {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.email-tags {
  display: flex;
  gap: 4px;
}

.tag {
  padding: 2px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 11px;
}

.email-viewer,
.compose-modal {
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

.email-viewer {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
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
  width: 28px;
  height: 28px;
}

.email-details {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}

.detail-row .label {
  font-weight: 600;
  color: #6b7280;
  min-width: 60px;
}

.email-body {
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.email-notes {
  margin-bottom: 16px;
}

.email-notes h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.email-notes textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
}

.email-actions {
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
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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

.compose-form {
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
.form-field textarea {
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
.send-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: white;
}

.send-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>
