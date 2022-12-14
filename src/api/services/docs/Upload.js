const Utils = require('../../../helpers/utils');
const AWS = require('../AWS/aws');
const Busboy = require('busboy');
const fs = require('fs');
const S3 = AWS.S3();
const bucketName = 'share-holding-docs';
const Document = require('./document.model');
const archiver = require('archiver');
const join = require('path').join;

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
            status: true,
            data: fileUrls,
            message: 'File(s) uploaded successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, data: null, message: err.message });
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

const downloadZipS3Documents = async (paths = [], bucketName) => {
    return new Promise(async (resolve, reject) => {
        if (!bucketName) {
            return reject('Provide bucket name');
        }
        if (paths.length === 0) {
            return reject('Please provide valid paths arrya');
        }

        let zip = new archiver.create('zip');
        try {
            const downloadFilesFromS3 = async (key, fileName) => {
                return new Promise((resolve, reject) => {
                    S3.getObject({ Bucket: bucketName, Key: key }, function (err, data) {
                        if (err) {
                            if (err.statusCode !== 404) {
                                console.error('S3 Error: ', err);
                                reject('Some files are not available');
                            } else {
                                resolve(false);
                            }
                        } else {
                            zip.append(data.Body, {
                                name: fileName
                            });
                            resolve(data.Body);
                        }
                    });
                });
            };
            const new_paths = paths.map(async (path, index) => {
                const str = path.split('/');
                str.splice(0, 3);
                const fileName = str[1];
                const key = str.join('/');
                console.info('File key', key);
                const data = await downloadFilesFromS3(key, fileName);
                return data;
            });
            //})

            Promise.all(new_paths).then((data) => {
                if (data.every((file) => !file)) {
                    reject('Data is not found !');
                } else {
                    zip.finalize();
                    resolve(zip);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

//zip download

/* let readZipFromS3 = function (fileName = 'undertaking_for_private_ltd_co.pdf') {
    return new Promise(function (resolve, reject) {
        let bucketName = 'share-holding-docs';
        const params = {
            Bucket: bucketName,
            Prefix: `U74999DL201F57`
        };
        S3.listObjects(params, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                data.Contents.forEach(async function(obj,index) {
                    let getres = await getZipFromS3(bucketName, obj.Key);
                    console.log(obj.Key,"<<<file path", getres);
                    resolve(getres);
                })
            }
        });
    });
};

const getZipFromS3 = async (bucketName, fileName) => {
    console.log(bucketName, fileName,'---')
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            // Key: `${directory}/${fileName}.${dockType}`
            Key: `${fileName}`
        };

        S3.getObject(params, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                resolve(data.Body);
            }
        });
    });
}; */

const getZipFromS3 = async (params) => {
    return new Promise((resolve, reject) => {
        S3.listObjects(params, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                resolve(data.Contents);
            }
        });
    });
};

const getMultiFiles = async (files) => {
    return new Promise((resolve, reject) => {
        S3.listObjects(params, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                resolve(data.Contents);
            }
        });
    });
};

const readZipFromS3 = async (bucketName = 'share-holding-docs', prefix = 'U74999DL201F57') => {
    return new Promise(async (resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Prefix: prefix
        };
        S3.listObjects(params, function (err, data) {
            if (err) return console.log(err);

            data.Contents.forEach(
                async function (fileObj, callback) {
                    var key = fileObj.Key;
                    console.log('Downloading: ' + key);

                    var fileParams = {
                        Bucket: bucketName,
                        Key: key
                    };

                    S3.getObject(fileParams, function (err, fileContents) {
                        if (err) {
                            callback(err);
                        } else {
                            // Read the file
                            var contents = fileContents.Body.toString();

                            // Do something with file

                            callback(fs.writeFile(contents));
                        }
                    });
                },
                function (err) {
                    if (err) {
                        console.log('Failed: ' + err);
                    } else {
                        console.log('Finished');
                    }
                }
            );
        });

        /*
        const filesArray = []
        const files = S3.listObjects(params).createReadStream()
        const xml = new XmlStream(files)
        xml.collect('Key')
        xml.on('endElement: Key', function(item) {
        filesArray.push(item['$text'].substr(folder.length))
        })
 
        xml
        .on('end', function () {
            zip(filesArray)
        })
        const output = fs.createWriteStream(join(__dirname, 'use-s3-zip.zip'))
        let res = s3Zip.archive({region: 'us-east-2', bucket: bucketName}, prefix, files)
        .pipe(output);
        resolve(res);
        */
    });
};

module.exports = {
    upload,
    uploadToS3,
    uploadDocs,
    readFromS3,
    removeBasket,
    readZipFromS3,
    downloadZipS3Documents
};
