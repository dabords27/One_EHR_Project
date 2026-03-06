const sql = require("mssql");


/* =========================
   REPOSITORY RECORDS
========================= */

exports.getRepositoryRecords = async () => {

  const result = await sql.query(`

SELECT
  pf.patient_form_id,
  pf.status,
  pf.date_created AS created_at,

  t.template_name,

  p.MRN AS mrn,
  p.Lastname AS last_name,
  p.Firstname AS first_name,
  p.Middlename AS middle_name,

  p.PatientType AS patient_type,

  CASE
      WHEN p.DischargeDateTime IS NULL THEN 'Active'
      ELSE 'Discharge'
  END AS patient_status,

  p.AdmissionDateTime AS date_admitted,
pf.created_by,

  ISNULL(u.usr_custom_name, 'System') AS author_name

FROM dbo.PatientCustomForms pf

JOIN dbo.PatientRegistry_Local p
  ON pf.patient_id = p.RegistryTrackingNo

JOIN dbo.CustomFormTemplates t
  ON pf.template_id = t.template_id

LEFT JOIN dbo.users u
  ON pf.created_by = u.auto_id

ORDER BY pf.date_created DESC

  `);

  return result.recordset;

};


/* =========================
   LOAD SINGLE PATIENT FORM
========================= */

exports.getPatientFormById = async (patientFormId) => {

  const result = await sql.query`

SELECT
  pf.patient_form_id,
  pf.template_id,
  pf.template_snapshot,
  pf.filled_data,

  /* PATIENT */
  p.RegistryTrackingNo AS registry_tracking_no,
  p.MRN AS mrn,
  p.Firstname AS first_name,
  p.Middlename AS middle_name,
  p.Lastname AS last_name,
  p.Extension AS extension,
  p.Birthdate AS birthdate,
  p.Gender AS gender,
  p.CivilStatus AS civil_status,
  p.Religion AS religion,
  p.Nationality AS nationality,

  /* ADDRESS */
  p.FullAddress AS full_address,
  p.Barangay AS barangay,
  p.TownCity AS town_city,
  p.Province AS province,
  p.Region AS region,

/* VISIT */
p.CaseNo AS case_id,
p.PatientType AS patient_type,
p.ServiceType AS service_type,
p.TransactionType AS transaction_type,
p.RoomBedNo AS room_no,

/* AGE */
p.Age AS Age,
p.Age2 AS Age2,

  /* DOCTORS */
  p.AttendingPhysician AS attending_physician,
  p.AdmittingDoctor AS admitting_doctor,

  /* DIAGNOSIS */
  p.InitialDiagnosis AS initial_diagnosis,
  p.ICD10Code AS icd10_code,
  p.ICD10Description AS icd10_description,
  p.SecondaryDischargeDiagnosis AS secondary_discharge_diagnosis,

  /* ADMISSION */
  p.AdmissionDateTime AS date_admitted,
  p.ArrivalDateTime AS arrival_datetime,
  p.DischargeDateTime AS discharge_datetime,
  p.Disposition AS disposition

FROM dbo.PatientCustomForms pf
JOIN dbo.PatientRegistry_Local p
  ON pf.patient_id = p.RegistryTrackingNo
WHERE pf.patient_form_id = ${patientFormId}

  `;

  return result.recordset[0];

};