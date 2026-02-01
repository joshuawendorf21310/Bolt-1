export const useRealtimeSubscriptions = () => {
  const supabase = useSupabaseClient()

  const subscriptions: Map<string, any> = new Map()

  const subscribeToSLAUpdates = (queueType: string, callback: (update: any) => void) => {
    const subscriptionKey = `sla_${queueType}`

    const subscription = supabase
      .channel(`sla_tracking_${queueType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_item_sla_tracking',
          filter: `queue_type=eq.${queueType}`
        },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToPriorityUpdates = (queueType: string, callback: (update: any) => void) => {
    const subscriptionKey = `priority_${queueType}`

    const subscription = supabase
      .channel(`priority_scores_${queueType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'priority_scores',
          filter: `queue_type=eq.${queueType}`
        },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToFaceSheetApprovals = (callback: (update: any) => void) => {
    const subscriptionKey = 'face_sheet_approvals'

    const subscription = supabase
      .channel('face_sheets_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'face_sheets',
          filter: 'is_approved=eq.false'
        },
        (payload) => {
          callback({
            type: 'face_sheet_update',
            data: payload.new
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToConfidenceDecisions = (callback: (update: any) => void) => {
    const subscriptionKey = 'confidence_decisions'

    const subscription = supabase
      .channel('confidence_decisions_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'confidence_decisions',
          filter: 'approval_required=eq.true'
        },
        (payload) => {
          callback({
            type: 'confidence_decision_required',
            data: payload.new
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToQueueUpdates = (queueType: string, callback: (update: any) => void) => {
    const subscriptionKey = `queue_${queueType}`
    const tableName = `queue_${queueType}`

    const subscription = supabase
      .channel(`${tableName}_updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToPhoneCalls = (callback: (update: any) => void) => {
    const subscriptionKey = 'active_calls'

    const subscription = supabase
      .channel('active_calls_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_calls'
        },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const subscribeToVoicemails = (callback: (update: any) => void) => {
    const subscriptionKey = 'voicemail_updates'

    const subscription = supabase
      .channel('voicemail_records_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voicemail_records'
        },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          })
        }
      )
      .subscribe()

    subscriptions.set(subscriptionKey, subscription)
    return subscriptionKey
  }

  const unsubscribe = (subscriptionKey: string) => {
    const subscription = subscriptions.get(subscriptionKey)
    if (subscription) {
      supabase.removeChannel(subscription)
      subscriptions.delete(subscriptionKey)
    }
  }

  const unsubscribeAll = () => {
    for (const [key, subscription] of subscriptions) {
      supabase.removeChannel(subscription)
    }
    subscriptions.clear()
  }

  return {
    subscribeToSLAUpdates,
    subscribeToPriorityUpdates,
    subscribeToFaceSheetApprovals,
    subscribeToConfidenceDecisions,
    subscribeToQueueUpdates,
    subscribeToPhoneCalls,
    subscribeToVoicemails,
    unsubscribe,
    unsubscribeAll
  }
}
