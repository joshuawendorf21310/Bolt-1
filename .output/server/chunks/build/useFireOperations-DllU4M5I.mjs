import { ref, computed } from 'vue';
import { a as useNuxtApp } from './server.mjs';

const useFireOperations = () => {
  const { $supabase } = useNuxtApp();
  const supabase = $supabase;
  const incidents = ref([]);
  const apparatus = ref([]);
  const personnel = ref([]);
  const stations = ref([]);
  ref("");
  const loading = ref(false);
  const error = ref(null);
  const loadIncidents = async () => {
    try {
      loading.value = true;
      const { data, error: err } = await supabase.from("fire_incidents").select(`
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
        `).order("dispatch_time", { ascending: false }).limit(50);
      if (err) throw err;
      incidents.value = data || [];
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };
  const loadApparatus = async () => {
    try {
      const { data, error: err } = await supabase.from("fire_apparatus").select(`
          *,
          station_id (
            id,
            name,
            call_sign
          )
        `).order("unit_number");
      if (err) throw err;
      apparatus.value = data || [];
    } catch (e) {
      error.value = e.message;
    }
  };
  const loadPersonnel = async () => {
    try {
      const { data, error: err } = await supabase.from("fire_personnel").select(`
          *,
          fire_certifications (
            id,
            certification_name,
            expiration_date,
            is_current
          )
        `).eq("is_active", true).order("last_name");
      if (err) throw err;
      personnel.value = data || [];
    } catch (e) {
      error.value = e.message;
    }
  };
  const loadStations = async () => {
    try {
      const { data, error: err } = await supabase.from("fire_stations").select("*").eq("is_active", true).order("name");
      if (err) throw err;
      stations.value = data || [];
    } catch (e) {
      error.value = e.message;
    }
  };
  const createIncident = async (incidentData) => {
    try {
      loading.value = true;
      const { data, error: err } = await supabase.from("fire_incidents").insert([incidentData]).select().single();
      if (err) throw err;
      incidents.value.unshift(data);
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  };
  const updateIncidentStatus = async (incidentId, status) => {
    try {
      const { data, error: err } = await supabase.from("fire_incidents").update({
        status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", incidentId).select().single();
      if (err) throw err;
      const idx = incidents.value.findIndex((i) => i.id === incidentId);
      if (idx >= 0) {
        incidents.value[idx] = data;
      }
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const assignUnitToIncident = async (incidentId, apparatusId, crewLead) => {
    try {
      const { data, error: err } = await supabase.from("incident_units").insert([{
        incident_id: incidentId,
        apparatus_id: apparatusId,
        crew_lead: crewLead,
        dispatch_time: (/* @__PURE__ */ new Date()).toISOString(),
        status: "dispatched"
      }]).select().single();
      if (err) throw err;
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const assignPersonnelToIncident = async (incidentId, personnelId, role, unitId) => {
    try {
      const { data, error: err } = await supabase.from("incident_personnel").insert([{
        incident_id: incidentId,
        personnel_id: personnelId,
        role,
        unit_id: unitId,
        dispatch_time: (/* @__PURE__ */ new Date()).toISOString(),
        status: "assigned"
      }]).select().single();
      if (err) throw err;
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const updatePersonnelStatus = async (incidentPersonnelId, status, timestamp = "dispatch_time") => {
    try {
      const update = { status };
      if (timestamp === "arrival") update.arrival_time = (/* @__PURE__ */ new Date()).toISOString();
      if (timestamp === "departure") update.departure_time = (/* @__PURE__ */ new Date()).toISOString();
      if (timestamp === "check_in") update.accountability_check_in = (/* @__PURE__ */ new Date()).toISOString();
      if (timestamp === "check_out") update.accountability_check_out = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error: err } = await supabase.from("incident_personnel").update(update).eq("id", incidentPersonnelId).select().single();
      if (err) throw err;
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const updateApparatusStatus = async (apparatusId, status) => {
    try {
      const { data, error: err } = await supabase.from("fire_apparatus").update({
        current_status: status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", apparatusId).select().single();
      if (err) throw err;
      const idx = apparatus.value.findIndex((a) => a.id === apparatusId);
      if (idx >= 0) {
        apparatus.value[idx] = data;
      }
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const recordTraining = async (personnelId, trainingData) => {
    try {
      const { data, error: err } = await supabase.from("fire_training_records").insert([{
        personnel_id: personnelId,
        ...trainingData
      }]).select().single();
      if (err) throw err;
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const recordCertification = async (personnelId, certData) => {
    try {
      const { data, error: err } = await supabase.from("fire_certifications").insert([{
        personnel_id: personnelId,
        ...certData
      }]).select().single();
      if (err) throw err;
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    }
  };
  const getIncidentById = (id) => {
    return incidents.value.find((i) => i.id === id);
  };
  const getPersonnelById = (id) => {
    return personnel.value.find((p) => p.id === id);
  };
  const getApparatusById = (id) => {
    return apparatus.value.find((a) => a.id === id);
  };
  const activeIncidents = computed(() => {
    return incidents.value.filter((i) => i.status !== "cleared");
  });
  const respondingUnits = computed(() => {
    return apparatus.value.filter((a) => a.current_status === "in_service");
  });
  const availableUnits = computed(() => {
    return apparatus.value.filter((a) => a.current_status === "available");
  });
  const certificationExpiringPersonnel = computed(() => {
    const thirtyDaysFromNow = /* @__PURE__ */ new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return personnel.value.filter((p) => {
      var _a;
      return (_a = p.fire_certifications) == null ? void 0 : _a.some((cert) => {
        if (!cert.is_current) return false;
        const expDate = new Date(cert.expiration_date);
        return expDate <= thirtyDaysFromNow;
      });
    });
  });
  return {
    // State
    incidents,
    apparatus,
    personnel,
    stations,
    loading,
    error,
    // Loaders
    loadIncidents,
    loadApparatus,
    loadPersonnel,
    loadStations,
    // Incident operations
    createIncident,
    updateIncidentStatus,
    getIncidentById,
    // Unit operations
    assignUnitToIncident,
    updateApparatusStatus,
    getApparatusById,
    // Personnel operations
    assignPersonnelToIncident,
    updatePersonnelStatus,
    recordTraining,
    recordCertification,
    getPersonnelById,
    // Computed
    activeIncidents,
    respondingUnits,
    availableUnits,
    certificationExpiringPersonnel
  };
};

export { useFireOperations as u };
//# sourceMappingURL=useFireOperations-DllU4M5I.mjs.map
