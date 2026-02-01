export const useAudit = () => {
  const { supabase } = useApi();

  const logAccess = async (
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      await supabase.from('audit_logs').insert([
        {
          organization_id: userData?.organization_id,
          user_id: user?.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details || {},
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  };

  const getAuditLogs = async (organizationId: string, filters = {}) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, error };
    }
  };

  const getActivitySummary = async (organizationId: string, days = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, resource_type, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const summary = {
        totalActions: data.length,
        byAction: data.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byResourceType: data.reduce((acc, log) => {
          acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byDay: data.reduce((acc, log) => {
          const day = new Date(log.created_at).toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return { success: true, summary };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return { success: false, error };
    }
  };

  return {
    logAccess,
    getAuditLogs,
    getActivitySummary
  };
};
