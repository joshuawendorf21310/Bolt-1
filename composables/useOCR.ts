export const useOCR = () => {
  const { supabase } = useApi();
  const { logAccess } = useAudit();

  const scanDocument = async (
    file: File,
    documentType: 'facesheet' | 'pcs_form' | 'aob' | 'abn' | 'insurance_card',
    incidentId: string,
    patientId: string,
    organizationId: string
  ) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${organizationId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('epcr-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('epcr-documents')
        .getPublicUrl(filePath);

      const { data: doc, error: docError } = await supabase
        .from('scanned_documents')
        .insert([{
          organization_id: organizationId,
          incident_id: incidentId,
          patient_id: patientId,
          document_type: documentType,
          original_file_url: publicUrl,
          ocr_status: 'pending'
        }])
        .select()
        .single();

      if (docError) throw docError;

      const ocrResult = await $fetch('/api/ocr/process', {
        method: 'POST',
        body: {
          documentId: doc.id,
          documentType,
          fileUrl: publicUrl
        }
      });

      await logAccess('scan', 'document', doc.id, { document_type: documentType });

      return { success: true, document: doc, ocrResult };
    } catch (error) {
      console.error('Error scanning document:', error);
      return { success: false, error };
    }
  };

  const autoPopulateFromOCR = async (documentId: string, incidentId: string, patientId: string) => {
    try {
      const { data: extractions } = await supabase
        .from('ocr_extractions')
        .select('*')
        .eq('scanned_document_id', documentId);

      const fieldMappings = {
        patient_first_name: 'first_name',
        patient_last_name: 'last_name',
        date_of_birth: 'date_of_birth',
        address: 'address_line1',
        city: 'city',
        state: 'state',
        zip: 'zip',
        phone: 'home_phone',
        insurance_number: 'primary_insurance_number',
        insurance_group: 'primary_insurance_group',
        diagnosis: 'primary_diagnosis',
        medications: 'current_medications'
      };

      const updates: Record<string, any> = {};
      extractions?.forEach((ext: any) => {
        const targetField = fieldMappings[ext.field_name];
        if (targetField && ext.confidence > 0.8) {
          updates[targetField] = ext.field_value;
        }
      });

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('patients')
          .update(updates)
          .eq('id', patientId);

        await supabase
          .from('ocr_extractions')
          .update({ auto_populated: true })
          .eq('scanned_document_id', documentId);
      }

      return { success: true, fieldsUpdated: Object.keys(updates).length };
    } catch (error) {
      console.error('Error auto-populating from OCR:', error);
      return { success: false, error };
    }
  };

  const scanDeviceScreen = async (
    imageFile: File,
    deviceType: 'cardiac_monitor' | 'iv_pump' | 'ventilator',
    incidentId: string,
    patientId: string,
    organizationId: string
  ) => {
    try {
      const fileName = `${Date.now()}-${deviceType}-${imageFile.name}`;
      const filePath = `${organizationId}/device-screens/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('epcr-documents')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('epcr-documents')
        .getPublicUrl(filePath);

      const config = useRuntimeConfig();
      const supabaseUrl = config.public.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = config.public.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const ocrResult = await $fetch(`${supabaseUrl}/functions/v1/ocr-scan-device`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          imageUrl: publicUrl,
          deviceType,
          incidentId,
          patientId,
          organizationId
        }
      });

      if (ocrResult.success) {
        await supabase
          .from('device_readings')
          .insert([{
            patient_id: patientId,
            incident_id: incidentId,
            device_type: deviceType,
            device_manufacturer: ocrResult.deviceInfo?.manufacturer,
            device_model: ocrResult.deviceInfo?.model,
            reading_timestamp: new Date().toISOString(),
            data: ocrResult.extractedData,
            imported_from: 'ocr'
          }]);

        if (deviceType === 'cardiac_monitor' && ocrResult.vitals) {
          await supabase
            .from('patient_vitals')
            .insert([{
              patient_id: patientId,
              obtained_at: new Date().toISOString(),
              heart_rate: ocrResult.vitals.heart_rate,
              systolic_bp: ocrResult.vitals.systolic_bp,
              diastolic_bp: ocrResult.vitals.diastolic_bp,
              respiratory_rate: ocrResult.vitals.respiratory_rate,
              pulse_oximetry: ocrResult.vitals.spo2,
              temperature: ocrResult.vitals.temperature,
              etco2: ocrResult.vitals.etco2,
              source: 'ocr_cardiac_monitor'
            }]);

          if (ocrResult.rhythmStrip) {
            await supabase
              .from('rhythm_strips')
              .insert([{
                patient_id: patientId,
                incident_id: incidentId,
                strip_timestamp: new Date().toISOString(),
                image_url: publicUrl,
                heart_rate: ocrResult.vitals.heart_rate,
                rhythm_type: ocrResult.rhythmStrip.rhythm_type,
                rhythm_interpretation: ocrResult.rhythmStrip.interpretation,
                ai_analysis: ocrResult.rhythmStrip.analysis
              }]);
          }
        }

        if (deviceType === 'iv_pump' && ocrResult.pumpData) {
          await supabase
            .from('procedures')
            .insert([{
              patient_id: patientId,
              procedure_code: '36000',
              procedure_description: 'IV Infusion',
              performed_at: new Date().toISOString(),
              is_medication: true,
              medication_name: ocrResult.pumpData.medication,
              medication_dose: ocrResult.pumpData.dose,
              medication_dose_unit: ocrResult.pumpData.dose_unit,
              medication_route: 'IV',
              infusion_rate: ocrResult.pumpData.rate,
              infusion_rate_unit: ocrResult.pumpData.rate_unit
            }]);
        }

        if (deviceType === 'ventilator' && ocrResult.ventData) {
          await supabase
            .from('procedures')
            .insert([{
              patient_id: patientId,
              procedure_code: '94002',
              procedure_description: 'Mechanical Ventilation',
              performed_at: new Date().toISOString()
            }]);

          await supabase
            .from('patient_vitals')
            .insert([{
              patient_id: patientId,
              obtained_at: new Date().toISOString(),
              respiratory_rate: ocrResult.ventData.respiratory_rate,
              source: 'ocr_ventilator'
            }]);
        }

        await logAccess('scan', 'device_screen', patientId, { device_type: deviceType });

        return {
          success: true,
          data: ocrResult.extractedData,
          vitals: ocrResult.vitals,
          message: `Successfully scanned ${deviceType} and imported data`
        };
      }

      return { success: false, error: 'OCR processing failed' };
    } catch (error) {
      console.error('Error scanning device screen:', error);
      return { success: false, error };
    }
  };

  const quickScanVitals = async (
    imageFile: File,
    patientId: string,
    incidentId: string,
    organizationId: string
  ) => {
    return await scanDeviceScreen(imageFile, 'cardiac_monitor', incidentId, patientId, organizationId);
  };

  const quickScanIVPump = async (
    imageFile: File,
    patientId: string,
    incidentId: string,
    organizationId: string
  ) => {
    return await scanDeviceScreen(imageFile, 'iv_pump', incidentId, patientId, organizationId);
  };

  const quickScanVentilator = async (
    imageFile: File,
    patientId: string,
    incidentId: string,
    organizationId: string
  ) => {
    return await scanDeviceScreen(imageFile, 'ventilator', incidentId, patientId, organizationId);
  };

  return {
    scanDocument,
    autoPopulateFromOCR,
    scanDeviceScreen,
    quickScanVitals,
    quickScanIVPump,
    quickScanVentilator
  };
};
