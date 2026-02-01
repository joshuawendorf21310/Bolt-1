<template>
  <div class="private-pay-revenue">
    <h3>Private-Pay Revenue</h3>
    <p class="subtitle">Patient billing separate from insurance</p>

    <div v-if="loading" class="loading">Loading private-pay data...</div>

    <div v-else-if="analytics" class="revenue-content">
      <div class="summary-grid">
        <div class="summary-card highlight">
          <span class="label">Total Revenue</span>
          <span class="value">{{ formatCurrency(analytics.totalRevenue) }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Outstanding Balance</span>
          <span class="value">{{ formatCurrency(analytics.outstandingBalance) }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Payment Success Rate</span>
          <span class="value">{{ analytics.completionRate.toFixed(1) }}%</span>
        </div>
      </div>

      <div class="breakdown-section">
        <h4>Revenue by Service Type</h4>
        <div class="breakdown-grid">
          <div class="breakdown-item">
            <span class="breakdown-label">Ambulance Transport</span>
            <span class="breakdown-value">{{ formatCurrency(analytics.ambulanceRevenue) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Telehealth</span>
            <span class="breakdown-value">{{ formatCurrency(analytics.telehealthRevenue) }}</span>
          </div>
        </div>
      </div>

      <div class="status-section">
        <h4>Payment Status</h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-count">{{ analytics.paidCount }}</span>
            <span class="status-label">Paid</span>
          </div>
          <div class="status-item warning">
            <span class="status-count">{{ analytics.failedCount }}</span>
            <span class="status-label">Failed</span>
          </div>
          <div class="status-item critical">
            <span class="status-count">{{ analytics.disputedCount }}</span>
            <span class="status-label">Disputed</span>
          </div>
        </div>
      </div>

      <div v-if="analytics.failedCount > 0 || analytics.disputedCount > 0" class="alert-box">
        <strong>Attention Required</strong>
        <p v-if="analytics.failedCount > 0">
          {{ analytics.failedCount }} failed {{ analytics.failedCount === 1 ? 'payment' : 'payments' }} need follow-up
        </p>
        <p v-if="analytics.disputedCount > 0">
          {{ analytics.disputedCount }} {{ analytics.disputedCount === 1 ? 'dispute' : 'disputes' }} in progress
        </p>
      </div>

      <div class="notice">
        <p>All payment processing is handled securely by Stripe. No payment data is stored on this platform.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getPrivatePayAnalytics } = useStripe()

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
  analytics.value = await getPrivatePayAnalytics()
  loading.value = false
})
</script>

<style scoped>
.private-pay-revenue {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.private-pay-revenue h3 {
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
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
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
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.breakdown-section,
.status-section {
  margin-bottom: 20px;
}

.breakdown-section h4,
.status-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.breakdown-label {
  font-size: 14px;
  color: #6b7280;
}

.breakdown-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.status-item.warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.status-item.critical {
  background: #fef2f2;
  border-color: #fecaca;
}

.status-count {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.status-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.alert-box {
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-box strong {
  display: block;
  font-size: 14px;
  color: #92400e;
  margin-bottom: 8px;
}

.alert-box p {
  margin: 4px 0;
  font-size: 13px;
  color: #78350f;
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
