export const useMedicalCoding = () => {
  const { supabase } = useApi();

  const searchICD10 = async (query: string, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('icd10_codes')
        .select('*')
        .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_billable', true)
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        const apiResult = await $fetch(`/api/medical-coding/icd10/search?q=${encodeURIComponent(query)}`);
        return { success: true, data: apiResult.codes || [] };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error searching ICD-10 codes:', error);
      return { success: false, error };
    }
  };

  const searchRxNorm = async (query: string, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('rxnorm_medications')
        .select('*')
        .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        const apiResult = await $fetch(`/api/medical-coding/rxnorm/search?q=${encodeURIComponent(query)}`);
        return { success: true, data: apiResult.medications || [] };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error searching RxNorm:', error);
      return { success: false, error };
    }
  };

  const searchSNOMED = async (query: string, procedureCategory?: string, limit = 20) => {
    try {
      let queryBuilder = supabase
        .from('snomed_procedures')
        .select('*')
        .or(`term.ilike.%${query}%,fully_specified_name.ilike.%${query}%`);

      if (procedureCategory) {
        queryBuilder = queryBuilder.eq('procedure_category', procedureCategory);
      }

      const { data, error } = await queryBuilder.limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        const apiResult = await $fetch(`/api/medical-coding/snomed/search?q=${encodeURIComponent(query)}`);
        return { success: true, data: apiResult.procedures || [] };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error searching SNOMED:', error);
      return { success: false, error };
    }
  };

  const getNEMSISExpressionMapping = (nemsisElement: string) => {
    const mappings = {
      'eHistory.01': { system: 'SNOMED', category: 'medical_history' },
      'eHistory.02': { system: 'RxNorm', category: 'medications' },
      'eHistory.03': { system: 'SNOMED', category: 'allergies' },
      'eProcedures.03': { system: 'SNOMED', category: 'procedures' },
      'eSituation.11': { system: 'ICD10', category: 'provider_impression' },
      'eMedications.03': { system: 'RxNorm', category: 'administered_medications' }
    };

    return mappings[nemsisElement] || null;
  };

  const validateNEMSISCode = async (code: string, nemsisElement: string) => {
    try {
      const mapping = getNEMSISExpressionMapping(nemsisElement);
      if (!mapping) {
        return { valid: false, error: 'Unknown NEMSIS element' };
      }

      let valid = false;
      switch (mapping.system) {
        case 'ICD10':
          const icdResult = await searchICD10(code);
          valid = icdResult.data?.some((d: any) => d.code === code) || false;
          break;
        case 'RxNorm':
          const rxResult = await searchRxNorm(code);
          valid = rxResult.data?.some((d: any) => d.rxcui === code) || false;
          break;
        case 'SNOMED':
          const snomedResult = await searchSNOMED(code);
          valid = snomedResult.data?.some((d: any) => d.concept_id === code) || false;
          break;
      }

      return { valid, system: mapping.system };
    } catch (error) {
      return { valid: false, error };
    }
  };

  const searchCMSFacilities = async (query: string, state?: string, limit = 20) => {
    try {
      let queryBuilder = supabase
        .from('cms_facilities')
        .select('*')
        .or(`facility_name.ilike.%${query}%,city.ilike.%${query}%,ccn.ilike.%${query}%`);

      if (state) {
        queryBuilder = queryBuilder.eq('state', state.toUpperCase());
      }

      const { data, error } = await queryBuilder.limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        const apiResult = await $fetch(`/api/cms/facilities/search?q=${encodeURIComponent(query)}&state=${state || ''}`);
        return { success: true, data: apiResult.facilities || [] };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error searching CMS facilities:', error);
      return { success: false, error };
    }
  };

  const searchRepeatPatient = async (searchCriteria: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    address?: string;
  }, organizationId: string) => {
    try {
      let query = supabase
        .from('patients')
        .select(`
          *,
          incidents (
            id,
            incident_number,
            created_at,
            primary_complaint
          )
        `)
        .eq('organization_id', organizationId);

      if (searchCriteria.firstName) {
        query = query.ilike('first_name', `%${searchCriteria.firstName}%`);
      }
      if (searchCriteria.lastName) {
        query = query.ilike('last_name', `%${searchCriteria.lastName}%`);
      }
      if (searchCriteria.dateOfBirth) {
        query = query.eq('date_of_birth', searchCriteria.dateOfBirth);
      }
      if (searchCriteria.phone) {
        query = query.or(`home_phone.eq.${searchCriteria.phone},mobile_phone.eq.${searchCriteria.phone}`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      const patientsWithHistory = data?.map(patient => ({
        ...patient,
        incidentCount: patient.incidents?.length || 0,
        lastIncidentDate: patient.incidents?.[0]?.created_at || null
      }));

      return {
        success: true,
        data: patientsWithHistory,
        foundRepeats: patientsWithHistory && patientsWithHistory.length > 0
      };
    } catch (error) {
      console.error('Error searching for repeat patients:', error);
      return { success: false, error };
    }
  };

  const getPatientHistory = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          incidents (
            *,
            patient_vitals (*),
            procedures (*),
            transport_data (*),
            pta_interventions (*)
          ),
          patient_history (*)
        `)
        .eq('id', patientId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching patient history:', error);
      return { success: false, error };
    }
  };

  return {
    searchICD10,
    searchRxNorm,
    searchSNOMED,
    getNEMSISExpressionMapping,
    validateNEMSISCode,
    searchCMSFacilities,
    searchRepeatPatient,
    getPatientHistory
  };
};
