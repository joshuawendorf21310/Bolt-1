<template>
  <div class="incident-command" v-if="incident">
    <div class="command-header">
      <div class="header-info">
        <h2>{{ incident.dispatch_number }}</h2>
        <p class="command-type">{{ formatType(incident.incident_type) }}</p>
      </div>
      <div class="severity-display" :class="`level-${incident.severity_level}`">
        <span class="label">Severity</span>
        <span class="value">{{ severityLabels[incident.severity_level] }}</span>
      </div>
      <div class="status-display" :class="incident.status">
        <span>{{ incident.status }}</span>
      </div>
    </div>

    <div class="command-grid">
      <!-- Incident Details -->
      <section class="command-section location-section">
        <h3>Location & Details</h3>
        <div class="map-placeholder">
          <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" fill="rgba(51, 65, 85, 0.3)"/>
            <circle cx="150" cy="100" r="8" fill="#ef4444"/>
            <text x="150" y="180" text-anchor="middle" fill="#94a3b8" font-size="12">
              {{ incident.address }}
            </text>
          </svg>
        </div>
        <div class="detail-info">
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value">{{ incident.address }}</span>
          </div>
          <div class="info-row">
            <span class="label">Coordinates:</span>
            <span class="value">{{ incident.latitude }}, {{ incident.longitude }}</span>
          </div>
          <div v-if="incident.description" class="info-row">
            <span class="label">Description:</span>
            <span class="value">{{ incident.description }}</span>
          </div>
          <div v-if="incident.hazmat_involved" class="hazmat-alert">
            <span class="icon">⚠</span> HAZMAT INVOLVED
          </div>
        </div>
      </section>

      <!-- Units & Personnel -->
      <section class="command-section units-section">
        <h3>Assigned Units & Personnel</h3>
        <div class="units-command">
          <div v-for="unit in incident.incident_units" :key="unit.id" class="unit-card">
            <div class="unit-header">
              <span class="unit-name">{{ getApparatusName(unit.apparatus_id) }}</span>
              <span class="unit-status" :class="unit.status">{{ unit.status }}</span>
            </div>
            <div class="unit-crew">
              <span v-if="unit.crew_lead" class="crew-item">Lead: {{ getPersonnelName(unit.crew_lead) }}</span>
              <span class="crew-item">Count: {{ unit.personnel_count }}</span>
              <span class="crew-item time">{{ formatDispatchTime(unit.dispatch_time) }}</span>
            </div>
            <div class="unit-actions">
              <button class="btn-mini" @click="updateUnitStatus(unit.id, 'en_route')">En Route</button>
              <button class="btn-mini" @click="updateUnitStatus(unit.id, 'on_scene')">On Scene</button>
              <button class="btn-mini" @click="updateUnitStatus(unit.id, 'operating')">Operating</button>
            </div>
          </div>

          <div v-if="incident.incident_units?.length === 0" class="empty-units">
            <p>No units assigned</p>
            <button class="btn-secondary" @click="showAssignUnits = true">Assign Units</button>
          </div>
        </div>
      </section>

      <!-- Timeline -->
      <section class="command-section timeline-section">
        <h3>Response Timeline</h3>
        <div class="timeline">
          <div class="timeline-event dispatched">
            <span class="time">{{ formatTime(incident.dispatch_time) }}</span>
            <span class="event">Dispatched</span>
          </div>
          <div v-if="incident.arrival_time" class="timeline-event arrived">
            <span class="time">{{ formatTime(incident.arrival_time) }}</span>
            <span class="event">Arrived ({{ calculateResponseTime(incident) }})</span>
          </div>
          <div v-if="incident.clearance_time" class="timeline-event cleared">
            <span class="time">{{ formatTime(incident.clearance_time) }}</span>
            <span class="event">Cleared ({{ calculateDuration(incident) }})</span>
          </div>
          <div v-if="!incident.clearance_time" class="timeline-event active">
            <span class="time">ACTIVE</span>
            <span class="event">{{ calculateElapsedTime(incident) }}</span>
          </div>
        </div>
      </section>

      <!-- Statistics -->
      <section class="command-section stats-section">
        <h3>Incident Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-number">{{ incident.units_dispatched || 0 }}</span>
            <span class="stat-label">Units Dispatched</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ incident.injuries }}</span>
            <span class="stat-label">Injuries</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ incident.fatalities }}</span>
            <span class="stat-label">Fatalities</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ incident.incident_personnel?.length || 0 }}</span>
            <span class="stat-label">Personnel</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="command-section actions-section">
        <h3>Incident Actions</h3>
        <div class="action-buttons">
          <button class="btn-action" @click="showAssignUnits = !showAssignUnits">
            <span class="icon">+</span> Assign Units
          </button>
          <button class="btn-action" @click="showNotes = !showNotes">
            <span class="icon">📝</span> Add Notes
          </button>
          <button class="btn-action" @click="updateIncidentStatus('resolved')">
            <span class="icon">✓</span> Mark Resolved
          </button>
          <button class="btn-action danger" @click="updateIncidentStatus('cleared')">
            <span class="icon">×</span> Clear Incident
          </button>
        </div>
      </section>
    </div>

    <!-- Notes Section -->
    <div v-if="showNotes" class="notes-section">
      <h3>Incident Notes</h3>
      <textarea
        v-model="incidentNotes"
        placeholder="Add notes about this incident..."
        class="notes-input"
      ></textarea>
      <div class="notes-actions">
        <button class="btn-secondary" @click="saveNotes">Save Notes</button>
        <button class="btn-text" @click="showNotes = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFireOperations } from '~/composables/useFireOperations'

