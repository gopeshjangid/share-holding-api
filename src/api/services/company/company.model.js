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
const CompanySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: 'Email address is required',
            validate: [validateEmail, 'Please fill a valid email address'],
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        cin: {
            type: String,
            unique: [true, 'cin already exists in database!'],
            required: true
        },
        isin: {
            type: String,
            required: false,
            default: null
        },
        gsttin: {
            type: String,
            default: false
        },
        correspondence_address: {
            type: String,
            required: false
        },
        registered_address: {
            type: String,
            required: true
        },
        contact_number: {
            type: String,
            required: true
        },
        website: {
            type: String,
            required: false
        },
        pan: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        directors: {
            type: Array,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        token: {
            type: String
        },
        place_of_application: {
            type: String,
            required: true
        },
        date_of_application: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: 'new'
        },
        process_status: {
            type: String,
            default: 'STARTED'
        },
        company_type: {
            type: String,
            required: true
        },
        gst: {
            type: Boolean,
            default: false
        },
        user_type: {
            type: String,
            default: 'COMPANY'
        },
        payment_status: {
            type: String,
            default: null
        },
        timeline: {
            companyRegistration: {
                type: Date,
                default: null
            },
            documentUploaded: {
                type: Date,
                default: null
            },
            documentSigned: {
                type: Date,
                default: null
            },
            paymentStatus: {
                type: Date,
                default: null
            },
            documentVerified: {
                type: Date,
                default: null
            },
            isinGenerated: {
                type: Date,
                default: null
            },
            addShareholderInfo: {
                type: Date,
                default: null
            }
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.__v;
            }
        },
        versionKey: false,
        strict: false
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
CompanySchema.method({});

/**
 * Statics
 */
CompanySchema.statics = {
    /**
     * Get user
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    get(id) {
        return this.findById(id)
            .exec()
            .then((user) => {
                if (user) {
                    return user;
                }
                const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
                return Promise.reject(err);
            });
    },

    /**
     * List users in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<User[]>}
     */
    list({ skip = 0, limit = 50 } = {}) {
        return this.find()
            .sort({ createdAt: -1 })
            .skip(+skip)
            .limit(+limit)
            .exec();
    }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('company', CompanySchema);
