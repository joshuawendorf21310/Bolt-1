
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

interface _GlobalComponents {
  'AIFaceSheetReviewer': typeof import("../../components/AIFaceSheetReviewer.vue").default
  'AIPhoneAssistant': typeof import("../../components/AIPhoneAssistant.vue").default
  'AccountingIntegrityStrip': typeof import("../../components/AccountingIntegrityStrip.vue").default
  'BillingCommandCenter': typeof import("../../components/BillingCommandCenter.vue").default
  'BillingEmailCenter': typeof import("../../components/BillingEmailCenter.vue").default
  'BillingFaxCenter': typeof import("../../components/BillingFaxCenter.vue").default
  'BusinessHealthSummary': typeof import("../../components/BusinessHealthSummary.vue").default
  'CrewLink': typeof import("../../components/CrewLink.vue").default
  'DeviceScanner': typeof import("../../components/DeviceScanner.vue").default
  'DeviceTemplates': typeof import("../../components/DeviceTemplates.vue").default
  'DocumentWorkspace': typeof import("../../components/DocumentWorkspace.vue").default
  'EndOfDayReconciliation': typeof import("../../components/EndOfDayReconciliation.vue").default
  'FireAnalyticsDashboard': typeof import("../../components/FireAnalyticsDashboard.vue").default
  'FireCertificationTracker': typeof import("../../components/FireCertificationTracker.vue").default
  'FireDashboard': typeof import("../../components/FireDashboard.vue").default
  'FireIncidentCommand': typeof import("../../components/FireIncidentCommand.vue").default
  'FounderCompensationGuardrails': typeof import("../../components/FounderCompensationGuardrails.vue").default
  'MDTVehicleTelemetry': typeof import("../../components/MDTVehicleTelemetry.vue").default
  'MapNavigation': typeof import("../../components/MapNavigation.vue").default
  'OneClickApproval': typeof import("../../components/OneClickApproval.vue").default
  'PhoneSystem': typeof import("../../components/PhoneSystem.vue").default
  'PlatformInvoiceList': typeof import("../../components/PlatformInvoiceList.vue").default
  'PlatformRevenueBreakdown': typeof import("../../components/PlatformRevenueBreakdown.vue").default
  'PrivatePayRevenue': typeof import("../../components/PrivatePayRevenue.vue").default
  'QueueManagement': typeof import("../../components/QueueManagement.vue").default
  'RealTimeQueueDashboard': typeof import("../../components/RealTimeQueueDashboard.vue").default
  'SLATimerDisplay': typeof import("../../components/SLATimerDisplay.vue").default
  'SystemFailoverStatus': typeof import("../../components/SystemFailoverStatus.vue").default
  'TaxSafetyBlock': typeof import("../../components/TaxSafetyBlock.vue").default
  'TelehealthBillingPanel': typeof import("../../components/TelehealthBillingPanel.vue").default
  'WorkspaceBuilders': typeof import("../../components/WorkspaceBuilders.vue").default
  'NuxtWelcome': typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default
  'NuxtLayout': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default
  'NuxtErrorBoundary': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
  'ClientOnly': typeof import("../../node_modules/nuxt/dist/app/components/client-only").default
  'DevOnly': typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default
  'ServerPlaceholder': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default
  'NuxtLink': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default
  'NuxtLoadingIndicator': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
  'NuxtTime': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
  'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
  'NuxtImg': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
  'NuxtPicture': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
  'NuxtPage': typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default
  'NoScript': typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript
  'Link': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link
  'Base': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base
  'Title': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title
  'Meta': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta
  'Style': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style
  'Head': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head
  'Html': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html
  'Body': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body
  'NuxtIsland': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default
  'LazyAIFaceSheetReviewer': LazyComponent<typeof import("../../components/AIFaceSheetReviewer.vue").default>
  'LazyAIPhoneAssistant': LazyComponent<typeof import("../../components/AIPhoneAssistant.vue").default>
  'LazyAccountingIntegrityStrip': LazyComponent<typeof import("../../components/AccountingIntegrityStrip.vue").default>
  'LazyBillingCommandCenter': LazyComponent<typeof import("../../components/BillingCommandCenter.vue").default>
  'LazyBillingEmailCenter': LazyComponent<typeof import("../../components/BillingEmailCenter.vue").default>
  'LazyBillingFaxCenter': LazyComponent<typeof import("../../components/BillingFaxCenter.vue").default>
  'LazyBusinessHealthSummary': LazyComponent<typeof import("../../components/BusinessHealthSummary.vue").default>
  'LazyCrewLink': LazyComponent<typeof import("../../components/CrewLink.vue").default>
  'LazyDeviceScanner': LazyComponent<typeof import("../../components/DeviceScanner.vue").default>
  'LazyDeviceTemplates': LazyComponent<typeof import("../../components/DeviceTemplates.vue").default>
  'LazyDocumentWorkspace': LazyComponent<typeof import("../../components/DocumentWorkspace.vue").default>
  'LazyEndOfDayReconciliation': LazyComponent<typeof import("../../components/EndOfDayReconciliation.vue").default>
  'LazyFireAnalyticsDashboard': LazyComponent<typeof import("../../components/FireAnalyticsDashboard.vue").default>
  'LazyFireCertificationTracker': LazyComponent<typeof import("../../components/FireCertificationTracker.vue").default>
  'LazyFireDashboard': LazyComponent<typeof import("../../components/FireDashboard.vue").default>
  'LazyFireIncidentCommand': LazyComponent<typeof import("../../components/FireIncidentCommand.vue").default>
  'LazyFounderCompensationGuardrails': LazyComponent<typeof import("../../components/FounderCompensationGuardrails.vue").default>
  'LazyMDTVehicleTelemetry': LazyComponent<typeof import("../../components/MDTVehicleTelemetry.vue").default>
  'LazyMapNavigation': LazyComponent<typeof import("../../components/MapNavigation.vue").default>
  'LazyOneClickApproval': LazyComponent<typeof import("../../components/OneClickApproval.vue").default>
  'LazyPhoneSystem': LazyComponent<typeof import("../../components/PhoneSystem.vue").default>
  'LazyPlatformInvoiceList': LazyComponent<typeof import("../../components/PlatformInvoiceList.vue").default>
  'LazyPlatformRevenueBreakdown': LazyComponent<typeof import("../../components/PlatformRevenueBreakdown.vue").default>
  'LazyPrivatePayRevenue': LazyComponent<typeof import("../../components/PrivatePayRevenue.vue").default>
  'LazyQueueManagement': LazyComponent<typeof import("../../components/QueueManagement.vue").default>
  'LazyRealTimeQueueDashboard': LazyComponent<typeof import("../../components/RealTimeQueueDashboard.vue").default>
  'LazySLATimerDisplay': LazyComponent<typeof import("../../components/SLATimerDisplay.vue").default>
  'LazySystemFailoverStatus': LazyComponent<typeof import("../../components/SystemFailoverStatus.vue").default>
  'LazyTaxSafetyBlock': LazyComponent<typeof import("../../components/TaxSafetyBlock.vue").default>
  'LazyTelehealthBillingPanel': LazyComponent<typeof import("../../components/TelehealthBillingPanel.vue").default>
  'LazyWorkspaceBuilders': LazyComponent<typeof import("../../components/WorkspaceBuilders.vue").default>
  'LazyNuxtWelcome': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default>
  'LazyNuxtLayout': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default>
  'LazyNuxtErrorBoundary': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
  'LazyClientOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only").default>
  'LazyDevOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default>
  'LazyServerPlaceholder': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default>
  'LazyNuxtLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default>
  'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
  'LazyNuxtTime': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
  'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
  'LazyNuxtImg': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
  'LazyNuxtPicture': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
  'LazyNuxtPage': LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default>
  'LazyNoScript': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript>
  'LazyLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link>
  'LazyBase': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base>
  'LazyTitle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title>
  'LazyMeta': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta>
  'LazyStyle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style>
  'LazyHead': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head>
  'LazyHtml': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html>
  'LazyBody': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body>
  'LazyNuxtIsland': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
