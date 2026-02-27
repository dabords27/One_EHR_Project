const { sql } = require('../../config/db');

// ================= GET NOTES =================
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
                pn.CreatedAt,
                pn.LastModifiedAt,
                pn.IsExcludedFromPrint,
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
                u.fk_usr_type_code
            FROM dbo.ProgressNotes pn
            JOIN dbo.users u ON pn.AuthorID = u.auto_id
            WHERE pn.RegistryNo = @registryNo
              AND pn.IsDeleted = 0
            ORDER BY pn.CreatedAt ASC
        `);

    return result.recordset;
};

// ================= CREATE NOTE =================
exports.createNote = async (pool, data) => {
    const { registryNo, mrn, content, authorId, status } = data;

    console.log("Author ID:", authorId);

    const userResult = await pool.request()
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

    await pool.request()
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
            VALUES
            (@registryNo, @mrn, @content, @authorId, @role, @status,
             0, 0, GETDATE(), GETDATE())
        `);

    return { message: 'Note created successfully.' };
};

// ================= UPDATE DRAFT =================
exports.updateDraft = async (pool, noteId, data) => {
    const { content, authorId } = data;

    const noteResult = await pool.request()
        .input('noteId', sql.Int, noteId)
        .query(`SELECT AuthorID, Status FROM dbo.ProgressNotes WHERE NoteID = @noteId`);

    if (noteResult.recordset.length === 0)
        throw new Error('Note not found.');

    const note = noteResult.recordset[0];

    if (note.Status === 'FINALIZED')
        throw new Error('Finalized notes cannot be edited.');

    if (Number(note.AuthorID) !== Number(authorId))
        throw new Error('Only the creator can edit this draft.');

    await pool.request()
        .input('noteId', sql.Int, noteId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .query(`
            UPDATE dbo.ProgressNotes
            SET Content = @content,
                LastModifiedAt = GETDATE()
            WHERE NoteID = @noteId
        `);

    return { message: 'Draft updated successfully.' };
};

// ================= FINALIZE =================
exports.finalizeNote = async (pool, noteId, data) => {
    const { authorId } = data;

    const noteResult = await pool.request()
        .input('noteId', sql.Int, noteId)
        .query(`SELECT AuthorID FROM dbo.ProgressNotes WHERE NoteID = @noteId`);

    if (noteResult.recordset.length === 0)
        throw new Error('Note not found.');

    if (noteResult.recordset[0].AuthorID !== authorId)
        throw new Error('Only the creator can finalize this note.');

    await pool.request()
        .input('noteId', sql.Int, noteId)
        .query(`
            UPDATE dbo.ProgressNotes
            SET Status = 'FINALIZED',
                LastModifiedAt = GETDATE()
            WHERE NoteID = @noteId
        `);

    return { message: 'Note finalized successfully.' };
};

// ================= EXCLUDE =================
exports.excludeFromPrint = async (pool, noteId) => {

    await pool.request()
        .input('noteId', sql.Int, noteId)
        .query(`
            UPDATE dbo.ProgressNotes
            SET IsExcludedFromPrint = 1,
                LastModifiedAt = GETUTCDATE()
            WHERE NoteID = @noteId
        `);

    return { message: 'Note excluded from print.' };
};