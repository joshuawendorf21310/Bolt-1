export const useNEMSISExport = () => {
  const { supabase } = useApi();

  const generateNEMSISXML = async (incidentId: string) => {
    try {
      const { data: incident } = await supabase
        .from('incidents')
        .select(`
          *,
          patients (*),
          patient_vitals (*),
          patient_history (*),
          procedures (*),
          transport_data (*),
          pta_interventions (*),
          device_readings (*),
          rhythm_strips (*),
          organization:organizations (*)
        `)
        .eq('id', incidentId)
        .single();

      if (!incident) {
        throw new Error('Incident not found');
      }

      const { data: tripLog } = await supabase
        .from('trip_logs')
        .select('*')
        .eq('incident_id', incidentId)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lightsSirensEvents } = await supabase
        .from('lights_sirens_events')
        .select('*')
        .eq('incident_id', incidentId)
        .order('timestamp', { ascending: true });

      const xml = buildNEMSISv35XML(incident, tripLog, lightsSirensEvents || []);

      if (lightsSirensEvents && lightsSirensEvents.length > 0) {
        const eventIds = lightsSirensEvents.map(e => e.id);
        await supabase
          .from('lights_sirens_events')
          .update({ exported_to_nemsis: true })
          .in('id', eventIds);
      }

      await supabase
        .from('incidents')
        .update({
          nemsis_xml: xml,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      return { success: true, xml };
    } catch (error) {
      console.error('Error generating NEMSIS XML:', error);
      return { success: false, error };
    }
  };

  const buildNEMSISv35XML = (incident: any, tripLog: any = null, lightsSirensEvents: any[] = []) => {
    const patient = incident.patients?.[0];
    const transport = incident.transport_data?.[0];
    const vitals = incident.patient_vitals || [];
    const procedures = incident.procedures || [];
    const history = incident.patient_history?.[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<EMSDataSet xmlns="http://www.nemsis.org" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
    xml += '  <Header>\n';
    xml += `    <DemographicGroup>${incident.organization?.nemsis_state_id || '00'}</DemographicGroup>\n`;
    xml += `    <PatientCareReportNumber>${incident.pcr_number || incident.incident_number}</PatientCareReportNumber>\n`;
    xml += '  </Header>\n';

    xml += '  <eResponse>\n';
    xml += `    <eResponse.01>${incident.organization?.nemsis_state_id || '00'}</eResponse.01>\n`;
    xml += `    <eResponse.03>${incident.incident_number}</eResponse.03>\n`;

    if (incident.call_received_at) {
      xml += `    <eTimes.01>${formatNEMSISDateTime(incident.call_received_at)}</eTimes.01>\n`;
    }
    if (incident.unit_notified_at) {
      xml += `    <eTimes.02>${formatNEMSISDateTime(incident.unit_notified_at)}</eTimes.02>\n`;
    }
    if (incident.unit_enroute_at) {
      xml += `    <eTimes.03>${formatNEMSISDateTime(incident.unit_enroute_at)}</eTimes.03>\n`;
    }
    if (incident.unit_arrived_scene_at) {
      xml += `    <eTimes.06>${formatNEMSISDateTime(incident.unit_arrived_scene_at)}</eTimes.06>\n`;
    }
    if (incident.arrived_patient_at) {
      xml += `    <eTimes.07>${formatNEMSISDateTime(incident.arrived_patient_at)}</eTimes.07>\n`;
    }
    if (incident.unit_left_scene_at) {
      xml += `    <eTimes.09>${formatNEMSISDateTime(incident.unit_left_scene_at)}</eTimes.09>\n`;
    }
    if (incident.arrived_destination_at) {
      xml += `    <eTimes.11>${formatNEMSISDateTime(incident.arrived_destination_at)}</eTimes.11>\n`;
    }

    if (lightsSirensEvents.length > 0) {
      const lightsUsed = lightsSirensEvents.some(e => e.event_type.includes('lights'));
      const sirensUsed = lightsSirensEvents.some(e => e.event_type.includes('sirens'));

      if (lightsUsed) {
        xml += `    <eResponse.23>3323001</eResponse.23>\n`;
      }
      if (sirensUsed) {
        xml += `    <eResponse.23>3323003</eResponse.23>\n`;
      }
    }

    xml += '  </eResponse>\n';

    if (patient) {
      xml += '  <ePatient>\n';
      xml += `    <ePatient.13>${patient.last_name || ''}</ePatient.13>\n`;
      xml += `    <ePatient.14>${patient.first_name || ''}</ePatient.14>\n`;

      if (patient.date_of_birth) {
        xml += `    <ePatient.17>${formatNEMSISDate(patient.date_of_birth)}</ePatient.17>\n`;
      }

      if (patient.gender) {
        const genderCode = { male: '9906001', female: '9906003', other: '9906005', unknown: '9906009' }[patient.gender];
        xml += `    <ePatient.15>${genderCode}</ePatient.15>\n`;
      }

      xml += '  </ePatient>\n';
    }

    if (history) {
      xml += '  <eHistory>\n';

      if (history.past_medical_history && history.past_medical_history.length > 0) {
        history.past_medical_history.forEach((condition: string) => {
          xml += `    <eHistory.01>${condition}</eHistory.01>\n`;
        });
      }

      if (history.current_medications && history.current_medications.length > 0) {
        history.current_medications.forEach((med: string) => {
          xml += `    <eHistory.02>${med}</eHistory.02>\n`;
        });
      }

      if (history.allergies && history.allergies.length > 0) {
        history.allergies.forEach((allergy: string) => {
          xml += `    <eHistory.03>${allergy}</eHistory.03>\n`;
        });
      }

      xml += '  </eHistory>\n';
    }

    xml += '  <eVitals>\n';
    vitals.forEach((vital: any, index: number) => {
      xml += '    <eVitals.VitalGroup>\n';
      xml += `      <eVitals.01>${formatNEMSISDateTime(vital.obtained_at)}</eVitals.01>\n`;

      if (vital.systolic_bp) {
        xml += `      <eVitals.06>${vital.systolic_bp}</eVitals.06>\n`;
      }
      if (vital.diastolic_bp) {
        xml += `      <eVitals.07>${vital.diastolic_bp}</eVitals.07>\n`;
      }
      if (vital.heart_rate) {
        xml += `      <eVitals.10>${vital.heart_rate}</eVitals.10>\n`;
      }
      if (vital.pulse_oximetry) {
        xml += `      <eVitals.16>${vital.pulse_oximetry}</eVitals.16>\n`;
      }
      if (vital.respiratory_rate) {
        xml += `      <eVitals.12>${vital.respiratory_rate}</eVitals.12>\n`;
      }
      if (vital.gcs_total) {
        xml += `      <eVitals.19>${vital.gcs_total}</eVitals.19>\n`;
      }

      xml += '    </eVitals.VitalGroup>\n';
    });
    xml += '  </eVitals>\n';

    xml += '  <eProcedures>\n';
    procedures.forEach((proc: any) => {
      xml += '    <eProcedures.ProcedureGroup>\n';
      xml += `      <eProcedures.01>${formatNEMSISDateTime(proc.performed_at)}</eProcedures.01>\n`;
      xml += `      <eProcedures.03>${proc.procedure_code}</eProcedures.03>\n`;

      if (proc.is_medication) {
        xml += `      <eMedications.03>${proc.medication_name}</eMedications.03>\n`;
        xml += `      <eMedications.04>${proc.medication_dose}</eMedications.04>\n`;
        xml += `      <eMedications.05>${proc.medication_dose_unit}</eMedications.05>\n`;
        xml += `      <eMedications.06>${proc.medication_route}</eMedications.06>\n`;
      }

      xml += '    </eProcedures.ProcedureGroup>\n';
    });
    xml += '  </eProcedures>\n';

    if (transport) {
      xml += '  <eDisposition>\n';
      xml += `    <eDisposition.01>${mapDispositionCode(transport.transport_disposition)}</eDisposition.01>\n`;

      if (transport.destination_facility_id) {
        xml += `    <eDisposition.12>${transport.destination_facility_id}</eDisposition.12>\n`;
      }

      const mileage = tripLog?.trip_distance || transport.total_mileage;
      if (mileage) {
        xml += `    <eDisposition.22>${mileage.toFixed(2)}</eDisposition.22>\n`;
      }

      xml += '  </eDisposition>\n';
    }

    xml += '</EMSDataSet>';

    return xml;
  };

  const formatNEMSISDateTime = (dateTime: string) => {
    return new Date(dateTime).toISOString().replace(/\.\d{3}Z$/, 'Z');
  };

  const formatNEMSISDate = (date: string) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const mapDispositionCode = (disposition: string) => {
    const codes = {
      transported: '4212001',
      refused: '4212007',
      cancelled: '4212009',
      dead_on_scene: '4212011'
    };
    return codes[disposition] || '4212001';
  };

  const exportePCRPDF = async (incidentId: string) => {
    try {
      const { data: incident } = await supabase
        .from('incidents')
        .select(`
          *,
          patients (*),
          patient_vitals (*),
          patient_history (*),
          procedures (*),
          transport_data (*),
          organization:organizations (*)
        `)
        .eq('id', incidentId)
        .single();

      if (!incident) {
        throw new Error('Incident not found');
      }

      const response = await $fetch('/api/epcr/print', {
        method: 'POST',
        body: { incident }
      });

      return { success: true, pdfUrl: response.pdfUrl };
    } catch (error) {
      console.error('Error exporting ePCR PDF:', error);
      return { success: false, error };
    }
  };

  return {
    generateNEMSISXML,
    exportePCRPDF
  };
};
