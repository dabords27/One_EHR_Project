const { sql, config } = require('../../config/db');


exports.getFacility = async () => {

  const pool = await sql.connect(config);

  const result = await pool.request().query(`
      SELECT TOP 1 *
      FROM FacilityInformation
      ORDER BY FacilityId DESC
  `);

  return result.recordset[0] || null;
};
exports.saveFacility = async (data, username) => {

  const pool = await sql.connect(config);

  const existing = await pool.request().query(`
      SELECT TOP 1 * FROM FacilityInformation
      ORDER BY FacilityId DESC
  `);

    if (existing.recordset.length === 0) {

        // INSERT
        await pool.request()
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

        return { message: "Facility Information Created" };

    } else {

        // UPDATE
        await pool.request()
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

        return { message: "Facility Information Updated" };
    }
};