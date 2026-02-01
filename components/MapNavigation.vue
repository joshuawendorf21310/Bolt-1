<template>
  <div class="map-navigation">
    <div ref="mapContainer" class="map-container"></div>

    <div v-if="route" class="route-info">
      <div class="route-header">
        <div class="route-stats">
          <div class="stat">
            <span class="stat-label">Distance</span>
            <span class="stat-value">{{ formatDistance(route.distance) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">ETA</span>
            <span class="stat-value">{{ formatDuration(route.duration) }}</span>
          </div>
        </div>
        <button @click="refreshRoute" class="btn-refresh" :disabled="loading">
          {{ loading ? 'Updating...' : 'Refresh Route' }}
        </button>
      </div>

      <div class="directions-panel" v-if="showDirections">
        <h3>Turn-by-Turn Directions</h3>
        <div class="directions-list">
          <div
            v-for="(step, index) in route.steps"
            :key="index"
            class="direction-step"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <div class="step-instruction">{{ step.instruction }}</div>
              <div class="step-distance">{{ formatDistance(step.distance) }}</div>
            </div>
          </div>
        </div>
      </div>

      <button @click="showDirections = !showDirections" class="btn-toggle-directions">
        {{ showDirections ? 'Hide' : 'Show' }} Directions
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  destination: {
    address: string
    lat?: number
    lng?: number
  }
  origin?: {
    lat: number
    lng: number
  }
}

const props = defineProps<Props>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map | null>(null)
const route = ref<any>(null)
const loading = ref(false)
const error = ref('')
const showDirections = ref(false)

let routeLayer: L.Polyline | null = null
let originMarker: L.Marker | null = null
let destinationMarker: L.Marker | null = null

const initMap = () => {
  if (!mapContainer.value || map.value) return

  map.value = L.map(mapContainer.value, {
    center: [40.7128, -74.0060],
    zoom: 13
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map.value)
}

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (err) {
    console.error('Geocoding error:', err)
    return null
  }
}

const calculateRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  try {
    loading.value = true
    error.value = ''

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
    )

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found')
    }

    const routeData = data.routes[0]

    route.value = {
      distance: routeData.distance,
      duration: routeData.duration,
      geometry: routeData.geometry.coordinates,
      steps: routeData.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.type === 'depart'
          ? `Head ${step.maneuver.modifier || 'forward'} on ${step.name || 'road'}`
          : step.maneuver.type === 'arrive'
          ? 'Arrive at destination'
          : `${step.maneuver.type.replace(/-/g, ' ')} ${step.maneuver.modifier || ''} onto ${step.name || 'road'}`.trim(),
        distance: step.distance
      }))
    }

    drawRoute(routeData.geometry.coordinates, start, end)
  } catch (err) {
    error.value = 'Failed to calculate route. Please try again.'
    console.error('Routing error:', err)
  } finally {
    loading.value = false
  }
}

const drawRoute = (coordinates: number[][], start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  if (!map.value) return

  if (routeLayer) {
    map.value.removeLayer(routeLayer)
  }
  if (originMarker) {
    map.value.removeLayer(originMarker)
  }
  if (destinationMarker) {
    map.value.removeLayer(destinationMarker)
  }

  const latlngs = coordinates.map(coord => [coord[1], coord[0]] as [number, number])

  routeLayer = L.polyline(latlngs, {
    color: '#ff6b00',
    weight: 5,
    opacity: 0.8
  }).addTo(map.value)

  const originIcon = L.divIcon({
    html: '<div style="background: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
    className: 'custom-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })

  const destIcon = L.divIcon({
    html: '<div style="background: #ff6b00; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>',
    className: 'custom-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })

  originMarker = L.marker([start.lat, start.lng], { icon: originIcon }).addTo(map.value)
  destinationMarker = L.marker([end.lat, end.lng], { icon: destIcon }).addTo(map.value)

  map.value.fitBounds(routeLayer.getBounds(), {
    padding: [50, 50]
  })
}

const refreshRoute = async () => {
  await loadRoute()
}

const loadRoute = async () => {
  if (!props.destination) return

  let destCoords = props.destination.lat && props.destination.lng
    ? { lat: props.destination.lat, lng: props.destination.lng }
    : await geocodeAddress(props.destination.address)

  if (!destCoords) {
    error.value = 'Could not find destination location'
    return
  }

  const startCoords = props.origin || { lat: 40.7128, lng: -74.0060 }

  await calculateRoute(startCoords, destCoords)
}

const formatDistance = (meters: number): string => {
  const miles = meters / 1609.344
  return miles < 0.1
    ? `${Math.round(meters * 3.28084)} ft`
    : `${miles.toFixed(1)} mi`
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

onMounted(() => {
  initMap()
  loadRoute()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

watch(() => props.destination, () => {
  loadRoute()
}, { deep: true })
</script>

<style scoped>
.map-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.map-container {
  flex: 1;
  min-height: 400px;
  position: relative;
}

.route-info {
  background: var(--color-dark-300);
  border-top: 1px solid var(--color-dark-50);
}

.route-header {
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.route-stats {
  display: flex;
  gap: var(--spacing-6);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary-500);
}

.btn-refresh {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-dark-400);
  border: 1px solid var(--color-dark-50);
  border-radius: var(--border-radius-md);
  color: #ffffff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--color-dark-200);
  border-color: var(--color-primary-500);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.directions-panel {
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-dark-50);
}

.directions-panel h3 {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.directions-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.direction-step {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border-radius: var(--border-radius-md);
}

.step-number {
  width: 24px;
  height: 24px;
  background: var(--color-primary-500);
  color: var(--color-dark-400);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-instruction {
  font-size: 0.875rem;
  color: #ffffff;
  margin-bottom: var(--spacing-1);
  text-transform: capitalize;
}

.step-distance {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.btn-toggle-directions {
  width: 100%;
  padding: var(--spacing-3);
  background: var(--color-dark-400);
  border: none;
  border-top: 1px solid var(--color-dark-50);
  color: var(--color-primary-500);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toggle-directions:hover {
  background: var(--color-dark-200);
}

.error-message {
  padding: var(--spacing-4);
  background: rgba(220, 38, 38, 0.1);
  border-top: 1px solid var(--color-error-500);
  color: var(--color-error-500);
  font-size: 0.875rem;
}
</style>
