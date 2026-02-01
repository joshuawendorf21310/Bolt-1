<template>
  <div class="analytics-container">
    <div class="page-header">
      <div class="header-content">
        <h1>Schedule Analytics & Reports</h1>
        <p class="subtitle">Insights and metrics for optimizing your scheduling</p>
      </div>
      <div class="header-actions">
        <select v-model="dateRange" class="date-range-select" @change="loadAnalytics">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
        <button @click="exportReport" class="btn-secondary">
          <span class="icon">📊</span>
          Export Report
        </button>
      </div>
    </div>

    <div class="analytics-grid">
      <div class="metric-card highlight">
        <div class="metric-header">
          <span class="metric-icon">👥</span>
          <span class="metric-title">Total Shifts</span>
        </div>
        <div class="metric-value">{{ analytics.totalShifts }}</div>
        <div class="metric-change positive">
          <span class="change-icon">↑</span>
          <span>12% from last period</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">⏰</span>
          <span class="metric-title">Total Hours</span>
        </div>
        <div class="metric-value">{{ analytics.totalHours.toLocaleString() }}h</div>
        <div class="metric-footer">
          <span>Avg {{ (analytics.totalHours / analytics.totalShifts).toFixed(1) }}h per shift</span>
        </div>
      </div>

      <div class="metric-card warning">
        <div class="metric-header">
          <span class="metric-icon">⚡</span>
          <span class="metric-title">Overtime Hours</span>
        </div>
        <div class="metric-value">{{ analytics.overtimeHours }}h</div>
        <div class="metric-footer">
          <span>{{ ((analytics.overtimeHours / analytics.totalHours) * 100).toFixed(1) }}% of total</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">💰</span>
          <span class="metric-title">Labor Cost</span>
        </div>
        <div class="metric-value">${{ analytics.estimatedCost.toLocaleString() }}</div>
        <div class="metric-footer">
          <span>Estimated</span>
        </div>
      </div>

      <div class="metric-card success">
        <div class="metric-header">
          <span class="metric-icon">✓</span>
          <span class="metric-title">Coverage Rate</span>
        </div>
        <div class="metric-value">{{ analytics.coverageRate }}%</div>
        <div class="metric-change positive">
          <span class="change-icon">↑</span>
          <span>Excellent</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🔄</span>
          <span class="metric-title">Shift Trades</span>
        </div>
        <div class="metric-value">{{ analytics.totalTrades }}</div>
        <div class="metric-footer">
          <span>{{ analytics.approvedTrades }} approved</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🏖️</span>
          <span class="metric-title">Time Off Requests</span>
        </div>
        <div class="metric-value">{{ analytics.timeOffRequests }}</div>
        <div class="metric-footer">
          <span>{{ analytics.timeOffHours }}h total</span>
        </div>
      </div>

      <div class="metric-card danger">
        <div class="metric-header">
          <span class="metric-icon">⚠️</span>
          <span class="metric-title">Fatigue Violations</span>
        </div>
        <div class="metric-value">{{ analytics.fatigueViolations }}</div>
        <div class="metric-footer">
          <span>Requires attention</span>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-card full-width">
        <div class="chart-header">
          <h3>Shifts Over Time</h3>
          <div class="chart-controls">
            <button
              v-for="type in ['daily', 'weekly', 'monthly']"
              :key="type"
              @click="shiftsChartView = type"
              :class="['chart-btn', { active: shiftsChartView === type }]"
            >
              {{ type }}
            </button>
          </div>
        </div>
        <div class="chart-body">
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div v-for="(value, index) in shiftsData" :key="index" class="bar-group">
                <div class="bar" :style="{ height: `${(value / Math.max(...shiftsData)) * 100}%` }">
                  <span class="bar-value">{{ value }}</span>
                </div>
                <span class="bar-label">{{ getShiftLabel(index) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Staffing by Certification</h3>
        </div>
        <div class="chart-body">
          <div class="donut-chart">
            <div class="donut-segments">
              <div
                v-for="(cert, index) in certificationData"
                :key="cert.name"
                class="donut-segment"
                :style="{
                  '--percentage': cert.percentage,
                  '--rotation': getRotation(index),
                  '--color': cert.color
                }"
              ></div>
            </div>
            <div class="donut-center">
              <span class="donut-value">{{ analytics.uniqueStaff }}</span>
              <span class="donut-label">Total Staff</span>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="cert in certificationData" :key="cert.name" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: cert.color }"></span>
              <span class="legend-label">{{ cert.name }}</span>
              <span class="legend-value">{{ cert.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Station Distribution</h3>
        </div>
        <div class="chart-body">
          <div class="horizontal-bars">
            <div v-for="station in stationData" :key="station.name" class="h-bar-row">
              <span class="h-bar-label">{{ station.name }}</span>
              <div class="h-bar-container">
                <div class="h-bar-fill" :style="{ width: `${station.percentage}%`, backgroundColor: station.color }">
                  <span class="h-bar-value">{{ station.count }}</span>
                </div>
              </div>
              <span class="h-bar-percentage">{{ station.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Shift Types</h3>
        </div>
        <div class="chart-body">
          <div class="pie-chart-container">
            <svg viewBox="0 0 100 100" class="pie-chart">
              <circle
                v-for="(segment, index) in shiftTypeSegments"
                :key="index"
                cx="50"
                cy="50"
                r="40"
                :stroke="segment.color"
                stroke-width="20"
                fill="transparent"
                :stroke-dasharray="`${segment.percentage} ${100 - segment.percentage}`"
                :stroke-dashoffset="segment.offset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="pie-center">
              <span class="pie-value">{{ shiftTypes.length }}</span>
              <span class="pie-label">Types</span>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="type in shiftTypes" :key="type.name" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: type.color }"></span>
              <span class="legend-label">{{ type.name }}</span>
              <span class="legend-value">{{ type.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card full-width">
        <div class="chart-header">
          <h3>Workload Distribution</h3>
          <span class="chart-subtitle">Hours by employee</span>
        </div>
        <div class="chart-body">
          <div class="workload-chart">
            <div v-for="employee in workloadData" :key="employee.id" class="workload-row">
              <div class="employee-info">
                <span class="employee-avatar">{{ getInitials(employee.name) }}</span>
                <div class="employee-details">
                  <span class="employee-name">{{ employee.name }}</span>
                  <span class="employee-cert">{{ employee.certification }}</span>
                </div>
              </div>
              <div class="workload-bar-container">
                <div
                  class="workload-bar"
                  :style="{
                    width: `${(employee.hours / maxHours) * 100}%`,
                    backgroundColor: getWorkloadColor(employee.hours)
                  }"
                >
                  <span class="workload-hours">{{ employee.hours }}h</span>
                </div>
              </div>
              <div class="workload-stats">
                <span class="shifts-count">{{ employee.shifts }} shifts</span>
                <span :class="['overtime-badge', { warning: employee.overtime > 0 }]">
                  {{ employee.overtime }}h OT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Top Performers</h3>
          <span class="chart-subtitle">Most shifts completed</span>
        </div>
        <div class="chart-body">
          <div class="leaderboard">
            <div v-for="(performer, index) in topPerformers" :key="performer.id" class="leaderboard-item">
              <div class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <span class="performer-avatar">{{ getInitials(performer.name) }}</span>
              <div class="performer-info">
                <span class="performer-name">{{ performer.name }}</span>
                <span class="performer-stats">{{ performer.shifts }} shifts</span>
              </div>
              <div class="performer-score">
                <span class="score-value">{{ performer.hours }}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Recent Activity</h3>
        </div>
        <div class="chart-body">
          <div class="activity-timeline">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="`activity-${activity.type}`">
                {{ activity.icon }}
              </div>
              <div class="activity-content">
                <span class="activity-text">{{ activity.text }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="reports-section">
      <h2>Quick Reports</h2>
      <div class="reports-grid">
        <div class="report-card">
          <div class="report-icon">📋</div>
          <h3>Staffing Report</h3>
          <p>Complete breakdown of current staffing levels and coverage</p>
          <button @click="generateReport('staffing')" class="btn-report">Generate</button>
        </div>

        <div class="report-card">
          <div class="report-icon">💰</div>
          <h3>Payroll Report</h3>
          <p>Hours worked, overtime, and estimated labor costs</p>
          <button @click="generateReport('payroll')" class="btn-report">Generate</button>
        </div>

        <div class="report-card">
          <div class="report-icon">🔄</div>
          <h3>Shift Changes Report</h3>
          <p>All trades, swaps, and schedule modifications</p>
          <button @click="generateReport('changes')" class="btn-report">Generate</button>
        </div>

        <div class="report-card">
          <div class="report-icon">⚠️</div>
          <h3>Compliance Report</h3>
          <p>Fatigue violations, overtime limits, and regulatory compliance</p>
          <button @click="generateReport('compliance')" class="btn-report">Generate</button>
        </div>

        <div class="report-card">
          <div class="report-icon">📊</div>
          <h3>Performance Report</h3>
          <p>Individual and team performance metrics</p>
          <button @click="generateReport('performance')" class="btn-report">Generate</button>
        </div>

        <div class="report-card">
          <div class="report-icon">📈</div>
          <h3>Trends Analysis</h3>
          <p>Historical data and predictive insights</p>
          <button @click="generateReport('trends')" class="btn-report">Generate</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dateRange = ref('30')
const shiftsChartView = ref('daily')

const analytics = ref({
  totalShifts: 432,
  totalHours: 3456,
  overtimeHours: 156,
  estimatedCost: 172800,
  coverageRate: 96,
  totalTrades: 28,
  approvedTrades: 24,
  timeOffRequests: 45,
  timeOffHours: 360,
  fatigueViolations: 3,
  uniqueStaff: 48
})

const shiftsData = ref([42, 45, 38, 48, 52, 44, 41, 46, 50, 43, 39, 47, 49, 44])

const certificationData = ref([
  { name: 'Paramedic', count: 18, percentage: 37.5, color: '#ff6b00' },
  { name: 'EMT-Advanced', count: 15, percentage: 31.25, color: '#3b82f6' },
  { name: 'EMT-Basic', count: 12, percentage: 25, color: '#10b981' },
  { name: 'Other', count: 3, percentage: 6.25, color: '#8b5cf6' }
])

const stationData = ref([
  { name: 'Station 1', count: 156, percentage: 36, color: '#ff6b00' },
  { name: 'Station 2', count: 142, percentage: 33, color: '#3b82f6' },
  { name: 'Station 3', count: 98, percentage: 23, color: '#10b981' },
  { name: 'Station 4', count: 36, percentage: 8, color: '#f59e0b' }
])

const shiftTypes = ref([
  { name: 'Regular', count: 324, percentage: 75, color: '#3b82f6' },
  { name: 'Overtime', count: 72, percentage: 17, color: '#f59e0b' },
  { name: 'Holiday', count: 24, percentage: 5, color: '#10b981' },
  { name: 'Training', count: 12, percentage: 3, color: '#8b5cf6' }
])

const workloadData = ref([
  { id: 1, name: 'John Smith', certification: 'Paramedic', hours: 168, shifts: 21, overtime: 8 },
  { id: 2, name: 'Sarah Johnson', certification: 'EMT-Advanced', hours: 152, shifts: 19, overtime: 0 },
  { id: 3, name: 'Michael Brown', certification: 'Paramedic', hours: 176, shifts: 22, overtime: 16 },
  { id: 4, name: 'Emily Davis', certification: 'EMT-Basic', hours: 144, shifts: 18, overtime: 4 },
  { id: 5, name: 'David Wilson', certification: 'Paramedic', hours: 160, shifts: 20, overtime: 0 },
  { id: 6, name: 'Jessica Martinez', certification: 'EMT-Advanced', hours: 136, shifts: 17, overtime: 0 }
])

const topPerformers = ref([
  { id: 1, name: 'Michael Brown', shifts: 22, hours: 176 },
  { id: 2, name: 'John Smith', shifts: 21, hours: 168 },
  { id: 3, name: 'David Wilson', shifts: 20, hours: 160 }
])

const recentActivities = ref([
  { id: 1, type: 'shift', icon: '📅', text: 'New shift created for Station 1', time: '5m ago' },
  { id: 2, type: 'trade', icon: '🔄', text: 'Shift trade approved between John and Sarah', time: '12m ago' },
  { id: 3, type: 'timeoff', icon: '🏖️', text: 'Time-off request approved for Emily Davis', time: '23m ago' },
  { id: 4, type: 'alert', icon: '⚠️', text: 'Fatigue alert for Michael Brown', time: '1h ago' },
  { id: 5, type: 'shift', icon: '📅', text: 'Shift confirmed by David Wilson', time: '2h ago' }
])

const maxHours = computed(() => Math.max(...workloadData.value.map(e => e.hours)))

const shiftTypeSegments = computed(() => {
  let offset = 0
  return shiftTypes.value.map(type => {
    const segment = {
      percentage: (type.count / analytics.value.totalShifts) * 100,
      color: type.color,
      offset: offset
    }
    offset -= segment.percentage
    return segment
  })
})

const getShiftLabel = (index: number) => {
  if (shiftsChartView.value === 'daily') {
    const date = new Date()
    date.setDate(date.getDate() - (shiftsData.value.length - index - 1))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `Week ${index + 1}`
}

const getRotation = (index: number) => {
  let rotation = 0
  for (let i = 0; i < index; i++) {
    rotation += certificationData.value[i].percentage * 3.6
  }
  return rotation
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getWorkloadColor = (hours: number) => {
  if (hours > 160) return '#ef4444'
  if (hours > 140) return '#f59e0b'
  return '#10b981'
}

const loadAnalytics = () => {
  // Load analytics data based on date range
  console.log('Loading analytics for', dateRange.value, 'days')
}

const exportReport = () => {
  console.log('Exporting report...')
  alert('Report export functionality coming soon!')
}

const generateReport = (type: string) => {
  console.log('Generating', type, 'report')
  alert(`Generating ${type} report...`)
}
</script>

<style scoped>
.analytics-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-dark-400);
  color: #ffffff;
  padding: var(--spacing-6);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

.date-range-select {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-dark-300);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: #ffffff;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.metric-card {
  padding: var(--spacing-5);
  background: var(--color-dark-300);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-500);
}

.metric-card.highlight {
  border-color: var(--color-primary-500);
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, var(--color-dark-300) 100%);
}

.metric-card.success {
  border-color: #10b981;
}

.metric-card.warning {
  border-color: #f59e0b;
}

.metric-card.danger {
  border-color: #ef4444;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.metric-icon {
  font-size: 1.5rem;
}

.metric-title {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  font-weight: 600;
  text-transform: uppercase;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: var(--spacing-2);
}

.metric-change,
.metric-footer {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.metric-change.positive {
  color: #10b981;
}

.change-icon {
  font-weight: 700;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.chart-card {
  background: var(--color-dark-300);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-5);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.chart-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #ffffff;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.chart-controls {
  display: flex;
  gap: var(--spacing-2);
}

.chart-btn {
  padding: var(--spacing-1) var(--spacing-3);
  background: transparent;
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: var(--color-gray-400);
  cursor: pointer;
  font-size: 0.875rem;
  text-transform: capitalize;
  transition: all 0.2s ease;
}

.chart-btn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-500);
}

.chart-btn.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-dark-400);
}

