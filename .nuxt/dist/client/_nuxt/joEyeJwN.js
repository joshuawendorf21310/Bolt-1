import{$ as O,G as z,c as v,a as s,m as A,y as C,g as M,q as I,t as f,F as B,s as F,r as L,z as P,o as x,B as G,A as U}from"./Ys5eufZ_.js";import{u as E}from"./C9cEisLn.js";import"./whLkva8r.js";const H=()=>{const{supabase:m}=E(),_={BLS:{code:"A0428",description:"Ambulance service, basic life support, non-emergency transport"},BLS_EMERGENCY:{code:"A0429",description:"Ambulance service, basic life support, emergency transport"},ALS1:{code:"A0426",description:"Ambulance service, advanced life support, non-emergency transport, level 1"},ALS1_EMERGENCY:{code:"A0427",description:"Ambulance service, advanced life support, emergency transport, level 1"},ALS2:{code:"A0433",description:"Ambulance service, advanced life support, level 2"},SCT:{code:"A0434",description:"Ambulance service, specialty care transport"},MILEAGE:{code:"A0425",description:"Ground mileage, per statute mile"}},b=(e,t)=>e==="BLS"?t?_.BLS_EMERGENCY:_.BLS:e==="ALS1"?t?_.ALS1_EMERGENCY:_.ALS1:e==="ALS2"?_.ALS2:e==="SCT"?_.SCT:_.BLS;return{AMBULANCE_CODES:_,determineAmbulanceCode:b,generateClaimFromIncident:async(e,t)=>{try{const{data:i,error:p}=await m.from("incidents").select(`
          *,
          patients (*),
          transport_data (*)
        `).eq("id",e).single();if(p)throw p;const a=i.patients[0],n=i.transport_data[0];if(!n)throw new Error("No transport data found for this incident");const y=`CLM-${Date.now()}-${Math.random().toString(36).substr(2,9).toUpperCase()}`,$=n.patient_acuity==="emergent",g=b(n.level_of_service,$),r={BLS:450,BLS_EMERGENCY:550,ALS1:650,ALS1_EMERGENCY:750,ALS2:950,SCT:1200}[n.level_of_service]||450,c=12.5,S=n.total_mileage*c,D=r+S,{data:w,error:N}=await m.from("claims").insert([{organization_id:t,incident_id:e,patient_id:a.id,payer_id:a.primary_insurance_payer_id,claim_number:y,claim_type:"professional",total_charge:D,balance:D,service_date:new Date(n.created_at).toISOString().split("T")[0],status:"draft",medical_necessity_documented:!!n.medical_necessity_reason}]).select().single();if(N)throw N;const R=[{claim_id:w.id,line_number:1,procedure_code:g.code,procedure_description:g.description,modifier_1:"QM",modifier_2:"QN",origin_code:n.origin_code,destination_code:n.destination_code||"H",unit_charge:r,units:1,total_charge:r,service_date:w.service_date,diagnosis_pointers:["A"]}];n.total_mileage>0&&R.push({claim_id:w.id,line_number:2,procedure_code:_.MILEAGE.code,procedure_description:_.MILEAGE.description,origin_code:n.origin_code,destination_code:n.destination_code||"H",unit_charge:c,units:n.total_mileage,total_charge:S,service_date:w.service_date,diagnosis_pointers:["A"]});const{error:T}=await m.from("claim_lines").insert(R);if(T)throw T;return await m.from("audit_logs").insert([{organization_id:t,action:"create",resource_type:"claim",resource_id:w.id,details:{claim_number:y,incident_id:e}}]),{success:!0,claim:w}}catch(i){return console.error("Error generating claim:",i),{success:!1,error:i}}},getClaims:async(e,t={})=>{try{let i=m.from("claims").select(`
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
        `).eq("organization_id",e).order("created_at",{ascending:!1});t.status&&(i=i.eq("status",t.status));const{data:p,error:a}=await i;if(a)throw a;return{success:!0,data:p}}catch(i){return console.error("Error fetching claims:",i),{success:!1,error:i}}},submitClaim:async(e,t)=>{try{const{data:i,error:p}=await m.from("claims").select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*)
        `).eq("id",e).single();if(p)throw p;const{error:a}=await m.from("claims").update({status:"submitted",submission_method:t,updated_at:new Date().toISOString()}).eq("id",e);if(a)throw a;const{data:n,error:y}=await m.from("claim_submissions").insert([{claim_id:e,submission_method:t,submitted_at:new Date().toISOString()}]).select().single();if(y)throw y;return{success:!0,submission:n}}catch(i){return console.error("Error submitting claim:",i),{success:!1,error:i}}},analyzeDenials:async e=>{try{const{data:t,error:i}=await m.from("denied_claims").select(`
          *,
          claims (
            claim_number,
            total_charge,
            payers (name)
          )
        `).eq("claims.organization_id",e).order("denied_at",{ascending:!1});if(i)throw i;const p=t.reduce((a,n)=>{const y=n.denial_reason_description;return a[y]||(a[y]={count:0,total_amount:0}),a[y].count++,a[y].total_amount+=n.claims.total_charge,a},{});return{success:!0,data:t,denialsByReason:p,totalDenials:t.length,totalAmount:t.reduce((a,n)=>a+n.claims.total_charge,0)}}catch(t){return console.error("Error analyzing denials:",t),{success:!1,error:t}}},validateMedicalNecessity:e=>{const t=[];return(!e.medical_necessity_reason||e.medical_necessity_reason.length<20)&&t.push("Medical necessity reason is too short or missing"),e.patient_acuity||t.push("Patient acuity not documented"),(!e.patient_condition_codes||e.patient_condition_codes.length===0)&&t.push("No condition codes documented"),e.level_of_service==="ALS2"&&e.patient_acuity!=="emergent"&&t.push("ALS2 typically requires emergent acuity"),{valid:t.length===0,issues:t}}}},k=()=>{const{supabase:m}=E();return{logAccess:async(u,o,l,d)=>{try{const{data:{user:e}}=await m.auth.getUser(),{data:t}=await m.from("users").select("organization_id").eq("id",e?.id).single();await m.from("audit_logs").insert([{organization_id:t?.organization_id,user_id:e?.id,action:u,resource_type:o,resource_id:l,details:d||{},created_at:new Date().toISOString()}])}catch(e){console.error("Failed to log audit entry:",e)}},getAuditLogs:async(u,o={})=>{try{let l=m.from("audit_logs").select(`
          *,
          users (
            full_name,
            email
          )
        `).eq("organization_id",u).order("created_at",{ascending:!1}).limit(100);o.resource_type&&(l=l.eq("resource_type",o.resource_type)),o.action&&(l=l.eq("action",o.action)),o.user_id&&(l=l.eq("user_id",o.user_id));const{data:d,error:e}=await l;if(e)throw e;return{success:!0,data:d}}catch(l){return console.error("Error fetching audit logs:",l),{success:!1,error:l}}},getActivitySummary:async(u,o=7)=>{try{const l=new Date;l.setDate(l.getDate()-o);const{data:d,error:e}=await m.from("audit_logs").select("action, resource_type, created_at").eq("organization_id",u).gte("created_at",l.toISOString());if(e)throw e;return{success:!0,summary:{totalActions:d.length,byAction:d.reduce((i,p)=>(i[p.action]=(i[p.action]||0)+1,i),{}),byResourceType:d.reduce((i,p)=>(i[p.resource_type]=(i[p.resource_type]||0)+1,i),{}),byDay:d.reduce((i,p)=>{const a=new Date(p.created_at).toISOString().split("T")[0];return i[a]=(i[a]||0)+1,i},{})}}}catch(l){return console.error("Error getting activity summary:",l),{success:!1,error:l}}}}},q=()=>{const m=O(),_=e=>{const t=e.patients;e.incidents;const i=e.payers,p=e.claim_lines,a=[];if(a.push(`ISA*00*          *00*          *ZZ*${m.public.officeAllyId||"SENDER"}        *ZZ*${i.payer_id||"RECEIVER"}      *${o(new Date)}*${l(new Date)}*^*00501*000000001*0*P*:`),a.push(`GS*HC*${m.public.officeAllyId||"SENDER"}*${i.payer_id||"RECEIVER"}*${o(new Date)}*${l(new Date)}*1*X*005010X222A1`),a.push("ST*837*0001*005010X222A1"),a.push(`BHT*0019*00*${e.claim_number}*${o(new Date)}*${l(new Date)}*CH`),a.push(`NM1*41*2*${e.organization?.name||"EMS AGENCY"}*****46*${e.organization?.npi||"1234567890"}`),a.push(`NM1*40*2*${i.name}*****46*${i.payer_id||"00000"}`),a.push("HL*1**20*1"),a.push(`PRV*BI*PXC*${e.organization?.taxonomy_code||"341600000X"}`),a.push(`NM1*85*2*${e.organization?.name||"EMS AGENCY"}*****XX*${e.organization?.npi||"1234567890"}`),a.push("HL*2*1*22*0"),a.push(`SBR*P*18**${i.name}*****CI`),a.push(`NM1*IL*1*${t.last_name}*${t.first_name}****MI*${t.primary_insurance_number||""}`),a.push(`NM1*PR*2*${i.name}*****PI*${i.payer_id||""}`),a.push(`NM1*QC*1*${t.last_name}*${t.first_name}****MI*${t.primary_insurance_number||""}`),a.push(`DMG*D8*${o(t.date_of_birth)}*${d(t.gender)}`),a.push(`CLM*${e.claim_number}*${e.total_charge.toFixed(2)}***11:B:1*Y*A*Y*Y`),a.push(`DTP*472*D8*${o(e.service_date)}`),a.push("CRC*07*Y*AS*DW*IH"),e.claim_diagnoses&&e.claim_diagnoses.length>0){const n=e.claim_diagnoses.map(y=>y.icd10_code).slice(0,12);a.push(`HI*ABK:${n.join("*ABF:")}`)}return p.forEach((n,y)=>{a.push(`LX*${y+1}`),a.push(`SV1*HC:${n.procedure_code}${n.modifier_1?":"+n.modifier_1:""}${n.modifier_2?":"+n.modifier_2:""}*${n.total_charge.toFixed(2)}*UN*${n.units}***${n.diagnosis_pointers.join(":")}`),a.push(`DTP*472*D8*${o(n.service_date)}`),n.origin_code&&n.destination_code&&a.push(`CRC*01*Y*${n.origin_code}${n.destination_code}`)}),a.push(`SE*${a.length-2}*0001`),a.push("GE*1*1"),a.push("IEA*1*000000001"),a.join(`~
`)+"~"},b=async e=>{try{const{supabase:t}=E(),{logAccess:i}=k(),{data:p}=await t.from("claims").select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*),
          organization:organizations (*)
        `).eq("id",e).single();if(!p)throw new Error("Claim not found");const a=_(p),n=await $fetch("/api/office-ally/submit",{method:"POST",body:{claimId:e,x12Content:a}});return await t.from("claim_submissions").insert([{claim_id:e,submission_method:"office_ally_837p",office_ally_status:"pending",submitted_at:new Date().toISOString()}]),await t.from("claims").update({status:"submitted",submission_method:"office_ally_837p",updated_at:new Date().toISOString()}).eq("id",e),await i("submit","claim",e,{method:"office_ally_837p",claim_number:p.claim_number}),{success:!0,response:n}}catch(t){return console.error("Error submitting claim to Office Ally:",t),{success:!1,error:t}}},h=async e=>{try{return{success:!0,data:await $fetch(`/api/office-ally/status/${e}`)}}catch(t){return console.error("Error checking claim status:",t),{success:!1,error:t}}},u=async(e,t,i)=>{try{return{success:!0,data:await $fetch("/api/office-ally/eligibility",{method:"POST",body:{payerId:e,memberId:t,serviceDate:i}})}}catch(p){return console.error("Error verifying eligibility:",p),{success:!1,error:p}}},o=e=>{const t=new Date(e),i=t.getFullYear(),p=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${i}${p}${a}`},l=e=>{const t=String(e.getHours()).padStart(2,"0"),i=String(e.getMinutes()).padStart(2,"0");return`${t}${i}`},d=e=>({male:"M",female:"F",other:"U",unknown:"U"})[e.toLowerCase()]||"U";return{generate837P:_,submitClaim837P:b,checkClaimStatus:h,verifyEligibility:u}},Y=()=>{const m=u=>{const o=u.patients;u.incidents;const l=u.payers,d=u.claim_lines,e=u.claim_diagnoses||[],t=u.organization;return`
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
        <span class="checkbox ${l.payer_type==="medicare"?"checked":""}"></span> Medicare
        <span class="checkbox ${l.payer_type==="medicaid"?"checked":""}"></span> Medicaid
        <span class="checkbox ${l.payer_type==="commercial"?"checked":""}"></span> Other
      </div>
    </div>

    <div class="field" style="top: 140px; left: 50px;">
      <div class="field-label">2. PATIENT'S NAME</div>
      <div>${o.last_name}, ${o.first_name} ${o.middle_name||""}</div>
    </div>

    <div class="field" style="top: 140px; left: 400px;">
      <div class="field-label">3. PATIENT'S DATE OF BIRTH</div>
      <div>${h(o.date_of_birth)} ${o.gender==="male"?"M":"F"}</div>
    </div>

    <div class="field" style="top: 180px; left: 50px;">
      <div class="field-label">5. PATIENT'S ADDRESS</div>
      <div>${o.address_line1||""}</div>
      <div>${o.city||""}, ${o.state||""} ${o.zip||""}</div>
    </div>

    <div class="field" style="top: 180px; left: 400px;">
      <div class="field-label">6. PATIENT RELATIONSHIP TO INSURED</div>
      <div>
        <span class="checkbox ${o.primary_subscriber_relationship==="self"?"checked":""}"></span> Self
        <span class="checkbox ${o.primary_subscriber_relationship==="spouse"?"checked":""}"></span> Spouse
        <span class="checkbox ${o.primary_subscriber_relationship==="child"?"checked":""}"></span> Child
      </div>
    </div>

    <div class="field" style="top: 260px; left: 50px;">
      <div class="field-label">11. INSURED'S POLICY GROUP OR FECA NUMBER</div>
      <div>${o.primary_insurance_number||""}</div>
    </div>

    <div class="field" style="top: 300px; left: 50px;">
      <div class="field-label">12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE</div>
      <div>SIGNATURE ON FILE ${h(u.service_date)}</div>
    </div>

    <div class="field" style="top: 300px; left: 400px;">
      <div class="field-label">13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE</div>
      <div>SIGNATURE ON FILE</div>
    </div>

    <div class="field" style="top: 380px; left: 50px;">
      <div class="field-label">21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY</div>
      <div>
        A. ${e[0]?.icd10_code||""}<br>
        B. ${e[1]?.icd10_code||""}<br>
        C. ${e[2]?.icd10_code||""}<br>
        D. ${e[3]?.icd10_code||""}
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
        ${d.map(i=>`
          <tr>
            <td>${h(i.service_date)}</td>
            <td>${i.origin_code}</td>
            <td>${i.procedure_code} ${i.modifier_1||""} ${i.modifier_2||""}</td>
            <td>${i.diagnosis_pointers.join(",")}</td>
            <td>$${i.total_charge.toFixed(2)}</td>
            <td>${i.units}</td>
          </tr>
        `).join("")}
      </table>
    </div>

    <div class="field" style="top: 680px; left: 50px;">
      <div class="field-label">28. TOTAL CHARGE</div>
      <div>$${u.total_charge.toFixed(2)}</div>
    </div>

    <div class="field" style="top: 720px; left: 50px;">
      <div class="field-label">33. BILLING PROVIDER INFO & PH #</div>
      <div>
        ${t.name}<br>
        ${t.address_line1}<br>
        ${t.city}, ${t.state} ${t.zip}<br>
        ${t.phone}<br>
        NPI: ${t.npi}
      </div>
    </div>
  </div>
</body>
</html>
    `},_=async u=>{try{const{supabase:o}=E(),{logAccess:l}=k(),{data:d}=await o.from("claims").select(`
          *,
          patients (*),
          incidents (*),
          payers (*),
          claim_lines (*),
          claim_diagnoses (*),
          organization:organizations (*)
        `).eq("id",u).single();if(!d)throw new Error("Claim not found");const e=m(d),t=await $fetch("/api/lob/send-claim",{method:"POST",body:{claimId:u,htmlContent:e,to:{name:d.payers.name,address_line1:d.payers.address_line1,city:d.payers.city,state:d.payers.state,zip:d.payers.zip},from:{name:d.organization.name,address_line1:d.organization.address_line1,city:d.organization.city,state:d.organization.state,zip:d.organization.zip}}});return await o.from("claim_submissions").insert([{claim_id:u,submission_method:"lob_paper",lob_letter_id:t.id,lob_tracking_number:t.tracking_number,lob_expected_delivery_date:t.expected_delivery_date,lob_status:"processed",submitted_at:new Date().toISOString()}]),await o.from("claims").update({status:"submitted",submission_method:"lob_paper",updated_at:new Date().toISOString()}).eq("id",u),await l("submit","claim",u,{method:"lob_paper",claim_number:d.claim_number,lob_letter_id:t.id}),{success:!0,response:t}}catch(o){return console.error("Error sending paper claim via Lob:",o),{success:!1,error:o}}},b=async u=>{try{return{success:!0,data:await $fetch(`/api/lob/track/${u}`)}}catch(o){return console.error("Error tracking Lob letter:",o),{success:!1,error:o}}},h=u=>{const o=new Date(u),l=String(o.getMonth()+1).padStart(2,"0"),d=String(o.getDate()).padStart(2,"0"),e=o.getFullYear();return`${l}/${d}/${e}`};return{generateCMS1500HTML:m,sendPaperClaim:_,trackLobLetter:b}},j={class:"min-h-screen bg-gray-50 py-8"},V={class:"max-w-7xl mx-auto px-4"},X={class:"flex justify-between items-center mb-6"},Z={class:"flex gap-3"},Q={key:0,class:"bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"},K={class:"grid grid-cols-4 gap-4"},W={class:"grid grid-cols-4 gap-6 mb-6"},J={class:"bg-white rounded-lg shadow-sm border border-gray-200 p-6"},ee={class:"flex items-center justify-between"},te={class:"text-2xl font-bold text-gray-900 mt-1"},se={class:"bg-white rounded-lg shadow-sm border border-gray-200 p-6"},ie={class:"flex items-center justify-between"},ae={class:"text-2xl font-bold text-gray-900 mt-1"},re={class:"bg-white rounded-lg shadow-sm border border-gray-200 p-6"},oe={class:"flex items-center justify-between"},ne={class:"text-2xl font-bold text-green-600 mt-1"},de={class:"bg-white rounded-lg shadow-sm border border-gray-200 p-6"},le={class:"flex items-center justify-between"},ce={class:"text-2xl font-bold text-orange-600 mt-1"},ue={class:"bg-white rounded-lg shadow-sm border border-gray-200"},pe={key:0,class:"p-12 text-center text-gray-500"},me={key:1,class:"p-12 text-center text-gray-500"},ge={key:2,class:"overflow-x-auto"},_e={class:"w-full"},ye={class:"bg-white divide-y divide-gray-200"},fe={class:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"},be={class:"px-6 py-4 whitespace-nowrap text-sm text-gray-900"},he={class:"px-6 py-4 whitespace-nowrap text-sm text-gray-600"},ve={class:"px-6 py-4 whitespace-nowrap text-sm text-gray-600"},xe={class:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"},we={class:"px-6 py-4 whitespace-nowrap"},Se={class:"px-6 py-4 whitespace-nowrap text-sm"},Ee=["onClick"],$e=["onClick"],De={__name:"index",setup(m){const{getClaims:_}=H(),{submitClaim837P:b}=q(),{sendPaperClaim:h}=Y(),u=L([]),o=L(!0),l=L(!1),d=P({status:"",payerType:"",submissionMethod:""}),e=P({totalClaims:0,totalBilled:0,totalPaid:0,outstanding:0}),t=async()=>{o.value=!0;const g=await _("demo-org-id",d);g.success&&(u.value=g.data,i(g.data)),o.value=!1},i=g=>{e.totalClaims=g.length,e.totalBilled=g.reduce((r,c)=>r+c.total_charge,0),e.totalPaid=g.reduce((r,c)=>r+c.total_paid,0),e.outstanding=e.totalBilled-e.totalPaid},p=()=>{t()},a=async g=>{if(confirm("Submit this claim electronically via Office Ally or print via Lob?"))if((confirm("Click OK for Electronic (837P), Cancel for Paper (Lob)")?"electronic":"paper")==="electronic"){const c=await b(g);c.success?(alert("Claim submitted successfully via Office Ally!"),t()):alert("Error submitting claim: "+c.error)}else{const c=await h(g);c.success?(alert("Paper claim sent via Lob!"),t()):alert("Error sending paper claim: "+c.error)}},n=g=>{U(`/billing/${g}`)},y=g=>new Date(g).toLocaleDateString(),$=g=>({draft:"bg-gray-100 text-gray-800",ready:"bg-blue-100 text-blue-800",submitted:"bg-yellow-100 text-yellow-800",accepted:"bg-green-100 text-green-800",paid:"bg-green-100 text-green-800",denied:"bg-red-100 text-red-800"})[g]||"bg-gray-100 text-gray-800";return z(()=>{t()}),(g,r)=>(x(),v("div",j,[s("div",V,[s("div",X,[r[4]||(r[4]=s("div",null,[s("h1",{class:"text-3xl font-bold text-gray-900"},"Billing & Claims"),s("p",{class:"text-gray-600 mt-1"},"CMS-compliant ambulance billing management")],-1)),s("div",Z,[s("button",{onClick:r[0]||(r[0]=c=>l.value=!l.value),class:"px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"}," Filters ")])]),l.value?(x(),v("div",Q,[s("div",K,[s("div",null,[r[6]||(r[6]=s("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"Status",-1)),A(s("select",{"onUpdate:modelValue":r[1]||(r[1]=c=>d.status=c),class:"w-full px-3 py-2 border border-gray-300 rounded-md"},[...r[5]||(r[5]=[M('<option value="">All Statuses</option><option value="draft">Draft</option><option value="ready">Ready</option><option value="submitted">Submitted</option><option value="accepted">Accepted</option><option value="paid">Paid</option><option value="denied">Denied</option>',7)])],512),[[C,d.status]])]),s("div",null,[r[8]||(r[8]=s("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"Payer Type",-1)),A(s("select",{"onUpdate:modelValue":r[2]||(r[2]=c=>d.payerType=c),class:"w-full px-3 py-2 border border-gray-300 rounded-md"},[...r[7]||(r[7]=[M('<option value="">All Payers</option><option value="medicare">Medicare</option><option value="medicaid">Medicaid</option><option value="commercial">Commercial</option><option value="workers_comp">Workers Comp</option><option value="self_pay">Self Pay</option>',6)])],512),[[C,d.payerType]])]),s("div",null,[r[10]||(r[10]=s("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"Submission Method",-1)),A(s("select",{"onUpdate:modelValue":r[3]||(r[3]=c=>d.submissionMethod=c),class:"w-full px-3 py-2 border border-gray-300 rounded-md"},[...r[9]||(r[9]=[s("option",{value:""},"All Methods",-1),s("option",{value:"office_ally_837p"},"Electronic (837P)",-1),s("option",{value:"lob_paper"},"Paper (Lob)",-1)])],512),[[C,d.submissionMethod]])]),s("div",{class:"flex items-end"},[s("button",{onClick:p,class:"w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"}," Apply Filters ")])])])):I("",!0),s("div",W,[s("div",J,[s("div",ee,[s("div",null,[r[11]||(r[11]=s("p",{class:"text-sm text-gray-600"},"Total Claims",-1)),s("p",te,f(e.totalClaims),1)]),r[12]||(r[12]=s("div",{class:"w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"},[s("span",{class:"text-2xl"},"📄")],-1))])]),s("div",se,[s("div",ie,[s("div",null,[r[13]||(r[13]=s("p",{class:"text-sm text-gray-600"},"Total Billed",-1)),s("p",ae,"$"+f(e.totalBilled.toLocaleString()),1)]),r[14]||(r[14]=s("div",{class:"w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"},[s("span",{class:"text-2xl"},"💰")],-1))])]),s("div",re,[s("div",oe,[s("div",null,[r[15]||(r[15]=s("p",{class:"text-sm text-gray-600"},"Total Paid",-1)),s("p",ne,"$"+f(e.totalPaid.toLocaleString()),1)]),r[16]||(r[16]=s("div",{class:"w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"},[s("span",{class:"text-2xl"},"✅")],-1))])]),s("div",de,[s("div",le,[s("div",null,[r[17]||(r[17]=s("p",{class:"text-sm text-gray-600"},"Outstanding",-1)),s("p",ce,"$"+f(e.outstanding.toLocaleString()),1)]),r[18]||(r[18]=s("div",{class:"w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"},[s("span",{class:"text-2xl"},"⏳")],-1))])])]),s("div",ue,[r[20]||(r[20]=s("div",{class:"p-6 border-b border-gray-200"},[s("h2",{class:"text-lg font-semibold text-gray-900"},"Claims List")],-1)),o.value?(x(),v("div",pe," Loading claims... ")):u.value.length===0?(x(),v("div",me," No claims found ")):(x(),v("div",ge,[s("table",_e,[r[19]||(r[19]=s("thead",{class:"bg-gray-50 border-b border-gray-200"},[s("tr",null,[s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Claim # "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Patient "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Service Date "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Payer "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Amount "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Status "),s("th",{class:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"}," Actions ")])],-1)),s("tbody",ye,[(x(!0),v(B,null,F(u.value,c=>(x(),v("tr",{key:c.id,class:"hover:bg-gray-50"},[s("td",fe,f(c.claim_number),1),s("td",be,f(c.patients.last_name)+", "+f(c.patients.first_name),1),s("td",he,f(y(c.service_date)),1),s("td",ve,f(c.payers?.name||"N/A"),1),s("td",xe," $"+f(c.total_charge.toFixed(2)),1),s("td",we,[s("span",{class:G(["px-2 py-1 text-xs font-semibold rounded-full",$(c.status)])},f(c.status),3)]),s("td",Se,[c.status==="ready"||c.status==="draft"?(x(),v("button",{key:0,onClick:S=>a(c.id),class:"text-blue-600 hover:text-blue-900 font-medium mr-3"}," Submit ",8,Ee)):I("",!0),s("button",{onClick:S=>n(c.id),class:"text-gray-600 hover:text-gray-900 font-medium"}," View ",8,$e)])]))),128))])])]))])])]))}};export{De as default};
