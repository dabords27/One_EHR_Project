const sql = require("mssql");

/**
 * CREATE SINGLE FIELD (FULL VERSION)
 */
exports.createField = async (pool, templateId, data) => {
  const {
    page_number,
    field_type,
	field_key,
    label,
    data_source,
    x,
    y,
    width,
    height,
    font_size,
    font_weight,
    font_style,
    text_align,
    font_family,
    is_required,
    field_order,
    created_by,
    placeholder,
    options,
    system_binding,
    formula_expression,
    image_path,

    // 🔥 NEW PROPERTIES
    input_type,
    result_type,
    date_mode,
    auto_now,
    min_date,
    max_date,
    is_birthdate,
    list_orientation,
    max_length
  } = data;

  const result = await pool.request()
    .input("template_id", sql.Int, templateId)
    .input("page_number", sql.Int, page_number)
    .input("field_type", sql.VarChar(50), field_type)
    .input("label", sql.NVarChar(255), label)
    .input("data_source", sql.NVarChar(255), data_source || "manual")

    .input("x", sql.Float, x)
    .input("y", sql.Float, y)
    .input("width", sql.Float, width)
    .input("height", sql.Float, height)

    .input("font_size", sql.Int, font_size || 12)
    .input("font_weight", sql.NVarChar(20), font_weight || "normal")
    .input("font_style", sql.NVarChar(20), font_style || "normal")
    .input("text_align", sql.NVarChar(20), text_align || "left")
    .input("font_family", sql.NVarChar(100), font_family || "Arial")

    .input("is_required", sql.Bit, is_required || false)
    .input("field_order", sql.Int, field_order || 0)
    .input("created_by", sql.Int, created_by || 1)
    .input("updated_by", sql.Int, created_by || 1)

   .input(
  "field_key",
  sql.NVarChar(150),
  field_key || `field_${Date.now()}`
)
    .input("placeholder", sql.NVarChar(255), placeholder || null)
    .input("system_binding", sql.NVarChar(150), system_binding || null)
    .input("formula_expression", sql.NVarChar(sql.MAX), formula_expression || null)
    .input("image_path", sql.NVarChar(500), image_path || null)

    .input("input_type", sql.NVarChar(20), input_type || "text")
    .input("result_type", sql.NVarChar(20), result_type || "number")
    .input("date_mode", sql.NVarChar(20), date_mode || "date")
    .input("auto_now", sql.Bit, auto_now || false)
.input("min_date", sql.Date, min_date ? new Date(min_date) : null)
.input("max_date", sql.Date, max_date ? new Date(max_date) : null)
    .input("is_birthdate", sql.Bit, is_birthdate || false)
    .input("list_orientation", sql.NVarChar(20), list_orientation || "vertical")
    .input("max_length", sql.Int, max_length || null)

    .input(
      "options",
      sql.NVarChar(sql.MAX),
      options ? JSON.stringify(options) : null
    )

    .query(`
      INSERT INTO CustomFormTemplateFields (
        template_id,
        page_number,
        field_type,
        label,
		field_key,
        data_source,
        x,
        y,
        width,
        height,
        font_size,
        font_weight,
        font_style,
        text_align,
        font_family,
        is_required,
        field_order,
        created_by,
        updated_by,
        date_created,
        date_updated,
        placeholder,
        options,
        system_binding,
        formula_expression,
        image_path,
        input_type,
        result_type,
        date_mode,
        auto_now,
        min_date,
        max_date,
        is_birthdate,
        list_orientation,
        max_length
      )
      OUTPUT INSERTED.field_id
      VALUES (
        @template_id,
        @page_number,
        @field_type,
        @label,
		@field_key,
        @data_source,
        @x,
        @y,
        @width,
        @height,
        @font_size,
        @font_weight,
        @font_style,
        @text_align,
        @font_family,
        @is_required,
        @field_order,
        @created_by,
        @updated_by,
        GETDATE(),
        GETDATE(),
        @placeholder,
        @options,
        @system_binding,
        @formula_expression,
        @image_path,
        @input_type,
        @result_type,
        @date_mode,
        @auto_now,
        @min_date,
        @max_date,
        @is_birthdate,
        @list_orientation,
        @max_length
      )
    `);

  return result.recordset[0];
};


/**
 * GET FIELDS BY PAGE (FULL VERSION)
 */
exports.getFieldsByPage = async (pool, templateId, pageNumber) => {
  const result = await pool.request()
    .input("template_id", sql.Int, templateId)
    .input("page_number", sql.Int, pageNumber)
    .query(`
      SELECT
        field_id,
        template_id,
        page_number,
        field_type,
        label,
        data_source,
        x,
        y,
        width,
        height,
        font_size,
        font_weight,
        font_style,
        text_align,
        font_family,
        is_required,
        field_order,
        field_key,
        placeholder,
        options,
        system_binding,
        formula_expression,
        image_path,
        input_type,
        result_type,
        date_mode,
        auto_now,
        min_date,
        max_date,
        is_birthdate,
        list_orientation,
        max_length
      FROM CustomFormTemplateFields
      WHERE template_id = @template_id
        AND page_number = @page_number
      ORDER BY field_order ASC
    `);

  return result.recordset.map(row => ({
    ...row,
    options: row.options ? JSON.parse(row.options) : [],
  }));
};