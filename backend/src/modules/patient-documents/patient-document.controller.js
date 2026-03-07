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

    // define variables FIRST
    const caseId = parseInt(req.body.registryTrackingNo);
    const fileName = file.filename;

    // store relative path
    const filePath = `uploads/patient-documents/${caseId}/${fileName}`;

    const data = {
      registryTrackingNo: caseId,
      recordName: req.body.recordName || file.originalname,
      fileName: file.originalname,
      filePath: filePath,
      fileType: file.mimetype,
      fileSize: parseInt(file.size),
      createdBy: parseInt(req.body.userId)
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
    const user = req.body.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required"
      });
    }

    await service.deleteDocument(id, user);

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