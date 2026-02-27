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
    const filePath = `/uploads/custom-forms/${templateId}/${req.file.filename}`;

    const result = await templateService.saveTemplatePage(
      pool,
      templateId,
      filePath,
      req.file.path,
      req.body.page_number,
      req.body.created_by
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading PDF page" });
  }
};

exports.getFieldsByPage = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const templateId = req.params.id;
    const pageNumber = req.query.page;

    if (!pageNumber) {
      return res.status(400).json({
        message: "page query parameter is required"
      });
    }

    const result = await fieldService.getFieldsByPage(
      pool,
      templateId,
      pageNumber
    );

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching fields",
      error: err.message
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const result = await pool.request().query(`
      SELECT template_id,
             template_name,
             total_pages,
             paper_size,
             orientation
      FROM CustomFormTemplates
      ORDER BY template_id DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching templates" });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { template_name, paper_size, orientation, total_pages, updated_by } = req.body;

    const currentUser = req.user;
    const pool = req.app.locals.pool;

    // ✅ Always use INT (user ID)
    let updatedBy;

    if (updated_by) {
      updatedBy = updated_by; // from AuthModal (verifiedUser.id)
    } else {
      updatedBy = currentUser.id; // fallback to JWT user
    }

    await pool.request()
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

    res.json({ message: "Template updated successfully" });

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