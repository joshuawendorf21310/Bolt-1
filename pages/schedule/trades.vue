<template>
  <div class="trades-container">
    <div class="page-header">
      <div class="header-content">
        <h1>Shift Trading Marketplace</h1>
        <p class="subtitle">Trade, swap, or cover shifts with your team</p>
      </div>
      <button @click="showOfferModal = true" class="btn-primary">
        <span class="icon">+</span>
        Offer Shift
      </button>
    </div>

    <div class="trades-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="currentTab = tab.key"
        :class="['tab-btn', { active: currentTab === tab.key }]"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <div class="trades-filters">
      <div class="filter-group">
        <select v-model="filterType" class="filter-select" @change="filterTrades">
          <option value="">All Types</option>
          <option value="swap">Swap</option>
          <option value="giveaway">Giveaway</option>
          <option value="cover">Cover</option>
        </select>

        <select v-model="filterStation" class="filter-select" @change="filterTrades">
          <option value="">All Stations</option>
          <option value="Station 1">Station 1</option>
          <option value="Station 2">Station 2</option>
          <option value="Station 3">Station 3</option>
        </select>
      </div>

      <div class="filter-stats">
        <div class="stat-item">
          <span class="stat-value">{{ trades.length }}</span>
          <span class="stat-label">Active Trades</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ myTrades.length }}</span>
          <span class="stat-label">My Trades</span>
        </div>
      </div>
    </div>

    <div class="trades-content">
      <div v-if="currentTab === 'marketplace'" class="marketplace-grid">
        <div
          v-for="trade in filteredMarketplaceTrades"
          :key="trade.id"
          class="trade-card"
        >
          <div class="trade-header">
            <div class="trade-type-badge" :class="`type-${trade.trade_type}`">
              {{ trade.trade_type }}
            </div>
            <div class="trade-date">
              {{ formatDate(trade.offering_shift?.shift_date) }}
            </div>
          </div>

          <div class="trade-shift-info">
            <div class="shift-detail">
              <span class="detail-label">Offering:</span>
              <div class="shift-block" :style="{ backgroundColor: trade.offering_shift?.template?.color_code || '#ff6b00' }">
                <span class="shift-name">{{ trade.offering_shift?.template?.template_name || 'Shift' }}</span>
                <span class="shift-time">{{ formatShiftTime(trade.offering_shift) }}</span>
                <span class="shift-station">{{ trade.offering_shift?.station || 'No Station' }}</span>
              </div>
            </div>

            <div class="shift-separator">⇄</div>

            <div v-if="trade.trade_type === 'swap'" class="shift-detail">
              <span class="detail-label">Looking for:</span>
              <div class="shift-placeholder">
                <span>Any compatible shift</span>
              </div>
            </div>
            <div v-else class="shift-detail">
              <span class="detail-label">Need:</span>
              <div class="shift-placeholder">
                <span>{{ trade.trade_type === 'giveaway' ? 'Someone to take' : 'Coverage' }}</span>
              </div>
            </div>
          </div>

          <div v-if="trade.reason" class="trade-reason">
            <span class="reason-icon">💬</span>
            <span class="reason-text">{{ trade.reason }}</span>
          </div>

          <div class="trade-footer">
            <div class="trade-user">
              <span class="user-avatar">{{ getInitials(trade.offering_user?.full_name) }}</span>
              <span class="user-name">{{ trade.offering_user?.full_name }}</span>
            </div>
            <button
              v-if="!isMyTrade(trade)"
              @click="acceptTrade(trade)"
              class="btn-accept"
            >
              Accept Trade
            </button>
            <span v-else class="my-trade-badge">Your Trade</span>
          </div>
        </div>

        <div v-if="filteredMarketplaceTrades.length === 0" class="empty-state">
          <div class="empty-icon">🔄</div>
          <h3>No Available Trades</h3>
          <p>There are no shifts available for trading right now.</p>
          <button @click="showOfferModal = true" class="btn-primary">
            Offer a Shift
          </button>
        </div>
      </div>

      <div v-else-if="currentTab === 'my-trades'" class="trades-list">
        <div
          v-for="trade in myTrades"
          :key="trade.id"
          :class="['trade-list-item', `status-${trade.status}`]"
        >
          <div class="trade-status-bar"></div>
          <div class="trade-content">
            <div class="trade-list-header">
              <div class="trade-type-badge" :class="`type-${trade.trade_type}`">
                {{ trade.trade_type }}
              </div>
              <span :class="['status-badge', `status-${trade.status}`]">
                {{ trade.status.replace('_', ' ') }}
              </span>
            </div>

            <div class="trade-shifts">
              <div class="offering-shift">
                <span class="shift-label">Offering:</span>
                <div class="shift-info">
                  <span class="shift-date">{{ formatDate(trade.offering_shift?.shift_date) }}</span>
                  <span class="shift-time">{{ formatShiftTime(trade.offering_shift) }}</span>
                  <span class="shift-station">{{ trade.offering_shift?.station }}</span>
                </div>
              </div>

              <div v-if="trade.requesting_user" class="requesting-shift">
                <span class="shift-label">With:</span>
                <div class="shift-info">
                  <span class="user-name">{{ trade.requesting_user?.full_name }}</span>
                  <span v-if="trade.requesting_shift" class="shift-date">
                    {{ formatDate(trade.requesting_shift?.shift_date) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="trade-actions">
              <span class="trade-time">{{ formatDateTime(trade.offered_at) }}</span>
              <div class="action-buttons">
                <button
                  v-if="trade.status === 'pending'"
                  @click="cancelTrade(trade.id)"
                  class="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  v-if="trade.status === 'accepted' && isManager"
                  @click="reviewTrade(trade, 'approve')"
                  class="btn-approve"
                >
                  Approve
                </button>
                <button
                  v-if="trade.status === 'accepted' && isManager"
                  @click="reviewTrade(trade, 'deny')"
                  class="btn-deny"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="myTrades.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Active Trades</h3>
          <p>You don't have any shift trades in progress.</p>
        </div>
      </div>

      <div v-else-if="currentTab === 'pending-approval'" class="trades-list">
        <div
          v-for="trade in pendingApproval"
          :key="trade.id"
          class="trade-list-item approval-card"
        >
          <div class="trade-status-bar"></div>
          <div class="trade-content">
            <div class="trade-approval-header">
              <div class="participants">
                <div class="participant">
                  <span class="participant-label">From:</span>
                  <span class="participant-name">{{ trade.offering_user?.full_name }}</span>
                </div>
                <span class="separator">↔</span>
                <div class="participant">
                  <span class="participant-label">To:</span>
                  <span class="participant-name">{{ trade.requesting_user?.full_name }}</span>
                </div>
              </div>
              <div class="trade-type-badge" :class="`type-${trade.trade_type}`">
                {{ trade.trade_type }}
              </div>
            </div>

            <div class="trade-details-grid">
              <div class="detail-card">
                <span class="card-label">Offering Shift</span>
                <span class="card-date">{{ formatDate(trade.offering_shift?.shift_date) }}</span>
                <span class="card-time">{{ formatShiftTime(trade.offering_shift) }}</span>
                <span class="card-station">{{ trade.offering_shift?.station }}</span>
              </div>

              <div v-if="trade.requesting_shift" class="detail-card">
                <span class="card-label">Requesting Shift</span>
                <span class="card-date">{{ formatDate(trade.requesting_shift?.shift_date) }}</span>
                <span class="card-time">{{ formatShiftTime(trade.requesting_shift) }}</span>
                <span class="card-station">{{ trade.requesting_shift?.station }}</span>
              </div>
            </div>

            <div v-if="trade.reason" class="trade-reason-box">
              <span class="reason-label">Reason:</span>
              <span class="reason-text">{{ trade.reason }}</span>
            </div>

            <div class="approval-footer">
              <span class="trade-time">Requested {{ formatDateTime(trade.accepted_at) }}</span>
              <div class="approval-buttons">
                <button
                  @click="approveTrade(trade.id, false, 'Denied by management')"
                  class="btn-deny"
                >
                  Deny
                </button>
                <button
                  @click="approveTrade(trade.id, true)"
                  class="btn-approve"
                >
                  Approve Trade
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pendingApproval.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>All Caught Up!</h3>
          <p>No trades waiting for approval.</p>
        </div>
      </div>

      <div v-else class="trades-list">
        <div
          v-for="trade in completedTrades"
          :key="trade.id"
          :class="['trade-list-item', `status-${trade.status}`]"
        >
          <div class="trade-status-bar"></div>
          <div class="trade-content">
            <div class="trade-list-header">
              <div class="participants-inline">
                <span>{{ trade.offering_user?.full_name }}</span>
                <span class="separator">→</span>
                <span>{{ trade.requesting_user?.full_name }}</span>
              </div>
              <span :class="['status-badge', `status-${trade.status}`]">
                {{ trade.status.replace('_', ' ') }}
              </span>
            </div>

            <div class="trade-summary">
              <span>{{ trade.trade_type }} • {{ formatDate(trade.offering_shift?.shift_date) }}</span>
            </div>

            <div class="trade-completed-date">
              Completed {{ formatDateTime(trade.completed_at || trade.updated_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showOfferModal" class="modal-overlay" @click="showOfferModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Offer Shift for Trade</h2>
          <button @click="showOfferModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Your Shift</label>
            <select v-model="newTrade.shiftId" class="form-select">
              <option value="">Choose a shift...</option>
              <option v-for="shift in myUpcomingShifts" :key="shift.id" :value="shift.id">
                {{ formatDate(shift.shift_date) }} - {{ formatShiftTime(shift) }} ({{ shift.station }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Trade Type</label>
            <div class="trade-type-options">
              <label class="radio-option">
                <input type="radio" v-model="newTrade.tradeType" value="swap" />
                <div class="option-content">
                  <span class="option-title">Swap</span>
                  <span class="option-desc">Exchange shifts with another employee</span>
                </div>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="newTrade.tradeType" value="giveaway" />
                <div class="option-content">
                  <span class="option-title">Giveaway</span>
                  <span class="option-desc">Give your shift to someone else</span>
                </div>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="newTrade.tradeType" value="cover" />
                <div class="option-content">
                  <span class="option-title">Cover</span>
                  <span class="option-desc">Need someone to cover part of your shift</span>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Reason (Optional)</label>
            <textarea
              v-model="newTrade.reason"
              class="form-textarea"
              rows="3"
              placeholder="Why do you need to trade this shift?"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showOfferModal = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="submitOffer" class="btn-primary" :disabled="!newTrade.shiftId">
            Post Trade Offer
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAcceptModal" class="modal-overlay" @click="showAcceptModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Accept Trade</h2>
          <button @click="showAcceptModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="accept-summary">
            <h3>You're accepting this trade:</h3>
            <div class="trade-preview">
              <div class="preview-shift">
                <span class="preview-label">Their Shift:</span>
                <div class="preview-details">
                  <span>{{ formatDate(selectedTrade?.offering_shift?.shift_date) }}</span>
                  <span>{{ formatShiftTime(selectedTrade?.offering_shift) }}</span>
                  <span>{{ selectedTrade?.offering_shift?.station }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedTrade?.trade_type === 'swap'" class="form-group">
            <label>Select Your Shift to Exchange</label>
            <select v-model="acceptingShiftId" class="form-select">
              <option value="">Choose a shift...</option>
              <option v-for="shift in myUpcomingShifts" :key="shift.id" :value="shift.id">
                {{ formatDate(shift.shift_date) }} - {{ formatShiftTime(shift) }} ({{ shift.station }})
              </option>
            </select>
          </div>

          <div class="trade-notice">
            <span class="notice-icon">ℹ️</span>
            <span class="notice-text">
              This trade requires management approval before it takes effect.
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAcceptModal = false" class="btn-secondary">
            Cancel
          </button>
          <button
            @click="confirmAccept"
            class="btn-primary"
            :disabled="selectedTrade?.trade_type === 'swap' && !acceptingShiftId"
          >
            Confirm Trade
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const organizationId = ref('org-123')
const shiftTrades = useShiftTrades()
const scheduling = useScheduling()
const auth = useAuth()

const currentTab = ref('marketplace')
const filterType = ref('')
const filterStation = ref('')
const isManager = ref(true)

const trades = ref<any[]>([])
const myUpcomingShifts = ref<any[]>([])
const showOfferModal = ref(false)
const showAcceptModal = ref(false)
const selectedTrade = ref<any>(null)
const acceptingShiftId = ref('')

const newTrade = ref({
  shiftId: '',
  tradeType: 'swap',
  reason: ''
})

const tabs = computed(() => {
  const allTabs = [
    { key: 'marketplace', label: 'Marketplace', count: marketplaceTrades.value.length },
    { key: 'my-trades', label: 'My Trades', count: myTrades.value.length }
  ]

  if (isManager.value) {
    allTabs.push(
      { key: 'pending-approval', label: 'Pending Approval', count: pendingApproval.value.length }
    )
  }

  allTabs.push(
    { key: 'history', label: 'History', count: null }
  )

  return allTabs
})

const marketplaceTrades = computed(() => {
  return trades.value.filter(t => t.status === 'pending')
})

const myTrades = computed(() => {
  const user = auth.getUser()
  if (!user) return []
  return trades.value.filter(t =>
    (t.offering_user_id === user.id || t.requesting_user_id === user.id) &&
    !['management_approved', 'management_denied', 'cancelled'].includes(t.status)
  )
})

const pendingApproval = computed(() => {
  return trades.value.filter(t => t.status === 'accepted')
})

const completedTrades = computed(() => {
  return trades.value.filter(t =>
    ['management_approved', 'management_denied', 'cancelled'].includes(t.status)
  )
})

const filteredMarketplaceTrades = computed(() => {
  return marketplaceTrades.value.filter(trade => {
    if (filterType.value && trade.trade_type !== filterType.value) return false
    if (filterStation.value && trade.offering_shift?.station !== filterStation.value) return false
    return true
  })
})

const loadData = async () => {
  const user = await auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + 3)
  const endDate = futureDate.toISOString().split('T')[0]

  const [tradesData, shiftsData] = await Promise.all([
    shiftTrades.getShiftTrades(organizationId.value),
    scheduling.getScheduledShifts(organizationId.value, today, endDate)
  ])

  trades.value = tradesData
  myUpcomingShifts.value = shiftsData.filter(s =>
    s.user_id === user.id && s.status === 'scheduled' && s.shift_date >= today
  )
}

const filterTrades = () => {
  // Filtering is handled by computed property
}

const submitOffer = async () => {
  const result = await shiftTrades.offerShiftTrade({
    organizationId: organizationId.value,
    offeringShiftId: newTrade.value.shiftId,
    tradeType: newTrade.value.tradeType as 'swap' | 'giveaway' | 'cover',
    reason: newTrade.value.reason || undefined
  })

  if (result.success) {
    showOfferModal.value = false
    newTrade.value = {
      shiftId: '',
      tradeType: 'swap',
      reason: ''
    }
    loadData()
  }
}

const acceptTrade = (trade: any) => {
  selectedTrade.value = trade
  acceptingShiftId.value = ''
  showAcceptModal.value = true
}

const confirmAccept = async () => {
  if (!selectedTrade.value) return

  const result = await shiftTrades.acceptShiftTrade(
    selectedTrade.value.id,
    acceptingShiftId.value || undefined
  )

  if (result.success) {
    showAcceptModal.value = false
    selectedTrade.value = null
    loadData()
  }
}

const cancelTrade = async (tradeId: string) => {
  if (confirm('Are you sure you want to cancel this trade?')) {
    await shiftTrades.cancelShiftTrade(tradeId, 'Cancelled by user')
    loadData()
  }
}

const approveTrade = async (tradeId: string, approved: boolean, notes?: string) => {
  await shiftTrades.approveShiftTrade(tradeId, approved, notes)
  loadData()
}

const reviewTrade = (trade: any, action: string) => {
  const approved = action === 'approve'
  approveTrade(trade.id, approved)
}

const isMyTrade = (trade: any) => {
  const user = auth.getUser()
  return user && trade.offering_user_id === user.id
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatShiftTime = (shift: any) => {
  if (!shift) return ''
  const start = new Date(shift.start_time)
  const end = new Date(shift.end_time)
  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.trades-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-dark-400);
  color: #ffffff;
}

.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-4);
}

.trade-card {
  background: var(--color-dark-300);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-4);
  transition: all 0.2s ease;
  cursor: pointer;
}

.trade-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary-500);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.trade-type-badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.type-swap {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.type-giveaway {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.type-cover {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.trade-date {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  font-weight: 600;
}

.trade-shift-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.shift-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.detail-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  font-weight: 600;
}

.shift-block {
  padding: var(--spacing-3);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  color: #ffffff;
}

.shift-name {
  font-weight: 700;
  font-size: 1rem;
}

.shift-time,
.shift-station {
  font-size: 0.875rem;
  opacity: 0.9;
}

.shift-placeholder {
  padding: var(--spacing-3);
  border: 2px dashed var(--color-dark-50);
  border-radius: var(--border-radius-md);
  text-align: center;
  color: var(--color-gray-400);
  font-size: 0.875rem;
}

.shift-separator {
  font-size: 1.5rem;
  color: var(--color-primary-500);
}

.trade-reason {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-3);
}

.reason-icon {
  font-size: 1.25rem;
}

.reason-text {
  font-size: 0.875rem;
  color: var(--color-gray-300);
  font-style: italic;
}

.trade-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-dark-50);
}

.trade-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-dark-400);
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.btn-accept {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--border-radius-md);
  color: var(--color-dark-400);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-accept:hover {
  background: #e65f00;
  transform: scale(1.05);
}

.my-trade-badge {
  padding: var(--spacing-2) var(--spacing-3);
  background: rgba(107, 114, 128, 0.2);
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  color: var(--color-gray-400);
  font-weight: 600;
}

.trades-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.trade-list-item {
  display: flex;
  background: var(--color-dark-300);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.trade-list-item:hover {
  transform: translateX(4px);
}

.trade-status-bar {
  width: 4px;
  background: var(--color-gray-500);
}

.trade-list-item.status-pending .trade-status-bar {
  background: #f59e0b;
}

.trade-list-item.status-accepted .trade-status-bar {
  background: #3b82f6;
}

.trade-list-item.status-management_approved .trade-status-bar {
  background: #10b981;
}

.trade-list-item.status-management_denied .trade-status-bar,
.trade-list-item.status-cancelled .trade-status-bar {
  background: #ef4444;
}

.trade-content {
  flex: 1;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.trade-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-badge.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.status-accepted {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.status-badge.status-management_approved {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.status-management_denied,
.status-badge.status-cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.trade-shifts {
  display: flex;
  gap: var(--spacing-4);
}

.offering-shift,
.requesting-shift {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.shift-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  font-weight: 600;
}

.shift-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.shift-info span {
  font-size: 0.875rem;
  color: var(--color-gray-300);
}

.trade-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-dark-50);
}

.trade-time {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.trade-approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.participants {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.participant {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.participant-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.participant-name {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.participants .separator {
  font-size: 1.25rem;
  color: var(--color-primary-500);
}

.trade-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.detail-card {
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.card-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  font-weight: 600;
}

.card-date {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.card-time,
.card-station {
  font-size: 0.875rem;
  color: var(--color-gray-300);
}

.trade-reason-box {
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  display: flex;
  gap: var(--spacing-2);
}

.approval-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-dark-50);
}

.approval-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.participants-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.participants-inline .separator {
  color: var(--color-gray-500);
}

.trade-summary {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.trade-completed-date {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.trade-type-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover {
  border-color: var(--color-primary-500);
}

.radio-option input[type="radio"]:checked + .option-content {
  color: var(--color-primary-500);
}

.radio-option input[type="radio"] {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary-500);
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.option-title {
  font-weight: 700;
  font-size: 1rem;
}

.option-desc {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.accept-summary {
  margin-bottom: var(--spacing-4);
}

.accept-summary h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: #ffffff;
}

.trade-preview {
  padding: var(--spacing-4);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-lg);
}

.preview-shift {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.preview-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-weight: 600;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.preview-details span {
  font-size: 1rem;
  color: #ffffff;
}

.trade-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-3);
}

.notice-icon {
  font-size: 1.25rem;
}

.notice-text {
  font-size: 0.875rem;
  color: #3b82f6;
}
</style>
