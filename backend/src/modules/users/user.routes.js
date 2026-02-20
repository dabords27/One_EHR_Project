const express = require("express");
const router = express.Router();
const upload = require("../../../middleware/upload.middleware");
const userController = require("./user.controller");

// CREATE USER
router.post(
  "/",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  userController.createUser
);

// UPDATE USER
router.put(
  "/:id",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  userController.updateUser
);

// GET USERS
router.get("/", userController.getUsers);

// GET SINGLE USER
router.get("/:id", userController.getUserById);

// UPDATE STATUS
router.patch("/:id/status", userController.updateUserStatus);

module.exports = router;