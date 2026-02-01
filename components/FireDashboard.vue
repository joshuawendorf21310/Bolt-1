<template>
  <div class="fire-dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Fire Operations Command</h1>
        <p class="subtitle">Real-time incident management & resource coordination</p>
      </div>
      <div class="header-actions">
        <button class="btn-new-incident" @click="openNewIncident">
          <span class="icon">+</span> New Incident
        </button>
        <button class="btn-alert" v-if="activeIncidents > 0">
          {{ activeIncidents }} Active
        </button>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- Left Panel: Live Incidents -->
      <section class="panel incidents-panel">
        <div class="panel-header">
          <h2>Live Incidents</h2>
          <div class="filter-tabs">
            <button :class="['tab', { active: filterStatus === 'all' }]" @click="filterStatus = 'all'">
              All
            </button>
            <button :class="['tab', { active: filterStatus === 'dispatched' }]" @click="filterStatus = 'dispatched'">
              Dispatching
            </button>
            <button :class="['tab', { active: filterStatus === 'on_scene' }]" @click="filterStatus = 'on_scene'">
              On Scene
            </button>
          </div>
        </div>

        <div class="incidents-list">
          <div v-for="incident in filteredIncidents" :key="incident.id" class="incident-card" :class="`severity-${incident.severity_level}`" @click="selectIncident(incident)">
            <div class="incident-header">
              <span class="dispatch-num">{{ incident.dispatch_number }}</span>
              <span class="incident-type">{{ formatIncidentType(incident.incident_type) }}</span>
            </div>
            <div class="incident-address">{{ incident.address }}</div>
            <div class="incident-meta">
              <span class="status" :class="incident.status">{{ incident.status }}</span>
              <span class="time">{{ formatTime(incident.dispatch_time) }}</span>
            </div>
            <div class="incident-stats">
              <span class="stat">Units: {{ incident.units_dispatched || 0 }}</span>
              <span class="stat" v-if="incident.injuries > 0">Injuries: {{ incident.injuries }}</span>
            </div>
          </div>

          <div v-if="filteredIncidents.length === 0" class="empty-state">
            <p>No incidents {{ filterStatus !== 'all' ? 'with status: ' + filterStatus : '' }}</p>
          </div>
        </div>
      </section>

      <!-- Middle Panel: Incident Details -->
      <section class="panel details-panel">
        <div v-if="selectedIncident" class="incident-details">
          <div class="details-header">
            <h2>{{ selectedIncident.dispatch_number }}</h2>
            <button class="btn-close" @click="selectedIncident = null">×</button>
          </div>

          <div class="details-content">
            <div class="detail-section">
              <h3>Incident Information</h3>
              <div class="detail-row">
                <label>Type:</label>
                <span>{{ formatIncidentType(selectedIncident.incident_type) }}</span>
              </div>
              <div class="detail-row">
                <label>Address:</label>
                <span>{{ selectedIncident.address }}</span>
              </div>
              <div class="detail-row">
                <label>Severity:</label>
                <span class="severity-badge" :class="`level-${selectedIncident.severity_level}`">
                  {{ severityLabels[selectedIncident.severity_level] || 'Unknown' }}
                </span>
              </div>
              <div class="detail-row">
                <label>Incident Commander:</label>
                <span>{{ getIncidentCommander(selectedIncident.incident_commander) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Response Status</h3>
              <div class="response-timeline">
                <div class="timeline-item" v-if="selectedIncident.dispatch_time">
                  <span class="time-label">Dispatched</span>
                  <span class="time-value">{{ formatTime(selectedIncident.dispatch_time) }}</span>
                </div>
                <div class="timeline-item" v-if="selectedIncident.arrival_time">
                  <span class="time-label">Arrived</span>
                  <span class="time-value">{{ formatTime(selectedIncident.arrival_time) }}</span>
                  <span class="response-time">{{ calculateResponseTime(selectedIncident) }}</span>
                </div>
                <div class="timeline-item" v-if="selectedIncident.clearance_time">
                  <span class="time-label">Cleared</span>
                  <span class="time-value">{{ formatTime(selectedIncident.clearance_time) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Assigned Units</h3>
              <div v-if="selectedIncident.units && selectedIncident.units.length > 0" class="units-list">
                <div v-for="unit in selectedIncident.units" :key="unit.id" class="unit-item">
                  <span class="unit-number">{{ unit.apparatus_name }}</span>
                  <span class="unit-status" :class="unit.status">{{ unit.status }}</span>
                </div>
              </div>
              <div v-else class="empty-units">No units assigned</div>
            </div>

            <div class="detail-section">
              <h3>Actions</h3>
              <div class="action-buttons">
                <button class="btn-secondary" @click="assignUnits">Assign Units</button>
                <button class="btn-secondary" @click="updateStatus">Update Status</button>
                <button class="btn-secondary" @click="addNotes">Add Notes</button>
                <button class="btn-danger" v-if="selectedIncident.status !== 'cleared'" @click="closeIncident">Close Incident</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-panel">
          <p>Select an incident to view details</p>
        </div>
      </section>

      <!-- Right Panel: Resource Status -->
      <section class="panel resources-panel">
        <div class="panel-header">
          <h2>Resources</h2>
          <button class="btn-refresh" @click="refreshResources">↻</button>
        </div>

        <div class="resource-section">
          <h3>Apparatus Status</h3>
          <div class="status-grid">
            <div class="status-card available">
              <span class="count">{{ apparatusStats.available }}</span>
              <span class="label">Available</span>
            </div>
            <div class="status-card in-service">
              <span class="count">{{ apparatusStats.in_service }}</span>
              <span class="label">In Service</span>
            </div>
            <div class="status-card maintenance">
              <span class="count">{{ apparatusStats.maintenance }}</span>
              <span class="label">Maintenance</span>
            </div>
            <div class="status-card out-of-service">
              <span class="count">{{ apparatusStats.out_of_service }}</span>
              <span class="label">Out of Service</span>
            </div>
          </div>
        </div>

        <div class="resource-section">
          <h3>Personnel On Duty</h3>
          <div class="personnel-list">
            <div v-for="person in onDutyPersonnel" :key="person.id" class="personnel-item">
              <span class="name">{{ person.first_name }} {{ person.last_name }}</span>
              <span class="rank">{{ person.rank }}</span>
              <span v-if="person.is_incident_commander" class="badge">IC</span>
            </div>
          </div>
        </div>

        <div class="resource-section">
          <h3>Station Status</h3>
          <div class="stations-list">
            <div v-for="station in stationStatuses" :key="station.id" class="station-item">
              <span class="station-name">{{ station.name }}</span>
              <span class="station-status" :class="{ active: station.is_active }">
                {{ station.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <div class="resource-section">
          <h3>System Health</h3>
          <div class="health-check">
            <div class="health-item">
              <span>Database</span>
              <span class="indicator online">●</span>
            </div>
            <div class="health-item">
              <span>Dispatch System</span>
              <span class="indicator online">●</span>
            </div>
            <div class="health-item">
              <span>GPS Tracking</span>
              <span class="indicator online">●</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFireOperations } from '~/composables/useFireOperations'

const {
  incidents,
  apparatus,
  personnel,
  stations,
  getIncidentById,
  updateIncidentStatus
} = useFireOperations()

const selectedIncident = ref(null)
const filterStatus = ref('all')

const severityLabels = {
  1: 'Minor',
  2: 'Moderate',
  3: 'Major',
  4: 'Critical',
  5: 'Catastrophic'
}

const activeIncidents = computed(() => {
  return incidents.value?.filter(i => i.status !== 'cleared').length || 0
})

const filteredIncidents = computed(() => {
  if (filterStatus.value === 'all') return incidents.value || []
  return incidents.value?.filter(i => i.status === filterStatus.value) || []
})

const apparatusStats = computed(() => {
  const stats = {
    available: 0,
    in_service: 0,
    maintenance: 0,
    out_of_service: 0
  }
  apparatus.value?.forEach(app => {
    if (app.current_status in stats) {
      stats[app.current_status]++
    }
  })
  return stats
})

const onDutyPersonnel = computed(() => {
  return personnel.value?.filter(p => p.is_active).slice(0, 8) || []
})

const stationStatuses = computed(() => {
  return stations.value || []
})

function selectIncident(incident) {
  selectedIncident.value = incident
}

function formatIncidentType(type) {
  return type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleTimeString()
}

function getIncidentCommander(id) {
  if (!id) return 'Unassigned'
  const person = personnel.value?.find(p => p.id === id)
  return person ? `${person.first_name} ${person.last_name}` : 'Unknown'
}

function calculateResponseTime(incident) {
  if (!incident.dispatch_time || !incident.arrival_time) return ''
  const diff = new Date(incident.arrival_time) - new Date(incident.dispatch_time)
  const minutes = Math.floor(diff / 60000)
  return `${minutes} min`
}

function openNewIncident() {
  console.log('Open new incident modal')
}

function assignUnits() {
  console.log('Assign units modal')
}

function updateStatus() {
  console.log('Update status modal')
}

function addNotes() {
  console.log('Add notes modal')
}

function closeIncident() {
  if (selectedIncident.value) {
    updateIncidentStatus(selectedIncident.value.id, 'cleared')
  }
}

function refreshResources() {
  console.log('Refreshing resources...')
}

onMounted(() => {
  // Initial load
})
</script>

<style scoped>
.fire-dashboard {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  color: #e2e8f0;
}

.dashboard-header {
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 2px solid #3b82f6;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-new-incident {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-new-incident:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
}

.btn-alert {
  background: rgba(249, 115, 22, 0.2);
  border: 1px solid #f97316;
  color: #fb923c;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  height: calc(100vh - 130px);
}

.panel {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.incidents-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.incident-card {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.incident-card:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.3);
}

.incident-card.severity-1 { border-left-color: #10b981; }
.incident-card.severity-2 { border-left-color: #f59e0b; }
.incident-card.severity-3 { border-left-color: #ef4444; }
.incident-card.severity-4 { border-left-color: #dc2626; }
.incident-card.severity-5 { border-left-color: #7c2d12; }

.incident-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.dispatch-num {
  font-weight: 700;
  color: #60a5fa;
  font-family: monospace;
}

.incident-type {
  font-size: 0.75rem;
  background: rgba(59, 130, 246, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  color: #93c5fd;
}

.incident-address {
  font-size: 0.875rem;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.incident-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.status {
  background: rgba(59, 130, 246, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
}

.incident-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.details-panel {
  background: rgba(30, 41, 59, 0.7);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.details-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.details-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  font-size: 0.9rem;
}

.detail-row label {
  color: #94a3b8;
  font-weight: 500;
}

.severity-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.severity-badge.level-1 { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
.severity-badge.level-2 { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.severity-badge.level-3 { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.severity-badge.level-4 { background: rgba(220, 38, 38, 0.2); color: #fca5a5; }
.severity-badge.level-5 { background: rgba(124, 45, 18, 0.2); color: #fdba74; }

.response-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 0.375rem;
  border-left: 3px solid #3b82f6;
}

.time-label {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 80px;
}

.time-value {
  color: #e2e8f0;
  font-weight: 600;
  font-family: monospace;
}

.response-time {
  color: #60a5fa;
  font-size: 0.85rem;
  margin-left: auto;
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unit-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 0.375rem;
  font-size: 0.9rem;
}

.unit-number {
  font-weight: 600;
  color: #cbd5e1;
}

.unit-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-secondary {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #3b82f6;
  color: white;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  grid-column: 1 / -1;
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #64748b;
  font-style: italic;
}

.empty-units {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
  font-size: 0.9rem;
}

.resources-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.btn-refresh {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.resource-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.resource-section:last-child {
  border-bottom: none;
}

.resource-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.status-card {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-card.available {
  border-left: 3px solid #10b981;
}

.status-card.in-service {
  border-left: 3px solid #3b82f6;
}

.status-card.maintenance {
  border-left: 3px solid #f59e0b;
}

.status-card.out-of-service {
  border-left: 3px solid #ef4444;
}

.count {
  font-size: 1.75rem;
  font-weight: 700;
  color: #60a5fa;
}

.label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.personnel-list,
.stations-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.personnel-item,
.station-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.name {
  color: #cbd5e1;
  font-weight: 500;
}

.rank {
  color: #94a3b8;
  font-size: 0.8rem;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.station-name {
  color: #cbd5e1;
  font-weight: 500;
}

.station-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.station-status.active {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

.health-check {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.indicator {
  font-size: 1.5rem;
  line-height: 1;
}

.indicator.online {
  color: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1.5fr;
  }

  .resources-panel {
    display: none;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .incidents-list {
    max-height: 200px;
  }
}
</style>
