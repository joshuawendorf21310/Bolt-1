<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h1 class="text-2xl font-semibold text-gray-900">New ePCR</h1>
          <p class="text-sm text-gray-600 mt-1">NEMSIS v3.5.0 Compliant Patient Care Report</p>
        </div>

        <div class="p-6">
          <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
              <div v-for="(step, idx) in steps" :key="idx" class="flex items-center flex-1">
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
                      currentStep >= idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    ]"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div class="ml-3">
                    <p :class="['text-sm font-medium', currentStep >= idx ? 'text-gray-900' : 'text-gray-500']">
                      {{ step.title }}
                    </p>
                  </div>
                </div>
                <div v-if="idx < steps.length - 1" class="flex-1 h-1 mx-4 bg-gray-200 rounded">
                  <div
                    :class="['h-full bg-blue-600 rounded transition-all duration-300']"
                    :style="{ width: currentStep > idx ? '100%' : '0%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleNext">
            <div v-show="currentStep === 0">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Incident Information</h2>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Incident Number *</label>
                  <input
                    v-model="form.incident.incident_number"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                  <input
                    v-model="form.incident.unit_number"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Call Received</label>
                  <input
                    v-model="form.incident.call_received_at"
                    type="datetime-local"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Unit Enroute</label>
                  <input
                    v-model="form.incident.unit_enroute_at"
                    type="datetime-local"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Arrived at Scene</label>
                  <input
                    v-model="form.incident.unit_arrived_scene_at"
                    type="datetime-local"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Arrived at Patient</label>
                  <input
                    v-model="form.incident.arrived_patient_at"
                    type="datetime-local"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Scene Address</label>
                <input
                  v-model="form.incident.scene_address_line1"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                  placeholder="Street Address"
                />
                <div class="grid grid-cols-3 gap-2">
                  <input
                    v-model="form.incident.scene_city"
                    type="text"
                    placeholder="City"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    v-model="form.incident.scene_state"
                    type="text"
                    placeholder="State"
                    maxlength="2"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    v-model="form.incident.scene_zip"
                    type="text"
                    placeholder="ZIP"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Primary Complaint *</label>
                  <input
                    v-model="form.incident.primary_complaint"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                  <select
                    v-model="form.incident.complaint_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="medical">Medical</option>
                    <option value="trauma">Trauma</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-show="currentStep === 1">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h2>

              <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    v-model="form.patient.first_name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    v-model="form.patient.middle_name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    v-model="form.patient.last_name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    v-model="form.patient.date_of_birth"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    v-model.number="form.patient.age"
                    type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    v-model="form.patient.gender"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Patient Address</label>
                <input
                  v-model="form.patient.address_line1"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                  placeholder="Street Address"
                />
                <div class="grid grid-cols-3 gap-2">
                  <input
                    v-model="form.patient.city"
                    type="text"
                    placeholder="City"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    v-model="form.patient.state"
                    type="text"
                    placeholder="State"
                    maxlength="2"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    v-model="form.patient.zip"
                    type="text"
                    placeholder="ZIP"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Home Phone</label>
                  <input
                    v-model="form.patient.home_phone"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Phone</label>
                  <input
                    v-model="form.patient.mobile_phone"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div v-show="currentStep === 2">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h2>

              <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p class="text-sm text-blue-800">Primary Insurance</p>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Insurance Type</label>
                  <select
                    v-model="form.patient.insurance_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="medicare">Medicare</option>
                    <option value="medicaid">Medicaid</option>
                    <option value="commercial">Commercial</option>
                    <option value="workers_comp">Workers Compensation</option>
                    <option value="self_pay">Self Pay</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                  <input
                    v-model="form.patient.primary_insurance_number"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
                  <input
                    v-model="form.patient.primary_insurance_group"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Subscriber Name</label>
                  <input
                    v-model="form.patient.primary_subscriber_name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Relationship to Patient</label>
                  <select
                    v-model="form.patient.primary_subscriber_relationship"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Subscriber DOB</label>
                  <input
                    v-model="form.patient.primary_subscriber_dob"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div v-show="currentStep === 3">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Transport & Medical Necessity</h2>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Transport Disposition *</label>
                  <select
                    v-model="form.transport.transport_disposition"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="transported">Transported</option>
                    <option value="refused">Refused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="dead_on_scene">Dead on Scene</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Level of Service *</label>
                  <select
                    v-model="form.transport.level_of_service"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="BLS">BLS - Basic Life Support</option>
                    <option value="ALS1">ALS1 - Advanced Life Support, Level 1</option>
                    <option value="ALS2">ALS2 - Advanced Life Support, Level 2</option>
                    <option value="SCT">SCT - Specialty Care Transport</option>
                    <option value="PI">PI - Paramedic Intercept</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Origin Code *</label>
                  <select
                    v-model="form.transport.origin_code"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="E">E - Residential</option>
                    <option value="G">G - Hospital-based ESRD Treatment Facility</option>
                    <option value="H">H - Hospital</option>
                    <option value="I">I - Site of Transfer</option>
                    <option value="J">J - Non-Hospital-based Dialysis Facility</option>
                    <option value="N">N - Skilled Nursing Facility</option>
                    <option value="P">P - Physician's Office</option>
                    <option value="R">R - Scene of Accident or Acute Event</option>
                    <option value="S">S - Scene of Accident with Acute Illness</option>
                    <option value="X">X - Intermediate Stop at Physician's Office</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Destination Code</label>
                  <select
                    v-model="form.transport.destination_code"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="E">E - Residential</option>
                    <option value="G">G - Hospital-based ESRD Treatment Facility</option>
                    <option value="H">H - Hospital</option>
                    <option value="I">I - Site of Transfer</option>
                    <option value="J">J - Non-Hospital-based Dialysis Facility</option>
                    <option value="N">N - Skilled Nursing Facility</option>
                    <option value="P">P - Physician's Office</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Total Mileage *</label>
                  <input
                    v-model.number="form.transport.total_mileage"
                    type="number"
                    step="0.1"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Patient Acuity</label>
                  <select
                    v-model="form.transport.patient_acuity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="emergent">Emergent</option>
                    <option value="urgent">Urgent</option>
                    <option value="non_urgent">Non-Urgent</option>
                  </select>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Medical Necessity Reason</label>
                <textarea
                  v-model="form.transport.medical_necessity_reason"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why ambulance transport was medically necessary..."
                ></textarea>
              </div>
            </div>

            <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                v-if="currentStep > 0"
                type="button"
                @click="currentStep--"
                class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Back
              </button>
              <div v-else></div>

              <div class="flex gap-3">
                <button
                  type="button"
                  @click="saveDraft"
                  class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Save Draft
                </button>
                <button
                  v-if="currentStep < steps.length - 1"
                  type="submit"
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Next
                </button>
                <button
                  v-else
                  type="button"
                  @click="submitePCR"
                  class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                >
                  Complete ePCR
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const currentStep = ref(0);

