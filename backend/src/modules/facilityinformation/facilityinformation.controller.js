const service = require('./facilityinformation.service');

exports.getFacility = async (req, res) => {
  console.log("GET FACILITY HIT");
  try {
    const data = await service.getFacility();
    console.log("FACILITY DATA RETURNED:", data);
    res.json(data);
  } catch (err) {
    console.log("FACILITY ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.saveFacility = async (req, res) => {
  try {
    const username = req.body.updatedBy || req.user?.username || "SYSTEM";
    const data = req.body;

    if (req.file) {
      data.LogoPath = `/uploads/facility/${req.file.filename}`;
    }

    const result = await service.saveFacility(data, username);
    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};