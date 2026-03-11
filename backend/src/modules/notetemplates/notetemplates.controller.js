const sql = require('mssql');
const dbConfig = require('../../config/db');

/* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   NORMALIZE VALUES
===================================================== */
const normalize = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

/* =====================================================
   FIELD LABELS
===================================================== */
const FIELD_LABELS = {
  Name: "Template Name",
  Content: "Template Content",
  Category: "Template Category"
};

/* =====================================================
   AUDIT LOGGER
===================================================== */
const logAudit = async (transaction, data) => {

  await transaction.request()
    .input("table_name", sql.VarChar(100), data.table)
    .input("record_id", sql.VarChar(100), data.recordId)
    .input("transaction", sql.VarChar(200), data.transaction)
    .input("transaction_type", sql.VarChar(20), data.type)
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "NOTE_TEMPLATES")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");

};


/* ================= GET ================= */
exports.getTemplates = async (req, res) => {
  try {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .query(`
        SELECT * 
        FROM dbo.NoteTemplates 
        WHERE IsActive = 1 
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};


/* ================= CREATE ================= */
exports.createTemplate = async (req, res) => {

  try {

    const pool = await sql.connect(dbConfig);
    const transaction = pool.transaction();
    await transaction.begin();

    const { name, content, category } = req.body;
    const currentUser = req.user;
    const bodyUser = req.body.createdBy;

    let createdBy = "SYSTEM";

    if (bodyUser) {
      createdBy = bodyUser;
    }
    else if (currentUser?.id) {

      const userLookup = await transaction.request()
        .input("id", sql.Int, currentUser.id)
        .query(`
          SELECT usr_username 
          FROM dbo.users 
          WHERE auto_id = @id
        `);

      if (userLookup.recordset.length) {
        createdBy = userLookup.recordset[0].usr_username;
      }

    }

    /* DUPLICATE CHECK */
    const duplicateCheck = await transaction.request()
      .input('Name', sql.NVarChar, name)
      .query(`
        SELECT Id 
        FROM dbo.NoteTemplates 
        WHERE UPPER(Name) = UPPER(@Name)
        AND IsActive = 1
      `);

    if (duplicateCheck.recordset.length > 0) {

      await transaction.rollback();

      return res.status(400).json({
        message: 'Template name already exists.'
      });

    }

    const newId = require("crypto").randomUUID();

    await transaction.request()
      .input('Id', sql.UniqueIdentifier, newId)
      .input('Name', sql.NVarChar, name)
      .input('Content', sql.NVarChar, content)
      .input('Category', sql.NVarChar, category)
      .input('CreatedBy', sql.NVarChar, createdBy)
      .query(`
        INSERT INTO dbo.NoteTemplates 
        (Id, Name, Content, Category, IsActive, CreatedBy, CreatedDate)
        VALUES (@Id, @Name, @Content, @Category, 1, @CreatedBy, GETDATE())
      `);

    /* AUDIT CREATE */
    await logAudit(transaction,{
      table:"NoteTemplates",
      recordId:newId,
      transaction:"Create Template",
      type:"ADD",
      newValue:name,
      username:createdBy
    });

    await transaction.commit();

    res.json({ message: 'Template created successfully' });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Failed to create template' });

  }

};


/* ================= UPDATE ================= */
exports.updateTemplate = async (req, res) => {

  try {

    const { id } = req.params;
    const { name, content, category, updatedBy: bodyUser } = req.body;
    const currentUser = req.user;

    const pool = await sql.connect(dbConfig);
    const transaction = pool.transaction();
    await transaction.begin();

    let updatedBy = "SYSTEM";

    if (bodyUser) {
      updatedBy = bodyUser;
    }
    else if (currentUser?.id) {

      const userLookup = await transaction.request()
        .input("id", sql.Int, currentUser.id)
        .query(`
          SELECT usr_username 
          FROM dbo.users 
          WHERE auto_id = @id
        `);

      if (userLookup.recordset.length) {
        updatedBy = userLookup.recordset[0].usr_username;
      }

    }

    /* GET OLD DATA */
    const oldResult = await transaction.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT Name, Content, Category
        FROM dbo.NoteTemplates
        WHERE Id = @Id
      `);

    const oldData = oldResult.recordset[0];

    /* FIELD CHANGE AUDIT */
    for (const field of Object.keys(FIELD_LABELS)) {

      const oldVal = normalize(oldData[field]);

      const newVal = normalize(
        field === "Name" ? name :
        field === "Content" ? content :
        category
      );

      if (oldVal === newVal) continue;

      await logAudit(transaction,{
        table:"NoteTemplates",
        recordId:id,
        transaction:`Update ${FIELD_LABELS[field]}`,
        type:"UPDATE",
        oldValue:oldVal,
        newValue:newVal,
        username:updatedBy
      });

    }

    await transaction.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('Name', sql.NVarChar, name)
      .input('Content', sql.NVarChar, content)
      .input('Category', sql.NVarChar, category)
      .input('ModifiedBy', sql.NVarChar, updatedBy)
      .query(`
        UPDATE dbo.NoteTemplates
        SET Name = @Name,
            Content = @Content,
            Category = @Category,
            ModifiedBy = @ModifiedBy,
            ModifiedDate = GETDATE()
        WHERE Id = @Id
      `);

    await transaction.commit();

    res.json({ message: 'Template updated successfully' });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Failed to update template' });

  }

};


/* ================= DELETE (SOFT) ================= */
exports.deleteTemplate = async (req, res) => {

  try {

    const { id } = req.params;

    const pool = await sql.connect(dbConfig);
    const transaction = pool.transaction();
    await transaction.begin();

    const bodyUser = req.body.deletedBy;
    const currentUser = req.user;

    let updatedBy = "SYSTEM";

    if (bodyUser) {
      updatedBy = bodyUser;
    }
    else if (currentUser?.id) {

      const userLookup = await transaction.request()
        .input("id", sql.Int, currentUser.id)
        .query(`
          SELECT usr_username 
          FROM dbo.users 
          WHERE auto_id = @id
        `);

      if (userLookup.recordset.length) {
        updatedBy = userLookup.recordset[0].usr_username;
      }

    }

    await transaction.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('ModifiedBy', sql.NVarChar, updatedBy)
      .query(`
        UPDATE dbo.NoteTemplates
        SET IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedDate = GETDATE()
        WHERE Id = @Id
      `);

    /* AUDIT DELETE */
    await logAudit(transaction,{
      table:"NoteTemplates",
      recordId:id,
      transaction:"Delete Template",
      type:"DELETE",
      oldValue:"ACTIVE",
      newValue:"INACTIVE",
      username:updatedBy
    });

    await transaction.commit();

    res.json({ message: 'Template deleted successfully' });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Failed to delete template' });

  }

};