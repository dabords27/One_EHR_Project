const { sql } = require('../../config/db');

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
    .input("record_id", sql.VarChar(100), safeString(data.recordId))
    .input("transaction", sql.VarChar(200), data.transaction)
    .input("transaction_type", sql.VarChar(20), data.type)
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "PROGRESS_NOTES")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");
};

/* =====================================================
   GET NOTES
===================================================== */
exports.getNotesByRegistry = async (pool, registryNo) => {

    const result = await pool.request()
        .input('registryNo', sql.Int, registryNo)
        .query(`
  SELECT 
    pn.NoteID,
    pn.RegistryNo,
    pn.Content,
    pn.Status,
    pn.AuthorID,
    pn.FinalizedBy,
    pn.FinalizedAt,
    pn.CreatedAt,
    pn.LastModifiedAt,
    pn.IsExcludedFromPrint,

    -- Author Info
    u.auto_id,
    CASE 
        WHEN u.usr_custom_name IS NOT NULL 
             AND LTRIM(RTRIM(u.usr_custom_name)) <> ''
            THEN u.usr_custom_name
        ELSE CONCAT(
            u.usr_last_name, ', ',
            u.usr_first_name, ' ',
            ISNULL(u.usr_middle_name, ''), ' ',
            ISNULL(u.usr_extension, '')
        )
    END AS DisplayName,
    u.usr_photo_path,
    u.fk_usr_type_code,

-- Finalizer Info
fu.auto_id AS FinalizerID,
fu.fk_usr_type_code AS FinalizedByRole,
CASE 
    WHEN fu.usr_custom_name IS NOT NULL 
         AND LTRIM(RTRIM(fu.usr_custom_name)) <> ''
        THEN fu.usr_custom_name
    ELSE CONCAT(
        fu.usr_last_name, ', ',
        fu.usr_first_name, ' ',
        ISNULL(fu.usr_middle_name, ''), ' ',
        ISNULL(fu.usr_extension, '')
    )
END AS FinalizedByName

FROM dbo.ProgressNotes pn
JOIN dbo.users u ON pn.AuthorID = u.auto_id
LEFT JOIN dbo.users fu ON pn.FinalizedBy = fu.auto_id
WHERE pn.RegistryNo = @registryNo
  AND pn.IsDeleted = 0
ORDER BY pn.CreatedAt ASC`);

    return result.recordset;
};


/* =====================================================
   CREATE NOTE
===================================================== */
exports.createNote = async (pool, data) => {

    const { registryNo, mrn, content, authorId, status, username, pc_name } = data;

    const transaction = pool.transaction();

    try {
		
	

        await transaction.begin();
			const patientResult = await transaction.request()
.input("registryNo", sql.Int, registryNo)
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
const caseId = patient.RegistryTrackingNo || "";

const fullName =
`${patient.Lastname || ""}, ${patient.Firstname || ""} ${patient.Middlename || ""}`.trim();

        console.log("Author ID:", authorId);

        const userResult = await transaction.request()
            .input('authorId', sql.Int, authorId)
            .query(`SELECT fk_usr_type_code FROM dbo.users WHERE auto_id = @authorId`);

        if (userResult.recordset.length === 0)
            throw new Error('User not found.');

        const role = userResult.recordset[0].fk_usr_type_code;

        console.log("Role from DB:", role);

        const normalizedRole = role.toUpperCase().trim();

        if (!['DOCTOR', 'NURSE', 'ADMIN'].includes(normalizedRole)) {
            throw new Error('Only Doctor or Nurse can create progress notes.');
        }

        const insertResult = await transaction.request()
            .input('registryNo', sql.Int, registryNo)
            .input('mrn', sql.VarChar, mrn)
            .input('content', sql.NVarChar(sql.MAX), content)
            .input('authorId', sql.Int, authorId)
            .input('role', sql.VarChar, normalizedRole)
            .input('status', sql.VarChar, status)
            .query(`
                INSERT INTO dbo.ProgressNotes
                (RegistryNo, MRN, Content, AuthorID, AuthorRole, Status,
                 IsDeleted, IsExcludedFromPrint, CreatedAt, LastModifiedAt)
                OUTPUT INSERTED.NoteID
                VALUES
                (@registryNo, @mrn, @content, @authorId, @role, @status,
                 0, 0, GETDATE(), GETDATE())
            `);

        const noteId = insertResult.recordset[0].NoteID;

        await logAudit(transaction,{
            table:"ProgressNotes",
            recordId:noteId,
            transaction:`Create Progress Note | MRN:${MRN} | ${fullName} | Case:${caseId}`,
            type:"ADD",
            newValue:content,
            username:username,
            pcName:pc_name
        });

        await transaction.commit();

        return { message: 'Note created successfully.' };

    } catch (err) {

        await transaction.rollback();
        throw err;

    }

};


