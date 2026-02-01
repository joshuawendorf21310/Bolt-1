<template>
  <div class="tax-safety">
    <h3>Tax Safety</h3>
    <p class="subtitle">Business tax obligations and reserves</p>

    <div v-if="loading" class="loading">Loading tax data...</div>

    <div v-else-if="taxes" class="tax-content">
      <div class="summary-row">
        <div class="summary-item">
          <span class="label">Total Expected</span>
          <span class="value">{{ formatCurrency(taxes.summary.totalExpected) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Reserved</span>
          <span class="value">{{ formatCurrency(taxes.summary.totalReserved) }}</span>
        </div>
        <div class="summary-item" :class="shortfallClass">
          <span class="label">Shortfall</span>
          <span class="value">{{ formatCurrency(taxes.summary.shortfall) }}</span>
        </div>
      </div>

      <div v-if="taxes.overdue.length > 0" class="alert-section critical">
        <strong>⚠ Overdue Obligations ({{ taxes.overdue.length }})</strong>
        <div v-for="tax in taxes.overdue" :key="tax.id" class="tax-item">
          <span>{{ formatTaxType(tax.tax_type) }}</span>
          <span>Due: {{ formatDate(tax.due_date) }}</span>
          <span>{{ formatCurrency(tax.amount_expected) }}</span>
        </div>
      </div>

      <div v-if="taxes.upcoming.length > 0" class="obligations-list">
        <h4>Upcoming (Next 30 Days)</h4>
        <div v-for="tax in taxes.upcoming" :key="tax.id" class="tax-item">
          <div class="tax-info">
            <span class="tax-type">{{ formatTaxType(tax.tax_type) }}</span>
            <span class="tax-period">{{ formatDate(tax.period_start) }} - {{ formatDate(tax.period_end) }}</span>
          </div>
          <div class="tax-amounts">
            <span>Expected: {{ formatCurrency(tax.amount_expected) }}</span>
            <span>Reserved: {{ formatCurrency(tax.amount_reserved) }}</span>
            <span class="due-date">Due: {{ formatDate(tax.due_date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getTaxObligations } = useTaxSafety()

const taxes = ref<any>(null)
const loading = ref(true)

const shortfallClass = computed(() => {
  if (!taxes.value) return ''
  return taxes.value.summary.shortfall > 0 ? 'status-warning' : 'status-good'
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTaxType = (type: string) => {
  const types: Record<string, string> = {
    'payroll_federal': 'Federal Payroll Tax',
    'payroll_state': 'State Payroll Tax',
    'payroll_local': 'Local Payroll Tax',
    'sales': 'Sales Tax',
    'estimated_income': 'Estimated Income Tax',
    'property': 'Property Tax',
    'other': 'Other Tax'
  }
  return types[type] || type
}

onMounted(async () => {
  taxes.value = await getTaxObligations()
  loading.value = false
})
</script>

<style scoped>
.tax-safety {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.tax-safety h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.summary-item.status-good {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.summary-item.status-warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.alert-section {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-section.critical {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.obligations-list h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.tax-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
}

.tax-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tax-type {
  font-weight: 600;
  color: #111827;
}

.tax-period {
  font-size: 12px;
  color: #6b7280;
}

.tax-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.due-date {
  font-weight: 500;
  color: #374151;
}
</style>
