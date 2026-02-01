<template>
  <div class="timeoff-container">
    <div class="page-header">
      <div class="header-content">
        <h1>Time-Off Management</h1>
        <p class="subtitle">Request and manage time off for your team</p>
      </div>
      <button @click="showRequestModal = true" class="btn-primary">
        <span class="icon">+</span>
        New Request
      </button>
    </div>

    <div class="timeoff-stats">
      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-icon">🏖️</span>
          <span class="balance-type">Vacation</span>
        </div>
        <div class="balance-details">
          <div class="balance-main">
            <span class="balance-value">{{ myBalance.vacation.available - myBalance.vacation.used }}</span>
            <span class="balance-label">hours available</span>
          </div>
          <div class="balance-secondary">
            <div class="balance-item">
              <span class="label">Used:</span>
              <span class="value">{{ myBalance.vacation.used }}h</span>
            </div>
            <div class="balance-item">
              <span class="label">Pending:</span>
              <span class="value">{{ myBalance.vacation.pending }}h</span>
            </div>
          </div>
        </div>
      </div>

      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-icon">🤒</span>
          <span class="balance-type">Sick Leave</span>
        </div>
        <div class="balance-details">
          <div class="balance-main">
            <span class="balance-value">{{ myBalance.sick.available - myBalance.sick.used }}</span>
            <span class="balance-label">hours available</span>
          </div>
          <div class="balance-secondary">
            <div class="balance-item">
              <span class="label">Used:</span>
              <span class="value">{{ myBalance.sick.used }}h</span>
            </div>
            <div class="balance-item">
              <span class="label">Pending:</span>
              <span class="value">{{ myBalance.sick.pending }}h</span>
            </div>
          </div>
        </div>
      </div>

      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-icon">📅</span>
          <span class="balance-type">Personal</span>
        </div>
        <div class="balance-details">
          <div class="balance-main">
            <span class="balance-value">{{ myBalance.personal.available - myBalance.personal.used }}</span>
            <span class="balance-label">hours available</span>
          </div>
          <div class="balance-secondary">
            <div class="balance-item">
              <span class="label">Used:</span>
              <span class="value">{{ myBalance.personal.used }}h</span>
            </div>
            <div class="balance-item">
              <span class="label">Pending:</span>
              <span class="value">{{ myBalance.personal.pending }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="timeoff-tabs">
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

    <div class="timeoff-filters">
      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or reason..."
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal</option>
          <option value="bereavement">Bereavement</option>
          <option value="training">Training</option>
        </select>

        <select v-model="filterMonth" class="filter-select">
          <option value="">All Months</option>
          <option v-for="month in 12" :key="month" :value="month">
            {{ new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' }) }}
          </option>
        </select>
      </div>
    </div>

    <div class="timeoff-content">
      <div v-if="currentTab === 'my-requests'" class="requests-list">
        <div
          v-for="request in filteredMyRequests"
          :key="request.id"
          :class="['request-card', `status-${request.status}`]"
        >
          <div class="request-status-indicator"></div>
          <div class="request-content">
            <div class="request-header">
              <div class="request-type">
                <span class="type-icon">{{ getTypeIcon(request.request_type) }}</span>
                <span class="type-label">{{ request.request_type }}</span>
              </div>
              <span :class="['status-badge', `status-${request.status}`]">
                {{ request.status }}
              </span>
            </div>

            <div class="request-dates">
              <div class="date-range">
                <span class="date-label">From:</span>
                <span class="date-value">{{ formatDate(request.start_date) }}</span>
              </div>
              <span class="date-separator">→</span>
              <div class="date-range">
                <span class="date-label">To:</span>
                <span class="date-value">{{ formatDate(request.end_date) }}</span>
              </div>
              <div class="date-duration">
                <span class="duration-value">{{ request.total_hours }}h</span>
              </div>
            </div>

            <div v-if="request.reason" class="request-reason">
              <span class="reason-label">Reason:</span>
              <span class="reason-text">{{ request.reason }}</span>
            </div>

            <div v-if="request.review_notes" class="request-review">
              <span class="review-label">Review Notes:</span>
              <span class="review-text">{{ request.review_notes }}</span>
            </div>

            <div class="request-footer">
              <span class="request-date">
                Submitted {{ formatDateTime(request.submitted_at) }}
              </span>
              <div v-if="request.status === 'pending'" class="request-actions">
                <button @click="cancelRequest(request.id)" class="btn-cancel">
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredMyRequests.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No Requests Found</h3>
          <p>You haven't submitted any time-off requests yet.</p>
          <button @click="showRequestModal = true" class="btn-primary">
            Create Your First Request
          </button>
        </div>
      </div>

      <div v-else-if="currentTab === 'pending-approval'" class="requests-list">
        <div
          v-for="request in pendingApprovals"
          :key="request.id"
          class="request-card approval-card"
        >
          <div class="request-status-indicator"></div>
          <div class="request-content">
            <div class="request-header">
              <div class="user-info">
                <span class="user-name">{{ request.user?.full_name }}</span>
                <span class="user-email">{{ request.user?.email }}</span>
              </div>
              <div class="request-type">
                <span class="type-icon">{{ getTypeIcon(request.request_type) }}</span>
                <span class="type-label">{{ request.request_type }}</span>
              </div>
            </div>

            <div class="request-dates">
              <div class="date-range">
                <span class="date-label">From:</span>
                <span class="date-value">{{ formatDate(request.start_date) }}</span>
              </div>
              <span class="date-separator">→</span>
              <div class="date-range">
                <span class="date-label">To:</span>
                <span class="date-value">{{ formatDate(request.end_date) }}</span>
              </div>
              <div class="date-duration">
                <span class="duration-value">{{ request.total_hours }}h</span>
              </div>
            </div>

            <div v-if="request.reason" class="request-reason">
              <span class="reason-label">Reason:</span>
              <span class="reason-text">{{ request.reason }}</span>
            </div>

            <div class="request-footer">
              <span class="request-date">
                Submitted {{ formatDateTime(request.submitted_at) }}
              </span>
              <div class="approval-actions">
                <button
                  @click="openReviewModal(request, 'deny')"
                  class="btn-deny"
                >
                  Deny
                </button>
                <button
                  @click="openReviewModal(request, 'approve')"
                  class="btn-approve"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pendingApprovals.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>All Caught Up!</h3>
          <p>No pending time-off requests to review.</p>
        </div>
      </div>

      <div v-else-if="currentTab === 'team-calendar'" class="calendar-view">
        <div class="calendar-controls">
          <button @click="previousMonth" class="nav-btn">&larr;</button>
          <h3>{{ calendarMonth }}</h3>
          <button @click="nextMonth" class="nav-btn">&rarr;</button>
        </div>

        <div class="team-calendar">
          <div class="calendar-header">
            <div class="day-header" v-for="day in daysOfWeek" :key="day">
              {{ day }}
            </div>
          </div>
          <div class="calendar-body">
            <div
              v-for="day in calendarDays"
              :key="day.date"
              :class="['calendar-day', {
                'is-today': day.isToday,
                'is-other-month': day.isOtherMonth,
                'has-timeoff': day.timeOffRequests.length > 0
              }]"
            >
              <div class="day-number">{{ day.dayNumber }}</div>
              <div class="day-timeoff">
                <div
                  v-for="request in day.timeOffRequests.slice(0, 2)"
                  :key="request.id"
                  :class="['timeoff-indicator', `type-${request.request_type}`]"
                  :title="`${request.user?.full_name} - ${request.request_type}`"
                >
                  {{ request.user?.full_name?.split(' ')[0] }}
                </div>
                <div v-if="day.timeOffRequests.length > 2" class="more-requests">
                  +{{ day.timeOffRequests.length - 2 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="requests-list">
        <div
          v-for="request in filteredAllRequests"
          :key="request.id"
          :class="['request-card', `status-${request.status}`]"
        >
          <div class="request-status-indicator"></div>
          <div class="request-content">
            <div class="request-header">
              <div class="user-info">
                <span class="user-name">{{ request.user?.full_name }}</span>
              </div>
              <div class="request-type">
                <span class="type-icon">{{ getTypeIcon(request.request_type) }}</span>
                <span class="type-label">{{ request.request_type }}</span>
              </div>
              <span :class="['status-badge', `status-${request.status}`]">
                {{ request.status }}
              </span>
            </div>

            <div class="request-dates">
              <div class="date-range">
                <span class="date-value">{{ formatDate(request.start_date) }}</span>
              </div>
              <span class="date-separator">→</span>
              <div class="date-range">
                <span class="date-value">{{ formatDate(request.end_date) }}</span>
              </div>
              <div class="date-duration">
                <span class="duration-value">{{ request.total_hours }}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRequestModal" class="modal-overlay" @click="showRequestModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Request Time Off</h2>
          <button @click="showRequestModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Request Type</label>
            <select v-model="newRequest.requestType" class="form-select">
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="bereavement">Bereavement</option>
              <option value="training">Training</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" v-model="newRequest.startDate" class="form-input" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" v-model="newRequest.endDate" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newRequest.isPartialDay" />
              Partial Day (specify times)
            </label>
          </div>

          <div v-if="newRequest.isPartialDay" class="form-row">
            <div class="form-group">
              <label>Start Time</label>
              <input type="time" v-model="newRequest.startTime" class="form-input" />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input type="time" v-model="newRequest.endTime" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Reason (Optional)</label>
            <textarea
              v-model="newRequest.reason"
              class="form-textarea"
              rows="3"
              placeholder="Provide additional details..."
            ></textarea>
          </div>

          <div class="request-summary">
            <div class="summary-item">
              <span class="summary-label">Total Hours:</span>
              <span class="summary-value">{{ calculateTotalHours() }}h</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Balance After:</span>
              <span class="summary-value">
                {{ getBalanceAfter(newRequest.requestType, calculateTotalHours()) }}h
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showRequestModal = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="submitRequest" class="btn-primary" :disabled="!canSubmitRequest">
            Submit Request
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-overlay" @click="showReviewModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ reviewAction === 'approve' ? 'Approve' : 'Deny' }} Request</h2>
          <button @click="showReviewModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="review-summary">
            <div class="summary-row">
              <span class="label">Employee:</span>
              <span class="value">{{ reviewingRequest?.user?.full_name }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Type:</span>
              <span class="value">{{ reviewingRequest?.request_type }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Dates:</span>
              <span class="value">
                {{ formatDate(reviewingRequest?.start_date) }} - {{ formatDate(reviewingRequest?.end_date) }}
              </span>
            </div>
            <div class="summary-row">
              <span class="label">Hours:</span>
              <span class="value">{{ reviewingRequest?.total_hours }}h</span>
            </div>
          </div>

          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea
              v-model="reviewNotes"
              class="form-textarea"
              rows="3"
              :placeholder="reviewAction === 'approve' ? 'Add approval notes...' : 'Explain reason for denial...'"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showReviewModal = false" class="btn-secondary">
            Cancel
          </button>
          <button
            @click="submitReview"
            :class="reviewAction === 'approve' ? 'btn-approve' : 'btn-deny'"
          >
            {{ reviewAction === 'approve' ? 'Approve Request' : 'Deny Request' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const organizationId = ref('org-123')
const timeOff = useTimeOff()
const auth = useAuth()

const currentTab = ref('my-requests')
const searchQuery = ref('')
const filterType = ref('')
const filterMonth = ref('')
const calendarDate = ref(new Date())

const myRequests = ref<any[]>([])
const pendingApprovals = ref<any[]>([])
const allRequests = ref<any[]>([])
const myBalance = ref({
  vacation: { used: 0, pending: 0, available: 80 },
  sick: { used: 0, pending: 0, available: 40 },
  personal: { used: 0, pending: 0, available: 24 }
})

const showRequestModal = ref(false)
const showReviewModal = ref(false)
const reviewingRequest = ref<any>(null)
const reviewAction = ref<'approve' | 'deny'>('approve')
const reviewNotes = ref('')

const newRequest = ref({
  requestType: 'vacation',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  isPartialDay: false,
  reason: ''
})

const tabs = computed(() => [
  { key: 'my-requests', label: 'My Requests', count: myRequests.value.length },
  { key: 'pending-approval', label: 'Pending Approval', count: pendingApprovals.value.length },
  { key: 'team-calendar', label: 'Team Calendar', count: null },
  { key: 'all-requests', label: 'All Requests', count: allRequests.value.length }
])

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarMonth = computed(() => {
  return calendarDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const currentDateObj = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    const dateStr = currentDateObj.toISOString().split('T')[0]
    const dayRequests = allRequests.value.filter(r =>
      dateStr >= r.start_date && dateStr <= r.end_date && r.status === 'approved'
    )

    days.push({
      date: dateStr,
      dayNumber: currentDateObj.getDate(),
      isToday: dateStr === new Date().toISOString().split('T')[0],
      isOtherMonth: currentDateObj.getMonth() !== month,
      timeOffRequests: dayRequests
    })

    currentDateObj.setDate(currentDateObj.getDate() + 1)
  }

  return days
})

const filteredMyRequests = computed(() => {
  return myRequests.value.filter(req => {
    if (searchQuery.value && !req.reason?.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterType.value && req.request_type !== filterType.value) {
      return false
    }
    if (filterMonth.value) {
      const reqMonth = new Date(req.start_date).getMonth() + 1
      if (reqMonth !== parseInt(filterMonth.value)) {
        return false
      }
    }
    return true
  })
})

const filteredAllRequests = computed(() => {
  return allRequests.value.filter(req => {
    if (searchQuery.value && !req.user?.full_name?.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterType.value && req.request_type !== filterType.value) {
      return false
    }
    if (filterMonth.value) {
      const reqMonth = new Date(req.start_date).getMonth() + 1
      if (reqMonth !== parseInt(filterMonth.value)) {
        return false
      }
    }
    return true
  })
})

const canSubmitRequest = computed(() => {
  return newRequest.value.startDate && newRequest.value.endDate
})

const loadData = async () => {
  const user = await auth.getUser()
  if (!user) return

  const [myReqs, pending, all, balance] = await Promise.all([
    timeOff.getTimeOffRequests(organizationId.value, { userId: user.id }),
    timeOff.getPendingApprovals(organizationId.value),
    timeOff.getTimeOffRequests(organizationId.value),
    timeOff.getMyTimeOffBalance(user.id)
  ])

  myRequests.value = myReqs
  pendingApprovals.value = pending
  allRequests.value = all
  myBalance.value = balance
}

const submitRequest = async () => {
  const result = await timeOff.createTimeOffRequest({
    organizationId: organizationId.value,
    requestType: newRequest.value.requestType,
    startDate: newRequest.value.startDate,
    endDate: newRequest.value.endDate,
    startTime: newRequest.value.isPartialDay ? newRequest.value.startTime : undefined,
    endTime: newRequest.value.isPartialDay ? newRequest.value.endTime : undefined,
    isPartialDay: newRequest.value.isPartialDay,
    reason: newRequest.value.reason || undefined
  })

  if (result.success) {
    showRequestModal.value = false
    newRequest.value = {
      requestType: 'vacation',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isPartialDay: false,
      reason: ''
    }
    loadData()
  }
}

const cancelRequest = async (requestId: string) => {
  if (confirm('Are you sure you want to cancel this request?')) {
    await timeOff.cancelTimeOffRequest(requestId)
    loadData()
  }
}

const openReviewModal = (request: any, action: 'approve' | 'deny') => {
  reviewingRequest.value = request
  reviewAction.value = action
  reviewNotes.value = ''
  showReviewModal.value = true
}

const submitReview = async () => {
  if (reviewingRequest.value) {
    await timeOff.reviewTimeOffRequest(
      reviewingRequest.value.id,
      reviewAction.value,
      reviewNotes.value || undefined
    )
    showReviewModal.value = false
    reviewingRequest.value = null
    loadData()
  }
}

const calculateTotalHours = () => {
  if (!newRequest.value.startDate || !newRequest.value.endDate) return 0

  if (newRequest.value.isPartialDay && newRequest.value.startTime && newRequest.value.endTime) {
    const start = new Date(`2000-01-01T${newRequest.value.startTime}`)
    const end = new Date(`2000-01-01T${newRequest.value.endTime}`)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10
  }

  const start = new Date(newRequest.value.startDate)
  const end = new Date(newRequest.value.endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return days * 8
}

const getBalanceAfter = (type: string, hours: number) => {
  const typeKey = type.toLowerCase() as 'vacation' | 'sick' | 'personal'
  if (!myBalance.value[typeKey]) return 0
  return myBalance.value[typeKey].available - myBalance.value[typeKey].used - hours
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    vacation: '🏖️',
    sick: '🤒',
    personal: '📅',
    bereavement: '🕊️',
    training: '📚'
  }
  return icons[type.toLowerCase()] || '📝'
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

const previousMonth = () => {
  calendarDate.value = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() - 1)
}

const nextMonth = () => {
  calendarDate.value = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() + 1)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.timeoff-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-dark-400);
  color: #ffffff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  background: var(--color-dark-300);
  border-bottom: 2px solid var(--color-primary-500);
}

.header-content h1 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 2rem;
  color: var(--color-primary-500);
}

.subtitle {
  margin: 0;
  color: var(--color-gray-400);
}

.timeoff-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
  padding: var(--spacing-6);
  background: var(--color-dark-300);
  border-bottom: 1px solid var(--color-dark-50);
}

