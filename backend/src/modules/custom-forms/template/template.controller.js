const sql = require("mssql");
const templateService = require("./template.service");
const fieldService = require("./field.service");

/* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   AUDIT LOGGER
===================================================== */
const logAudit = async (request, data) => {

  await request
    .input("table_name", sql.VarChar(100), data.table)
    .input("record_id", sql.VarChar(100), data.recordId)
    .input("transaction", sql.VarChar(200), data.transaction)
    .input("transaction_type", sql.VarChar(20), data.type)
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "CUSTOM_FORM_TEMPLATE")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");

};

/* =====================================================
   CREATE TEMPLATE
===================================================== */
exports.createTemplate = async (req, res) => {
  try {

    const pool = req.app.locals.pool;

  const result = await templateService.createTemplate(
  pool,
{
  ...req.body,
  created_by: req.user?.id || 1,
 username: req.body.auth_username || req.user?.username || "SYSTEM"
}
);

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error creating template",
      error: err.message
    });

  }
};

/* =====================================================
   UPLOAD TEMPLATE PAGE
===================================================== */
exports.uploadTemplatePage = async (req, res) => {
  try {

    const pool = req.app.locals.pool;
    const templateId = req.params.id;
    const updatedBy = req.user.id;

    const filePath = `/uploads/custom-forms/${templateId}/template.pdf`;

    await pool.request()
      .input("template_id", sql.Int, templateId)
      .input("file_path", sql.NVarChar(500), filePath)
      .input("updated_by", sql.Int, updatedBy)
      .query(`
        UPDATE dbo.CustomFormTemplates
        SET file_path = @file_path,
            updated_by = @updated_by,
            date_updated = GETDATE()
        WHERE template_id = @template_id
      `);

    res.json({ message: "Template PDF uploaded successfully" });

  } catch (err) {

    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      message: "Error uploading PDF"
    });

  }
};


/* =====================================================
   GET TEMPLATES
===================================================== */
exports.getTemplates = async (req, res) => {
  try {

    const pool = req.app.locals.pool;
    const { dept_code} = req.query;

    const request = pool.request();

let query = `
  SELECT DISTINCT t.*
  FROM dbo.CustomFormTemplates t
  LEFT JOIN dbo.CustomFormTemplateDepartments td
    ON t.template_id = td.template_id
  LEFT JOIN dbo.departments d
    ON td.department_id = d.auto_id

`;

if (dept_code) {
  request.input("dept_code", sql.VarChar(50), dept_code);
  query += ` AND d.dept_code = @dept_code`;
}

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (err) {

    console.error("GET TEMPLATE ERROR:", err);

    res.status(500).json({
      error: "Failed to load templates"
    });

  }
};


/* =====================================================
   UPDATE TEMPLATE
===================================================== */
exports.updateTemplate = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      template_name,
      paper_size,
      orientation,
      total_pages,
      updated_by,
      department_ids
    } = req.body;

    const currentUser = req.user;
    const pool = req.app.locals.pool;

    let updatedBy = updated_by ? updated_by : currentUser.id;

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {

     const username = req.body.auth_username || req.user?.username || "SYSTEM";

      /* GET OLD VALUES */
      const oldTemplate = await new sql.Request(transaction)
        .input("id", sql.Int, id)
        .query(`
          SELECT template_name, paper_size, orientation, total_pages
          FROM dbo.CustomFormTemplates
          WHERE template_id = @id
        `);

      const oldData = oldTemplate.recordset[0];


      /* UPDATE TEMPLATE */
      await new sql.Request(transaction)
        .input("id", sql.Int, id)
        .input("template_name", sql.NVarChar, template_name)
        .input("paper_size", sql.NVarChar, paper_size)
        .input("orientation", sql.NVarChar, orientation)
        .input("total_pages", sql.Int, total_pages)
        .input("updated_by", sql.Int, updatedBy)
        .query(`
          UPDATE dbo.CustomFormTemplates
          SET template_name = @template_name,
              paper_size = @paper_size,
              orientation = @orientation,
              total_pages = @total_pages,
              updated_by = @updated_by,
              date_updated = GETDATE()
          WHERE template_id = @id
        `);


      /* DELETE OLD DEPARTMENTS */
      await new sql.Request(transaction)
        .input("template_id", sql.Int, id)
        .query(`
          DELETE FROM dbo.CustomFormTemplateDepartments
          WHERE template_id = @template_id
        `);


/* INSERT NEW DEPARTMENTS */
if (department_ids && department_ids.length > 0) {

  for (const deptId of department_ids) {

    await new sql.Request(transaction)
      .input("template_id", sql.Int, id)
      .input("department_id", sql.Int, deptId)
      .input("created_by", sql.Int, updatedBy)
      .query(`
        INSERT INTO dbo.CustomFormTemplateDepartments
        (template_id, department_id, created_by)
        VALUES
        (@template_id, @department_id, @created_by)
      `);

  }

  const request = new sql.Request(transaction);

  department_ids.forEach((deptId, index) => {
    request.input(`dept${index}`, sql.Int, deptId);
  });

  const inClause = department_ids.map((_, i) => `@dept${i}`).join(",");

  const deptNamesResult = await request.query(`
    SELECT dept_name
    FROM dbo.departments
    WHERE auto_id IN (${inClause})
  `);

  const deptNames = deptNamesResult.recordset
    .map(d => d.dept_name)
    .join(", ");

  await logAudit(
    new sql.Request(transaction),
    {
      table: "CustomFormTemplateDepartments",
      recordId: id,
      transaction: `Update Template Departments - ${template_name}`,
      type: "UPDATE",
      newValue: deptNames,
      username
    }
  );

}

      /* FIELD AUDITS */

      if (oldData.template_name !== template_name) {

        await logAudit(new sql.Request(transaction), {
          table: "CustomFormTemplates",
          recordId: id,
         transaction: `Update Template Name - ${template_name}`,
          type: "UPDATE",
          oldValue: oldData.template_name,
          newValue: template_name,
          username
        });

      }

      if (oldData.paper_size !== paper_size) {

        await logAudit(new sql.Request(transaction), {
          table: "CustomFormTemplates",
          recordId: id,
          transaction: `Update Paper Size - ${template_name}`,
          type: "UPDATE",
          oldValue: oldData.paper_size,
          newValue: paper_size,
          username
        });

      }

      if (oldData.orientation !== orientation) {

        await logAudit(new sql.Request(transaction), {
          table: "CustomFormTemplates",
          recordId: id,
         transaction: `Update Orientation - ${template_name}`,
          type: "UPDATE",
          oldValue: oldData.orientation,
          newValue: orientation,
          username
        });

      }

      if (oldData.total_pages !== total_pages) {

        await logAudit(new sql.Request(transaction), {
          table: "CustomFormTemplates",
          recordId: id,
          transaction: `Update Total Pages - ${template_name}`,
          type: "UPDATE",
          oldValue: oldData.total_pages,
          newValue: total_pages,
          username
        });

      }


      await transaction.commit();

      res.json({
        message: "Template updated successfully"
      });

    } catch (err) {

      await transaction.rollback();
      throw err;

    }

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to update template"
    });

  }

};


