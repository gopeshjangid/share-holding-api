const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

var validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

/**
 * User Schema
 */
const OTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: [true, 'email already exists in database!'],
            required: 'Email address is required',
            validate: [validateEmail, 'Please fill a valid email address'],
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        otp: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiryAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
            }
        }
    }
);

/**
 * Methods
 */
OTPSchema.method({});

/**
 * Statics
 */
OTPSchema.statics = {
    /**
     * Get OTP
     * @param {ObjectId} email - The objectId of OTP.
     * @returns {Promise<User, APIError>}
     */
    get(email) {
        return this.findByEmail(email)
            .exec()
            .then((otp) => {
                if (otp) {
                    return otp;
                }
                const err = new APIError('No such otp data exists!', httpStatus.NOT_FOUND);
                return Promise.reject(err);
            });
    }
};

/**
 * @typedef OTP
 */
module.exports = mongoose.model('Otp', OTPSchema);
