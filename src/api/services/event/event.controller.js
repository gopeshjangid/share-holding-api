const Event = require("./event.model");
const Booking = require("./booking.model");
const User = require("../company/company.model");
const Utils = require("../../../helpers/utils");
const utils = new Utils();
const JwtToken = require("../../middleware/jwt");
const jwtToken = new JwtToken();
const Busboy = require("busboy");
const AWS = require("../AWS/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const S3 = AWS.S3();
const path = require("path");
const Inventory = require("./inventory.model");
const Membership = require("../event/membership.model");
const MembershipForm = require("../event/membershipForm.model");
const stripeClass = require("../AWS/stripe");
const { resolve } = require("path");
const { reject } = require("bluebird");
const { getEnvironmentData } = require("worker_threads");
const { CodeStarNotifications } = require("aws-sdk");
const stripe = new stripeClass();
const ejs = require("ejs");
const moment = require("moment");

/**
 * Load Event and append to req.
 */
function load(req, res, next, id) {
	Event.get(id)
		.then((event) => {
			req.event = event; // eslint-disable-line no-param-reassign
			return next();
		})
		.catch((e) => next(e));
}

/**
 * Get Event
 * @returns {Event}
 */
const get = async (req, res, next) => {
	let eventId = req?.query?.eventId;
	let eventUrl = req?.query?.eventUrl;
	let condition = {};
	if (eventId) {
		condition = { _id: ObjectId(eventId) };
	}
	if (eventUrl) {
		condition = { eventUrl: eventUrl };
	}

	Event.aggregate([
		{
			$match: condition,
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "User",
			},
		},
		{
			$unwind: {
				path: "$User",
				preserveNullAndEmptyArrays: true,
			},
		},
	])

		// Event.findOne(condition)
		.then(async (event) => {
			let jsonResult;
			if (event) {
				const eventDetail = event[0];
				const inventoryDetails = await getInventory(eventDetail);
				if (inventoryDetails?.User?.password) {
					delete inventoryDetails?.User["password"];
				}
				jsonResult = utils.getJsonResponse(
					true,
					"Event details.",
					inventoryDetails
				);
			} else {
				jsonResult = utils.getJsonResponse(
					false,
					"Event detail not found.",
					null
				);
			}
			return res.json(jsonResult);
		})
		.catch((e) => next(e));
};

const uploadEventImages = async (req, res, next) => {
	return new Promise(async (resolve, reject) => {
		try {
			let images = [];
			var isFileUploaded = false;
			const buffers = {};
			req.body["eventImages"] = [];
			let chunks = [],
				fname,
				ftype,
				fEncoding,
				fieldname;
			let bb = Busboy({
				headers: req.headers,
				limits: { fileSize: 2 * 1024 * 1024 },
			});
			bb.on("field", async (field, val, info) => {
				req.body[field] = val;
				let isEventIdExists = null;
				if (field == "_id") {
					isEventIdExists = await Event.findOne({ _id: ObjectId(val) });
					if (isEventIdExists == null) {
						let jsonResult = utils.getJsonResponse(
							false,
							"Event Id Not exists.",
							null
						);
						return res.send(jsonResult);
					}
				}

				if (field == "imageUrl" && val != "") {
					images.push(val);
					req.body["eventImages"].push(val);
				}
				if (field == "eventImages" && val == "") {
					req.body["eventImages"] = images;
				}
			});

			bb.on("file", (name, file, info) => {
				const { filename, encoding, mimeType } = info;
				isFileUploaded = true;

				fname = filename.replace(/ /g, "_");
				ftype = mimeType;
				fEncoding = encoding;
				if (
					mimeType == "image/jpg" ||
					mimeType == "image/jpeg" ||
					mimeType == "image/png" ||
					mimeType == "image/gif" ||
					mimeType == "application/illustrator" ||
					mimeType == "application/postscript"
				) {
				} else {
					file.resume();
					return res.status(400).json({
						success: false,
						message: "Invalid file format. Please upload png or jpg file",
						data: null,
					});
				}
				file.on("limit", function (data) {
					return res.json({
						status: 400,
						success: false,
						message: `You can not upload more than 2MB.`,
						data: null,
					});
				});

				let key = Date.now() + String(process.hrtime()[1]);
				const params = {
					Bucket: "vargabucket", // your s3 bucket name
					Key: `events/${req.body._id}/${key}.png`,
					Body: file, // concatinating all chunks
					ACL: "public-read",
					ContentType: ftype, // required
				};
				S3.upload(params, (err, s3res) => {
					if (err) {
						return reject(err);
					} else {
						req.body["eventImages"].push(s3res.Location);
						setTimeout(() => {
							return resolve(s3res);
						}, 1000);
					}
				});
				file
					.on("data1", (data) => {
						chunks.push(data);
					})
					.on("close", () => {});
			});
			bb.on("finish", function () {
				if (!isFileUploaded) {
					return resolve(req.body);
				}
			});
			req.pipe(bb);
		} catch (ex) {
			reject(ex);
		}
	});
};

/**
 * Upload event images
 * @property {array} req?.body?.images - The images of event.
 * @property {string} req?.body?.eventId - The basePrice of event.
 * @returns {Event}
 */
