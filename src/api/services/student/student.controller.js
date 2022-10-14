const User = require("./student.model");
const ChatGroup = require("../groupChat/controller");
const Utils = require("../../../helpers/utils");
const utils = new Utils();
const jwtToken = require("../../middleware/jwt");
const { request } = require("../../../app");
const jwttoken = new jwtToken();
var mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ejs = require("ejs");
const path = require("path");
const moment = require("moment");
const OTP = require("../user/otp.model");
const eventController = require("../event/event.controller");

/**
 * Create new user
 * @property {string} req?.body?.name - The name of user.
 * @property {string} req?.body?.email - The email of user.
 * @property {string} req?.body?.username - The username of user.
 * @property {string} req?.body?.password - The password of user.
 * @property {string} req?.body?.societyName - The societyName of user.
 * @returns {User}
 */
async function create(req, res, next) {
	let error = false;
	if (!req.body.firstname) {
		error = "First Name is required";
	} else if (!req.body.lastname) {
		error = "Last Name is required";
	} else if (!req.body.gender) {
		error = "Gender is required";
	} else if (!req.body.email) {
		error = "Email is required";
	} else if (!req.body.studentId) {
		error = "studentId is required";
	} else if (!req.body.year) {
		error = "year is required";
	} else {
		error = false;
	}

	if (error) {
		jsonResult = await utils.getJsonResponse(false, error, null);
		return res.status(500).json(jsonResult);
	}
	const user = new User({
		firstName: req?.body?.firstname,
		lastName: req?.body?.lastname,
		email: req?.body?.email,
		gender: req?.body?.gender,
		password: req?.body?.password,
		studentId: req?.body?.studentId,
		faculty: req?.body?.faculty,
		bio: "",
		media_links: [
			{ type: "fb", link: "" },
			{ type: "instagram", link: "" },
			{ type: "tweeter", link: "" },
			{ type: "linkedin", link: "" },
		],
		profile_pic: "",
		year: req?.body?.year,
		imageData: req?.body?.imagedata,
	});

	let isEmailExists = await User.findOne({ email: req?.body?.email });
	let studentId = await User.findOne({
		studentId: req?.body?.studentId,
	});
	if (isEmailExists != null) {
		jsonResult = await utils.getJsonResponse(
			false,
			"Email already exists",
			null
		);
		res.status(500).json(jsonResult);
	} else if (studentId != null) {
		jsonResult = await utils.getJsonResponse(
			false,
			"Student Id already exists",
			null
		);
		res.status(500).json(jsonResult);
	} else {
		user
			.save()
			.then(async (savedUser) => {
				savedUser.accessToken = await jwttoken.createToken(
					savedUser?._id,
					savedUser?.studentId,
					savedUser?.email
				);

				const htmlToSend = await ejs.renderFile(
					path.join(__dirname, "../../../../signup.ejs"),
					{
						name: savedUser?.firstName,
						email: savedUser?.email,
						username: savedUser?.lastName,
					}
				);
				await utils.sendEmail({
					email: savedUser?.email,
					subject: "Sign up has been completed",
					text: htmlToSend,
				});
				jsonResult = await utils.getJsonResponse(
					true,
					"Sign up has been completed",
					savedUser
				);
				res.status(200).json(jsonResult);
			})
			.catch(async (err) => {
				if (err) {
					if (err.name == "ValidationError") {
						for (field in err.errors) {
							let jsonResult = await utils.getJsonResponse(
								false,
								err.errors[field].message,
								null
							);
							jsonResult = await utils.getJsonResponse(
								true,
								err.errors[field].message,
								user
							);
							res.status(500).send(jsonResult);
						}
					}
				} else {
					jsonResult = await utils.getJsonResponse(
						false,
						"Error in signup",
						null
					);
					res.status(500).json(jsonResult);
				}
			});
	}
}

/**
 * User Login.
 */