/* =====================================================
   UPDATE DRAFT
===================================================== */
exports.updateDraft = async (pool, noteId, data) => {

    const { content, authorId, username, pc_name } = data;

    const transaction = pool.transaction();

    try {
		


        await transaction.begin();   // ✅ START TRANSACTION FIRST
		
		/* =========================
   GET PATIENT INFO FOR AUDIT
========================= */

const patientResult = await transaction.request()
.input("noteId", sql.Int, noteId)
.query(`
SELECT
    p.RegistryTrackingNo,
    p.MRN,
    p.Firstname,
    p.Middlename,
    p.Lastname
FROM dbo.ProgressNotes pn
JOIN dbo.PatientRegistry_Local p
    ON pn.RegistryNo = p.RegistryTrackingNo
WHERE pn.NoteID = @noteId
`);

const patient = patientResult.recordset[0] || {};

const MRN = patient.MRN || "";
const caseId = patient.RegistryTrackingNo || "";

const fullName =
`${patient.Lastname || ""}, ${patient.Firstname || ""} ${patient.Middlename || ""}`.trim();

const noteResult = await transaction.request()
    .input('noteId', sql.Int, noteId)
    .query(`
        SELECT 
            pn.AuthorID,
            pn.Status,
            pn.Content,
            u.fk_usr_type_code
        FROM dbo.ProgressNotes pn
        JOIN dbo.users u 
            ON u.auto_id = pn.AuthorID
        WHERE pn.NoteID = @noteId
    `);

if (!noteResult.recordset.length)
    throw new Error('Note not found.');

const note = noteResult.recordset[0];
const userRole = (note.fk_usr_type_code || '').toUpperCase();
const isAdmin = userRole === 'ADMIN';
const isOwner = Number(note.AuthorID) === Number(authorId);

if (!isAdmin) {

    if (note.Status === 'FINALIZED') {
        throw new Error('Finalized notes cannot be edited.');
    }

    if (note.Status === 'DRAFT' && !isOwner) {
        throw new Error('Only the creator can edit this draft.');
    }
}

await transaction.request()
    .input('noteId', sql.Int, noteId)
    .input('content', sql.NVarChar(sql.MAX), content)
    .query(`
        UPDATE dbo.ProgressNotes
        SET Content = @content,
            LastModifiedAt = GETDATE()
        WHERE NoteID = @noteId
    `);

await logAudit(transaction,{
    table:"ProgressNotes",
    recordId:noteId,
    transaction:`Update Progress Note | MRN:${MRN} | ${fullName} | Case:${caseId}`,
    type:"UPDATE",
    oldValue:note.Content,
    newValue:content,
    username:username,
    pcName:pc_name
});

await transaction.commit();

return { message: 'Draft updated successfully.' };

    } catch (err) {

        await transaction.rollback();
        throw err;

    }

};


