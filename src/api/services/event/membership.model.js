const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

const validateEmail = (email) => {
    // eslint-disable-next-line no-useless-escape
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

/**
 * Membership Schema
 */
const MembershipSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: [true, 'email already exists in database!'],
            required: 'Email address is required',
            validate: [validateEmail, 'Please fill a valid email address'],
            // eslint-disable-next-line no-useless-escape
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        mobile: {
            type: String,
            required: true
        },
        clubId: {
            type: String,
            required: false
        },
        isPaid: {
            type: Boolean,
            required: true
        },
        membershipFee: {
            type: Number,
            required: () => this.isPaid
        },
        membershipUrl: {
            type: String,
            required: true
        },
        paymentId: {
            type: String,
            required: false
        },
        userId: {
            type: String,
            required: false
        },
        formFields: {
            type: Object,
            required: false
        },
        bookingDate: {
            type: Date,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: Number
        },
        paymentStatus: {
            type: String,
            default: 'unpaid'
        },
        userType: {
            type: String,
            default: 'user'
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                /* eslint-disable no-param-reassign */
                delete ret.password;
                delete ret.__v;
            }
        },
        strict: false
    }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
MembershipSchema.method({});

/**
 * Statics
 */
MembershipSchema.statics = {
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
 * @typedef Membership
 */
module.exports = mongoose.model('Membership', MembershipSchema);
