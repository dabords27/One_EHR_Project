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
  } = data;

  const result = await pool
    .request()
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

  return result.recordset[0];
};

exports.saveTemplatePage = async (
  pool,
  templateId,
  publicPath,
  absolutePath,
  pageNumber,
  createdBy
) => {
  // Read PDF to detect dimensions
  const existingPdfBytes = fs.readFileSync(absolutePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  await pool
    .request()
    .input("template_id", templateId)
    .input("page_number", pageNumber)
    .input("pdf_path", publicPath)
    .input("page_width", width)
    .input("page_height", height)
    .input("created_by", createdBy)
    .query(`
      INSERT INTO CustomFormTemplatePages
      (template_id, page_number, pdf_path, page_width, page_height, created_by)
      VALUES
      (@template_id, @page_number, @pdf_path, @page_width, @page_height, @created_by)
    `);

  return {
    message: "Page uploaded successfully",
    width,
    height,
  };
};