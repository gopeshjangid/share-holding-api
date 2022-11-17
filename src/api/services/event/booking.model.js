const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');
const { ObjectId } = require('mongoose');

/**
 * Booking Schema
 */
const BookingSchema = new mongoose.Schema(
    {
        eventId: {
            type: ObjectId,
            required: true
        },
        userId: {
            type: ObjectId,
            required: true
        },
        name: {
            type: String
        },
        email: {
            type: String
        },
        ticketDetail: {
            type: Array,
            required: true
        },
        bookingStatus: {
            type: String,
            default: 'PENDING'
        },
        bookingDate: {
            type: Date
        },
        secureCode: {
            type: String
        },
        paymentId: {
            type: String,
            default: null
        },
        paymentStatus: {
            type: String,
            default: 'PENDING'
        },
        stripeCustomerId: {
            type: String,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        bookingAmount: {
            type: Number,
            default: 0
        },
        advanceBookingAmount: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        modifiedAt: {
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
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
BookingSchema.method({});

/**
 * Statics
 */
BookingSchema.statics = {
    /**
     * Get pruduct
     * @param {ObjectId} id - The objectId of Event.
     * @returns {Promise<Event, APIError>}
     */
    get(id) {
        return this.findById(id)
            .exec()
            .then((event) => {
                if (event) {
                    return event;
                }
                const err = new APIError('No such event booking exists!', httpStatus.NOT_FOUND);
                return Promise.reject(err);
            });
    },

    /**
     * List Events Booking in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of Events to be skipped.
     * @param {number} limit - Limit number of Events to be returned.
     * @returns {Promise<Event[]>}
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
 * @typedef Booking
 */
module.exports = mongoose.model('Booking', BookingSchema);
