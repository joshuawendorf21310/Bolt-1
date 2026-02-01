export const useSystemHealth = () => {
  const supabase = useSupabaseClient()

  const getHealthSignals = async () => {
    const { data: signals } = await supabase
      .from('system_health_signals')
      .select('*')
      .order('system_name')

    const { data: tools } = await supabase
      .from('tool_integration_status')
      .select('*')
      .order('tool_name')

    return {
      signals: signals || [],
      tools: tools || []
    }
  }

  const getActiveAlerts = async () => {
    const { data: alerts } = await supabase
      .from('dashboard_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('severity', { ascending: false })
      .order('triggered_at', { ascending: false })

    return alerts || []
  }

  const acknowledgeAlert = async (alertId: string) => {
    const user = useSupabaseUser()

    const { error } = await supabase
      .from('dashboard_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.value?.id
      })
      .eq('id', alertId)

    if (error) throw error
  }

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('dashboard_alerts')
      .update({
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) throw error
  }

  const createAlert = async (alert: {
    alertType: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    message: string
    actionRequired: string
    context?: any
  }) => {
    const { error } = await supabase
      .from('dashboard_alerts')
      .insert({
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        action_required: alert.actionRequired,
        context: alert.context || {}
      })

    if (error) throw error
  }

  const updateToolStatus = async (toolName: string, status: {
    connectionStatus?: string
    lastSuccessfulCall?: string
    lastFailedCall?: string
    failureCount24h?: number
    averageLatencyMs?: number
    credentialsValid?: boolean
  }) => {
    const { error } = await supabase
      .from('tool_integration_status')
      .update({
        ...status,
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('tool_name', toolName)

    if (error) throw error
  }

  return {
    getHealthSignals,
    getActiveAlerts,
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    updateToolStatus
  }
}
