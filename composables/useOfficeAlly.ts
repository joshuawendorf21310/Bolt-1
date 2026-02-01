export const useOfficeAlly = () => {
  const config = useRuntimeConfig();

  const generate837P = (claim: any) => {
    const patient = claim.patients;
    const incident = claim.incidents;
    const payer = claim.payers;
    const lines = claim.claim_lines;

    const segments = [];

    segments.push(`ISA*00*          *00*          *ZZ*${config.public.officeAllyId || 'SENDER'}        *ZZ*${payer.payer_id || 'RECEIVER'}      *${formatDate(new Date())}*${formatTime(new Date())}*^*00501*000000001*0*P*:`);

    segments.push(`GS*HC*${config.public.officeAllyId || 'SENDER'}*${payer.payer_id || 'RECEIVER'}*${formatDate(new Date())}*${formatTime(new Date())}*1*X*005010X222A1`);

    segments.push(`ST*837*0001*005010X222A1`);

    segments.push(`BHT*0019*00*${claim.claim_number}*${formatDate(new Date())}*${formatTime(new Date())}*CH`);

    segments.push(`NM1*41*2*${claim.organization?.name || 'EMS AGENCY'}*****46*${claim.organization?.npi || '1234567890'}`);

    segments.push(`NM1*40*2*${payer.name}*****46*${payer.payer_id || '00000'}`);

    segments.push(`HL*1**20*1`);
    segments.push(`PRV*BI*PXC*${claim.organization?.taxonomy_code || '341600000X'}`);

    segments.push(`NM1*85*2*${claim.organization?.name || 'EMS AGENCY'}*****XX*${claim.organization?.npi || '1234567890'}`);

    segments.push(`HL*2*1*22*0`);

    segments.push(`SBR*P*18**${payer.name}*****CI`);

    segments.push(`NM1*IL*1*${patient.last_name}*${patient.first_name}****MI*${patient.primary_insurance_number || ''}`);

    segments.push(`NM1*PR*2*${payer.name}*****PI*${payer.payer_id || ''}`);

    segments.push(`NM1*QC*1*${patient.last_name}*${patient.first_name}****MI*${patient.primary_insurance_number || ''}`);

    segments.push(`DMG*D8*${formatDate(patient.date_of_birth)}*${getGenderCode(patient.gender)}`);

    segments.push(`CLM*${claim.claim_number}*${claim.total_charge.toFixed(2)}***11:B:1*Y*A*Y*Y`);

    segments.push(`DTP*472*D8*${formatDate(claim.service_date)}`);

    segments.push(`CRC*07*Y*AS*DW*IH`);

    if (claim.claim_diagnoses && claim.claim_diagnoses.length > 0) {
      const diagCodes = claim.claim_diagnoses.map((d: any) => d.icd10_code).slice(0, 12);
      segments.push(`HI*ABK:${diagCodes.join('*ABF:')}`);
    }

    lines.forEach((line: any, idx: number) => {
      segments.push(`LX*${idx + 1}`);

      segments.push(
        `SV1*HC:${line.procedure_code}${line.modifier_1 ? ':' + line.modifier_1 : ''}${line.modifier_2 ? ':' + line.modifier_2 : ''}*${line.total_charge.toFixed(2)}*UN*${line.units}***${line.diagnosis_pointers.join(':')}`
      );

      segments.push(`DTP*472*D8*${formatDate(line.service_date)}`);

      if (line.origin_code && line.destination_code) {
        segments.push(`CRC*01*Y*${line.origin_code}${line.destination_code}`);
      }
    });

    segments.push(`SE*${segments.length - 2}*0001`);
    segments.push(`GE*1*1`);
    segments.push(`IEA*1*000000001`);

    return segments.join('~\n') + '~';
  };

  const submitClaim837P = async (claimId: string) => {
    try {
      const { supabase } = useApi();
      const { logAccess } = useAudit();

      const { data: claim } = await supabase
        .from('claims')
        .select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*),
          organization:organizations (*)
        `)
        .eq('id', claimId)
        .single();

      if (!claim) throw new Error('Claim not found');

      const x12Content = generate837P(claim);

      const response = await $fetch('/api/office-ally/submit', {
        method: 'POST',
        body: {
          claimId,
          x12Content
        }
      });

      await supabase
        .from('claim_submissions')
        .insert([{
          claim_id: claimId,
          submission_method: 'office_ally_837p',
          office_ally_status: 'pending',
          submitted_at: new Date().toISOString()
        }]);

      await supabase
        .from('claims')
        .update({
          status: 'submitted',
          submission_method: 'office_ally_837p',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      await logAccess('submit', 'claim', claimId, {
        method: 'office_ally_837p',
        claim_number: claim.claim_number
      });

      return { success: true, response };
    } catch (error) {
      console.error('Error submitting claim to Office Ally:', error);
      return { success: false, error };
    }
  };

  const checkClaimStatus = async (claimId: string) => {
    try {
      const response = await $fetch(`/api/office-ally/status/${claimId}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error checking claim status:', error);
      return { success: false, error };
    }
  };

  const verifyEligibility = async (
    payerId: string,
    memberId: string,
    serviceDate: string
  ) => {
    try {
      const response = await $fetch('/api/office-ally/eligibility', {
        method: 'POST',
        body: {
          payerId,
          memberId,
          serviceDate
        }
      });

      return { success: true, data: response };
    } catch (error) {
      console.error('Error verifying eligibility:', error);
      return { success: false, error };
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}${minutes}`;
  };

  const getGenderCode = (gender: string) => {
    const mapping = {
      male: 'M',
      female: 'F',
      other: 'U',
      unknown: 'U'
    };
    return mapping[gender.toLowerCase()] || 'U';
  };

  return {
    generate837P,
    submitClaim837P,
    checkClaimStatus,
    verifyEligibility
  };
};
