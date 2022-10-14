const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { ObjectId } = require('mongoose');
const APIError = require('../../../helpers/APIError');

/**
 * Event Schema
 */
const EventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        userId: {
            type: Object,
            required: true
        },
        venue: {
            type: Object,
            required: true
        },
        status: {
            type: Number,
            required: true,
            default: 1
        },
        eventImages: {
            type: Array,
            required: false
        },
        eventStatus: {
            type: String,
            default: 'PENDING'
        },
        eventUrl: {
            type: String
        },
        ticketDetails: {
            type: Object,
            required: true
        },
        // ticketType: {
        // 	type: Array,
        // 	required: true,
        // },
        eventDescription: {
            type: String,
            required: true
        },
        noOfTickets: {
            type: Number,
            required: true
        },
        maxTicketsPerUser: {
            type: Number,
            required: true
        },
        ticketValue: {
            type: Number,
            required: true
        },
        eventStartDate: {
            type: String
            // required: true,
        },
        eventStartTime: {
            type: String
            // required: true,
        },
        eventStartDateTime: {
            type: Date
        },
        eventEndDate: {
            type: String
            // required: true,
        },
        eventEndTime: {
            type: String
            // required: true,
        },
        eventEndDateTime: {
            type: Date
        },
        liveChatSupport: {
            type: Boolean,
            required: true
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
EventSchema.method({});

/**
 * Statics
 */
EventSchema.statics = {
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
                const err = new APIError('No such event exists!', httpStatus.NOT_FOUND);
                return Promise.reject(err);
            });
    },

    /**
     * List Events in descending order of 'createdAt' timestamp.
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
 * @typedef Event
 */
module.exports = mongoose.model('Event', EventSchema);
