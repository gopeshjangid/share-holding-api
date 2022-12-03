const User = require('./broker.model');
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
    const { pan, password } = req.body;
    if (email === '' || email === undefined) {
        return res.send(utils.getJsonResponse(false, 'PAN is required.', null));
    }
    if (password === '' || password === undefined) {
        return res.send(utils.getJsonResponse(false, 'Password is required.', null));
    }
    if (user_type === '' || user_type === undefined) {
        return res.send(utils.getJsonResponse(false, 'User type is required.', null));
    }

    User.findOne({ pan, password, user_type, status: 'ACTIVE' })
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

module.exports = {
    brokerLogin
};
