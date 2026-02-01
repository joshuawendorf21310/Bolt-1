<template>
  <div class="platform-revenue">
    <div class="panel-header">
      <h3>Platform Revenue Model</h3>
      <p class="subtitle">Fixed pricing: $500/month + $45/billable call</p>
    </div>

    <div v-if="loading" class="loading">Loading revenue data...</div>

    <div v-else-if="analytics" class="revenue-content">
      <div class="pricing-model-info">
        <div class="pricing-box">
          <span class="pricing-label">Monthly Platform Fee</span>
          <span class="pricing-value">$500</span>
          <span class="pricing-desc">per agency</span>
        </div>
        <div class="pricing-box">
          <span class="pricing-label">Per-Billable-Call Fee</span>
          <span class="pricing-value">$45</span>
          <span class="pricing-desc">per encounter</span>
        </div>
      </div>

      <div class="revenue-metrics">
        <div class="metric-card primary">
          <span class="metric-label">Total Platform Revenue</span>
          <span class="metric-value">{{ formatCurrency(analytics.totalRevenue) }}</span>
          <div class="metric-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">Recurring (Base Fees)</span>
              <span class="breakdown-value">{{ formatCurrency(analytics.recurringRevenue) }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Usage (Call Fees)</span>
              <span class="breakdown-value">{{ formatCurrency(analytics.usageRevenue) }}</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <span class="metric-label">Monthly Recurring Revenue (MRR)</span>
          <span class="metric-value">{{ formatCurrency(analytics.monthlyRecurringRevenue) }}</span>
          <span class="metric-detail">{{ analytics.activeSubscriptions }} active {{ analytics.activeSubscriptions === 1 ? 'agency' : 'agencies' }}</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Outstanding Amount</span>
          <span class="metric-value">{{ formatCurrency(analytics.outstandingAmount) }}</span>
          <span v-if="analytics.overdueInvoices > 0" class="metric-detail warning">
            {{ analytics.overdueInvoices }} overdue {{ analytics.overdueInvoices === 1 ? 'invoice' : 'invoices' }}
          </span>
        </div>
      </div>

      <div class="usage-metrics">
        <h4>Usage Metrics</h4>
        <div class="usage-grid">
          <div class="usage-stat">
            <span class="stat-value">{{ analytics.totalBillableCalls.toLocaleString() }}</span>
            <span class="stat-label">Total Billable Calls</span>
          </div>
          <div class="usage-stat">
            <span class="stat-value">{{ analytics.paidCalls.toLocaleString() }}</span>
            <span class="stat-label">Paid Calls</span>
          </div>
          <div class="usage-stat">
            <span class="stat-value">{{ analytics.averageCallsPerAgency.toFixed(0) }}</span>
            <span class="stat-label">Avg Calls per Agency</span>
          </div>
        </div>
      </div>

      <div class="invoice-summary">
        <h4>Invoice Status</h4>
        <div class="invoice-stats">
          <div class="invoice-stat">
            <span class="stat-count">{{ analytics.totalInvoices }}</span>
            <span class="stat-label">Total Invoices</span>
          </div>
          <div class="invoice-stat paid">
            <span class="stat-count">{{ analytics.paidInvoices }}</span>
            <span class="stat-label">Paid</span>
          </div>
          <div class="invoice-stat overdue" v-if="analytics.overdueInvoices > 0">
            <span class="stat-count">{{ analytics.overdueInvoices }}</span>
            <span class="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      <div class="pricing-notes">
        <h4>Pricing Policy</h4>
        <ul>
          <li>Base fee charged regardless of call volume</li>
          <li>Per-call fee applies to all billable encounters</li>
          <li>No percentage-based pricing or revenue sharing</li>
          <li>Pricing not adjusted for automation level</li>
          <li>Stripe fees passed through transparently (not marked up)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getPlatformRevenueAnalytics } = usePlatformPricing()

const analytics = ref<any>(null)
const loading = ref(true)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount / 100)
}

onMounted(async () => {
  analytics.value = await getPlatformRevenueAnalytics()
  loading.value = false
})
</script>

<style scoped>
.platform-revenue {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.pricing-model-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.pricing-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.pricing-label {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 8px;
}

.pricing-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pricing-desc {
  font-size: 12px;
  opacity: 0.8;
}

.revenue-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.metric-card.primary {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.metric-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.metric-detail {
  font-size: 12px;
  color: #6b7280;
}

.metric-detail.warning {
  color: #dc2626;
  font-weight: 500;
}

.metric-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #cbd5e1;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.breakdown-label {
  color: #6b7280;
}

.breakdown-value {
  font-weight: 600;
  color: #111827;
}

.usage-metrics,
.invoice-summary,
.pricing-notes {
  margin-bottom: 20px;
}

.usage-metrics h4,
.invoice-summary h4,
.pricing-notes h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.usage-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.invoice-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.invoice-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.invoice-stat.paid {
  background: #d1fae5;
  border-color: #a7f3d0;
}

.invoice-stat.overdue {
  background: #fee2e2;
  border-color: #fecaca;
}

.stat-count {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.pricing-notes {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 16px;
}

.pricing-notes ul {
  margin: 0;
  padding-left: 20px;
}

.pricing-notes li {
  font-size: 13px;
  color: #78350f;
  line-height: 1.6;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .pricing-model-info,
  .usage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
