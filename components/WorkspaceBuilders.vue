<template>
  <div class="workspace-builders">
    <div class="builders-tabs">
      <button
        v-for="builder in builders"
        :key="builder.id"
        @click="activeBuilder = builder.id"
        :class="['builder-tab', { active: activeBuilder === builder.id }]"
      >
        {{ builder.icon }} {{ builder.name }}
      </button>
    </div>

    <div class="builder-content">
      <div v-if="activeBuilder === 'invoice'" class="builder-section">
        <h3>Invoice Builder</h3>
        <p class="builder-description">Create patient-pay and private-party invoices</p>

        <div class="builder-form">
          <div class="form-row">
            <div class="form-field">
              <label>Invoice Number:</label>
              <input v-model="invoiceForm.invoiceNumber" type="text" placeholder="INV-2024-001" />
            </div>
            <div class="form-field">
              <label>Invoice Type:</label>
              <select v-model="invoiceForm.invoiceType">
                <option value="patient_pay">Patient Pay</option>
                <option value="private_party">Private Party</option>
                <option value="agency_billing">Agency Billing</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Payer Name:</label>
              <input v-model="invoiceForm.payerName" type="text" placeholder="John Doe" />
            </div>
            <div class="form-field">
              <label>Due Date:</label>
              <input v-model="invoiceForm.dueDate" type="date" />
            </div>
          </div>

          <div class="line-items-section">
            <h4>Line Items</h4>
            <div v-for="(item, index) in invoiceForm.lineItems" :key="index" class="line-item">
              <select v-model="item.itemType">
                <option value="transport">Transport</option>
                <option value="mileage">Mileage</option>
                <option value="service_level">Service Level</option>
                <option value="telehealth">Telehealth</option>
              </select>
              <input v-model="item.description" type="text" placeholder="Description" />
              <input v-model.number="item.quantity" type="number" placeholder="Qty" style="width: 80px" />
              <input v-model.number="item.unitPrice" type="number" placeholder="Price" style="width: 100px" />
              <button @click="removeLineItem(index)" class="remove-btn">×</button>
            </div>
            <button @click="addLineItem" class="add-line-btn">+ Add Line Item</button>
          </div>

          <div class="invoice-total">
            <p>Subtotal: ${{ calculateTotal() }}</p>
            <p class="total">Total: ${{ calculateTotal() }}</p>
          </div>

          <div class="form-actions">
            <button @click="saveDraft" class="save-btn">Save Draft</button>
            <button @click="finalizeInvoiceAction" class="finalize-btn">Finalize Invoice</button>
          </div>
        </div>
      </div>

      <div v-if="activeBuilder === 'nemsis'" class="builder-section">
        <h3>NEMSIS Builder</h3>
        <p class="builder-description">Validate and export ePCR data to NEMSIS format</p>

        <div class="validation-status">
          <div class="status-header">
            <h4>NEMSIS Readiness</h4>
            <span :class="['status-badge', nemsisStatus.status]">{{ nemsisStatus.status }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: nemsisProgress + '%' }"></div>
          </div>
          <p class="progress-text">
            {{ nemsisStatus.requiredComplete }}/{{ nemsisStatus.requiredTotal }} required fields complete
          </p>
        </div>

        <div class="validation-sections">
          <div class="validation-item">
            <span class="validation-icon">✓</span>
            <span class="validation-label">Patient Demographics</span>
            <span class="validation-status complete">Complete</span>
          </div>
          <div class="validation-item">
            <span class="validation-icon">✓</span>
            <span class="validation-label">Incident Information</span>
            <span class="validation-status complete">Complete</span>
          </div>
          <div class="validation-item">
            <span class="validation-icon">⚠</span>
            <span class="validation-label">Vital Signs</span>
            <span class="validation-status incomplete">Incomplete</span>
          </div>
          <div class="validation-item">
            <span class="validation-icon">✓</span>
            <span class="validation-label">Medications Administered</span>
            <span class="validation-status complete">Complete</span>
          </div>
        </div>

        <div class="form-actions">
          <button :disabled="!nemsisStatus.exportReady" class="export-btn">Export NEMSIS</button>
        </div>
      </div>

      <div v-if="activeBuilder === 'rxnorm'" class="builder-section">
        <h3>RxNorm Builder</h3>
        <p class="builder-description">Standardize medication documentation</p>

        <div class="mapping-section">
          <div class="mapping-input">
            <label>Medication Entry:</label>
            <input v-model="rxnormForm.medicationEntry" type="text" placeholder="Aspirin 81mg PO" />
            <button @click="suggestRxNorm" class="suggest-btn">Suggest Mapping</button>
          </div>

          <div v-if="rxnormForm.suggested" class="mapping-result">
            <h4>Suggested Mapping</h4>
            <div class="mapping-card">
              <p><strong>RxNorm Concept:</strong> {{ rxnormForm.rxnormName }}</p>
              <p><strong>Concept ID:</strong> {{ rxnormForm.rxnormConceptId }}</p>
              <p><strong>Confidence:</strong> {{ rxnormForm.confidence }}%</p>
              <div class="mapping-details">
                <input v-model="rxnormForm.dose" type="text" placeholder="Dose (81)" />
                <input v-model="rxnormForm.doseUnit" type="text" placeholder="Unit (mg)" />
                <input v-model="rxnormForm.route" type="text" placeholder="Route (PO)" />
              </div>
              <div class="mapping-actions">
                <button @click="confirmRxNorm" class="confirm-btn">Confirm Mapping</button>
                <button @click="rejectRxNorm" class="reject-btn">Reject</button>
              </div>
            </div>
          </div>

          <div class="mapping-list">
            <h4>Recent Mappings</h4>
            <div class="mapping-list-item" v-for="mapping in rxnormMappings" :key="mapping.id">
              <span>{{ mapping.medication_entry }}</span>
              <span :class="['mapping-status', mapping.mapping_status]">{{ mapping.mapping_status }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeBuilder === 'snomed'" class="builder-section">
        <h3>SNOMED Builder</h3>
        <p class="builder-description">Standardize clinical concepts</p>

        <div class="mapping-section">
          <div class="mapping-input">
            <label>Clinical Term:</label>
            <input v-model="snomedForm.clinicalTerm" type="text" placeholder="Chest pain" />
            <select v-model="snomedForm.termType">
              <option value="symptom">Symptom</option>
              <option value="finding">Finding</option>
              <option value="impression">Impression</option>
              <option value="procedure">Procedure</option>
            </select>
            <button @click="suggestSNOMED" class="suggest-btn">Suggest Mapping</button>
          </div>

          <div v-if="snomedForm.suggested" class="mapping-result">
            <h4>Suggested Mapping</h4>
            <div class="mapping-card">
              <p><strong>SNOMED Concept:</strong> {{ snomedForm.snomedDescription }}</p>
              <p><strong>Concept ID:</strong> {{ snomedForm.snomedConceptId }}</p>
              <p><strong>Confidence:</strong> {{ snomedForm.confidence }}%</p>
              <div class="mapping-actions">
                <button @click="confirmSNOMED" class="confirm-btn">Confirm Mapping</button>
                <button @click="rejectSNOMED" class="reject-btn">Reject</button>
              </div>
            </div>
          </div>

          <div class="mapping-list">
            <h4>Recent Mappings</h4>
            <div class="mapping-list-item" v-for="mapping in snomedMappings" :key="mapping.id">
              <span>{{ mapping.clinical_term }}</span>
              <span class="term-type">{{ mapping.term_type }}</span>
              <span :class="['mapping-status', mapping.mapping_status]">{{ mapping.mapping_status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  createInvoice,
  addInvoiceLineItem,
  calculateInvoiceTotals,
  finalizeInvoice,
  getRxNormMappings,
  mapRxNorm,
  confirmRxNormMapping,
  getSNOMEDMappings,
  mapSNOMED,
  confirmSNOMEDMapping
} = useBuilders()

const activeBuilder = ref('invoice')

const builders = [
  { id: 'invoice', name: 'Invoice', icon: '💵' },
  { id: 'nemsis', name: 'NEMSIS', icon: '🚑' },
  { id: 'rxnorm', name: 'RxNorm', icon: '💊' },
  { id: 'snomed', name: 'SNOMED', icon: '🩺' }
]

const invoiceForm = ref({
  invoiceNumber: '',
  invoiceType: 'patient_pay',
  payerName: '',
  dueDate: '',
  lineItems: [
    { itemType: 'transport', description: '', quantity: 1, unitPrice: 0 }
  ]
})

const nemsisStatus = ref({
  status: 'incomplete',
  requiredComplete: 3,
  requiredTotal: 4,
  exportReady: false
})

const nemsisProgress = computed(() => {
  return (nemsisStatus.value.requiredComplete / nemsisStatus.value.requiredTotal) * 100
})

const rxnormForm = ref({
  medicationEntry: '',
  suggested: false,
  rxnormConceptId: '',
  rxnormName: '',
  dose: '',
  doseUnit: '',
  route: '',
  confidence: 0
})

const snomedForm = ref({
  clinicalTerm: '',
  termType: 'symptom',
  suggested: false,
  snomedConceptId: '',
  snomedDescription: '',
  confidence: 0
})

const rxnormMappings = ref<any[]>([])
const snomedMappings = ref<any[]>([])

const addLineItem = () => {
  invoiceForm.value.lineItems.push({
    itemType: 'transport',
    description: '',
    quantity: 1,
    unitPrice: 0
  })
}

const removeLineItem = (index: number) => {
  invoiceForm.value.lineItems.splice(index, 1)
}

const calculateTotal = () => {
  const total = invoiceForm.value.lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)
  return (total / 100).toFixed(2)
}

const saveDraft = async () => {
  const invoice = await createInvoice({
    invoiceNumber: invoiceForm.value.invoiceNumber,
    invoiceType: invoiceForm.value.invoiceType as any,
    payerName: invoiceForm.value.payerName,
    dueDate: invoiceForm.value.dueDate
  })

  for (let i = 0; i < invoiceForm.value.lineItems.length; i++) {
    const item = invoiceForm.value.lineItems[i]
    await addInvoiceLineItem({
      invoiceId: invoice.id,
      lineNumber: i + 1,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: Math.round(item.unitPrice * 100)
    })
  }

  await calculateInvoiceTotals(invoice.id)
  alert('Invoice draft saved!')
}

const finalizeInvoiceAction = async () => {
  await saveDraft()
  alert('Invoice finalized!')
}

const suggestRxNorm = () => {
  rxnormForm.value.suggested = true
  rxnormForm.value.rxnormConceptId = 'RXCUI:1191'
  rxnormForm.value.rxnormName = 'Aspirin 81 MG Oral Tablet'
  rxnormForm.value.dose = '81'
  rxnormForm.value.doseUnit = 'mg'
  rxnormForm.value.route = 'PO'
  rxnormForm.value.confidence = 95
}

const confirmRxNorm = async () => {
  await mapRxNorm({
    medicationEntry: rxnormForm.value.medicationEntry,
    rxnormConceptId: rxnormForm.value.rxnormConceptId,
    rxnormName: rxnormForm.value.rxnormName,
    dose: rxnormForm.value.dose,
    doseUnit: rxnormForm.value.doseUnit,
    route: rxnormForm.value.route,
    mappingStatus: 'confirmed',
    mappingConfidence: rxnormForm.value.confidence,
    mappedBy: 'founder'
  })

  rxnormForm.value.suggested = false
  rxnormForm.value.medicationEntry = ''
  await loadRxNormMappings()
}

const rejectRxNorm = () => {
  rxnormForm.value.suggested = false
}

const suggestSNOMED = () => {
  snomedForm.value.suggested = true
  snomedForm.value.snomedConceptId = 'SCT:29857009'
  snomedForm.value.snomedDescription = 'Chest pain (finding)'
  snomedForm.value.confidence = 92
}

const confirmSNOMED = async () => {
  await mapSNOMED({
    clinicalTerm: snomedForm.value.clinicalTerm,
    snomedConceptId: snomedForm.value.snomedConceptId,
    snomedDescription: snomedForm.value.snomedDescription,
    termType: snomedForm.value.termType as any,
    mappingStatus: 'confirmed',
    mappingConfidence: snomedForm.value.confidence,
    mappedBy: 'founder'
  })

  snomedForm.value.suggested = false
  snomedForm.value.clinicalTerm = ''
  await loadSNOMEDMappings()
}

const rejectSNOMED = () => {
  snomedForm.value.suggested = false
}

const loadRxNormMappings = async () => {
  rxnormMappings.value = await getRxNormMappings()
}

const loadSNOMEDMappings = async () => {
  snomedMappings.value = await getSNOMEDMappings()
}

onMounted(() => {
  loadRxNormMappings()
  loadSNOMEDMappings()
})
</script>

<style scoped>
.workspace-builders {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.builders-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.builder-tab {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.builder-tab:hover {
  background: white;
}

.builder-tab.active {
  background: white;
  border-bottom-color: #3b82f6;
}

.builder-content {
  padding: 24px;
}

.builder-section h3 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.builder-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.builder-form {
  max-width: 800px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-field input,
.form-field select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.line-items-section {
  margin: 24px 0;
}

.line-items-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.line-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.line-item select,
.line-item input {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.line-item select {
  width: 140px;
}

.line-item input[type="text"] {
  flex: 1;
}

.remove-btn {
  padding: 8px 12px;
  background: #fecaca;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
}

.add-line-btn {
  padding: 8px 16px;
  background: #dbeafe;
  color: #1e40af;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.invoice-total {
  margin: 24px 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  text-align: right;
}

.invoice-total p {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #374151;
}

.invoice-total .total {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.save-btn,
.finalize-btn,
.export-btn,
.suggest-btn,
.confirm-btn,
.reject-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn {
  background: #e5e7eb;
  color: #374151;
}

.finalize-btn {
  background: #3b82f6;
  color: white;
}

.export-btn {
  background: #10b981;
  color: white;
}

.export-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.validation-status {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.valid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.incomplete {
  background: #fef3c7;
  color: #92400e;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}

.progress-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.validation-sections {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.validation-icon {
  font-size: 18px;
}

.validation-label {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.validation-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.validation-status.complete {
  background: #d1fae5;
  color: #065f46;
}

.validation-status.incomplete {
  background: #fef3c7;
  color: #92400e;
}

.mapping-section {
  max-width: 700px;
}

.mapping-input {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: end;
}

.mapping-input label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.mapping-input input,
.mapping-input select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.suggest-btn {
  background: #3b82f6;
  color: white;
}

.mapping-result {
  margin-bottom: 24px;
}

.mapping-result h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.mapping-card {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.mapping-card p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
}

.mapping-details {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.mapping-details input {
  flex: 1;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.mapping-actions {
  display: flex;
  gap: 8px;
}

.confirm-btn {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.mapping-list h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.mapping-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}

.term-type {
  padding: 2px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.mapping-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.mapping-status.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.mapping-status.suggested {
  background: #fef3c7;
  color: #92400e;
}

.mapping-status.unmapped {
  background: #e5e7eb;
  color: #6b7280;
}
</style>
