<template>
  <div class="business-health-summary">
    <div class="header">
      <h2>Business Health</h2>
      <p class="subtitle">{{ statusMessage }}</p>
    </div>

    <div v-if="loading" class="loading">Loading financial data...</div>

    <div v-else-if="health" class="metrics-grid">
      <div class="metric-card" :class="cashStatus">
        <div class="metric-label">Cash on Hand</div>
        <div class="metric-value">{{ formatCurrency(health.cash.total) }}</div>
        <div class="metric-trend" :class="health.cash.trend >= 0 ? 'positive' : 'negative'">
          {{ health.cash.trend >= 0 ? '↑' : '↓' }} {{ formatCurrency(Math.abs(health.cash.trend)) }} (30d)
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">
          Monthly Burn
          <span class="tooltip">ⓘ
            <span class="tooltip-text">Cash out minus cash in over the last 30 days. Different from accounting net income.</span>
          </span>
        </div>
        <div class="metric-value">{{ formatCurrency(health.burn.monthly) }}</div>
        <div class="metric-detail">
          In: {{ formatCurrency(health.burn.last30DaysInflow) }} | Out: {{ formatCurrency(health.burn.last30DaysOutflow) }}
        </div>
      </div>

      <div class="metric-card" :class="runwayStatus">
        <div class="metric-label">
          Runway
          <span class="tooltip">ⓘ
            <span class="tooltip-text">Months until cash runs out at current burn rate. Cash balance ÷ monthly burn.</span>
          </span>
        </div>
        <div class="metric-value">
          {{ health.runway === Infinity ? '∞' : health.runway }}
          {{ health.runway === Infinity ? '' : health.runway === 1 ? 'month' : 'months' }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">
          Net Profit/Loss
          <span class="tooltip">ⓘ
            <span class="tooltip-text">Accounting view (revenue minus expenses). Different from burn rate.</span>
          </span>
        </div>
        <div class="metric-value" :class="health.netProfit.mtd >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(health.netProfit.mtd) }}
        </div>
        <div class="metric-detail">MTD | YTD: {{ formatCurrency(health.netProfit.ytd) }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Accounts Receivable</div>
        <div class="metric-value">{{ formatCurrency(health.ar.total) }}</div>
        <div class="metric-detail aging-breakdown">
          <span>Current: {{ formatCurrency(health.ar.aging.current) }}</span>
          <span>30+: {{ formatCurrency(health.ar.aging['30']) }}</span>
          <span>60+: {{ formatCurrency(health.ar.aging['60']) }}</span>
          <span>90+: {{ formatCurrency(health.ar.aging['90']) }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Accounts Payable</div>
        <div class="metric-value">{{ formatCurrency(health.ap.total) }}</div>
        <div class="metric-detail">
          <span v-if="health.ap.byPriority.payroll > 0" class="priority-high">
            Payroll: {{ formatCurrency(health.ap.byPriority.payroll) }}
          </span>
          <span v-if="health.ap.byPriority.taxes > 0" class="priority-high">
            Taxes: {{ formatCurrency(health.ap.byPriority.taxes) }}
          </span>
        </div>
      </div>

      <div v-if="health.revenueByServiceLine.length > 0" class="metric-card full-width">
        <div class="metric-label">Revenue by Service Line (MTD)</div>
        <div class="service-lines">
          <div v-for="line in health.revenueByServiceLine" :key="line.name" class="service-line">
            <span class="line-name">{{ formatServiceLineName(line.name) }}</span>
            <span class="line-revenue">{{ formatCurrency(line.revenue) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { calculateBusinessHealth } = useFinancialHealth()

const health = ref<any>(null)
const loading = ref(true)

const cashStatus = computed(() => {
  if (!health.value) return ''
  const cash = health.value.cash.total
  const burn = health.value.burn.monthly
  if (cash < burn * 2) return 'status-critical'
  if (cash < burn * 6) return 'status-warning'
  return 'status-healthy'
})

const runwayStatus = computed(() => {
  if (!health.value) return ''
  const runway = health.value.runway
  if (runway === Infinity) return 'status-healthy'
  if (runway < 3) return 'status-critical'
  if (runway < 6) return 'status-warning'
  return 'status-healthy'
})

const statusMessage = computed(() => {
  if (!health.value) return 'Loading...'
  if (cashStatus.value === 'status-critical' || runwayStatus.value === 'status-critical') {
    return 'Immediate attention needed: low cash reserves'
  }
  if (cashStatus.value === 'status-warning' || runwayStatus.value === 'status-warning') {
    return 'Monitor closely: cash reserves below recommended levels'
  }
  return 'Company is operating within safe parameters'
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100)
}

const formatServiceLineName = (name: string) => {
  const names: Record<string, string> = {
    'transport': 'Transport',
    'ems': 'EMS',
    'fire_contracts': 'Fire Contracts',
    'other': 'Other'
  }
  return names[name] || name
}

onMounted(async () => {
  health.value = await calculateBusinessHealth()
  loading.value = false
})
</script>

<style scoped>
.business-health-summary {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.metric-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.metric-card.full-width {
  grid-column: 1 / -1;
}

.metric-card.status-critical {
  background: #fef2f2;
  border-color: #fecaca;
}

.metric-card.status-warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.metric-card.status-healthy {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.metric-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.metric-value.positive {
  color: #059669;
}

.metric-value.negative {
  color: #dc2626;
}

.metric-trend {
  font-size: 13px;
  font-weight: 500;
}

.metric-trend.positive {
  color: #059669;
}

.metric-trend.negative {
  color: #dc2626;
}

.metric-detail {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.aging-breakdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.priority-high {
  color: #dc2626;
  font-weight: 500;
}

.service-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.service-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.line-name {
  font-weight: 500;
  color: #374151;
}

.line-revenue {
  font-weight: 600;
  color: #111827;
}

.tooltip {
  position: relative;
  display: inline-flex;
  cursor: help;
  color: #9ca3af;
}

.tooltip-text {
  visibility: hidden;
  width: 200px;
  background-color: #1f2937;
  color: white;
  text-align: left;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -100px;
  font-size: 12px;
  font-weight: normal;
  line-height: 1.4;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
}
</style>
