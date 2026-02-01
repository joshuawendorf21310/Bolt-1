<template>
  <div class="device-scanner">
    <div class="scanner-header">
      <h2>Quick Scan Device</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="scanner-tabs">
      <button
        v-for="device in deviceTypes"
        :key="device.type"
        :class="['tab-btn', { active: selectedDevice === device.type }]"
        @click="selectedDevice = device.type"
      >
        <span class="tab-icon">{{ device.icon }}</span>
        <span class="tab-label">{{ device.label }}</span>
      </button>
    </div>

    <div class="scanner-content">
      <div v-if="!capturedImage && !scanning" class="camera-container">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleImageCapture"
          style="display: none"
        />

        <div class="camera-preview">
          <div class="preview-placeholder">
            <div class="placeholder-icon">📷</div>
            <div class="placeholder-text">Position {{ deviceTypes.find(d => d.type === selectedDevice)?.label }}</div>
            <div class="placeholder-tips">
              <div class="tip">✓ Ensure screen is visible</div>
              <div class="tip">✓ Good lighting</div>
              <div class="tip">✓ No glare or reflections</div>
            </div>
          </div>
        </div>

        <button @click="openCamera" class="capture-btn">
          <span class="btn-icon">📸</span>
          <span>Capture Screen</span>
        </button>
      </div>

      <div v-if="capturedImage && !scanning" class="preview-container">
        <img :src="capturedImage" alt="Captured device screen" class="captured-image" />

        <div class="preview-actions">
          <button @click="retakePhoto" class="action-btn secondary">
            <span>↻</span>
            <span>Retake</span>
          </button>
          <button @click="processImage" class="action-btn primary">
            <span>✓</span>
            <span>Process & Import</span>
          </button>
        </div>
      </div>

      <div v-if="scanning" class="scanning-container">
        <div class="scanning-animation">
          <div class="scan-line"></div>
          <div class="scan-icon">🔍</div>
        </div>
        <div class="scanning-text">Analyzing {{ deviceTypes.find(d => d.type === selectedDevice)?.label }}...</div>
        <div class="scanning-status">{{ scanningStatus }}</div>
      </div>

      <div v-if="result" class="result-container">
        <div v-if="result.success" class="result-success">
          <div class="success-icon">✓</div>
          <div class="success-title">Data Imported Successfully</div>

          <div class="extracted-data">
            <div v-if="selectedDevice === 'cardiac_monitor' && result.vitals" class="data-section">
              <h4>Vital Signs</h4>
              <div class="data-grid">
                <div v-if="result.vitals.heart_rate" class="data-item">
                  <span class="data-label">Heart Rate</span>
                  <span class="data-value">{{ result.vitals.heart_rate }} bpm</span>
                </div>
                <div v-if="result.vitals.systolic_bp" class="data-item">
                  <span class="data-label">Blood Pressure</span>
                  <span class="data-value">{{ result.vitals.systolic_bp }}/{{ result.vitals.diastolic_bp }}</span>
                </div>
                <div v-if="result.vitals.spo2" class="data-item">
                  <span class="data-label">SpO2</span>
                  <span class="data-value">{{ result.vitals.spo2 }}%</span>
                </div>
                <div v-if="result.vitals.respiratory_rate" class="data-item">
                  <span class="data-label">Resp Rate</span>
                  <span class="data-value">{{ result.vitals.respiratory_rate }}/min</span>
                </div>
                <div v-if="result.vitals.temperature" class="data-item">
                  <span class="data-label">Temp</span>
                  <span class="data-value">{{ result.vitals.temperature }}°F</span>
                </div>
                <div v-if="result.vitals.etco2" class="data-item">
                  <span class="data-label">ETCO2</span>
                  <span class="data-value">{{ result.vitals.etco2 }} mmHg</span>
                </div>
              </div>
            </div>

            <div v-if="selectedDevice === 'iv_pump' && result.data" class="data-section">
              <h4>IV Pump Settings</h4>
              <div class="data-grid">
                <div v-if="result.data.medication" class="data-item">
                  <span class="data-label">Medication</span>
                  <span class="data-value">{{ result.data.medication }}</span>
                </div>
                <div v-if="result.data.dose" class="data-item">
                  <span class="data-label">Dose</span>
                  <span class="data-value">{{ result.data.dose }} {{ result.data.dose_unit }}</span>
                </div>
                <div v-if="result.data.rate" class="data-item">
                  <span class="data-label">Rate</span>
                  <span class="data-value">{{ result.data.rate }} {{ result.data.rate_unit }}</span>
                </div>
                <div v-if="result.data.volume_infused" class="data-item">
                  <span class="data-label">Volume Infused</span>
                  <span class="data-value">{{ result.data.volume_infused }} mL</span>
                </div>
              </div>
            </div>

            <div v-if="selectedDevice === 'ventilator' && result.data" class="data-section">
              <h4>Ventilator Settings</h4>
              <div class="data-grid">
                <div v-if="result.data.mode" class="data-item">
                  <span class="data-label">Mode</span>
                  <span class="data-value">{{ result.data.mode }}</span>
                </div>
                <div v-if="result.data.tidal_volume" class="data-item">
                  <span class="data-label">Tidal Volume</span>
                  <span class="data-value">{{ result.data.tidal_volume }} mL</span>
                </div>
                <div v-if="result.data.respiratory_rate" class="data-item">
                  <span class="data-label">Rate</span>
                  <span class="data-value">{{ result.data.respiratory_rate }}/min</span>
                </div>
                <div v-if="result.data.peep" class="data-item">
                  <span class="data-label">PEEP</span>
                  <span class="data-value">{{ result.data.peep }} cmH2O</span>
                </div>
                <div v-if="result.data.fio2" class="data-item">
                  <span class="data-label">FiO2</span>
                  <span class="data-value">{{ result.data.fio2 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="scanAnother" class="action-btn primary large">
            <span>📸</span>
            <span>Scan Another Device</span>
          </button>
        </div>

        <div v-else class="result-error">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Scan Failed</div>
          <div class="error-message">{{ result.error || 'Unable to process image' }}</div>
          <button @click="retakePhoto" class="action-btn secondary">
            <span>↻</span>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['close', 'imported']);

const deviceTypes = [
  { type: 'cardiac_monitor', label: 'Monitor', icon: '💓' },
  { type: 'iv_pump', label: 'IV Pump', icon: '💉' },
  { type: 'ventilator', label: 'Ventilator', icon: '🫁' }
];

const selectedDevice = ref<'cardiac_monitor' | 'iv_pump' | 'ventilator'>('cardiac_monitor');
const capturedImage = ref<string | null>(null);
const scanning = ref(false);
const scanningStatus = ref('');
const result = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const imageFile = ref<File | null>(null);

const { scanDeviceScreen } = useOCR();

const props = defineProps<{
  patientId: string;
  incidentId: string;
  organizationId: string;
}>();

const openCamera = () => {
  fileInput.value?.click();
};

const handleImageCapture = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      capturedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const retakePhoto = () => {
  capturedImage.value = null;
  imageFile.value = null;
  result.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const processImage = async () => {
  if (!imageFile.value) return;

  scanning.value = true;
  result.value = null;
  scanningStatus.value = 'Uploading image...';

  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    scanningStatus.value = 'Analyzing device screen...';

    await new Promise(resolve => setTimeout(resolve, 500));
    scanningStatus.value = 'Extracting data...';

    const scanResult = await scanDeviceScreen(
      imageFile.value,
      selectedDevice.value,
      props.incidentId,
      props.patientId,
      props.organizationId
    );

    await new Promise(resolve => setTimeout(resolve, 500));
    scanningStatus.value = 'Saving to ePCR...';

    scanning.value = false;
    result.value = scanResult;

    if (scanResult.success) {
      emit('imported', {
        deviceType: selectedDevice.value,
        data: scanResult
      });
    }
  } catch (error) {
    scanning.value = false;
    result.value = {
      success: false,
      error: 'Failed to process image'
    };
  }
};

const scanAnother = () => {
  capturedImage.value = null;
  imageFile.value = null;
  result.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<style scoped>
.device-scanner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-dark-400);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  background: var(--color-dark-300);
  border-bottom: 2px solid var(--color-primary-500);
}

