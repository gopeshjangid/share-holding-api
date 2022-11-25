const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

var validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};
/**
 * shareholder Schema
 */

const shareholderSchema = new mongoose.Schema(
    {
        panNo: {
            type: String,
            required: true
        },
        dob: {
            type: Date,
            required: true
        },
        aadhaarNo: {
            type: Number,
            required: true
        },
        phoneNumber: {
            type: Number,
            required: true
        },
        emailAddress: {
            type: String,
            trim: true,
            lowercase: true,
            required: 'Email address is required',
            validate: [validateEmail, 'Please fill a valid email address'],
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        occupation: {
            type: String,
            required: true
        },
        annualIncome: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true
        },
        maritalStatus: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        middleName: {
            type: String
        },
        lastName: {
            type: String,
            required: true
        },
        fathersFirstName: {
            type: String,
            required: true
        },
        fathersMiddleName: {
            type: String
        },
        fathersLastName: {
            type: String,
            required: true
        },
        user_type: {
            type: String,
            default: 'SHAREHOLDER'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.__v;
            }
        }
    }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtual
 */

/**
 * Methods
 */
shareholderSchema.method({});

/**
 * Statics
 */

/**
 * @typedef User
 */
module.exports = mongoose.model('shareholder', shareholderSchema);
