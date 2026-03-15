const express = require("express");
const sql = require("mssql");
const router = express.Router();
const templateController = require("./template/template.controller");
const fieldController = require("./template/field.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../../../middleware/auth.middleware");
const patientFormsController = require("./patient/patient-forms.controller");
const controller = require('./custom-forms.controller');
const patientController = require("./patient/patient-forms.controller");

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
router.get("/patient/:registryId", patientController.getPatientRegistry);
router.post(
  "/templates/:templateId/fields",
  verifyToken,
  fieldController.createField
);

router.put(
  "/template/:id/status",
  verifyToken,
  templateController.toggleTemplateStatus
);
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
// PATIENT FORMS
// ============================

router.post("/patient-form/draft", verifyToken, patientFormsController.saveDraft);

router.post("/patient-form/finalize", verifyToken, patientFormsController.finalizeForm);

router.get("/patient-form/patient/:patientId", verifyToken, patientFormsController.getPatientForms);

router.get("/patient-form/:id", verifyToken, patientFormsController.getFormById);
module.exports = router;