export const useCallQueue = () => {
  const supabase = useSupabaseClient()

  const createCall = async (callData: any) => {
    const { data, error } = await supabase
      .from('call_queue')
      .insert([callData])
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const getActiveCallsCount = async () => {
    const { count, error } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed')

    if (error) throw error
    return count || 0
  }

  const getPendingCalls = async () => {
    const { data, error } = await supabase
      .from('call_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('received_time', { ascending: true })

    if (error) throw error
    return data
  }

  const getCallsByPriority = async () => {
    const { data, error } = await supabase
      .from('call_queue')
      .select('*')
      .neq('status', 'completed')
      .order('priority', { ascending: true })
      .order('received_time', { ascending: true })

    if (error) throw error

    return {
      priority1: data?.filter(c => c.priority === 1) || [],
      priority2: data?.filter(c => c.priority === 2) || [],
      priority3: data?.filter(c => c.priority === 3) || [],
      priority4: data?.filter(c => c.priority === 4) || [],
    }
  }

  const assignCallToUnit = async (callId: string, unitId: string, personnel: string[]) => {
    const { data, error } = await supabase
      .from('call_assignments')
      .insert([
        {
          call_id: callId,
          unit_id: unitId,
          personnel_ids: personnel,
          status: 'pending',
        },
      ])
      .select()
      .maybeSingle()

    if (error) throw error

    await supabase
      .from('call_queue')
      .update({
        assigned_unit_id: unitId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', callId)

    return data
  }

  const acceptCall = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from('call_assignments')
      .update({ status: 'accepted', acceptance_time: new Date().toISOString() })
      .eq('id', assignmentId)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const updateCallStatus = async (callId: string, status: string, timestamp: any = null) => {
    const updateData: any = { status, updated_at: new Date().toISOString() }

    if (status === 'enroute' && !timestamp) {
      updateData.enroute_time = new Date().toISOString()
    } else if (status === 'onscene' && !timestamp) {
      updateData.onscene_time = new Date().toISOString()
    } else if (status === 'transport' && !timestamp) {
      updateData.transport_time = new Date().toISOString()
    } else if (status === 'completed' && !timestamp) {
      updateData.hospital_arrival_time = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('call_queue')
      .update(updateData)
      .eq('id', callId)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  }

  const getCallDetails = async (callId: string) => {
    const { data: callData, error: callError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('id', callId)
      .maybeSingle()

    if (callError) throw callError

    const { data: assignments, error: assignmentError } = await supabase
      .from('call_assignments')
      .select('*')
      .eq('call_id', callId)

    if (assignmentError) throw assignmentError

    const { data: encounter, error: encounterError } = await supabase
      .from('patient_encounters')
      .select('*')
      .eq('call_id', callId)
      .maybeSingle()

    if (encounterError) throw encounterError

    return {
      call: callData,
      assignments: assignments || [],
      encounter: encounter,
    }
  }

  const screenWithAI = async (callData: any) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-voice-screening`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData),
    })

    const result = await response.json()
    return result
  }

  const getQueueStats = async () => {
    const { count: activeCount } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed')

    const { count: pendingCount } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: assignedCount } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'assigned')

    const { data: metrics } = await supabase
      .from('realtime_dispatch_metrics')
      .select('*')
      .order('metric_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      active_calls: activeCount || 0,
      pending_calls: pendingCount || 0,
      assigned_calls: assignedCount || 0,
      metrics: metrics,
    }
  }

  return {
    createCall,
    getActiveCallsCount,
    getPendingCalls,
    getCallsByPriority,
    assignCallToUnit,
    acceptCall,
    updateCallStatus,
    getCallDetails,
    screenWithAI,
    getQueueStats,
  }
}
