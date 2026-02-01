<template>
  <NuxtLayout name="default">
    <div class="dashboard-content">
      <div class="page-header">
        <h1>Operations Dashboard</h1>
        <p>Real-time system overview</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon emergency">🚨</div>
          <div class="metric-details">
            <div class="metric-label">Active Calls</div>
            <div class="metric-value">{{ stats.activeIncidents }}</div>
            <div class="metric-change">In progress</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon success">✓</div>
          <div class="metric-details">
            <div class="metric-label">Available Units</div>
            <div class="metric-value">{{ stats.availableUnits }}</div>
            <div class="metric-change">Ready for dispatch</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon warning">🚑</div>
          <div class="metric-details">
            <div class="metric-label">En Route</div>
            <div class="metric-value">{{ stats.activeTransports }}</div>
            <div class="metric-change">Active transports</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon info">👥</div>
          <div class="metric-details">
            <div class="metric-label">Personnel</div>
            <div class="metric-value">{{ stats.onDutyStaff }}</div>
            <div class="metric-change">On duty</div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon emergency">🚨</div>
              <div class="activity-content">
                <div class="activity-title">New Emergency Call</div>
                <div class="activity-details">Medical emergency at 123 Main St</div>
                <div class="activity-time">2 minutes ago</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon success">✓</div>
              <div class="activity-content">
                <div class="activity-title">Transport Completed</div>
                <div class="activity-details">Unit A-12 returned to service</div>
                <div class="activity-time">15 minutes ago</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon info">📋</div>
              <div class="activity-content">
                <div class="activity-title">ePCR Submitted</div>
                <div class="activity-details">Patient care report for INC-2024-001</div>
                <div class="activity-time">28 minutes ago</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>System Status</h3>
          <div class="status-list">
            <div class="status-item">
              <span class="status-label">CAD System</span>
              <span class="status-badge online">Online</span>
            </div>
            <div class="status-item">
              <span class="status-label">Database</span>
              <span class="status-badge online">Online</span>
            </div>
            <div class="status-item">
              <span class="status-label">GPS Tracking</span>
              <span class="status-badge online">Online</span>
            </div>
            <div class="status-item">
              <span class="status-label">Billing System</span>
              <span class="status-badge online">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const stats = ref({
  activeIncidents: 8,
  availableUnits: 15,
  activeTransports: 5,
  onDutyStaff: 42
})
</script>

<style scoped>
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.page-header p {
  color: #9ca3af;
  font-size: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.metric-card {
  background: rgba(255, 107, 0, 0.05);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
}

.metric-card:hover {
  border-color: rgba(255, 107, 0, 0.5);
  background: rgba(255, 107, 0, 0.1);
  transform: translateY(-4px);
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.metric-icon.emergency {
  background: rgba(220, 38, 38, 0.2);
}

.metric-icon.success {
  background: rgba(16, 185, 129, 0.2);
}

.metric-icon.warning {
  background: rgba(255, 107, 0, 0.2);
}

.metric-icon.info {
  background: rgba(59, 130, 246, 0.2);
}

.metric-details {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.metric-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.75rem;
  color: #6b7280;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 107, 0, 0.2);
  color: #FF6B00;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 0, 0.05);
  border-radius: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.activity-item:hover {
  border-color: rgba(255, 107, 0, 0.3);
  background: rgba(255, 107, 0, 0.1);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-icon.emergency {
  background: rgba(220, 38, 38, 0.2);
}

.activity-icon.success {
  background: rgba(16, 185, 129, 0.2);
}

.activity-icon.info {
  background: rgba(59, 130, 246, 0.2);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.activity-details {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 107, 0, 0.05);
  border-radius: 0.5rem;
}

.status-label {
  font-weight: 500;
  color: #d1d5db;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