const steps = [
  { title: 'Incident', icon: 'clipboard' },
  { title: 'Patient', icon: 'user' },
  { title: 'Insurance', icon: 'card' },
  { title: 'Transport', icon: 'truck' }
];

const form = reactive({
  incident: {
    incident_number: '',
    unit_number: '',
    call_received_at: '',
    unit_enroute_at: '',
    unit_arrived_scene_at: '',
    arrived_patient_at: '',
    scene_address_line1: '',
    scene_city: '',
    scene_state: '',
    scene_zip: '',
    primary_complaint: '',
    complaint_type: ''
  },
  patient: {
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    age: null,
    gender: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    home_phone: '',
    mobile_phone: '',
    insurance_type: '',
    primary_insurance_number: '',
    primary_insurance_group: '',
    primary_subscriber_name: '',
    primary_subscriber_relationship: '',
    primary_subscriber_dob: ''
  },
  transport: {
    transport_disposition: '',
    level_of_service: '',
    origin_code: '',
    destination_code: '',
    total_mileage: null,
    patient_acuity: '',
    medical_necessity_reason: ''
  }
});

const handleNext = () => {
  currentStep.value++;
};

const saveDraft = async () => {
  console.log('Saving draft...', form);
  alert('Draft saved successfully!');
};

const submitePCR = async () => {
  console.log('Submitting ePCR...', form);
  alert('ePCR submitted successfully!');
  navigateTo('/cad');
};
</script>