.balance-card {
  padding: var(--spacing-5);
  background: var(--color-dark-400);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  transition: all 0.2s ease;
}

.balance-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-500);
}

.balance-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.balance-icon {
  font-size: 1.5rem;
}

.balance-type {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
}

.balance-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.balance-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.balance-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.balance-label {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.balance-secondary {
  display: flex;
  gap: var(--spacing-4);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-dark-50);
}

.balance-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.balance-item .label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.balance-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.timeoff-tabs {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-dark-300);
  border-bottom: 1px solid var(--color-dark-50);
}

.tab-btn {
  padding: var(--spacing-3) var(--spacing-5);
  background: transparent;
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: var(--color-gray-400);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.tab-btn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-500);
}

.tab-btn.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-dark-400);
}

.tab-badge {
  padding: var(--spacing-1) var(--spacing-2);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}

.timeoff-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-dark-300);
  border-bottom: 1px solid var(--color-dark-50);
}

.filter-group {
  display: flex;
  gap: var(--spacing-3);
}

.search-input {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-dark-400);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: #ffffff;
  min-width: 300px;
}

.filter-select {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-dark-400);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: #ffffff;
}

.timeoff-content {
  flex: 1;
  padding: var(--spacing-6);
  overflow-y: auto;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.request-card {
  display: flex;
  background: var(--color-dark-300);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.request-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.request-status-indicator {
  width: 6px;
  background: var(--color-gray-500);
}

.request-card.status-pending .request-status-indicator {
  background: #f59e0b;
}

.request-card.status-approved .request-status-indicator {
  background: #10b981;
}

.request-card.status-denied .request-status-indicator {
  background: #ef4444;
}

.request-content {
  flex: 1;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.type-icon {
  font-size: 1.5rem;
}

.type-label {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  text-transform: capitalize;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.user-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
}

.user-email {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.status-approved {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.status-denied {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.request-dates {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.date-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.date-value {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.date-separator {
  font-size: 1.25rem;
  color: var(--color-gray-500);
}

.date-duration {
  margin-left: auto;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-primary-500);
  border-radius: var(--border-radius-md);
}

.duration-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-dark-400);
}

.request-reason,
.request-review {
  display: flex;
  gap: var(--spacing-2);
  font-size: 0.875rem;
}

.reason-label,
.review-label {
  font-weight: 600;
  color: var(--color-gray-400);
}

.reason-text,
.review-text {
  color: #ffffff;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-dark-50);
}

.request-date {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.request-actions,
.approval-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-cancel {
  padding: var(--spacing-2) var(--spacing-3);
  background: transparent;
  border: 1px solid var(--color-gray-500);
  border-radius: var(--border-radius-md);
  color: var(--color-gray-400);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-deny {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: var(--border-radius-md);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.btn-deny:hover {
  background: #ef4444;
  color: #ffffff;
}

.btn-approve {
  padding: var(--spacing-2) var(--spacing-4);
  background: #10b981;
  border: 1px solid #10b981;
  border-radius: var(--border-radius-md);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.btn-approve:hover {
  background: #059669;
  border-color: #059669;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1.5rem;
  color: #ffffff;
}

.empty-state p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-gray-400);
}

.calendar-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
}

.calendar-controls h3 {
  margin: 0;
  min-width: 200px;
  text-align: center;
  color: #ffffff;
}

.nav-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-dark-300);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: #ffffff;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.team-calendar {
  background: var(--color-dark-300);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--color-dark-200);
  border-bottom: 2px solid var(--color-primary-500);
}

.day-header {
  padding: var(--spacing-3);
  text-align: center;
  font-weight: 700;
  color: var(--color-primary-500);
  text-transform: uppercase;
  font-size: 0.875rem;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 1px;
  background: var(--color-dark-50);
}

.calendar-day {
  background: var(--color-dark-400);
  padding: var(--spacing-2);
  display: flex;
  flex-direction: column;
}

.calendar-day.is-today {
  background: rgba(255, 107, 0, 0.1);
  border: 2px solid var(--color-primary-500);
}

.calendar-day.is-other-month {
  opacity: 0.4;
}

.day-number {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: var(--spacing-2);
  color: #ffffff;
}

.day-timeoff {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
}

.timeoff-indicator {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  color: #ffffff;
  background: var(--color-primary-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-vacation {
  background: #3b82f6;
}

.type-sick {
  background: #ef4444;
}

.type-personal {
  background: #8b5cf6;
}

.more-requests {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-align: center;
  padding: var(--spacing-1);
}

.request-summary {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-3);
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.summary-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.review-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-4);
}

.summary-row {
  display: flex;
  justify-content: space-between;
}

.summary-row .label {
  font-weight: 600;
  color: var(--color-gray-400);
}

.summary-row .value {
  font-weight: 700;
  color: #ffffff;
}
</style>
