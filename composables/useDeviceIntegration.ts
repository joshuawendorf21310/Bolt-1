export const useDeviceIntegration = () => {
  const { supabase } = useApi();

  const scanCardiacMonitor = async (image: File, incidentId: string, patientId: string) => {
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('device_type', 'cardiac_monitor');

      const response = await $fetch('/api/devices/scan-monitor', {
        method: 'POST',
        body: formData
      });

      if (response.vitals) {
        const { data: vitals } = await supabase
          .from('patient_vitals')
          .insert([{
            patient_id: patientId,
            obtained_at: new Date().toISOString(),
            heart_rate: response.vitals.heart_rate,
            systolic_bp: response.vitals.systolic,
            diastolic_bp: response.vitals.diastolic,
            respiratory_rate: response.vitals.respiratory_rate,
            pulse_oximetry: response.vitals.spo2
          }])
          .select()
          .single();

        if (response.rhythm_data) {
          await supabase
            .from('rhythm_strips')
            .insert([{
              patient_id: patientId,
              incident_id: incidentId,
              strip_timestamp: new Date().toISOString(),
              image_url: response.rhythm_strip_url,
              heart_rate: response.vitals.heart_rate,
              rhythm_type: response.rhythm_data.rhythm_type,
              rhythm_interpretation: response.rhythm_data.interpretation,
              ai_analysis: response.rhythm_data.analysis
            }]);
        }
      }

      await supabase
        .from('device_readings')
        .insert([{
          patient_id: patientId,
          incident_id: incidentId,
          device_type: 'cardiac_monitor',
          device_manufacturer: response.device_info?.manufacturer,
          device_model: response.device_info?.model,
          reading_timestamp: new Date().toISOString(),
          data: response,
          imported_from: 'ocr'
        }]);

      return { success: true, data: response };
    } catch (error) {
      console.error('Error scanning cardiac monitor:', error);
      return { success: false, error };
    }
  };

  const importIVPumpData = async (data: any, incidentId: string, patientId: string) => {
    try {
      await supabase
        .from('procedures')
        .insert([{
          patient_id: patientId,
          procedure_code: '36000',
          procedure_description: 'IV Infusion',
          performed_at: data.start_time || new Date().toISOString(),
          is_medication: true,
          medication_name: data.medication_name,
          medication_dose: data.dose,
          medication_dose_unit: data.dose_unit,
          medication_route: data.route || 'IV'
        }]);

      await supabase
        .from('device_readings')
        .insert([{
          patient_id: patientId,
          incident_id: incidentId,
          device_type: 'iv_pump',
          device_manufacturer: data.manufacturer,
          device_model: data.model,
          reading_timestamp: new Date().toISOString(),
          data: {
            medication: data.medication_name,
            dose: data.dose,
            dose_unit: data.dose_unit,
            rate: data.rate,
            rate_unit: data.rate_unit,
            volume_infused: data.volume_infused,
            volume_remaining: data.volume_remaining
          },
          imported_from: data.import_method || 'manual'
        }]);

      return { success: true };
    } catch (error) {
      console.error('Error importing IV pump data:', error);
      return { success: false, error };
    }
  };

  const importVentilatorData = async (data: any, incidentId: string, patientId: string) => {
    try {
      await supabase
        .from('procedures')
        .insert([{
          patient_id: patientId,
          procedure_code: '94002',
          procedure_description: 'Mechanical Ventilation',
          performed_at: data.start_time || new Date().toISOString()
        }]);

      await supabase
        .from('device_readings')
        .insert([{
          patient_id: patientId,
          incident_id: incidentId,
          device_type: 'ventilator',
          device_manufacturer: data.manufacturer,
          device_model: data.model,
          reading_timestamp: new Date().toISOString(),
          data: {
            mode: data.mode,
            tidal_volume: data.tidal_volume,
            respiratory_rate: data.respiratory_rate,
            peep: data.peep,
            fio2: data.fio2,
            pip: data.pip,
            minute_volume: data.minute_volume
          },
          imported_from: data.import_method || 'manual'
        }]);

      return { success: true };
    } catch (error) {
      console.error('Error importing ventilator data:', error);
      return { success: false, error };
    }
  };

  const importPTAInterventions = async (interventions: any[], incidentId: string, patientId: string, facilityId: string) => {
    try {
      const records = interventions.map(intervention => ({
        patient_id: patientId,
        incident_id: incidentId,
        transferring_facility_id: facilityId,
        intervention_type: intervention.type,
        intervention_description: intervention.description,
        performed_at: intervention.performed_at,
        performed_by: intervention.performed_by,
        medication_name: intervention.medication?.name,
        medication_dose: intervention.medication?.dose,
        medication_route: intervention.medication?.route,
        procedure_name: intervention.procedure_name,
        notes: intervention.notes
      }));

      await supabase
        .from('pta_interventions')
        .insert(records);

      return { success: true, count: records.length };
    } catch (error) {
      console.error('Error importing PTA interventions:', error);
      return { success: false, error };
    }
  };

  const repeatVitals = async (patientId: string, newTimestamp?: string) => {
    try {
      const { data: lastVitals } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('obtained_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastVitals) {
        return { success: false, error: 'No previous vitals found' };
      }

      const { id, created_at, ...vitalsCopy } = lastVitals;

      const { data: newVitals } = await supabase
        .from('patient_vitals')
        .insert([{
          ...vitalsCopy,
          obtained_at: newTimestamp || new Date().toISOString(),
          vital_set_number: (lastVitals.vital_set_number || 1) + 1
        }])
        .select()
        .single();

      return { success: true, vitals: newVitals };
    } catch (error) {
      console.error('Error repeating vitals:', error);
      return { success: false, error };
    }
  };

  return {
    scanCardiacMonitor,
    importIVPumpData,
    importVentilatorData,
    importPTAInterventions,
    repeatVitals
  };
};
