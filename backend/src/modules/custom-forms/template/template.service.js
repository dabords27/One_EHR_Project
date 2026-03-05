const sql = require("mssql");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");

exports.createTemplate = async (pool, data) => {
  const {
    template_name,
    description,
    paper_size,
    orientation,
    total_pages,
    created_by,
    department_ids
  } = data;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);

    const result = await request
      .input("template_name", template_name)
      .input("description", description)
      .input("paper_size", paper_size)
      .input("orientation", orientation)
      .input("total_pages", total_pages)
      .input("created_by", created_by)
      .query(`
        INSERT INTO CustomFormTemplates
        (template_name, description, paper_size, orientation, total_pages, created_by)
        OUTPUT INSERTED.template_id
        VALUES
        (@template_name, @description, @paper_size, @orientation, @total_pages, @created_by)
      `);

    const templateId = result.recordset[0].template_id;

    // 🔥 INSERT DEPARTMENTS
    if (department_ids && department_ids.length > 0) {
      for (const deptId of department_ids) {
        await new sql.Request(transaction)
          .input("template_id", templateId)
          .input("department_id", deptId)
          .input("created_by", created_by)
          .query(`
            INSERT INTO CustomFormTemplateDepartments
            (template_id, department_id, created_by)
            VALUES
            (@template_id, @department_id, @created_by)
          `);
      }
    }

    await transaction.commit();

    return { template_id: templateId };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
