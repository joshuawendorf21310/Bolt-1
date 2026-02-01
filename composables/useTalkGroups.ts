export const useTalkGroups = () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const getTalkGroups = async (organizationId: string) => {
    const { data, error } = await $supabase
      .from('talk_groups')
      .select(`
        *,
        members:talk_group_members(
          *,
          user:users(full_name, email),
          crew:crew_roster(certification_level)
        ),
        channel:ptt_channels(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('priority_level', { ascending: false })

    if (error) {
      console.error('Failed to fetch talk groups:', error)
      return []
    }

    return data || []
  }

  const getTalkGroup = async (groupId: string) => {
    const { data, error } = await $supabase
      .from('talk_groups')
      .select(`
        *,
        members:talk_group_members(
          *,
          user:users(full_name, email),
          crew:crew_roster(certification_level, employee_id)
        ),
        channel:ptt_channels(
          *,
          current_speaker:users(full_name)
        )
      `)
      .eq('id', groupId)
      .single()

    if (error) {
      console.error('Failed to fetch talk group:', error)
      return null
    }

    return data
  }

  const createTalkGroup = async (group: {
    organizationId: string
    groupName: string
    groupType?: string
    description?: string
    priorityLevel?: number
    isEmergency?: boolean
    autoJoin?: boolean
    incidentId?: string
    station?: string
    maxMembers?: number
  }) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: groupData, error: groupError } = await $supabase
      .from('talk_groups')
      .insert({
        organization_id: group.organizationId,
        group_name: group.groupName,
        group_type: group.groupType || 'standard',
        description: group.description || null,
        priority_level: group.priorityLevel || 1,
        is_emergency: group.isEmergency || false,
        auto_join: group.autoJoin || false,
        created_by: user.id,
        incident_id: group.incidentId || null,
        station: group.station || null,
        max_members: group.maxMembers || null
      })
      .select()
      .single()

    if (groupError) {
      console.error('Failed to create talk group:', groupError)
      return { success: false, error: groupError.message }
    }

    const { data: channelData, error: channelError } = await $supabase
      .from('ptt_channels')
      .insert({
        organization_id: group.organizationId,
        talk_group_id: groupData.id,
        channel_type: 'group',
        channel_name: group.groupName,
        is_emergency: group.isEmergency || false,
        priority_level: group.priorityLevel || 1
      })
      .select()
      .single()

    if (channelError) {
      console.error('Failed to create PTT channel:', channelError)
    }

    if (group.autoJoin) {
      await joinTalkGroup(groupData.id)
    }

    return { success: true, data: groupData }
  }

  const joinTalkGroup = async (groupId: string, role: string = 'member') => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: crewData } = await $supabase
      .from('crew_roster')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: existing } = await $supabase
      .from('talk_group_members')
      .select('id, is_active')
      .eq('talk_group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (!existing.is_active) {
        await $supabase
          .from('talk_group_members')
          .update({
            is_active: true,
            joined_at: new Date().toISOString(),
            left_at: null
          })
          .eq('id', existing.id)
      }
      return { success: true }
    }

    const { error } = await $supabase
      .from('talk_group_members')
      .insert({
        talk_group_id: groupId,
        user_id: user.id,
        crew_id: crewData?.id || null,
        role
      })

    if (error) {
      console.error('Failed to join talk group:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const leaveTalkGroup = async (groupId: string) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await $supabase
      .from('talk_group_members')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('talk_group_id', groupId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to leave talk group:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const getMyTalkGroups = async () => {
    const user = await auth.getUser()
    if (!user) return []

    const { data, error } = await $supabase
      .from('talk_group_members')
      .select(`
        *,
        talk_group:talk_groups(
          *,
          channel:ptt_channels(
            *,
            current_speaker:users(full_name)
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to fetch user talk groups:', error)
      return []
    }

    return data?.map(m => m.talk_group) || []
  }

  const getChannelForGroup = async (groupId: string) => {
    const { data, error } = await $supabase
      .from('ptt_channels')
      .select(`
        *,
        talk_group:talk_groups(*),
        current_speaker:users(full_name, email)
      `)
      .eq('talk_group_id', groupId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch channel for group:', error)
      return null
    }

    return data
  }

  const createDirectChannel = async (targetUserId: string, organizationId: string) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const channelName = `Direct: ${user.id} <-> ${targetUserId}`

    const { data, error } = await $supabase
      .from('ptt_channels')
      .insert({
        organization_id: organizationId,
        channel_type: 'direct',
        channel_name: channelName,
        priority_level: 1
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create direct channel:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const getActiveBroadcasts = async (organizationId: string) => {
    const { data, error } = await $supabase
      .from('emergency_broadcasts')
      .select(`
        *,
        initiator:users(full_name, email),
        acknowledgments:emergency_broadcast_acks(
          *,
          user:users(full_name)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch active broadcasts:', error)
      return []
    }

    return data || []
  }

  const updateTalkGroup = async (
    groupId: string,
    updates: {
      groupName?: string
      description?: string
      priorityLevel?: number
      isActive?: boolean
    }
  ) => {
    const { error } = await $supabase
      .from('talk_groups')
      .update({
        group_name: updates.groupName,
        description: updates.description,
        priority_level: updates.priorityLevel,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (error) {
      console.error('Failed to update talk group:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const deleteTalkGroup = async (groupId: string) => {
    const { error } = await $supabase
      .from('talk_groups')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (error) {
      console.error('Failed to delete talk group:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const subscribeToTalkGroupUpdates = (
    organizationId: string,
    callback: (group: any) => void
  ) => {
    const channel = $supabase
      .channel('talk-groups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'talk_groups',
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
    getTalkGroups,
    getTalkGroup,
    createTalkGroup,
    joinTalkGroup,
    leaveTalkGroup,
    getMyTalkGroups,
    getChannelForGroup,
    createDirectChannel,
    getActiveBroadcasts,
    updateTalkGroup,
    deleteTalkGroup,
    subscribeToTalkGroupUpdates
  }
}
