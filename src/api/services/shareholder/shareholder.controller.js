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
 * Shareholder Login.
 * @property {number} req?.body?.phoneNumber - The phone number of shareholder.
 * @property {number} req?.body?.panNo - The pan number of shareholder.
 * @property {string} req?.body?.shareholder_type - Shareholder type Like ('individual','joint','non-individual').
 * @returns {Shareholder}
 */
async function shareholderLogin(req, res, next) {
    const phoneNumber = req?.body?.phoneNumber;
    const shareholder_type = req?.body?.shareholder_type;
    const panNo = req?.body?.panNo;
    if (shareholder_type == 'individual') {
        if (phoneNumber === '' || phoneNumber === undefined) {
            return res.send(utils.getJsonResponse(false, 'Mobile number is required.', null));
        }
    } else {
        if (phoneNumber === '' || phoneNumber === undefined) {
            return res.send(utils.getJsonResponse(false, 'Mobile number is required.', null));
        }
        if (panNo === '' || panNo === undefined) {
            return res.send(utils.getJsonResponse(false, 'PAN number is required.', null));
        }
    }
    let otpCondition = {};
    if (shareholder_type == 'individual') {
        otpCondition = { phoneNumber: phoneNumber };
    } else {
        otpCondition = { phoneNumber: phoneNumber, panNo: panNo };
    }
    //console.log(otpCondition)
    Shareholder.findOne(otpCondition)
        .then(async (user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            let jsonResult;
            if (user) {
                //user.token = jwtToken.createToken(user?._id, user?.email, user.password);
                //////////// Create a OTP
                let otp;
                otp = Math.floor(100000 + Math.random() * 900000);
                var expiry = new Date();
                expiry.setMinutes(expiry.getMinutes() + 10);
                expiry = new Date(expiry);
                let shareholderData = await Shareholder.findOneAndUpdate(
                    { _id: user._id },
                    { otp: otp, otp_expiry: expiry }
                );
                if (shareholderData) {
                    let template = `<!DOCTYPE html>
                        <html>
                        <head>
                            <title></title>
                            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                            <style type="text/css">
                                body,
                                table,
                                td,
                                a {
                                    -webkit-text-size-adjust: 100%;
                                    -ms-text-size-adjust: 100%;
                                }
                        
                                table,
                                td {
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                }
                        
                                img {
                                    -ms-interpolation-mode: bicubic;
                                }
                        
                                img {
                                    border: 0;
                                    height: auto;
                                    line-height: 100%;
                                    outline: none;
                                    text-decoration: none;
                                }
                        
                                table {
                                    border-collapse: collapse !important;
                                }
                        
                                body {
                                    height: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    width: 100% !important;
                                }
                        
                                a[x-apple-data-detectors] {
                                    color: inherit !important;
                                    text-decoration: none !important;
                                    font-size: inherit !important;
                                    font-family: inherit !important;
                                    font-weight: inherit !important;
                                    line-height: inherit !important;
                                }
                        
                                @media screen and (max-width: 480px) {
                                    .mobile-hide {
                                        display: none !important;
                                    }
                        
                                    .mobile-center {
                                        text-align: center !important;
                                    }
                                }
                        
                                div[style*="margin: 16px 0;"] {
                                    margin: 0 !important;
                                }
                            </style>
                        
                        <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
                            <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                                For what reason would it be advisable for me to think about business content? That might be little bit risky to have crew member like them.
                            </div>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                             <tr>
                                <td align="center" valign="top" style="font-size:0; padding: 35px;" bgcolor="#4965db">
                                    <div style="display:inline-block; max-width:100%; min-width:100px; vertical-align:top; width:100%;" class="mobile-hide">
                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                            <tr>
                                                <td align="right" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; line-height: 48px;">
                                                    <table cellspacing="0" cellpadding="0" border="0" align="right">
                                                        <tr>
        
                                                            <td style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400;">MY SHAREHOLDING</td>
                                                            <td style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 24px;"> <a href="#" target="_blank" style="color: #ffffff; text-decoration: none;"></a> </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                                            <tr>
                                                <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 400; line-height: 24px; padding-top: 25px;"><br>
                                                                <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">OTP Verification </h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 400; line-height: 24px; padding-top: 25px;"><br>
                                                                <h2 style="font-size: 20px; font-weight: 400; line-height: 36px; color: #333333; margin: 0;"> You need to confirm your email. Just Copy the OTP from below. 
                                                                    <br>Your OTP is <b>${otp}</b>, valid for 10 minutes.
                                                                </h2>
                                                            </td>
                                                        </tr>
                                                       
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" height="100%" valign="top" width="100%" style="padding: 0 35px 35px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px;">
                                                        <tr>
                                                            <td align="center" valign="top" style="font-size:0;">
                                                                <div style="display:inline-block; max-width:50%; min-width:240px; vertical-align:top; width:100%;">
                                                                    
                                                                </div>
                                                                
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style=" padding: 35px; background-color: #fff;;" bgcolor="#fff">
                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                                        <tr>
                                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;">
                                                                <h2 style="font-size: 24px; font-weight: 800; line-height: 30px; color: #ffffff; margin: 0;">For any query </h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="padding: 25px 0 15px 0;">
                                                                <table border="0" cellspacing="0" cellpadding="0">
                                                                    <tr>
                                                                        <td align="center" style="border-radius: 5px;" bgcolor="#66b3b7"> <a href="#" target="_blank" style="font-size: 18px; font-family: Open Sans, Helvetica, Arial, sans-serif; color: #4965db; text-decoration: none; border-radius: 5px; background-color: #fff; padding: 15px 30px; border: 1px solid #4965db; display: block;">Contact US</a> </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding: 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                                        <tr>
                                                            <td align="center"> <img src="logo-footer.png" width="37" height="37" style="display: block; border: 0px;" /> </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 24px; padding: 5px 0 10px 0;">
                                                                <p style="font-size: 14px; font-weight: 800; line-height: 18px; color: #333333;"> 675 Parko Avenue<br> LA, CA 02232 </p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 24px;">
                                                                <p style="font-size: 14px; font-weight: 400; line-height: 20px; color: #777777;"> If you didn"t create an account using this email address, please ignore this email or <a href="#" target="_blank" style="color: #777777;">unsusbscribe</a>. </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>`;
                    utils.sendEmail({
                        email: shareholderData.emailAddress,
                        subject: 'Verify OTP',
                        text: template
                    });
                    jsonResult = utils.getJsonResponse(true, 'OTP mail sent successfully.', null);
                } else {
                    jsonResult = utils.getJsonResponse(false, 'Error while creating OTP.', null);
                }
            } else {
                jsonResult = utils.getJsonResponse(false, 'Shareholder not found.', null);
            }
            return res.send(jsonResult);
            // return next();
        })
        .catch((e) => {
            console.log('Share holder login error: ', e);
            res.send(utils.getJsonResponse(false, e, null));
        });
}

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
        const directoryName = req.query.directoryName;
        const shareholderId = req.query.shareholderId;
        const docType = req.query.docType;

        if (directoryName === '' || docType === '' || shareholderId === '') {
            return res.status(500).json({
                success: false,
                data: null,
                message: 'Please provide pan, shareholderId, docType in query string'
            });
        }

        let files = await File.upload(req, directoryName);
        const data = await saveShareholderDoc(shareholderId, {
            shareholderId,
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

module.exports = {
    shareholderLogin,
    registration,
    uploadShareholderDocuments
};
