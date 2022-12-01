const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

/**
 * Company Timeline Schema
 */
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const shareholderCompanyAssociationSchema = new mongoose.Schema(
    {
        shareholderId: {
            type: ObjectId,
            required: true
        },
        companyId: {
            type: ObjectId,
            required: true
        },
        certificates: {
            frontSide: {
                type: String,
                default: null
            },
            backSide: {
                type: String,
                default: null
            }
        },
        companyName: {
            type: String,
            default: null
        },
        isin: {
            type: String,
            default: null
        },
        securitiesType: {
            type: String,
            default: null
        },
        folio: {
            type: Number,
            default: null
        },
        noOfCertificates: {
            type: Number,
            default: null
        },
        noOfCertificatesWords: {
            type: String,
            default: null
        },
        certificateNumber: {
            type: Number,
            default: null
        },
        distinctiveNoForm: {
            type: Number,
            default: null
        },
        distinctiveNoTo: {
            type: Number,
            default: null
        },
        timeline: {
            dematerializationInitiated: {
                type: Date,
                default: null
            },
            dematerializationAccept: {
                type: Date,
                default: null
            },
            dematerializationReject: {
                type: Date,
                default: null
            }
        },
        request_status: {
            type: String,
            default: 'PENDING'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
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
shareholderCompanyAssociationSchema.method({});

/**
 * Statics
 */

/**
 * @typedef User
 */
module.exports = mongoose.model('shareholderCompanyAssociation', shareholderCompanyAssociationSchema);