/* =====================================================
   FINALIZE
===================================================== */
exports.finalizeNote = async (pool, noteId, data) => {

    const { authorId, username, pc_name } = data;

    const transaction = pool.transaction();

    try {
		


        await transaction.begin();
		/* =========================
   GET PATIENT INFO FOR AUDIT
========================= */

const patientResult = await transaction.request()
.input("noteId", sql.Int, noteId)
.query(`
SELECT
    p.RegistryTrackingNo,
    p.MRN,
    p.Firstname,
    p.Middlename,
    p.Lastname
FROM dbo.ProgressNotes pn
JOIN dbo.PatientRegistry_Local p
    ON pn.RegistryNo = p.RegistryTrackingNo
WHERE pn.NoteID = @noteId
`);

const patient = patientResult.recordset[0] || {};

const MRN = patient.MRN || "";
const caseId = patient.RegistryTrackingNo || "";

const fullName =
`${patient.Lastname || ""}, ${patient.Firstname || ""} ${patient.Middlename || ""}`.trim();

    const noteResult = await transaction.request()
        .input('noteId', sql.Int, noteId)
        .input('authorId', sql.Int, authorId)
        .query(`
            SELECT 
                pn.AuthorID,
                pn.Status,
                u.fk_usr_type_code
            FROM dbo.ProgressNotes pn
            JOIN dbo.users u 
                ON u.auto_id = @authorId
            WHERE pn.NoteID = @noteId
        `);

    if (!noteResult.recordset.length)
        throw new Error('Note not found.');

    const note = noteResult.recordset[0];
    const userRole = (note.fk_usr_type_code || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const isOwner = Number(note.AuthorID) === Number(authorId);

    if (note.Status === 'FINALIZED') {
        throw new Error('Note is already finalized.');
    }

    if (!isOwner && !isAdmin) {
        throw new Error('You are not authorized to finalize this note.');
    }

    await transaction.request()
    .input('noteId', sql.Int, noteId)
    .input('authorId', sql.Int, authorId)
    .query(`
        UPDATE dbo.ProgressNotes
        SET Status = 'FINALIZED',
            FinalizedBy = @authorId,
            FinalizedAt = GETDATE(),
            LastModifiedAt = GETDATE()
        WHERE NoteID = @noteId
    `);

    await logAudit(transaction,{
        table:"ProgressNotes",
        recordId:noteId,
       transaction:`Finalize Progress Note | MRN:${MRN} | ${fullName} | Case:${caseId}`,
        type:"UPDATE",
        oldValue:"DRAFT",
        newValue:"FINALIZED",
        username:username,
        pcName:pc_name
    });

    await transaction.commit();

    return { message: 'Note finalized successfully.' };

    } catch (err) {

        await transaction.rollback();
        throw err;

    }

};


/* =====================================================
   EXCLUDE
===================================================== */
exports.excludeFromPrint = async (pool, noteId, username, pc_name) => {

    const transaction = pool.transaction();

    try {



        await transaction.begin();
		/* =========================
   GET PATIENT INFO FOR AUDIT
========================= */

const patientResult = await transaction.request()
.input("noteId", sql.Int, noteId)
.query(`
SELECT
    p.RegistryTrackingNo,
    p.MRN,
    p.Firstname,
    p.Middlename,
    p.Lastname
FROM dbo.ProgressNotes pn
JOIN dbo.PatientRegistry_Local p
    ON pn.RegistryNo = p.RegistryTrackingNo
WHERE pn.NoteID = @noteId
`);

const patient = patientResult.recordset[0] || {};

const MRN = patient.MRN || "";
const caseId = patient.RegistryTrackingNo || "";

const fullName =
`${patient.Lastname || ""}, ${patient.Firstname || ""} ${patient.Middlename || ""}`.trim();

        await transaction.request()
            .input('noteId', sql.Int, noteId)
            .query(`
                UPDATE dbo.ProgressNotes
                SET IsExcludedFromPrint = 1,
                    LastModifiedAt = GETUTCDATE()
                WHERE NoteID = @noteId
            `);

        await logAudit(transaction,{
            table:"ProgressNotes",
            recordId:noteId,
            transaction:`Exclude Progress Note From Print | MRN:${MRN} | ${fullName} | Case:${caseId}`,
            type:"UPDATE",
            oldValue:"0",
            newValue:"1",
            username:username,
            pcName:pc_name
        });

        await transaction.commit();

        return { message: 'Note excluded from print.' };

    } catch (err) {

        await transaction.rollback();
        throw err;

    }

};