const sql = require("mssql");

/* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   AUDIT LOGGER WITH DEBUG
===================================================== */
const logAudit = async (transaction, data) => {

  console.log("===== AUDIT DEBUG START =====");
  console.log("AUDIT INPUT:", data);

  let recordId = null;

  if (typeof data.recordId === "number") {
    recordId = data.recordId.toString();
  }

  if (typeof data.recordId === "string") {
    recordId = data.recordId;
  }

  console.log("AUDIT RECORD ID:", recordId);
  console.log("AUDIT RECORD TYPE:", typeof recordId);

  // 👇 ADD IT HERE
  console.log("FINAL AUDIT PARAMS:", {
    table: data.table,
    recordId,
    transaction: data.transaction,
    type: data.type,
    username: data.username
  });

  console.log("===== AUDIT DEBUG END =====");

  await transaction.request()
    .input("table_name", sql.VarChar(100), safeString(data.table))
    .input("record_id", sql.VarChar(100), recordId || "0")
    .input("transaction", sql.VarChar(200), safeString(data.transaction))
    .input("transaction_type", sql.VarChar(20), safeString(data.type))
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "CUSTOM_FORM_TEMPLATE")
    .input("username", sql.VarChar(100), safeString(data.username) || "SYSTEM")
    .input("pc_name", sql.VarChar(100), safeString(data.pcName) || "UNKNOWN")
    .execute("sp_insert_audit");

};

/* =====================================================
   CREATE TEMPLATE
===================================================== */
exports.createTemplate = async (pool, data) => {

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    console.log("CREATE TEMPLATE INPUT:", data);

const {
  template_name,
  description,
  paper_size,
  orientation,
  total_pages,
  created_by,
  username,
  file_path
} = data;
    const result = await transaction.request()
      .input("template_name", sql.NVarChar(255), template_name)
      .input("description", sql.NVarChar(500), description || null)
      .input("paper_size", sql.NVarChar(50), paper_size || "A4")
      .input("orientation", sql.NVarChar(20), orientation || "portrait")
      .input("total_pages", sql.Int, total_pages || 1)
      .input("created_by", sql.Int, created_by || 1)
      .input("updated_by", sql.Int, created_by || 1)
      .input("file_path", sql.NVarChar(500), file_path || null)
      .query(`
        INSERT INTO CustomFormTemplates (
          template_name,
          description,
          paper_size,
          orientation,
          total_pages,
          is_active,
          created_by,
          date_created,
          updated_by,
          date_updated,
          file_path
        )
        OUTPUT INSERTED.template_id
        VALUES (
          @template_name,
          @description,
          @paper_size,
          @orientation,
          @total_pages,
          1,
          @created_by,
          GETDATE(),
          @updated_by,
          GETDATE(),
          @file_path
        )
      `);

    console.log("INSERT RESULT:", result.recordset);

    const templateId = result.recordset[0]?.template_id;
	
	if (data.department_ids && data.department_ids.length > 0) {

  for (const deptId of data.department_ids) {

    await transaction.request()
      .input("template_id", sql.Int, templateId)
      .input("department_id", sql.Int, deptId)
      .input("created_by", sql.Int, created_by)
      .query(`
        INSERT INTO CustomFormTemplateDepartments
        (template_id, department_id, created_by)
        VALUES
        (@template_id, @department_id, @created_by)
      `);

  }

}

let deptNames = "";

if (data.department_ids && data.department_ids.length > 0) {

  const request = new sql.Request(transaction);

  data.department_ids.forEach((deptId, index) => {
    request.input(`dept${index}`, sql.Int, deptId);
  });

  const inClause = data.department_ids.map((_, i) => `@dept${i}`).join(",");

const deptResult = await request.query(`
  SELECT dept_name
  FROM dbo.departments
  WHERE auto_id IN (${inClause})
`);

  deptNames = deptResult.recordset
.map(d => d.dept_name)
    .join(", ");
}

    console.log("NEW TEMPLATE ID:", templateId);

    await logAudit(transaction,{
      table:"CustomFormTemplates",
      recordId:templateId,
      transaction:"Create Template",
      type:"ADD",
      newValue: `${template_name} | Departments: ${deptNames}`,
      username:username,
      pcName:"WEB"
    });

    await transaction.commit();

    console.log("TEMPLATE CREATED SUCCESSFULLY");

    return result.recordset[0];

  } catch (err) {

    console.error("CREATE TEMPLATE ERROR:", err);

    await transaction.rollback();
    throw err;

  }

};

/* =====================================================
   CREATE FIELD
===================================================== */
exports.createField = async (pool, templateId, data) => {

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    console.log("CREATE FIELD INPUT:", data);
    console.log("TEMPLATE ID:", templateId);

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

    const result = await transaction.request()

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

      .input("field_key", sql.NVarChar(150), field_key || `field_${Date.now()}`)
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

      .input("options", sql.NVarChar(sql.MAX), options ? JSON.stringify(options) : null)

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

    const fieldId = result.recordset[0]?.field_id;

    console.log("NEW FIELD ID:", fieldId);

    await logAudit(transaction,{
      table:"CustomFormTemplateFields",
      recordId:fieldId,
      transaction:"Create Template Field",
      type:"ADD",
      newValue:`${label} (${field_type})`,
      username:data.username,
      pcName:"WEB"
    });

    await transaction.commit();

    return result.recordset[0];

  } catch (err) {

    console.error("CREATE FIELD ERROR:", err);

    await transaction.rollback();
    throw err;

  }

};