<template>
  <div class="cert-tracker">
    <header class="tracker-header">
      <h2>Personnel Certifications & Training</h2>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search personnel..."
          class="search-input"
        />
        <button class="btn-add" @click="showAddTraining = true">+ Add Training</button>
      </div>
    </header>

    <div class="tracker-content">
      <!-- Expiring Certifications Alert -->
      <div v-if="expiringCertifications.length > 0" class="alert-section expiring">
        <div class="alert-header">
          <span class="icon">⚠</span>
          <span class="title">{{ expiringCertifications.length }} Certifications Expiring Soon</span>
        </div>
        <div class="expiring-list">
          <div v-for="cert in expiringCertifications" :key="cert.id" class="expiring-item">
            <span class="person-name">{{ cert.personnel_name }}</span>
            <span class="cert-name">{{ cert.certification_name }}</span>
            <span class="expiry-date">Expires: {{ formatDate(cert.expiration_date) }}</span>
          </div>
        </div>
      </div>

      <!-- Personnel Grid -->
      <div class="personnel-grid">
        <div v-for="person in filteredPersonnel" :key="person.id" class="personnel-card">
          <div class="card-header">
            <h3>{{ person.first_name }} {{ person.last_name }}</h3>
            <span class="rank">{{ person.rank }}</span>
          </div>

          <div class="card-info">
            <div class="info-row">
              <span class="label">Badge:</span>
              <span class="value">{{ person.badge_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Hired:</span>
              <span class="value">{{ formatDate(person.hire_date) }}</span>
            </div>
            <div v-if="person.specializations?.length" class="specializations">
              <span class="label">Specializations:</span>
              <div class="spec-tags">
                <span v-for="spec in person.specializations" :key="spec" class="spec-tag">
                  {{ spec }}
                </span>
              </div>
            </div>
          </div>

          <!-- Certifications -->
          <div class="certifications-section">
            <h4>Certifications</h4>
            <div v-if="person.fire_certifications?.length > 0" class="certs-list">
              <div v-for="cert in person.fire_certifications" :key="cert.id" class="cert-item" :class="{ expiring: isExpiringSoon(cert.expiration_date), expired: isExpired(cert.expiration_date) }">
                <span class="cert-name">{{ cert.certification_name }}</span>
                <span class="cert-status" :class="{ current: cert.is_current, expired: !cert.is_current }">
                  {{ cert.is_current ? 'Current' : 'Expired' }}
                </span>
                <span v-if="cert.expiration_date" class="cert-date">
                  {{ formatDate(cert.expiration_date) }}
                </span>
              </div>
            </div>
            <div v-else class="empty-list">
              No certifications recorded
            </div>
            <button class="btn-mini" @click="addCertification(person.id)">+ Add Cert</button>
          </div>

          <!-- Training Records -->
          <div class="training-section">
            <h4>Recent Training</h4>
            <div v-if="getTrainingRecords(person.id).length > 0" class="training-list">
              <div v-for="training in getTrainingRecords(person.id).slice(0, 3)" :key="training.id" class="training-item">
                <span class="training-name">{{ training.training_name }}</span>
                <span class="training-date">{{ formatDate(training.training_date) }}</span>
                <span class="training-hours">{{ training.hours_completed }}h</span>
              </div>
            </div>
            <div v-else class="empty-list">
              No training recorded
            </div>
            <button class="btn-mini" @click="addTrainingRecord(person.id)">+ Add Training</button>
          </div>

          <div class="card-actions">
            <button class="btn-action" @click="editPersonnel(person.id)">Edit Profile</button>
            <button class="btn-action" @click="downloadCertificates(person.id)">Download Certs</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Training Modal -->
    <div v-if="showAddTraining" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Training Record</h3>
          <button class="btn-close" @click="showAddTraining = false">×</button>
        </div>
        <form @submit.prevent="submitTraining" class="modal-form">
          <div class="form-group">
            <label>Personnel</label>
            <select v-model="trainingForm.personnel_id" required>
              <option value="">Select personnel...</option>
              <option v-for="p in personnel" :key="p.id" :value="p.id">
                {{ p.first_name }} {{ p.last_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Training Name</label>
            <input v-model="trainingForm.training_name" type="text" required />
          </div>
          <div class="form-group">
            <label>Training Date</label>
            <input v-model="trainingForm.training_date" type="date" required />
          </div>
          <div class="form-group">
            <label>Hours Completed</label>
            <input v-model="trainingForm.hours_completed" type="number" step="0.5" />
          </div>
          <div class="form-group">
            <label>Trainer</label>
            <input v-model="trainingForm.trainer" type="text" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Save Training</button>
            <button type="button" class="btn-secondary" @click="showAddTraining = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFireOperations } from '~/composables/useFireOperations'

const { personnel, loadPersonnel, recordTraining } = useFireOperations()

const searchQuery = ref('')
const showAddTraining = ref(false)
const trainingRecords = ref<any[]>([])

const trainingForm = ref({
  personnel_id: '',
  training_name: '',
  training_date: '',
  hours_completed: null,
  trainer: ''
})

const filteredPersonnel = computed(() => {
  if (!searchQuery.value) return personnel.value || []
  const query = searchQuery.value.toLowerCase()
  return (personnel.value || []).filter(p =>
    p.first_name.toLowerCase().includes(query) ||
    p.last_name.toLowerCase().includes(query) ||
    p.badge_number?.toLowerCase().includes(query)
  )
})

const expiringCertifications = computed(() => {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiring: any[] = []
  (personnel.value || []).forEach(p => {
    p.fire_certifications?.forEach((cert: any) => {
      if (cert.is_current && cert.expiration_date) {
        const expDate = new Date(cert.expiration_date)
        if (expDate <= thirtyDaysFromNow) {
          expiring.push({
            id: cert.id,
            personnel_name: `${p.first_name} ${p.last_name}`,
            certification_name: cert.certification_name,
            expiration_date: cert.expiration_date
          })
        }
      }
    })
  })
  return expiring
})

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

function isExpiringSoon(date: string | null) {
  if (!date) return false
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expDate = new Date(date)
  return expDate <= thirtyDaysFromNow && expDate > new Date()
}

function isExpired(date: string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

function getTrainingRecords(personnelId: string) {
  return trainingRecords.value.filter(t => t.personnel_id === personnelId)
}

function addCertification(personnelId: string) {
  console.log('Add certification for', personnelId)
}

function addTrainingRecord(personnelId: string) {
  trainingForm.value.personnel_id = personnelId
  showAddTraining.value = true
}

function editPersonnel(personnelId: string) {
  console.log('Edit personnel', personnelId)
}

function downloadCertificates(personnelId: string) {
  console.log('Download certificates for', personnelId)
}

async function submitTraining() {
  const result = await recordTraining(trainingForm.value.personnel_id, {
    training_name: trainingForm.value.training_name,
    training_date: trainingForm.value.training_date,
    hours_completed: trainingForm.value.hours_completed,
    trainer: trainingForm.value.trainer,
    completion_status: 'completed'
  })

  if (result) {
    trainingRecords.value.push(result)
    trainingForm.value = {
      personnel_id: '',
      training_name: '',
      training_date: '',
      hours_completed: null,
      trainer: ''
    }
    showAddTraining.value = false
  }
}

onMounted(() => {
  loadPersonnel()
})
</script>

<style scoped>
.cert-tracker {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 0.75rem;
  overflow: hidden;
  color: #e2e8f0;
}

.tracker-header {
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 2px solid #3b82f6;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.tracker-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-input {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 200px;
}

.search-input::placeholder {
  color: #64748b;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-add {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
}

.tracker-content {
  padding: 1.5rem;
}

.alert-section {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.alert-section.expiring {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #fbbf24;
}

.alert-header .icon {
  font-size: 1.25rem;
}

.expiring-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.expiring-item {
  display: grid;
  grid-template-columns: 200px 200px 1fr;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.person-name {
  font-weight: 600;
  color: #cbd5e1;
}

.cert-name {
  color: #94a3b8;
}

.expiry-date {
  color: #fca5a5;
  text-align: right;
}

.personnel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.personnel-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 0.5rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #e2e8f0;
}

.rank {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-info {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  font-size: 0.875rem;
}

.info-row .label {
  color: #94a3b8;
}

.info-row .value {
  color: #cbd5e1;
}

.specializations {
  margin-top: 0.75rem;
}

.specializations .label {
  display: block;
  color: #94a3b8;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.spec-tag {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.certifications-section,
.training-section {
  margin-bottom: 1rem;
}

.certifications-section h4,
.training-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #cbd5e1;
}

.certs-list,
.training-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.cert-item,
.training-item {
  background: rgba(51, 65, 85, 0.3);
  border-left: 3px solid #3b82f6;
  border-radius: 0.25rem;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.cert-item.expired {
  border-left-color: #ef4444;
  opacity: 0.6;
}

.cert-item.expiring {
  border-left-color: #f59e0b;
}

.cert-name,
.training-name {
  color: #cbd5e1;
  font-weight: 500;
  flex: 1;
}

.cert-status {
  padding: 0.2rem 0.4rem;
  border-radius: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.cert-status.expired {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.cert-date,
.training-date {
  color: #94a3b8;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.training-hours {
  color: #94a3b8;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.empty-list {
  color: #64748b;
  font-size: 0.8rem;
  font-style: italic;
  padding: 0.5rem 0;
}

.btn-mini {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.35rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.btn-mini:hover {
  background: #3b82f6;
  color: white;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 1rem;
}

.btn-action {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action:hover {
  background: #3b82f6;
  color: white;
}

.modal {
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
}

.modal-content {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.btn-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.form-group input,
.form-group select {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
  padding: 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
}

.btn-secondary {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
}
</style>