.scanner-header h2 {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--color-dark-200);
  color: var(--color-gray-300);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-error-500);
  color: #ffffff;
}

.scanner-tabs {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-dark-300);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  border: 2px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  background: var(--color-dark-400);
  color: var(--color-gray-300);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--color-primary-500);
  background: var(--color-dark-200);
}

.tab-btn.active {
  border-color: var(--color-primary-500);
  background: var(--color-primary-500);
  color: #ffffff;
}

.tab-icon {
  font-size: 2rem;
}

.tab-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.scanner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-6);
  overflow-y: auto;
}

.camera-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  height: 100%;
}

.camera-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-dark-300);
  border: 3px dashed var(--color-dark-50);
  border-radius: var(--border-radius-lg);
  min-height: 400px;
}

.preview-placeholder {
  text-align: center;
  padding: var(--spacing-8);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.5;
}

.placeholder-text {
  font-size: 1.25rem;
  color: var(--color-gray-300);
  margin-bottom: var(--spacing-6);
}

.placeholder-tips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.tip {
  color: var(--color-gray-400);
  font-size: 0.875rem;
}

.capture-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  background: var(--color-primary-500);
  color: #ffffff;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.capture-btn:hover {
  background: var(--color-primary-600);
  transform: scale(1.02);
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.captured-image {
  width: 100%;
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--color-dark-50);
}

.preview-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-4);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-5);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--color-success-500);
  color: #ffffff;
}

.action-btn.primary:hover {
  background: var(--color-success-600);
}

.action-btn.secondary {
  background: var(--color-dark-300);
  color: var(--color-gray-300);
  border: 2px solid var(--color-dark-50);
}

.action-btn.secondary:hover {
  border-color: var(--color-primary-500);
  color: #ffffff;
}

.action-btn.large {
  padding: var(--spacing-6);
  font-size: 1.25rem;
}

.scanning-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-6);
  min-height: 400px;
}

.scanning-animation {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-icon {
  font-size: 4rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

.scanning-text {
  font-size: 1.5rem;
  color: #ffffff;
  font-weight: 600;
}

.scanning-status {
  color: var(--color-primary-500);
  font-size: 1rem;
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.result-success, .result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-8);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-success-500);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-error-500);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.success-title, .error-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
}

.error-message {
  color: var(--color-gray-400);
  text-align: center;
}

.extracted-data {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.data-section h4 {
  color: var(--color-primary-500);
  margin-bottom: var(--spacing-4);
  font-size: 1.25rem;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--color-dark-300);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-dark-50);
}

.data-label {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.data-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

@media (max-width: 768px) {
  .scanner-tabs {
    flex-direction: column;
  }

  .tab-btn {
    flex-direction: row;
    justify-content: center;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
