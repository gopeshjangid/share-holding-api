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
        tickets: {
            type: Object,
            required: true
        },
        total: {
            type: Number,
            required: true
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
module.exports = mongoose.model('inventory', BookingSchema);
