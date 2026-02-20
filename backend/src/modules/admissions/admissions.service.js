const sql = require('mssql');

const getAdmissions = async (pool, filters) => {
  const { status, type, search, dateFrom, dateTo } = filters;

  const request = pool.request();

  request.input('status', sql.VarChar, status || null);
  request.input('type', sql.VarChar, type || null);
  request.input('search', sql.VarChar, search || null);
  request.input('dateFrom', sql.DateTime, dateFrom || null);
  request.input('dateTo', sql.DateTime, dateTo || null);

const result = await request.query(`
    SELECT 
        RegistryTrackingNo AS RegistryNo,
        MRN,
        Lastname + ', ' + Firstname + ' ' + ISNULL(Middlename,'') AS PatientName,
        Birthdate,
        Gender AS Sex,
        PatientType,
        ISNULL(RoomBedNo, '') AS RoomBedNo,
        AdmissionDateTime,
        DischargeDateTime,

        CASE 
            WHEN DischargeDateTime IS NULL THEN 'Active'
            ELSE 'Discharge'
        END AS Status

    FROM PatientRegistry_Local
    WHERE  
        (
            @status IS NULL OR @status = 'X'
            OR (@status = 'Active' AND DischargeDateTime IS NULL)
            OR (@status = 'Discharge' AND DischargeDateTime IS NOT NULL)
        )
        AND (@type IS NULL OR PatientType = @type)
        AND (
            @search IS NULL 
            OR MRN LIKE '%' + @search + '%'
            OR Lastname LIKE '%' + @search + '%'
            OR Firstname LIKE '%' + @search + '%'
        )
        AND (@dateFrom IS NULL OR AdmissionDateTime >= @dateFrom)
        AND (@dateTo IS NULL OR AdmissionDateTime < DATEADD(DAY, 1, @dateTo))

    ORDER BY AdmissionDateTime DESC
`);

  return result.recordset;
};

const getActiveInpatientCount = async (pool) => {
  const result = await pool.request().query(`
    SELECT COUNT(1) AS ActiveCount
    FROM PatientRegistry_Local
    WHERE PatientType = 'Inpatient'  AND (Status IS NULL OR Status <> 'X')
      AND DischargeDateTime IS NULL
  `);

  return result.recordset[0].ActiveCount;
};

module.exports = {
  getAdmissions,
  getActiveInpatientCount
};