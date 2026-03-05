const sql = require("mssql");
const templateService = require("./template.service");
const fieldService = require("./field.service");


exports.createTemplate = async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const result = await templateService.createTemplate(
      pool,
      req.body   // 🔥 THIS IS THE FIX
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

exports.uploadTemplatePage = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const templateId = req.params.id;
    const updatedBy = req.user.id;

    // Always save as template.pdf
    const filePath = `/uploads/custom-forms/${templateId}/template.pdf`;

    // 🔥 Update template record instead of inserting page row
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
    res.status(500).json({ message: "Error uploading PDF" });
  }
};
exports.getTemplates = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { department_id } = req.query;

    const request = pool.request();

    let query = `
      SELECT DISTINCT t.*
      FROM dbo.CustomFormTemplates t
      LEFT JOIN dbo.CustomFormTemplateDepartments td
        ON t.template_id = td.template_id
      WHERE t.is_active = 1
    `;

    if (department_id) {
      request.input("department_id", sql.Int, department_id);
      query += ` AND td.department_id = @department_id`;
    }

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (err) {
    console.error("GET TEMPLATE ERROR:", err);
    res.status(500).json({ error: "Failed to load templates" });
  }
};

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
      // 🔥 UPDATE TEMPLATE
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

      // 🔥 DELETE OLD DEPARTMENTS
      await new sql.Request(transaction)
        .input("template_id", sql.Int, id)
        .query(`
          DELETE FROM dbo.CustomFormTemplateDepartments
          WHERE template_id = @template_id
        `);

      // 🔥 INSERT NEW DEPARTMENTS
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
      }

      await transaction.commit();

      res.json({ message: "Template updated successfully" });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update template" });
  }
};

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
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};