/* =====================================================
   GET TEMPLATE DEPARTMENTS
===================================================== */
exports.getTemplateDepartments = async (req, res) => {

  try {

    const { id } = req.params;
    const pool = req.app.locals.pool;

    const result = await pool.request()
      .input("template_id", id)
      .query(`
SELECT department_id
FROM dbo.CustomFormTemplateDepartments
WHERE template_id = @template_id
      `);

    res.json(result.recordset);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch departments"
    });

  }

};

/* =====================================================
   CREATE FIELD
===================================================== */
exports.createField = async (req, res) => {

  try {

    const pool = req.app.locals.pool;

    const templateId = req.params.templateId;

    const result = await fieldService.createField(
      pool,
      templateId,
      {
        ...req.body,
        created_by: req.user?.id || 1,
        username: req.body.auth_username || req.user?.username || "SYSTEM"
      }
    );

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error creating field",
      error: err.message
    });

  }

};

/* =====================================================
   TOGGLE TEMPLATE STATUS
===================================================== */
exports.toggleTemplateStatus = async (req, res) => {

  const sql = require("mssql");

  try {

    const { id } = req.params;
    const { is_active } = req.body;

    const pool = req.app.locals.pool;
   const username = req.body.auth_username || req.user?.username || "SYSTEM";

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    /* GET OLD STATUS */
    const oldResult = await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .query(`
        SELECT template_name, is_active
        FROM dbo.CustomFormTemplates
        WHERE template_id = @id
      `);

    const oldData = oldResult.recordset[0];

    const templateName = oldData.template_name;
    const oldStatus = oldData.is_active ? "ACTIVE" : "INACTIVE";
    const newStatus = is_active ? "ACTIVE" : "INACTIVE";

    /* UPDATE STATUS */
    await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .input("is_active", sql.Bit, is_active)
      .input("updated_by", sql.Int, req.user.id)
      .query(`
        UPDATE dbo.CustomFormTemplates
        SET is_active = @is_active,
            updated_by = @updated_by,
            date_updated = GETDATE()
        WHERE template_id = @id
      `);

    /* AUDIT */
    await logAudit(new sql.Request(transaction), {
      table: "CustomFormTemplates",
      recordId: id,
      transaction: `Update Template Status - ${templateName}`,
      type: "UPDATE",
      oldValue: oldStatus,
      newValue: newStatus,
      username
    });

    await transaction.commit();

    res.json({ success: true });

  } catch (err) {

    console.error("STATUS UPDATE ERROR:", err);

    res.status(500).json({
      message: "Status update failed"
    });

  }

};