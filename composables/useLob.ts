export const useLob = () => {
  const generateCMS1500HTML = (claim: any) => {
    const patient = claim.patients;
    const incident = claim.incidents;
    const payer = claim.payers;
    const lines = claim.claim_lines;
    const diagnoses = claim.claim_diagnoses || [];
    const org = claim.organization;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 0;
      padding: 20px;
    }
    .form-container {
      width: 8.5in;
      height: 11in;
      position: relative;
    }
    .field {
      position: absolute;
      font-size: 9pt;
    }
    .field-label {
      font-size: 6pt;
      color: #666;
    }
    .checkbox {
      width: 10px;
      height: 10px;
      border: 1px solid #000;
      display: inline-block;
    }
    .checkbox.checked::after {
      content: 'X';
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2 style="text-align: center;">HEALTH INSURANCE CLAIM FORM (CMS-1500)</h2>

    <div class="field" style="top: 100px; left: 50px;">
      <div class="field-label">1. MEDICARE MEDICAID TRICARE CHAMPVA GROUP HEALTH PLAN FECA OTHER</div>
      <div>
        <span class="checkbox ${payer.payer_type === 'medicare' ? 'checked' : ''}"></span> Medicare
        <span class="checkbox ${payer.payer_type === 'medicaid' ? 'checked' : ''}"></span> Medicaid
        <span class="checkbox ${payer.payer_type === 'commercial' ? 'checked' : ''}"></span> Other
      </div>
    </div>

    <div class="field" style="top: 140px; left: 50px;">
      <div class="field-label">2. PATIENT'S NAME</div>
      <div>${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''}</div>
    </div>

    <div class="field" style="top: 140px; left: 400px;">
      <div class="field-label">3. PATIENT'S DATE OF BIRTH</div>
      <div>${formatDateSlash(patient.date_of_birth)} ${patient.gender === 'male' ? 'M' : 'F'}</div>
    </div>

    <div class="field" style="top: 180px; left: 50px;">
      <div class="field-label">5. PATIENT'S ADDRESS</div>
      <div>${patient.address_line1 || ''}</div>
      <div>${patient.city || ''}, ${patient.state || ''} ${patient.zip || ''}</div>
    </div>

    <div class="field" style="top: 180px; left: 400px;">
      <div class="field-label">6. PATIENT RELATIONSHIP TO INSURED</div>
      <div>
        <span class="checkbox ${patient.primary_subscriber_relationship === 'self' ? 'checked' : ''}"></span> Self
        <span class="checkbox ${patient.primary_subscriber_relationship === 'spouse' ? 'checked' : ''}"></span> Spouse
        <span class="checkbox ${patient.primary_subscriber_relationship === 'child' ? 'checked' : ''}"></span> Child
      </div>
    </div>

    <div class="field" style="top: 260px; left: 50px;">
      <div class="field-label">11. INSURED'S POLICY GROUP OR FECA NUMBER</div>
      <div>${patient.primary_insurance_number || ''}</div>
    </div>

    <div class="field" style="top: 300px; left: 50px;">
      <div class="field-label">12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE</div>
      <div>SIGNATURE ON FILE ${formatDateSlash(claim.service_date)}</div>
    </div>

    <div class="field" style="top: 300px; left: 400px;">
      <div class="field-label">13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE</div>
      <div>SIGNATURE ON FILE</div>
    </div>

    <div class="field" style="top: 380px; left: 50px;">
      <div class="field-label">21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY</div>
      <div>
        A. ${diagnoses[0]?.icd10_code || ''}<br>
        B. ${diagnoses[1]?.icd10_code || ''}<br>
        C. ${diagnoses[2]?.icd10_code || ''}<br>
        D. ${diagnoses[3]?.icd10_code || ''}
      </div>
    </div>

    <div class="field" style="top: 480px; left: 50px;">
      <div class="field-label">24. SERVICE LINES</div>
      <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; font-size: 8pt;">
        <tr>
          <th>DATE</th>
          <th>PLACE</th>
          <th>PROCEDURES</th>
          <th>DIAG PTR</th>
          <th>CHARGES</th>
          <th>UNITS</th>
        </tr>
        ${lines.map((line: any) => `
          <tr>
            <td>${formatDateSlash(line.service_date)}</td>
            <td>${line.origin_code}</td>
            <td>${line.procedure_code} ${line.modifier_1 || ''} ${line.modifier_2 || ''}</td>
            <td>${line.diagnosis_pointers.join(',')}</td>
            <td>$${line.total_charge.toFixed(2)}</td>
            <td>${line.units}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div class="field" style="top: 680px; left: 50px;">
      <div class="field-label">28. TOTAL CHARGE</div>
      <div>$${claim.total_charge.toFixed(2)}</div>
    </div>

    <div class="field" style="top: 720px; left: 50px;">
      <div class="field-label">33. BILLING PROVIDER INFO & PH #</div>
      <div>
        ${org.name}<br>
        ${org.address_line1}<br>
        ${org.city}, ${org.state} ${org.zip}<br>
        ${org.phone}<br>
        NPI: ${org.npi}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };

  const sendPaperClaim = async (claimId: string) => {
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

      const htmlContent = generateCMS1500HTML(claim);

      const response = await $fetch('/api/lob/send-claim', {
        method: 'POST',
        body: {
          claimId,
          htmlContent,
          to: {
            name: claim.payers.name,
            address_line1: claim.payers.address_line1,
            city: claim.payers.city,
            state: claim.payers.state,
            zip: claim.payers.zip
          },
          from: {
            name: claim.organization.name,
            address_line1: claim.organization.address_line1,
            city: claim.organization.city,
            state: claim.organization.state,
            zip: claim.organization.zip
          }
        }
      });

      await supabase
        .from('claim_submissions')
        .insert([{
          claim_id: claimId,
          submission_method: 'lob_paper',
          lob_letter_id: response.id,
          lob_tracking_number: response.tracking_number,
          lob_expected_delivery_date: response.expected_delivery_date,
          lob_status: 'processed',
          submitted_at: new Date().toISOString()
        }]);

      await supabase
        .from('claims')
        .update({
          status: 'submitted',
          submission_method: 'lob_paper',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      await logAccess('submit', 'claim', claimId, {
        method: 'lob_paper',
        claim_number: claim.claim_number,
        lob_letter_id: response.id
      });

      return { success: true, response };
    } catch (error) {
      console.error('Error sending paper claim via Lob:', error);
      return { success: false, error };
    }
  };

  const trackLobLetter = async (letterId: string) => {
    try {
      const response = await $fetch(`/api/lob/track/${letterId}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error tracking Lob letter:', error);
      return { success: false, error };
    }
  };

  const formatDateSlash = (date: Date | string) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return {
    generateCMS1500HTML,
    sendPaperClaim,
    trackLobLetter
  };
};
