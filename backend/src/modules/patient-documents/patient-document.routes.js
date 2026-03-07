const express = require("express");
const router = express.Router();

const controller = require("./patient-document.controller");
const upload = require("./patient-document.upload");

router.post("/upload", upload.single("file"), controller.uploadDocument);
router.get("/:registryNo", controller.getDocuments);
router.delete("/:id", controller.deleteDocument);

module.exports = router;