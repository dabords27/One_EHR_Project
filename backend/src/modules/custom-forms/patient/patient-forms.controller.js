const sql = require("mssql");

exports.saveDraft = async (req, res) => {

  const pool = req.app.locals.pool;

  const {
    patient_id,
    template_id,
    department_id,
    template_snapshot,
    filled_data
  } = req.body;

const user_id = req.user.id;

  try {

    await pool.request()
      .input("patient_id", sql.Int, patient_id)
      .input("template_id", sql.Int, template_id)
      .input("department_id", sql.Int, department_id)
      .input("template_snapshot", sql.NVarChar(sql.MAX), JSON.stringify(template_snapshot))
      .input("filled_data", sql.NVarChar(sql.MAX), JSON.stringify(filled_data))
      .input("created_by", sql.Int, user_id)
      .query(`
        INSERT INTO dbo.PatientCustomForms
        (
          patient_id,
          template_id,
          department_id,
          template_snapshot,
          filled_data,
          created_by,
          date_created,
          status
        )
        VALUES
        (
          @patient_id,
          @template_id,
          @department_id,
          @template_snapshot,
          @filled_data,
          @created_by,
          GETDATE(),
          'DRAFT'
        )
      `);

    res.json({ success: true });

  } catch (err) {

    console.error("SAVE DRAFT ERROR:", err);
    res.status(500).json({ message: "Save draft failed" });

  }

};

exports.finalizeForm = async (req, res) => {

  const pool = req.app.locals.pool;

  const {
    patient_form_id,
    filled_data
  } = req.body;

  const user_id = req.user.user_id;

  try {

    await pool.request()
      .input("patient_form_id", sql.Int, patient_form_id)
      .input("filled_data", sql.NVarChar(sql.MAX), JSON.stringify(filled_data))
      .input("user_id", sql.Int, user_id)
      .query(`
        UPDATE dbo.PatientCustomForms
        SET
          filled_data = @filled_data,
          status = 'FINALIZED',
          signed_by = @user_id,
          date_signed = GETDATE(),
          locked_by = @user_id,
          date_locked = GETDATE()
        WHERE patient_form_id = @patient_form_id
      `);

    res.json({ success: true });

  } catch (err) {

    console.error("FINALIZE ERROR:", err);
    res.status(500).json({ message: "Finalize failed" });

  }

};

exports.getPatientForms = async (req, res) => {

  const pool = req.app.locals.pool;
  const { patientId } = req.params;

  try {

    const result = await pool.request()
      .input("patientId", sql.Int, patientId)
      .query(`
        SELECT
          patient_form_id,
          template_id,
          status,
          date_created
        FROM dbo.PatientCustomForms
        WHERE patient_id = @patientId
        ORDER BY date_created DESC
      `);

    res.json(result.recordset);

  } catch (err) {

    console.error("LOAD FORMS ERROR:", err);
    res.status(500).json({ message: "Failed to load forms" });

  }

};

exports.getFormById = async (req, res) => {

  const pool = req.app.locals.pool;
  const { formId } = req.params;

  try {

    const result = await pool.request()
      .input("formId", sql.Int, formId)
      .query(`
        SELECT *
        FROM dbo.PatientCustomForms
        WHERE patient_form_id = @formId
      `);

    res.json(result.recordset[0]);

  } catch (err) {

    console.error("LOAD FORM ERROR:", err);
    res.status(500).json({ message: "Failed to load form" });

  }

};