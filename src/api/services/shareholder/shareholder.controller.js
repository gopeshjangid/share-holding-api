const Shareholder = require('./shareholder.model');
const ShareholderDocs = require('./shareholder_docs.model');
const Utils = require('../../../helpers/utils');
const utils = new Utils();
const File = require('../docs/Upload');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const ejs = require('ejs');
const fs = require('fs');
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

    let isCinExists = await Shareholder.findOne({ phoneNumber: req?.body?.phoneNumber });
    if (isCinExists) {
        res.send(utils.getJsonResponse(false, 'Shareholder already registered with same mobile number.', null));
    } else {
        let isPanExists = await Shareholder.findOne({ panNo: req?.body?.panNo });
        if (isPanExists) {
            res.send(utils.getJsonResponse(false, 'Shareholder already registered with same PAN number.', null));
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
}

const saveShareholderDoc = async (id, data) => {
    const document = new ShareholderDocs({
        shareholderId: id,
        ...data
    });

    return await document.save();
};

const uploadShareholderDocuments = async (req, res) => {
    try {
        const pan = req.query.pan;
        const shareholderId = req.query.shareholderId;
        if (pan === '' || shareholderId === '') {
            return res.status(500).json({
                success: false,
                data: null,
                message: 'Please provide pan, shareholderId in query string'
            });
        }

        const directoryName = `${pan}`;
        let files = await File.upload(req, directoryName);

        const data = await saveShareholderDoc(shareholderId, {
            shareholderId,
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

module.exports = {
    registration,
    uploadShareholderDocuments
};
