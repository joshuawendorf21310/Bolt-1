<template>
  <div class="document-workspace">
    <div class="workspace-header">
      <h3>Document Workspace</h3>
      <button @click="showCreate = true" class="create-btn">New Document</button>
    </div>

    <div class="document-filters">
      <button
        v-for="type in ['all', 'word', 'excel', 'powerpoint', 'pdf']"
        :key="type"
        @click="filterType = type === 'all' ? '' : type"
        :class="['filter-btn', { active: filterType === (type === 'all' ? '' : type) }]"
      >
        {{ type.charAt(0).toUpperCase() + type.slice(1) }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading documents...</div>

    <div v-else-if="documents.length === 0" class="empty-state">
      No documents found
    </div>

    <div v-else class="document-grid">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="document-card"
        @click="selectDocument(doc)"
      >
        <div class="doc-icon">
          {{ getDocIcon(doc.document_type) }}
        </div>
        <div class="doc-info">
          <div class="doc-name">{{ doc.document_name }}</div>
          <div class="doc-meta">
            <span class="doc-type">{{ doc.document_type }}</span>
            <span class="doc-version">v{{ doc.current_version }}</span>
            <span v-if="doc.is_finalized" class="doc-finalized">🔒 Finalized</span>
          </div>
          <div class="doc-date">Updated {{ formatDate(doc.updated_at) }}</div>
        </div>
      </div>
    </div>

    <div v-if="selectedDocument" class="document-viewer">
      <div class="viewer-content">
        <div class="viewer-header">
          <h4>{{ selectedDocument.document_name }}</h4>
          <button @click="selectedDocument = null" class="close-btn">×</button>
        </div>
        <div class="doc-details">
          <div class="detail-row">
            <span class="label">Type:</span>
            <span>{{ selectedDocument.document_type }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Version:</span>
            <span>{{ selectedDocument.current_version }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span>{{ selectedDocument.is_finalized ? 'Finalized (Immutable)' : 'Draft (Editable)' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Created:</span>
            <span>{{ formatDateTime(selectedDocument.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Updated:</span>
            <span>{{ formatDateTime(selectedDocument.updated_at) }}</span>
          </div>
        </div>
        <div class="doc-editor">
          <div class="editor-placeholder">
            <p>Document editor interface</p>
            <p class="editor-note">Cloud-based editing with automatic version control</p>
          </div>
        </div>
        <div class="doc-actions">
          <button @click="viewVersions(selectedDocument.id)" class="action-btn">View Versions</button>
          <button v-if="!selectedDocument.is_finalized" @click="finalizeDoc(selectedDocument.id)" class="action-btn">
            Finalize Document
          </button>
          <button v-if="!selectedDocument.is_finalized" class="action-btn primary">Save Changes</button>
        </div>
      </div>
    </div>

    <div v-if="showCreate" class="create-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Create New Document</h4>
          <button @click="closeCreate" class="close-btn">×</button>
        </div>
        <div class="create-form">
          <div class="form-field">
            <label>Document Name:</label>
            <input v-model="createData.documentName" type="text" placeholder="My Document" />
          </div>
          <div class="form-field">
            <label>Document Type:</label>
            <select v-model="createData.documentType">
              <option value="word">Word Document</option>
              <option value="excel">Spreadsheet</option>
              <option value="powerpoint">Presentation</option>
              <option value="pdf">PDF</option>
              <option value="text">Text Document</option>
            </select>
          </div>
          <div class="form-field">
            <label>Organization:</label>
            <select v-model="createData.organizationType">
              <option value="general">General</option>
              <option value="agency">Agency</option>
              <option value="claim">Claim</option>
              <option value="billing_period">Billing Period</option>
            </select>
          </div>
          <div class="form-actions">
            <button @click="closeCreate" class="cancel-btn">Cancel</button>
            <button @click="createDoc" class="create-btn-submit">Create Document</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getDocuments, createDocument, finalizeDocument } = useBillingWorkspace()

const documents = ref<any[]>([])
const selectedDocument = ref<any>(null)
const showCreate = ref(false)
const filterType = ref('')
const loading = ref(true)

const createData = ref({
  documentName: '',
  documentType: 'word',
  organizationType: 'general'
})

const getDocIcon = (type: string) => {
  const icons: Record<string, string> = {
    word: '📝',
    excel: '📊',
    powerpoint: '📽️',
    pdf: '📄',
    text: '📃'
  }
  return icons[type] || '📄'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US')
}

const loadDocuments = async () => {
  loading.value = true
  const filters: any = {}
  if (filterType.value) {
    filters.documentType = filterType.value
  }
  documents.value = await getDocuments(filters)
  loading.value = false
}

const selectDocument = (doc: any) => {
  selectedDocument.value = doc
}

const finalizeDoc = async (docId: string) => {
  await finalizeDocument(docId)
  selectedDocument.value = null
  await loadDocuments()
}

const viewVersions = (docId: string) => {
  console.log('View versions for:', docId)
}

const createDoc = async () => {
  await createDocument({
    documentName: createData.value.documentName,
    documentType: createData.value.documentType as any,
    mimeType: 'application/octet-stream',
    storagePath: `/documents/${Date.now()}`,
    organizationType: createData.value.organizationType
  })
  closeCreate()
  await loadDocuments()
}

const closeCreate = () => {
  showCreate.value = false
  createData.value = {
    documentName: '',
    documentType: 'word',
    organizationType: 'general'
  }
}

watch(filterType, () => {
  loadDocuments()
})

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-workspace {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  min-height: 600px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.workspace-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.create-btn {
  padding: 8px 16px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.document-filters {
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
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.loading,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
  font-size: 14px;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.document-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.document-card:hover {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doc-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.doc-info {
  text-align: center;
}

.doc-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.doc-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 4px;
}

.doc-type {
  padding: 2px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
}

.doc-version {
  padding: 2px 6px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
}

.doc-finalized {
  padding: 2px 6px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
}

.doc-date {
  font-size: 12px;
  color: #6b7280;
}

.document-viewer,
.create-modal {
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
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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

.doc-details {
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
  min-width: 80px;
}

.doc-editor {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 400px;
  margin-bottom: 16px;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.editor-placeholder p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.editor-note {
  font-size: 13px;
}

.doc-actions {
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
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
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

.create-form {
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
.create-btn-submit {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: white;
}

.create-btn-submit {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}
</style>
