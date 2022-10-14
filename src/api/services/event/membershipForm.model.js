const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

/**
 * Membership Schema
 */
const MembershipFormSchema = new mongoose.Schema(
    {
        clubId: {
            type: Object,
            required: false,
            unique: true
        },
        formFields: {
            type: Array,
            required: true
        },
        userType: {
            type: String,
            default: 'club'
        },
        membershipUrl: {
            type: String,
            required: true
        },
        isPaid: {
            type: Boolean,
            required: true
        },
        membershipFee: {
            type: Number,
            required: () => this.isPaid
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: Number,
            required: true,
            default: 1
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                /* eslint-disable no-param-reassign */
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
 * - virtuals
 */

/**
 * Methods
 */
MembershipFormSchema.method({});

/**
 * Statics
 */
MembershipFormSchema.statics = {
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
module.exports = mongoose.model('membershipforms', MembershipFormSchema);