.chart-body {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  width: 100%;
  gap: var(--spacing-2);
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  background: var(--color-primary-500);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: var(--spacing-1);
  transition: all 0.3s ease;
}

.bar:hover {
  background: #e65f00;
  transform: scaleY(1.05);
}

.bar-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
}

.bar-label {
  margin-top: var(--spacing-2);
  font-size: 0.75rem;
  color: var(--color-gray-500);
  transform: rotate(-45deg);
  transform-origin: center;
  white-space: nowrap;
}

.donut-chart {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
}

.donut-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.chart-legend {
  margin-top: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: var(--border-radius-sm);
}

.legend-label {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-gray-300);
}

.legend-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
}

.horizontal-bars {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.h-bar-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  align-items: center;
  gap: var(--spacing-3);
}

.h-bar-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-300);
}

.h-bar-container {
  height: 32px;
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.h-bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.5s ease;
}

.h-bar-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
}

.h-bar-percentage {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  text-align: right;
}

.workload-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.workload-row {
  display: grid;
  grid-template-columns: 200px 1fr 150px;
  align-items: center;
  gap: var(--spacing-3);
}

.employee-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.employee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--color-dark-400);
}

.employee-details {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.employee-cert {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.workload-bar-container {
  height: 40px;
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.workload-bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-2);
  transition: width 0.5s ease;
}

.workload-hours {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
}

.workload-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  text-align: right;
}

.shifts-count {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.overtime-badge {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.overtime-badge.warning {
  color: #f59e0b;
  font-weight: 700;
}

.leaderboard {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: var(--color-gray-600);
  color: #ffffff;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: var(--color-dark-400);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: var(--color-dark-400);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #e6a862);
  color: var(--color-dark-400);
}

.performer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--color-dark-400);
}

.performer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.performer-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.performer-stats {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.performer-score {
  text-align: right;
}

.score-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-dark-400);
  font-size: 1rem;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.activity-text {
  font-size: 0.875rem;
  color: #ffffff;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.reports-section {
  margin-top: var(--spacing-4);
}

.reports-section h2 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 1.5rem;
  color: #ffffff;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
}

.report-card {
  padding: var(--spacing-5);
  background: var(--color-dark-300);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  text-align: center;
  transition: all 0.2s ease;
}

.report-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary-500);
}

.report-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-3);
}

.report-card h3 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1.125rem;
  color: #ffffff;
}

.report-card p {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 0.875rem;
  color: var(--color-gray-400);
  line-height: 1.5;
}

.btn-report {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--border-radius-md);
  color: var(--color-dark-400);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-report:hover {
  background: #e65f00;
  transform: scale(1.05);
}
</style>
