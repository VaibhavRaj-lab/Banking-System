const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
// const authController = require("../controller/authController");
router.post("/login", userController.postLogin);
router.post("/signup", userController.postSignup);
router.post("/reset", userController.postReset);
router.post("/newpassword", userController.postNewPassword);

module.exports = router;
