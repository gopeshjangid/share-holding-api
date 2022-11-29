const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const ShareholderController = require('./shareholder.controller');
const router = express.Router(); // eslint-disable-line new-cap
router
    .route('/login')
    /** POST /api/users/adminLogin -  */
    .post(ShareholderController.shareholderLogin);
router.route('/registration').post(ShareholderController.registration);
router.route('/uploadShareholderDoc').post(ShareholderController.uploadShareholderDocuments);
module.exports = router;
