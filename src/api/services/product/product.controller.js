const Product = require('./product.model');
const Utils = require('../../../helpers/utils');
const utils = new Utils();
const JwtToken = require('../../middleware/jwt');
const jwttoken = new JwtToken();
const Busboy = require('busboy');
const AWS = require('../AWS/aws');
var mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const fs = require('fs');

const S3 = AWS.S3();

/**
 * Load product and append to req.
 */
function load(req, res, next, id) {
    Product.get(id)
        .then((product) => {
            req.product = product; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch((e) => next(e));
}

/**
 * Get product
 * @returns {Product}
 */
async function get(req, res, next) {
    let productId = req?.query?.productId;
    Product.get(productId)
        .then(async (product) => {
            let jsonResult;
            if (product) {
                jsonResult = utils.getJsonResponse(true, 'Product details.', product);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Product detail not found.', null);
            }
            return res.json(jsonResult);
        })
        .catch((e) => next(e));
}

async function uploadProductImages(req, res, next) {
    return new Promise(async (resolve, reject) => {
        try {
            let images = [];
            var isFileUploaded = false;
            const buffers = {};
            req.body['images'] = [];
            let chunks = [],
                fname,
                ftype,
                fEncoding,
                fieldname;
            let bb = Busboy({
                headers: req.headers,
                limits: { fileSize: 15 * 1024 * 1024 }
            });
            bb.on('field', async (field, val, info) => {
                req.body[field] = val;
                let isProductIdExists = null;
                if (field == 'productId') {
                    isProductIdExists = await Product.findOne({ _id: ObjectId(val) });
                    if (isProductIdExists == null) {
                        let jsonResult = utils.getJsonResponse(false, 'Product Id Not exists.', null);
                        return res.send(jsonResult);
                    }
                }
                if (field == 'imageUrl' && val != '') {
                    images.push(val);
                    req.body['images'].push(val);
                }
                if (field == 'images' && val == '') {
                    req.body['images'] = images;
                }
            });

            bb.on('file', (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                isFileUploaded = true;
                console.log(`File [${name}]: filename: %j, encoding: %j, mimeType: %j`, filename, encoding, mimeType);
                fname = filename.replace(/ /g, '_');
                ftype = mimeType;
                fEncoding = encoding;
                if (
                    mimeType == 'image/jpg' ||
                    mimeType == 'image/jpeg' ||
                    mimeType == 'image/png' ||
                    mimeType == 'image/gif' ||
                    mimeType == 'application/illustrator' ||
                    mimeType == 'application/postscript'
                ) {
                } else {
                    file.resume();
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file format. Please upload png or jpg file',
                        data: null
                    });
                }
                file.on('limit', function (data) {
                    return res.json({
                        status: 400,
                        success: false,
                        message: `You can not upload more than 15MB.`,
                        data: null
                    });
                });

                let key = Date.now() + String(process.hrtime()[1]);
                const params = {
                    Bucket: 'vargabucket', // your s3 bucket name
                    Key: `products/${req.body.productId}/${key}.png`,
                    Body: file, // concatinating all chunks
                    ACL: 'public-read',
                    ContentType: ftype // required
                };
                S3.upload(params, (err, s3res) => {
                    if (err) {
                        return reject(err);
                    } else {
                        req.body['images'].push(s3res.Location);
                        setTimeout(() => {
                            return resolve(s3res);
                        }, 1000);
                    }
                });
                file.on('data1', (data) => {
                    chunks.push(data);
                }).on('close', () => {});
            });
            bb.on('finish', function () {
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

/**
 * Upload product images
 * @property {array} req?.body?.images - The images of product.
 * @property {string} req?.body?.productId - The basePrice of product.
 * @returns {Product}
 */
async function uploadImages(req, res, next) {
    try {
        let decodedToken = await jwttoken.decodedToken(req, res);
        let userType = decodedToken?.userType;
        let uploaded = await uploadProductImages(req, res, next);
        if (Array.isArray(req?.body?.images)) {
            let set = {
                images: req?.body?.images
            };
            Product.findOneAndUpdate({ _id: ObjectId(req?.body?.productId) }, { $set: set }, { new: true })
                .then(async (savedProduct) => {
                    let jsonResult = utils.getJsonResponse(true, 'Product updated successfully.', savedProduct);
                    res.send(jsonResult);
                })
                .catch(async (err) => {
                    if (err) {
                        if (err.name == 'ValidationError') {
                            for (field in err.errors) {
                                let jsonResult = utils.getJsonResponse(false, err.errors[field].message, null);
                                res.send(jsonResult);
                            }
                        }
                    }
                });
        } else {
            let jsonResult = utils.getJsonResponse(false, 'image field might have incorrect values', null);
            res.send(jsonResult);
        }
    } catch (err) {
        let jsonResult = utils.getJsonResponse(false, err, {});
        res.send(jsonResult);
    }
}

/**
 * Create new product
 * @property {string} req?.body?.name - The name of product.
 * @property {string} req?.body?.status - The status of product.
 * @property {array} req?.body?.images - The images of product.
 * @property {string} req?.body?.basePrice - The basePrice of product.
 * @property {string} req?.body?.rangePrice - The rangePrice of product.
 * @returns {Product}
 */
async function create(req, res, next) {
    try {
        let decodedToken = await jwttoken.decodedToken(req, res);
        const product = new Product({
            name: req?.body?.name,
            images: req?.body?.images,
            basePrice: req?.body?.basePrice,
            rangePrice: req?.body?.rangePrice,
            options: req?.body?.options,
            status: req?.body?.status,
            productDescription: req?.body?.productDescription
        });

        let productId = req?.body?.productId;
        var isProductExists = null;
        if (!productId) {
            isProductExists = await Product.findOne({ name: req?.body?.name });
        }

        if (isProductExists != null) {
            let jsonResult = utils.getJsonResponse(false, 'Product already exists.', null);
            return res.send(jsonResult);
        } else {
            let condition = '';
            let isProductIdExists = null;
            if (productId) {
                isProductIdExists = await Product.findOne({ _id: ObjectId(productId) });
                if (isProductIdExists) {
                    isProductIdWithNameExists = await Product.findOne({
                        name: req?.body?.name,
                        _id: ObjectId(productId)
                    });
                    isProductExists = await Product.findOne({ name: req?.body?.name });
                    if (isProductExists != null && isProductIdWithNameExists == null) {
                        let jsonResult = utils.getJsonResponse(false, 'Product already exists.', null);
                        return res.send(jsonResult);
                    }
                } else {
                    let jsonResult = utils.getJsonResponse(false, 'Product Id Not exists.', null);
                    return res.send(jsonResult);
                }
                condition = { _id: ObjectId(productId) };
                let set = {
                    name: req?.body?.name,
                    basePrice: req?.body?.basePrice,
                    rangePrice: req?.body?.rangePrice,
                    options: req?.body?.options,
                    status: req?.body?.status,
                    productDescription: req?.body?.productDescription
                };

                Product.findOneAndUpdate({ _id: ObjectId(productId) }, { $set: set }, { new: true })
                    .then(async (savedProduct) => {
                        let jsonResult = utils.getJsonResponse(true, 'Product updated successfully.', savedProduct);
                        res.send(jsonResult);
                    })
                    .catch(async (err) => {
                        if (err) {
                            if (err.name == 'ValidationError') {
                                for (field in err.errors) {
                                    let jsonResult = utils.getJsonResponse(false, err.errors[field].message, null);
                                    res.send(jsonResult);
                                }
                            }
                        }
                    });
            } else {
                product
                    .save()
                    .then(async (savedProduct) => {
                        let jsonResult = utils.getJsonResponse(true, 'Product added successfully.', savedProduct);
                        res.send(jsonResult);
                    })
                    .catch(async (err) => {
                        if (err) {
                            if (err.name == 'ValidationError') {
                                for (field in err.errors) {
                                    let jsonResult = utils.getJsonResponse(false, err.errors[field].message, null);
                                    res.send(jsonResult);
                                }
                            }
                        }
                    });
            }
        }
    } catch (err) {
        console.log('err =>', err);
        let jsonResult = utils.getJsonResponse(false, err, {});
        res.send(jsonResult);
    }
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function update(req, res, next) {
    const user = req.user;
    user.username = req.body.username;
    user.mobileNumber = req.body.mobileNumber;

    user.save()
        .then((savedProduct) => res.json(savedProduct))
        .catch((e) => next(e));
}

/**
 * Get product list.
 * @property {number} req.query.skip - Number of products to be skipped.
 * @property {number} req.query.limit - Limit number of products to be returned.
 * @returns {Products[]}
 */
function list(req, res, next) {
    const { limit = 50, skip = 0 } = req?.query;
    Product.list({ limit, skip })
        .then(async (products) => {
            let jsonResult;
            if (products) {
                jsonResult = utils.getJsonResponse(true, 'Products list.', products);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Products list not found.', null);
            }
            res.send(jsonResult);
        })
        .catch((e) => next(e));
}

/**
 * Delete product.
 * @returns {Product}
 */
function remove(req, res, next) {
    const product = req.product;
    product
        .remove()
        .then((deletedProduct) => res.json(deletedProduct))
        .catch((e) => next(e));
}

module.exports = { load, get, create, uploadImages, update, list, remove };
