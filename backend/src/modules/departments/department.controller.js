const departmentService = require('./department.service');

exports.getDepartments = async (req, res) => {
  try {
    const data = await departmentService.getDepartments(req.app.locals.pool);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    await departmentService.createDepartment(
      req.app.locals.pool,
      req.body
    );
    res.json({ message: "Department created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateDepartment = async (req, res) => {
  try {
    await departmentService.updateDepartment(
      req.app.locals.pool,
      req.params.id,
      req.body
    );
    res.json({ message: "Department updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
