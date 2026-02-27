const sql = require('mssql');
const dbConfig = require('../../config/db');

/* ================= GET ================= */
exports.getTemplates = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .query(`
        SELECT * 
        FROM dbo.NoteTemplates 
        WHERE IsActive = 1 
        ORDER BY Name
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
    const { name, content, category } = req.body;
const currentUser = req.user;
const bodyUser = req.body.createdBy;

let createdBy = "SYSTEM";

// 1️⃣ If frontend sends verified username, use it
if (bodyUser) {
  createdBy = bodyUser;
}
// 2️⃣ Else fallback to token user
else if (currentUser?.id) {
  const userLookup = await pool.request()
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

    // duplicate check
    const duplicateCheck = await pool.request()
      .input('Name', sql.NVarChar, name)
      .query(`
        SELECT Id 
        FROM dbo.NoteTemplates 
        WHERE UPPER(Name) = UPPER(@Name)
        AND IsActive = 1
      `);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(400).json({
        message: 'Template name already exists.'
      });
    }

    await pool.request()
      .input('Name', sql.NVarChar, name)
      .input('Content', sql.NVarChar, content)
      .input('Category', sql.NVarChar, category)
      .input('CreatedBy', sql.NVarChar, createdBy)
      .query(`
        INSERT INTO dbo.NoteTemplates 
        (Id, Name, Content, Category, IsActive, CreatedBy, CreatedDate)
        VALUES (NEWID(), @Name, @Content, @Category, 1, @CreatedBy, GETDATE())
      `);

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

    const pool = await sql.connect(dbConfig); // ✅ CONNECT FIRST

    let updatedBy = "SYSTEM";

    // 1️⃣ If modal user sent from frontend
    if (bodyUser) {
      updatedBy = bodyUser;
    }
    // 2️⃣ Fallback to token user
    else if (currentUser?.id) {
      const userLookup = await pool.request()
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

    await pool.request()
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

const bodyUser = req.body.deletedBy;
const currentUser = req.user;

let updatedBy = "SYSTEM";

if (bodyUser) {
  updatedBy = bodyUser;
}
else if (currentUser?.id) {
  const userLookup = await pool.request()
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

    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('ModifiedBy', sql.NVarChar, updatedBy)
      .query(`
        UPDATE dbo.NoteTemplates
        SET IsActive = 0,
            ModifiedBy = @ModifiedBy,
            ModifiedDate = GETDATE()
        WHERE Id = @Id
      `);

    res.json({ message: 'Template deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete template' });
  }
};