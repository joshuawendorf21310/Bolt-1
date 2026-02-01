<template>
  <div class="founder-compensation">
    <h3>Founder Compensation Guardrails</h3>
    <p class="subtitle">Business-side record of compensation (not personal finances)</p>

    <div v-if="loading" class="loading">Loading compensation data...</div>

    <div v-else-if="compensation && safeDistribution" class="compensation-content">
      <div class="summary-grid">
        <div class="summary-card">
          <span class="label">Salary Paid YTD</span>
          <span class="value">{{ formatCurrency(compensation.salaryYTD) }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Distributions YTD</span>
          <span class="value">{{ formatCurrency(compensation.distributionsYTD) }}</span>
        </div>
        <div class="summary-card highlight">
          <span class="label">Safe to Distribute Now</span>
          <span class="value large">{{ formatCurrency(safeDistribution.safeAmount) }}</span>
          <span class="help-text">Based on cash safety rules</span>
        </div>
      </div>

      <details class="breakdown">
        <summary>View Calculation Breakdown</summary>
        <div class="breakdown-content">
          <div class="breakdown-row">
            <span>Total Cash Available</span>
            <span>{{ formatCurrency(safeDistribution.breakdown.totalCash) }}</span>
          </div>
          <div class="breakdown-row deduction">
            <span>Minimum Cash Buffer</span>
            <span>-{{ formatCurrency(safeDistribution.breakdown.minimumBuffer) }}</span>
          </div>
          <div class="breakdown-row deduction">
            <span>Payroll Reserve</span>
            <span>-{{ formatCurrency(safeDistribution.breakdown.payrollReserve) }}</span>
          </div>
          <div class="breakdown-row deduction">
            <span>Tax Reserve</span>
            <span>-{{ formatCurrency(safeDistribution.breakdown.taxReserve) }}</span>
          </div>
          <div class="breakdown-row deduction">
            <span>AP Reserve</span>
            <span>-{{ formatCurrency(safeDistribution.breakdown.apReserve) }}</span>
          </div>
          <div class="breakdown-row total">
            <span>Available for Distribution</span>
            <span>{{ formatCurrency(safeDistribution.breakdown.available) }}</span>
          </div>
        </div>
      </details>

      <div class="notice">
        <p>This system tracks only what the business pays to you. It does not track personal finances, personal spending, or what you do with distributions after they leave the business.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getCompensationSummary, calculateSafeDistribution } = useFounderCompensation()

const compensation = ref<any>(null)
const safeDistribution = ref<any>(null)
const loading = ref(true)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100)
}

onMounted(async () => {
  compensation.value = await getCompensationSummary()
  safeDistribution.value = await calculateSafeDistribution()
  loading.value = false
})
</script>

<style scoped>
.founder-compensation {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.founder-compensation h3 {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.summary-card.highlight {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.value {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.value.large {
  font-size: 28px;
  color: #1e40af;
}

.help-text {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.breakdown {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.breakdown summary {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.breakdown-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  font-size: 14px;
}

.breakdown-row.deduction {
  color: #6b7280;
  font-size: 13px;
}

.breakdown-row.total {
  font-weight: 600;
  border-top: 2px solid #111827;
  margin-top: 8px;
  padding-top: 12px;
}

.notice {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.notice p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}
</style>
