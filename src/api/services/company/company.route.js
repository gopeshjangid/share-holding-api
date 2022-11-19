const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const CompanyController = require('./company.controller');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();

const router = express.Router(); // eslint-disable-line new-cap
router
    .route('/companyLogin')
    /** POST /api/users/adminLogin -  */
    .post(CompanyController.companyLogin);

router.route('/companyRegistration').post(CompanyController.registration);

router.route('/downloadProcessedDocument').get(CompanyController.getDocument);

router
    .route('/')
    /** GET /api/users - Get list of users */
    .get(jwtToken.verifyToken, jwtToken.isAdmin, CompanyController.list);

router
    .route('/getUserDetails')
    /** GET /api/users - Get list of users */
    .get(jwtToken.verifyToken, CompanyController.get);

router
    .route('/updateUser')
    /** GET /api/users - Get list of users */
    .put(jwtToken.verifyToken, CompanyController.update);

router
    .route('/:userId')
    /** GET /api/users/:userId - Get user */
    .get(jwtToken.verifyToken, CompanyController.get)

    /** PUT /api/users/:userId - Update user */
    .put(validate.validate(paramValidation.updateUser), CompanyController.update)

    /** DELETE /api/users/:userId - Delete user */
    .delete(CompanyController.remove);

// router
// 	.route("/sendEmail")
// 	/** GET /api/users - Send Email */
// 	.patch(CompanyController.sendEmail);

/** Load user when API with userId route parameter is hit */
router.param('userId', CompanyController.load);

// /api/users/verifyOtp
module.exports = router;
