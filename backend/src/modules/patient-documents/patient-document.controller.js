

const sql = require("mssql");
const service = require("./patient-document.service");

const uploadDocument = async (req, res) => {

  try {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const caseId = parseInt(req.body.registryTrackingNo);
    const userId = parseInt(req.body.userId);
    const fileName = file.filename;

    const filePath = `uploads/patient-documents/${caseId}/${fileName}`;

    /* =========================
       CONNECT DATABASE
    ========================= */

    const pool = await sql.connect();

    /* =========================
       GET PATIENT INFO
    ========================= */

    const patientResult = await pool.request()
      .input("registryNo", sql.Int, caseId)
      .query(`
        SELECT 
          RegistryTrackingNo,
          MRN,
          Firstname,
          Middlename,
          Lastname
        FROM dbo.PatientRegistry_Local
        WHERE RegistryTrackingNo = @registryNo
      `);

    const patient = patientResult.recordset[0] || {};

    const MRN = patient.MRN || "";
    const caseRegistry = patient.RegistryTrackingNo || "";

    const fullName =
      `${patient.Lastname || ""}, ${patient.Firstname || ""} ${patient.Middlename || ""}`.trim();

    /* =========================
       GET USERNAME
    ========================= */

    const userResult = await pool.request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT usr_custom_name,usr_username
        FROM Users
        WHERE Auto_id = @userId
      `);

    const rawUsername = userResult.recordset[0]?.usr_username || "SYSTEM";

    const username =
      rawUsername === "SYSTEM ADMINISTRATOR"
        ? "ADMIN"
        : rawUsername;

    /* =========================
       PREPARE DATA
    ========================= */

    const data = {
      registryTrackingNo: caseId,
      recordName: req.body.recordName || file.originalname,
      fileName: file.originalname,
      filePath: filePath,
      fileType: file.mimetype,
      fileSize: parseInt(file.size),
      createdBy: userId,
      username: username,
      pcName: "WEB",

      MRN: MRN,
      fullName: fullName,
      caseId: caseRegistry
    };

    await service.createDocument(data);

    res.json({
      success: true,
      message: "Document uploaded successfully"
    });

  } catch (err) {

    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: err.message
    });

  }

};

const getDocuments = async (req, res) => {

  try {

    const registryNo = req.params.registryNo;

    if (!registryNo) {
      return res.status(400).json({
        success: false,
        message: "Registry number is required"
      });
    }

    const docs = await service.getDocuments(registryNo);

    res.json({
      success: true,
      data: docs.recordset
    });

  } catch (err) {

    console.error("GET DOCUMENTS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch documents"
    });

  }

};


const deleteDocument = async (req, res) => {

  try {

    const id = req.params.id;
    const userId = parseInt(req.body.userId);

    const pool = await sql.connect();

    const userResult = await pool.request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT usr_custom_name,usr_username
        FROM Users
        WHERE Auto_id = @userId
      `);

    const username = userResult.recordset[0]?.usr_username|| "SYSTEM";

    await service.deleteDocument(id, userId, username);

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (err) {

    console.error("DELETE DOCUMENT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete document"
    });

  }

};


module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument
};