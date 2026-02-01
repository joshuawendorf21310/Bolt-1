<template>
  <div class="billing-workspace">
    <div class="workspace-header">
      <div class="header-content">
        <h1>Founder Billing Workspace</h1>
        <p class="workspace-subtitle">Private billing command center for communications and documents</p>
      </div>
      <div class="workspace-stats">
        <div class="stat-box">
          <span class="stat-value">{{ dashboard.unreadEmails }}</span>
          <span class="stat-label">Unread Emails</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">{{ dashboard.escalatedCalls }}</span>
          <span class="stat-label">Escalated Calls</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">{{ dashboard.pendingFaxes }}</span>
          <span class="stat-label">Pending Faxes</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">{{ dashboard.draftDocuments }}</span>
          <span class="stat-label">Draft Documents</span>
        </div>
      </div>
    </div>

    <div class="workspace-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-name">{{ tab.name }}</span>
        <span v-if="tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <SystemFailoverStatus />
    <PhoneSystem />

    <div class="workspace-content">
      <div v-show="activeTab === 'overview'" class="tab-content">
        <div class="overview-section">
          <h2>Workspace Overview</h2>
          <div class="overview-grid">
            <div class="overview-card">
              <div class="card-icon">📧</div>
              <div class="card-content">
                <h3>Email Communications</h3>
                <p>{{ dashboard.totalEmails }} total emails</p>
                <p>{{ dashboard.unreadEmails }} unread</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">📞</div>
              <div class="card-content">
                <h3>AI Phone Calls</h3>
                <p>{{ dashboard.totalCalls }} total calls</p>
                <p>{{ dashboard.pendingCalls }} pending review</p>
                <p>{{ dashboard.escalatedCalls }} escalated</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">📠</div>
              <div class="card-content">
                <h3>Fax Communications</h3>
                <p>{{ dashboard.totalFaxes }} total faxes</p>
                <p>{{ dashboard.pendingFaxes }} pending</p>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">📄</div>
              <div class="card-content">
                <h3>Documents</h3>
                <p>{{ dashboard.totalDocuments }} total documents</p>
                <p>{{ dashboard.draftDocuments }} drafts</p>
              </div>
            </div>
          </div>

          <div class="recent-activity">
            <h3>Recent Activity</h3>
            <div v-if="activityLog.length === 0" class="no-activity">
              No recent activity
            </div>
            <div v-else class="activity-list">
              <div v-for="activity in activityLog" :key="activity.id" class="activity-item">
                <span class="activity-icon">{{ getActivityIcon(activity.activity_type) }}</span>
                <div class="activity-details">
                  <span class="activity-description">{{ activity.activity_description }}</span>
                  <span class="activity-time">{{ formatDateTime(activity.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="workspace-info">
            <h3>About This Workspace</h3>
            <div class="info-content">
              <p>This is a private, founder-only workspace for billing operations.</p>
              <ul>
                <li><strong>Email:</strong> Internal billing communications via Malibu</li>
                <li><strong>AI Phone:</strong> Human-quality voice assistant for insurance calls</li>
                <li><strong>Fax:</strong> Compliance and legacy payer requirements</li>
                <li><strong>Documents:</strong> Cloud-based office suite with version control</li>
              </ul>
              <p class="security-note">🔒 All content is encrypted, audited, and immutable when finalized</p>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'email'" class="tab-content">
        <BillingEmailCenter />
      </div>

      <div v-show="activeTab === 'phone'" class="tab-content">
        <AIPhoneAssistant />
      </div>

      <div v-show="activeTab === 'fax'" class="tab-content">
        <BillingFaxCenter />
      </div>

      <div v-show="activeTab === 'documents'" class="tab-content">
        <DocumentWorkspace />
      </div>

      <div v-show="activeTab === 'queues'" class="tab-content">
        <QueueManagement />
      </div>

      <div v-show="activeTab === 'builders'" class="tab-content">
        <WorkspaceBuilders />
      </div>

      <div v-show="activeTab === 'sla'" class="tab-content">
        <div class="sla-dashboard">
          <h2>SLA Timers & Priority Scoring</h2>
          <p class="subtitle">Real-time SLA tracking across all queues with priority escalation</p>
          <div class="sla-info">
            <p>SLA timers and priority scores are automatically calculated and updated in real-time.</p>
            <p>Each queue item has a target response time, soft breach threshold, and hard breach threshold.</p>
            <p>Hard SLA breaches require immediate acknowledgment and appear at the top of all queues.</p>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'facesheet'" class="tab-content">
        <AIFaceSheetReviewer />
      </div>

      <div v-show="activeTab === 'approval'" class="tab-content">
        <div class="approval-dashboard">
          <h2>One-Click Approvals</h2>
          <p class="subtitle">Review and approve AI decisions with minimal friction</p>
          <div class="approval-info">
            <p>Confidence scoring determines approval workflow:</p>
            <ul>
              <li><strong>High (90-100%):</strong> Auto-approved, no action needed</li>
              <li><strong>Medium (70-89%):</strong> One-click approval with uncertainty highlighted</li>
              <li><strong>Low (&lt;70%):</strong> Blocked for AI recovery or human correction</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'eod'" class="tab-content">
        <EndOfDayReconciliation />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { getWorkspaceDashboard, getActivityLog } = useBillingWorkspace()

const activeTab = ref('overview')
const dashboard = ref({
  totalEmails: 0,
  unreadEmails: 0,
  totalCalls: 0,
  pendingCalls: 0,
  escalatedCalls: 0,
  totalFaxes: 0,
  pendingFaxes: 0,
  totalDocuments: 0,
  draftDocuments: 0
})

const activityLog = ref<any[]>([])

const tabs = computed(() => [
  { id: 'overview', name: 'Overview', icon: '🏠', badge: 0 },
  { id: 'sla', name: 'SLA & Priority', icon: '⏱️', badge: 0 },
  { id: 'facesheet', name: 'Face Sheets', icon: '👤', badge: 0 },
  { id: 'approval', name: 'Approvals', icon: '✓', badge: 0 },
  { id: 'queues', name: 'Queues', icon: '📋', badge: 0 },
  { id: 'eod', name: 'End of Day', icon: '🌙', badge: 0 },
  { id: 'email', name: 'Email', icon: '📧', badge: dashboard.value.unreadEmails },
  { id: 'phone', name: 'Phone', icon: '📞', badge: dashboard.value.escalatedCalls },
  { id: 'fax', name: 'Fax', icon: '📠', badge: dashboard.value.pendingFaxes },
  { id: 'documents', name: 'Documents', icon: '📄', badge: 0 },
  { id: 'builders', name: 'Builders', icon: '🔨', badge: 0 }
])

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    email_sent: '📧',
    email_received: '📨',
    call_made: '📞',
    fax_sent: '📠',
    document_created: '📄',
    document_edited: '✏️',
    document_finalized: '🔒'
  }
  return icons[type] || '📋'
}

const formatDateTime = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
  dashboard.value = await getWorkspaceDashboard()
  activityLog.value = await getActivityLog(10)
})
</script>

<style scoped>
.billing-workspace {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px;
}

.workspace-header {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 24px;
}

.header-content {
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.workspace-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.workspace-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.workspace-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tab-icon {
  font-size: 18px;
}

.tab-badge {
  padding: 2px 6px;
  background: #dc2626;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.tab-button.active .tab-badge {
  background: white;
  color: #3b82f6;
}

.workspace-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.tab-content {
  padding: 24px;
}

.overview-section h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.overview-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-icon {
  font-size: 48px;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.card-content p {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.recent-activity {
  margin-bottom: 32px;
}

.recent-activity h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.no-activity {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.activity-icon {
  font-size: 24px;
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-description {
  font-size: 14px;
  color: #111827;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.workspace-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 24px;
}

.workspace-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.info-content p {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.6;
}

.info-content ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.info-content li {
  margin-bottom: 8px;
  color: #374151;
  line-height: 1.6;
}

.info-content strong {
  color: #111827;
  font-weight: 600;
}

.security-note {
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 13px;
  color: #78350f;
  margin: 0;
}
</style>
