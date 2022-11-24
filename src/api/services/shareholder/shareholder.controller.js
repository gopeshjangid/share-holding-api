const Shareholder = require('./shareholder.model');
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
const { shareholderValidation } = require('./validations');

/**
 * Create new shareholder
 * @property {number} req?.body?.panNo - The pan number of shareholder.
 * @property {Date} req?.body?.dob - The dob of shareholder.
 * @property {number} req?.body?.aadhaarNo - The aadhaar number of shareholder.
 * @property {number} req?.body?.phoneNumber - The phone number of shareholder.
 * @property {string} req?.body?.emailAddress - The email of shareholder.
 * @property {string} req?.body?.occupation - The occupation of shareholder.
 * @property {string} req?.body?.annualIncome - The annual income of shareholder.
 * @property {string} req?.body?.gender - The gender of shareholder.
 * @property {string} req?.body?.maritalStatus - The marital status of shareholder.
 * @property {string} req?.body?.firstName - The first name of shareholder.
 * @property {string} req?.body?.middleName - The middle name of shareholder.
 * @property {string} req?.body?.lastName - The last name of shareholder.
 * @property {string} req?.body?.fathersFirstName - The father first name of shareholder.
 * @property {string} req?.body?.fathersMiddleName - The father middle name of shareholder.
 * @property {string} req?.body?.fathersLastName - The father last name of shareholder.
 * @returns {Shareholder}
 */
 async function registration(req, res, next) {
    const valid = await shareholderValidation(req.body);
    if (valid.length) {
        return res.send(utils.getJsonResponse(false, `${valid.join(', ')} required`, null));
    }
    const user = new Shareholder({
        panNo: req?.body?.panNo,
        dob: req?.body?.dob,
        aadhaarNo: req?.body?.aadhaarNo,
        phoneNumber: req?.body?.phoneNumber,
        emailAddress: req?.body?.emailAddress,
        occupation: req?.body?.occupation,
        annualIncome: req?.body?.annualIncome,
        gender: req?.body?.gender,
        maritalStatus: req?.body?.maritalStatus,
        firstName: req?.body?.firstName,
        middleName: req?.body?.middleName,
        lastName: req?.body?.lastName,
        fathersFirstName: req?.body?.fathersFirstName,
        fathersMiddleName: req?.body?.fathersMiddleName,
        fathersLastName: req.body.fathersLastName
    });

    let isCinExists = await Shareholder.findOne({ emailAddress: req?.body?.emailAddress });
    if (isCinExists) {
        res.send(utils.getJsonResponse(false, 'Shareholder already registered with same email address.', null));
    } else {
        user.save()
            .then(async (savedShareholder) => {
                res.send(
                    utils.getJsonResponse(true, 'Shareholder registered successfully.', {
                        ...savedShareholder?._doc
                    })
                );
            })
            .catch(async (err) => {
                console.log('Error:', err);
                res.send(utils.getJsonResponse(false, err, null));
            });
    }
}

module.exports = {
    registration
};