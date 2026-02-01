export const useBilling = () => {
  const { supabase } = useApi();

  const AMBULANCE_CODES = {
    BLS: { code: 'A0428', description: 'Ambulance service, basic life support, non-emergency transport' },
    BLS_EMERGENCY: { code: 'A0429', description: 'Ambulance service, basic life support, emergency transport' },
    ALS1: { code: 'A0426', description: 'Ambulance service, advanced life support, non-emergency transport, level 1' },
    ALS1_EMERGENCY: { code: 'A0427', description: 'Ambulance service, advanced life support, emergency transport, level 1' },
    ALS2: { code: 'A0433', description: 'Ambulance service, advanced life support, level 2' },
    SCT: { code: 'A0434', description: 'Ambulance service, specialty care transport' },
    MILEAGE: { code: 'A0425', description: 'Ground mileage, per statute mile' }
  };

  const determineAmbulanceCode = (levelOfService: string, isEmergency: boolean) => {
    if (levelOfService === 'BLS') {
      return isEmergency ? AMBULANCE_CODES.BLS_EMERGENCY : AMBULANCE_CODES.BLS;
    } else if (levelOfService === 'ALS1') {
      return isEmergency ? AMBULANCE_CODES.ALS1_EMERGENCY : AMBULANCE_CODES.ALS1;
    } else if (levelOfService === 'ALS2') {
      return AMBULANCE_CODES.ALS2;
    } else if (levelOfService === 'SCT') {
      return AMBULANCE_CODES.SCT;
    }
    return AMBULANCE_CODES.BLS;
  };

  const generateClaimFromIncident = async (incidentId: string, organizationId: string) => {
    try {
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select(`
          *,
          patients (*),
          transport_data (*)
        `)
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;

      const patient = incident.patients[0];
      const transport = incident.transport_data[0];

      if (!transport) {
        throw new Error('No transport data found for this incident');
      }

      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const isEmergency = transport.patient_acuity === 'emergent';
      const baseCode = determineAmbulanceCode(transport.level_of_service, isEmergency);

      const baseCharge = {
        BLS: 450,
        BLS_EMERGENCY: 550,
        ALS1: 650,
        ALS1_EMERGENCY: 750,
        ALS2: 950,
        SCT: 1200
      }[transport.level_of_service] || 450;

      const mileageRate = 12.50;
      const mileageCharge = transport.total_mileage * mileageRate;
      const totalCharge = baseCharge + mileageCharge;

      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert([{
          organization_id: organizationId,
          incident_id: incidentId,
          patient_id: patient.id,
          payer_id: patient.primary_insurance_payer_id,
          claim_number: claimNumber,
          claim_type: 'professional',
          total_charge: totalCharge,
          balance: totalCharge,
          service_date: new Date(transport.created_at).toISOString().split('T')[0],
          status: 'draft',
          medical_necessity_documented: !!transport.medical_necessity_reason
        }])
        .select()
        .single();

      if (claimError) throw claimError;

      const claimLines = [
        {
          claim_id: claim.id,
          line_number: 1,
          procedure_code: baseCode.code,
          procedure_description: baseCode.description,
          modifier_1: 'QM',
          modifier_2: 'QN',
          origin_code: transport.origin_code,
          destination_code: transport.destination_code || 'H',
          unit_charge: baseCharge,
          units: 1,
          total_charge: baseCharge,
          service_date: claim.service_date,
          diagnosis_pointers: ['A']
        }
      ];

      if (transport.total_mileage > 0) {
        claimLines.push({
          claim_id: claim.id,
          line_number: 2,
          procedure_code: AMBULANCE_CODES.MILEAGE.code,
          procedure_description: AMBULANCE_CODES.MILEAGE.description,
          origin_code: transport.origin_code,
          destination_code: transport.destination_code || 'H',
          unit_charge: mileageRate,
          units: transport.total_mileage,
          total_charge: mileageCharge,
          service_date: claim.service_date,
          diagnosis_pointers: ['A']
        });
      }

      const { error: linesError } = await supabase
        .from('claim_lines')
        .insert(claimLines);

      if (linesError) throw linesError;

      await supabase
        .from('audit_logs')
        .insert([{
          organization_id: organizationId,
          action: 'create',
          resource_type: 'claim',
          resource_id: claim.id,
          details: { claim_number: claimNumber, incident_id: incidentId }
        }]);

      return { success: true, claim };
    } catch (error) {
      console.error('Error generating claim:', error);
      return { success: false, error };
    }
  };

  const getClaims = async (organizationId: string, filters = {}) => {
    try {
      let query = supabase
        .from('claims')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          incidents (
            incident_number
          ),
          payers (
            name,
            payer_type
          ),
          claim_lines (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching claims:', error);
      return { success: false, error };
    }
  };

  const submitClaim = async (claimId: string, method: 'office_ally_837p' | 'lob_paper') => {
    try {
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*)
        `)
        .eq('id', claimId)
        .single();

      if (claimError) throw claimError;

      const { error: statusError } = await supabase
        .from('claims')
        .update({
          status: 'submitted',
          submission_method: method,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (statusError) throw statusError;

      const { data: submission, error: submissionError } = await supabase
        .from('claim_submissions')
        .insert([{
          claim_id: claimId,
          submission_method: method,
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (submissionError) throw submissionError;

      return { success: true, submission };
    } catch (error) {
      console.error('Error submitting claim:', error);
      return { success: false, error };
    }
  };

  const analyzeDenials = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('denied_claims')
        .select(`
          *,
          claims (
            claim_number,
            total_charge,
            payers (name)
          )
        `)
        .eq('claims.organization_id', organizationId)
        .order('denied_at', { ascending: false });

      if (error) throw error;

      const denialsByReason = data.reduce((acc, denial) => {
        const reason = denial.denial_reason_description;
        if (!acc[reason]) {
          acc[reason] = { count: 0, total_amount: 0 };
        }
        acc[reason].count++;
        acc[reason].total_amount += denial.claims.total_charge;
        return acc;
      }, {});

      return {
        success: true,
        data,
        denialsByReason,
        totalDenials: data.length,
        totalAmount: data.reduce((sum, d) => sum + d.claims.total_charge, 0)
      };
    } catch (error) {
      console.error('Error analyzing denials:', error);
      return { success: false, error };
    }
  };

  const validateMedicalNecessity = (transport: any) => {
    const issues: string[] = [];

    if (!transport.medical_necessity_reason || transport.medical_necessity_reason.length < 20) {
      issues.push('Medical necessity reason is too short or missing');
    }

    if (!transport.patient_acuity) {
      issues.push('Patient acuity not documented');
    }

    if (!transport.patient_condition_codes || transport.patient_condition_codes.length === 0) {
      issues.push('No condition codes documented');
    }

    if (transport.level_of_service === 'ALS2' && transport.patient_acuity !== 'emergent') {
      issues.push('ALS2 typically requires emergent acuity');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  };

  return {
    AMBULANCE_CODES,
    determineAmbulanceCode,
    generateClaimFromIncident,
    getClaims,
    submitClaim,
    analyzeDenials,
    validateMedicalNecessity
  };
};