async function userLogin(req, res, next) {
	let isUsernameExists = await User.findOne({ email: req?.body?.email });

	let isWrongPassword = await User.findOne({
		email: req?.body?.email,
		password: req?.body?.password,
	});

	if (isUsernameExists == null) {
		let jsonResult = await utils.getJsonResponse(
			false,
			"Email does not exists.",
			null
		);
		res.send(jsonResult);
	} else if (isUsernameExists && isWrongPassword == null) {
		let jsonResult = await utils.getJsonResponse(
			false,
			"Incorrect Password.",
			null
		);
		res.status(500).send(jsonResult);
	} else {
		let condition = {
			email: req?.body?.email,
			password: req?.body?.password,
		};

		User.findOne(condition)
			.then(async (user) => {
				req.user = user; // eslint-disable-line no-param-reassign
				let jsonResult;
				if (user) {
					user.accessToken = await jwttoken.createToken(
						user?._id,
						user?.password,
						user?.email
					);
					jsonResult = await utils.getJsonResponse(
						true,
						"Student logged in successfully.",
						user
					);
				} else {
					jsonResult = await utils.getJsonResponse(
						false,
						"Student not found.",
						null
					);
				}
				res.status(200).send(jsonResult);

				// return next();
			})
			.catch((e) => next(e));
	}
}

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
	User.get(id)
		.then((user) => {
			req.user = user; // eslint-disable-line no-param-reassign
			return next();
		})
		.catch((e) => next(e));
}

/**
 * Get user
 * @returns {User}
 */
async function get(req, res, next) {
	let decodedToken = await jwttoken.decodedToken(req, res);
	let userId = req?.query?.userId ? req?.query?.userId : decodedToken?._id;
	User.get(userId)
		.then(async (user) => {
			let jsonResult;
			if (user) {
				jsonResult = await utils.getJsonResponse(true, "User details.", user);
			} else {
				jsonResult = await utils.getJsonResponse(
					false,
					"User detail not found.",
					null
				);
			}
			return res.json(jsonResult);
		})
		.catch((e) => next(e));
}

/**
 * Create new user
 * @property {string} req?.body?.name - The name of user.
 * @property {string} req?.body?.email - The email of user.
 * @property {string} req?.body?.username - The username of user.
 * @property {string} req?.body?.password - The password of user.
 * @property {string} req?.body?.societyName - The societyName of user.
 * @returns {User}
 */
async function sendPassCode(req, res, next) {
	const email = req?.body?.email;
	const otp = Math.floor(100000 + Math.random() * 900000);
	var expiry = new Date();
	expiry.setMinutes(expiry.getMinutes() + 10);
	expiry = new Date(expiry);

	let set = {
		email: email,
		otp: otp,
		createdAt: new Date(),
		expiryAt: expiry,
	};

	OTP.findOneAndUpdate(
		{ email: email },
		{ $set: set },
		{ upsert: true, new: true }
	)
		.then(async (updatedOTP) => {
			let jsonResult = await utils.getJsonResponse(
				true,
				"Verification code sent.",
				updatedOTP
			);
			const htmlToSend = await ejs.renderFile(
				path.join(__dirname, "../../../../passwordCode.ejs"),
				{
					code: otp,
				}
			);
			await utils.sendEmail({
				email: email,
				subject: `Your Password verification code is ${otp}`,
				text: htmlToSend,
			});
			res.send(jsonResult);
		})
		.catch(async (err) => {
			if (err) {
				const e = err;
				if (err.name == "ValidationError") {
					for (field in err.errors) {
						e = err.errors[field].message;
					}
				}
				let jsonResult = await utils.getJsonResponse(false, e, null);
				res.send(jsonResult);
			}
		});
}

async function verifyPassCode(req, res, next) {
	let email = req?.body?.email;
	let otp = req?.body?.otp;
	let status = 500;
	let OPTExists = await OTP.findOne({ email: email, otp: otp });
	if (OPTExists && moment().isAfter(moment(OPTExists.expiryAt))) {
		status = 500;
		jsonResult = utils.getJsonResponse(false, "OTP has Expired.", null);
	} else if (OPTExists) {
		status = 200;
		jsonResult = utils.getJsonResponse(true, "OTP has Verified.", null);
	} else {
		status = 500;
		jsonResult = utils.getJsonResponse(false, "Incorrect OTP", null);
	}
	res.status(status).send(jsonResult);
}

