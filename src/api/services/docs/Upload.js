const Utils = require("../../../helpers/utils");
const AWS = require("../AWS/aws");
const Busboy = require("busboy");
const fs = require("fs");
const S3 = AWS.S3();
const bucketName = "share-holding-docs";

const parseForm = async (req) => {
	return new Promise((resolve, reject) => {
		const form = Busboy({
			headers: req.headers,
			limits: { fileSize: 10 * 1024 * 1024 },
		});
		const files = []; // create an empty array to hold the processed files
		const buffers = {}; // create an empty object to contain the buffers
		form.on("file", (field, file, filename, enc, mimeType) => {
			buffers[field] = []; // add a new key to the buffers object
			file.on("data", (data) => {
				buffers[field].push(data);
			});
			file.on("end", () => {
				files.push({
					fileBuffer: Buffer.concat(buffers[field]),
					fileType: mimeType,
					fileName: filename,
					fileEnc: enc,
				});
			});
		});
		form.on("error", (err) => {
			reject(err);
		});
		form.on("finish", () => {
			resolve(files);
		});
		req.pipe(form); // pipe the request to the form handler
	});
};

const uploadFile = async (buffer, fileParams, companyId) => {
	// or module.exports = (buffer, fileParams) => {
	return new Promise((resolve, reject) => {
		const params = {
			Bucket: bucketName,
			Key: companyId + "/" + fileParams.fileName.filename,
			Body: buffer,
			ContentType: fileParams.fileType,
			ContentEncoding: fileParams.fileEnc,
		};
		S3.upload(params, (err, s3res) => {
			if (err) {
				return reject(err);
			} else {
				resolve(s3res);
			}
		});
	});
};

const uploadDocs = async (req, res) => {
	// or module.exports = async (req, res) => {
	try {
		const companyId = req.query.companyId;
		if (companyId === "") {
			return res.status(500).json({
				success: false,
				data: null,
				message: "companyId is required in query string",
			});
		}
		const files = await parseForm(req);

		const fileUrls = [];
		for (const file of files) {
			const { fileBuffer, ...fileParams } = file;
			const result = await uploadFile(fileBuffer, fileParams, companyId);
			fileUrls.push(result);
		}
		res.status(200).json({
			success: true,
			data: fileUrls,
			message: "File(s) uploaded successfully",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, data: null, message: err.message });
	}
};

const upload = async (req, res) => {
	return new Promise(async (resolve, reject) => {
		try {
			const files = await parseForm(req);
			const companyId = req.body.companyId;
			const fileUrls = [];
			for (const file of files) {
				const { fileBuffer, ...fileParams } = file;
				const result = await uploadFile(fileBuffer, fileParams, companyId);
				fileUrls.push(result);
			}
			resolve(fileUrls);
		} catch (err) {
			reject(err);
		}
	});
};

const uploadRegistrationDocuments = async (req, res) => {
	// or module.exports = async (req, res) => {
	try {
		const companyId = req.query.companyId;
		if (companyId === "") {
			return res.status(500).json({
				success: false,
				data: null,
				message: "companyId is required in query string",
			});
		}
		const files = await parseForm(req);

		const fileUrls = [];
		for (const file of files) {
			const { fileBuffer, ...fileParams } = file;
			const result = await uploadFile(fileBuffer, fileParams, companyId);
			fileUrls.push(result);
		}
		res.status(200).json({
			success: true,
			data: fileUrls,
			message: "File(s) uploaded successfully",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, data: null, message: err.message });
	}
};

module.exports = {
	upload,
	uploadDocs,
	uploadRegistrationDocuments,
};
