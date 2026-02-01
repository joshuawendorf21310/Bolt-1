export const useSLAAndPriority = () => {
  const supabase = useSupabaseClient()

  const calculateSLATimers = (queueType: string, itemType: string, startedAt: string) => {
    const now = new Date()
    const started = new Date(startedAt)
    const elapsedMs = now.getTime() - started.getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    const slaDefs: Record<string, Record<string, { target: number; soft: number; hard: number }>> = {
      calls: {
        inbound: { target: 0, soft: 0, hard: 0 },
        outbound: { target: 4, soft: 4, hard: 24 },
        escalation: { target: 0, soft: 0, hard: 1 }
      },
      voicemails: {
        new: { target: 1, soft: 2, hard: 8 },
        action_required: { target: 1, soft: 1, hard: 8 }
      },
      documents: {
        draft: { target: 48, soft: 72, hard: 120 },
        required: { target: 8, soft: 24, hard: 48 },
        review: { target: 24, soft: 24, hard: 48 }
      },
      billing: {
        ready_to_bill: { target: 24, soft: 48, hard: 72 },
        waiting_payer: { target: 72, soft: 168, hard: 720 },
        action_required: { target: 24, soft: 24, hard: 48 }
      }
    }

    const sla = slaDefs[queueType]?.[itemType] || { target: 24, soft: 48, hard: 72 }

    return {
      elapsedHours,
      targetHours: sla.target,
      softBreachHours: sla.soft,
      hardBreachHours: sla.hard,
      isSoftBreach: elapsedHours >= sla.soft && elapsedHours < sla.hard,
      isHardBreach: elapsedHours >= sla.hard,
      percentToSoftBreach: (elapsedHours / sla.soft) * 100,
      percentToHardBreach: (elapsedHours / sla.hard) * 100,
      hoursUntilSoftBreach: Math.max(0, sla.soft - elapsedHours),
      hoursUntilHardBreach: Math.max(0, sla.hard - elapsedHours)
    }
  }

  const calculatePriority = (baseScore: number, escalationFactors: any = {}) => {
    let priority = baseScore

    if (escalationFactors.isEscalated) priority += 30
    if (escalationFactors.hasLegalLanguage) priority += 40
    if (escalationFactors.isDenial) priority += 35
    if (escalationFactors.isDeadlineApproaching) priority += 25
    if (escalationFactors.isSoftBreach) priority += 15
    if (escalationFactors.isHardBreach) priority += 50

    const isCritical = priority >= 85 || escalationFactors.isHardBreach

    return {
      calculatedPriority: Math.min(100, priority),
      isCritical,
      criticalReason: isCritical
        ? escalationFactors.isHardBreach
          ? 'Hard SLA breach'
          : 'Critical priority threshold exceeded'
        : null
    }
  }

  const createSLATracking = async (queueType: string, queueItemId: string, itemType: string) => {
    const slaDefQuery = await supabase
      .from('sla_definitions')
      .select('id, target_response_hours, soft_breach_hours, hard_breach_hours')
      .eq('queue_type', queueType)
      .eq('item_type', itemType)
      .maybeSingle()

    if (slaDefQuery.error) throw slaDefQuery.error

    const slaDef = slaDefQuery.data

    if (!slaDef) return null

    const now = new Date()
    const targetAt = new Date(now.getTime() + (slaDef.target_response_hours * 60 * 60 * 1000))
    const softAt = new Date(now.getTime() + (slaDef.soft_breach_hours * 60 * 60 * 1000))
    const hardAt = new Date(now.getTime() + (slaDef.hard_breach_hours * 60 * 60 * 1000))

    const { data, error } = await supabase
      .from('queue_item_sla_tracking')
      .insert({
        queue_type: queueType,
        queue_item_id: queueItemId,
        sla_definition_id: slaDef.id,
        sla_started_at: now.toISOString(),
        target_response_at: targetAt.toISOString(),
        soft_breach_at: softAt.toISOString(),
        hard_breach_at: hardAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const createPriorityScore = async (queueType: string, queueItemId: string, baseScore: number = 50) => {
    const { data, error } = await supabase
      .from('priority_scores')
      .insert({
        queue_type: queueType,
        queue_item_id: queueItemId,
        base_priority: baseScore,
        calculated_priority: baseScore
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updatePriorityWithEscalation = async (priorityId: string, escalationFactors: any) => {
    const { isSoftBreach, isHardBreach } = escalationFactors

    const factors: Record<string, boolean> = {
      soft_breach: isSoftBreach,
      hard_breach: isHardBreach,
      ...escalationFactors
    }

    let priorityIncrease = 0
    let criticalReason = ''

    if (isHardBreach) {
      priorityIncrease = 50
      criticalReason = 'Hard SLA breach'
    } else if (isSoftBreach) {
      priorityIncrease = 15
    }

    if (escalationFactors.isEscalated) {
      priorityIncrease += 30
      if (!criticalReason) criticalReason = 'AI escalation'
    }

    if (escalationFactors.hasLegalLanguage) {
      priorityIncrease += 40
      criticalReason = 'Legal/compliance language detected'
    }

    const { data: current } = await supabase
      .from('priority_scores')
      .select('calculated_priority, base_priority')
      .eq('id', priorityId)
      .single()

    const newPriority = Math.min(100, (current?.calculated_priority || 50) + priorityIncrease)
    const isCritical = newPriority >= 85 || isHardBreach

    const { error } = await supabase
      .from('priority_scores')
      .update({
        calculated_priority: newPriority,
        escalation_factors: factors,
        is_critical: isCritical,
        critical_reason: criticalReason,
        last_recalculated_at: new Date().toISOString()
      })
      .eq('id', priorityId)

    if (error) throw error

    return { newPriority, isCritical, criticalReason }
  }

  const getSLAStatus = async (queueItemId: string) => {
    const { data, error } = await supabase
      .from('queue_item_sla_tracking')
      .select('*')
      .eq('queue_item_id', queueItemId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  const acknowledgeSLABreach = async (slaTrackingId: string, breachType: 'soft' | 'hard') => {
    const updateData: any = {}

    if (breachType === 'soft') {
      updateData.soft_breach_acknowledged = true
    } else if (breachType === 'hard') {
      updateData.hard_breach_acknowledged = true
      updateData.hard_breach_acknowledged_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('queue_item_sla_tracking')
      .update(updateData)
      .eq('id', slaTrackingId)

    if (error) throw error
  }

  const completeSLA = async (slaTrackingId: string) => {
    const { error } = await supabase
      .from('queue_item_sla_tracking')
      .update({
        sla_completed_at: new Date().toISOString()
      })
      .eq('id', slaTrackingId)

    if (error) throw error
  }

  const overridePriority = async (priorityScoreId: string, newPriority: number, reason: string, userId: string) => {
    const { error } = await supabase
      .from('priority_scores')
      .update({
        override_priority: newPriority,
        override_reason: reason,
        override_by_user: userId,
        override_at: new Date().toISOString(),
        calculated_priority: newPriority
      })
      .eq('id', priorityScoreId)

    if (error) throw error
  }

  const auditLog = async (action: string, actor: 'ai' | 'founder' | 'system', entityType: string, entityId: string, oldValues: any = null, newValues: any = null, reason: string = '') => {
    const { error } = await supabase
      .from('audit_log_entries')
      .insert({
        action_type: action,
        actor_id: actor === 'founder' ? 'founder' : actor,
        actor_type: actor,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        reason: reason
      })

    if (error) throw error
  }

  return {
    calculateSLATimers,
    calculatePriority,
    createSLATracking,
    createPriorityScore,
    updatePriorityWithEscalation,
    getSLAStatus,
    acknowledgeSLABreach,
    completeSLA,
    overridePriority,
    auditLog
  }
}
