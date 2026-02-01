<template>
  <div class="billing-invoices-page">
    <div class="page-header">
      <h1>Platform Invoices</h1>
      <p class="subtitle">Monthly platform fees and billable call charges</p>
    </div>

    <div class="pricing-summary">
      <div class="pricing-card">
        <span class="pricing-icon">💳</span>
        <div class="pricing-info">
          <span class="pricing-label">Monthly Platform Fee</span>
          <span class="pricing-amount">$500.00</span>
          <span class="pricing-desc">Base subscription fee</span>
        </div>
      </div>
      <div class="pricing-card">
        <span class="pricing-icon">📞</span>
        <div class="pricing-info">
          <span class="pricing-label">Per-Billable-Call Fee</span>
          <span class="pricing-amount">$45.00</span>
          <span class="pricing-desc">Per encounter charge</span>
        </div>
      </div>
    </div>

    <div class="invoice-section">
      <PlatformInvoiceList :agency-id="agencyId" />
    </div>

    <div class="pricing-policy">
      <h3>Pricing Policy</h3>
      <div class="policy-content">
        <p>Our platform uses a fixed pricing model designed for predictability and transparency:</p>
        <ul>
          <li><strong>Monthly Platform Fee ($500):</strong> Covers system availability, automation readiness, integrations, compliance posture, monitoring, and support. Charged regardless of call volume.</li>
          <li><strong>Per-Billable-Call Fee ($45):</strong> Charged once per completed billable encounter (EMS transports, treatment-in-place, refusals, private-pay, telehealth). Not dependent on insurance reimbursement or claim outcome.</li>
          <li><strong>No Percentage-Based Pricing:</strong> We do not use revenue sharing or percentage-based fees.</li>
          <li><strong>Transparent Pass-Through:</strong> Stripe payment processing fees are passed through at cost with no markup.</li>
          <li><strong>Automation Value:</strong> Pricing is not adjusted based on automation level. Automation improves reliability, not just reduces manual effort.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const agencyId = ref('default-agency-id')
</script>

<style scoped>
.billing-invoices-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 24px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.pricing-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pricing-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.pricing-icon {
  font-size: 32px;
}

.pricing-info {
  display: flex;
  flex-direction: column;
}

.pricing-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.pricing-amount {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.pricing-desc {
  font-size: 12px;
  color: #9ca3af;
}

.invoice-section {
  margin-bottom: 24px;
}

.pricing-policy {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.pricing-policy h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.policy-content p {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.6;
}

.policy-content ul {
  margin: 0;
  padding-left: 20px;
}

.policy-content li {
  margin-bottom: 12px;
  color: #374151;
  line-height: 1.6;
}

.policy-content strong {
  color: #111827;
  font-weight: 600;
}
</style>
