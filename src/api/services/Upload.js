async function upload(req, res, next) {
	return new Promise(async (resolve, reject) => {
		try {
			var isFileUploaded = false;
			let chunks = [],
				fname,
				ftype,
				fEncoding,
				fieldname;
			let bb = Busboy({
				headers: req.headers,
				limits: { fileSize: 10 * 1024 * 1024 },
			});
			const fieldsName = {};
			bb.on("field", async (field, val, info) => {
				req.body[field] = val;
				fieldsName[field] = val;
			});

			bb.on("file", (name, file, info) => {
				const { filename, encoding, mimeType } = info;
				isFileUploaded = true;
				fname = filename.replace(/ /g, "_");
				ftype = mimeType;
				fEncoding = encoding;
				file.on("limit", function (data) {
					reject(`You can not upload more than 10MB.`);
				});
				let key = Date.now() + String(process.hrtime()[1]);
				const params = {
					Bucket: "vargabucket", // your s3 bucket name
					Key: `chatMedia/${key}/${filename}`,
					Body: file, // concatinating all chunks
					ACL: "public-read",
					ContentType: ftype, // required
				};
				S3.upload(params, (err, s3res) => {
					if (err) {
						return reject(err);
					} else {
						if (
							!req.body?.chatRoomId ||
							!req.body?.senderId ||
							!req.body?.type
						) {
							reject("chatRoomId, senderId and type are required");
						}
						const key =
							name === "videoThumbnail" ? "videoThumbnail" : "content";
						req.body[key] = s3res?.Location;
						console.log("req.body", req.body);
						if (
							req.body?.type === "video" &&
							req.body["videoThumbnail"] &&
							req.body["content"]
						) {
							return resolve(req.body);
						} else if (req.body?.type === "image") {
							return resolve(req.body);
						}
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
}

module.exports = {
	upload,
};
