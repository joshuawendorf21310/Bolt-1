<template>
  <div class="patient-portal">
    <div class="portal-header">
      <h1>Your Bills</h1>
      <p class="subtitle">View and pay your ambulance and telehealth bills securely</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your bills...</p>
    </div>

    <div v-else-if="invoices.length === 0" class="empty-state">
      <p>You have no bills at this time.</p>
    </div>

    <div v-else class="invoices-list">
      <div v-for="invoice in invoices" :key="invoice.id" class="invoice-card" @click="selectInvoice(invoice)">
        <div class="invoice-header">
          <span class="invoice-number">{{ invoice.invoice_number }}</span>
          <span :class="['status-badge', `status-${invoice.payment_status}`]">
            {{ formatStatus(invoice.payment_status) }}
          </span>
        </div>

        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">Service Type:</span>
            <span>{{ formatServiceType(invoice.service_type) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Due Date:</span>
            <span>{{ formatDate(invoice.due_date) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount Due:</span>
            <span class="amount-due">{{ formatCurrency(invoice.amount_outstanding) }}</span>
          </div>
        </div>

        <button v-if="invoice.payment_status === 'unpaid'" class="pay-button">
          Pay Now
        </button>
      </div>
    </div>

    <div v-if="selectedInvoice" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Bill Details</h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <div v-if="invoiceDetails.statement" class="statement-section">
            <h3>Statement of Services</h3>
            <div class="statement-content">
              <div class="statement-row">
                <span class="label">Service Date:</span>
                <span>{{ formatDate(invoiceDetails.statement.service_date) }}</span>
              </div>
              <div class="statement-row">
                <span class="label">Service Description:</span>
                <span>{{ invoiceDetails.statement.service_description }}</span>
              </div>
              <div v-if="invoiceDetails.statement.origin_address" class="statement-row">
                <span class="label">From:</span>
                <span>{{ invoiceDetails.statement.origin_address }}</span>
              </div>
              <div v-if="invoiceDetails.statement.destination_address" class="statement-row">
                <span class="label">To:</span>
                <span>{{ invoiceDetails.statement.destination_address }}</span>
              </div>
            </div>

            <div class="charges-breakdown">
              <div class="charge-row">
                <span>Total Charge</span>
                <span>{{ formatCurrency(invoiceDetails.statement.total_charge) }}</span>
              </div>
              <div class="charge-row">
                <span>Insurance Payment</span>
                <span>-{{ formatCurrency(invoiceDetails.statement.insurance_payment) }}</span>
              </div>
              <div v-if="invoiceDetails.statement.adjustments > 0" class="charge-row">
                <span>Adjustments</span>
                <span>-{{ formatCurrency(invoiceDetails.statement.adjustments) }}</span>
              </div>
              <div class="charge-row total">
                <span>Your Responsibility</span>
                <span>{{ formatCurrency(invoiceDetails.statement.patient_balance) }}</span>
              </div>
            </div>
          </div>

          <div v-if="invoiceDetails.paymentPlan" class="payment-plan-section">
            <h3>Payment Plan</h3>
            <div class="plan-details">
              <div class="plan-row">
                <span>Installment Amount:</span>
                <span>{{ formatCurrency(invoiceDetails.paymentPlan.installment_amount) }}</span>
              </div>
              <div class="plan-row">
                <span>Payments Made:</span>
                <span>{{ invoiceDetails.paymentPlan.installments_paid }} of {{ invoiceDetails.paymentPlan.installments_total }}</span>
              </div>
              <div class="plan-row">
                <span>Next Payment:</span>
                <span>{{ formatDate(invoiceDetails.paymentPlan.next_payment_date) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <a
            v-if="selectedInvoice.stripe_hosted_url && selectedInvoice.payment_status === 'unpaid'"
            :href="selectedInvoice.stripe_hosted_url"
            target="_blank"
            class="stripe-pay-button"
          >
            Pay Securely with Stripe
          </a>
          <p class="security-notice">
            All payments are processed securely by Stripe. We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getInvoicesByEmail, getInvoiceDetails } = useStripe()
const user = useSupabaseUser()

const invoices = ref<any[]>([])
const selectedInvoice = ref<any>(null)
const invoiceDetails = ref<any>({})
const loading = ref(true)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'unpaid': 'Unpaid',
    'paid': 'Paid',
    'failed': 'Payment Failed',
    'disputed': 'Disputed'
  }
  return statusMap[status] || status
}

const formatServiceType = (type: string) => {
  const typeMap: Record<string, string> = {
    'ambulance_transport': 'Ambulance Transport',
    'telehealth': 'Telehealth Service'
  }
  return typeMap[type] || type
}

const selectInvoice = async (invoice: any) => {
  selectedInvoice.value = invoice
  invoiceDetails.value = await getInvoiceDetails(invoice.id)
}

const closeModal = () => {
  selectedInvoice.value = null
  invoiceDetails.value = {}
}

onMounted(async () => {
  if (user.value?.email) {
    invoices.value = await getInvoicesByEmail(user.value.email)
  }
  loading.value = false
})
</script>

<style scoped>
.patient-portal {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.portal-header {
  background: white;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 24px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.portal-header h1 {
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

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.invoices-list {
  display: grid;
  gap: 16px;
}

.invoice-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.invoice-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.invoice-number {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.status-unpaid {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.status-disputed {
  background: #fce7f3;
  color: #831843;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
}

.amount-due {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.pay-button {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.pay-button:hover {
  background: #2563eb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-body {
  padding: 24px;
}

.statement-section,
.payment-plan-section {
  margin-bottom: 24px;
}

.statement-section h3,
.payment-plan-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.statement-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.statement-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.statement-row .label {
  color: #6b7280;
  font-weight: 500;
}

.charges-breakdown {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.charge-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.charge-row.total {
  border-top: 2px solid #111827;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 18px;
  font-weight: 700;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.stripe-pay-button {
  display: inline-block;
  padding: 14px 32px;
  background: #635bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.2s;
}

.stripe-pay-button:hover {
  background: #4f46e5;
}

.security-notice {
  margin: 16px 0 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}
</style>
