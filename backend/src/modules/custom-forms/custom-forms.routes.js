const express = require("express");
const router = express.Router();
const templateController = require("./template/template.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Storage config
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
  const pageNumber = req.body.page_number || 1;
  cb(null, `page_${pageNumber}.pdf`);
}
});

const upload = multer({ storage });

// Routes
router.get("/templates", templateController.getTemplates);

router.post("/template", templateController.createTemplate);

router.put("/template/:id", templateController.updateTemplate); // ✅ ADD THIS

router.post(
  "/template/:id/upload-page",
  upload.single("pdf"),
  templateController.uploadTemplatePage
);

router.get(
  "/template/:id/departments",
  templateController.getTemplateDepartments
);

// ✅ TEST ROUTE
router.get("/test", (req, res) => {
  res.json({ message: "Custom Forms API working" });
});


// Routes
router.post("/template", templateController.createTemplate);
router.post(
  "/template/:id/upload-page",
  upload.single("pdf"),
  templateController.uploadTemplatePage
);

const fieldController = require("./template/field.controller");

router.post(
  "/template/:id/field",
  fieldController.createField
);

router.get(
  "/template/:id/fields",
  templateController.getFieldsByPage
);



module.exports = router;
