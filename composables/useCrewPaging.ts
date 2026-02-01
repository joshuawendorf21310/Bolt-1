export const useCrewPaging = () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const sendPage = async (page: {
    organizationId: string
    incidentId?: string
    pageType?: 'dispatch' | 'alert' | 'recall' | 'broadcast' | 'emergency'
    priority?: 'routine' | 'normal' | 'urgent' | 'emergency' | 'critical'
    subject: string
    message: string
    targetType: 'unit' | 'crew' | 'broadcast' | 'station'
    targetUnitIds?: string[]
    targetCrewIds?: string[]
    requiresResponse?: boolean
    expiresIn?: number
  }) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const expiresAt = page.expiresIn
      ? new Date(Date.now() + page.expiresIn * 60000).toISOString()
      : null

    const { data, error } = await $supabase
      .from('pages')
      .insert({
        organization_id: page.organizationId,
        incident_id: page.incidentId || null,
        sender_id: user.id,
        page_type: page.pageType || 'dispatch',
        priority: page.priority || 'normal',
        subject: page.subject,
        message: page.message,
        target_type: page.targetType,
        target_unit_ids: page.targetUnitIds || [],
        target_crew_ids: page.targetCrewIds || [],
        requires_response: page.requiresResponse ?? true,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to send page:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const sendIncidentDispatch = async (
    organizationId: string,
    incidentId: string,
    incidentDetails: {
      address: string
      nature: string
      priority: string
      specialInstructions?: string
    },
    targetUnitIds: string[]
  ) => {
    const message = `
INCIDENT DISPATCH

Address: ${incidentDetails.address}
Nature: ${incidentDetails.nature}
Priority: ${incidentDetails.priority}
${incidentDetails.specialInstructions ? `\nSpecial Instructions: ${incidentDetails.specialInstructions}` : ''}

Respond immediately.
    `.trim()

    return await sendPage({
      organizationId,
      incidentId,
      pageType: 'dispatch',
      priority: incidentDetails.priority.toLowerCase() as any,
      subject: `DISPATCH: ${incidentDetails.nature}`,
      message,
      targetType: 'unit',
      targetUnitIds,
      requiresResponse: true,
      expiresIn: 15
    })
  }

  const sendEmergencyAlert = async (
    organizationId: string,
    subject: string,
    message: string,
    targetCrewIds?: string[]
  ) => {
    return await sendPage({
      organizationId,
      pageType: 'emergency',
      priority: 'emergency',
      subject,
      message,
      targetType: targetCrewIds ? 'crew' : 'broadcast',
      targetCrewIds,
      requiresResponse: true,
      expiresIn: 5
    })
  }

  const respondToPage = async (
    pageId: string,
    crewId: string,
    responseType: 'acknowledged' | 'responding' | 'unavailable' | 'declined' | 'enroute',
    options: {
      message?: string
      eta?: Date
    } = {}
  ) => {
    const { data: existing } = await $supabase
      .from('page_responses')
      .select('id')
      .eq('page_id', pageId)
      .eq('crew_id', crewId)
      .maybeSingle()

    if (existing) {
      const { error } = await $supabase
        .from('page_responses')
        .update({
          response_type: responseType,
          response_message: options.message || null,
          estimated_eta: options.eta?.toISOString() || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Failed to update page response:', error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await $supabase
        .from('page_responses')
        .insert({
          page_id: pageId,
          crew_id: crewId,
          response_type: responseType,
          response_message: options.message || null,
          estimated_eta: options.eta?.toISOString() || null
        })

      if (error) {
        console.error('Failed to respond to page:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  }

  const getPages = async (options: {
    organizationId?: string
    incidentId?: string
    priority?: string
    pageType?: string
    limit?: number
    includeExpired?: boolean
  } = {}) => {
    let query = $supabase
      .from('pages')
      .select(`
        *,
        sender:users(full_name, email),
        responses:page_responses(
          *,
          crew:crew_roster(
            *,
            user:users(full_name)
          )
        )
      `)
      .order('sent_at', { ascending: false })

    if (options.organizationId) {
      query = query.eq('organization_id', options.organizationId)
    }

    if (options.incidentId) {
      query = query.eq('incident_id', options.incidentId)
    }

    if (options.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options.pageType) {
      query = query.eq('page_type', options.pageType)
    }

    if (!options.includeExpired) {
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch pages:', error)
      return []
    }

    return data || []
  }

  const getActivePagesForCrew = async (crewId: string) => {
    const { data: crewData } = await $supabase
      .from('crew_roster')
      .select('organization_id, user_id')
      .eq('id', crewId)
      .single()

    if (!crewData) {
      return []
    }

    const { data: assignments } = await $supabase
      .from('crew_assignments')
      .select('unit_id')
      .eq('crew_id', crewId)
      .eq('is_active', true)

    const unitIds = assignments?.map(a => a.unit_id) || []

    const { data, error } = await $supabase
      .from('pages')
      .select(`
        *,
        sender:users(full_name),
        responses:page_responses!left(*)
      `)
      .eq('organization_id', crewData.organization_id)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch active pages:', error)
      return []
    }

    const relevantPages = data?.filter(page => {
      if (page.target_type === 'broadcast') return true
      if (page.target_type === 'crew') {
        return (page.target_crew_ids as string[]).includes(crewId)
      }
      if (page.target_type === 'unit') {
        return unitIds.some(uid => (page.target_unit_ids as string[]).includes(uid))
      }
      return false
    }) || []

    return relevantPages
  }

  const getPageResponses = async (pageId: string) => {
    const { data, error } = await $supabase
      .from('page_responses')
      .select(`
        *,
        crew:crew_roster(
          *,
          user:users(full_name, email)
        )
      `)
      .eq('page_id', pageId)
      .order('responded_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch page responses:', error)
      return []
    }

    return data || []
  }

  const getResponseStatistics = async (pageId: string) => {
    const { data: page } = await $supabase
      .from('pages')
      .select('target_type, target_crew_ids, target_unit_ids')
      .eq('id', pageId)
      .single()

    if (!page) {
      return null
    }

    const { data: responses } = await $supabase
      .from('page_responses')
      .select('response_type')
      .eq('page_id', pageId)

    let expectedResponses = 0
    if (page.target_type === 'crew') {
      expectedResponses = (page.target_crew_ids as string[]).length
    } else if (page.target_type === 'unit') {
      const { data: assignments } = await $supabase
        .from('crew_assignments')
        .select('id')
        .in('unit_id', page.target_unit_ids as string[])
        .eq('is_active', true)
      expectedResponses = assignments?.length || 0
    }

    const responsesByType = responses?.reduce((acc, r) => {
      acc[r.response_type] = (acc[r.response_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      expected: expectedResponses,
      received: responses?.length || 0,
      acknowledged: responsesByType.acknowledged || 0,
      responding: responsesByType.responding || 0,
      enroute: responsesByType.enroute || 0,
      unavailable: responsesByType.unavailable || 0,
      declined: responsesByType.declined || 0,
      responseRate: expectedResponses > 0
        ? ((responses?.length || 0) / expectedResponses) * 100
        : 0
    }
  }

  const subscribeToPages = (
    callback: (page: any) => void,
    organizationId: string
  ) => {
    const channel = $supabase
      .channel('pages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pages',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      $supabase.removeChannel(channel)
    }
  }

  return {
    sendPage,
    sendIncidentDispatch,
    sendEmergencyAlert,
    respondToPage,
    getPages,
    getActivePagesForCrew,
    getPageResponses,
    getResponseStatistics,
    subscribeToPages
  }
}
