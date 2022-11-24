const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

/**
 * Company Timeline Schema
 */
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const CompanyTimelineSchema = new mongoose.Schema(
    {
        companyId: {
            type: ObjectId,
            required: true
        },
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
CompanyTimelineSchema.method({});

/**
 * Statics
 */

/**
 * @typedef User
 */
module.exports = mongoose.model('companyTimeline', CompanyTimelineSchema);
