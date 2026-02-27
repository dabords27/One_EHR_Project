const departmentService = require("./department.service");

/* ========= GET ALL ========= */
exports.getDepartments = async (req, res) => {
  try {

    const data = await departmentService.getDepartments(
      req.app.locals.pool
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ========= CREATE ========= */
exports.createDepartment = async (req, res) => {
  try {

const currentUser = req.user;

await departmentService.createDepartment(
  req.app.locals.pool,
  req.body,
  currentUser
);

    res.status(201).json({ message: "Department created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ========= UPDATE ========= */
exports.updateDepartment = async (req, res) => {
  try {

 const currentUser = req.user;

await departmentService.updateDepartment(
  req.app.locals.pool,
  req.params.id,
  req.body,
  currentUser
);

    res.json({ message: "Department updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};