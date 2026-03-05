const express = require("express");
const router = express.Router();
const templateController = require("./template/template.controller");
const fieldController = require("./template/field.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../../../middleware/auth.middleware");
const patientFormsController = require("./patient/patient-forms.controller");
const controller = require('./custom-forms.controller');

// ============================
// MULTER STORAGE
// ============================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const templateId = req.params.id;
    const uploadPath = path.join(
      __dirname,
      "../../../../uploads/custom-forms",
      templateId
    );

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
filename: function (req, file, cb) {
  cb(null, `template.pdf`);
}
});

const upload = multer({ storage });

// ============================
// TEMPLATE ROUTES
// ============================

router.get("/templates", verifyToken, templateController.getTemplates);
router.post("/template", verifyToken, templateController.createTemplate);
router.put("/template/:id", verifyToken, templateController.updateTemplate);
router.get("/template/:id/departments", verifyToken, templateController.getTemplateDepartments);

// ============================
// FIELD ROUTES
// ============================

router.get("/template/:id/fields", verifyToken, fieldController.getAllFields);
router.post("/template/:id/sync-fields", verifyToken, fieldController.syncTemplateFields);
router.post("/template/:id/field", verifyToken, fieldController.createField);
router.get("/repository", controller.getRepository);

// ============================
// FILE UPLOAD
// ============================

router.post(
  "/template/:id/upload-page",
  verifyToken,
  upload.single("pdf"),
  templateController.uploadTemplatePage
);

// ============================
// TOGGLE
// ============================

router.put("/template/:id/status", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { is_active, updated_by } = req.body;

  const pool = req.app.locals.pool;
  const sql = require("mssql");

  try {
    await pool.request()
      .input("id", sql.Int, id)
      .input("is_active", sql.Bit, is_active)
      .input("updated_by", sql.Int, updated_by)
      .query(`
        UPDATE dbo.CustomFormTemplates
        SET is_active = @is_active,
            updated_by = @updated_by,
            date_updated = GETDATE()
        WHERE template_id = @id
      `);

    res.json({ success: true });

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Status update failed" });
  }
});



// ============================
// PATIENT FORMS
// ============================

router.post("/patient-form/draft", verifyToken, patientFormsController.saveDraft);

router.post("/patient-form/finalize", verifyToken, patientFormsController.finalizeForm);

router.get("/patient-form/patient/:patientId", verifyToken, patientFormsController.getPatientForms);

router.get("/patient-form/:id", verifyToken, controller.getPatientForm);
module.exports = router;