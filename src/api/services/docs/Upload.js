const Utils = require('../../../helpers/utils');
const AWS = require('../AWS/aws');
const Busboy = require('busboy');
const fs = require('fs');
const S3 = AWS.S3();
const bucketName = 'share-holding-docs';
const Document = require('./document.model');
const parseForm = async (req) => {
    return new Promise((resolve, reject) => {
        const form = Busboy({
            headers: req.headers,
            limits: { fileSize: 50 * 1024 * 1024 }
        });
        const files = []; // create an empty array to hold the processed files
        const buffers = {}; // create an empty object to contain the buffers
        form.on('file', (field, file, filename, enc, mimeType) => {
            buffers[field] = []; // add a new key to the buffers object
            file.on('data', (data) => {
                buffers[field].push(data);
            });
            file.on('end', () => {
                files.push({
                    fileBuffer: Buffer.concat(buffers[field]),
                    fileType: mimeType,
                    fileName: filename,
                    fileEnc: enc
                });
            });
        });
        form.on('error', (err) => {
            reject(err);
        });
        form.on('finish', () => {
            resolve(files);
        });
        req.pipe(form); // pipe the request to the form handler
    });
};

const uploadToS3 = async (buffer, { fileType, encoding, fileName }, directory, bucketName = 'share-holding-docs') => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: directory + '/' + fileName,
            Body: buffer,
            ContentType: fileType
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

const readFromS3 = ({ directory, fileName, dockType }) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: `${directory}/${fileName}.${dockType}`
        };

        S3.getObject(params, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                resolve(data.Body);
            }
        });
    });
};

// this is for uploading any document from frontend

const uploadDocs = async (req, res) => {
    // or module.exports = async (req, res) => {
    try {
        const directory = req.query.directory;
        const files = await parseForm(req);
        const fileUrls = [];
        for (const file of files) {
            const { fileBuffer, ...fileParams } = file;
            const result = await uploadToS3(
                fileBuffer,
                {
                    fileName: fileParams.fileName.filename,
                    fileType: fileParams.fileName.mimeType,
                    encoding: fileParams.fileName.encoding
                },
                directory
            );
            fileUrls.push(result);
        }
        res.status(200).json({
            success: true,
            data: fileUrls,
            message: 'File(s) uploaded successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, data: null, message: err.message });
    }
};

// this is for uploading documents internally in backend
const upload = async (req, directory, bucketName = 'share-holding-docs') => {
    return new Promise(async (resolve, reject) => {
        try {
            const files = await parseForm(req);
            const fileUrls = [];
            for (const file of files) {
                const { fileBuffer, ...fileParams } = file;
                const result = await uploadToS3(
                    fileBuffer,
                    {
                        fileName: fileParams.fileName.filename,
                        fileType: fileParams.fileName.mimeType,
                        encoding: fileParams.fileName.encoding
                    },
                    directory,
                    bucketName
                );
                fileUrls.push(result);
            }
            resolve(fileUrls);
            Promise.all(fileUrls)
                .then((data) => resolve(data))
                .catch((err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};

//// For Remove the basket
const removeBasket = async ({ directory, fileName, dockType }) => {
    return new Promise(async (resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: `${directory}/${fileName}.${dockType}`
        };

        S3.deleteObject(params, function (err, data) {
            if (err) {
                return reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports = {
    upload,
    uploadToS3,
    uploadDocs,
    readFromS3,
    removeBasket
};
