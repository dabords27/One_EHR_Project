const userService = require('./user.service');

/* ========= LIST USERS ========= */
const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers(req.app.locals.pool);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ========= CREATE USER ========= */
const createUser = async (req, res) => {
  try {
    const result = await userService.createUser(
      req.app.locals.pool,
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ========= GET SINGLE USER ========= */
const getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(
      req.app.locals.pool,
      req.params.id
    );
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: "User not found" });
  }
};

/* ========= UPDATE USER ========= */
const updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(
      req.app.locals.pool,
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ========= UPDATE STATUS ========= */
const updateUserStatus = async (req, res) => {
  try {
    const result = await userService.updateUserStatus(
      req.app.locals.pool,
      req.params.id,
      req.body.status
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ========= EXPORTS (PUT THIS AT THE BOTTOM) ========= */
module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus
};
