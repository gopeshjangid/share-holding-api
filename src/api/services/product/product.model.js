const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../../../helpers/APIError');

/**
 * Product Schema
 */
const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        status: {
            type: Number,
            required: true,
            default: 0
        },
        images: {
            type: Array,
            required: false
        },
        basePrice: {
            type: Number,
            required: true
        },
        rangePrice: {
            type: Array,
            required: true
        },
        productDescription: {
            type: String,
            required: true
        },
        options: {
            type: Array,
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
ProductSchema.method({});

/**
 * Statics
 */
ProductSchema.statics = {
    /**
     * Get pruduct
     * @param {ObjectId} id - The objectId of product.
     * @returns {Promise<Product, APIError>}
     */
    get(id) {
        return this.findById(id)
            .exec()
            .then((product) => {
                if (product) {
                    return product;
                }
                const err = new APIError('No such product exists!', httpStatus.NOT_FOUND);
                return Promise.reject(err);
            });
    },

    /**
     * List products in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of products to be skipped.
     * @param {number} limit - Limit number of products to be returned.
     * @returns {Promise<Product[]>}
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
 * @typedef Product
 */
module.exports = mongoose.model('Product', ProductSchema);
