const express = require('express');
const { validate } = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const productCtrl = require('./product.controller');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();

function checkImageArray(req, res, next) {
    return next();
}
const router = express.Router(); // eslint-disable-line new-cap

router
    .route('/upsertProduct')
    /** GET /api/product - Get list of products */
    .get(productCtrl.list)

    /** POST /api/product - Create new product */
    .post(validate(paramValidation.upsertProduct), jwtToken.isAdmin, productCtrl.create);

router
    .route('/uploadProductImages')
    /** GET /api/product - Get list of products */
    .get(productCtrl.list)
    /** POST /api/product - Create new product */
    .post(validate(paramValidation.uploadProductImages), checkImageArray, jwtToken.isAdmin, productCtrl.uploadImages);

router
    .route('/list')
    /** GET /api/product - Get list of products */
    .get(productCtrl.list);

router
    .route('/getProductDetails')
    /** GET /api/product - Get product details */
    .get(productCtrl.get);

router
    .route('/:productId')
    /** GET /api/users/:userId - Get user */
    .get(jwtToken.verifyToken, productCtrl.get)

    /** PUT /api/users/:userId - Update user */
    .put(validate(paramValidation.updateUser), productCtrl.update)

    /** DELETE /api/users/:userId - Delete user */
    .delete(productCtrl.remove);

/** Load user when API with userId route parameter is hit */
router.param('productId', productCtrl.load);

module.exports = router;
