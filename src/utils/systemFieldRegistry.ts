export interface SystemField {
  key: string;
  label: string;
  column?: string;
  columns?: string[];
  format?: "date" | "datetime" | "time" | "number";
}

export interface SystemFieldGroup {
  group: string;
  fields: SystemField[];
}

export const SYSTEM_FIELD_REGISTRY: SystemFieldGroup[] = [

  /* =========================
     PATIENT DEMOGRAPHICS
  ========================= */
  {
    group: "Patient Demographics",
    fields: [
      { key: "patient.mrn", label: "MRN", column: "mrn" },
      { key: "patient.lastname", label: "Last Name", column: "last_name" },
      { key: "patient.firstname", label: "First Name", column: "first_name" },
      { key: "patient.middlename", label: "Middle Name", column: "middle_name" },
	  {

  key: "Age",
  label: "Age (Full)",
  column: "Age"
},
{
  key: "Age2",
  label: "Age (Years Only)",
  column: "Age2"
},
{
  key: "Extension",
  label: "Name Extension",
  column: "extension"
},

      {
        key: "patient.full_name",
        label: "Full Name",
        columns: ["last_name", "first_name", "middle_name"]
      },

      { key: "patient.birthdate", label: "Birthdate", column: "birthdate", format: "date" },
      { key: "patient.gender", label: "Gender", column: "gender" },
      { key: "patient.civil_status", label: "Civil Status", column: "civil_status" },
      { key: "patient.religion", label: "Religion", column: "religion" },
      { key: "patient.nationality", label: "Nationality", column: "nationality" }
    ]
  },

  /* =========================
     ADDRESS INFORMATION
  ========================= */
  {
    group: "Address Information",
    fields: [
      { key: "patient.full_address", label: "Full Address", column: "full_address" },
      { key: "patient.barangay", label: "Barangay", column: "barangay" },
      { key: "patient.town_city", label: "Town / City", column: "town_city" },
      { key: "patient.province", label: "Province", column: "province" },
      { key: "patient.region", label: "Region", column: "region" }
    ]
  },

  /* =========================
     VISIT INFORMATION
  ========================= */
  {
    group: "Visit Information",
    fields: [
      { key: "visit.case_no", label: "Case Number", column: "case_id" },
      { key: "visit.registry_tracking_no", label: "Registry Tracking No", column: "registry_tracking_no" },
      { key: "visit.patient_type", label: "Patient Type", column: "patient_type" },
      { key: "visit.service_type", label: "Service Type", column: "service_type" },
      { key: "visit.transaction_type", label: "Transaction Type", column: "transaction_type" },
      { key: "visit.room_bed", label: "Room / Bed No", column: "room_no" }
    ]
  },

  /* =========================
     DOCTORS
  ========================= */
  {
    group: "Doctors",
    fields: [
      { key: "visit.attending_physician", label: "Attending Physician", column: "attending_physician" },
      { key: "visit.admitting_doctor", label: "Admitting Doctor", column: "admitting_doctor" }
    ]
  },

  /* =========================
     DIAGNOSIS
  ========================= */
  {
    group: "Diagnosis",
    fields: [
      { key: "diagnosis.initial", label: "Initial Diagnosis", column: "initial_diagnosis" },
      { key: "diagnosis.icd10_code", label: "ICD-10 Code", column: "icd10_code" },
      { key: "diagnosis.icd10_description", label: "ICD-10 Description", column: "icd10_description" },
      { key: "diagnosis.secondary", label: "Secondary Discharge Diagnosis", column: "secondary_discharge_diagnosis" }
    ]
  },

  /* =========================
     ADMISSION & DISCHARGE
  ========================= */
  {
    group: "Admission & Discharge",
    fields: [
      { key: "visit.admission_datetime", label: "Admission Date & Time", column: "date_admitted", format: "datetime" },
      { key: "visit.arrival_datetime", label: "Arrival Date & Time", column: "arrival_datetime", format: "datetime" },
      { key: "visit.discharge_datetime", label: "Discharge Date & Time", column: "discharge_datetime", format: "datetime" },
      { key: "visit.disposition", label: "Disposition", column: "disposition" }
    ]
  }

];