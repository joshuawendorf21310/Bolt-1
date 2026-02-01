<template>
  <div class="face-sheet-reviewer">
    <div class="reviewer-header">
      <h2>Face Sheet Review & Approval</h2>
      <p class="subtitle">{{ pendingFaceSheets.length }} pending face sheets requiring your attention</p>
    </div>

    <div v-if="pendingFaceSheets.length === 0" class="no-pending">
      <span class="check-icon">✅</span>
      <p>No face sheets pending review</p>
    </div>

    <div v-else class="face-sheets-list">
      <div
        v-for="fs in pendingFaceSheets"
        :key="fs.id"
        class="face-sheet-card"
        :class="{ expanded: expandedId === fs.id }"
      >
        <div class="card-header" @click="toggleExpand(fs.id)">
          <div class="patient-info">
            <div class="patient-name">{{ fs.patient_first_name }} {{ fs.patient_last_name }}</div>
            <div class="patient-dob">DOB: {{ formatDate(fs.patient_dob) }}</div>
          </div>

          <div class="confidence-section">
            <span :class="['confidence-score', getConfidenceClass(fs.overall_confidence_score)]">
              {{ fs.overall_confidence_score }}%
            </span>
            <span class="chevron">{{ expandedId === fs.id ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="expandedId === fs.id" class="card-expanded">
          <div class="field-grid">
            <div class="field-row">
              <label>Payer:</label>
              <span>{{ fs.primary_payer_name }}</span>
            </div>
            <div class="field-row">
              <label>Plan Type:</label>
              <span>{{ fs.plan_type }}</span>
            </div>
            <div class="field-row">
              <label>Member ID:</label>
              <span class="mono">{{ fs.member_id }}</span>
            </div>
            <div class="field-row">
              <label>Group Number:</label>
              <span class="mono">{{ fs.group_number || '—' }}</span>
            </div>
            <div v-if="fs.subscriber_name" class="field-row">
              <label>Subscriber:</label>
              <span>{{ fs.subscriber_name }}</span>
            </div>
            <div v-if="fs.subscriber_relationship" class="field-row">
              <label>Relationship:</label>
              <span>{{ fs.subscriber_relationship }}</span>
            </div>
          </div>

          <div v-if="fs.face_sheet_fields" class="field-confidence">
            <h4>Field Confidence Scores:</h4>
            <div
              v-for="field in fs.face_sheet_fields"
              :key="field.id"
              class="field-confidence-item"
              :class="{ uncertain: field.is_uncertain }"
            >
              <span class="field-name">{{ formatFieldName(field.field_name) }}</span>
              <span :class="['field-score', getConfidenceClass(field.field_confidence)]">
                {{ field.field_confidence }}%
              </span>
              <span v-if="field.is_uncertain" class="uncertain-badge">Uncertain</span>
            </div>
          </div>

          <div class="source-info">
            <h4>Source: {{ fs.source_type }}</h4>
            <p class="extraction-method">{{ fs.extraction_method }}</p>
          </div>

          <div class="card-actions">
            <button @click="approveFaceSheet(fs.id)" class="approve-btn">Approve</button>
            <button @click="requestCorrections(fs.id)" class="correct-btn">Request Corrections</button>
            <button @click="sendToAIRecovery(fs.id)" class="recovery-btn">Send to AI for Recovery</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="approvalsSummary.length > 0" class="approvals-summary">
      <h3>Recent Approvals</h3>
      <div class="approval-items">
        <div v-for="approval in approvalsSummary" :key="approval.id" class="approval-item">
          <span class="check-mark">✓</span>
          <span class="approval-text">{{ approval.patient_name }} approved by {{ approval.approved_by }}</span>
          <span class="approval-time">{{ formatTime(approval.approved_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { useFaceSheet } = useCurrentInstance()?.appContext?.config?.globalProperties || {}

const pendingFaceSheets = ref<any[]>([])
const approvalsSummary = ref<any[]>([])
const expandedId = ref<string | null>(null)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timestamp: string) => {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return then.toLocaleDateString()
}

const formatFieldName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getConfidenceClass = (score: number) => {
  if (score >= 90) return 'high'
  if (score >= 70) return 'medium'
  return 'low'
}

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const loadPendingFaceSheets = async () => {
  const { data, error } = await supabase
    .from('face_sheets')
    .select(`
      *,
      face_sheet_fields (*)
    `)
    .eq('is_approved', false)
    .order('overall_confidence_score', { ascending: true })
    .limit(10)

  if (error) {
    console.error('Error loading face sheets:', error)
    return
  }

  pendingFaceSheets.value = data || []
}

const loadRecentApprovals = async () => {
  const { data, error } = await supabase
    .from('face_sheets')
    .select('id, patient_first_name, patient_last_name, approved_by, approved_at')
    .eq('is_approved', true)
    .order('approved_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error loading approvals:', error)
    return
  }

  approvalsSummary.value = (data || []).map(fs => ({
    id: fs.id,
    patient_name: `${fs.patient_first_name} ${fs.patient_last_name}`,
    approved_by: fs.approved_by,
    approved_at: fs.approved_at
  }))
}

const approveFaceSheet = async (faceSheetId: string) => {
  const { error } = await supabase
    .from('face_sheets')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: 'founder'
    })
    .eq('id', faceSheetId)

  if (error) {
    console.error('Error approving face sheet:', error)
    return
  }

  await loadPendingFaceSheets()
  await loadRecentApprovals()
  expandedId.value = null
}

const requestCorrections = (faceSheetId: string) => {
  console.log('Request corrections for:', faceSheetId)
}

const sendToAIRecovery = (faceSheetId: string) => {
  console.log('Send to AI recovery:', faceSheetId)
}

onMounted(() => {
  loadPendingFaceSheets()
  loadRecentApprovals()

  setInterval(() => {
    loadPendingFaceSheets()
  }, 30000)
})
</script>

<style scoped>
.face-sheet-reviewer {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.reviewer-header {
  margin-bottom: 24px;
}

.reviewer-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.no-pending {
  text-align: center;
  padding: 60px;
  color: #6b7280;
}

.check-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.face-sheets-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.face-sheet-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.face-sheet-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background: #f9fafb;
  transition: background 0.2s;
}

.card-header:hover {
  background: #f3f4f6;
}

.patient-info {
  flex: 1;
}

.patient-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.patient-dob {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.confidence-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confidence-score {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.confidence-score.high {
  background: #d1fae5;
  color: #065f46;
}

.confidence-score.medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence-score.low {
  background: #fee2e2;
  color: #991b1b;
}

.chevron {
  color: #6b7280;
  font-size: 12px;
}

.card-expanded {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.field-row span {
  font-size: 14px;
  color: #111827;
}

.mono {
  font-family: 'Courier New', monospace;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.field-confidence {
  margin: 20px 0;
  padding: 16px;
  background: white;
  border-radius: 6px;
}

.field-confidence h4 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.field-confidence-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

.field-confidence-item.uncertain {
  background: #fffbeb;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.field-name {
  color: #374151;
  font-weight: 500;
}

.field-score {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.field-score.high {
  background: #d1fae5;
  color: #065f46;
}

.field-score.medium {
  background: #fef3c7;
  color: #92400e;
}

.field-score.low {
  background: #fee2e2;
  color: #991b1b;
}

.uncertain-badge {
  padding: 2px 8px;
  background: #f59e0b;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.source-info {
  margin: 20px 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.source-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 4px 0;
}

.extraction-method {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.approve-btn,
.correct-btn,
.recovery-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
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

.correct-btn {
  background: #3b82f6;
  color: white;
}

.correct-btn:hover {
  background: #2563eb;
}

.recovery-btn {
  background: #8b5cf6;
  color: white;
}

.recovery-btn:hover {
  background: #7c3aed;
}

.approvals-summary {
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
}

.approvals-summary h3 {
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 12px 0;
}

.approval-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.approval-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #065f46;
}

.check-mark {
  color: #10b981;
  font-weight: 700;
}

.approval-text {
  flex: 1;
}

.approval-time {
  color: #6b7280;
  font-size: 12px;
}
</style>
