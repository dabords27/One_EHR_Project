const sql = require("mssql");

/* ================= GET ADMISSIONS LIST ================= */

const getAdmissions = async (pool, filters) => {
  const { status, type, search, dateFrom, dateTo } = filters;

  const request = pool.request();

  request.input("status", sql.VarChar, status || null);
  request.input("type", sql.VarChar, type || null);
  request.input("search", sql.VarChar, search || null);
  request.input("dateFrom", sql.DateTime, dateFrom || null);
  request.input("dateTo", sql.DateTime, dateTo || null);

  const result = await request.query(`
    SELECT 
        RegistryTrackingNo AS RegistryNo,
        MRN,
        Lastname,
        Firstname,
        Middlename,

        Lastname + ', ' + Firstname + ' ' + ISNULL(Middlename,'') AS PatientName,

        Birthdate,
        Gender AS Sex,
        PatientType,

        Age,
        Extension,
        Age2,

        ISNULL(RoomBedNo,'') AS RoomBedNo,

        AdmissionDateTime,
        DischargeDateTime,

        CASE
            WHEN DischargeDateTime IS NULL THEN 'Active'
            ELSE 'Discharge'
        END AS Status

    FROM PatientRegistry_Local

    WHERE
        -- remove cancelled registry records
        (Status IS NULL OR Status <> 'X')

        -- status filter
        AND (
            @status IS NULL
            OR (@status = 'Active' AND DischargeDateTime IS NULL)
            OR (@status = 'Discharge' AND DischargeDateTime IS NOT NULL)
        )

        -- patient type filter
        AND (@type IS NULL OR PatientType = @type)

        -- search filter
        AND (
            @search IS NULL
            OR MRN LIKE '%' + @search + '%'
            OR Lastname LIKE '%' + @search + '%'
            OR Firstname LIKE '%' + @search + '%'
        )

        -- optional date filters
        AND (@dateFrom IS NULL OR AdmissionDateTime >= @dateFrom)
        AND (@dateTo IS NULL OR AdmissionDateTime < DATEADD(DAY,1,@dateTo))

    ORDER BY AdmissionDateTime DESC
  `);

  return result.recordset;
};

/* ================= ACTIVE ADMISSIONS COUNT ================= */

const getActiveInpatientCount = async (pool) => {

  const result = await pool.request().query(`
    SELECT COUNT(1) AS ActiveCount
    FROM PatientRegistry_Local
    WHERE
        PatientType = 'Inpatient'
        AND DischargeDateTime IS NULL
        AND (Status IS NULL OR Status <> 'X')
  `);

  return result.recordset[0].ActiveCount;
};


/* ================= DISCHARGES TODAY COUNT ================= */

const getDischargesToday = async (pool) => {

  const result = await pool.request().query(`
    SELECT COUNT(1) AS DischargesToday
    FROM PatientRegistry_Local
    WHERE
        DischargeDateTime IS NOT NULL
        AND CAST(DischargeDateTime AS DATE) = CAST(GETDATE() AS DATE)
        AND (Status IS NULL OR Status <> 'X')
  `);

  return result.recordset[0].DischargesToday;
};

module.exports = {
  getAdmissions,
  getActiveInpatientCount,
  getDischargesToday
};