const props = defineProps<{
  incident: any
}>()

const emit = defineEmits<{
  update: [status: string]
  unitsAssigned: [units: any[]]
}>()

const { apparatus, personnel, updateIncidentStatus } = useFireOperations()

const showAssignUnits = ref(false)
const showNotes = ref(false)
const incidentNotes = ref('')

const severityLabels = {
  1: 'Minor',
  2: 'Moderate',
  3: 'Major',
  4: 'Critical',
  5: 'Catastrophic'
}

function formatType(type: string) {
  return type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
}

function formatTime(time: string | null) {
  if (!time) return ''
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDispatchTime(time: string) {
  const date = new Date(time)
  const now = new Date()
  const elapsed = Math.floor((now.getTime() - date.getTime()) / 60000)
  return `${elapsed}m ago`
}

function calculateResponseTime(incident: any) {
  if (!incident.dispatch_time || !incident.arrival_time) return ''
  const diff = new Date(incident.arrival_time).getTime() - new Date(incident.dispatch_time).getTime()
  const minutes = Math.floor(diff / 60000)
  return `${minutes}m`
}

function calculateDuration(incident: any) {
  if (!incident.dispatch_time || !incident.clearance_time) return ''
  const diff = new Date(incident.clearance_time).getTime() - new Date(incident.dispatch_time).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

function calculateElapsedTime(incident: any) {
  if (!incident.dispatch_time) return ''
  const diff = new Date().getTime() - new Date(incident.dispatch_time).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m on scene`
  return `${minutes}m on scene`
}

function getApparatusName(id: string) {
  const app = apparatus.value?.find(a => a.id === id)
  return app?.unit_number || 'Unknown'
}

function getPersonnelName(id: string) {
  const person = personnel.value?.find(p => p.id === id)
  return person ? `${person.first_name} ${person.last_name}` : 'Unknown'
}

async function updateUnitStatus(unitId: string, status: string) {
  // Update unit status
  console.log(`Unit ${unitId} -> ${status}`)
}

async function updateIncidentStatusAction(status: string) {
  const result = await updateIncidentStatus(props.incident.id, status)
  if (result) {
    emit('update', status)
  }
}

async function saveNotes() {
  // Save notes to incident
  console.log('Notes saved:', incidentNotes.value)
  showNotes.value = false
}
</script>

<style scoped>
.incident-command {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 0.75rem;
  overflow: hidden;
  color: #e2e8f0;
}

.command-header {
  background: rgba(15, 23, 42, 0.6);
  border-bottom: 2px solid #3b82f6;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 2rem;
  align-items: center;
}

.header-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #60a5fa;
  font-family: monospace;
  font-weight: 700;
}

.command-type {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.severity-display {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.severity-display.level-1 {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.severity-display.level-2 {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.severity-display.level-3 {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.severity-display.level-4,
.severity-display.level-5 {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.severity-display .label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.severity-display .value {
  font-weight: 700;
  font-size: 1.125rem;
}

.status-display {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.status-display.dispatched {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status-display.en_route {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.status-display.on_scene {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.status-display.resolved {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.status-display.cleared {
  background: rgba(107, 114, 128, 0.2);
  color: #cbd5e1;
}

.command-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem;
}

.command-section {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.command-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #cbd5e1;
}

.map-placeholder {
  background: rgba(51, 65, 85, 0.5);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  padding: 1rem;
  text-align: center;
}

.map-placeholder svg {
  width: 100%;
  height: auto;
  max-height: 150px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.info-row .label {
  color: #94a3b8;
  font-weight: 500;
}

.info-row .value {
  color: #cbd5e1;
  text-align: right;
}

.hazmat-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  padding: 0.75rem;
  color: #fca5a5;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.units-command {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.unit-card {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.unit-name {
  font-weight: 600;
  color: #cbd5e1;
  font-family: monospace;
}

.unit-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.unit-status.on_scene {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.unit-crew {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.crew-item.time {
  margin-left: auto;
  color: #64748b;
}

.unit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.btn-mini {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-mini:hover {
  background: #3b82f6;
  color: white;
}

.empty-units {
  text-align: center;
  padding: 1.5rem;
  color: #64748b;
  font-style: italic;
}

.empty-units p {
  margin: 0 0 0.75rem 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-event {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-left: 3px solid #94a3b8;
  border-radius: 0.25rem;
}

.timeline-event.dispatched { border-left-color: #3b82f6; }
.timeline-event.arrived { border-left-color: #f59e0b; }
.timeline-event.cleared { border-left-color: #10b981; }
.timeline-event.active { border-left-color: #ef4444; }

.timeline-event .time {
  font-family: monospace;
  font-weight: 600;
  color: #60a5fa;
  min-width: 80px;
}

.timeline-event .event {
  color: #cbd5e1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-card {
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

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-action {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-action:hover {
  background: #3b82f6;
  color: white;
}

.btn-action.danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
  grid-column: 1 / -1;
}

.btn-action.danger:hover {
  background: #ef4444;
  color: white;
}

.notes-section {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding: 1.5rem;
}

.notes-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.notes-input {
  width: 100%;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
  margin-bottom: 1rem;
}

.notes-input::placeholder {
  color: #64748b;
}

.notes-actions {
  display: flex;
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
  font-weight: 600;
}

.btn-secondary:hover {
  background: #3b82f6;
  color: white;
}

.btn-text {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 1rem;
}

.btn-text:hover {
  color: #cbd5e1;
}

@media (max-width: 1200px) {
  .command-grid {
    grid-template-columns: 1fr;
  }

  .command-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
