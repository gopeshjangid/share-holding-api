const express = require("express");
const validate = require("express-validation");
const paramValidation = require("../../../config/param-validation");
const studentController = require("./student.controller");
const jwtToken = require("../../middleware/jwt");
const jwttoken = new jwtToken();

const router = express.Router(); // eslint-disable-line new-cap
router
	.route("/login")
	.post(
		validate.validate(paramValidation.studentLogin),
		studentController.userLogin
	);

router.route("/signUp").post(studentController.create);

router
	.route("/sendPasswordCode")
	/** GET /api/users - Get list of users */
	.post(studentController.sendPassCode);

router
	.route("/verifyPassCode")
	/** GET /api/users - Get list of users */
	.post(studentController.verifyPassCode);

router
	.route("/uploadImage")
	/** GET /api/users - Get list of users */
	.post(studentController.uploadImage);

//.post(jwttoken.verifyToken, studentController.sendPassCode);
router
	.route("/me")
	/** GET /api/users - Get list of users */
	.put(jwttoken.verifyToken, studentController.update);

router
	.route("/profile")
	/** GET /api/users/:userId - Get user */
	.get(studentController.get);

router.route("/resetPassword").post(studentController.resetPassword);

/** Load user when API with userId route parameter is hit */
router.param("userId", studentController.load);

router
	.route("/getStudentBookings")
	/** GET /api/users - Get list of users */
	.get(studentController.getStudentBookings);

router
	.route("/getClubMemberships")
	/** GET /api/users - Get list of users */
	.get(studentController.getClubMemberships);

// /api/users/verifyOtp
module.exports = router;
