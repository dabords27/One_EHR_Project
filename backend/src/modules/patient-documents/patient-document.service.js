const sql = require("mssql");

/* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   AUDIT LOGGER
===================================================== */
const logAudit = async (transaction, data) => {

  await transaction.request()
    .input("table_name", sql.VarChar(100), data.table)
    .input("record_id", sql.VarChar(100), String(data.recordId || "0"))
    .input("transaction", sql.VarChar(200), data.transaction)
    .input("transaction_type", sql.VarChar(20), data.type)
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "PATIENT_DOCUMENTS")
   .input("username", sql.VarChar(100), String(data.username || "SYSTEM"))
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");

};


/* =====================================================
   CREATE DOCUMENT
===================================================== */
const createDocument = async (data) => {

  try {

    const pool = await sql.connect();
    const transaction = pool.transaction();

    await transaction.begin();

    const result = await transaction.request()
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
        OUTPUT INSERTED.DocumentID
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

    const documentId = result.recordset[0].DocumentID;

    /* =====================================================
       AUDIT: CREATE DOCUMENT
    ===================================================== */
    await logAudit(transaction,{
      table: "PatientDocuments",
      recordId: documentId,
      transaction: "Upload Patient Document",
      type: "ADD",
    newValue: `Record Name : ${data.recordName}`,
      username: data.username,
      pcName: data.pcName
    });

    await transaction.commit();

    return result;

  } catch (err) {

    console.error("CREATE DOCUMENT ERROR:", err);
    throw err;

  }

};


/* =====================================================
   GET DOCUMENTS
===================================================== */
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


/* =====================================================
   DELETE DOCUMENT
===================================================== */
const deleteDocument = async (documentId, userId, username) => {

  try {

    const pool = await sql.connect();
    const transaction = pool.transaction();

    await transaction.begin();

    const oldDoc = await transaction.request()
      .input("documentId", sql.Int, documentId)
      .query(`
        SELECT RecordName, FileName
        FROM PatientDocuments
        WHERE DocumentID = @documentId
      `);

    const result = await transaction.request()
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

/* =====================================================
   AUDIT: DELETE DOCUMENT
===================================================== */
await logAudit(transaction,{
  table: "PatientDocuments",
  recordId: documentId,
  transaction: "Delete Patient Document",
  type: "DELETE",
  oldValue: `Record Name : ${oldDoc.recordset[0]?.RecordName || ""}`,
  username: username,
  pcName: "WEB"
});

    await transaction.commit();

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