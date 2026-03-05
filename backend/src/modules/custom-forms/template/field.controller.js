const sql = require("mssql");
const fieldService = require("./field.service");

/**
 * CREATE SINGLE FIELD
 */
exports.createField = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const templateId = req.params.id;

    const result = await fieldService.createField(
      pool,
      templateId,
      req.body
    );

    res.json(result);

  } catch (err) {
    console.error("CREATE FIELD ERROR:", err);
    res.status(500).json({
      message: "Error creating field",
      error: err.message
    });
  }
};

/**
 * GET FIELDS BY PAGE
 */
exports.getFieldsByPage = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { page_number } = req.query;

    const result = await fieldService.getFieldsByPage(
      pool,
      id,
      page_number
    );

    res.json(result);

  } catch (err) {
    console.error("GET FIELDS ERROR:", err);
    res.status(500).json({
      message: "Error loading fields",
      error: err.message
    });
  }
};

/**
 * GET ALL FIELDS (ALL PAGES)
 */
exports.getAllFields = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    const result = await pool.request()
      .input("template_id", sql.Int, id)
      .query(`
        SELECT *
        FROM CustomFormTemplateFields
        WHERE template_id = @template_id
        ORDER BY page_number, field_order
      `);

    const mapped = result.recordset.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : []
    }));

    res.json(mapped);

  } catch (err) {
    console.error("GET ALL FIELDS ERROR:", err);
    res.status(500).json({
      message: "Error loading all fields",
      error: err.message
    });
  }
};

exports.syncTemplateFields = async (req, res) => {
  const { id } = req.params;
  const { page_number, fields, created_by } = req.body;

  const pool = req.app.locals.pool;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 🔴 DELETE existing fields for this page
    await new sql.Request(transaction)
      .input("template_id", sql.Int, id)
      .input("page_number", sql.Int, page_number)
      .query(`
        DELETE FROM CustomFormTemplateFields
        WHERE template_id = @template_id
          AND page_number = @page_number
      `);

    // 🟢 INSERT new fields (FULL COLUMN SUPPORT)
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      await new sql.Request(transaction)
        .input("template_id", sql.Int, id)
        .input("page_number", sql.Int, field.page)
        .input("field_type", sql.VarChar(50), field.type)
        .input("label", sql.NVarChar(255), field.label)

.input("field_key", sql.NVarChar(150), field.fieldName)

        .input("data_source", sql.NVarChar(255), field.dataSource || "manual")
        .input("system_binding", sql.NVarChar(150), field.systemBinding || null)

        .input("x", sql.Float, field.xPercent)
        .input("y", sql.Float, field.yPercent)
        .input("width", sql.Float, field.widthPercent)
        .input("height", sql.Float, field.heightPercent)

        .input("font_size", sql.Int, field.fontSize || 12)
        .input("font_weight", sql.NVarChar(20), field.fontWeight || "normal")
        .input("font_style", sql.NVarChar(20), field.fontStyle || "normal")
        .input("text_align", sql.NVarChar(20), field.textAlign || "left")
        .input("font_family", sql.NVarChar(100), field.fontFamily || "Arial")

        .input("placeholder", sql.NVarChar(255), field.placeholder || null)

        .input("formula_expression", sql.NVarChar(sql.MAX), field.formulaExpression || null)

        .input("input_type", sql.NVarChar(20), field.inputType || "text")
        .input("result_type", sql.NVarChar(20), field.resultType || "number")

        .input("date_mode", sql.NVarChar(20), field.dateMode || "date")
        .input("auto_now", sql.Bit, field.autoNow || false)
.input("min_date", sql.Date, field.minDate ? new Date(field.minDate) : null)
.input("max_date", sql.Date, field.maxDate ? new Date(field.maxDate) : null)
        .input("is_birthdate", sql.Bit, field.isBirthdate || false)

        .input("list_orientation", sql.NVarChar(20), field.listOrientation || "vertical")
        .input("max_length", sql.Int, field.maxLength || null)

        .input("is_required", sql.Bit, field.required || false)
        .input("field_order", sql.Int, i + 1)

        .input("created_by", sql.Int, created_by || 1)
        .input("updated_by", sql.Int, created_by || 1)

        .input(
          "options",
          sql.NVarChar(sql.MAX),
          field.options ? JSON.stringify(field.options) : null
        )

        .query(`
          INSERT INTO CustomFormTemplateFields (
            template_id,
            page_number,
            field_type,
            label,
            field_key,
            data_source,
            system_binding,
            x,
            y,
            width,
            height,
            font_size,
            font_weight,
            font_style,
            text_align,
            font_family,
            placeholder,
            formula_expression,
            input_type,
            result_type,
            date_mode,
            auto_now,
            min_date,
            max_date,
            is_birthdate,
            list_orientation,
            max_length,
            is_required,
            field_order,
            created_by,
            updated_by,
            date_created,
            date_updated,
            options
          )
          VALUES (
            @template_id,
            @page_number,
            @field_type,
            @label,
            @field_key,
            @data_source,
            @system_binding,
            @x,
            @y,
            @width,
            @height,
            @font_size,
            @font_weight,
            @font_style,
            @text_align,
            @font_family,
            @placeholder,
            @formula_expression,
            @input_type,
            @result_type,
            @date_mode,
            @auto_now,
            @min_date,
            @max_date,
            @is_birthdate,
            @list_orientation,
            @max_length,
            @is_required,
            @field_order,
            @created_by,
            @updated_by,
            GETDATE(),
            GETDATE(),
            @options
          )
        `);
    }

    await transaction.commit();

    res.json({ message: "Fields synced successfully" });

  } catch (err) {
    await transaction.rollback();
    console.error("SYNC ERROR:", err);
    res.status(500).json({
      message: "Sync failed",
      error: err.message
    });
  }
};