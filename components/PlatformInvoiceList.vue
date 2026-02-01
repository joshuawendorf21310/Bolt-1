<template>
  <div class="invoice-list">
    <div class="list-header">
      <h4>Platform Invoices</h4>
      <button @click="refreshInvoices" class="refresh-button">Refresh</button>
    </div>

    <div v-if="loading" class="loading">Loading invoices...</div>

    <div v-else-if="invoices.length === 0" class="empty-state">
      No invoices found
    </div>

    <div v-else class="invoices-container">
      <div v-for="invoice in invoices" :key="invoice.id" class="invoice-card" @click="selectInvoice(invoice)">
        <div class="invoice-header">
          <span class="invoice-number">{{ invoice.invoice_number }}</span>
          <span :class="['status-badge', `status-${invoice.invoice_status}`]">
            {{ formatStatus(invoice.invoice_status) }}
          </span>
        </div>

        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">Period:</span>
            <span>{{ formatDate(invoice.invoice_period_start) }} - {{ formatDate(invoice.invoice_period_end) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Base Fee:</span>
            <span>{{ formatCurrency(invoice.base_platform_fee) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Billable Calls:</span>
            <span>{{ invoice.billable_calls_count }} calls ({{ formatCurrency(invoice.billable_calls_total) }})</span>
          </div>
          <div class="detail-row total">
            <span class="label">Total Due:</span>
            <span>{{ formatCurrency(invoice.total_amount_due) }}</span>
          </div>
        </div>

        <div class="invoice-footer">
          <span class="due-date">Due: {{ formatDate(invoice.due_date) }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedInvoice" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Invoice Details</h3>
          <button @click="closeModal" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <div class="invoice-info">
            <div class="info-row">
              <span class="label">Invoice Number:</span>
              <span>{{ selectedInvoice.invoice_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Billing Period:</span>
              <span>{{ formatDate(selectedInvoice.invoice_period_start) }} - {{ formatDate(selectedInvoice.invoice_period_end) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span :class="['status-badge', `status-${selectedInvoice.invoice_status}`]">
                {{ formatStatus(selectedInvoice.invoice_status) }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Due Date:</span>
              <span>{{ formatDate(selectedInvoice.due_date) }}</span>
            </div>
          </div>

          <div v-if="invoiceDetails.lineItems.length > 0" class="line-items">
            <h4>Line Items</h4>
            <div class="line-items-table">
              <div v-for="item in invoiceDetails.lineItems" :key="item.id" class="line-item">
                <div class="item-desc">
                  <span class="item-title">{{ item.description }}</span>
                  <span class="item-qty">Qty: {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}</span>
                </div>
                <span class="item-amount">{{ formatCurrency(item.amount) }}</span>
              </div>
            </div>
          </div>

          <div class="invoice-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>{{ formatCurrency(selectedInvoice.subtotal) }}</span>
            </div>
            <div v-if="selectedInvoice.stripe_passthrough_fees > 0" class="total-row">
              <span>Stripe Fees (passthrough)</span>
              <span>{{ formatCurrency(selectedInvoice.stripe_passthrough_fees) }}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount Due</span>
              <span>{{ formatCurrency(selectedInvoice.total_amount_due) }}</span>
            </div>
            <div v-if="selectedInvoice.amount_paid > 0" class="total-row paid">
              <span>Amount Paid</span>
              <span>{{ formatCurrency(selectedInvoice.amount_paid) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  agencyId: string
}>()

const { getAgencyInvoices, getInvoiceDetails } = usePlatformPricing()

const invoices = ref<any[]>([])
const selectedInvoice = ref<any>(null)
const invoiceDetails = ref<any>({ lineItems: [] })
const loading = ref(true)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'sent': 'Sent',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

const selectInvoice = async (invoice: any) => {
  selectedInvoice.value = invoice
  invoiceDetails.value = await getInvoiceDetails(invoice.id)
}

const closeModal = () => {
  selectedInvoice.value = null
  invoiceDetails.value = { lineItems: [] }
}

const refreshInvoices = async () => {
  loading.value = true
  invoices.value = await getAgencyInvoices(props.agencyId)
  loading.value = false
}

onMounted(async () => {
  await refreshInvoices()
})
</script>

<style scoped>
.invoice-list {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.refresh-button {
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-button:hover {
  background: #f3f4f6;
}

.loading,
.empty-state {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.invoices-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invoice-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.invoice-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.invoice-number {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.status-sent {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-overdue {
  background: #fee2e2;
  color: #991b1b;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
}

.detail-row.total {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 600;
}

.invoice-footer {
  display: flex;
  justify-content: flex-end;
}

.due-date {
  font-size: 12px;
  color: #6b7280;
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
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
}

.modal-body {
  padding: 20px;
}

.invoice-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-row .label {
  color: #6b7280;
  font-weight: 500;
}

.line-items {
  margin-bottom: 20px;
}

.line-items h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.line-items-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.line-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.item-desc {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.item-qty {
  font-size: 12px;
  color: #6b7280;
}

.item-amount {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.invoice-totals {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.total-row.final {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 2px solid #111827;
  font-size: 16px;
  font-weight: 700;
}

.total-row.paid {
  color: #065f46;
  font-weight: 600;
}
</style>
