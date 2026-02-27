const fieldService = require("./field.service");

exports.createField = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const templateId = req.params.id;

    const result = await fieldService.createField(
      pool,
      templateId,
      req.body
    );

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating field",
      error: err.message
    });
  }
};