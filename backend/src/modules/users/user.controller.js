const userService = require("./user.service");

/* ========= HELPER: HANDLE DUPLICATE SQL ERRORS ========= */
const handleSqlError = (err, res) => {
  if (err.number === 2627 || err.number === 2601) {
    return res.status(400).json({
      message: "Duplicate entry detected. Username or Name already exists."
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
    const users = await userService.getUsers(req.app.locals.pool);
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
console.log("Logged in user:", req.user);
  try {

    const currentUser = req.user; // 🔥 logged-in user from middleware

    let createData = { ...req.body };

    // 📸 Profile Photo
    if (req.files?.profileImage?.[0]) {
      createData.usr_photo_path =
        `/uploads/photos/${req.files.profileImage[0].filename}`;
    }

    // ✍️ Signature
    if (req.files?.signature?.[0]) {
      createData.usr_signature_path =
        `/uploads/signatures/${req.files.signature[0].filename}`;
    }

    // 🧾 Audit fields
    createData.usr_created_by = currentUser?.username || "SYSTEM";
    createData.usr_date_created = new Date();

    const result = await userService.createUser(
      req.app.locals.pool,
      createData,
      currentUser   // 🔥 pass logged-in user to service
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

    const currentUser = req.user;

    let updateData = { ...req.body };

    // 📸 Profile Photo
    if (req.files?.profileImage?.[0]) {
      updateData.usr_photo_path =
        `/uploads/photos/${req.files.profileImage[0].filename}`;
    }

    // ✍️ Signature
    if (req.files?.signature?.[0]) {
      updateData.usr_signature_path =
        `/uploads/signatures/${req.files.signature[0].filename}`;
    }

    // 🧾 Audit fields
    updateData.usr_updated_by =
  req.body.usr_updated_by ||   // from FormData (save)
  req.body.updatedBy ||        // from JSON (toggle or other)
  currentUser?.username ||     // fallback
  "SYSTEM";
    updateData.usr_date_updated = new Date();

    const result = await userService.updateUser(
      req.app.locals.pool,
      req.params.id,
      updateData,
      currentUser
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

 const updatedBy =
  req.body.updatedBy ||
  req.user?.username ||
  "SYSTEM";

const result = await userService.updateUserStatus(
  req.app.locals.pool,
  req.params.id,
  usr_status_active,
  updatedBy,
  req.body.pc_name
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