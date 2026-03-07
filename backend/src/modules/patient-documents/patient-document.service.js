const sql = require("mssql");

const createDocument = async (data) => {

  try {

    const pool = await sql.connect();

    const result = await pool.request()
      .input("registryTrackingNo", sql.Int, data.registryTrackingNo)
      .input("recordName", sql.VarChar(255), data.recordName)
      .input("fileName", sql.VarChar(255), data.fileName)
      .input("filePath", sql.VarChar(500), data.filePath)
      .input("fileType", sql.VarChar(100), data.fileType)
      .input("fileSize", sql.Int, data.fileSize)
      .input("createdBy", sql.Int, data.createdBy)
      .query(`
        INSERT INTO PatientDocuments
        (
          RegistryTrackingNo,
          RecordName,
          FileName,
          FilePath,
          FileType,
          FileSize,
          CreatedBy
        )
        VALUES
        (
          @registryTrackingNo,
          @recordName,
          @fileName,
          @filePath,
          @fileType,
          @fileSize,
          @createdBy
        )
      `);

    return result;

  } catch (err) {

    console.error("CREATE DOCUMENT ERROR:", err);
    throw err;

  }

};


const getDocuments = async (registryTrackingNo) => {

  try {

    const pool = await sql.connect();

    const result = await pool.request()
      .input("registryTrackingNo", sql.Int, registryTrackingNo)
      .query(`
SELECT
  d.DocumentID,
  d.RegistryTrackingNo,
  d.RecordName,
  d.FileName,
  d.FilePath,
  d.FileType,
  d.FileSize,
  d.CreatedAt,
  u.usr_custom_name AS UploadedBy
FROM PatientDocuments d
LEFT JOIN Users u
  ON d.CreatedBy = u.Auto_id
WHERE d.RegistryTrackingNo = @registryTrackingNo
AND d.IsDeleted = 0
ORDER BY d.CreatedAt DESC
      `);

    return result;

  } catch (err) {

    console.error("GET DOCUMENTS ERROR:", err);
    throw err;

  }

};


const deleteDocument = async (documentId, userId) => {

  try {

    const pool = await sql.connect();

    const result = await pool.request()
      .input("documentId", sql.Int, documentId)
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE PatientDocuments
        SET
          IsDeleted = 1,
          DeletedBy = @userId,
          DeletedAt = GETDATE()
        WHERE DocumentID = @documentId
      `);

    return result;

  } catch (err) {

    console.error("DELETE DOCUMENT ERROR:", err);
    throw err;

  }

};


module.exports = {
  createDocument,
  getDocuments,
  deleteDocument
};