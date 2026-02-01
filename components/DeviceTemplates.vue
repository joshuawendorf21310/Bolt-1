<template>
  <div class="device-templates">
    <div class="templates-header">
      <h3>Device Screen Recognition Guide</h3>
      <p>Quick reference for supported medical devices</p>
    </div>

    <div class="templates-grid">
      <div class="template-card">
        <div class="template-header cardiac">
          <span class="template-icon">💓</span>
          <h4>Cardiac Monitors</h4>
        </div>
        <div class="template-content">
          <div class="supported-devices">
            <h5>Supported Brands</h5>
            <ul>
              <li>Philips IntelliVue</li>
              <li>Zoll X Series</li>
              <li>Lifepak 12/15/20</li>
              <li>GE Dash Series</li>
            </ul>
          </div>
          <div class="extracted-fields">
            <h5>Auto-Extracted Data</h5>
            <div class="field-list">
              <span class="field-badge">Heart Rate (HR)</span>
              <span class="field-badge">Blood Pressure (NBP)</span>
              <span class="field-badge">SpO2</span>
              <span class="field-badge">Respiratory Rate</span>
              <span class="field-badge">Temperature</span>
              <span class="field-badge">ETCO2</span>
              <span class="field-badge">Rhythm Strip</span>
            </div>
          </div>
          <div class="scan-tips">
            <h5>Scanning Tips</h5>
            <ul class="tips-list">
              <li>Capture main display screen</li>
              <li>Ensure all vitals are visible</li>
              <li>Avoid screen glare</li>
              <li>Include rhythm strip if available</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="template-card">
        <div class="template-header pump">
          <span class="template-icon">💉</span>
          <h4>IV Pumps</h4>
        </div>
        <div class="template-content">
          <div class="supported-devices">
            <h5>Supported Brands</h5>
            <ul>
              <li>Alaris / BD</li>
              <li>Baxter Sigma</li>
              <li>B. Braun Infusomat</li>
              <li>Hospira Plum</li>
            </ul>
          </div>
          <div class="extracted-fields">
            <h5>Auto-Extracted Data</h5>
            <div class="field-list">
              <span class="field-badge">Medication Name</span>
              <span class="field-badge">Dose & Units</span>
              <span class="field-badge">Infusion Rate</span>
              <span class="field-badge">Volume Infused</span>
              <span class="field-badge">Volume Remaining</span>
            </div>
          </div>
          <div class="scan-tips">
            <h5>Scanning Tips</h5>
            <ul class="tips-list">
              <li>Capture drug library screen</li>
              <li>Ensure rate and dose visible</li>
              <li>Include volume information</li>
              <li>Capture infusion status</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="template-card">
        <div class="template-header vent">
          <span class="template-icon">🫁</span>
          <h4>Ventilators</h4>
        </div>
        <div class="template-content">
          <div class="supported-devices">
            <h5>Supported Brands</h5>
            <ul>
              <li>Drager Oxylog / Evita</li>
              <li>Hamilton C3 / T1</li>
              <li>Medtronic / Covidien</li>
              <li>Respironics V60</li>
            </ul>
          </div>
          <div class="extracted-fields">
            <h5>Auto-Extracted Data</h5>
            <div class="field-list">
              <span class="field-badge">Ventilation Mode</span>
              <span class="field-badge">Tidal Volume (VT)</span>
              <span class="field-badge">Respiratory Rate</span>
              <span class="field-badge">PEEP</span>
              <span class="field-badge">FiO2</span>
              <span class="field-badge">Peak Pressure</span>
            </div>
          </div>
          <div class="scan-tips">
            <h5>Scanning Tips</h5>
            <ul class="tips-list">
              <li>Capture settings screen</li>
              <li>Ensure mode is visible</li>
              <li>Include all parameters</li>
              <li>Capture measured values</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="general-tips">
      <h4>General Scanning Best Practices</h4>
      <div class="tips-grid">
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <div>
            <strong>Lighting</strong>
            <p>Use adequate lighting, avoid direct overhead lights causing glare</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">📐</span>
          <div>
            <strong>Angle</strong>
            <p>Hold tablet parallel to device screen, avoid tilted angles</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🎯</span>
          <div>
            <strong>Focus</strong>
            <p>Ensure screen fills most of the frame, allow slight margins</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <div>
            <strong>Verify</strong>
            <p>Review extracted data before confirming import</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.device-templates {
  padding: var(--spacing-6);
  max-width: 1400px;
  margin: 0 auto;
}

.templates-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.templates-header h3 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: var(--spacing-2);
}

.templates-header p {
  color: var(--color-gray-400);
  font-size: 1.125rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.template-card {
  background: var(--color-dark-400);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: var(--color-primary-500);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.template-header {
  padding: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  border-bottom: 2px solid var(--color-dark-50);
}

.template-header.cardiac {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.05));
}

.template-header.pump {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
}

.template-header.vent {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
}

.template-icon {
  font-size: 2.5rem;
}

.template-header h4 {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0;
}

.template-content {
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.supported-devices h5,
.extracted-fields h5,
.scan-tips h5 {
  font-size: 1rem;
  color: var(--color-primary-500);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.supported-devices ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.supported-devices li {
  padding: var(--spacing-2) 0;
  color: var(--color-gray-300);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.supported-devices li:before {
  content: "•";
  color: var(--color-primary-500);
  font-weight: bold;
  font-size: 1.25rem;
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.field-badge {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-dark-300);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  color: var(--color-gray-300);
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: var(--spacing-2) 0;
  color: var(--color-gray-400);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.tips-list li:before {
  content: "✓";
  color: var(--color-success-500);
  font-weight: bold;
}

.general-tips {
  background: var(--color-dark-400);
  border: 2px solid var(--color-primary-500);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-8);
}

.general-tips h4 {
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: var(--spacing-6);
  text-align: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-6);
}

.tip-item {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-dark-50);
}

.tip-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.tip-item strong {
  display: block;
  color: #ffffff;
  margin-bottom: var(--spacing-1);
  font-size: 1rem;
}

.tip-item p {
  color: var(--color-gray-400);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
