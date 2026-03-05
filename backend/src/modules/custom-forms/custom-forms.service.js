const sql = require("mssql");

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

exports.getPatientFormById = async (patientFormId) => {

  const result = await sql.query`

  SELECT
    pf.patient_form_id,
    pf.template_id,
    pf.template_snapshot,
    pf.filled_data,

    p.RegistryTrackingNo AS patient_id,
    p.MRN,
    p.Firstname,
    p.Middlename,
    p.Lastname,
    p.PatientType,
    p.AdmissionDateTime,
    p.DischargeDateTime

  FROM dbo.PatientCustomForms pf

  JOIN dbo.PatientRegistry_Local p
    ON pf.patient_id = p.RegistryTrackingNo

  WHERE pf.patient_form_id = ${patientFormId}

  `;

  return result.recordset[0];

};