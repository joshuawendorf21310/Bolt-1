import{D as N,J as _,r as l}from"./Ys5eufZ_.js";const E=()=>{const{$supabase:g}=N(),s=g,o=l([]),u=l([]),f=l([]),p=l([]),d=l(!1),i=l(null),v=async()=>{try{d.value=!0;const{data:e,error:t}=await s.from("fire_incidents").select(`
          *,
          incident_units (
            id,
            status,
            apparatus_id,
            crew_lead,
            personnel_count,
            dispatch_time,
            arrival_time
          ),
          incident_personnel (
            id,
            personnel_id,
            role,
            status
          )
        `).order("dispatch_time",{ascending:!1}).limit(50);if(t)throw t;o.value=e||[]}catch(e){i.value=e.message}finally{d.value=!1}},m=async()=>{try{const{data:e,error:t}=await s.from("fire_apparatus").select(`
          *,
          station_id (
            id,
            name,
            call_sign
          )
        `).order("unit_number");if(t)throw t;u.value=e||[]}catch(e){i.value=e.message}},w=async()=>{try{const{data:e,error:t}=await s.from("fire_personnel").select(`
          *,
          fire_certifications (
            id,
            certification_name,
            expiration_date,
            is_current
          )
        `).eq("is_active",!0).order("last_name");if(t)throw t;f.value=e||[]}catch(e){i.value=e.message}},h=async()=>{try{const{data:e,error:t}=await s.from("fire_stations").select("*").eq("is_active",!0).order("name");if(t)throw t;p.value=e||[]}catch(e){i.value=e.message}},y=async e=>{try{d.value=!0;const{data:t,error:r}=await s.from("fire_incidents").insert([e]).select().single();if(r)throw r;return o.value.unshift(t),t}catch(t){return i.value=t.message,null}finally{d.value=!1}},S=async(e,t)=>{try{const{data:r,error:n}=await s.from("fire_incidents").update({status:t,updated_at:new Date().toISOString()}).eq("id",e).select().single();if(n)throw n;const a=o.value.findIndex(c=>c.id===e);return a>=0&&(o.value[a]=r),r}catch(r){return i.value=r.message,null}},I=async(e,t,r)=>{try{const{data:n,error:a}=await s.from("incident_units").insert([{incident_id:e,apparatus_id:t,crew_lead:r,dispatch_time:new Date().toISOString(),status:"dispatched"}]).select().single();if(a)throw a;return n}catch(n){return i.value=n.message,null}},D=async(e,t,r,n)=>{try{const{data:a,error:c}=await s.from("incident_personnel").insert([{incident_id:e,personnel_id:t,role:r,unit_id:n,dispatch_time:new Date().toISOString(),status:"assigned"}]).select().single();if(c)throw c;return a}catch(a){return i.value=a.message,null}},x=async(e,t,r="dispatch_time")=>{try{const n={status:t};r==="arrival"&&(n.arrival_time=new Date().toISOString()),r==="departure"&&(n.departure_time=new Date().toISOString()),r==="check_in"&&(n.accountability_check_in=new Date().toISOString()),r==="check_out"&&(n.accountability_check_out=new Date().toISOString());const{data:a,error:c}=await s.from("incident_personnel").update(n).eq("id",e).select().single();if(c)throw c;return a}catch(n){return i.value=n.message,null}},O=async(e,t)=>{try{const{data:r,error:n}=await s.from("fire_apparatus").update({current_status:t,updated_at:new Date().toISOString()}).eq("id",e).select().single();if(n)throw n;const a=u.value.findIndex(c=>c.id===e);return a>=0&&(u.value[a]=r),r}catch(r){return i.value=r.message,null}},b=async(e,t)=>{try{const{data:r,error:n}=await s.from("fire_training_records").insert([{personnel_id:e,...t}]).select().single();if(n)throw n;return r}catch(r){return i.value=r.message,null}},q=async(e,t)=>{try{const{data:r,error:n}=await s.from("fire_certifications").insert([{personnel_id:e,...t}]).select().single();if(n)throw n;return r}catch(r){return i.value=r.message,null}},P=e=>o.value.find(t=>t.id===e),k=e=>f.value.find(t=>t.id===e),A=e=>u.value.find(t=>t.id===e),B=_(()=>o.value.filter(e=>e.status!=="cleared")),T=_(()=>u.value.filter(e=>e.current_status==="in_service")),U=_(()=>u.value.filter(e=>e.current_status==="available")),F=_(()=>{const e=new Date;return e.setDate(e.getDate()+30),f.value.filter(t=>t.fire_certifications?.some(r=>r.is_current?new Date(r.expiration_date)<=e:!1))});return{incidents:o,apparatus:u,personnel:f,stations:p,loading:d,error:i,loadIncidents:v,loadApparatus:m,loadPersonnel:w,loadStations:h,createIncident:y,updateIncidentStatus:S,getIncidentById:P,assignUnitToIncident:I,updateApparatusStatus:O,getApparatusById:A,assignPersonnelToIncident:D,updatePersonnelStatus:x,recordTraining:b,recordCertification:q,getPersonnelById:k,activeIncidents:B,respondingUnits:T,availableUnits:U,certificationExpiringPersonnel:F}};export{E as u};
