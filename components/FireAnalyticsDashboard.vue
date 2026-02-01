<template>
  <div class="analytics-dashboard">
    <header class="analytics-header">
      <h2>Incident Analytics & Performance</h2>
      <div class="time-filters">
        <button :class="['filter-btn', { active: timeRange === '7d' }]" @click="timeRange = '7d'">
          7 Days
        </button>
        <button :class="['filter-btn', { active: timeRange === '30d' }]" @click="timeRange = '30d'">
          30 Days
        </button>
        <button :class="['filter-btn', { active: timeRange === '90d' }]" @click="timeRange = '90d'">
          90 Days
        </button>
        <button :class="['filter-btn', { active: timeRange === '1y' }]" @click="timeRange = '1y'">
          1 Year
        </button>
      </div>
    </header>

    <div class="analytics-grid">
      <!-- KPI Cards -->
      <section class="kpi-section">
        <div class="kpi-card">
          <span class="kpi-label">Total Incidents</span>
          <span class="kpi-value">{{ metrics.totalIncidents }}</span>
          <span class="kpi-change positive">+12% vs last period</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Avg Response Time</span>
          <span class="kpi-value">{{ metrics.avgResponseTime }}</span>
          <span class="kpi-change positive">↓ 2:15 min improvement</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Dispatch Accuracy</span>
          <span class="kpi-value">{{ metrics.dispatchAccuracy }}</span>
          <span class="kpi-change positive">+3.2% accuracy</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Personnel Available</span>
          <span class="kpi-value">{{ metrics.personnelAvailable }}</span>
          <span class="kpi-change">{{ metrics.certExpiring }} certs expiring</span>
        </div>
      </section>

      <!-- Incident Type Distribution -->
      <section class="chart-section incident-types">
        <h3>Incidents by Type</h3>
        <div class="chart-container">
          <div class="chart-bar-group">
            <div v-for="type in incidentTypes" :key="type.name" class="chart-bar">
              <div class="bar-label">{{ type.name }}</div>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: type.percentage + '%' }"></div>
              </div>
              <div class="bar-value">{{ type.count }} ({{ type.percentage }}%)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Response Time Trends -->
      <section class="chart-section response-times">
        <h3>Response Time Trend</h3>
        <div class="trend-chart">
          <svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 0.3"/>
                <stop offset="100%" style="stop-color: #3b82f6; stop-opacity: 0"/>
              </linearGradient>
            </defs>
            <polyline points="10,100 50,85 90,95 130,70 170,60 210,75 250,50 290,40 330,55 370,35" fill="none" stroke="#3b82f6" stroke-width="2"/>
            <polygon points="10,100 50,85 90,95 130,70 170,60 210,75 250,50 290,40 330,55 370,35 370,150 10,150" fill="url(#trendGradient)"/>
          </svg>
          <div class="trend-labels">
            <span>6:45</span>
            <span>5:30</span>
            <span>4:15</span>
          </div>
        </div>
      </section>

      <!-- Severity Distribution -->
      <section class="chart-section severity">
        <h3>Incidents by Severity</h3>
        <div class="severity-grid">
          <div v-for="level in severityLevels" :key="level.level" class="severity-item">
            <div class="severity-color" :class="`level-${level.level}`"></div>
            <span class="severity-label">{{ level.label }}</span>
            <span class="severity-count">{{ level.count }}</span>
            <span class="severity-percent">{{ level.percent }}%</span>
          </div>
        </div>
      </section>

      <!-- Station Performance -->
      <section class="chart-section stations">
        <h3>Station Performance</h3>
        <div class="stations-table">
          <div class="table-header">
            <span class="station-col">Station</span>
            <span class="calls-col">Calls</span>
            <span class="avg-response-col">Avg Response</span>
            <span class="safety-col">Safety Score</span>
          </div>
          <div v-for="station in stationPerformance" :key="station.id" class="table-row">
            <span class="station-col">{{ station.name }}</span>
            <span class="calls-col">{{ station.calls }}</span>
            <span class="avg-response-col">{{ station.avgResponse }}</span>
            <span class="safety-col">{{ station.safetyScore }}/100</span>
          </div>
        </div>
      </section>

      <!-- Personnel Utilization -->
      <section class="chart-section personnel">
        <h3>Personnel Utilization</h3>
        <div class="utilization-metrics">
          <div class="util-item">
            <span class="util-label">Average Shift Hours</span>
            <div class="util-bar">
              <div class="util-fill" style="width: 72%"></div>
            </div>
            <span class="util-value">34.2 / 48 hrs</span>
          </div>
          <div class="util-item">
            <span class="util-label">Overtime Hours</span>
            <div class="util-bar">
              <div class="util-fill" style="width: 45%"></div>
            </div>
            <span class="util-value">1,250 hrs total</span>
          </div>
          <div class="util-item">
            <span class="util-label">Training Compliance</span>
            <div class="util-bar">
              <div class="util-fill" style="width: 92%"></div>
            </div>
            <span class="util-value">92% compliant</span>
          </div>
        </div>
      </section>

      <!-- Key Insights -->
      <section class="chart-section insights">
        <h3>Key Insights & Recommendations</h3>
        <div class="insights-list">
          <div class="insight-item positive">
            <span class="icon">✓</span>
            <span class="text">Response times improved 15% this quarter - excellent progress!</span>
          </div>
          <div class="insight-item warning">
            <span class="icon">!</span>
            <span class="text">Station 3 response time above target - consider resource review</span>
          </div>
          <div class="insight-item info">
            <span class="icon">i</span>
            <span class="text">8 personnel certifications expiring in next 30 days</span>
          </div>
          <div class="insight-item positive">
            <span class="icon">✓</span>
            <span class="text">Dispatch accuracy at 97.3% - best performance in history</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Export Section -->
    <footer class="analytics-footer">
      <button class="btn-export" @click="exportReport">📊 Export Full Report</button>
      <button class="btn-export" @click="shareReport">📤 Share Report</button>
      <span class="updated">Last updated: {{ lastUpdated }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const timeRange = ref('30d')
const lastUpdated = ref('')

const metrics = ref({
  totalIncidents: 247,
  avgResponseTime: '4:32 min',
  dispatchAccuracy: '97.3%',
  personnelAvailable: 42,
  certExpiring: 8
})

const incidentTypes = ref([
  { name: 'Structure Fire', count: 45, percentage: 18 },
  { name: 'Vehicle Fire', count: 28, percentage: 11 },
  { name: 'EMS Call', count: 98, percentage: 40 },
  { name: 'Rescue', count: 38, percentage: 15 },
  { name: 'False Alarm', count: 28, percentage: 11 },
  { name: 'Hazmat', count: 10, percentage: 4 }
])

const severityLevels = ref([
  { level: 1, label: 'Minor', count: 89, percent: 36 },
  { level: 2, label: 'Moderate', count: 76, percent: 31 },
  { level: 3, label: 'Major', count: 54, percent: 22 },
  { level: 4, label: 'Critical', count: 22, percent: 9 },
  { level: 5, label: 'Catastrophic', count: 6, percent: 2 }
])

const stationPerformance = ref([
  { id: '1', name: 'Station 1 (Downtown)', calls: 67, avgResponse: '3:45 min', safetyScore: 98 },
  { id: '2', name: 'Station 2 (North)', calls: 54, avgResponse: '4:12 min', safetyScore: 96 },
  { id: '3', name: 'Station 3 (West)', calls: 48, avgResponse: '5:28 min', safetyScore: 94 },
  { id: '4', name: 'Station 4 (South)', calls: 61, avgResponse: '3:58 min', safetyScore: 97 },
  { id: '5', name: 'Station 5 (East)', calls: 17, avgResponse: '4:05 min', safetyScore: 99 }
])

function exportReport() {
  console.log('Exporting report...')
}

function shareReport() {
  console.log('Sharing report...')
}

onMounted(() => {
  lastUpdated.value = new Date().toLocaleString()
})
</script>

<style scoped>
.analytics-dashboard {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 0.75rem;
  overflow: hidden;
  color: #e2e8f0;
}

.analytics-header {
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 2px solid #3b82f6;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analytics-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.time-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.analytics-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.kpi-section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.kpi-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 0.5rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kpi-card:hover {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.8);
}

.kpi-label {
  font-size: 0.85rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.kpi-change {
  font-size: 0.8rem;
  color: #94a3b8;
}

.kpi-change.positive {
  color: #6ee7b7;
}

.chart-section {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 0.5rem;
  padding: 1.25rem;
}

.chart-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  width: 100px;
  font-size: 0.875rem;
  color: #cbd5e1;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 0.25rem;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.bar-value {
  width: 80px;
  text-align: right;
  font-size: 0.8rem;
  color: #94a3b8;
}

.trend-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-chart svg {
  width: 100%;
  max-height: 150px;
}

.trend-labels {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.severity-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

.severity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 0.375rem;
}

.severity-color {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.severity-color.level-1 { background: #10b981; }
.severity-color.level-2 { background: #f59e0b; }
.severity-color.level-3 { background: #ef4444; }
.severity-color.level-4 { background: #dc2626; }
.severity-color.level-5 { background: #7c2d12; }

.severity-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
}

.severity-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
}

.severity-percent {
  font-size: 0.75rem;
  color: #94a3b8;
}

.stations-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.5fr 1.5fr;
  gap: 1rem;
  padding: 0.75rem;
  font-size: 0.85rem;
}

.table-header {
  background: rgba(51, 65, 85, 0.5);
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.375rem;
}

.table-row {
  background: rgba(51, 65, 85, 0.2);
  border-left: 3px solid #3b82f6;
}

.table-row:hover {
  background: rgba(51, 65, 85, 0.4);
}

.station-col,
.calls-col,
.avg-response-col,
.safety-col {
  color: #cbd5e1;
}

.utilization-metrics {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.util-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.util-label {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.util-bar {
  height: 24px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 0.25rem;
  overflow: hidden;
}

.util-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.util-value {
  font-size: 0.8rem;
  color: #60a5fa;
  font-weight: 600;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(51, 65, 85, 0.3);
  border-left: 3px solid #3b82f6;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.insight-item.positive {
  border-left-color: #10b981;
}

.insight-item.warning {
  border-left-color: #f59e0b;
}

.insight-item.info {
  border-left-color: #3b82f6;
}

.insight-item .icon {
  font-weight: 700;
  font-size: 1.125rem;
}

.insight-item .text {
  color: #cbd5e1;
}

.analytics-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.4);
}

.btn-export {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.btn-export:hover {
  background: #3b82f6;
  color: white;
}

.updated {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .kpi-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .severity-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-section {
    grid-template-columns: 1fr;
  }

  .severity-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .time-filters {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