const uploadImages = async (req, res, next) => {
	try {
		let uploaded = await uploadEventImages(req, res, next);
		if (Array.isArray(req?.body?.eventImages)) {
			let set = {
				eventImages: req?.body?.eventImages,
			};
			Event.findOneAndUpdate(
				{ _id: ObjectId(req?.body?._id) },
				{ $set: set },
				{ new: true }
			)
				.then((savedEvent) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Event updated successfully.",
						savedEvent
					);
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
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
			let jsonResult = utils.getJsonResponse(
				false,
				"image field might have incorrect values",
				null
			);
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

/**
 * Create new event
 * @property {string} req?.body?.title - The name of event.
 * @property {string} req?.body?.status - The status of event.
 * @property {array} req?.body?.venue - The venue of event.
 * @property {string} req?.body?.noOfTickets - The noOfTickets of event.
 * @property {string} req?.body?.ticketValue - The ticketValue of event.
 * @property {string} req?.body?.eventDescription - The eventDescription of event.
 * @returns {Event}
 */
const create = async (req, res, next) => {
	try {
		let title = req?.body?.title;
		let eventUrl = req?.body?.eventUrl;
		let ticketDetails = req?.body?.ticketDetails;
		if (ticketDetails.ticketType) {
			ticketDetails.ticketType.map((item) => {
				item.ticketStartDateTime = new Date(item.ticketStartDateTime);
				item.ticketEndDateTime = new Date(item.ticketEndDateTime);
				item.ticketStartDateTime = new Date(item.ticketStartDateTime);
				item.ticketEndDateTime = new Date(item.ticketEndDateTime);
			});
		}
		ticketDetails.sellingStartDateTime = new Date(
			ticketDetails.sellingStartDateTime
		);
		ticketDetails.sellingEndDateTime = new Date(
			ticketDetails.sellingEndDateTime
		);
		let userId = ObjectId(req?.body?.userId);
		const eventSchema = {
			title,
			userId: userId,
			eventUrl,
			venue: req?.body?.venue,
			noOfTickets: req?.body?.noOfTickets,
			maxTicketsPerUser: req?.body?.maxTicketsPerUser,
			ticketValue: req?.body?.ticketValue,
			ticketDetails: ticketDetails,
			status: req?.body?.status,
			eventImages: req?.body?.eventImages,
			eventStatus: req?.body?.eventStatus,
			eventStartDateTime: new Date(req?.body?.eventStartDateTime),
			eventEndDateTime: new Date(req?.body?.eventEndDateTime),
			liveChatSupport: req?.body?.liveChatSupport,
			eventDescription: req?.body?.eventDescription,
		};
		const event = new Event(eventSchema);

		let eventId = req?.body?.eventId;
		var isEventExists = null;
		if (!eventId) {
			isEventExists = await Event.findOne({ title: title });
		}

		if (isEventExists != null) {
			let jsonResult = utils.getJsonResponse(
				false,
				"Event already exists.",
				null
			);
			return res.send(jsonResult);
		} else {
			event
				.save()
				.then(async (savedEvent) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Event added successfully.",
						savedEvent
					);
					await addInventory({ ...eventSchema, eventId: savedEvent?._id });
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
									false,
									err.errors[field].message,
									null
								);
								res.send(jsonResult);
							}
						}
					}
				});
		}
	} catch (err) {
		console.log("Error in creating event--", err);
		let jsonResult = utils.getJsonResponse(false, err, {});

		res.send(jsonResult);
	}
};

/**
 * Update existing Event
 * @returns {Event}
 */
