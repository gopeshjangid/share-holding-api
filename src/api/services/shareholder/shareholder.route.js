const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const ShareholderController = require('./shareholder.controller');
const router = express.Router(); // eslint-disable-line new-cap
router
    .route('/login')
    /** POST /api/shareholder/login -  */
    .post(ShareholderController.shareholderLogin);
router
    .route('/otpverify')
    /** POST /api/shareholder/adminLogin -  */
    .post(ShareholderController.otpVerify);
router.route('/registration').post(ShareholderController.registration);
router.route('/uploadShareholderDoc').post(ShareholderController.uploadShareholderDocuments);
router
    .route('/companyAssociate')
    /** POST /api/shareholder/companyAssociate -  */
    .post(ShareholderController.companyAssociate);

router.route('/getCompanyShareholders').get(ShareholderController.getCompanyShareholders);

module.exports = router;
