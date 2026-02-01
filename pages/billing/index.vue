<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Billing & Claims</h1>
          <p class="text-gray-600 mt-1">CMS-compliant ambulance billing management</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="showFilters = !showFilters"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Filters
          </button>
        </div>
      </div>

      <div v-if="showFilters" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="filters.status" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="paid">Paid</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payer Type</label>
            <select v-model="filters.payerType" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">All Payers</option>
              <option value="medicare">Medicare</option>
              <option value="medicaid">Medicaid</option>
              <option value="commercial">Commercial</option>
              <option value="workers_comp">Workers Comp</option>
              <option value="self_pay">Self Pay</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Submission Method</label>
            <select v-model="filters.submissionMethod" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">All Methods</option>
              <option value="office_ally_837p">Electronic (837P)</option>
              <option value="lob_paper">Paper (Lob)</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="applyFilters"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Claims</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalClaims }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">📄</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Billed</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">${{ stats.totalBilled.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Paid</p>
              <p class="text-2xl font-bold text-green-600 mt-1">${{ stats.totalPaid.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Outstanding</p>
              <p class="text-2xl font-bold text-orange-600 mt-1">${{ stats.outstanding.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Claims List</h2>
        </div>

        <div v-if="loading" class="p-12 text-center text-gray-500">
          Loading claims...
        </div>

        <div v-else-if="claims.length === 0" class="p-12 text-center text-gray-500">
          No claims found
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim #
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="claim in claims" :key="claim.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ claim.claim_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ claim.patients.last_name }}, {{ claim.patients.first_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(claim.service_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ claim.payers?.name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${{ claim.total_charge.toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(claim.status)
                    ]"
                  >
                    {{ claim.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="claim.status === 'ready' || claim.status === 'draft'"
                    @click="submitClaim(claim.id)"
                    class="text-blue-600 hover:text-blue-900 font-medium mr-3"
                  >
                    Submit
                  </button>
                  <button
                    @click="viewClaim(claim.id)"
                    class="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const { getClaims, submitClaim: submitClaimAPI } = useBilling();
const { submitClaim837P } = useOfficeAlly();
const { sendPaperClaim } = useLob();

const claims = ref([]);
const loading = ref(true);
const showFilters = ref(false);

const filters = reactive({
  status: '',
  payerType: '',
  submissionMethod: ''
});

const stats = reactive({
  totalClaims: 0,
  totalBilled: 0,
  totalPaid: 0,
  outstanding: 0
});

const loadClaims = async () => {
  loading.value = true;

  const result = await getClaims('demo-org-id', filters);

  if (result.success) {
    claims.value = result.data;
    calculateStats(result.data);
  }

  loading.value = false;
};

const calculateStats = (claimsData) => {
  stats.totalClaims = claimsData.length;
  stats.totalBilled = claimsData.reduce((sum, c) => sum + c.total_charge, 0);
  stats.totalPaid = claimsData.reduce((sum, c) => sum + c.total_paid, 0);
  stats.outstanding = stats.totalBilled - stats.totalPaid;
};

const applyFilters = () => {
  loadClaims();
};

const submitClaim = async (claimId) => {
  if (confirm('Submit this claim electronically via Office Ally or print via Lob?')) {
    const method = confirm('Click OK for Electronic (837P), Cancel for Paper (Lob)')
      ? 'electronic'
      : 'paper';

    if (method === 'electronic') {
      const result = await submitClaim837P(claimId);
      if (result.success) {
        alert('Claim submitted successfully via Office Ally!');
        loadClaims();
      } else {
        alert('Error submitting claim: ' + result.error);
      }
    } else {
      const result = await sendPaperClaim(claimId);
      if (result.success) {
        alert('Paper claim sent via Lob!');
        loadClaims();
      } else {
        alert('Error sending paper claim: ' + result.error);
      }
    }
  }
};

const viewClaim = (claimId) => {
  navigateTo(`/billing/${claimId}`);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    ready: 'bg-blue-100 text-blue-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

onMounted(() => {
  loadClaims();
});
</script>
