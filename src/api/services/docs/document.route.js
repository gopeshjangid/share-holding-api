const express = require("express");
const Upload = require("./Upload");
const Document = require("./document.controller");
const PDF = require("./PDF");

const router = express.Router(); // eslint-disable-line new-cap

router
	.route("/upload")
	/** GET /api/users - Get list of users */
	.post(Upload.uploadDocs);

router
	.route("/uploadRegistrationDocuments")
	/** GET /api/users - Get list of users */
	.post(Upload.uploadRegistrationDocuments);
router
	.route("/generatePdf")
	/** GET /api/users - Get list of users */
	.post(PDF.generatePdf);

router
	.route("/downloadResolutionForm")
	/** GET /api/users - Get list of users */
	.post(Document.downloadResolutionForm);

// /api/users/verifyOtp
module.exports = router;
