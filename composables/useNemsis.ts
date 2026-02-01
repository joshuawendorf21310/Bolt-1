export const useNemsis = () => {
  const { supabase } = useApi();

  const validateNemsis = (data: any) => {
    const errors: string[] = [];

    if (!data.incident?.incident_number) {
      errors.push('Incident number is required');
    }

    if (!data.patient?.first_name || !data.patient?.last_name) {
      errors.push('Patient name is required');
    }

    if (!data.patient?.date_of_birth) {
      errors.push('Patient date of birth is required');
    }

    if (!data.patient?.gender) {
      errors.push('Patient gender is required');
    }

    if (data.transport?.transport_disposition === 'transported') {
      if (!data.transport?.level_of_service) {
        errors.push('Level of service is required for transported patients');
      }
      if (!data.transport?.origin_code) {
        errors.push('Origin code is required for transported patients');
      }
      if (!data.transport?.total_mileage || data.transport.total_mileage <= 0) {
        errors.push('Valid mileage is required for transported patients');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const saveIncident = async (incidentData: any, patientData: any, transportData: any, organizationId: string) => {
    try {
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert([{
          ...incidentData,
          organization_id: organizationId,
          status: 'draft'
        }])
        .select()
        .single();

      if (incidentError) throw incidentError;

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([{
          ...patientData,
          incident_id: incident.id,
          organization_id: organizationId
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      if (transportData.transport_disposition === 'transported') {
        const { error: transportError } = await supabase
          .from('transport_data')
          .insert([{
            ...transportData,
            incident_id: incident.id,
            patient_id: patient.id
          }]);

        if (transportError) throw transportError;
      }

      await supabase
        .from('audit_logs')
        .insert([{
          organization_id: organizationId,
          action: 'create',
          resource_type: 'incident',
          resource_id: incident.id,
          details: { incident_number: incident.incident_number }
        }]);

      return { success: true, incident, patient };
    } catch (error) {
      console.error('Error saving incident:', error);
      return { success: false, error };
    }
  };

  const getIncidents = async (organizationId: string, filters = {}) => {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender
          ),
          transport_data (
            id,
            transport_disposition,
            level_of_service,
            total_mileage
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return { success: false, error };
    }
  };

  const getIncidentById = async (incidentId: string) => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          patients (
            *,
            primary_insurance_payer:payers!patients_primary_insurance_payer_id_fkey (*)
          ),
          transport_data (*),
          patient_vitals (*),
          procedures (*)
        `)
        .eq('id', incidentId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching incident:', error);
      return { success: false, error };
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', incidentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating incident status:', error);
      return { success: false, error };
    }
  };

  return {
    validateNemsis,
    saveIncident,
    getIncidents,
    getIncidentById,
    updateIncidentStatus
  };
};
