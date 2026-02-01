<template>
  <div class="approval-container">
    <div class="approval-card">
      <div class="approval-header">
        <div class="confidence-indicator">
          <span :class="['confidence-badge', item.confidence_level]">
            {{ confidencePercent }}%
          </span>
          <span class="confidence-label">{{ item.confidence_level }} confidence</span>
        </div>
        <span v-if="item.approval_required" class="action-needed">Action needed</span>
      </div>

      <div class="approval-content">
        <h3>{{ decisionTypeLabel }}</h3>
        <p class="reasoning">{{ item.reasoning }}</p>

        <div v-if="item.uncertain_fields && item.uncertain_fields.length > 0" class="uncertain-section">
          <h4>What we're unsure about:</h4>
          <ul class="uncertain-list">
            <li v-for="(field, idx) in item.uncertain_fields" :key="idx">{{ field }}</li>
          </ul>
        </div>

        <div v-if="item.approved_value_final" class="current-values">
          <h4>Extracted values:</h4>
          <div class="value-list">
            <div v-for="(value, key) in item.approved_value_final" :key="key" class="value-item">
              <span class="value-label">{{ formatLabel(key) }}:</span>
              <span class="value-display">{{ value || '—' }}</span>
            </div>
          </div>
        </div>

        <div v-if="editingField" class="inline-editor">
          <label>{{ editingField }}:</label>
          <input
            v-model="editedValue"
            type="text"
            @keyup.enter="saveEdit"
            @keyup.escape="cancelEdit"
            placeholder="Enter corrected value"
            autofocus
          />
          <button @click="saveEdit" class="save-edit-btn">Save</button>
          <button @click="cancelEdit" class="cancel-edit-btn">Cancel</button>
        </div>
      </div>

      <div class="approval-actions">
        <button @click="approve" class="approve-btn">Approve as is</button>
        <button @click="showEditOptions" class="edit-btn">Correct a value</button>
        <button @click="sendBack" class="sendback-btn">Send back to AI</button>
      </div>
    </div>

    <div v-if="showEditMenu" class="edit-menu">
      <div class="edit-menu-header">
        <h4>Which field needs correction?</h4>
        <button @click="showEditMenu = false" class="close-btn">×</button>
      </div>
      <div class="edit-menu-options">
        <button
          v-for="field in Object.keys(item.approved_value_final || {})"
          :key="field"
          @click="startEdit(field)"
          class="edit-option"
        >
          {{ formatLabel(field) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  item: any
  decisionId: string
}>()

const emit = defineEmits<{
  approved: [id: string, changes: any]
  sendBackToAI: [id: string]
  fieldCorrected: [id: string, field: string, value: string]
}>()

const showEditMenu = ref(false)
const editingField = ref<string | null>(null)
const editedValue = ref('')

const confidencePercent = computed(() => Math.round(props.item.confidence_score || 0))

const decisionTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    face_sheet: 'Face Sheet Verification',
    eligibility: 'Eligibility Check',
    coding: 'Coding Suggestion',
    invoice: 'Invoice Review',
    appeal: 'Appeal Letter',
    document_classification: 'Document Classification',
    payer_mapping: 'Payer Mapping',
    mapping_suggestion: 'Clinical Mapping'
  }
  return labels[props.item.decision_type] || 'AI Decision'
})

const formatLabel = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const approve = async () => {
  emit('approved', props.decisionId, {})
}

const showEditOptions = () => {
  showEditMenu.value = true
}

const startEdit = (field: string) => {
  editingField.value = field
  editedValue.value = props.item.approved_value_final?.[field] || ''
  showEditMenu.value = false
}

const saveEdit = async () => {
  if (editingField.value) {
    emit('fieldCorrected', props.decisionId, editingField.value, editedValue.value)
    editingField.value = null
    editedValue.value = ''
  }
}

const cancelEdit = () => {
  editingField.value = null
  editedValue.value = ''
}

const sendBack = () => {
  emit('sendBackToAI', props.decisionId)
}
</script>

<style scoped>
.approval-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  max-width: 600px;
  width: 100%;
}

.approval-card {
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confidence-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.confidence-badge.high {
  background: #d1fae5;
  color: #065f46;
}

.confidence-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.confidence-label {
  font-size: 13px;
  color: #6b7280;
}

.action-needed {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.approval-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.approval-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
}

.reasoning {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.uncertain-section {
  margin: 16px 0;
  padding: 12px;
  background: #fffbeb;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.uncertain-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 8px 0;
}

.uncertain-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.uncertain-list li {
  font-size: 13px;
  color: #92400e;
  padding: 4px 0;
}

.current-values {
  margin: 16px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.current-values h4 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.value-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.value-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.value-label {
  color: #6b7280;
  font-weight: 500;
}

.value-display {
  color: #111827;
  font-family: 'Courier New', monospace;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.inline-editor {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 6px;
}

.inline-editor label {
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
}

.inline-editor input {
  padding: 8px;
  border: 1px solid #86efac;
  border-radius: 4px;
  font-size: 14px;
}

.inline-editor button {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.save-edit-btn {
  background: #10b981;
  color: white;
}

.cancel-edit-btn {
  background: #e5e7eb;
  color: #374151;
}

.approval-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.approve-btn,
.edit-btn,
.sendback-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.approve-btn:hover {
  background: #059669;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
}

.sendback-btn {
  background: #e5e7eb;
  color: #374151;
}

.sendback-btn:hover {
  background: #d1d5db;
}

.edit-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

.edit-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.edit-menu-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
}

.edit-menu-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 20px;
}

.edit-option {
  padding: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-option:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
</style>
