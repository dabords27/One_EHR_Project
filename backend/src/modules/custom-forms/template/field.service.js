exports.createField = async (pool, templateId, data) => {
  const {
    page_number,
    field_type,
    label,
    data_source,
    x,
    y,
    width,
    height,
    font_size,
    is_required,
    field_order,
    created_by
  } = data;

  const result = await pool.request()
    .input("template_id", templateId)
    .input("page_number", page_number)
    .input("field_type", field_type)
    .input("label", label)
    .input("data_source", data_source)
    .input("x", x)
    .input("y", y)
    .input("width", width)
    .input("height", height)
    .input("font_size", font_size)
    .input("is_required", is_required)
    .input("field_order", field_order)
    .input("created_by", created_by)
    .query(`
      INSERT INTO CustomFormTemplateFields
      (template_id, page_number, field_type, label, data_source,
       x, y, width, height, font_size, is_required, field_order, created_by)
      OUTPUT INSERTED.field_id
      VALUES
      (@template_id, @page_number, @field_type, @label, @data_source,
       @x, @y, @width, @height, @font_size, @is_required, @field_order, @created_by)
    `);

  return result.recordset[0];
};

exports.getFieldsByPage = async (pool, templateId, pageNumber) => {
  const result = await pool.request()
    .input("template_id", templateId)
    .input("page_number", pageNumber)
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
        is_required,
        field_order
      FROM CustomFormTemplateFields
      WHERE template_id = @template_id
        AND page_number = @page_number
      ORDER BY field_order ASC
    `);

  return result.recordset;
};