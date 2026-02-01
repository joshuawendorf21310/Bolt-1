<template>
  <NuxtLayout name="default">
    <div class="cad-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Computer-Aided Dispatch</h1>
          <div class="tab-navigation">
            <button
              @click="activeTab = 'incidents'"
              class="tab-button"
              :class="{ active: activeTab === 'incidents' }"
            >
              Incidents
            </button>
            <button
              @click="activeTab = 'crewlink'"
              class="tab-button"
              :class="{ active: activeTab === 'crewlink' }"
            >
              CrewLink
            </button>
          </div>
        </div>
        <button
          v-if="activeTab === 'incidents'"
          @click="showNewIncidentModal = true"
          class="btn btn-primary"
        >
          + New Incident
        </button>
      </div>

      <div v-if="activeTab === 'crewlink'" class="crewlink-container">
        <CrewLink :organization-id="organizationId" />
      </div>

      <div v-else class="cad-layout">
        <div class="incidents-panel">
          <div class="panel-header">
            <h3>Active Incidents</h3>
            <select v-model="filter" class="form-select filter-select">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="all">All</option>
            </select>
          </div>

          <div v-if="loading" class="loading">Loading...</div>
          <div v-else-if="filteredIncidents.length === 0" class="empty-state">
            No incidents found
          </div>
          <div v-else class="incidents-list">
            <div
              v-for="incident in filteredIncidents"
              :key="incident.id"
              class="incident-card"
              :class="{ selected: selectedIncident?.id === incident.id }"
              @click="selectIncident(incident)"
            >
              <div class="incident-header-row">
                <span class="incident-number">{{ incident.incident_number }}</span>
                <span class="badge" :class="`badge-priority-${incident.priority}`">
                  P{{ incident.priority }}
                </span>
              </div>
              <div class="incident-type">{{ incident.incident_type }}</div>
              <div class="incident-location">📍 {{ incident.location_address }}</div>
              <div class="incident-time">🕐 {{ formatTime(incident.created_at) }}</div>
              <div class="incident-status">
                <span class="badge" :class="`badge-${incident.status}`">
                  {{ incident.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="details-panel" v-if="selectedIncident">
          <div class="panel-header">
            <h3>Incident Details</h3>
            <div class="header-actions">
              <button @click="showDispatchModal = true" class="btn btn-sm btn-primary">
                Assign Unit
              </button>
              <button @click="closeIncident" class="btn btn-sm btn-success">
                Close
              </button>
            </div>
          </div>

          <div class="map-section" v-if="shouldShowMap">
            <MapNavigation
              :destination="{
                address: selectedIncident.location_address,
                lat: selectedIncident.location_lat,
                lng: selectedIncident.location_lng
              }"
              :origin="unitLocation"
            />
          </div>

          <div class="details-content">
            <div class="detail-section">
              <h4>Incident Information</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Incident Number</label>
                  <div>{{ selectedIncident.incident_number }}</div>
                </div>
                <div class="detail-item">
                  <label>Type</label>
                  <div>{{ selectedIncident.incident_type }}</div>
                </div>
                <div class="detail-item">
                  <label>Priority</label>
                  <div>
                    <span class="badge" :class="`badge-priority-${selectedIncident.priority}`">
                      Priority {{ selectedIncident.priority }}
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <label>Status</label>
                  <div>
                    <span class="badge" :class="`badge-${selectedIncident.status}`">
                      {{ selectedIncident.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Location</h4>
              <div class="detail-grid">
                <div class="detail-item full-width">
                  <label>Address</label>
                  <div>{{ selectedIncident.location_address }}</div>
                </div>
                <div class="detail-item full-width" v-if="selectedIncident.location_details">
                  <label>Additional Details</label>
                  <div>{{ selectedIncident.location_details }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedIncident.chief_complaint">
              <h4>Chief Complaint</h4>
              <div class="narrative-text">{{ selectedIncident.chief_complaint }}</div>
            </div>

            <div class="detail-section">
              <h4>Assigned Units ({{ assignedUnits.length }})</h4>
              <div v-if="assignedUnits.length === 0" class="empty-state-small">
                No units assigned
              </div>
              <div v-else class="units-list">
                <div v-for="dispatch in assignedUnits" :key="dispatch.id" class="unit-assignment">
                  <div class="unit-info">
                    <span class="unit-number">{{ dispatch.unit?.unit_number }}</span>
                    <span class="badge badge-info">{{ dispatch.status }}</span>
                  </div>
                  <div class="unit-times">
                    <span v-if="dispatch.acknowledged_at">Ack: {{ formatTime(dispatch.acknowledged_at) }}</span>
                    <span v-if="dispatch.enroute_at">Enroute: {{ formatTime(dispatch.enroute_at) }}</span>
                    <span v-if="dispatch.on_scene_at">On Scene: {{ formatTime(dispatch.on_scene_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="details-panel empty">
          <div class="empty-state">
            Select an incident to view details
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="showNewIncidentModal" class="modal-overlay" @click="showNewIncidentModal = false">
          <div class="modal-content" @click.stop>
            <h2>Create New Incident</h2>
            <form @submit.prevent="createIncident">
              <div class="form-group">
                <label class="form-label">Incident Type *</label>
                <select v-model="newIncident.incident_type" class="form-select" required>
                  <option value="">Select type</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Fire">Fire</option>
                  <option value="Vehicle Accident">Vehicle Accident</option>
                  <option value="Cardiac Arrest">Cardiac Arrest</option>
                  <option value="Trauma">Trauma</option>
                  <option value="Respiratory Distress">Respiratory Distress</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Priority *</label>
                <select v-model.number="newIncident.priority" class="form-select" required>
                  <option :value="1">Priority 1 (Critical)</option>
                  <option :value="2">Priority 2 (Urgent)</option>
                  <option :value="3">Priority 3 (Routine)</option>
                  <option :value="4">Priority 4 (Non-Emergency)</option>
                  <option :value="5">Priority 5 (Low)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Location Address *</label>
                <input v-model="newIncident.location_address" type="text" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="form-label">Location Details</label>
                <input v-model="newIncident.location_details" type="text" class="form-input" placeholder="Apt, floor, cross streets, etc." />
              </div>

              <div class="form-group">
                <label class="form-label">Caller Name</label>
                <input v-model="newIncident.caller_name" type="text" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Caller Phone</label>
                <input v-model="newIncident.caller_phone" type="tel" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Chief Complaint</label>
                <textarea v-model="newIncident.chief_complaint" class="form-textarea"></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" @click="showNewIncidentModal = false" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="creating">
                  {{ creating ? 'Creating...' : 'Create Incident' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div v-if="showDispatchModal" class="modal-overlay" @click="showDispatchModal = false">
          <div class="modal-content" @click.stop>
            <h2>Assign Unit to Incident</h2>
            <form @submit.prevent="dispatchUnit">
              <div class="form-group">
                <label class="form-label">Available Units *</label>
                <select v-model="dispatchData.unit_id" class="form-select" required>
                  <option value="">Select unit</option>
                  <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">
                    {{ unit.unit_number }} - {{ unit.unit_type?.name }} ({{ unit.status }})
                  </option>
                </select>
              </div>

              <div class="modal-actions">
                <button type="button" @click="showDispatchModal = false" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="dispatching">
                  {{ dispatching ? 'Dispatching...' : 'Dispatch Unit' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { $supabase } = useNuxtApp()
const api = useApi()
const auth = useAuth()

const activeTab = ref('incidents')
const organizationId = ref('')
const incidents = ref<any[]>([])
const selectedIncident = ref<any>(null)
const assignedUnits = ref<any[]>([])
const availableUnits = ref<any[]>([])
const filter = ref('active')
const loading = ref(true)
const showNewIncidentModal = ref(false)
const showDispatchModal = ref(false)
const creating = ref(false)
const dispatching = ref(false)

const newIncident = ref({
  incident_type: '',
  priority: 3,
  location_address: '',
  location_details: '',
  caller_name: '',
  caller_phone: '',
  chief_complaint: ''
})

const dispatchData = ref({
  unit_id: ''
})

const unitLocation = ref<{ lat: number; lng: number } | undefined>(undefined)

const filteredIncidents = computed(() => {
  if (filter.value === 'all') return incidents.value
  if (filter.value === 'active') {
    return incidents.value.filter(i => ['pending', 'dispatched', 'active'].includes(i.status))
  }
  return incidents.value.filter(i => i.status === filter.value)
})

const shouldShowMap = computed(() => {
  return selectedIncident.value && assignedUnits.value.length > 0
})

const fetchIncidents = async () => {
  loading.value = true
  const result = await api.incidents.list()
  if (result.success) {
    incidents.value = result.data
  }
  loading.value = false
}

const selectIncident = async (incident: any) => {
  selectedIncident.value = incident

  const [dispatchesRes] = await Promise.all([
    $supabase
      .from('dispatches')
      .select('*, unit:units(*, unit_type:unit_types(*))')
      .eq('incident_id', incident.id)
  ])

  assignedUnits.value = dispatchesRes.data || []
}

const createIncident = async () => {
  creating.value = true

  const result = await api.incidents.create({
    ...newIncident.value,
    status: 'pending'
  })

  if (result.success) {
    showNewIncidentModal.value = false
    newIncident.value = {
      incident_type: '',
      priority: 3,
      location_address: '',
      location_details: '',
      caller_name: '',
      caller_phone: '',
      chief_complaint: ''
    }
    await fetchIncidents()
  }

  creating.value = false
}

const dispatchUnit = async () => {
  if (!selectedIncident.value || !dispatchData.value.unit_id) return

  dispatching.value = true

  const result = await api.dispatches.create(selectedIncident.value.id, dispatchData.value.unit_id)

  if (result.success) {
    showDispatchModal.value = false
    dispatchData.value.unit_id = ''
    await selectIncident(selectedIncident.value)
    await fetchIncidents()
    await fetchAvailableUnits()
  }

  dispatching.value = false
}

const closeIncident = async () => {
  if (!selectedIncident.value) return

  if (confirm('Are you sure you want to close this incident?')) {
    await api.incidents.update(selectedIncident.value.id, {
      status: 'closed',
      clear_time: new Date().toISOString()
    })

    selectedIncident.value = null
    await fetchIncidents()
  }
}

const fetchAvailableUnits = async () => {
  const result = await api.units.list({ is_active: true })
  if (result.success) {
    availableUnits.value = result.data.filter((u: any) =>
      ['available', 'dispatched'].includes(u.status)
    )
  }
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

onMounted(async () => {
  const user = await auth.getUser()
  if (user) {
    const { data: userData } = await $supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      organizationId.value = userData.organization_id
    }
  }

  fetchIncidents()
  fetchAvailableUnits()

  const interval = setInterval(() => {
    fetchIncidents()
    if (selectedIncident.value) {
      selectIncident(selectedIncident.value)
    }
  }, 15000)

  onUnmounted(() => clearInterval(interval))
})
</script>

<style scoped>
.cad-page {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: var(--spacing-6) var(--spacing-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-dark-50);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
}

.page-header h1 {
  font-size: 2rem;
  margin: 0;
}

.tab-navigation {
  display: flex;
  gap: var(--spacing-2);
}

.tab-button {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: var(--color-gray-400);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-500);
}

.tab-button.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-dark-400);
}

.crewlink-container {
  flex: 1;
  overflow: auto;
}

.cad-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 0;
  overflow: hidden;
  background: var(--color-dark-500);
}

.incidents-panel, .details-panel {
  background: var(--color-dark-400);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.incidents-panel {
  border-right: 1px solid var(--color-dark-50);
}

.panel-header {
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--color-dark-50);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  font-size: 1.125rem;
  margin: 0;
}

.filter-select {
  width: auto;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: 0.875rem;
}

.incidents-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.incident-card {
  padding: var(--spacing-4);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-dark-50);
  cursor: pointer;
  transition: all 0.2s ease;
}

.incident-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 15px rgba(255, 107, 0, 0.2);
}

.incident-card.selected {
  border-color: var(--color-primary-500);
  background: rgba(255, 107, 0, 0.1);
}

.incident-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.incident-number {
  font-weight: 700;
  color: var(--color-primary-500);
  font-size: 1rem;
}

.incident-type {
  font-weight: 600;
  margin-bottom: var(--spacing-2);
  color: #ffffff;
}

.incident-location, .incident-time {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  margin-bottom: var(--spacing-1);
}

.incident-status {
  margin-top: var(--spacing-2);
}

.badge-priority-1 {
  background: rgba(220, 38, 38, 0.2);
  color: var(--color-error-500);
}

.badge-priority-2 {
  background: rgba(255, 107, 0, 0.2);
  color: var(--color-primary-500);
}

.badge-priority-3, .badge-priority-4, .badge-priority-5 {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success-500);
}

.badge-pending {
  background: rgba(255, 107, 0, 0.2);
  color: var(--color-primary-500);
}

.badge-dispatched {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.badge-active {
  background: rgba(220, 38, 38, 0.2);
  color: var(--color-error-500);
}

.badge-closed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success-500);
}

.details-panel {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.details-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-section {
  height: 500px;
  border-bottom: 1px solid var(--color-dark-50);
}

.details-content {
  padding: var(--spacing-6);
}

.detail-section {
  margin-bottom: var(--spacing-8);
}

.detail-section h4 {
  font-size: 1rem;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-dark-50);
  color: var(--color-primary-500);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item div {
  font-size: 0.9375rem;
  color: #ffffff;
}

.narrative-text {
  padding: var(--spacing-4);
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
}

.loading, .empty-state, .empty-state-small {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--color-gray-500);
}

.empty-state-small {
  padding: var(--spacing-4);
  font-size: 0.875rem;
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.unit-assignment {
  padding: var(--spacing-4);
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
}

.unit-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-2);
}

.unit-number {
  font-weight: 600;
  color: var(--color-primary-500);
}

.unit-times {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}

.modal-content {
  background: var(--color-dark-300);
  border: 1px solid var(--color-primary-500);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-8);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: var(--spacing-6);
  color: var(--color-primary-500);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
  margin-top: var(--spacing-6);
}

@media (max-width: 1024px) {
  .cad-layout {
    grid-template-columns: 1fr;
  }

  .incidents-panel {
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--color-dark-50);
  }
}
</style>
