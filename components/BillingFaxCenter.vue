<template>
  <div class="fax-center">
    <div class="fax-header">
      <h3>Billing Fax</h3>
      <button @click="showSend = true" class="send-btn">Send Fax</button>
    </div>

    <div v-if="loading" class="loading">Loading faxes...</div>

    <div v-else-if="faxes.length === 0" class="empty-state">
      No faxes found
    </div>

    <div v-else class="fax-list">
      <div
        v-for="fax in faxes"
        :key="fax.id"
        class="fax-item"
        @click="selectFax(fax)"
      >
        <div class="fax-header-item">
          <span class="fax-direction" :class="fax.direction">
            {{ fax.direction === 'inbound' ? '📥' : '📤' }}
          </span>
          <span class="fax-number">{{ fax.fax_number }}</span>
          <span :class="['fax-status', fax.status]">{{ fax.status }}</span>
        </div>
        <div class="fax-details">
          <span class="fax-purpose">{{ fax.purpose || 'General' }}</span>
          <span class="fax-pages">{{ fax.page_count }} {{ fax.page_count === 1 ? 'page' : 'pages' }}</span>
          <span class="fax-date">{{ formatDate(fax.created_at) }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedFax" class="fax-viewer">
      <div class="viewer-content">
        <div class="viewer-header">
          <h4>Fax Details</h4>
          <button @click="selectedFax = null" class="close-btn">×</button>
        </div>
        <div class="fax-info">
          <div class="info-row">
            <span class="label">Number:</span>
            <span>{{ selectedFax.fax_number }}</span>
          </div>
          <div class="info-row">
            <span class="label">Direction:</span>
            <span>{{ selectedFax.direction }}</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span>{{ selectedFax.status }}</span>
          </div>
          <div class="info-row">
            <span class="label">Pages:</span>
            <span>{{ selectedFax.page_count }}</span>
          </div>
          <div class="info-row">
            <span class="label">Purpose:</span>
            <span>{{ selectedFax.purpose || 'General' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span>{{ formatDateTime(selectedFax.created_at) }}</span>
          </div>
        </div>
        <div v-if="selectedFax.ocr_text" class="fax-ocr">
          <h5>Extracted Text (OCR)</h5>
          <pre>{{ selectedFax.ocr_text }}</pre>
        </div>
        <div class="fax-actions">
          <button v-if="selectedFax.pdf_url" class="action-btn">View PDF</button>
          <button v-if="selectedFax.fax_image_url" class="action-btn">View Original</button>
        </div>
      </div>
    </div>

    <div v-if="showSend" class="send-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Send Fax</h4>
          <button @click="closeSend" class="close-btn">×</button>
        </div>
        <div class="send-form">
          <div class="form-field">
            <label>Fax Number:</label>
            <input v-model="faxData.faxNumber" type="tel" placeholder="+1 (555) 123-4567" />
          </div>
          <div class="form-field">
            <label>Purpose:</label>
            <select v-model="faxData.purpose">
              <option value="eob">EOB</option>
              <option value="prior_auth">Prior Authorization</option>
              <option value="claim_submission">Claim Submission</option>
              <option value="payer_correspondence">Payer Correspondence</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-field">
            <label>PDF Document:</label>
            <input type="file" accept=".pdf" @change="handleFileSelect" />
          </div>
          <div class="form-actions">
            <button @click="closeSend" class="cancel-btn">Cancel</button>
            <button @click="sendFaxMessage" class="send-btn-submit">Send Fax</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getFaxes, sendFax } = useBillingWorkspace()

const faxes = ref<any[]>([])
const selectedFax = ref<any>(null)
const showSend = ref(false)
const loading = ref(true)

const faxData = ref({
  faxNumber: '',
  purpose: 'claim_submission',
  pdfFile: null as File | null
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US')
}

const loadFaxes = async () => {
  loading.value = true
  faxes.value = await getFaxes()
  loading.value = false
}

const selectFax = (fax: any) => {
  selectedFax.value = fax
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    faxData.value.pdfFile = target.files[0]
  }
}

const sendFaxMessage = async () => {
  if (!faxData.value.pdfFile) {
    alert('Please select a PDF file')
    return
  }

  await sendFax({
    faxNumber: faxData.value.faxNumber,
    pdfUrl: 'uploaded-pdf-url',
    purpose: faxData.value.purpose
  })

  closeSend()
  await loadFaxes()
}

const closeSend = () => {
  showSend.value = false
  faxData.value = {
    faxNumber: '',
    purpose: 'claim_submission',
    pdfFile: null
  }
}

onMounted(() => {
  loadFaxes()
})
</script>

<style scoped>
.fax-center {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.fax-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.fax-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.send-btn {
  padding: 8px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
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

.fax-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fax-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.fax-item:hover {
  border-color: #8b5cf6;
  background: #f9fafb;
}

.fax-header-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.fax-direction {
  font-size: 18px;
}

.fax-number {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.fax-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.fax-status.sent {
  background: #d1fae5;
  color: #065f46;
}

.fax-status.sending {
  background: #dbeafe;
  color: #1e40af;
}

.fax-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.fax-viewer,
.send-modal {
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

.viewer-content {
  background: white;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
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

.fax-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
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

.fax-ocr {
  margin-bottom: 16px;
}

.fax-ocr h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.fax-ocr pre {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
}

.fax-actions {
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

.send-form {
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
.send-btn-submit {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: white;
}

.send-btn-submit {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}
</style>
