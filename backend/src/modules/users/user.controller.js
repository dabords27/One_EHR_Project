const userService = require("./user.service");
const path = require("path");

/* ========= HELPER: HANDLE DUPLICATE SQL ERRORS ========= */
const handleSqlError = (err, res) => {
  if (err.number === 2627 || err.number === 2601) {
    return res.status(400).json({
      message:
        "Duplicate entry detected. Username or Name already exists."
    });
  }

  console.error("User Controller Error:", err);

  return res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
};

/* ========= LIST USERS ========= */
const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers(
      req.app.locals.pool
    );
    res.json(users);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message
    });
  }
};

/* ========= CREATE USER ========= */
const createUser = async (req, res) => {
  try {
    let signaturePath = null;

    // 🔥 Map photo path
    if (req.files?.profileImage?.[0]) {
      updateData.usr_photo_path =
        `/uploads/photos/${req.files.profileImage[0].filename}`;
    }

    const result = await userService.createUser(
      req.app.locals.pool,
      {
        ...req.body,
        usr_signature_path: signaturePath
      }
    );

    res.status(201).json(result);

  } catch (err) {
    return handleSqlError(err, res);
  }
};

/* ========= GET SINGLE USER ========= */
const getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(
      req.app.locals.pool,
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: err.message
    });
  }
};

/* ========= UPDATE USER ========= */
const updateUser = async (req, res) => {
  try {

    console.log("FILES RECEIVED:", req.files);
    console.log("BODY RECEIVED:", req.body);

    let updateData = { ...req.body };

    // 🔥 Map photo path
    if (req.files?.profileImage?.[0]) {
      updateData.usr_photo_path =
        `/uploads/photos/${req.files.profileImage[0].filename}`;
    }

    // 🔥 Map signature path
    if (req.files?.signature?.[0]) {
      updateData.usr_signature_path =
        `/uploads/signatures/${req.files.signature[0].filename}`;
    }

    const result = await userService.updateUser(
      req.app.locals.pool,
      req.params.id,
      updateData   // ✅ SEND UPDATED DATA
    );

    res.json(result);

  } catch (err) {
    return handleSqlError(err, res);
  }
};

/* ========= UPDATE STATUS ========= */
const updateUserStatus = async (req, res) => {
  try {
    const { usr_status_active } = req.body;

    if (typeof usr_status_active !== "boolean") {
      return res.status(400).json({
        message: "usr_status_active must be boolean"
      });
    }

    const result = await userService.updateUserStatus(
      req.app.locals.pool,
      req.params.id,
      usr_status_active
    );

    res.json(result);

  } catch (err) {
    return handleSqlError(err, res);
  }
};

/* ========= EXPORTS ========= */
module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus
};