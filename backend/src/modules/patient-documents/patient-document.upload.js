const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const registryNo = req.body.registryTrackingNo;

    if (!registryNo) {
      return cb(new Error("registryTrackingNo is required"));
    }

    const dir = path.join(
      __dirname,
      "../../../../uploads/patient-documents",
      registryNo.toString()
    );

    try {

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);

    } catch (err) {
      cb(err);
    }

  },

  filename: (req, file, cb) => {

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    const safeName =
      path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_");

    cb(null, `${safeName}_${timestamp}${ext}`);
  }

});

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },

  fileFilter: (req, file, cb) => {

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, PNG allowed"));
    }

    cb(null, true);
  }

});

module.exports = upload;