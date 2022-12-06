const User = require('./broker.model');
const Shareholder = require('../shareholder/shareholder.model');
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

/**
 * Broker Login.
 */
async function brokerLogin(req, res, next) {
    const { email, password, user_type } = req.body;
    if (email === '' || email === undefined) {
        return res.send(utils.getJsonResponse(false, 'PAN is required.', null));
    }
    if (password === '' || password === undefined) {
        return res.send(utils.getJsonResponse(false, 'Password is required.', null));
    }
    if (user_type === '' || user_type === undefined) {
        return res.send(utils.getJsonResponse(false, 'User type is required.', null));
    }

    User.findOne({ email, password, user_type, status: 'ACTIVE' })
        .then(async (user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            let jsonResult;
            if (user) {
                user.token = jwtToken.createToken(user?._id, user?.email, user.password);
                jsonResult = utils.getJsonResponse(true, 'User logged in successfully.', user);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Invalid credential!.', null);
            }
            return res.send(jsonResult);

            // return next();
        })
        .catch((e) => {
            console.log('User login error: ', e);
            res.send(utils.getJsonResponse(false, e, null));
        });
}

async function getShareholderByStatus(req, res, next) {
    const { status } = req?.query;
    if (status === '' || status === undefined) {
        return res.send(utils.getJsonResponse(false, 'Status is required.', null));
    }
    Shareholder.aggregate([
        {
            $lookup: {
                from: 'shareholderdocs',
                localField: '_id',
                foreignField: 'shareholderId',
                as: 'docsdetails'
            }
        },
        {
            $match: { status: status }
        },
        {
            $project: {
                otp: 0,
                token: 0
            }
        }
    ])
        .then(async (user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            let jsonResult;
            if (user) {
                user.token = jwtToken.createToken(user?._id, user?.email, user.password);
                jsonResult = utils.getJsonResponse(true, 'Shareholder list.', user);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Invalid status!.', null);
            }
            return res.send(jsonResult);

            // return next();
        })
        .catch((e) => {
            console.log('User login error: ', e);
            res.send(utils.getJsonResponse(false, e, null));
        });
}

async function updateShareholderStatus(req, res) {
    let shareholderID = req?.body?.shareholderID;
    let status = req?.body?.status;
    try {
        if(shareholderID === '' || shareholderID === undefined) {
            $message = 'Please select shareholder id.';
            let jsonResult = utils.getJsonResponse(false, $message, {});
            res.send(jsonResult);
        }else if(status === '' || status === undefined){
            $message = 'Please enter status.';
            let jsonResult = utils.getJsonResponse(false, $message, {});
            res.send(jsonResult);
        } else {
            const savedRemark = await Shareholder.findByIdAndUpdate({_id:ObjectId(shareholderID)},{status:status});
            if(savedRemark){
                res.send(
                    utils.getJsonResponse(true, 'Shareholder status updated successfully.', savedRemark)
                );
            }else{
                res.send(
                    utils.getJsonResponse(false, 'Shareholder does not exists.',null)
                );
            }   
        }
    } catch (err) {
        let jsonResult = utils.getJsonResponse(false, err, {});
        res.send(jsonResult);
    }
}

module.exports = {
    brokerLogin,
    getShareholderByStatus,
    updateShareholderStatus
};
