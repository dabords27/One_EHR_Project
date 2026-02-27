const express = require("express");
const router = express.Router();
const upload = require("../../../middleware/upload.middleware");
const userController = require("./user.controller");
const { verifyToken } = require("../../../middleware/auth.middleware");

// CREATE USER
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  userController.createUser
);

// UPDATE USER
router.put(
  "/:id",
  verifyToken,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  userController.updateUser
);

// GET USERS
router.get("/", verifyToken, userController.getUsers);

// GET SINGLE USER
router.get("/:id", verifyToken, userController.getUserById);

// UPDATE STATUS
router.patch("/:id/status", verifyToken, userController.updateUserStatus);

module.exports = router;