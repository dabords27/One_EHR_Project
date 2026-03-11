const { sql, config } = require('../../config/db');


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
   FIELD LABELS FOR AUDIT
===================================================== */
const FIELD_LABELS = {
  FacilityName: "Facility Name",
  FacilityCode: "Facility Code",
  PhilhealthAccreditationNumber: "PhilHealth Accreditation Number",
  DOHNumber: "DOH License Number",
  Website: "Website",
  Email: "Email",
  Owner: "Owner",
  BedCapacity: "Bed Capacity",
  ImplementingBedCapacity: "Implementing Bed Capacity",
  Country: "Country",
  Province: "Province",
  City: "City",
  Barangay: "Barangay",
  StreetAddress: "Street Address",
  ZipCode: "Zip Code",
  LogoPath: "Facility Logo"
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
    .input("module", sql.VarChar(100), "FACILITY_INFORMATION")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");

};


/* =====================================================
   GET FACILITY
===================================================== */
exports.getFacility = async () => {

  const pool = await sql.connect(config);

  const result = await pool.request().query(`
      SELECT TOP 1 *
      FROM FacilityInformation
      ORDER BY FacilityId DESC
  `);

  return result.recordset[0] || null;
};



/* =====================================================
   SAVE FACILITY
===================================================== */
exports.saveFacility = async (data, username) => {

  const pool = await sql.connect(config);

const transaction = pool.transaction();
  await transaction.begin();

  try {

    const existing = await transaction.request().query(`
        SELECT TOP 1 * FROM FacilityInformation
        ORDER BY FacilityId DESC
    `);


    /* =====================================================
       INSERT
    ===================================================== */
    if (existing.recordset.length === 0) {

        await transaction.request()
            .input('FacilityName', sql.NVarChar, data.FacilityName)
            .input('FacilityCode', sql.NVarChar, data.FacilityCode)
            .input('PhilhealthAccreditationNumber', sql.NVarChar, data.PhilhealthAccreditationNumber)
            .input('DOHNumber', sql.NVarChar, data.DOHNumber)
            .input('Website', sql.NVarChar, data.Website)
            .input('Email', sql.NVarChar, data.Email)
            .input('Owner', sql.NVarChar, data.Owner)
            .input('BedCapacity', sql.Int, data.BedCapacity ? parseInt(data.BedCapacity) : null)
            .input('ImplementingBedCapacity', sql.Int, data.ImplementingBedCapacity ? parseInt(data.ImplementingBedCapacity) : null)
            .input('Country', sql.NVarChar, data.Country)
            .input('Province', sql.NVarChar, data.Province)
            .input('City', sql.NVarChar, data.City)
            .input('Barangay', sql.NVarChar, data.Barangay)
            .input('StreetAddress', sql.NVarChar, data.StreetAddress)
            .input('ZipCode', sql.NVarChar, data.ZipCode)
            .input('LogoPath', sql.NVarChar, data.LogoPath)
            .input('CreatedBy', sql.NVarChar, username)
            .query(`
                INSERT INTO FacilityInformation (
                    FacilityName,
                    FacilityCode,
                    PhilhealthAccreditationNumber,
                    DOHNumber,
                    Website,
                    Email,
                    Owner,
                    BedCapacity,
                    ImplementingBedCapacity,
                    Country,
                    Province,
                    City,
                    Barangay,
                    StreetAddress,
                    ZipCode,
                    LogoPath,
                    CreatedBy
                )
                VALUES (
                    @FacilityName,
                    @FacilityCode,
                    @PhilhealthAccreditationNumber,
                    @DOHNumber,
                    @Website,
                    @Email,
                    @Owner,
                    @BedCapacity,
                    @ImplementingBedCapacity,
                    @Country,
                    @Province,
                    @City,
                    @Barangay,
                    @StreetAddress,
                    @ZipCode,
                    @LogoPath,
                    @CreatedBy
                )
            `);

        await transaction.commit();

        return { message: "Facility Information Created" };

    }


    /* =====================================================
       UPDATE
    ===================================================== */

    const oldData = existing.recordset[0];
    const recordId = oldData.FacilityId;


/* =====================================================
   FIELD CHANGE AUDIT
===================================================== */
for (const field of Object.keys(FIELD_LABELS)) {

  // OLD VALUE FROM DATABASE
  const oldVal = normalize(oldData[field]);

  // DETERMINE NEW VALUE
  let newValue;

  if (field === "BedCapacity" || field === "ImplementingBedCapacity") {

    newValue = data[field] ? parseInt(data[field]) : null;

  } else {

    newValue = (field in data) ? data[field] : oldData[field];

  }

  const newVal = normalize(newValue);

  // SKIP IF NO CHANGE
  if (oldVal === newVal) continue;

  try {

    await logAudit(transaction, {
      table: "FacilityInformation",
      recordId: String(recordId),
      transaction: `Update ${FIELD_LABELS[field]}`,
      type: "UPDATE",
      oldValue: oldVal,
      newValue: newVal,
      username: username
    });

  } catch (auditErr) {

    console.error("AUDIT ERROR:", auditErr);

  }

}

    await transaction.request()
        .input('FacilityName', sql.NVarChar, data.FacilityName)
        .input('FacilityCode', sql.NVarChar, data.FacilityCode)
        .input('PhilhealthAccreditationNumber', sql.NVarChar, data.PhilhealthAccreditationNumber)
        .input('DOHNumber', sql.NVarChar, data.DOHNumber)
        .input('Website', sql.NVarChar, data.Website)
        .input('Email', sql.NVarChar, data.Email)
        .input('Owner', sql.NVarChar, data.Owner)
        .input('BedCapacity', sql.Int, data.BedCapacity ? parseInt(data.BedCapacity) : null)
        .input('ImplementingBedCapacity', sql.Int, data.ImplementingBedCapacity ? parseInt(data.ImplementingBedCapacity) : null)
        .input('Country', sql.NVarChar, data.Country)
        .input('Province', sql.NVarChar, data.Province)
        .input('City', sql.NVarChar, data.City)
        .input('Barangay', sql.NVarChar, data.Barangay)
        .input('StreetAddress', sql.NVarChar, data.StreetAddress)
        .input('ZipCode', sql.NVarChar, data.ZipCode)
        .input('LogoPath', sql.NVarChar, data.LogoPath)
        .input('LastUpdatedBy', sql.NVarChar, username)
        .query(`
            UPDATE FacilityInformation
            SET
                FacilityName = @FacilityName,
                FacilityCode = @FacilityCode,
                PhilhealthAccreditationNumber = @PhilhealthAccreditationNumber,
                DOHNumber = @DOHNumber,
                Website = @Website,
                Email = @Email,
                Owner = @Owner,
                BedCapacity = @BedCapacity,
                ImplementingBedCapacity = @ImplementingBedCapacity,
                Country = @Country,
                Province = @Province,
                City = @City,
                Barangay = @Barangay,
                StreetAddress = @StreetAddress,
                ZipCode = @ZipCode,
                LogoPath = @LogoPath,
                LastUpdatedBy = @LastUpdatedBy,
                LastUpdatedDateTime = GETDATE()
        `);


    await transaction.commit();

    return { message: "Facility Information Updated" };


  } catch (err) {

    await transaction.rollback();
    throw err;

  }

};