const update = async (req, res, next) => {
	try {
		let eventId = req?.body?._id;
		if (eventId) {
			isEventIdExists = await Event.findOne({ _id: ObjectId(eventId) });
			if (isEventIdExists) {
			} else {
				let jsonResult = utils.getJsonResponse(
					false,
					"Event Id Not exists.",
					null
				);
				return res.send(jsonResult);
			}
			condition = { _id: ObjectId(eventId) };
			let set = {};
			if (eventId) {
				for (let [key, val] of Object.entries(req?.body)) {
					if (key === "userId") {
						set[key] = ObjectId(val);
					} else {
						set[key] = val;
					}
				}
			}

			Event.findOneAndUpdate(
				{ _id: ObjectId(eventId) },
				{ $set: set },
				{ new: true }
			)
				.then((savedEvent) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Event updated successfully.",
						savedEvent
					);
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
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
			let jsonResult = utils.getJsonResponse(false, "Please send eventId ", {});
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

/**
 * Get event list.
 * @property {number} req.query.skip - Number of events to be skipped.
 * @property {number} req.query.limit - Limit number of events to be returned.
 * @returns {Events[]}
 */
const list = async (req, res, next) => {
	const { limit = 50, skip = 0 } = req?.query;
	let condition = {};
	if (req?.query?.name) {
		condition.title = { $regex: req?.query?.name, $options: "i" };
	}
	if (req?.query?.place) {
		condition = {
			$or: [
				{ "venue.address": { $regex: req?.query?.place, $options: "i" } },
				{ "venue.pincode": Number(req?.query?.place) },
			],
		};
	}
	if (req?.query?.time) {
		condition = {
			$or: [
				{ eventStartDateTime: new Date(req?.query?.time) },
				{ eventEndDateTime: new Date(req?.query?.time) },
			],
		};
	}

	if (req?.query?.eventUrl) {
		condition.eventUrl = { $regex: req?.query?.eventUrl, $options: "i" };
	}
	if (req?.query?.eventStatus) {
		condition.eventStatus = req?.query?.eventStatus;
	}
	if (req?.query?.ticketValue) {
		condition.ticketValue = Number(req?.query?.ticketValue);
	}
	Event.aggregate([
		{
			$match: condition,
		},
		{
			$lookup: {
				from: "bookings",
				localField: "_id",
				foreignField: "eventId",
				as: "booking",
			},
		},
		{
			$unwind: {
				path: "$booking",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$group: {
				_id: {
					_id: "$_id",
					status: "$status",
					eventImages: "$eventImages",
					eventStatus: "$eventStatus",
					title: "$title",
					eventUrl: "$eventUrl",
					venue: "$venue",
					noOfTickets: "$noOfTickets",
					maxTicketsPerUser: "$maxTicketsPerUser",
					ticketValue: "$ticketValue",
					ticketDetails: "$ticketDetails",
					eventStartDateTime: "$eventStartDateTime",
					eventEndDateTime: "$eventEndDateTime",
					liveChatSupport: "$liveChatSupport",
					eventDescription: "$eventDescription",
					createdAt: "$createdAt",
					modifiedAt: "$modifiedAt",
				},
				totalUsed: {
					$sum: {
						$sum: {
							$switch: {
								branches: [
									{
										case: { $eq: ["$booking.bookingStatus", "CONFIRMED"] },
										then: "$booking.eventDetail.count",
									},
								],
								default: 0,
							},
						},
					},
				},
			},
		},
		{
			$project: {
				_id: "$_id._id",
				status: "$_id.status",
				eventImages: "$_id.eventImages",
				eventStatus: "$_id.eventStatus",
				title: "$_id.title",
				eventUrl: "$_id.eventUrl",
				venue: "$_id.venue",
				noOfTickets: "$_id.noOfTickets",
				maxTicketsPerUser: "$_id.maxTicketsPerUser",
				ticketValue: "$_id.ticketValue",
				ticketDetails: "$_id.ticketDetails",
				eventStartDateTime: "$_id.eventStartDateTime",
				eventEndDateTime: "$_id.eventEndDateTime",
				liveChatSupport: "$_id.liveChatSupport",
				eventDescription: "$_id.eventDescription",
				createdAt: "$_id.createdAt",
				modifiedAt: "$_id.modifiedAt",
				totalUsed: 1,
			},
		},
		{ $sort: { eventStartDateTime: 1 } },
	])
		.skip(skip)
		.limit(limit)
		.then((events) => {
			let jsonResult;
			if (events) {
				jsonResult = utils.getJsonResponse(true, "Events list.", events);
			} else {
				jsonResult = utils.getJsonResponse(
					false,
					"Events list not found.",
					null
				);
			}
			res.send(jsonResult);
		})
		.catch((e) => next(e));
};

/**
 * Delete Event.
 * @returns {Event}
 */
const remove = (req, res, next) => {
	const event = req.event;
	event
		.remove()
		.then((deletedEvent) => res.json(deletedEvent))
		.catch((e) => next(e));
};

const saveBooking = (params) => {
	return new Promise(async (resolve, reject) => {
		try {
			const booking = new Booking({
				eventId: params?.body?.eventId,
				userId: params?.body?.userId,
				ticketDetail: params?.body?.ticketDetail,
				bookingStatus: params?.body?.bookingStatus,
				bookingDate: params?.body?.bookingDate,
				paymentId: params.payment_intent,
				paymentStatus: params?.body?.paymentStatus,
				stripeCustomerId: params.id,
				bookingAmount: params?.body?.amount,
			});

			// let eventId = params?.eventId
			booking
				.save()
				.then((savedBooking) => {
					return resolve(savedBooking);
				})
				.catch((err) => {
					return reject(err);
				});
		} catch (err) {
			throw new Error(err);
		}
	});
};

const paymentdone = async (req, res, next) => {
	try {
		res.send("hello");
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const createPaymentIntent = async (req, res, next) => {
	try {
		// Create a PaymentIntent with the order amount and currency
		const paymentIntent = await stripe.checkout(req.body);
		paymentIntent.body = {};
		paymentIntent.body.eventId = req.body.eventId;
		paymentIntent.body.userId = req.body.userId;
		paymentIntent.body.amount = req.body.amount;
		paymentIntent.body.bookingDate = req.body.bookingDate;
		paymentIntent.body.ticketDetail = req?.body?.ticketDetail;
		let saveBookingData = await saveBooking(paymentIntent);
		paymentIntent.bookingId = saveBookingData._id;
		let jsonResult = utils.getJsonResponse(
			true,
			`Event Booked Successfully`,
			paymentIntent
		);
		res.send(jsonResult);
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const updateBookingVerifiedStatus = async (req, res, next) => {
	try {
		let bookingId = req?.body?.bookingId;
		isBookingIdExists = await Booking.findOne({ _id: ObjectId(bookingId) });
		if (!isBookingIdExists) {
			let jsonResult = utils.getJsonResponse(
				false,
				"Booking Id Not exists.",
				null
			);
			return res.send(jsonResult);
		}
		condition = { _id: ObjectId(bookingId) };
		let set = { isVerified: req?.body?.isVerified };

		Booking.findOneAndUpdate(
			{ _id: ObjectId(bookingId) },
			{ $set: set },
			{ new: true }
		).then(async (savedEvent) => {
			let jsonResult = utils.getJsonResponse(
				true,
				"Booking updated successfully.",
				savedEvent
			);
			res.send(jsonResult);
		});
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};
/**
 * Update existing booking
 * @returns {Booking}
 */
const updateBooking = async (req, res, next) => {
	try {
		let bookingId = req?.body?.bookingId;
		if (bookingId) {
			isBookingIdExists = await Booking.findOne({ _id: ObjectId(bookingId) });
			if (!isBookingIdExists) {
				let jsonResult = utils.getJsonResponse(
					false,
					"Booking Id Not exists.",
					null
				);
				return res.send(jsonResult);
			}
			condition = { _id: ObjectId(bookingId) };
			const secureCode = Math.random().toString(36).slice(7).toUpperCase();
			let set = { secureCode };
			if (bookingId) {
				for (let [key, val] of Object.entries(req?.body)) {
					set[key] = val;
				}
			}
			Booking.findOneAndUpdate(
				{ _id: ObjectId(bookingId) },
				{ $set: set },
				{ new: true }
			)
				.then(async (savedEvent) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Booking updated successfully.",
						savedEvent
					);
					try {
						await updateInventory({ ...savedEvent, ...isBookingIdExists });
						await sendBookingEmail({ secureCode, ...isBookingIdExists });
						res.send(jsonResult);
					} catch (err) {
						let jsonResult = utils.getJsonResponse(
							false,
							err?.message || "Error in updating booking details",
							{}
						);
						res.send(jsonResult);
					}
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
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
			let jsonResult = utils.getJsonResponse(
				false,
				"Please send bookingId ",
				{}
			);
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const book = async (req, res, next) => {
	try {
		let response = await stripe.charge(req.body);
		const booking = new Booking({
			eventId: req?.body?.eventId,
			userId: req?.body?.userId,
			bookingStatus: req?.body?.bookingStatus,
			bookingDate: req?.body?.bookingDate,
			paymentId: response.id,
			stripeCustomerId: response.customer,
			bookingAmount: req?.body?.bookingAmount,
		});

		let eventId = req?.body?.eventId;
		var isEventExists = null;
		if (eventId) {
			isEventExists = await Event.findOne({ _id: ObjectId(eventId) });
		}

		if (isEventExists == null) {
			let jsonResult = utils.getJsonResponse(false, "Event not exists.", null);
			return res.send(jsonResult);
		} else {
			booking
				.save()
				.then((savedBooking) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Event booked successfully.",
						savedBooking
					);
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
									false,
									err.errors[field].message,
									null
								);
								res.send(jsonResult);
							}
						}
					}
				});
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const getEventData = (eventType, userId) => {
	return new Promise((resolve, reject) => {
		try {
			let condition = {};
			if (eventType === "upcoming") {
				condition = {
					$and: [
						{
							userId: ObjectId(userId),
						},
						{
							eventStartDateTime: {
								$gt: new Date(),
							},
						},
					],
				};
			}
			if (eventType == "ongoing") {
				condition = {
					$and: [
						{
							userId: ObjectId(userId),
						},
						{
							eventEndDateTime: {
								$gt: new Date(),
							},
						},
						{
							eventStartDateTime: {
								$lt: new Date(),
							},
						},
					],
				};
			}
			if (eventType == "past") {
				condition = {
					$and: [
						{
							userId: ObjectId(userId),
						},
						{
							eventEndDateTime: {
								$lt: new Date(),
							},
						},
					],
				};
			}
			Event.find(condition)
				.then((events) => {
					resolve(events);
				})
				.catch((e) => next(e));
		} catch (err) {
			reject(err);
		}
	});
};

const getClubMembers = (userId) => {
	return new Promise((resolve, reject) => {
		try {
			let condition = {};
			condition = {
				$and: [
					{
						clubId: ObjectId(userId),
					},
				],
			};
			MembershipForm.find(condition)
				.then((item) => {
					resolve(item);
				})
				.catch((e) => next(e));
		} catch (err) {
			reject(err);
		}
	});
};

const dashboard = async (req, res, next) => {
	try {
		let userId = req?.user?._id;
		let upcomingData = await getEventData("upcoming", userId);
		let ongoingData = await getEventData("ongoing", userId);
		let pastData = await getEventData("past", userId);
		let clubMembersData = await getClubMembers(userId);
		let jsonResult = utils.getJsonResponse(true, "Events dashboard.", {
			upcoming: upcomingData.length,
			ongoing: ongoingData.length,
			past: pastData.length,
			membershipStats: [],
			monthlyRevenue: [],
			isRegistrationFrom: clubMembersData.length > 0,
			registrationPaid:
				clubMembersData.length > 0 ? clubMembersData[0]?.isPaid : false,
			netSale: 1010,
			recentSale: 209,
		});
		res.send(jsonResult);
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const getClubEvents = (req, res, next) => {
	try {
		const { limit = 50, skip = 0, userId } = req?.query;
		let condition = {};
		if (req?.query?.eventType === "upcoming") {
			condition = {
				$and: [
					{
						eventStartDateTime: {
							$gt: new Date(),
						},
					},
					{
						userId: ObjectId(userId),
					},
				],
			};
		}
		if (req?.query?.eventType && req?.query?.eventType == "ongoing") {
			condition = {
				$and: [
					{
						eventEndDateTime: {
							$gt: new Date(),
						},
					},
					{
						eventStartDateTime: {
							$lt: new Date(),
						},
					},
					{
						userId: ObjectId(userId),
					},
				],
			};
		}
		if (req?.query?.eventType && req?.query?.eventType == "past") {
			condition = {
				$and: [
					{
						eventEndDateTime: {
							$lt: new Date(),
						},
					},
					{
						userId: ObjectId(userId),
					},
				],
			};
		}
		Event.aggregate([
			{
				$match: condition,
			},
			{
				$lookup: {
					from: "bookings",
					localField: "_id",
					foreignField: "eventId",
					as: "booking",
				},
			},
			{
				$unwind: {
					path: "$booking",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "User",
				},
			},
			{
				$unwind: {
					path: "$User",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: {
						_id: "$_id",
						status: "$status",
						eventImages: "$eventImages",
						eventStatus: "$eventStatus",
						title: "$title",
						userId: "$userId",
						eventUrl: "$eventUrl",
						venue: "$venue",
						noOfTickets: "$noOfTickets",
						maxTicketsPerUser: "$maxTicketsPerUser",
						ticketValue: "$ticketValue",
						ticketDetails: "$ticketDetails",
						eventStartDateTime: "$eventStartDateTime",
						eventEndDateTime: "$eventEndDateTime",
						liveChatSupport: "$liveChatSupport",
						eventDescription: "$eventDescription",
						createdAt: "$createdAt",
						modifiedAt: "$modifiedAt",
					},
					totalUsed: {
						$sum: {
							$sum: {
								$switch: {
									branches: [
										{
											case: { $eq: ["$booking.bookingStatus", "CONFIRMED"] },
											then: "$booking.eventDetail.count",
										},
									],
									default: 0,
								},
							},
						},
					},
				},
			},
			{
				$project: {
					_id: "$_id._id",
					status: "$_id.status",
					eventImages: "$_id.eventImages",
					eventStatus: "$_id.eventStatus",
					title: "$_id.title",
					eventUrl: "$_id.eventUrl",
					venue: "$_id.venue",
					noOfTickets: "$_id.noOfTickets",
					maxTicketsPerUser: "$_id.maxTicketsPerUser",
					ticketValue: "$_id.ticketValue",
					ticketDetails: "$_id.ticketDetails",
					eventStartDateTime: "$_id.eventStartDateTime",
					eventEndDateTime: "$_id.eventEndDateTime",
					liveChatSupport: "$_id.liveChatSupport",
					eventDescription: "$_id.eventDescription",
					createdAt: "$_id.createdAt",
					modifiedAt: "$_id.modifiedAt",
					User: "$_id.User",
					totalUsed: 1,
					userId: 1,
				},
			},
			{ $sort: { eventStartDateTime: 1 } },
		])
			.skip(skip)
			.limit(limit)
			.then((events) => {
				let jsonResult;
				if (events) {
					jsonResult = utils.getJsonResponse(true, "Events list.", events);
				} else {
					jsonResult = utils.getJsonResponse(
						false,
						"Events list not found.",
						null
					);
				}
				res.send(jsonResult);
			})
			.catch((e) => next(e));
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

async function dashboardEventList(req, res, next) {
	await getClubEvents(req, res, next);
}

async function getClubEventsList(req, res, next) {
	try {
		const { limit = 50, skip = 0, userId } = req?.query;
		let condition = {};
		if (req?.query?.eventType === "upcoming") {
			condition = {
				eventStartDateTime: {
					$gte: new Date(),
				},
			};
		}
		if (req?.query?.eventType && req?.query?.eventType == "ongoing") {
			condition = {
				$and: [
					{
						eventEndDateTime: {
							$gt: new Date(),
						},
					},
					{
						eventStartDateTime: {
							$lt: new Date(),
						},
					},
				],
			};
		}
		if (req?.query?.eventType && req?.query?.eventType == "past") {
			condition = {
				eventEndDateTime: {
					$lt: new Date(),
				},
			};
		}

		Event.aggregate([
			{
				$match: condition,
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "User",
				},
			},
			{
				$group: {
					_id: {
						_id: "$_id",
						status: "$status",
						eventImages: "$eventImages",
						eventStatus: "$eventStatus",
						title: "$title",
						userId: "$userId",
						eventUrl: "$eventUrl",
						venue: "$venue",
						noOfTickets: "$noOfTickets",
						maxTicketsPerUser: "$maxTicketsPerUser",
						ticketValue: "$ticketValue",
						ticketDetails: "$ticketDetails",
						eventStartDateTime: "$eventStartDateTime",
						eventEndDateTime: "$eventEndDateTime",
						liveChatSupport: "$liveChatSupport",
						eventDescription: "$eventDescription",
						createdAt: "$createdAt",
						modifiedAt: "$modifiedAt",
						User: {
							_id: "$_id",
							email: "$User.email",
							name: "$User.name",
							societyName: "$User.societyName",
							userName: "$User.username",
							createdAt: "$User.createdAt",
						},
					},
				},
			},
			{
				$project: {
					_id: "$_id._id",
					status: "$_id.status",
					eventImages: "$_id.eventImages",
					eventStatus: "$_id.eventStatus",
					title: "$_id.title",
					eventUrl: "$_id.eventUrl",
					venue: "$_id.venue",
					noOfTickets: "$_id.noOfTickets",
					maxTicketsPerUser: "$_id.maxTicketsPerUser",
					ticketValue: "$_id.ticketValue",
					ticketDetails: "$_id.ticketDetails",
					eventStartDateTime: "$_id.eventStartDateTime",
					eventEndDateTime: "$_id.eventEndDateTime",
					liveChatSupport: "$_id.liveChatSupport",
					eventDescription: "$_id.eventDescription",
					createdAt: "$_id.createdAt",
					modifiedAt: "$_id.modifiedAt",
					User: "$_id.User",
				},
			},
			{ $sort: { eventStartDateTime: 1 } },
		])
			.skip(skip)
			.limit(limit)
			.then((events) => {
				let jsonResult;
				if (events) {
					jsonResult = utils.getJsonResponse(true, "Events list.", events);
				} else {
					jsonResult = utils.getJsonResponse(
						false,
						"Events list not found.",
						null
					);
				}
				res.send(jsonResult);
			})
			.catch((e) => next(e));
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
}

const getBookingDetailsByEventId = (eventId, skip = 0, limit = 100) => {
	return new Promise((resolve, reject) => {
		Booking.aggregate([
			{
				$match: {
					eventId,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "User",
				},
			},
			{
				$unwind: {
					path: "$User",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: "events",
					localField: "eventId",
					foreignField: "_id",
					as: "Events",
				},
			},
			{
				$unwind: {
					path: "$Events",
					preserveNullAndEmptyArrays: true,
				},
			},
		])
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.then((bookings) => {
				resolve(bookings);
			})
			.catch((e) => reject(e));
	});
};

const getStudentBookingByUserId = async (userId, skip = 0, limit = 500) => {
	return new Promise((resolve, reject) => {
		Booking.aggregate([
			{
				$match: {
					userId: ObjectId(userId),
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "User",
				},
			},
			{
				$unwind: {
					path: "$User",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: "events",
					localField: "eventId",
					foreignField: "_id",
					as: "eventDetail",
				},
			},
			{
				$unwind: {
					path: "$Events",
					preserveNullAndEmptyArrays: true,
				},
			},
		])
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.then((bookings) => {
				resolve(bookings);
			})
			.catch((e) => reject(e));
	});
};

const adminBookingList = async (req, res, next) => {
	try {
		const {
			limit = 3,
			skip = 0,
			paymentStatus,
			bookingStatus,
			paymentId,
			stripeCustomerId,
		} = req?.query;
		let condition = {};
		if (bookingStatus) {
			condition = { bookingStatus: bookingStatus };
		}
		if (paymentStatus) {
			condition = { paymentStatus: paymentStatus };
		}
		if (paymentId) {
			condition = { paymentId: paymentId };
		}
		if (stripeCustomerId) {
			condition = { stripeCustomerId: stripeCustomerId };
		}

		Booking.aggregate([
			{
				$match: condition,
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "User",
				},
			},
			{
				$unwind: {
					path: "$User",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: "events",
					localField: "eventId",
					foreignField: "_id",
					as: "Events",
				},
			},
			{
				$unwind: {
					path: "$Events",
					preserveNullAndEmptyArrays: true,
				},
			},
		])
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.then(async (bookings) => {
				let jsonResult;
				if (bookings) {
					let list = bookings.map(async (booking) => {
						const club = await User.findOne(
							{ _id: ObjectId(booking.Events?.userId) },
							{ name: 1 }
						);
						return {
							...booking,
							clubName: club?.name,
						};
					});

					list = await Promise.all(list);
					jsonResult = utils.getJsonResponse(true, "Booking list.", list);
				} else {
					jsonResult = utils.getJsonResponse(
						false,
						"Booking list not found.",
						null
					);
				}
				res.send(jsonResult);
			})
			.catch((e) => next(e));
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const registerClubUser = async (req, res, next) => {
	const membership = new Membership({
		clubId: ObjectId(req?.body?.clubId),
		userType: "user",
		...req?.body,
	});

	let isEmailExists = await Membership.findOne({
		email: req?.body?.email,
		userType: "user",
	});

	if (isEmailExists != null) {
		let jsonResult = utils.getJsonResponse(
			false,
			"Email already exists.",
			null
		);
		res.send(jsonResult);
	} else {
		membership
			.save()
			.then((savedMembership) => {
				let jsonResult = utils.getJsonResponse(
					true,
					"Club Member registered successfully.",
					savedMembership
				);
				res.send(jsonResult);
			})
			.catch((err) => {
				if (err) {
					if (err.name == "ValidationError") {
						for (field in err.errors) {
							let jsonResult = utils.getJsonResponse(
								false,
								err.errors[field].message,
								null
							);
							res.send(jsonResult);
						}
					}
				}
			});
	}
};

const createRegisterFormClubUser = async (req, res, next) => {
	const membershipForm = new MembershipForm({
		clubId: ObjectId(req?.body?.clubId),
		formFields: req?.body?.formFields,
		membershipUrl: req?.body?.membershipUrl,
		isPaid: req?.body?.isPaid,
		membershipFee: req?.body?.membershipFee,
		userType: "club",
		status: 1,
	});
	let isMembershipUrl = await MembershipForm.findOne({
		membershipUrl: req?.body?.membershipUrl,
		clubId: ObjectId(req?.body?.clubId),
	});

	if (isMembershipUrl != null) {
		let jsonResult = utils.getJsonResponse(
			false,
			"Registration form already exists.",
			null
		);
		res.send(jsonResult);
	} else {
		membershipForm
			.save()
			.then(() => {
				let jsonResult = utils.getJsonResponse(
					true,
					"Registration form created successfully.",
					null
				);
				res.send(jsonResult);
			})
			.catch((err) => {
				if (err) {
					if (err.name == "ValidationError") {
						for (field in err.errors) {
							let jsonResult = utils.getJsonResponse(
								false,
								err.errors[field].message,
								null
							);
							res.send(jsonResult);
						}
					}
				}
			});
	}
};

const updateRegisterFormClubUser = async (req, res, next) => {
	try {
		let formId = req?.body?._id;
		if (formId) {
			isFormExists = await MembershipForm.findOne({ _id: ObjectId(formId) });

			if (isFormExists) {
			} else {
				let jsonResult = utils.getJsonResponse(
					false,
					"Membership form Not exists.",
					null
				);
				return res.send(jsonResult);
			}
			condition = { _id: ObjectId(formId) };
			let set = {};
			if (formId) {
				for (let [key, val] of Object.entries(req?.body)) {
					if (key === "clubId") {
						set[key] = ObjectId(val);
					} else {
						set[key] = val;
					}
				}
			}

			MembershipForm.findOneAndUpdate(
				{ _id: ObjectId(formId) },
				{ $set: set },
				{ new: false }
			)
				.then(() => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Membership form updated successfully.",
						null
					);
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
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
			let jsonResult = utils.getJsonResponse(false, "Please send formId ", {});
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const getRegisterFromData = (req, res) => {
	let membershipUrl = req?.query?.membershipUrl;
	MembershipForm.findOne({
		membershipUrl,
	})
		.then((event) => {
			let jsonResult;
			if (event) {
				jsonResult = utils.getJsonResponse(
					true,
					"Registration form Data",
					event
				);
			} else {
				jsonResult = utils.getJsonResponse(
					false,
					"Registration form detail not found.",
					null
				);
			}
			return res.json(jsonResult);
		})
		.catch((e) => next(e));
};

const getClubMembersData = (req, res) => {
	return new Promise(async (resolve, reject) => {
		try {
			let clubId = req.user._id;
			const { limit = 50, skip = 0 } = req?.query;
			let condition = {};
			if (req?.query?.registrationType === "free") {
				condition.isPaid = false;
			}
			if (req?.query?.registrationType === "paid") {
				condition.isPaid = true;
			}
			const membershipFormData = await MembershipForm.findOne({
				clubId: ObjectId(req?.query?.userId),
			});

			await Membership.aggregate([
				{
					$match: condition,
				},
				{
					$lookup: {
						from: "users",
						localField: "clubId",
						foreignField: "_id",
						as: "club",
					},
				},
				{
					$unwind: {
						path: "$club",
						preserveNullAndEmptyArrays: true,
					},
				},
			])
				.sort({ createdAt: -1 })
				.skip(+skip)
				.limit(+limit)
				.exec()
				.then((clubMemberData) => {
					let jsonResult;
					if (clubMemberData) {
						clubMemberData = {
							row: [...clubMemberData],
							columnsDefs: [...membershipFormData.formFields],
						};
						jsonResult = utils.getJsonResponse(
							true,
							`Club Members Data`,
							clubMemberData
						);
					} else {
						jsonResult = utils.getJsonResponse(
							false,
							"Club Members list not found.",
							null
						);
					}
					res.send(jsonResult);
				})
				.catch((e) => next(e));
		} catch (err) {
			reject(err);
		}
	});
};

const createMembershipPaymentIntent = async (req, res, next) => {
	try {
		// Create a PaymentIntent with the order amount and currency
		const paymentIntent = await stripe.membershipCheckout(req.body);
		const membershipForm = new Membership({
			...req?.body,
			clubId: req?.body?.clubId,
			mobile: req?.body?.mobile,
			membershipUrl: req?.body?.membershipUrl,
			isPaid: req?.body?.isPaid,
			membershipFee: req?.body?.membershipFee,
			userId: req?.body?.userId,
			paymentId: paymentIntent.payment_intent,
			bookingDate: new Date(),
		});
		const createBooking = await membershipForm.save();
		paymentIntent.bookingId = createBooking._id;
		let jsonResult = utils.getJsonResponse(
			true,
			`Membership Booked Successfully`,
			paymentIntent
		);
		res.send(jsonResult);
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const updateMembershipBooking = async (req, res, next) => {
	try {
		let bookingId = req?.body?.bookingId;
		if (bookingId) {
			isBookingIdExists = await Membership.findOne({
				_id: ObjectId(bookingId),
			});
			if (isBookingIdExists) {
			} else {
				let jsonResult = utils.getJsonResponse(
					false,
					"Booking Id Not exists.",
					null
				);
				return res.send(jsonResult);
			}
			condition = { _id: ObjectId(bookingId) };
			let set = {};
			if (bookingId) {
				for (let [key, val] of Object.entries(req?.body)) {
					set[key] = val;
				}
			}
			Membership.findOneAndUpdate(
				{ _id: ObjectId(bookingId) },
				{ $set: set },
				{ new: true }
			)
				.then((data) => {
					let jsonResult = utils.getJsonResponse(
						true,
						"Booking updated successfully.",
						data
					);
					res.send(jsonResult);
				})
				.catch((err) => {
					if (err) {
						if (err.name == "ValidationError") {
							for (field in err.errors) {
								let jsonResult = utils.getJsonResponse(
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
			let jsonResult = utils.getJsonResponse(
				false,
				"Please send bookingId ",
				{}
			);
			res.send(jsonResult);
		}
	} catch (err) {
		let jsonResult = utils.getJsonResponse(false, err, {});
		res.send(jsonResult);
	}
};

const addInventory = async (data) => {
	return new Promise((resolve, reject) => {
		const inventory = new Inventory({
			total: data?.noOfTickets,
			eventId: data?.eventId,
			tickets: data.ticketDetails,
		});
		inventory
			.save()
			.then((res) => {
				resolve(true);
			})
			.catch((e) => {
				console.log("Error in adding inventory===>", e);
				reject("Something went wrong");
			});
	});
};

const getInventory = (data) => {
	return new Promise(async (resolve, reject) => {
		try {
			const InventoryData = await Inventory.findOne({
				eventId: ObjectId(data?._id),
			});
			const updatedDetails = {
				...data,
				noOfTickets: InventoryData?.total,
				ticketDetails: {
					...data?.ticketDetails,
					ticketType: [...InventoryData?.tickets?.ticketType],
				},
			};
			resolve(updatedDetails);
		} catch (e) {
			console.log("error in fetching inventory", e);
			reject(e);
		}
	});
};

const updateInventory = async (details) => {
	const data = details?._doc;
	return new Promise(async (resolve, reject) => {
		try {
			const InventoryData = await Inventory.findOne({
				eventId: ObjectId(data?.eventId),
			});
			condition = { _id: ObjectId(data?.eventId) };
			let total = InventoryData?.total || 0;
			const requiredTickets = data?.ticketDetail.length
				? data?.ticketDetail?.reduce((a, c) => a.count + c.count)
				: 0;
			if (requiredTickets?.count > total) {
				reject("Tickets are not available right now");
				return;
			}
			total = (InventoryData?.total || 0) - (requiredTickets?.count || 0);
			let ticketDetails = InventoryData?.tickets || [];
			ticketDetails = ticketDetails.map((ticket) => {
				const getBookedTicket = data?.ticketDetail.find(
					(item) => item.ticketName === ticket?.ticketName
				);
				if (getBookedTicket) {
					ticket.ticketLimit =
						ticket.ticketLimit >= getBookedTicket?.count
							? ticket.ticketLimit - getBookedTicket?.count
							: 0;
				}

				return ticket;
			});

			let set = { tickets: ticketDetails, total };

			Inventory.findOneAndUpdate(
				{ eventId: ObjectId(data?.eventId) },
				{ $set: set },
				{ new: true }
			)
				.then(async (savedEvent) => {
					resolve(savedEvent);
				})
				.catch((err) => {
					reject(err);
					console.log("Error in updating inventory....", err);
				});
		} catch (e) {
			console.log("Err", e);
			return reject(e);
		}
	});
};

const sendBookingEmail = (data) => {
	const eventData = data?._doc;
	return new Promise(async (resolve, reject) => {
		try {
			const userDetails = await getBookingDetailsByEventId(eventData.eventId);
			const details = userDetails.length ? userDetails[0] : {};
			const mailBody = {
				...eventData,
				...details,
				bookingDate: moment(details?.bookingDate).format("DD/MM/YYYY HH:mm"),
				title: details?.Events?.title,
				venue: details?.Events?.venue,
				tickets: eventData?.ticketDetail,
			};
			const htmlToSend = await ejs.renderFile(
				path.join(__dirname, "../../../../eventBooking.ejs"),
				mailBody
			);
			await utils.sendEmail({
				email: mailBody?.User?.email,
				subject: `Event has been booked! Your secure code is ${data?.secureCode} `,
				text: htmlToSend,
			});
			resolve(true);
		} catch (e) {
			console.log("error===>>", e);
			reject(e);
		}
	});
};

const clubBookings = async (req, res, next) => {
	const userId = req.query.userId;
	try {
		const events = await Event.find(
			{ userId: ObjectId(userId) },
			{
				_id: 1,
				title: 1,
				eventUrl: 1,
				venue: 1,
				eventStartDateTime: 1,
				eventEndDateTime: 1,
			}
		).exec();

		let final = [];

		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			const bookingHistory = await getBookingDetailsByEventId(event?._id);
			final.push({ ...event?._doc, bookingHistory: bookingHistory });
		}

		jsonResult = utils.getJsonResponse(
			false,
			"Events booking history list.",
			final
		);
		res.send(jsonResult);
	} catch (e) {
		jsonResult = utils.getJsonResponse(false, "Events list not found.", null);
		res.send(jsonResult);
	}
};

const getStudentBookings = async (email) => {
	return new Promise(async (resolve, reject) => {
		try {
			const userExists = await User.findOne({ email });
			if (!userExists) {
				return resolve([]);
			}
			const data = await getStudentBookingByUserId(userExists?._id);
			resolve(data);
		} catch (e) {
			console.log("Error", e);
		}
	});
};

const checkIfStudentMembershipPurchase = async (studentId, clubId) => {
	return await Membership.findOne({
		userId: ObjectId(studentId),
		clubId: ObjectId(clubId),
	});
};

const getClubMembershipForms = (clubId) => {
	return new Promise(async (resolve, reject) => {
		try {
			const membershipForm = await MembershipForm.findOne({
				clubId: ObjectId(clubId),
			});
			resolve(membershipForm?._doc);
		} catch (e) {
			reject(e);
		}
	});
};

const getStudentClubMemberships = async (email) => {
	return new Promise(async (resolve, reject) => {
		try {
			const student = await User.findOne({ email });
			if (!student) {
				return resolve([]);
			}

			const clubs = await User.find({ userType: "club" }).exec();
			const membershipList = [];
			for (let i = 0; i < clubs.length; i++) {
				const { _id } = clubs[i];
				let forms = { clubInfo: clubs[i] };
				forms.membershipFormInfo = await getClubMembershipForms(_id);
				forms.membershipFormInfo = forms.membershipFormInfo || null;
				forms.isMember = await checkIfStudentMembershipPurchase(
					student?._id,
					_id
				);
				forms.isMember = !!forms.isMember;
				membershipList.push(forms);
			}

			const data = await Promise.all(membershipList);
			resolve(data);
		} catch (e) {
			console.log("Error", e);
		}
	});
};

module.exports = {
	load,
	get,
	create,
	uploadImages,
	update,
	list,
	remove,
	registerClubUser,
	createRegisterFormClubUser,
	updateRegisterFormClubUser,
	getRegisterFromData,
	book,
	clubBookings,
	createPaymentIntent,
	paymentdone,
	updateBooking,
	dashboard,
	dashboardEventList,
	adminBookingList,
	getClubMembersData,
	createMembershipPaymentIntent,
	updateMembershipBooking,
	getStudentBookings,
	getStudentClubMemberships,
	getClubEventsList,
	updateBookingVerifiedStatus,
};
