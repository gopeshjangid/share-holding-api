const Company = require('./company.model');
const Utils = require('../../../helpers/utils');
const utils = new Utils();
const File = require('../docs/Upload');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const ejs = require('ejs');
const path = require('path');
const moment = require('moment');
const { registrationValidation } = require('./validations');
const { processDocuments } = require('../docs/document.controller');
/**
 * Company Login.
 */
async function companyLogin(req, res, next) {
    const { pan, password } = req.body;
    if (pan === '') {
        return res.send(utils.getJsonResponse(false, 'PAN is required.', null));
    }

    if (password === '') {
        return res.send(utils.getJsonResponse(false, 'Password is required.', null));
    }
    Company.findOne({ pan, password })
        .then(async (user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            let jsonResult;
            if (user) {
                user.token = jwtToken.createToken(user?._id, user?.email, user.password);
                jsonResult = utils.getJsonResponse(true, 'Company logged in successfully.', user);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Company not found.', null);
            }
            return res.send(jsonResult);

            // return next();
        })
        .catch((e) => {
            console.log('company login error: ', e);
            res.send(utils.getJsonResponse(false, e, null));
        });
}

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
    Company.get(id)
        .then((user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch((e) => next(e));
}

/**
 * Get user
 * @returns {Company}
 */
async function get(req, res, next) {
    let decodedToken = await jwtToken.decodedToken(req, res);
    let userId = req?.query?.userId ? req?.query?.userId : decodedToken?._id;
    Company.get(userId)
        .then(async (user) => {
            let jsonResult;
            if (user) {
                jsonResult = utils.getJsonResponse(true, 'Company details.', user);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Company detail not found.', null);
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
 * @returns {Company}
 */
async function registration(req, res, next) {
    const valid = await registrationValidation(req.body);
    if (valid.length) {
        return res.send(utils.getJsonResponse(false, `${valid.join(', ')} required`, null));
    }
    const user = new Company({
        name: req?.body?.name,
        email: req?.body?.email,
        cin: req?.body?.cin,
        gsttin: req?.body?.gsttin,
        correspondence_address: req?.body?.correspondence_address,
        registered_address: req?.body?.registered_address,
        place_of_application: req?.body?.place_of_application,
        date_of_application: req?.body?.date_of_application,
        contact_number: req?.body?.contact_number,
        website: req?.body?.website,
        pan: req?.body?.pan,
        directors: req?.body?.directors,
        password: req?.body?.password,
        isin: req?.body?.isin,
        status: req.body.status,
        company_type: req.body.company_type,
        gst: req?.body?.gst
    });

    let isCinExists = await Company.findOne({ cin: req?.body?.cin });
    if (isCinExists) {
        res.send(utils.getJsonResponse(false, 'Company already registered with same cin.', null));
    } else {
        user.save()
            .then(async (savedCompany) => {
                savedCompany.token = await jwtToken.createToken(
                    savedCompany?._id,
                    savedCompany?.email,
                    savedCompany?.name
                );
                // const htmlToSend = await ejs.renderFile(
                // 	path.join(__dirname, "../../../../signup.ejs"),
                // 	{
                // 		name: savedUser?.name,
                // 		email: savedUser?.email,
                // 		username: savedUser?.username,
                // 	}
                // );
                // await utils.sendEmail({
                // 	email: savedUser?.email,
                // 	subject: "Sign up has been completed",
                // 	text: htmlToSend,
                // });
                const processedDocuments = await processDocuments(savedCompany);
                res.send(
                    utils.getJsonResponse(true, 'Company registered successfully.', {
                        ...savedCompany?._doc,
                        document: processedDocuments
                    })
                );
            })
            .catch(async (err) => {
                console.log('Error:', err);
                res.send(utils.getJsonResponse(false, err, null));
            });
    }
}

async function update(req, res, next) {
    try {
        let userId = req?.body?.userId;
        if (userId) {
            isUserIdExists = await Company.findOne({ _id: ObjectId(userId) });
            if (isUserIdExists) {
            } else {
                let jsonResult = utils.getJsonResponse(false, 'Company Id Not exists.', null);
                return res.send(jsonResult);
            }
            condition = { _id: ObjectId(userId) };
            let set = {};
            if (userId) {
                for (let [key, val] of Object.entries(req?.body)) {
                    set[key] = val;
                }
            }
            Company.findOneAndUpdate({ _id: ObjectId(userId) }, { $set: set }, { new: true })
                .then(async (savedUser) => {
                    let jsonResult = utils.getJsonResponse(true, 'Company updated successfully.', savedUser);
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
            let jsonResult = utils.getJsonResponse(false, 'Please send userId ', {});
            res.send(jsonResult);
        }
    } catch (err) {
        let jsonResult = utils.getJsonResponse(false, err, {});
        res.send(jsonResult);
    }
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Company[]}
 */
function list(req, res, next) {
    const { limit = 50, skip = 0 } = req?.query;
    Company.list({ limit, skip })
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

/**
 * Delete user.
 * @returns {Company}
 */
function remove(req, res, next) {
    const user = req.user;
    user.remove()
        .then((deletedUser) => res.json(deletedUser))
        .catch((e) => next(e));
}

/**
 * Send Email.
 * @returns {Company}
 */
function sendEmail(req, res, next) {
    utils.sendEmail({
        email: 'lavish.tyagi@theappbrewery.com',
        subject: 'Your payment status',
        text: 'texting email'
    });
}

const getDocument = async (req, res, next) => {
    let fileName = req?.query?.fileName;
    let directory = req?.query?.directory;
    await File.readFromS3({ directory, fileName, dockType: 'pdf' })
        .then((response) => {
            let jsonResult;
            res.contentType('application/pdf');
            res.header('Content-Length', '' + response.length);
            if (response) {
                jsonResult = utils.getJsonResponse(true, 'Generated Pdf', response);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Document not found.', null);
            }
            res.send(jsonResult);
        })
        .catch((e) => next(e));
};

module.exports = {
    companyLogin,
    load,
    get,
    registration,
    update,
    list,
    remove,
    sendEmail,
    getDocument
};
