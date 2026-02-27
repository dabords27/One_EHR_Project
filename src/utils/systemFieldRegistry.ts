export interface SystemField {
  key: string;
  label: string;
  column?: string;
  columns?: string[];
format?: "date" | "datetime" | "time" | "number";  // ✅ ADD IT HERE
}

export interface SystemFieldGroup {
  group: string;
  fields: SystemField[];
}

export const SYSTEM_FIELD_REGISTRY = [
  {
    group: "Patient Demographics",
    fields: [
      { key: "patient.mrn", label: "MRN", column: "MRN" },
      { key: "patient.lastname", label: "Last Name", column: "Lastname" },
      { key: "patient.firstname", label: "First Name", column: "Firstname" },
      { key: "patient.middlename", label: "Middle Name", column: "Middlename" },
      {
        key: "patient.full_name",
        label: "Full Name",
        columns: ["Lastname", "Firstname", "Middlename"]
      },
      { key: "patient.birthdate", label: "Birthdate", column: "Birthdate" },
      { key: "patient.gender", label: "Gender", column: "Gender" },
      { key: "patient.civil_status", label: "Civil Status", column: "CivilStatus" },
      { key: "patient.religion", label: "Religion", column: "Religion" },
      { key: "patient.nationality", label: "Nationality", column: "Nationality" }
    ]
  },

  {
    group: "Address Information",
    fields: [
      { key: "patient.full_address", label: "Full Address", column: "FullAddress" },
      { key: "patient.barangay", label: "Barangay", column: "Barangay" },
      { key: "patient.town_city", label: "Town / City", column: "TownCity" },
      { key: "patient.province", label: "Province", column: "Province" },
      { key: "patient.region", label: "Region", column: "Region" }
    ]
  },

  {
    group: "Visit Information",
    fields: [
      { key: "visit.case_no", label: "Case Number", column: "CaseNo" },
      { key: "visit.registry_tracking_no", label: "Registry Tracking No", column: "RegistryTrackingNo" },
      { key: "visit.patient_type", label: "Patient Type", column: "PatientType" },
      { key: "visit.service_type", label: "Service Type", column: "ServiceType" },
      { key: "visit.transaction_type", label: "Transaction Type", column: "TransactionType" },
      { key: "visit.room_bed", label: "Room / Bed No", column: "RoomBedNo" }
    ]
  },

  {
    group: "Doctors",
    fields: [
      { key: "visit.attending_physician", label: "Attending Physician", column: "AttendingPhysician" },
      { key: "visit.admitting_doctor", label: "Admitting Doctor", column: "AdmittingDoctor" }
    ]
  },

  {
    group: "Diagnosis",
    fields: [
      { key: "diagnosis.initial", label: "Initial Diagnosis", column: "InitialDiagnosis" },
      { key: "diagnosis.icd10_code", label: "ICD-10 Code", column: "ICD10Code" },
      { key: "diagnosis.icd10_description", label: "ICD-10 Description", column: "ICD10Description" },
      { key: "diagnosis.secondary", label: "Secondary Discharge Diagnosis", column: "SecondaryDischargeDiagnosis" }
    ]
  },

  {
    group: "Admission & Discharge",
    fields: [
      { key: "visit.admission_datetime", label: "Admission Date & Time", column: "AdmissionDateTime" },
      { key: "visit.arrival_datetime", label: "Arrival Date & Time", column: "ArrivalDateTime" },
      { key: "visit.discharge_datetime", label: "Discharge Date & Time", column: "DischargeDateTime" },
      { key: "visit.disposition", label: "Disposition", column: "Disposition" }
    ]
  }
];