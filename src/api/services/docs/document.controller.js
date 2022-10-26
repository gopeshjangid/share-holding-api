const Company = require("../company/company.model");
const Utils = require("../../../helpers/utils");
const utils = new Utils();
const File = require("./Upload");
const JwtToken = require("../../middleware/jwt");
const jwtToken = new JwtToken();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const Document = require("./document.model");
const PDF = require("../docs/PDF");
/**
 * Company Login.
 */

const getDocumentByCompanyId = async (id) => {
	return utils.join(
		"document",
		{
			from: "company",
			localField: "_id",
			foreignField: "companyId",
			as: "documents",
		},
		{ companyId: id }
	);
};

// async function updateDocument(document, catalog) {
// 	try {
// 		let userId = req?.body?.userId;
// 		if (userId) {
// 			isUserIdExists = await Company.findOne({ _id: ObjectId(userId) });
// 			if (isUserIdExists) {
// 			} else {
// 				let jsonResult = utils.getJsonResponse(
// 					false,
// 					"Company Id Not exists.",
// 					null
// 				);
// 				return res.send(jsonResult);
// 			}
// 			condition = { _id: ObjectId(userId) };
// 			let set = {};
// 			if (userId) {
// 				for (let [key, val] of Object.entries(req?.body)) {
// 					set[key] = val;
// 				}
// 			}
// 			Company.findOneAndUpdate(
// 				{ _id: ObjectId(userId) },
// 				{ $set: set },
// 				{ new: true }
// 			)
// 				.then(async (savedUser) => {
// 					let jsonResult = utils.getJsonResponse(
// 						true,
// 						"Company updated successfully.",
// 						savedUser
// 					);
// 					res.send(jsonResult);
// 				})
// 				.catch(async (err) => {
// 					if (err) {
// 						if (err.name == "ValidationError") {
// 							for (field in err.errors) {
// 								let jsonResult = utils.getJsonResponse(
// 									false,
// 									err.errors[field].message,
// 									null
// 								);
// 								res.send(jsonResult);
// 							}
// 						}
// 					}
// 				});
// 		} else {
// 			let jsonResult = utils.getJsonResponse(false, "Please send userId ", {});
// 			res.send(jsonResult);
// 		}
// 	} catch (err) {
// 		let jsonResult = utils.getJsonResponse(false, err, {});
// 		res.send(jsonResult);
// 	}
// }

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Company[]}
 */
function list(req, res, next) {
	const { limit = 50, skip = 0, companyId } = req?.query;
	Document.list({ limit, skip, companyId })
		.then(async (users) => {
			let jsonResult;
			if (users) {
				jsonResult = utils.getJsonResponse(true, "Users list.", users);
			} else {
				jsonResult = utils.getJsonResponse(
					false,
					"Users list not found.",
					null
				);
			}
			res.send(jsonResult);
		})
		.catch((e) => next(e));
}

const downloadResolutionForm = async (req, res) => {
	try {
		const { director_designation, director_name, id } = req.body;
		const filePath = path.join(
			__dirname,
			"../DocumentsHTML/Board_Resolution.ejs"
		);
		const fileName = `Board_Resolution_${id}.pdf`;
		const pdfData = await PDF.generatePdf(filePath, {
			director_name,
			director_designation,
			fileName,
		});
		res.contentType("application/pdf");
		res.header("Content-Length", "" + pdfData.length);
		fs.unlinkSync(fileName);
		return res.send(utils.getJsonResponse(true, "Generated Pdf", pdfData));
	} catch (e) {
		return res.send(utils.getJsonResponse(false, e, null));
	}
};

module.exports = {
	list,
	downloadResolutionForm,
	getDocumentByCompanyId,
};
