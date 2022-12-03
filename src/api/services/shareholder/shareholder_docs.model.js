const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

/**
 * Company Timeline Schema
 */
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const shareholderDocsSchema = new mongoose.Schema(
    {
        shareholderId: {
            type: ObjectId,
            required: true
        },
        docUrl: {
            type: String,
            required: true
        },
        docType: {
            type: String,
            default: null
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            default: 'PENDING'
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
shareholderDocsSchema.method({});

/**
 * Statics
 */

/**
 * @typedef User
 */
module.exports = mongoose.model('shareholderDoc', shareholderDocsSchema);