async function update(req, res, next) {
	try {
		let userId = req?.body?.userId;
		if (userId) {
			isUserIdExists = await User.findOne({ _id: ObjectId(userId) });
			if (isUserIdExists) {
			} else {
				let jsonResult = await utils.getJsonResponse(
					false,
					"User Id Not exists.",
					null
				);
				return res.send(jsonResult);
			}
			condition = { _id: ObjectId(userId) };
			let set = {};
			if (userId) {
				for (let [key, val] of Object.entries(req?.body)) {
					set[key] = val;
				}
			}
			User.findOneAndUpdate(
				{ _id: ObjectId(userId) },
				{ $set: set },
				{ new: true }
			)
				.then(async (savedUser) => {
					let jsonResult = await utils.getJsonResponse(
						true,
						"User updated successfully.",
						savedUser
					);
					res.send(jsonResult);
				})
				.catch(async (err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = await utils.getJsonResponse(
									false,
									err.errors[field].message,
									null
								);
								res.send(jsonResult);
							}
						}
					}
				});
		} else {
			let jsonResult = await utils.getJsonResponse(
				false,
				"Please send userId ",
				{}
			);
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = await utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
	const { limit = 50, skip = 0 } = req?.query;
	User.list({ limit, skip })
		.then(async (users) => {
			let jsonResult;
			if (users) {
				jsonResult = await utils.getJsonResponse(true, "Users list.", users);
			} else {
				jsonResult = await utils.getJsonResponse(
					false,
					"Users list not found.",
					null
				);
			}
			res.send(jsonResult);
		})
		.catch((e) => next(e));
}

const getStudentById = async (userId) => {
	return User.findOne({ _id: ObjectId(userId) })
		.then(async (user) => {
			return user;
		})
		.catch((e) => reject(e));
};

async function resetPassword(req, res) {
	if (!req.body.email) {
		res.status(500).send("Email is required");
	} else if (!req.body.password) {
		res.status(500).send("New Password is required");
	}

	let isEmailExists = await User.findOne({ email: req?.body?.email });

	if (isEmailExists === null) {
		res
			.status(500)
			.send(utils.getJsonResponse(false, "Email does not exists.", null));
	} else {
		const set = {
			password: req?.body?.password,
		};
		User.findOneAndUpdate(
			{ email: req?.body?.email },
			{ $set: set },
			{ new: false }
		)
			.then(async (savedUser) => {
				let jsonResult = await utils.getJsonResponse(
					true,
					"Password updated successfully.",
					savedUser
				);
				res.send(jsonResult);
			})
			.catch(async (e) => {
				let jsonResult = await utils.getJsonResponse(false, e?.message, null);
				res.send(jsonResult);
			});
	}
}

const getStudentBookings = async (req, res, next) => {
	const email = req.query.email;
	try {
		const finalList = await eventController.getStudentBookings(email);
		jsonResult = utils.getJsonResponse(true, "User bookings list.", finalList);
		res.send(jsonResult);
	} catch (e) {
		jsonResult = utils.getJsonResponse(
			false,
			"Error in fetching bookings.",
			null
		);
		res.send(jsonResult);
	}
};

const getClubMemberships = async (req, res, next) => {
	const email = req.query.email;
	try {
		const finalList = await eventController.getStudentClubMemberships(email);
		jsonResult = utils.getJsonResponse(
			true,
			"Club memberships list.",
			finalList.filter((form) => !!form?.membershipFormInfo)
		);
		res.send(jsonResult);
	} catch (e) {
		jsonResult = utils.getJsonResponse(
			false,
			"Error in fetching bookings.",
			null
		);
		res.send(jsonResult);
	}
};

const uploadImage = (req, res, next) => {
	ChatGroup.uploadImage(req, res, next);
};

module.exports = {
	userLogin,
	load,
	get,
	create,
	update,
	list,
	sendPassCode,
	verifyPassCode,
	getStudentById,
	resetPassword,
	getStudentBookings,
	getClubMemberships,
	uploadImage,
};
