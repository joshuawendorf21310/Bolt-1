
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const AIFaceSheetReviewer: typeof import("../components/AIFaceSheetReviewer.vue").default
export const AIPhoneAssistant: typeof import("../components/AIPhoneAssistant.vue").default
export const AccountingIntegrityStrip: typeof import("../components/AccountingIntegrityStrip.vue").default
export const BillingCommandCenter: typeof import("../components/BillingCommandCenter.vue").default
export const BillingEmailCenter: typeof import("../components/BillingEmailCenter.vue").default
export const BillingFaxCenter: typeof import("../components/BillingFaxCenter.vue").default
export const BusinessHealthSummary: typeof import("../components/BusinessHealthSummary.vue").default
export const CrewLink: typeof import("../components/CrewLink.vue").default
export const DeviceScanner: typeof import("../components/DeviceScanner.vue").default
export const DeviceTemplates: typeof import("../components/DeviceTemplates.vue").default
export const DocumentWorkspace: typeof import("../components/DocumentWorkspace.vue").default
export const EndOfDayReconciliation: typeof import("../components/EndOfDayReconciliation.vue").default
export const FireAnalyticsDashboard: typeof import("../components/FireAnalyticsDashboard.vue").default
export const FireCertificationTracker: typeof import("../components/FireCertificationTracker.vue").default
export const FireDashboard: typeof import("../components/FireDashboard.vue").default
export const FireIncidentCommand: typeof import("../components/FireIncidentCommand.vue").default
export const FounderCompensationGuardrails: typeof import("../components/FounderCompensationGuardrails.vue").default
export const MDTVehicleTelemetry: typeof import("../components/MDTVehicleTelemetry.vue").default
export const MapNavigation: typeof import("../components/MapNavigation.vue").default
export const OneClickApproval: typeof import("../components/OneClickApproval.vue").default
export const PhoneSystem: typeof import("../components/PhoneSystem.vue").default
export const PlatformInvoiceList: typeof import("../components/PlatformInvoiceList.vue").default
export const PlatformRevenueBreakdown: typeof import("../components/PlatformRevenueBreakdown.vue").default
export const PrivatePayRevenue: typeof import("../components/PrivatePayRevenue.vue").default
export const QueueManagement: typeof import("../components/QueueManagement.vue").default
export const RealTimeQueueDashboard: typeof import("../components/RealTimeQueueDashboard.vue").default
export const SLATimerDisplay: typeof import("../components/SLATimerDisplay.vue").default
export const SystemFailoverStatus: typeof import("../components/SystemFailoverStatus.vue").default
export const TaxSafetyBlock: typeof import("../components/TaxSafetyBlock.vue").default
export const TelehealthBillingPanel: typeof import("../components/TelehealthBillingPanel.vue").default
export const WorkspaceBuilders: typeof import("../components/WorkspaceBuilders.vue").default
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only").default
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only").default
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page").default
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components").Link
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components").Base
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components").Title
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components").Style
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components").Head
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components").Html
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components").Body
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default
export const LazyAIFaceSheetReviewer: LazyComponent<typeof import("../components/AIFaceSheetReviewer.vue").default>
export const LazyAIPhoneAssistant: LazyComponent<typeof import("../components/AIPhoneAssistant.vue").default>
export const LazyAccountingIntegrityStrip: LazyComponent<typeof import("../components/AccountingIntegrityStrip.vue").default>
export const LazyBillingCommandCenter: LazyComponent<typeof import("../components/BillingCommandCenter.vue").default>
export const LazyBillingEmailCenter: LazyComponent<typeof import("../components/BillingEmailCenter.vue").default>
export const LazyBillingFaxCenter: LazyComponent<typeof import("../components/BillingFaxCenter.vue").default>
export const LazyBusinessHealthSummary: LazyComponent<typeof import("../components/BusinessHealthSummary.vue").default>
export const LazyCrewLink: LazyComponent<typeof import("../components/CrewLink.vue").default>
export const LazyDeviceScanner: LazyComponent<typeof import("../components/DeviceScanner.vue").default>
export const LazyDeviceTemplates: LazyComponent<typeof import("../components/DeviceTemplates.vue").default>
export const LazyDocumentWorkspace: LazyComponent<typeof import("../components/DocumentWorkspace.vue").default>
export const LazyEndOfDayReconciliation: LazyComponent<typeof import("../components/EndOfDayReconciliation.vue").default>
export const LazyFireAnalyticsDashboard: LazyComponent<typeof import("../components/FireAnalyticsDashboard.vue").default>
export const LazyFireCertificationTracker: LazyComponent<typeof import("../components/FireCertificationTracker.vue").default>
export const LazyFireDashboard: LazyComponent<typeof import("../components/FireDashboard.vue").default>
export const LazyFireIncidentCommand: LazyComponent<typeof import("../components/FireIncidentCommand.vue").default>
export const LazyFounderCompensationGuardrails: LazyComponent<typeof import("../components/FounderCompensationGuardrails.vue").default>
export const LazyMDTVehicleTelemetry: LazyComponent<typeof import("../components/MDTVehicleTelemetry.vue").default>
export const LazyMapNavigation: LazyComponent<typeof import("../components/MapNavigation.vue").default>
export const LazyOneClickApproval: LazyComponent<typeof import("../components/OneClickApproval.vue").default>
export const LazyPhoneSystem: LazyComponent<typeof import("../components/PhoneSystem.vue").default>
export const LazyPlatformInvoiceList: LazyComponent<typeof import("../components/PlatformInvoiceList.vue").default>
export const LazyPlatformRevenueBreakdown: LazyComponent<typeof import("../components/PlatformRevenueBreakdown.vue").default>
export const LazyPrivatePayRevenue: LazyComponent<typeof import("../components/PrivatePayRevenue.vue").default>
export const LazyQueueManagement: LazyComponent<typeof import("../components/QueueManagement.vue").default>
export const LazyRealTimeQueueDashboard: LazyComponent<typeof import("../components/RealTimeQueueDashboard.vue").default>
export const LazySLATimerDisplay: LazyComponent<typeof import("../components/SLATimerDisplay.vue").default>
export const LazySystemFailoverStatus: LazyComponent<typeof import("../components/SystemFailoverStatus.vue").default>
export const LazyTaxSafetyBlock: LazyComponent<typeof import("../components/TaxSafetyBlock.vue").default>
export const LazyTelehealthBillingPanel: LazyComponent<typeof import("../components/TelehealthBillingPanel.vue").default>
export const LazyWorkspaceBuilders: LazyComponent<typeof import("../components/WorkspaceBuilders.vue").default>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only").default>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only").default>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page").default>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Link>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Base>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Title>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Style>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Head>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Html>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Body>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default>

export const componentNames: string[]
