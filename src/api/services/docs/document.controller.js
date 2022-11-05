const Company = require('../company/company.model');
const Utils = require('../../../helpers/utils');
const utils = new Utils();
const File = require('./Upload');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Document = require('./document.model');
const PDF = require('../docs/PDF');

/**
 * Company Login.
 */

const getDocumentByCompanyId = async (id) => {
	return utils.join(
		'document',
		{
			from: 'company',
			localField: '_id',
			foreignField: 'companyId',
			as: 'documents'
		},
		{ companyId: id }
	);
};

const saveDocument = async (id, data) => {
	const document = new Document({
		companyId: id,
		...data
	});

	return await document.save();
};

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
				jsonResult = utils.getJsonResponse(true, 'Users list.', users);
			} else {
				jsonResult = utils.getJsonResponse(false, 'Users list not found.', null);
			}
			res.send(jsonResult);
		})
		.catch((e) => next(e));
}

const uploadRegistrationDocuments = async (req, res) => {
	// or module.exports = async (req, res) => {
	try {
		const companyName = req.query.companyName;
		const companyId = req.query.companyId;
		const docType = req.query.docType;
		if (companyName === '' || docType === '' || companyId === '') {
			return res.status(500).json({
				success: false,
				data: null,
				message: 'Please provide companyName, companyId, docType in query string'
			});
		}

		const directoryName = `${companyName}`;
		let files = await File.upload(req, directoryName);

		const data = await saveDocument(companyId, {
			companyId,
			docType,
			docUrl: files[0].Location
		});

		res.status(200).json({
			success: true,
			data: data,
			message: 'File(s) uploaded successfully'
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, data: null, message: err.message });
	}
};

const downloadResolutionForm = async (req, res) => {
	try {
		const {
			director_designation,
			director_name,
			id,
			name,
			email,
			registered_address,
			contact_number,
			isin,
			date_of_application,
			place_of_application
		} = req.body;
		const filePath = path.join(__dirname, '../DocumentsHTML/Board_Resolution.ejs');
		const fileName = `Board_Resolution_${id}.pdf`;
		const pdfData = await PDF.generatePdf(filePath, {
			name,
			email,
			registered_address,
			contact_number,
			isin,
			date_of_application,
			place_of_application,
			directors,
			fileName
		});
		res.contentType('application/pdf');
		res.header('Content-Length', '' + pdfData.length);
		fs.unlinkSync(fileName);
		return res.send(utils.getJsonResponse(true, 'Generated Pdf', pdfData));
	} catch (e) {
		return res.send(utils.getJsonResponse(false, e, null));
	}
};

const processDocuments = async (params) => {

	return new Promise((resolve, reject) => {
		const processDocType = [
			'GST_Declaration',
			'RTA_Appointment_Letter_for_Equity',
			'RTA_Registration_form',
			'Undertaking_for_Balance_Sheet',
			'Undertaking_For_Private_Ltd_Co',
			'Tripartite_Agreement_Franking_Fillable'
		];
		try {
			const {
				name,
				email,
				isin,
				id,
				directors,
				contact_number,
				registered_address,
				date_of_application,
				place_of_application
			} = params;
			const processedDocs = processDocType.map(async (element, index) => {
				const filePath = path.join(__dirname, `../DocumentsHTML/${element}.ejs`);
				const directoryName = `${name}`;
				const fileName = `${element}_${id}.pdf`;
				const pdfData = await PDF.generatePdf(filePath, {
					name,
					email,
					registered_address,
					contact_number,
					isin,
					date_of_application,
					place_of_application,
					directors,
					fileName
				});
				let files = await File.uploadToS3(
					pdfData,
					{
						fileName,
						fileType: 'application/pdf',
						encoding: 'text/html; charset=utf-8'
					},
					directoryName
				);
				fs.unlinkSync(fileName);
				return await saveDocument(id, {
					companyId: id,
					docType: element,
					docUrl: files.Location
				});
			});

			Promise.all(processedDocs).then(res => {
				console.log("All Documents processed...");
				return resolve(res);
			}).catch(err => {
				console.log("Document processed err:", err);
				reject(err);
			});

		} catch (e) {
			console.log("Error in process: ", e);
			reject(e);
		}

	});
};

module.exports = {
	list,
	downloadResolutionForm,
	getDocumentByCompanyId,
	uploadRegistrationDocuments,
	processDocuments
};
