const customService = require("./custom-forms.service");

exports.getRepository = async (req, res) => {
  try {

    const records = await customService.getRepositoryRecords();
    res.json(records);

  } catch (err) {

    console.error("GET REPOSITORY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch repository records" });

  }
};


exports.getPatientForm = async (req, res) => {
  try {

    const record = await customService.getPatientFormById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    let template = {};
    let filledData = {};

    try {
      template = JSON.parse(record.template_snapshot || "{}");
    } catch {
      console.warn("Invalid template_snapshot JSON");
    }

    try {
      filledData = JSON.parse(record.filled_data || "{}");
    } catch {
      console.warn("Invalid filled_data JSON");
    }

res.json({
  template,
  patient: record,
  filled_data: filledData
});

  } catch (err) {

    console.error("GET PATIENT FORM ERROR:", err);
    res.status(500).json({ error: "Server error retrieving patient form" });

  }
};

exports.updatePatientForm = async (req, res) => {

  try {

    const formId = req.params.id;

    const updatedId = await customService.updatePatientForm(
      formId,
      req.body,
      req.user
    );

    res.json({
      message: "Patient form updated successfully",
      id: updatedId
    });

  } catch (err) {

    console.error("UPDATE PATIENT FORM ERROR:", err);

    res.status(500).json({
      error: "Failed to update patient form"
    });

  }

};