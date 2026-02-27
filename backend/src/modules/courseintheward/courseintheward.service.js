const { sql } = require('../../config/db');


// ================= GET COURSE =================
exports.getCourseByRegistry = async (pool, registryNo) => {

    /* =========================================
       1️⃣ GET ADMISSION DATE & TIME
       ========================================= */

    const admissionResult = await pool.request()
        .input('registryNo', sql.Int, registryNo)
        .query(`
            SELECT AdmissionDateTime
            FROM dbo.PatientRegistry_Local
            WHERE RegistryTrackingNo = @registryNo
        `);

    const admissionDateTime =
        admissionResult.recordset.length > 0
            ? admissionResult.recordset[0].AdmissionDateTime
            : null;


    /* =========================================
       2️⃣ GET COURSE IN THE WARD (PER VISIT)
       ========================================= */

    const courseResult = await pool.request()
        .input('registryNo', sql.Int, registryNo)
        .query(`
            SELECT 
                c.OrderDate,
                c.Remarks,
                ISNULL(d.fullname, 'Transcriptionist / HIS User') AS DoctorName
            FROM dbo.CourseInTheWard c
            LEFT JOIN dbo.Doctors_Local d
                ON c.FK_ASUReg = d.PK_emdDoctors
            WHERE 
                c.FK_psPatRegisters = @registryNo
                AND c.isHide = 0
                AND c.OrderDate IS NOT NULL
            ORDER BY c.OrderDate ASC
        `);

    return {
        admissionDateTime,
        courses: courseResult.recordset
    };
};