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
const UserSchema = new mongoose.Schema(
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
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        studentId: {
            type: String,
            required: false
        },
        imageData: {
            type: String,
            required: false
        },
        gender: {
            type: String,
            required: false
        },
        faculty: {
            type: String,
            required: false
        },
        year: {
            type: String,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: Number
        },
        accessToken: {
            type: String
        },
        userType: {
            type: String,
            default: 'student'
        },
        profilePic: {
            type: String,
            default: ''
        },
        facebook: {
            type: String,
            default: ''
        },
        instagram: {
            type: String,
            default: ''
        },
        linkedin: {
            type: String,
            default: ''
        },
        snapchat: {
            type: String,
            default: ''
        },
        discord: {
            type: String,
            default: ''
        },
        userinfo: {
            type: String,
            default: ''
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
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({});

/**
 * Statics
 */
UserSchema.statics = {
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
module.exports = mongoose.model('student', UserSchema);
