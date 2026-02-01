export const useCrewMessages = () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const sendMessage = async (
    message: string,
    options: {
      unitId?: string
      incidentId?: string
      messageType?: 'text' | 'alert' | 'status_update'
      priority?: 'normal' | 'urgent' | 'emergency'
    } = {}
  ) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await $supabase
      .from('crew_messages')
      .insert({
        sender_id: user.id,
        unit_id: options.unitId || null,
        incident_id: options.incidentId || null,
        message,
        message_type: options.messageType || 'text',
        priority: options.priority || 'normal'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to send message:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const getMessages = async (options: {
    unitId?: string
    incidentId?: string
    limit?: number
  } = {}) => {
    let query = $supabase
      .from('crew_messages')
      .select('*, sender:users(full_name, email)')
      .order('created_at', { ascending: false })

    if (options.unitId) {
      query = query.eq('unit_id', options.unitId)
    }

    if (options.incidentId) {
      query = query.eq('incident_id', options.incidentId)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch messages:', error)
      return []
    }

    return data || []
  }

  const markMessageAsRead = async (messageId: string) => {
    const user = await auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: message } = await $supabase
      .from('crew_messages')
      .select('read_by')
      .eq('id', messageId)
      .single()

    if (!message) {
      return { success: false, error: 'Message not found' }
    }

    const readBy = message.read_by || []
    if (!readBy.includes(user.id)) {
      readBy.push(user.id)
    }

    const { error } = await $supabase
      .from('crew_messages')
      .update({ read_by: readBy })
      .eq('id', messageId)

    if (error) {
      console.error('Failed to mark message as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const subscribeToMessages = (
    callback: (message: any) => void,
    options: {
      unitId?: string
      incidentId?: string
    } = {}
  ) => {
    let channel = $supabase
      .channel('crew_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_messages'
        },
        (payload) => {
          const message = payload.new
          if (options.unitId && message.unit_id !== options.unitId) return
          if (options.incidentId && message.incident_id !== options.incidentId) return
          callback(message)
        }
      )
      .subscribe()

    return () => {
      $supabase.removeChannel(channel)
    }
  }

  const getUnreadCount = async (options: {
    unitId?: string
    incidentId?: string
  } = {}) => {
    const user = await auth.getUser()
    if (!user) {
      return 0
    }

    let query = $supabase
      .from('crew_messages')
      .select('read_by', { count: 'exact', head: true })

    if (options.unitId) {
      query = query.eq('unit_id', options.unitId)
    }

    if (options.incidentId) {
      query = query.eq('incident_id', options.incidentId)
    }

    const { data: allMessages } = await $supabase
      .from('crew_messages')
      .select('id, read_by')
      .eq('unit_id', options.unitId)

    if (!allMessages) return 0

    const unreadMessages = allMessages.filter(msg => {
      const readBy = msg.read_by || []
      return !readBy.includes(user.id)
    })

    return unreadMessages.length
  }

  return {
    sendMessage,
    getMessages,
    markMessageAsRead,
    subscribeToMessages,
    getUnreadCount
  }
}
